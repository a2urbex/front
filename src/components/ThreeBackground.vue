<template>
  <div ref="container" class="three-container"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import {
  generateHospitalWallTexture,
  generateLinoleumTexture,
  generateCeilingTileTexture,
} from '@/utilities/textureGenerator';

const emit = defineEmits(['ready']);
const container = ref(null);

const isMobile =
  typeof window !== 'undefined' &&
  window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;

const CONFIG = {
  CORRIDOR_W: 3.4,
  CORRIDOR_H: 2.9,
  EYE_HEIGHT: 1.62,
  BAY_LEN: 6,
  BAY_COUNT: isMobile ? 9 : 13,
  TILE: 0.6,

  WALK_SPEED: 1.1,
  BOOST_SPEED: 8.0,
  WARP_SPEED: 30.0,

  DUST_COUNT: isMobile ? 110 : 340,
  PIXEL_RATIO: isMobile ? 1.5 : 2,
  SHADOW_SIZE: isMobile ? 512 : 1024,
  FOG_DENSITY: isMobile ? 0.044 : 0.03,
  MAX_LIGHTS: isMobile ? 4 : 9,
};

let scene, camera, renderer, clock;
let animationId;
let flashlight, flashTarget, flashBase;
let dust;
const bays = [];
const disposables = [];
const flickerFixtures = [];
let dynamicLights = 0;

let pointerX = 0, pointerY = 0;
let curX = 0, curY = 0;

let isBoosting = false;
let isWarping = false;
let currentSpeed = CONFIG.WALK_SPEED;
let walkPhase = 0;
let autoT = 0;
const flashBaseIntensity = 42;

const L_THRESHOLD = CONFIG.BAY_LEN;
const totalLength = CONFIG.BAY_LEN * CONFIG.BAY_COUNT;

const setBoost = (active) => { isBoosting = active; };
const warp = () => {
  isWarping = true;
  return new Promise((resolve) => setTimeout(resolve, 1500));
};
const fadeOut = () => {
  if (container.value) container.value.classList.add('fade-out');
  return new Promise((resolve) => setTimeout(resolve, 800));
};
defineExpose({ setBoost, warp, fadeOut });

const init = () => {
  clock = new THREE.Clock();

  scene = new THREE.Scene();
  const fogColor = 0x0e1114;
  scene.background = new THREE.Color(fogColor);
  scene.fog = new THREE.FogExp2(fogColor, CONFIG.FOG_DENSITY);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 120);
  camera.rotation.order = 'YXZ';
  camera.position.set(0, CONFIG.EYE_HEIGHT, 0);

  renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.PIXEL_RATIO));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  container.value.appendChild(renderer.domElement);

  const W = CONFIG.CORRIDOR_W;
  const H = CONFIG.CORRIDOR_H;
  const L = CONFIG.BAY_LEN;
  const halfW = W / 2;

  const wallTex = generateHospitalWallTexture();
  const floorTex = generateLinoleumTexture();
  const ceilTex = generateCeilingTileTexture();

  wallTex.map.repeat.set(1 / 2.5, 1 / H);
  wallTex.bump.repeat.set(1 / 2.5, 1 / H);
  floorTex.map.repeat.set(W / 1.2, L / 1.2);
  floorTex.bump.repeat.set(W / 1.2, L / 1.2);
  ceilTex.map.repeat.set(W / 2.4, L / 2.4);
  ceilTex.bump.repeat.set(W / 2.4, L / 2.4);
  disposables.push(wallTex.map, wallTex.bump, floorTex.map, floorTex.bump, ceilTex.map, ceilTex.bump);

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex.map, bumpMap: wallTex.bump, bumpScale: 0.03,
    color: 0xffffff, roughness: 0.95, metalness: 0,
  });
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex.map, bumpMap: floorTex.bump, bumpScale: 0.02,
    color: 0xffffff, roughness: 0.7, metalness: 0.02,
  });
  const ceilMat = new THREE.MeshStandardMaterial({
    map: ceilTex.map, bumpMap: ceilTex.bump, bumpScale: 0.02,
    color: 0xffffff, roughness: 1, metalness: 0,
  });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x9a9ea3, roughness: 0.5, metalness: 0.7 });
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x3b3e42, roughness: 0.6, metalness: 0.5 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0xbdb8a8, roughness: 0.8, metalness: 0.05 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8f8a7e, roughness: 0.85 });
  const rubberBaseMat = new THREE.MeshStandardMaterial({ color: 0x2c2d2f, roughness: 0.9 });
  const mattressMat = new THREE.MeshStandardMaterial({ color: 0xcac4b4, roughness: 1 });
  const plasticMat = new THREE.MeshStandardMaterial({ color: 0x394047, roughness: 0.7 });
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x040506 });
  const roomMat = new THREE.MeshStandardMaterial({ color: 0x191b1e, roughness: 1, side: THREE.DoubleSide });
  const fluoOnMat = () => new THREE.MeshBasicMaterial({ color: 0xdfefff });
  const fluoOffMat = new THREE.MeshStandardMaterial({ color: 0x26292c, roughness: 0.6, emissive: 0x05070a });
  const exitMat = new THREE.MeshBasicMaterial({ color: 0x25d07a });
  const glassColdMat = new THREE.MeshBasicMaterial({ color: 0x2f4a63 });

  const floorGeo = new THREE.PlaneGeometry(W, L);
  const ceilGeo = new THREE.PlaneGeometry(W, L);

  const hemi = new THREE.HemisphereLight(0x4c5765, 0x15181c, 1.05);
  scene.add(hemi);
  const fill = new THREE.DirectionalLight(0x37424e, 0.55);
  fill.position.set(-4, 10, 4);
  scene.add(fill);

  flashlight = new THREE.SpotLight(0xffe6bd, flashBaseIntensity, 40, 0.5, 0.6, 1.4);
  flashlight.position.set(0.2, -0.12, 0.1);
  flashlight.castShadow = true;
  flashlight.shadow.mapSize.width = CONFIG.SHADOW_SIZE;
  flashlight.shadow.mapSize.height = CONFIG.SHADOW_SIZE;
  flashlight.shadow.camera.near = 0.3;
  flashlight.shadow.camera.far = 42;
  flashlight.shadow.bias = -0.0008;
  flashTarget = new THREE.Object3D();
  flashTarget.position.set(0, 0, -10);
  flashlight.target = flashTarget;
  flashBase = new THREE.PointLight(0xffd9a0, 2.5, 4.5, 2);
  flashBase.position.set(0.18, -0.25, 0.15);
  camera.add(flashlight, flashTarget, flashBase);
  scene.add(camera);

  const canAddLight = () => dynamicLights < CONFIG.MAX_LIGHTS;

  const DOOR_W = 1.0, DOOR_H = 2.1;

  const buildWallGeometry = (doorZs, side) => {
    const shape = new THREE.Shape();
    shape.moveTo(-L / 2, 0);
    shape.lineTo(L / 2, 0);
    shape.lineTo(L / 2, H);
    shape.lineTo(-L / 2, H);
    shape.lineTo(-L / 2, 0);
    for (const dz of doorZs) {
      const cx = side * dz;
      const hw = DOOR_W / 2 + 0.04;
      const hole = new THREE.Path();
      hole.moveTo(cx - hw, 0.06);
      hole.lineTo(cx + hw, 0.06);
      hole.lineTo(cx + hw, DOOR_H + 0.02);
      hole.lineTo(cx - hw, DOOR_H + 0.02);
      hole.lineTo(cx - hw, 0.06);
      shape.holes.push(hole);
    }
    return new THREE.ShapeGeometry(shape);
  };

  const addBaseboard = (group, side, doorZs) => {
    const sorted = [...doorZs].sort((a, b) => a - b);
    let cursor = -L / 2;
    const segs = [];
    for (const dz of sorted) {
      const s = dz - DOOR_W / 2 - 0.05, e = dz + DOOR_W / 2 + 0.05;
      if (s > cursor) segs.push([cursor, s]);
      cursor = e;
    }
    if (cursor < L / 2) segs.push([cursor, L / 2]);
    for (const [a, b] of segs) {
      if (b - a <= 0.05) continue;
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, b - a), rubberBaseMat);
      base.position.set(side * (halfW - 0.02), 0.06, (a + b) / 2);
      group.add(base);
    }
  };

  const addCeiling = (group) => {
    const ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = H;
    ceil.receiveShadow = true;
    group.add(ceil);

    const holes = Math.floor(Math.random() * 3);
    for (let i = 0; i < holes; i++) {
      const cx = (Math.round((Math.random() - 0.5) * (W - CONFIG.TILE) / CONFIG.TILE)) * CONFIG.TILE;
      const cz = (Math.random() - 0.5) * (L - CONFIG.TILE);
      const hole = new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.TILE * 0.95, CONFIG.TILE * 0.95), voidMat);
      hole.rotation.x = Math.PI / 2;
      hole.position.set(cx, H - 0.01, cz);
      group.add(hole);
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, W * 0.8, 8), metalMat);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0, H + 0.22, cz);
      group.add(pipe);
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4 + Math.random() * 0.3, 4), darkMetalMat);
      wire.position.set(cx + 0.1, H - 0.2, cz);
      wire.rotation.z = (Math.random() - 0.5) * 0.5;
      group.add(wire);
      if (Math.random() > 0.5) {
        const drop = new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.TILE, CONFIG.TILE), ceilMat);
        drop.position.set(cx, H - 0.25, cz + 0.2);
        drop.rotation.set(Math.PI / 2 - 0.6, 0, 0.2);
        group.add(drop);
      }
    }
  };

  const addFixtures = (group) => {
    const count = 1 + (Math.random() > 0.5 ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const fz = (i === 0 ? -1 : 1) * (L / 4) + (Math.random() - 0.5);
      const fx = 0;
      const fixture = new THREE.Group();
      const broken = Math.random() > 0.55;
      const lit = !broken && Math.random() > 0.35;

      const panelMat = lit ? fluoOnMat() : fluoOffMat;
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1.2), panelMat);
      panel.rotation.x = Math.PI / 2;
      panel.position.y = H - 0.02;
      fixture.add(panel);
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 1.28), darkMetalMat);
      housing.position.y = H + 0.02;
      fixture.add(housing);

      if (broken) {
        fixture.rotation.x = (Math.random() - 0.5) * 0.5;
        fixture.rotation.z = (Math.random() - 0.5) * 0.4;
        fixture.position.y = -0.1 - Math.random() * 0.15;
      } else if (lit && canAddLight()) {
        const tube = new THREE.PointLight(0xbcdcff, 5, 6, 2);
        tube.position.set(fx, H - 0.25, fz);
        fixture.add(tube);
        dynamicLights++;
        flickerFixtures.push({ light: tube, mat: panelMat, base: 5 });
      }

      fixture.position.set(fx, 0, fz);
      group.add(fixture);
    }
  };

  const addDoor = (group, side, zPos, isOpen) => {
    const dw = DOOR_W, dh = DOOR_H;
    const x = side * (halfW - 0.02);

    const jambGeo = new THREE.BoxGeometry(0.1, dh, 0.09);
    for (const oz of [-dw / 2, dw / 2]) {
      const jamb = new THREE.Mesh(jambGeo, frameMat);
      jamb.position.set(x, dh / 2, zPos + oz);
      group.add(jamb);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, dw + 0.1), frameMat);
    lintel.position.set(x, dh, zPos);
    group.add(lintel);

    if (isOpen) {
      const depth = 1.8 + Math.random() * 0.9;
      const cx = side * (halfW + depth / 2);
      const rw = dw + 0.7;
      const back = new THREE.Mesh(new THREE.PlaneGeometry(rw, dh), roomMat);
      back.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      back.position.set(side * (halfW + depth), dh / 2, zPos);
      back.receiveShadow = true;
      group.add(back);
      const rf = new THREE.Mesh(new THREE.PlaneGeometry(depth, rw), roomMat);
      rf.rotation.x = -Math.PI / 2; rf.position.set(cx, 0.02, zPos); group.add(rf);
      const rc = new THREE.Mesh(new THREE.PlaneGeometry(depth, rw), roomMat);
      rc.rotation.x = Math.PI / 2; rc.position.set(cx, dh, zPos); group.add(rc);
      for (const sz of [-1, 1]) {
        const sw = new THREE.Mesh(new THREE.PlaneGeometry(depth, dh), roomMat);
        sw.position.set(cx, dh / 2, zPos + sz * rw / 2);
        group.add(sw);
      }
      if (Math.random() > 0.45) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.15), glassColdMat);
        win.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        win.position.set(side * (halfW + depth - 0.03), 1.35, zPos + (Math.random() - 0.5) * 0.5);
        group.add(win);
      }
    }

    const door = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(0.05, dh - 0.05, dw), doorMat);
    slab.position.z = dw / 2;
    slab.castShadow = true;
    door.add(slab);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.13, 0.16), metalMat);
    plate.position.set(-side * 0.03, dh - 0.35, dw * 0.5);
    door.add(plate);
    door.position.set(x, dh / 2, zPos - dw / 2);
    door.rotation.order = 'YXZ';
    if (isOpen) {
      door.rotation.y = side > 0 ? -(0.7 + Math.random() * 0.8) : (0.7 + Math.random() * 0.8);
    }
    group.add(door);
  };

  const addHandrail = (group, side, doorZs) => {
    const sorted = [...doorZs].sort((a, b) => a - b);
    let cursor = -L / 2;
    const segs = [];
    for (const dz of sorted) {
      const s = dz - DOOR_W / 2 - 0.08, e = dz + DOOR_W / 2 + 0.08;
      if (s > cursor) segs.push([cursor, s]);
      cursor = e;
    }
    if (cursor < L / 2) segs.push([cursor, L / 2]);
    const x = side * (halfW - 0.07);
    for (const [a, b] of segs) {
      if (b - a < 0.35) continue;
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, b - a, 8), metalMat);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(x, 0.92, (a + b) / 2);
      group.add(rail);
      for (const bz of [a + 0.12, b - 0.12]) {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.04), darkMetalMat);
        bracket.position.set(side * (halfW - 0.03), 0.92, bz);
        group.add(bracket);
      }
    }
  };

  const addExitSign = (group) => {
    const zPos = (Math.random() - 0.5) * (L - 1);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.42), exitMat);
    sign.position.set(0, H - 0.35, zPos);
    group.add(sign);
    if (canAddLight()) {
      const gl = new THREE.PointLight(0x25d07a, 1.6, 3, 2);
      gl.position.set(0, H - 0.4, zPos);
      group.add(gl);
      dynamicLights++;
    }
  };

  const makeGurney = () => {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.06, 1.95), metalMat);
    frame.position.y = 0.75; frame.castShadow = true; g.add(frame);
    const mat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 1.9), mattressMat);
    mat.position.y = 0.84; mat.castShadow = true; g.add(mat);
    for (const [sx, sz] of [[-0.34, -0.9], [0.34, -0.9], [-0.34, 0.9], [0.34, 0.9]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.72, 6), metalMat);
      leg.position.set(sx, 0.36, sz); g.add(leg);
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 10), darkMetalMat);
      wheel.rotation.z = Math.PI / 2; wheel.position.set(sx, 0.06, sz); g.add(wheel);
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 1.2), metalMat);
    rail.position.set(0.37, 0.98, 0); g.add(rail);
    return g;
  };

  const makeWheelchair = () => {
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.48), plasticMat);
    seat.position.y = 0.5; g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.05), plasticMat);
    back.position.set(0, 0.78, -0.22); g.add(back);
    for (const sx of [-0.28, 0.28]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 6, 16), darkMetalMat);
      wheel.position.set(sx, 0.28, 0.05); g.add(wheel);
      const front = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 10), darkMetalMat);
      front.rotation.z = Math.PI / 2; front.position.set(sx, 0.09, 0.28); g.add(front);
    }
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), metalMat);
    handle.position.set(0, 1.0, -0.24); g.add(handle);
    g.traverse((o) => { o.castShadow = true; });
    return g;
  };

  const makeIVPole = () => {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.7, 6), metalMat);
    pole.position.y = 0.85; g.add(pole);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 5), darkMetalMat);
    base.position.y = 0.03; g.add(base);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 4, 10), metalMat);
    hook.position.set(0.05, 1.65, 0); g.add(hook);
    g.traverse((o) => { o.castShadow = true; });
    return g;
  };

  const makeCart = () => {
    const g = new THREE.Group();
    for (const yy of [0.35, 0.65, 0.9]) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.7), metalMat);
      shelf.position.y = yy; g.add(shelf);
    }
    for (const [sx, sz] of [[-0.22, -0.32], [0.22, -0.32], [-0.22, 0.32], [0.22, 0.32]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), metalMat);
      post.position.set(sx, 0.45, sz); g.add(post);
    }
    g.traverse((o) => { o.castShadow = true; });
    return g;
  };

  const makeFallenChair = () => {
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.44), plasticMat);
    seat.position.y = 0.45; g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.5, 0.05), plasticMat);
    back.position.set(0, 0.72, -0.2); g.add(back);
    for (const [sx, sz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.04), darkMetalMat);
      leg.position.set(sx, 0.22, sz); g.add(leg);
    }
    g.traverse((o) => { o.castShadow = true; });
    return g;
  };

  const props = [makeGurney, makeWheelchair, makeIVPole, makeCart, makeFallenChair];

  const addProps = (group) => {
    const n = Math.random() > 0.55 ? (Math.random() > 0.6 ? 2 : 1) : 0;
    for (let i = 0; i < n; i++) {
      const p = props[Math.floor(Math.random() * props.length)]();
      const side = Math.random() > 0.5 ? 1 : -1;
      p.position.set(side * (halfW - 0.55 - Math.random() * 0.4), 0, (Math.random() - 0.5) * (L - 1.5));
      p.rotation.y = Math.random() * Math.PI * 2;
      if (Math.random() > 0.75) p.rotation.z = side * 1.3;
      group.add(p);
    }
  };

  const addFloorDebris = (group) => {
    if (Math.random() > 0.5) {
      const tile = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.55), ceilMat);
      tile.position.set((Math.random() - 0.5) * (W - 1), 0.02, (Math.random() - 0.5) * (L - 1));
      tile.rotation.y = Math.random() * Math.PI;
      tile.receiveShadow = true;
      group.add(tile);
    }
    const papers = Math.floor(Math.random() * 4);
    for (let i = 0; i < papers; i++) {
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.25), mattressMat);
      paper.rotation.x = -Math.PI / 2;
      paper.rotation.z = Math.random() * Math.PI;
      paper.position.set((Math.random() - 0.5) * (W - 0.6), 0.011, (Math.random() - 0.5) * L);
      group.add(paper);
    }
  };

  const addWindow = (group, side) => {
    const zPos = (Math.random() - 0.5) * (L - 2);
    const x = side * (halfW - 0.03);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), glassColdMat);
    glow.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    glow.position.set(x, 1.75, zPos);
    group.add(glow);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.3), frameMat);
    fr.position.set(x, 1.75, zPos); group.add(fr);
    const fr2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.3, 0.06), frameMat);
    fr2.position.set(x, 1.75, zPos); group.add(fr2);
    if (canAddLight()) {
      const light = new THREE.PointLight(0x5b79a0, 4, 5, 2);
      light.position.set(side * (halfW - 0.9), 1.7, zPos);
      group.add(light);
      dynamicLights++;
    }
  };

  const createBay = (index) => {
    const group = new THREE.Group();

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    addCeiling(group);

    for (const side of [-1, 1]) {
      const doorZs = [];
      for (const slot of [-L / 4, L / 4]) {
        if (Math.random() > 0.4) doorZs.push(slot + (Math.random() - 0.5) * 0.4);
      }

      const wall = new THREE.Mesh(buildWallGeometry(doorZs, side), wallMat);
      wall.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      wall.position.set(side * halfW, 0, 0);
      wall.receiveShadow = true;
      group.add(wall);

      addBaseboard(group, side, doorZs);
      if (Math.random() > 0.4) addHandrail(group, side, doorZs);

      for (const dz of doorZs) {
        addDoor(group, side, dz, Math.random() > 0.45);
      }
    }

    addFixtures(group);
    if (Math.random() > 0.7) addExitSign(group);

    if (Math.random() > 0.75) addWindow(group, Math.random() > 0.5 ? 1 : -1);

    addProps(group);
    addFloorDebris(group);

    group.position.z = -index * L + L;
    scene.add(group);
    bays.push(group);
    return group;
  };

  for (let i = 0; i < CONFIG.BAY_COUNT; i++) createBay(i);

  const dustGeo = new THREE.BufferGeometry();
  const dPos = new Float32Array(CONFIG.DUST_COUNT * 3);
  const dVel = new Float32Array(CONFIG.DUST_COUNT);
  const spreadX = W, spreadY = H, spreadZ = 28;
  for (let i = 0; i < CONFIG.DUST_COUNT; i++) {
    dPos[i * 3] = (Math.random() - 0.5) * spreadX;
    dPos[i * 3 + 1] = Math.random() * spreadY;
    dPos[i * 3 + 2] = -Math.random() * spreadZ;
    dVel[i] = 0.04 + Math.random() * 0.08;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xcfc9bc, size: 0.018, transparent: true, opacity: 0.32,
    sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  dust = new THREE.Points(dustGeo, dustMat);
  dust.userData = { dVel, spreadX, spreadY, spreadZ };
  scene.add(dust);

  renderer.render(scene, camera);
  requestAnimationFrame(() => emit('ready'));
  animate();
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  autoT += dt;

  let target = CONFIG.WALK_SPEED;
  if (isBoosting) target = CONFIG.BOOST_SPEED;
  if (isWarping) target = CONFIG.WARP_SPEED;
  currentSpeed += (target - currentSpeed) * Math.min(1, dt * 3);

  const dz = currentSpeed * dt;
  camera.position.z -= dz;
  walkPhase += dz * 1.4;

  const bobY = Math.sin(walkPhase * 2) * 0.03;
  const bobX = Math.sin(walkPhase) * 0.03;
  camera.position.y = CONFIG.EYE_HEIGHT + bobY;
  camera.position.x = bobX + curX * 0.28;

  curX += (pointerX - curX) * Math.min(1, dt * 2.5);
  curY += (pointerY - curY) * Math.min(1, dt * 2.5);
  camera.rotation.y = -curX * 0.3 + Math.sin(autoT * 0.28) * 0.025;
  camera.rotation.x = -curY * 0.18 + Math.sin(autoT * 0.21) * 0.018;
  camera.rotation.z = Math.sin(walkPhase) * 0.006;

  flashTarget.position.x = Math.sin(walkPhase * 0.6) * 0.45 + Math.sin(t * 1.7) * 0.3;
  flashTarget.position.y = Math.cos(walkPhase * 0.9) * 0.25 + Math.sin(t * 2.3) * 0.18 - 0.3;
  flashlight.position.x = 0.2 + Math.sin(t * 1.3) * 0.025;
  flashlight.position.y = -0.12 + Math.cos(t * 1.1) * 0.018;

  if (Math.random() > 0.99) {
    flashlight.intensity = flashBaseIntensity * (0.4 + Math.random() * 0.4);
  } else {
    flashlight.intensity += (flashBaseIntensity - flashlight.intensity) * 0.3;
  }

  for (const f of flickerFixtures) {
    if (Math.random() > 0.95) {
      const on = Math.random() > 0.2;
      f.light.intensity = on ? f.base * (0.8 + Math.random() * 0.4) : f.base * 0.3;
      f.mat.color.setHex(on ? 0xdfefff : 0x38454f);
    }
  }

  for (const bay of bays) {
    if (bay.position.z - camera.position.z > L_THRESHOLD) {
      bay.position.z -= totalLength;
    }
  }

  const d = dust.userData;
  const arr = dust.geometry.attributes.position.array;
  for (let i = 0; i < d.dVel.length; i++) {
    arr[i * 3 + 1] -= d.dVel[i] * dt * 4;
    arr[i * 3] += Math.sin(t * 0.5 + i) * 0.0015;
    if (arr[i * 3 + 1] < 0) {
      arr[i * 3 + 1] = d.spreadY;
      arr[i * 3] = camera.position.x + (Math.random() - 0.5) * d.spreadX;
      arr[i * 3 + 2] = camera.position.z - Math.random() * d.spreadZ;
    }
    if (arr[i * 3 + 2] - camera.position.z > 4) {
      arr[i * 3 + 2] = camera.position.z - Math.random() * d.spreadZ;
      arr[i * 3 + 1] = Math.random() * d.spreadY;
      arr[i * 3] = camera.position.x + (Math.random() - 0.5) * d.spreadX;
    }
  }
  dust.geometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
};

const onPointerMove = (e) => {
  pointerX = (e.clientX / window.innerWidth) * 2 - 1;
  pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
};
const onTouchMove = (e) => {
  if (!e.touches || !e.touches.length) return;
  const tch = e.touches[0];
  pointerX = (tch.clientX / window.innerWidth) * 2 - 1;
  pointerY = -((tch.clientY / window.innerHeight) * 2 - 1);
};
const onResize = () => {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

onMounted(() => {
  init();
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onPointerMove);
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('resize', onResize);
  cancelAnimationFrame(animationId);

  if (scene) {
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (m.map) m.map.dispose();
          if (m.bumpMap) m.bumpMap.dispose();
          m.dispose();
        });
      }
    });
  }
  disposables.forEach((tex) => tex && tex.dispose && tex.dispose());
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.three-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #0e1114;
  z-index: 0;
  overflow: hidden;
  transition: opacity 0.8s ease-in-out;
}

.fade-out {
  opacity: 0;
}
</style>
