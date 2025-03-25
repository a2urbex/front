<template>
  <div class="auth">
    <div class="auth-form">
      <router-view v-slot="{ Component }">
        <transition name="translate" mode="out-in" appear>
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
    <div class="auth-switch">
        <h1 class="auth-switch__h1">Hello, Explorer!</h1>
        <p class="auth-switch__p">Welcome to our community. Please sign in or sign up to continue.</p>
        <button @click="switchForm" class="auth-switch__button">
        {{ route.path === '/login' ? 'Sign Up' : 'Login' }}
        </button>
    </div>
  </div>
  <div class="scene-container">
    <div class="controls-panel">
      <div class="control-group">
        <label>Camera Position (Locked):</label>
        <div class="coordinates">
          <div class="coordinate">
            <span>X:</span>
            <input type="number" :value="INITIAL_CAMERA_POS.x" disabled class="locked" />
          </div>
          <div class="coordinate">
            <span>Y:</span>
            <input type="number" :value="INITIAL_CAMERA_POS.y" disabled class="locked" />
          </div>
          <div class="coordinate">
            <span>Z:</span>
            <input type="number" :value="INITIAL_CAMERA_POS.z" disabled class="locked" />
          </div>
        </div>
      </div>
      <div class="control-group">
        <label>Look At Point:</label>
        <div class="coordinates">
          <div class="coordinate">
            <span>X:</span>
            <input type="number" v-model="targetPosition.x" @change="updateTargetPosition" />
          </div>
          <div class="coordinate">
            <span>Y:</span>
            <input type="number" v-model="targetPosition.y" @change="updateTargetPosition" />
          </div>
          <div class="coordinate">
            <span>Z:</span>
            <input type="number" v-model="targetPosition.z" @change="updateTargetPosition" />
          </div>
        </div>
      </div>
      <div class="current-position">
        Camera: ({{ INITIAL_CAMERA_POS.x }}, {{ INITIAL_CAMERA_POS.y }}, {{ INITIAL_CAMERA_POS.z }})
      </div>
      <div class="control-buttons">
        <button @click="toggleInsideView" :class="{ active: isInsideView }">
          {{ isInsideView ? 'Exit Inside View' : 'Enter Inside View' }}
        </button>
      </div>
    </div>
    <div class="three-scene" ref="container"></div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

const switchForm = () => {
  const newPath = route.path === '/login' ? '/register' : '/login'
  router.push(newPath)
}

import { onMounted, onBeforeUnmount, ref, reactive } from 'vue';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const container = ref(null);
let scene, camera, renderer, controls;
let animationFrameId;
const isInsideView = ref(false);

const locked = true;

// Initial positions
const INITIAL_CAMERA_POS = { x: -30, y: -118, z: 47 };
const INITIAL_TARGET_POS = { x: 37, y: -171, z: -24 };

// Camera position controls
const cameraPosition = reactive({
  x: INITIAL_CAMERA_POS.x,
  y: INITIAL_CAMERA_POS.y,
  z: INITIAL_CAMERA_POS.z
});

const targetPosition = reactive({
  x: INITIAL_TARGET_POS.x,
  y: INITIAL_TARGET_POS.y,
  z: INITIAL_TARGET_POS.z
});

const currentPosition = reactive({
  x: INITIAL_CAMERA_POS.x,
  y: INITIAL_CAMERA_POS.y,
  z: INITIAL_CAMERA_POS.z
});

// Animation parameters
const autoMove = {
  targetAngleX: 0,
  targetAngleY: 0,
  currentAngleX: 0,
  currentAngleY: 0,
  updateInterval: null
};

// Calculate the initial direction vector
const calculateInitialDirection = () => {
  const dir = new THREE.Vector3(
    INITIAL_TARGET_POS.x - INITIAL_CAMERA_POS.x,
    INITIAL_TARGET_POS.y - INITIAL_CAMERA_POS.y,
    INITIAL_TARGET_POS.z - INITIAL_CAMERA_POS.z
  ).normalize();
  return dir;
};

const constrainRotation = (event) => {
  if (!locked || !controls) return;

  const initialDir = calculateInitialDirection();
  const currentDir = new THREE.Vector3(
    controls.target.x - camera.position.x,
    controls.target.y - camera.position.y,
    controls.target.z - camera.position.z
  ).normalize();

  // Calculate angle between vectors
  const angle = THREE.MathUtils.radToDeg(initialDir.angleTo(currentDir));

  if (angle > 5) {
    // Reset to the closest allowed position
    const rotationAxis = new THREE.Vector3().crossVectors(initialDir, currentDir).normalize();
    const allowedRotation = new THREE.Quaternion().setFromAxisAngle(rotationAxis, THREE.MathUtils.degToRad(5));
    const constrainedDir = initialDir.clone().applyQuaternion(allowedRotation);

    // Calculate new target position
    const distance = new THREE.Vector3(
      INITIAL_TARGET_POS.x - INITIAL_CAMERA_POS.x,
      INITIAL_TARGET_POS.y - INITIAL_CAMERA_POS.y,
      INITIAL_TARGET_POS.z - INITIAL_CAMERA_POS.z
    ).length();

    controls.target.copy(camera.position).add(constrainedDir.multiplyScalar(distance));
    controls.update();

    // Update the reactive target position
    targetPosition.x = controls.target.x;
    targetPosition.y = controls.target.y;
    targetPosition.z = controls.target.z;
  }
};

const updateCameraPosition = () => {
  // Disabled - camera position is locked
  return;
};

const updateTargetPosition = () => {
  if (controls) {
    controls.target.set(
      Number(targetPosition.x),
      Number(targetPosition.y),
      Number(targetPosition.z)
    );
    controls.update();
  }
};

const updateCurrentPosition = () => {
  if (camera) {
    currentPosition.x = camera.position.x;
    currentPosition.y = camera.position.y;
    currentPosition.z = camera.position.z;
  }
};

const toggleInsideView = () => {
  isInsideView.value = !isInsideView.value;
  if (camera && controls) {
    if (isInsideView.value) {
      // Set up for inside view
      camera.near = 0.01;
      camera.far = 5000;
      controls.minDistance = 0; // Allow camera to get very close
      controls.maxDistance = 5000;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
    } else {
      // Reset to default outside view
      camera.near = 0.1;
      camera.far = 2000;
      controls.minDistance = 1;
      controls.maxDistance = 2000;
    }
    camera.updateProjectionMatrix();
  }
};

const createWhiteSkybox = () => {
  const loader = new THREE.CubeTextureLoader();
  const texture = loader.load([
    createWhiteDataURL(),
    createWhiteDataURL(),
    createWhiteDataURL(),
    createWhiteDataURL(),
    createWhiteDataURL(),
    createWhiteDataURL()
  ]);
  return texture;
};

const createWhiteDataURL = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 2, 2);
  return canvas.toDataURL();
};

// Function to generate new random target angles
const updateTargetAngles = () => {
  autoMove.targetAngleX = (Math.random() - 0.5) * 10; // Random angle between -5 and 5
  autoMove.targetAngleY = (Math.random() - 0.5) * 10;
};

// Function to smoothly move towards target angles
const updateAutoMovement = () => {
  const smoothFactor = 0.02; // Adjust for movement speed
  
  autoMove.currentAngleX += (autoMove.targetAngleX - autoMove.currentAngleX) * smoothFactor;
  autoMove.currentAngleY += (autoMove.targetAngleY - autoMove.currentAngleY) * smoothFactor;

  const initialDir = calculateInitialDirection();
  const distance = new THREE.Vector3(
    INITIAL_TARGET_POS.x - INITIAL_CAMERA_POS.x,
    INITIAL_TARGET_POS.y - INITIAL_CAMERA_POS.y,
    INITIAL_TARGET_POS.z - INITIAL_CAMERA_POS.z
  ).length();

  // Create rotation quaternions
  const rotationX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(autoMove.currentAngleX));
  const rotationY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(autoMove.currentAngleY));

  // Apply rotations
  const newDir = initialDir.clone()
    .applyQuaternion(rotationX)
    .applyQuaternion(rotationY);

  // Update target position
  const newTarget = camera.position.clone().add(newDir.multiplyScalar(distance));
  controls.target.copy(newTarget);
  controls.update();

  // Update the reactive target position
  targetPosition.x = controls.target.x;
  targetPosition.y = controls.target.y;
  targetPosition.z = controls.target.z;
};

// Start auto movement
const startAutoMovement = () => {
  updateTargetAngles();
  // Update target angles every 3 seconds
  autoMove.updateInterval = setInterval(() => {
    updateTargetAngles();
  }, 3000);
};

// Stop auto movement
const stopAutoMovement = () => {
  if (autoMove.updateInterval) {
    clearInterval(autoMove.updateInterval);
    autoMove.updateInterval = null;
  }
};

const init = () => {
  // Create scene
  scene = new THREE.Scene();
  
  // Add skybox
  scene.background = createWhiteSkybox();
  
  // Create camera with adjusted near plane for inside view
  camera = new THREE.PerspectiveCamera(
    75,
    container.value.clientWidth / container.value.clientHeight,
    0.01,
    5000
  );
  camera.position.set(-30, -118, 47);

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.value.appendChild(renderer.domElement);

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 200, 100);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Add controls with adjusted settings for inside view
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 0;
  controls.maxDistance = 5000;
  
  if (locked) {
    // Lock camera position when in locked mode
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Add event listeners for rotation constraint
    controls.addEventListener('change', constrainRotation);
  }

  controls.target.set(INITIAL_TARGET_POS.x, INITIAL_TARGET_POS.y, INITIAL_TARGET_POS.z);
  camera.position.set(INITIAL_CAMERA_POS.x, INITIAL_CAMERA_POS.y, INITIAL_CAMERA_POS.z);
  controls.update();

  // Load texture
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('/src/assets/model/Scaniverse.jpeg');

  // Load FBX model
  const fbxLoader = new FBXLoader();
  fbxLoader.load(
    '/src/assets/model/model_obj.fbx',
    (object) => {
      // Apply texture and shadows to all meshes
      object.traverse((child) => {
        if (child.isMesh) {
          // Create a new material with the texture
          const material = new THREE.MeshPhongMaterial({
            map: texture,
            shininess: 0, // Reduce shininess for a more matte look
            flatShading: false, // Smooth shading
            side: THREE.DoubleSide // Make the material visible from both sides
          });
          child.material = material;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Center the model
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center);

      // Auto-adjust scale based on model size
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 100 / maxDim; // Scale to make the largest dimension 100 units
      object.scale.set(scale, scale, scale);

      scene.add(object);
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    (error) => {
      console.error('An error occurred loading the model:', error);
    }
  );

  // Handle window resize
  const handleResize = () => {
    camera.aspect = container.value.clientWidth / container.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  };
  window.addEventListener('resize', handleResize);

  // Start auto movement after scene is initialized
  startAutoMovement();
};

const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  
  // Update controls
  controls.update();
  
  // Force camera position to stay at initial position
  if (camera) {
    camera.position.set(INITIAL_CAMERA_POS.x, INITIAL_CAMERA_POS.y, INITIAL_CAMERA_POS.z);
  }

  // Update auto movement
  if (locked) {
    updateAutoMovement();
  }

  renderer.render(scene, camera);
};

onMounted(() => {
  init();
  animate();
});

onBeforeUnmount(() => {
  stopAutoMovement();
  cancelAnimationFrame(animationFrameId);
  if (renderer) {
    renderer.dispose();
  }
  if (container.value) {
    container.value.innerHTML = '';
  }
  window.removeEventListener('resize', handleResize);
});
</script>


<style lang="scss">
@import '../assets/styles/components/auth.scss';
</style>

<style scoped>
.scene-container {
  position: relative;
  width: 100%;
  height: 100vh;
}

.three-scene {
  width: 100%;
  height: 100%;
}

.controls-panel {
display: none;
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.coordinates {
  display: flex;
  gap: 10px;
}

.coordinate {
  display: flex;
  align-items: center;
  gap: 5px;
}

.coordinate span {
  font-weight: bold;
  color: #666;
}

.coordinate input {
  width: 70px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.current-position {
  margin-top: 10px;
  font-size: 0.9em;
  color: #666;
}

.control-buttons {
  margin-top: 15px;
}

.control-buttons button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.control-buttons button:hover {
  background-color: #45a049;
}

.control-buttons button.active {
  background-color: #f44336;
}

.control-buttons button.active:hover {
  background-color: #da190b;
}

.locked {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}
</style> 