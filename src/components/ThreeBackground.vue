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

// Textures (Optionnel, le code gère le fallback couleur si les images manquent)
import buildingTextureUrl from '@/assets/textures/building.png';
import roadTextureUrl from '@/assets/textures/road.png';
import metalTextureUrl from '@/assets/textures/metal.png';
import rustedMetalTextureUrl from '@/assets/textures/rusted_metal.jpg';


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
    TREES: 100,                   // Nombre d'arbres morts (total pour les 2 côtés)
    ROAD_WEEDS: 200,              // Nombre d'herbes/buissons sur route et trottoirs
    DEBRIS: 200                   // Nombre de débris sur la route
  },
  
  // Bâtiments
  BUILDING_COUNT: 30,             // Nombre de bâtiments par côté (30 = 60 au total)
  
  // Grande roue de Pripyat
  FERRIS_WHEEL: {
    X: -20,                       // Position X (-20 = gauche, 20 = droite)
    Y: 14,                        // Hauteur
    Z: 8,                        // Distance par rapport à la caméra au départ (10 = très proche/visible au début, -150 = loin)
    ROTATION_Y: 0.5,              // Rotation sur l'axe Y
    ROTATION_Z: 0.1               // Inclinaison
  },
  
  // Éclairage
  LIGHTING: {
    // Pourcentages des états des lampadaires (total doit faire ~100)
    LAMP_OFF_PERCENT: 20,         // 50% de lampadaires éteints
    LAMP_ON_PERCENT: 30,          // 10% de lampadaires allumés en permanence
    LAMP_FLICKER_PERCENT: 50,     // 40% de lampadaires qui clignotent
    
    // Luminosité globale de la scène
    AMBIENT_INTENSITY: 1,       // Luminosité ambiante (0.0 = noir total, 1.0 = très lumineux)
    MOON_INTENSITY: 1,          // Intensité de la lumière lunaire (0.0 = pas de lune, 1.0 = pleine lune)
    LAMP_INTENSITY: 30            // Intensité des lampadaires individuels
  },
  
  // Monde infini (Système de recyclage des objets)
  INFINITE_WORLD: {
    SPAWN_DISTANCE: 150,          // Distance devant la caméra pour générer/recycler les objets
    DESPAWN_DISTANCE: -80,        // Distance derrière la caméra pour recycler les objets (négatif)
    CAMERA_SPEED: 0.03            // Vitesse de déplacement de la caméra (plus = plus rapide)
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


const init = () => {
  // --- 1. SCENE & ATMOSPHERE ---
  scene = new THREE.Scene();
  const fogColor = 0x0a0a0a; // Presque noir, très dense
  scene.background = new THREE.Color(fogColor);
  scene.fog = new THREE.FogExp2(fogColor, 0.045); // Brouillard encore plus dense

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.value.appendChild(renderer.domElement);

  // Textures
  const textureLoader = new THREE.TextureLoader();
  const loadTex = (url) => textureLoader.load(url, (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }, undefined, () => {});
  
  const buildingTex = loadTex(buildingTextureUrl);
  const roadTex = loadTex(roadTextureUrl);
  if(roadTex) roadTex.repeat.set(1, 40);
  const metalTex = loadTex(metalTextureUrl);
  const rustedMetalTex = loadTex(rustedMetalTextureUrl);


  // Lumières
  const ambientLight = new THREE.AmbientLight(0x111111, CONFIG.LIGHTING.AMBIENT_INTENSITY);
  scene.add(ambientLight);

  const moonLight = new THREE.DirectionalLight(0x445566, CONFIG.LIGHTING.MOON_INTENSITY);
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
    return weedGroup; // Retourne le groupe pour le suivi
  };

  // Arbre mort détaillé
  const createDeadTree = (x, z) => {
    const group = new THREE.Group();
    
    // Tronc principal tordu
    const trunkH = 2 + Math.random() * 3;
    const trunkRadius = 0.1 + Math.random() * 0.1;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.5, trunkH, 5), deadWoodMat);
    trunk.position.y = trunkH / 2;
    trunk.rotation.z = (Math.random() - 0.5) * 0.8;
    trunk.rotation.x = (Math.random() - 0.5) * 0.8;
    trunk.castShadow = true;
    group.add(trunk);

    // Branches secondaires
    const numBranches = 4 + Math.floor(Math.random() * 4);
    for(let i=0; i<numBranches; i++) {
        const branchLen = 1 + Math.random() * 2;
        const branchRadius = 0.05 + Math.random() * 0.05;
        const branch = new THREE.Mesh(new THREE.CylinderGeometry(branchRadius, branchRadius, branchLen), deadWoodMat);
        branch.position.set((Math.random() - 0.5) * 1.5, trunkH * (0.6 + Math.random() * 0.4), (Math.random() - 0.5) * 1.5);
        branch.rotation.set((Math.random() - 0.5) * Math.PI, 0, (Math.random() - 0.5) * Math.PI);
        branch.castShadow = true;
        group.add(branch);
    }

    // Feuillage clairsemé et mort
    const numLeavesClusters = 2 + Math.floor(Math.random() * 3);
    for(let i=0; i<numLeavesClusters; i++) {
        const leafSize = 0.6 + Math.random() * 0.6;
        const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(leafSize), deadLeavesMat);
        leaves.position.set((Math.random() - 0.5) * 3, trunkH + Math.random() * 2, (Math.random() - 0.5) * 3);
        leaves.scale.set(Math.random()+0.5, Math.random()+0.5, Math.random()+0.5);
        group.add(leaves);
    }

    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI;
    const s = 0.8 + Math.random() * 0.5;
    group.scale.set(s, s, s);
    scene.add(group);
    return group; // Retourne le groupe pour le suivi
  };

  // Création d'un bâtiment
  const createBuilding = (x, z) => {
    const width = 6 + Math.random() * 5;
    const height = 15 + Math.random() * 25;
    const depth = 6 + Math.random() * 5;

    const group = new THREE.Group();
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({ map: buildingTex, color: 0x444444, roughness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    
    mesh.position.y = height / 2; 
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    const numAddons = Math.floor(Math.random() * 4);
    for(let i=0; i<numAddons; i++) {
        const addonW = width * (0.3 + Math.random() * 0.5);
        const addonH = height * 0.1 + Math.random() * 2;
        const addonD = depth + 0.5 + Math.random() * 1; 
        const addonGeo = new THREE.BoxGeometry(addonW, addonH, addonD);
        const addon = new THREE.Mesh(addonGeo, mat);
        addon.position.y = Math.random() * (height - addonH) + addonH/2;
        addon.position.x = (Math.random() > 0.5 ? 1 : -1) * (width/2 + addonW/2 - 0.5);
        addon.position.z = (Math.random() - 0.5) * (depth - 1);
        addon.castShadow = true;
        group.add(addon);
    }

    group.position.set(x, 0, z);
    group.userData = { width, height, depth, x, z }; // Stocke les dimensions pour le recyclage
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

  // Création d'un lampadaire détaillé
  const createLamp = (x, z) => {
    const group = new THREE.Group();
    // Matériau plus brut, gris foncé/noir pour un look industriel
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.5 });
    
    // --- Poteau Principal (Massif et Épais) ---
    // Un simple cylindre ou un prisme octogonal si vous voulez plus de détails
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 6), poleMat);
    pole.position.y = 3;
    pole.castShadow = true;
    group.add(pole);

    // --- Bras Supérieur (Droit et Horizontal) ---
    // Plus épais et moins raffiné que le modèle initial
    const armGeo = new THREE.BoxGeometry(1.8, 0.2, 0.2);
    const arm = new THREE.Mesh(armGeo, poleMat);
    // Position : L'ajustement dépend du côté (x > 0) pour que le bras s'étende vers l'intérieur de la scène.
    // Le bras commence à 0.9 (la moitié de sa longueur) par rapport au centre du poteau (à x=0).
    const armXOffset = x > 0 ? -0.9 : 0.9;
    arm.position.set(armXOffset, 5.9, 0);
    // Le bras est déjà orienté correctement par défaut (le long de l'axe X), pas besoin de rotation.
    arm.castShadow = true;
    group.add(arm);

    // --- Support de la Tête de Lampe (Simple) ---
    // Un petit support vertical pour attacher la tête angulaire au bras
    const headSupportGeo = new THREE.BoxGeometry(0.2, 0.3, 0.2);
    const headSupport = new THREE.Mesh(headSupportGeo, poleMat);
    const supportXOffset = x > 0 ? -1.7 : 1.7; // Légèrement au-delà de la fin du bras
    headSupport.position.set(supportXOffset, 5.75, 0);
    headSupport.castShadow = true;
    group.add(headSupport);

    // --- Tête de la Lampe (Forme Simple, Bloc Carré ou Tronconique) ---
    // Un bloc simple et fonctionnel, style projecteur
    const headGeo = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.5), poleMat);
    const headXOffset = x > 0 ? -1.7 : 1.7;
    headGeo.position.set(headXOffset, 5.6, 0);
    headGeo.rotation.x = -Math.PI / 16; // Légèrement incliné vers le bas
    headGeo.castShadow = true;
    group.add(headGeo);

    // --- Ampoule/Source Lumineuse (Surface Émissive) ---
    // Une simple face rectangulaire pour simuler l'ouverture du projecteur
    const bulbGeo = new THREE.PlaneGeometry(0.4, 0.4);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide }); // Éteint par défaut
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    const bulbXOffset = x > 0 ? -1.69 : 1.69;
    bulb.position.set(bulbXOffset, 5.6, 0);
    // Rotation pour faire face au sol/devant
    bulb.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
    bulb.rotation.x = -Math.PI / 16;
    group.add(bulb);
    
    // --- Logique d'Éclairage et de Clignotement ---
    const rand = Math.random() * 100; // 0-100 pour les pourcentages
    let light = null;
    let lightIntensity = CONFIG.LIGHTING.LAMP_INTENSITY;

    // Calcul des seuils basés sur les pourcentages configurables
    const offThreshold = CONFIG.LIGHTING.LAMP_OFF_PERCENT;
    const onThreshold = offThreshold + CONFIG.LIGHTING.LAMP_ON_PERCENT;
    // Le reste sera pour flicker

    if (rand < offThreshold) { 
        // Lampadaire éteint
    } else if (rand < onThreshold) { 
        // Lampadaire allumé en permanence
        bulbMat.color.setHex(0xffaa55);
        light = new THREE.SpotLight(0xffaa55, lightIntensity, 25, 0.7, 0.5, 1);
        light.position.set(bulbXOffset, 5.6, 0);
        
        // Cible pointant vers le bas, légèrement en avant
        const targetX = x > 0 ? -1.7 : 1.7;
        light.target.position.set(targetX, 0, 0);
        
        group.add(light);
        group.add(light.target);
        light.castShadow = true;
    } else { 
        // Lampadaire qui clignote (défaillance)
        bulbMat.color.setHex(0x444000); 
        light = new THREE.PointLight(0xffaa55, 0, 20); // Commence à 0
        light.position.set(bulbXOffset, 5.6, 0);
        group.add(light);
        flickrLights.push({ light: light, material: bulbMat, baseInt: lightIntensity });
    }

    // --- Positionnement Final et Métadonnées ---
    group.position.set(x, 0, z);
    group.userData = { x, z };
    scene.add(group);
    lamps.push(group);
    return group;
  };

  // Création d'une carcasse de voiture détaillée
  const createAbandonedCar = (z) => {
    const carGroup = new THREE.Group();
    
    // --- Matériaux Améliorés ---
    // Simuler une couleur de base fanée, rouillée, ou très sale.
    const rustColor = new THREE.Color(0x7c493c); // Couleur rouille ou kaki fané
    const baseColor = Math.random() > 0.6 ? 0x2e3532 : 0x7c493c; // 40% rouille, 60% gris foncé/vert militaire
    
    const carMat = new THREE.MeshStandardMaterial({ 
        map: metalTex, // Garder votre texture métallique/saleté
        color: baseColor, 
        roughness: 0.9, 
        metalness: 0.1, // Faible métalness pour la rouille et la saleté
        // flatShading: true // optionnel, pour un look plus polygonal et abîmé
    });

    // --- Géométrie du Châssis (Break/Berline) ---
    // Corps principal (milieu)
    const bodyGeo = new THREE.BoxGeometry(1.7, 0.6, 2.5);
    const body = new THREE.Mesh(bodyGeo, carMat);
    body.position.y = 0.5;
    // Déformation réaliste : enfoncé et tordu
    body.scale.set(1 + Math.random()*0.1, 1 - Math.random()*0.3, 1 - Math.random()*0.2); 
    body.rotation.x = (Math.random() - 0.5) * 0.1; // Légère torsion
    body.castShadow = true;
    carGroup.add(body);

    // Capot/Coffre (plus bas)
    const hoodGeo = new THREE.BoxGeometry(1.7, 0.3, 1.5);
    const hood = new THREE.Mesh(hoodGeo, carMat);
    hood.position.y = 0.25;
    hood.position.z = -2.0;
    hood.scale.set(1, 1 - Math.random()*0.4, 1); // Capot écrasé
    hood.castShadow = true;
    carGroup.add(hood);

    // --- Habitacle Détruit ---
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.7, 1.5);
    const cabin = new THREE.Mesh(cabinGeo, carMat);
    cabin.position.y = 1.0;
    cabin.position.z = -0.5;
    cabin.scale.set(1, 1 - Math.random()*0.6, 1); // Habitacle très écrasé
    cabin.castShadow = true;
    carGroup.add(cabin);
    
    // Pare-brise brisé (plan transparent ou sale)
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x555555, 
        transmission: 0.1, 
        roughness: 0.8, // Très sale
        metalness: 0.1,
        transparent: true
    });
    const windshieldGeo = new THREE.PlaneGeometry(1.5, 0.6);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 1.1, -1.2);
    windshield.rotation.x = -Math.PI / 6; // Angle réaliste
    windshield.castShadow = true;
    carGroup.add(windshield);


    // --- Roues Manquantes et Déformées ---
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25); // Roues légèrement plus grandes
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
    const wheelPositions = [
        {x: 0.9, z: 1.5, missing: false}, 
        {x: -0.9, z: 1.5, missing: false},
        {x: 0.9, z: -1.8, missing: Math.random() > 0.7}, // 30% de chance qu'une roue manque
        {x: -0.9, z: -1.8, missing: false}
    ];

    wheelPositions.forEach(pos => {
        if (!pos.missing) {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(pos.x, 0.3, pos.z);
            wheel.rotation.x = Math.PI / 2;
            
            // Roue dégonflée/déformée
            if (Math.random() > 0.5) {
                wheel.scale.y = 1 + Math.random()*0.5; // Penchée
                wheel.scale.z = 0.8; // Écrasée
                wheel.rotation.z = (Math.random() - 0.5) * 0.5;
            }
            carGroup.add(wheel);
        } else {
            // Si la roue manque, ajouter un essieu cassé (petit cylindre)
            const axleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.2);
            const axleMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
            const axle = new THREE.Mesh(axleGeo, axleMat);
            axle.position.set(pos.x, 0.3, pos.z);
            axle.rotation.x = Math.PI / 2;
            carGroup.add(axle);
        }
    });

    // --- Positionnement Final (Plus chaotique) ---
    const side = Math.random() > 0.5 ? 1 : -1;
    carGroup.position.set(side * (roadWidth/2 + 1 + Math.random() * 2), 0, z);
    
    // Plus de rotation/inclinaison pour simuler un positionnement chaotique
    carGroup.rotation.y = Math.random() * Math.PI * 0.5 + (side === 1 ? -0.4 : 0.4); 
    carGroup.rotation.z = (Math.random() - 0.5) * 0.4; // Fortement inclinée (dans un fossé, sur un trottoir)

    carGroup.userData = { side, z };
    scene.add(carGroup);
    carcasseCars.push(carGroup);
    return carGroup;
  };


  // --- 4. SOL & ENVIRONNEMENT ---
  const roadWidth = 10;
  const roadSegmentLength = 100; // Longueur d'un segment de route pour la boucle
  const numberOfRoadSegments = 4; // Nombre de segments pour couvrir la distance de vue
  const totalRoadLength = roadSegmentLength * numberOfRoadSegments;


  // La route "virtuelle" se compose de plusieurs segments qui bouclent
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

  // Trottoirs
  const sidewalkWidth = 4;
  const sidewalkHeight = 0.4;
  const sidewalkGeo = new THREE.BoxGeometry(sidewalkWidth, sidewalkHeight, roadSegmentLength);
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 });
  
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

  // Sol sous les batiments
  const groundPlaneGeo = new THREE.BoxGeometry(40, 0.8, roadSegmentLength);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 1 });
  const groundPlaneLeftSegments = [];
  const groundPlaneRightSegments = [];
  for(let i=0; i<numberOfRoadSegments; i++) {
      const groundPlaneLeft = new THREE.Mesh(groundPlaneGeo, groundMat);
      groundPlaneLeft.position.set(-30, -0.4, camera.position.z - roadSegmentLength * (numberOfRoadSegments/2) + i * roadSegmentLength);
      groundPlaneLeft.receiveShadow = true;
      scene.add(groundPlaneLeft);
      groundPlaneLeftSegments.push(groundPlaneLeft);

      const groundPlaneRight = groundPlaneLeft.clone();
      groundPlaneRight.position.x = 30;
      scene.add(groundPlaneRight);
      groundPlaneRightSegments.push(groundPlaneRight);
  }


  // --- 5. PEUPLEMENT INITIAL DES OBJETS ---
  // Utilise les paramètres de monde infini configurables
  const spawnDistance = CONFIG.INFINITE_WORLD.SPAWN_DISTANCE;
  const despawnDistance = CONFIG.INFINITE_WORLD.DESPAWN_DISTANCE;

  // Bâtiments
  for(let i=0; i<CONFIG.BUILDING_COUNT; i++) {
      createBuilding(-15 - Math.random() * 15, -Math.random() * spawnDistance + camera.position.z);
      createBuilding(15 + Math.random() * 15, -Math.random() * spawnDistance + camera.position.z);
  }

  // Lampadaires avec distance minimale entre eux
  const minLampDistance = CONFIG.LAMP_MIN_DISTANCE;
  const lampPositions = []; // Stocke les positions des lampadaires créés
  
  const tryCreateLamp = (x, side) => {
    let attempts = 0;
    const maxAttempts = 50;
    
    while(attempts < maxAttempts) {
      const z = -Math.random() * spawnDistance + camera.position.z;
      
      // Vérifie la distance avec tous les lampadaires existants
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
      if(Math.random() > 0.3) roadWeeds.push(createSmallWeed((Math.random() - 0.5) * roadWidth * 0.8, z, 0x3a4a2a));
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
      roadWeeds.push(debris); // On les met aussi dans la liste des objets à recycler
  }

  // Carcasses de voitures
  for(let i=0; i<CONFIG.CAR_COUNT; i++) {
      createAbandonedCar(-Math.random() * spawnDistance + camera.position.z);
  }


  // --- 6. GRANDE ROUE (POSITIONNEMENT INITIAL) ---
  const wheelGroup = new THREE.Group();
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

  // --- 8. ANIMATION LOOP ---
  const animate = () => {
    animationId = requestAnimationFrame(animate);

    // 1. Camera Mouvement (avance automatiquement pour créer l'effet infini)
    camera.position.z -= CONFIG.INFINITE_WORLD.CAMERA_SPEED;

    // Parallaxe souris
    camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
    camera.position.y += (2 + mouseY - camera.position.y) * 0.05;

    // 2. SYSTÈME DE MONDE INFINI - RECYCLAGE DES OBJETS
    // Lorsqu'un objet passe derrière la caméra (despawnDistance), il est recyclé :
    // - Il n'est PAS supprimé de la mémoire (pas de garbage collection)
    // - Il est simplement repositionné devant la caméra (spawnDistance)
    // - Cela crée l'illusion d'un monde infini sans consommer plus de mémoire
    
    // Recyclage des segments de route (boucle infinie)
    roadSegments.forEach(segment => {
        if(segment.position.z - camera.position.z < despawnDistance) {
            segment.position.z += numberOfRoadSegments * roadSegmentLength;
        }
    });
    leftWalkSegments.forEach(segment => {
        if(segment.position.z - camera.position.z < despawnDistance) {
            segment.position.z += numberOfRoadSegments * roadSegmentLength;
        }
    });
    rightWalkSegments.forEach(segment => {
        if(segment.position.z - camera.position.z < despawnDistance) {
            segment.position.z += numberOfRoadSegments * roadSegmentLength;
        }
    });
    groundPlaneLeftSegments.forEach(segment => {
        if(segment.position.z - camera.position.z < despawnDistance) {
            segment.position.z += numberOfRoadSegments * roadSegmentLength;
        }
    });
    groundPlaneRightSegments.forEach(segment => {
        if(segment.position.z - camera.position.z < despawnDistance) {
            segment.position.z += numberOfRoadSegments * roadSegmentLength;
        }
    });

    // Recyclage des objets
    buildings.forEach(building => {
        if(building.position.z - camera.position.z < despawnDistance) {
            // On déplace le bâtiment loin devant
            building.position.z = camera.position.z + spawnDistance;
            // On varie légèrement sa position X pour éviter la répétition visuelle
            building.position.x = (building.userData.x > 0 ? 1 : -1) * (15 + Math.random() * 15);
        }
    });

    // Recyclage Lampadaires
    lamps.forEach(lamp => {
        if(lamp.position.z - camera.position.z < despawnDistance) {
             lamp.position.z = camera.position.z + spawnDistance;
        }
    });

    // Recyclage Arbres
    deadTrees.forEach(tree => {
        if(tree.position.z - camera.position.z < despawnDistance) {
             tree.position.z = camera.position.z + spawnDistance;
             tree.position.x = (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 15);
        }
    });

    // Recyclage Herbes et Débris sur la route
    roadWeeds.forEach(weed => {
        if(weed.position.z - camera.position.z < despawnDistance) {
             weed.position.z = camera.position.z + spawnDistance;
             // On garde la logique de positionnement (sur route ou trottoir)
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
        if(car.position.z - camera.position.z < despawnDistance) {
             car.position.z = camera.position.z + spawnDistance + Math.random() * 50;
             // Change de côté aléatoirement
             const side = Math.random() > 0.5 ? 1 : -1;
             car.position.x = side * (roadWidth/2 + 1 + Math.random() * 2);
             car.rotation.y = Math.random() * Math.PI * 0.3 + (side === 1 ? -0.2 : 0.2);
        }
    });

    // 3. Animation Particules (Suivent la caméra)
    particleSystemRefs.forEach(({ system, pVel, numParticles, spreadX, spreadY, spreadZ }) => {
        const pos = system.geometry.attributes.position.array;
        for(let i=0; i<numParticles; i++) {
            pos[i*3+1] -= pVel[i]; // Chute Y
            
            // Si touche le sol, repop en haut, autour de la caméra
            if(pos[i*3+1] < 0) {
                pos[i*3+1] = spreadY; 
                pos[i*3] = camera.position.x + (Math.random()-0.5)*spreadX; 
                pos[i*3+2] = camera.position.z - (spreadZ/2) + (Math.random())*spreadZ; // Plus devant la caméra
            }
        }
        system.geometry.attributes.position.needsUpdate = true;
    });

    // 4. Clignotement Lampadaires
    flickrLights.forEach(item => {
        if(Math.random() > 0.92) { // Fréquence du flicker
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
      // Optionnel: Nettoyage plus profond des géométries si changement de page fréquent
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
}
</style>