console.log('VITE IS SERVING THIS FILE');

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Box3, Vector3 } from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// ---- Scene ----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

// ---- Camera ----
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(-1, 0.3, 0); // keep previous camera

// ---- Renderer ----
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// ---- OrbitControls attached to canvas ----
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.2, 0);
controls.update();
// ---- CSS2DRenderer for labels ----
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';

// Make entire label layer ignore pointer events except actual label divs
labelRenderer.domElement.style.pointerEvents = 'none';
labelRenderer.domElement.style.zIndex = '10';
document.body.appendChild(labelRenderer.domElement);

// ---- Lights ----
scene.add(new THREE.AmbientLight(0xffffff, 2));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// ---- Info Panel ----
const infoPanel = document.getElementById('info-panel') || document.createElement('div');
infoPanel.id = 'info-panel';
infoPanel.style.position = 'absolute';
infoPanel.style.width = '33%';           // roughly one third of the page
infoPanel.style.height = '100%';         // full height of the viewport
infoPanel.style.right = '0';             // stick to the right
infoPanel.style.top = '0';
infoPanel.style.padding = '20px';        // more padding
infoPanel.style.overflowY = 'auto';      // scroll if content is long
infoPanel.style.background = 'rgba(255,255,255,0.95)';
infoPanel.style.borderRadius = '0 0 0 8px'; // optional rounded left side
infoPanel.style.display = 'none';
infoPanel.style.zIndex = '20';
document.body.appendChild(infoPanel);

function showInfoPanel(content) {
  infoPanel.style.display = 'block';
  infoPanel.innerHTML = `
    ${content.imgTop ? `<img src="${content.imgTop}" style="width:100%; border-radius:4px; margin-bottom:10px;">` : ''}
    <p>${content.text}</p>
    ${content.imgBottom ? `<img src="${content.imgBottom}" style="width:100%; border-radius:4px; margin-top:10px;">` : ''}
  `;
  
  infoPanel.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  }
// ---- Load model ----
let model;
const loader = new GLTFLoader();
loader.load('/model.glb', (gltf) => {
  model = gltf.scene;
  scene.add(model);

  // Center & scale
  const box = new Box3().setFromObject(model);
  const center = box.getCenter(new Vector3());
  const size = box.getSize(new Vector3());

  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= 0.1; // slightly lower

  const maxDim = Math.max(size.x, size.y, size.z);
  model.scale.multiplyScalar(1 / maxDim);

});

function addFloatingLabel(position, text, imgTop, imgBottom) {
  const div = document.createElement('div');
  div.className = 'label';

  // Style the info icon
  div.style.width = '24px';
  div.style.height = '24px';
  div.style.background = 'black';
  div.style.color = 'white';
  div.style.fontWeight = 'bold';
  div.style.borderRadius = '50%';
  div.style.textAlign = 'center';
  div.style.lineHeight = '24px';
  div.style.cursor = 'pointer';
  div.style.userSelect = 'none';
  div.style.pointerEvents = 'auto';
  div.textContent = 'i';

  const label = new CSS2DObject(div);
  label.position.copy(position); // set 3D position
  scene.add(label);

  // Prevent OrbitControls from interfering
  div.addEventListener('pointerdown', (event) => event.stopPropagation());

  // Click event to show info panel
  div.addEventListener('click', () => {
    showInfoPanel({
      text: text,
      imgTop: imgTop,
      imgBottom: imgBottom
    });
  });

  

  return label;
}

// ---- Resize ----
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener('click', (event) => {
  // If info panel is not visible, do nothing
  if (infoPanel.style.display !== 'block') return;

  // If click is inside the info panel, do nothing
  if (infoPanel.contains(event.target)) return;

  // If click is on a label (info button), do nothing
  if (event.target.classList.contains('label')) return;

  // Otherwise, hide the info panel
  infoPanel.style.display = 'none';
});


// ---- Animate ----
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
animate();
