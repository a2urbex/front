<template>
  <div ref="container" class="three-container"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';

import buildingTextureUrl from '@/assets/textures/building.png';
import roadTextureUrl from '@/assets/textures/road.png';
import metalTextureUrl from '@/assets/textures/metal.png';

const container = ref(null);
let scene, camera, renderer;
let animationId;
let mouseX = 0;
let mouseY = 0;

// Tableaux pour gérer les éléments animés
const flickrLights = []; // Lampadaires qui clignotent
const particles = []; // Flocons de cendres

const init = () => {
  // --- 1. SCENE & ATMOSPHERE SOMBRE ---
  scene = new THREE.Scene();
  const fogColor = 0x111111; // Noir grisâtre, très sombre
  scene.background = new THREE.Color(fogColor);
  scene.fog = new THREE.FogExp2(fogColor, 0.035); // Brouillard plus dense

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.value.appendChild(renderer.domElement);

  // Gestion Texture
  const textureLoader = new THREE.TextureLoader();
  const loadTex = (url) => textureLoader.load(url, (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
  }, undefined, () => console.warn('Texture missing'));
  
  const buildingTex = loadTex(buildingTextureUrl);
  const roadTex = loadTex(roadTextureUrl);
  if(roadTex) roadTex.repeat.set(1, 20);
  const metalTex = loadTex(metalTextureUrl);

  // --- 2. ECLAIRAGE ---
  // Ambiance très faible (nuit/orage sombre)
  const ambientLight = new THREE.AmbientLight(0x1a2a3a, 0.5); 
  scene.add(ambientLight);

  // Lune pâle et diffuse
  const moonLight = new THREE.DirectionalLight(0x556677, 0.4);
  moonLight.position.set(-20, 50, -20);
  moonLight.castShadow = true;
  scene.add(moonLight);

  // --- 3. SOL & TROTTOIRS ---
  const roadWidth = 10;
  const roadLength = 400;

  const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
  const roadMat = new THREE.MeshStandardMaterial({ 
    map: roadTex, color: 0x333333, roughness: 0.9 
  });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.z = -100;
  road.receiveShadow = true;
  scene.add(road);

  const sidewalkGeo = new THREE.BoxGeometry(4, 0.4, roadLength);
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1 });
  
  const leftWalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
  leftWalk.position.set(-8, 0.2, -100);
  leftWalk.receiveShadow = true;
  scene.add(leftWalk);

  const rightWalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
  rightWalk.position.set(8, 0.2, -100);
  rightWalk.receiveShadow = true;
  scene.add(rightWalk);

  // --- 4. BATIMENTS (ANCRÉS AU SOL) ---
  const createBuilding = (x, z) => {
    const width = 6 + Math.random() * 5;
    const height = 15 + Math.random() * 25;
    const depth = 6 + Math.random() * 5;

    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({ map: buildingTex, color: 0x555555, roughness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    
    // CORRECTION FLOTTEMENT : On ancre un peu dans le sol (-0.5)
    mesh.position.set(x, (height / 2) - 0.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Fenêtres allumées (très rare)
    if (Math.random() > 0.8) {
        const lightWin = new THREE.PointLight(0xffaa00, 1, 10);
        lightWin.position.set(x + (width/2 + 0.1) * (x>0?-1:1), Math.random() * height, z + (Math.random()-0.5)*depth);
        scene.add(lightWin);
    }
  };

  for(let i=0; i<30; i++) {
      createBuilding(-15 - Math.random() * 15, -i * 15 + 10);
      createBuilding(15 + Math.random() * 15, -i * 15 + 10);
  }

  // --- 5. LAMPADAIRES (LOGIQUE COMPLEXE) ---
  const createLamp = (x, z) => {
    const group = new THREE.Group();

    // Poteau
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 3;
    group.add(pole);

    // Tête de la lampe
    const headGeo = new THREE.BoxGeometry(1, 0.3, 0.5);
    const head = new THREE.Mesh(headGeo, poleMat);
    head.position.set(x > 0 ? -0.5 : 0.5, 6, 0);
    group.add(head);

    // Ampoule (Visuel)
    const bulbGeo = new THREE.SphereGeometry(0.15);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0x222222 }); // Éteint par défaut
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(x > 0 ? -0.8 : 0.8, 5.8, 0);
    group.add(bulb);

    // LOGIQUE D'ETAT (70% OFF, 10% ON, 20% CLIGNOTE)
    const rand = Math.random();
    let light = null;

    if (rand > 0.9) { 
        // --- ON (10%) ---
        bulbMat.color.setHex(0xffaa00); // Orange sodium
        light = new THREE.SpotLight(0xffaa00, 15, 25, 0.8, 0.5, 1);
        light.position.set(x > 0 ? -0.8 : 0.8, 5.8, 0);
        light.target.position.set(x > 0 ? -0.8 : 0.8, 0, 0);
        group.add(light);
        group.add(light.target);
    } else if (rand > 0.7) {
        // --- CLIGNOTE (20%) ---
        bulbMat.color.setHex(0x443300); // Faible lueur
        light = new THREE.PointLight(0xffaa00, 0, 20); // Départ à 0
        light.position.set(x > 0 ? -0.8 : 0.8, 5.5, 0);
        group.add(light);
        // On ajoute à la liste pour l'animation
        flickrLights.push({ light: light, material: bulbMat, baseInt: 8 });
    }
    // Sinon OFF (70%) - On ne fait rien

    group.position.set(x, 0, z);
    scene.add(group);
  };

  for(let i=0; i<20; i++) {
      createLamp(-7, -i * 15);
      createLamp(7, -i * 15);
  }

  // --- 6. VEGETATION CHAOTIQUE & ROUTE ---
  const deadWoodMat = new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 1 });
  const deadLeavesMat = new THREE.MeshStandardMaterial({ color: 0x2f3a25, roughness: 1, side: THREE.DoubleSide });

  // Fonction pour un arbre chaotique
  const createDeadTree = (x, z) => {
    const group = new THREE.Group();
    
    // Tronc tordu (plusieurs cylindres)
    const trunkH = 2 + Math.random() * 2;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, trunkH), deadWoodMat);
    trunk.position.y = trunkH / 2;
    // Penche aléatoirement
    trunk.rotation.z = (Math.random() - 0.5) * 0.5;
    trunk.rotation.x = (Math.random() - 0.5) * 0.5;
    group.add(trunk);

    // Branches (Dodecahedrons déformés)
    const numBranches = 3 + Math.floor(Math.random() * 3);
    for(let i=0; i<numBranches; i++) {
        const branch = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8), deadLeavesMat);
        branch.position.set(
            (Math.random() - 0.5) * 2, 
            trunkH + Math.random() * 2, 
            (Math.random() - 0.5) * 2
        );
        branch.scale.set(Math.random()+0.5, Math.random()+0.5, Math.random()+0.5);
        group.add(branch);
    }

    group.position.set(x, 0, z);
    // Rotation et échelle globale du groupe pour variété
    group.rotation.y = Math.random() * Math.PI;
    const s = 0.8 + Math.random() * 0.5;
    group.scale.set(s, s, s);
    scene.add(group);
  };

  // Fonction pour l'herbe sur la route
  const createRoadWeeds = (x, z) => {
     // Géométrie simple croisée pour l'herbe
     const weedsGroup = new THREE.Group();
     const bladeGeo = new THREE.ConeGeometry(0.05, 0.6, 3); // Tiges pointues
     
     for(let k=0; k<5; k++) {
         const blade = new THREE.Mesh(bladeGeo, deadLeavesMat);
         blade.position.set((Math.random()-0.5)*0.3, 0.3, (Math.random()-0.5)*0.3);
         blade.rotation.z = (Math.random()-0.5) * 1; // Très penché
         blade.rotation.y = Math.random() * Math.PI;
         weedsGroup.add(blade);
     }
     weedsGroup.position.set(x, 0, z);
     scene.add(weedsGroup);
  };

  // Peuplement
  for(let i=0; i<100; i++) {
      const z = -Math.random() * 300 + 20;
      // Arbres (bords)
      if(Math.random() > 0.6) createDeadTree(-9 - Math.random()*5, z);
      if(Math.random() > 0.6) createDeadTree(9 + Math.random()*5, z);
      
      // Herbes (Route - Zone centrale)
      if(Math.random() > 0.5) {
          // Position X restreinte à la largeur de la route
          const roadX = (Math.random() - 0.5) * 8; 
          createRoadWeeds(roadX, z);
      }
  }

  // --- 7. GRANDE ROUE (STATIQUE) ---
  const wheelGroup = new THREE.Group();
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 }); // Rouille
  
  // Anneau
  const rim = new THREE.Mesh(new THREE.TorusGeometry(12, 0.4, 8, 50), wheelMat);
  wheelGroup.add(rim);
  
  // Rayons
  for(let i=0; i<12; i++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 24), wheelMat);
      spoke.rotation.z = (i/12) * Math.PI * 2;
      wheelGroup.add(spoke);
      
      // Nacelles (Statiques)
      const gondola = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 1.2), new THREE.MeshStandardMaterial({color: 0xaaaaaa}));
      const angle = (i/12) * Math.PI * 2;
      gondola.position.set(Math.cos(angle)*12, Math.sin(angle)*12, 0);
      gondola.rotation.z = -angle; // Garde nacelle droite
      wheelGroup.add(gondola);
  }
  
  // Pieds
  const support = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.8, 15), wheelMat);
  support.position.set(-6, -8, -2);
  support.rotation.z = -0.4;
  wheelGroup.add(support);
  const support2 = support.clone();
  support2.position.set(6, -8, -2);
  support2.rotation.z = 0.4;
  wheelGroup.add(support2);

  wheelGroup.position.set(-20, 14, -120);
  wheelGroup.rotation.y = 0.5;
  wheelGroup.rotation.z = 0.1; // Légèrement penchée (structure endommagée)
  scene.add(wheelGroup);

  // --- 8. PARTICULES (NEIGE / CENDRES) ---
  const pGeo = new THREE.BufferGeometry();
  const pCount = 8000;
  const pPos = new Float32Array(pCount * 3);
  const pVel = new Float32Array(pCount); // Vitesse individuelle

  for(let i=0; i<pCount; i++) {
      pPos[i*3] = (Math.random() - 0.5) * 80;
      pPos[i*3+1] = Math.random() * 40;
      pPos[i*3+2] = (Math.random() - 0.5) * 80;
      pVel[i] = 0.02 + Math.random() * 0.03;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.08,
      transparent: true,
      opacity: 0.6
  });
  const particleSystem = new THREE.Points(pGeo, pMat);
  scene.add(particleSystem);


  // --- ANIMATION LOOP ---
  const animate = () => {
    animationId = requestAnimationFrame(animate);

    // 1. Camera Mouvement (Lent travelling)
    camera.position.z -= 0.03;
    if(camera.position.z < -100) camera.position.z = 5; // Loop

    // Parallaxe souris
    camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
    camera.position.y += (2 + mouseY - camera.position.y) * 0.05;

    // 2. Animation Particules (Suivent la caméra)
    const pos = particleSystem.geometry.attributes.position.array;
    for(let i=0; i<pCount; i++) {
        pos[i*3+1] -= pVel[i]; // Tombe
        
        // Reset si sous le sol
        if(pos[i*3+1] < 0) {
            pos[i*3+1] = 30; // Retour en haut
            pos[i*3] = camera.position.x + (Math.random()-0.5)*60; // Autour camera X
            pos[i*3+2] = camera.position.z - 10 + (Math.random()-0.5)*60; // Autour camera Z
        }
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;

    // 3. Clignotement Lampadaires
    flickrLights.forEach(item => {
        // Clignotement aléatoire style néon défectueux
        if(Math.random() > 0.9) {
            item.light.intensity = Math.random() > 0.5 ? item.baseInt : 0;
            // Change aussi la couleur de l'ampoule visuelle
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
  if(renderer) renderer.dispose();
});
</script>

<style scoped>
.three-container {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: #000;
  z-index: 0;
}
</style>