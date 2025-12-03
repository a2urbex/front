<template>
  <div ref="container" class="three-container"></div>
</template>

<script setup>
/**
 * 🌃 ThreeBackground - Scène 3D Pripyat/Chernobyl
 * 
 * Implémentation d'un monde infini optimisé avec recyclage d'objets :
 * - La caméra avance continuellement dans la scène
 * - Les objets qui passent derrière la caméra sont RECYCLÉS (repositionnés devant)
 * - Aucun objet n'est supprimé/recréé = pas de garbage collection = performance optimale
 * - Consommation mémoire constante quelle que soit la durée d'utilisation
 * 
 * Configuration centralisée via l'objet CONFIG pour un ajustement facile.
 */

import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';

const emit = defineEmits(['ready']);

// Textures (Optionnel, le code gère le fallback couleur si les images manquent)
import buildingTextureUrl from '@/assets/textures/building.png';
import sovietBuildingUrl from '@/assets/textures/soviet_building.png';
import sovietBuilding1Url from '@/assets/textures/soviet_building_1.png';
import sovietBuilding2Url from '@/assets/textures/soviet_building_2.png';
import roadTextureUrl from '@/assets/textures/road.jpg';
import metalTextureUrl from '@/assets/textures/metal.png';
import rustedMetalTextureUrl from '@/assets/textures/rusted_metal.jpg';

import { generateRoadTexture, generateSidewalkTexture, generateMossTexture } from '@/utilities/textureGenerator';


const container = ref(null);
let scene, camera, renderer;
let animationId;
let mouseX = 0;
let mouseY = 0;

// ========================================
// 🎛️ CONFIGURATION DE LA SCÈNE
// ========================================
const CONFIG = {
  // Lampadaires
  LAMP_COUNT: 6,                  // Nombre de lampadaires par côté (6 = 12 au total)
  LAMP_MIN_DISTANCE: 15,          // Distance minimale entre deux lampadaires
  
  // Voitures abandonnées
  CAR_COUNT: 5,                   // Nombre de carcasses de voitures
  
  // Végétation
  VEGETATION_DENSITY: {
    TREES: 50,                   // Nombre d'arbres morts (total pour les 2 côtés)
    ROAD_WEEDS: 50,              // Nombre d'herbes/buissons sur route et trottoirs
    DEBRIS: 50                   // Nombre de débris sur la route
  },
  
  // Bâtiments
  // On ne définit plus un nombre fixe total, mais une densité par "voie" (lane)
  // Le système va générer suffisamment de bâtiments pour remplir les voies
  
  // Grande roue de Pripyat
  FERRIS_WHEEL: {
    X: -25,                       // Position X (-20 = gauche, 20 = droite)
    Y: 14,                        // Hauteur
    Z: -50,                       // Distance par rapport à la caméra au départ (10 = très proche/visible au début, -150 = loin)
    ROTATION_Y: 0.5,              // Rotation sur l'axe Y
    ROTATION_Z: 0.1               // Inclinaison
  },
  
  // Éclairage
  LIGHTING: {
    // Pourcentages des états des lampadaires (total doit faire ~100)
    LAMP_OFF_PERCENT: 20,         // 20% de lampadaires éteints
    LAMP_ON_PERCENT: 30,          // 30% de lampadaires allumés en permanence
    LAMP_FLICKER_PERCENT: 50,     // 50% de lampadaires qui clignotent
    
    // Luminosité globale de la scène
    AMBIENT_INTENSITY: 5,       // Luminosité ambiante augmentée
    MOON_INTENSITY: 8.0,          // Intensité de la lumière lunaire augmentée
    LAMP_INTENSITY: 50            // Intensité des lampadaires individuels augmentée
  },
  
  // Monde infini (Système de recyclage des objets)
  INFINITE_WORLD: {
    SPAWN_DISTANCE: 80,          // Distance devant la caméra pour générer/recycler les objets
    DESPAWN_DISTANCE: 5,         // Distance DERRIÈRE la caméra pour recycler les objets (positif car Z > camera.Z)
    CAMERA_SPEED: 0.05,           // Vitesse de déplacement de la caméra
    CAMERA_BOOST_SPEED: 0.5       // Vitesse lors du boost
  }
};

// Tableaux pour la gestion dynamique des objets
const flickrLights = []; // Lampadaires qui clignotent
const particleSystemRefs = []; // Référence aux systèmes de particules (pour les animer)
const buildings = []; // Référence aux bâtiments
const lamps = []; // Référence aux lampadaires
const deadTrees = []; // Référence aux arbres morts
const roadWeeds = []; // Référence aux herbes sur la route
const carcasseCars = []; // Référence aux carcasses de voitures
let wheelGroup; // Référence à la grande roue

// --- GESTION DES VOIES DE BÂTIMENTS (LANES) ---
// Pour créer de la profondeur (1er plan, 2e plan, 3e plan)
const NUM_LANES = 3; 
const LANE_OFFSET_X = 30; // Espacement X entre les plans
const BASE_X_LEFT = -25;
const BASE_X_RIGHT = 25;

// Suivi de la position Z pour chaque voie de chaque côté
// Structure: { left: [z1, z2, z3], right: [z1, z2, z3] }
const laneZTrackers = {
    left: new Array(NUM_LANES).fill(0),
    right: new Array(NUM_LANES).fill(0)
};


// --- GESTION DU BOOST CAMÉRA (Top Level) ---
let isBoosting = false;
let isWarping = false;
let currentSpeed = CONFIG.INFINITE_WORLD.CAMERA_SPEED;

const setBoost = (active) => {
  isBoosting = active;
};

const warp = () => {
  isWarping = true;
  return new Promise(resolve => setTimeout(resolve, 1500));
};

const fadeOut = () => {
  if (container.value) {
    container.value.classList.add('fade-out');
  }
  return new Promise(resolve => setTimeout(resolve, 800));
};

// Exposer la fonction pour le composant parent
defineExpose({ setBoost, warp, fadeOut });

const clearZoneAroundWheel = () => {
    if (!wheelGroup) return;
    const clearRadius = 50; 
    
    const checkAndMove = (obj) => {
        const dx = obj.position.x - wheelGroup.position.x;
        const dz = obj.position.z - wheelGroup.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        
        if(dist < clearRadius) {
            obj.position.z -= 80; 
        }
    };

    deadTrees.forEach(checkAndMove);
    lamps.forEach(checkAndMove);
};


const init = () => {
  // --- 1. SCENE & ATMOSPHERE ---
  scene = new THREE.Scene();
  const fogColor = 0x1a1a1a; 
  scene.background = new THREE.Color(fogColor);
  scene.fog = new THREE.FogExp2(fogColor, 0.02); 

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  // Initialiser les positions de départ des bâtiments pour toutes les voies
  const startZ = camera.position.z + 20;
  laneZTrackers.left.fill(startZ);
  laneZTrackers.right.fill(startZ);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.value.appendChild(renderer.domElement);

  // Textures
  const loadingManager = new THREE.LoadingManager();
  loadingManager.onLoad = () => {
      emit('ready');
  };

  const textureLoader = new THREE.TextureLoader(loadingManager);
  const loadTex = (url) => textureLoader.load(url, (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }, undefined, () => {});
  
  const buildingTex = loadTex(buildingTextureUrl);
  const sovietBuildingTex = loadTex(sovietBuildingUrl);
  const sovietBuilding1Tex = loadTex(sovietBuilding1Url);
  const sovietBuilding2Tex = loadTex(sovietBuilding2Url);
  
  const buildingTextures = [
    buildingTex, 
    sovietBuildingTex,
    sovietBuilding1Tex, 
    sovietBuilding2Tex
  ];

  // Texture de route
  const roadTex = loadTex(roadTextureUrl);
  if(roadTex) roadTex.repeat.set(1, 40);
  
  const metalTex = loadTex(metalTextureUrl);
  const rustedMetalTex = loadTex(rustedMetalTextureUrl);
  
  // Texture de trottoir procédurale
  const sidewalkTex = generateSidewalkTexture();
  
  // Texture de mousse
  const mossTex = generateMossTexture();


  // Lumières
  const ambientLight = new THREE.AmbientLight(0x222222, CONFIG.LIGHTING.AMBIENT_INTENSITY);
  scene.add(ambientLight);

  const moonLight = new THREE.DirectionalLight(0x667788, CONFIG.LIGHTING.MOON_INTENSITY);
  moonLight.position.set(-20, 50, -20);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 2048;
  moonLight.shadow.mapSize.height = 2048;
  moonLight.shadow.camera.near = 0.5;
  moonLight.shadow.camera.far = 200;
  moonLight.shadow.camera.left = -50;
  moonLight.shadow.camera.right = 50;
  moonLight.shadow.camera.top = 50;
  moonLight.shadow.camera.bottom = -50;
  scene.add(moonLight);

  // --- 2. DEFINITION DES MATERIAUX ---
  const deadWoodMat = new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 1 });
  const deadLeavesMat = new THREE.MeshStandardMaterial({ color: 0x2f3a25, roughness: 1, side: THREE.DoubleSide });
  const rustedMat = new THREE.MeshStandardMaterial({ map: rustedMetalTex, color: 0x663300, roughness: 0.9, metalness: 0.5 });
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 }); 

  // --- 3. FONCTIONS UTILITAIRES POUR CREER DES OBJETS ---

  // Petite herbe/buisson
  const createSmallWeed = (x, z, color = 0x2f3a25) => {
    const weedGroup = new THREE.Group();
    const bladeMat = new THREE.MeshStandardMaterial({ color: color, side: THREE.DoubleSide });

    for(let k=0; k<Math.random()*5 + 3; k++) {
        const h = 0.2 + Math.random() * 0.8;
        const w = 0.05 + Math.random() * 0.1;
        const bladeGeo = new THREE.ConeGeometry(w, h, 3);
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.set((Math.random()-0.5)*0.5, h/2, (Math.random()-0.5)*0.5);
        blade.rotation.z = (Math.random()-0.5) * 1; 
        blade.rotation.y = Math.random() * Math.PI;
        weedGroup.add(blade);
    }
    weedGroup.position.set(x, 0, z);
    scene.add(weedGroup);
    return weedGroup; 
  };

  // Buisson sec
  const createBush = (x, z) => {
    const group = new THREE.Group();
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x2f3a25, roughness: 1, side: THREE.DoubleSide });
    
    const numLeaves = 5 + Math.random() * 5;
    for(let i=0; i<numLeaves; i++) {
        const s = 0.3 + Math.random() * 0.4;
        const geo = new THREE.DodecahedronGeometry(s);
        const mesh = new THREE.Mesh(geo, bushMat);
        mesh.position.set((Math.random()-0.5)*0.5, s/2 + Math.random()*0.3, (Math.random()-0.5)*0.5);
        mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        mesh.castShadow = true;
        group.add(mesh);
    }
    
    group.position.set(x, 0, z);
    const scale = 0.8 + Math.random() * 0.5;
    group.scale.set(scale, scale, scale);
    scene.add(group);
    return group;
  };

  // Tache de mousse au sol
  const createMossPatch = (x, z) => {
    const size = 2 + Math.random() * 3;
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.MeshStandardMaterial({ 
        map: mossTex, 
        transparent: true, 
        opacity: 0.8,
        roughness: 1,
        color: 0x4a5d23,
        depthWrite: false // Pour éviter le z-fighting avec le sol
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.02, z); // Légèrement au-dessus du sol
    mesh.rotation.z = Math.random() * Math.PI;
    scene.add(mesh);
    return mesh;
  };

  // Arbre avec feuilles (Style amélioré)
  const createDeadTree = (x, z) => {
    const group = new THREE.Group();
    
    // Tronc plus irrégulier
    const trunkH = 3 + Math.random() * 4;
    const trunkRadius = 0.15 + Math.random() * 0.1;
    
    // Construction du tronc avec plusieurs segments pour courbure
    const numSegments = 4;
    let currentY = 0;
    let currentX = 0;
    let currentZ = 0;
    let currentRadius = trunkRadius;
    
    for(let i=0; i<numSegments; i++) {
        const segmentH = trunkH / numSegments;
        const nextRadius = currentRadius * 0.8;
        const segmentGeo = new THREE.CylinderGeometry(nextRadius, currentRadius, segmentH, 6);
        const segment = new THREE.Mesh(segmentGeo, deadWoodMat);
        
        // Inclinaison aléatoire
        const tiltX = (Math.random() - 0.5) * 0.3;
        const tiltZ = (Math.random() - 0.5) * 0.3;
        
        segment.position.set(currentX, currentY + segmentH/2, currentZ);
        segment.rotation.x = tiltX;
        segment.rotation.z = tiltZ;
        segment.castShadow = true;
        group.add(segment);
        
        currentY += segmentH;
        currentX += Math.sin(tiltZ) * segmentH; // Approx
        currentZ -= Math.sin(tiltX) * segmentH; // Approx
        currentRadius = nextRadius;
        
        // Branches principales partant des segments
        if (i > 0) {
            const numBranches = 1 + Math.floor(Math.random() * 2);
            for(let b=0; b<numBranches; b++) {
                const branchLen = 1 + Math.random() * 2;
                const branchR = currentRadius * 0.6;
                const branch = new THREE.Mesh(new THREE.CylinderGeometry(branchR * 0.5, branchR, branchLen, 4), deadWoodMat);
                
                const angleY = Math.random() * Math.PI * 2;
                const angleX = Math.PI / 3 + (Math.random() - 0.5) * 0.5;
                
                branch.position.set(currentX, currentY, currentZ);
                branch.rotation.set(angleX, angleY, 0);
                // Ajustement position pour partir du tronc
                branch.translateY(branchLen/2);
                
                branch.castShadow = true;
                group.add(branch);

                // Feuilles sur les branches
                if (Math.random() > 0.2) {
                    const leafClusterSize = 0.5 + Math.random() * 0.5;
                    const leafGeo = new THREE.DodecahedronGeometry(leafClusterSize);
                    const leafMesh = new THREE.Mesh(leafGeo, deadLeavesMat);
                    leafMesh.position.set(0, branchLen/2, 0); // Au bout de la branche
                    leafMesh.scale.set(1, 0.5, 1);
                    branch.add(leafMesh);
                }
            }
        }
    }

    // Amas de feuilles au sommet
    const topLeavesSize = 1 + Math.random() * 1;
    const topLeaves = new THREE.Mesh(new THREE.DodecahedronGeometry(topLeavesSize), deadLeavesMat);
    topLeaves.position.set(currentX, currentY, currentZ);
    topLeaves.scale.set(1 + Math.random(), 0.8 + Math.random(), 1 + Math.random());
    group.add(topLeaves);

    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI;
    const s = 0.8 + Math.random() * 0.5;
    group.scale.set(s, s, s);
    scene.add(group);
    return group; 
  };

  // Création d'un bâtiment
  const createBuilding = (x, z, side, laneIndex) => {
    // Dimensions augmentées
    const width = 15 + Math.random() * 10; 
    const height = 30 + Math.random() * 30; 
    const depth = 15 + Math.random() * 10; 

    const group = new THREE.Group();
    const geo = new THREE.BoxGeometry(width, height, depth);
    
    const tex = buildingTextures[Math.floor(Math.random() * buildingTextures.length)];
    const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0x666666, roughness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    
    mesh.position.y = height / 2; 
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Balcons et extensions - TAILLE RÉDUITE
    const numAddons = Math.floor(Math.random() * 6) + 2;
    for(let i=0; i<numAddons; i++) {
        // Réduction significative des dimensions des balcons
        const addonW = width * (0.05 + Math.random() * 0.15); // Était 0.1 + 0.3
        const addonH = height * 0.02 + Math.random() * 0.5;   // Était 0.05 + 1
        const addonD = depth + 0.2 + Math.random() * 0.5;     // Était depth + 0.5 + 1
        
        const addonGeo = new THREE.BoxGeometry(addonW, addonH, addonD);
        const addon = new THREE.Mesh(addonGeo, concreteMat);
        addon.position.y = Math.random() * (height - addonH) + addonH/2;
        addon.position.x = (Math.random() > 0.5 ? 1 : -1) * (width/2 + addonW/2 - 0.05);
        addon.position.z = (Math.random() - 0.5) * (depth - 2);
        addon.castShadow = true;
        group.add(addon);
    }

    group.position.set(x, 0, z);
    // On stocke laneIndex pour savoir à quelle voie appartient ce bâtiment lors du recyclage
    group.userData = { width, height, depth, x, z, side, laneIndex }; 
    scene.add(group);
    buildings.push(group);

    // Végétation au pied
    for(let i=0; i<Math.random()*5 + 3; i++) {
        const vx = x + (Math.random()-0.5) * (width + 2);
        const vz = z + (Math.random()-0.5) * (depth + 2);
        createSmallWeed(vx, vz, 0x3a4a2a); 
    }

    // Fenêtre
    if (Math.random() > 0.95) {
        const lightWin = new THREE.PointLight(0xffaa00, 1.5, 10);
        lightWin.position.set(x + (Math.random()-0.5)*(width-1), Math.random() * (height-2) + 1, z + (depth/2 + 0.1) * (Math.random()>0.5?1:-1));
        scene.add(lightWin);
    }
    return group;
  };

  // Barrière de chantier / sécurité
  const createBarrier = (x, z, rotationY = 0) => {
      const group = new THREE.Group();
      const barrierMat = new THREE.MeshStandardMaterial({ color: 0xcc3300, roughness: 0.7, metalness: 0.2 });
      const barrierLegMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });

      const board = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 0.1), barrierMat);
      board.position.y = 0.8;
      group.add(board);
      
      const board2 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 0.1), barrierMat);
      board2.position.y = 0.4;
      group.add(board2);

      const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2), barrierLegMat);
      leg1.position.set(-1, 0.6, 0);
      group.add(leg1);
      
      const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2), barrierLegMat);
      leg2.position.set(1, 0.6, 0);
      group.add(leg2);

      const base1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.6), barrierLegMat);
      base1.position.set(-1, 0.05, 0);
      group.add(base1);
      
      const base2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.6), barrierLegMat);
      base2.position.set(1, 0.05, 0);
      group.add(base2);

      group.position.set(x, 0, z);
      group.rotation.y = rotationY;
      scene.add(group);
      return group;
  };

  // Création d'un lampadaire détaillé
  const createLamp = (x, z, rotationY = 0) => {
    const group = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.5 });
    
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 6), poleMat);
    pole.position.y = 3;
    pole.castShadow = true;
    group.add(pole);

    const armGeo = new THREE.BoxGeometry(1.8, 0.2, 0.2);
    const arm = new THREE.Mesh(armGeo, poleMat);
    const armXOffset = x > 0 ? -0.9 : 0.9;
    arm.position.set(armXOffset, 5.9, 0);
    arm.castShadow = true;
    group.add(arm);

    const headSupportGeo = new THREE.BoxGeometry(0.2, 0.3, 0.2);
    const headSupport = new THREE.Mesh(headSupportGeo, poleMat);
    const supportXOffset = x > 0 ? -1.7 : 1.7; 
    headSupport.position.set(supportXOffset, 5.75, 0);
    headSupport.castShadow = true;
    group.add(headSupport);

    const headGeo = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.5), poleMat);
    const headXOffset = x > 0 ? -1.7 : 1.7;
    headGeo.position.set(headXOffset, 5.6, 0);
    headGeo.rotation.x = -Math.PI / 16; 
    headGeo.castShadow = true;
    group.add(headGeo);

    const bulbGeo = new THREE.PlaneGeometry(0.4, 0.4);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide }); 
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    const bulbXOffset = x > 0 ? -1.69 : 1.69;
    bulb.position.set(bulbXOffset, 5.6, 0);
    bulb.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
    bulb.rotation.x = -Math.PI / 16;
    group.add(bulb);
    
    const rand = Math.random() * 100; 
    let light = null;
    let lightIntensity = CONFIG.LIGHTING.LAMP_INTENSITY;

    const offThreshold = CONFIG.LIGHTING.LAMP_OFF_PERCENT;
    const onThreshold = offThreshold + CONFIG.LIGHTING.LAMP_ON_PERCENT;

    if (rand < offThreshold) { 
    } else if (rand < onThreshold) { 
        bulbMat.color.setHex(0xffaa55);
        light = new THREE.SpotLight(0xffaa55, lightIntensity, 25, 0.7, 0.5, 1);
        light.position.set(bulbXOffset, 5.6, 0);
        
        const targetX = x > 0 ? -1.7 : 1.7;
        light.target.position.set(targetX, 0, 0);
        
        group.add(light);
        group.add(light.target);
        light.castShadow = true;
    } else { 
        bulbMat.color.setHex(0x444000); 
        light = new THREE.PointLight(0xffaa55, 0, 20); 
        light.position.set(bulbXOffset, 5.6, 0);
        group.add(light);
        flickrLights.push({ light: light, material: bulbMat, baseInt: lightIntensity });
    }

    group.position.set(x, 0, z);
    group.rotation.y = rotationY;
    group.userData = { x, z };
    scene.add(group);
    lamps.push(group);
    return group;
  };

  const createAbandonedCar = (z) => {
    const carGroup = new THREE.Group();
    
    const rustColor = new THREE.Color(0x7c493c); 
    const baseColor = Math.random() > 0.6 ? 0x2e3532 : 0x7c493c; 
    
    const carMat = new THREE.MeshStandardMaterial({ 
        map: metalTex, 
        color: baseColor, 
        roughness: 0.9, 
        metalness: 0.1, 
    });

    const bodyGeo = new THREE.BoxGeometry(1.7, 0.6, 2.5);
    const body = new THREE.Mesh(bodyGeo, carMat);
    body.position.y = 0.5;
    body.scale.set(1 + Math.random()*0.1, 1 - Math.random()*0.3, 1 - Math.random()*0.2); 
    body.rotation.x = (Math.random() - 0.5) * 0.1; 
    body.castShadow = true;
    carGroup.add(body);

    const hoodGeo = new THREE.BoxGeometry(1.7, 0.3, 1.5);
    const hood = new THREE.Mesh(hoodGeo, carMat);
    hood.position.y = 0.25;
    hood.position.z = -2.0;
    hood.scale.set(1, 1 - Math.random()*0.4, 1); 
    hood.castShadow = true;
    carGroup.add(hood);

    const cabinGeo = new THREE.BoxGeometry(1.6, 0.7, 1.5);
    const cabin = new THREE.Mesh(cabinGeo, carMat);
    cabin.position.y = 1.0;
    cabin.position.z = -0.5;
    cabin.scale.set(1, 1 - Math.random()*0.6, 1); 
    cabin.castShadow = true;
    carGroup.add(cabin);
    
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x555555, 
        transmission: 0.1, 
        roughness: 0.8, 
        metalness: 0.1,
        transparent: true
    });
    const windshieldGeo = new THREE.PlaneGeometry(1.5, 0.6);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 1.1, -1.2);
    windshield.rotation.x = -Math.PI / 6; 
    windshield.castShadow = true;
    carGroup.add(windshield);


    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25); 
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
    const wheelPositions = [
        {x: 0.9, z: 1.5, missing: false}, 
        {x: -0.9, z: 1.5, missing: false},
        {x: 0.9, z: -1.8, missing: Math.random() > 0.7}, 
        {x: -0.9, z: -1.8, missing: false}
    ];

    wheelPositions.forEach(pos => {
        if (!pos.missing) {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(pos.x, 0.3, pos.z);
            wheel.rotation.x = Math.PI / 2;
            
            if (Math.random() > 0.5) {
                wheel.scale.y = 1 + Math.random()*0.5; 
                wheel.scale.z = 0.8; 
                wheel.rotation.z = (Math.random() - 0.5) * 0.5;
            }
            carGroup.add(wheel);
        } else {
            const axleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.2);
            const axleMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
            const axle = new THREE.Mesh(axleGeo, axleMat);
            axle.position.set(pos.x, 0.3, pos.z);
            axle.rotation.x = Math.PI / 2;
            carGroup.add(axle);
        }
    });

    const side = Math.random() > 0.5 ? 1 : -1;
    carGroup.position.set(side * (roadWidth/2 + 1 + Math.random() * 2), 0, z);
    
    carGroup.rotation.y = Math.random() * Math.PI * 0.5 + (side === 1 ? -0.4 : 0.4); 
    carGroup.rotation.z = (Math.random() - 0.5) * 0.4; 

    carGroup.userData = { side, z };
    scene.add(carGroup);
    carcasseCars.push(carGroup);
    return carGroup;
  };


  // --- 4. SOL & ENVIRONNEMENT ---
  const roadWidth = 10;
  const roadSegmentLength = 100; 
  const numberOfRoadSegments = 6; 
  const totalRoadLength = roadSegmentLength * numberOfRoadSegments;


  const roadGeo = new THREE.PlaneGeometry(roadWidth, roadSegmentLength);
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, color: 0x222222, roughness: 0.9, metalness: 0.1 });
  const roadSegments = [];
  for(let i=0; i<numberOfRoadSegments; i++) {
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.z = camera.position.z - roadSegmentLength * (numberOfRoadSegments/2) + i * roadSegmentLength;
      road.receiveShadow = true;
      scene.add(road);
      roadSegments.push(road);
  }

  const sidewalkWidth = 4;
  const sidewalkHeight = 0.4;
  const sidewalkGeo = new THREE.BoxGeometry(sidewalkWidth, sidewalkHeight, roadSegmentLength);
  const sidewalkMat = new THREE.MeshStandardMaterial({ map: sidewalkTex, color: 0x444444, roughness: 0.9 });
  
  const leftWalkSegments = [];
  const rightWalkSegments = [];
  for(let i=0; i<numberOfRoadSegments; i++) {
      const leftWalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
      leftWalk.position.set(-roadWidth/2 - sidewalkWidth/2, sidewalkHeight/2, camera.position.z - roadSegmentLength * (numberOfRoadSegments/2) + i * roadSegmentLength);
      leftWalk.receiveShadow = true;
      scene.add(leftWalk);
      leftWalkSegments.push(leftWalk);

      const rightWalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
      rightWalk.position.set(roadWidth/2 + sidewalkWidth/2, sidewalkHeight/2, camera.position.z - roadSegmentLength * (numberOfRoadSegments/2) + i * roadSegmentLength);
      rightWalk.receiveShadow = true;
      scene.add(rightWalk);
      rightWalkSegments.push(rightWalk);
  }

  const groundPlaneGeo = new THREE.BoxGeometry(200, 0.8, roadSegmentLength); // Sol élargi pour couvrir les 3 plans
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 1 });
  const groundPlaneLeftSegments = [];
  const groundPlaneRightSegments = [];
  for(let i=0; i<numberOfRoadSegments; i++) {
      const groundPlaneLeft = new THREE.Mesh(groundPlaneGeo, groundMat);
      groundPlaneLeft.position.set(-100, -0.4, camera.position.z - roadSegmentLength * (numberOfRoadSegments/2) + i * roadSegmentLength);
      groundPlaneLeft.receiveShadow = true;
      scene.add(groundPlaneLeft);
      groundPlaneLeftSegments.push(groundPlaneLeft);

      const groundPlaneRight = groundPlaneLeft.clone();
      groundPlaneRight.position.x = 100;
      scene.add(groundPlaneRight);
      groundPlaneRightSegments.push(groundPlaneRight);
  }


  // --- 5. PEUPLEMENT INITIAL DES OBJETS ---
  const spawnDistance = CONFIG.INFINITE_WORLD.SPAWN_DISTANCE;
  const despawnDistance = CONFIG.INFINITE_WORLD.DESPAWN_DISTANCE;
  const initialFillDistance = spawnDistance + 50;
  
  const isCollidingWithWheel = (z) => {
      const wheelZ = CONFIG.FERRIS_WHEEL.Z;
      const safetyMargin = 40; 
      return (z < wheelZ + safetyMargin && z > wheelZ - safetyMargin);
  };

  // Remplissage des bâtiments pour chaque voie (lane)
  for (let lane = 0; lane < NUM_LANES; lane++) {
      // GAUCHE
      while(laneZTrackers.left[lane] > camera.position.z - initialFillDistance) {
          // Calcul de la position X de base pour cette voie
          // Lane 0: -25, Lane 1: -55, Lane 2: -85
          let baseX = BASE_X_LEFT - (lane * LANE_OFFSET_X);
          let x = baseX - Math.random() * 10; // Variation légère

          // Gestion collision roue UNIQUEMENT pour la voie 0 (la plus proche)
          if (lane === 0 && isCollidingWithWheel(laneZTrackers.left[lane])) {
              // On saute simplement la zone pour la voie 1
              // Les voies 2 et 3 (arrière-plan) continueront d'afficher des bâtiments
              laneZTrackers.left[lane] = CONFIG.FERRIS_WHEEL.Z - 40;
              continue;
          }

          const b = createBuilding(x, laneZTrackers.left[lane], 'left', lane);
          laneZTrackers.left[lane] -= (b.userData.depth + Math.random() * 5); 
      }

      // DROITE
      while(laneZTrackers.right[lane] > camera.position.z - initialFillDistance) {
          // Lane 0: 25, Lane 1: 55, Lane 2: 85
          let baseX = BASE_X_RIGHT + (lane * LANE_OFFSET_X);
          let x = baseX + Math.random() * 10;

          const b = createBuilding(x, laneZTrackers.right[lane], 'right', lane);
          laneZTrackers.right[lane] -= (b.userData.depth + Math.random() * 5);
      }
  }


  // Lampadaires
  const minLampDistance = CONFIG.LAMP_MIN_DISTANCE;
  const lampPositions = []; 
  
  const tryCreateLamp = (x, side) => {
    let attempts = 0;
    const maxAttempts = 50;
    
    while(attempts < maxAttempts) {
      const z = -Math.random() * spawnDistance + camera.position.z;
      
      let tooClose = false;
      for(let pos of lampPositions) {
        const distance = Math.abs(pos.z - z);
        if(pos.side === side && distance < minLampDistance) {
          tooClose = true;
          break;
        }
      }
      
      if(!tooClose) {
        createLamp(x, z);
        lampPositions.push({ z, side });
        return true;
      }
      attempts++;
    }
    return false;
  };
  
  for(let i=0; i<CONFIG.LAMP_COUNT; i++) {
    tryCreateLamp(-roadWidth/2 - 2, 'left');
    tryCreateLamp(roadWidth/2 + 2, 'right');
  }

  // Arbres
  for(let i=0; i<CONFIG.VEGETATION_DENSITY.TREES; i++) {
      const z = -Math.random() * spawnDistance + camera.position.z;
      if(Math.random() > 0.6) deadTrees.push(createDeadTree(-10 - Math.random()*10, z));
      if(Math.random() > 0.6) deadTrees.push(createDeadTree(10 + Math.random()*10, z));
  }

  // Végétation sur route et trottoirs
  for(let i=0; i<CONFIG.VEGETATION_DENSITY.ROAD_WEEDS; i++) {
      const z = -Math.random() * spawnDistance + camera.position.z;
      
      // Herbes (peuvent être sur la route)
      if(Math.random() > 0.3) roadWeeds.push(createSmallWeed((Math.random() - 0.5) * roadWidth * 0.8, z, 0x3a4a2a));
      
      // Buissons aléatoires sur les côtés (JAMAIS sur la route)
      // Route width = 10, donc les côtés sont à < -5 ou > 5
      if(Math.random() > 0.8) {
          // Côté gauche : entre -15 et -6
          const bushX = -roadWidth/2 - 1 - Math.random() * 10;
          roadWeeds.push(createBush(bushX, z));
      }
      if(Math.random() > 0.8) {
          // Côté droit : entre 6 et 15
          const bushX = roadWidth/2 + 1 + Math.random() * 10;
          roadWeeds.push(createBush(bushX, z));
      }

      // Mousse sur la route/trottoirs
      if(Math.random() > 0.7) {
          roadWeeds.push(createMossPatch((Math.random() - 0.5) * (roadWidth + 4), z));
      }

      if(Math.random() > 0.4) {
          roadWeeds.push(createSmallWeed(-roadWidth/2 - (Math.random()) * sidewalkWidth, z));
          roadWeeds.push(createSmallWeed(roadWidth/2 + (Math.random()) * sidewalkWidth, z));
      }
  }

  // Débris route
  const debrisMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
  const smallDebrisGeo = [
      new THREE.BoxGeometry(0.1, 0.1, 0.1),
      new THREE.CylinderGeometry(0.05, 0.05, 0.2),
      new THREE.DodecahedronGeometry(0.08)
  ];
  for(let i=0; i<CONFIG.VEGETATION_DENSITY.DEBRIS; i++) {
      const geo = smallDebrisGeo[Math.floor(Math.random() * smallDebrisGeo.length)];
      const debris = new THREE.Mesh(geo, debrisMat);
      debris.position.set((Math.random()-0.5) * roadWidth * 0.8, 0.05, -Math.random()*spawnDistance + camera.position.z);
      debris.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
      debris.castShadow = true;
      scene.add(debris);
      roadWeeds.push(debris); 
  }

  // Carcasses de voitures
  for(let i=0; i<CONFIG.CAR_COUNT; i++) {
      createAbandonedCar(-Math.random() * spawnDistance + camera.position.z);
  }


  // --- 6. GRANDE ROUE (POSITIONNEMENT INITIAL) ---
  wheelGroup = new THREE.Group();
  wheelGroup.add(new THREE.Mesh(new THREE.TorusGeometry(12, 0.4, 8, 50), rustedMat));
  
  for(let i=0; i<12; i++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 24), rustedMat);
      spoke.rotation.z = (i/12) * Math.PI * 2;
      wheelGroup.add(spoke);
      
      const gondola = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 1.2), rustedMat);
      const angle = (i/12) * Math.PI * 2;
      gondola.position.set(Math.cos(angle)*12, Math.sin(angle)*12, 0);
      gondola.rotation.z = -angle; 
      wheelGroup.add(gondola);
  }
  const support = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.8, 15), rustedMat);
  support.position.set(-6, -8, -2);
  support.rotation.z = -0.4;
  wheelGroup.add(support);
  const support2 = support.clone();
  support2.position.set(6, -8, -2);
  support2.rotation.z = 0.4;
  wheelGroup.add(support2);

  wheelGroup.position.set(CONFIG.FERRIS_WHEEL.X, CONFIG.FERRIS_WHEEL.Y, CONFIG.FERRIS_WHEEL.Z);
  wheelGroup.rotation.y = CONFIG.FERRIS_WHEEL.ROTATION_Y;
  wheelGroup.rotation.z = CONFIG.FERRIS_WHEEL.ROTATION_Z; 
  scene.add(wheelGroup);

  // --- 7. PARTICULES ---
  const createParticleSystem = (numParticles, size, color, opacity, speed, spreadX, spreadY, spreadZ) => {
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(numParticles * 3);
    const pVel = new Float32Array(numParticles); 

    for(let i=0; i<numParticles; i++) {
        pPos[i*3] = (Math.random() - 0.5) * spreadX;
        pPos[i*3+1] = Math.random() * spreadY;
        pPos[i*3+2] = (Math.random() - 0.5) * spreadZ;
        pVel[i] = speed + Math.random() * speed;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
        color: color, size: size, transparent: true, opacity: opacity, blending: THREE.AdditiveBlending
    });
    const system = new THREE.Points(pGeo, pMat);
    scene.add(system);
    particleSystemRefs.push({ system, pVel, numParticles, spreadX, spreadY, spreadZ });
  };

  createParticleSystem(8000, 0.08, 0xaaaaaa, 0.6, 0.02, 80, 40, 80);
  createParticleSystem(4000, 0.05, 0x888888, 0.4, 0.01, 100, 50, 100);

  createParticleSystem(8000, 0.08, 0xaaaaaa, 0.6, 0.02, 80, 40, 80);
  createParticleSystem(4000, 0.05, 0x888888, 0.4, 0.01, 100, 50, 100);

  // --- 8. GESTION DU BOOST CAMÉRA ---
  // (Déplacé au niveau supérieur pour defineExpose)

  // --- 9. ANIMATION LOOP ---
  const animate = () => {
    animationId = requestAnimationFrame(animate);

    // 1. Camera Mouvement
    let targetSpeed = isBoosting ? CONFIG.INFINITE_WORLD.CAMERA_BOOST_SPEED : CONFIG.INFINITE_WORLD.CAMERA_SPEED;
    if (isWarping) targetSpeed = 4.0; // Vitesse extrême pour le warp
    
    currentSpeed += (targetSpeed - currentSpeed) * 0.05;
    camera.position.z -= currentSpeed;

    camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
    camera.position.y += (2 + mouseY - camera.position.y) * 0.05;
    camera.lookAt(camera.position.x * 0.5, camera.position.y, camera.position.z - 10);

    // 2. SYSTÈME DE MONDE INFINI - RECYCLAGE DES OBJETS
    const recycleThreshold = CONFIG.INFINITE_WORLD.DESPAWN_DISTANCE; 
    const roadRecycleThreshold = roadSegmentLength / 2 + 20; 

    roadSegments.forEach(segment => {
        if(segment.position.z - camera.position.z > roadRecycleThreshold) {
            segment.position.z -= numberOfRoadSegments * roadSegmentLength;
        }
    });
    leftWalkSegments.forEach(segment => {
        if(segment.position.z - camera.position.z > roadRecycleThreshold) {
            segment.position.z -= numberOfRoadSegments * roadSegmentLength;
        }
    });
    rightWalkSegments.forEach(segment => {
        if(segment.position.z - camera.position.z > roadRecycleThreshold) {
            segment.position.z -= numberOfRoadSegments * roadSegmentLength;
        }
    });
    groundPlaneLeftSegments.forEach(segment => {
        if(segment.position.z - camera.position.z > roadRecycleThreshold) {
            segment.position.z -= numberOfRoadSegments * roadSegmentLength;
        }
    });
    groundPlaneRightSegments.forEach(segment => {
        if(segment.position.z - camera.position.z > roadRecycleThreshold) {
            segment.position.z -= numberOfRoadSegments * roadSegmentLength;
        }
    });

    // Recyclage des objets (Bâtiments, Arbres, etc.)
    buildings.forEach(building => {
        if(building.position.z - camera.position.z > recycleThreshold) {
            const side = building.userData.side;
            const lane = building.userData.laneIndex; // Récupère la voie
            
            let newZ;
            
            if (side === 'left') {
                newZ = laneZTrackers.left[lane] - (building.userData.depth + Math.random() * 5);
                
                // Gestion collision roue (Voie 0 seulement)
                if (lane === 0 && isCollidingWithWheel(newZ)) {
                    newZ = CONFIG.FERRIS_WHEEL.Z - 40;
                }

                laneZTrackers.left[lane] = newZ;
                
                // Position X basée sur la voie
                let baseX = BASE_X_LEFT - (lane * LANE_OFFSET_X);
                let newX = baseX - Math.random() * 10;
                
                building.position.z = newZ;
                building.position.x = newX;

            } else {
                newZ = laneZTrackers.right[lane] - (building.userData.depth + Math.random() * 5);
                laneZTrackers.right[lane] = newZ;
                
                let baseX = BASE_X_RIGHT + (lane * LANE_OFFSET_X);
                let newX = baseX + Math.random() * 10;
                
                building.position.z = newZ;
                building.position.x = newX;
            }
        }
    });

    // Recyclage Lampadaires
    lamps.forEach(lamp => {
        if(lamp.position.z - camera.position.z > recycleThreshold) {
             let newZ = camera.position.z - spawnDistance;
             if (wheelGroup && Math.abs(newZ - wheelGroup.position.z) < 50 && Math.abs(lamp.position.x - wheelGroup.position.x) < 50) {
                 newZ -= 80;
             }
             lamp.position.z = newZ;
        }
    });

    // Recyclage Arbres
    deadTrees.forEach(tree => {
        if(tree.position.z - camera.position.z > recycleThreshold) {
             let newZ = camera.position.z - spawnDistance;
             let newX = (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 15);
             
             if (wheelGroup) {
                const dx = newX - wheelGroup.position.x;
                const dz = newZ - wheelGroup.position.z;
                if (Math.sqrt(dx*dx + dz*dz) < 50) {
                    newZ -= 80;
                }
            }
             
             tree.position.z = newZ;
             tree.position.x = newX;
        }
    });

    // Recyclage Herbes et Débris sur la route
    roadWeeds.forEach(weed => {
        if(weed.position.z - camera.position.z > recycleThreshold) {
             weed.position.z = camera.position.z - spawnDistance;
             const isRoad = Math.random() > 0.4;
             if(isRoad) {
                 weed.position.x = (Math.random() - 0.5) * roadWidth * 0.8;
             } else {
                 weed.position.x = (Math.random() > 0.5 ? 1 : -1) * (roadWidth/2 + Math.random() * sidewalkWidth);
             }
        }
    });

    // Recyclage Voitures
    carcasseCars.forEach(car => {
        if(car.position.z - camera.position.z > recycleThreshold) {
             car.position.z = camera.position.z - spawnDistance - Math.random() * 50;
             const side = Math.random() > 0.5 ? 1 : -1;
             car.position.x = side * (roadWidth/2 + 1 + Math.random() * 2);
             car.rotation.y = Math.random() * Math.PI * 0.3 + (side === 1 ? -0.2 : 0.2);
        }
    });

    // 3. Animation Particules
    particleSystemRefs.forEach(({ system, pVel, numParticles, spreadX, spreadY, spreadZ }) => {
        const pos = system.geometry.attributes.position.array;
        for(let i=0; i<numParticles; i++) {
            pos[i*3+1] -= pVel[i]; 
            if(pos[i*3+1] < 0) {
                pos[i*3+1] = spreadY; 
                pos[i*3] = camera.position.x + (Math.random()-0.5)*spreadX; 
                pos[i*3+2] = camera.position.z - (spreadZ/2) + (Math.random())*spreadZ; 
            }
        }
        system.geometry.attributes.position.needsUpdate = true;
    });

    // 4. Clignotement Lampadaires
    flickrLights.forEach(item => {
        if(Math.random() > 0.92) { 
            item.light.intensity = Math.random() > 0.5 ? item.baseInt : 0;
            item.material.color.setHex(item.light.intensity > 0 ? 0xffaa00 : 0x222222);
        }
    });

    renderer.render(scene, camera);
  };

  animate();
};

const onMouseMove = (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
};

const onResize = () => {
    if(camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
};

onMounted(() => {
  init();
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('resize', onResize);
  cancelAnimationFrame(animationId);
  if(renderer) {
      renderer.dispose();
  } 
});
</script>

<style scoped>
.three-container {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: #0a0a0a;
  z-index: 0;
  overflow: hidden;
  transition: opacity 0.8s ease-in-out;
}

.fade-out {
  opacity: 0;
}
</style>