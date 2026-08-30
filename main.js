import * as THREE from 'three';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { Visitor } from './visitor.js';
import { Policeman } from './policeman.js';
import { Story } from './story.js';
import { UI } from './ui.js';
import * as audio from './audio.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0x8899aa, 0x0a0806, 0.3);
scene.add(hemi);
const dirLight = new THREE.DirectionalLight(0x8fa0c0, 0.2);
dirLight.position.set(5, 10, 2);
scene.add(dirLight);
const ambient = new THREE.AmbientLight(0x404040, 0.15);
scene.add(ambient);

const world = buildWorld(scene);
const player = new Player(camera, renderer.domElement);
player.holder.position.copy(world.playerStart);
scene.add(player.holder);
const visitor = new Visitor(scene);
const policeman = new Policeman(scene);

const knifeGroup = new THREE.Group();
const knifeBlade = new THREE.Mesh(
  new THREE.BoxGeometry(0.04, 0.32, 0.008),
  new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.3, metalness: 0.8 })
);
knifeBlade.position.y = 0.2;
knifeGroup.add(knifeBlade);
const knifeHandle = new THREE.Mesh(
  new THREE.CylinderGeometry(0.025, 0.03, 0.14, 8),
  new THREE.MeshStandardMaterial({ color: 0x2a1f18, roughness: 0.8 })
);
knifeHandle.position.y = 0.0;
knifeGroup.add(knifeHandle);
knifeGroup.position.set(0.32, -0.32, -0.55);
knifeGroup.rotation.set(-0.2, 0.3, 0.15);
knifeGroup.visible = false;
camera.add(knifeGroup);

const TIME_PRESETS = {
  night: { fog: 0x141822, hemi: 0.55, dir: 0.3, ambient: 0.35, lamp: 8 },
  morning: { fog: 0x3b4656, hemi: 1.0, dir: 0.8, ambient: 0.55, lamp: 4 },
  evening: { fog: 0x241c28, hemi: 0.6, dir: 0.35, ambient: 0.4, lamp: 7 }
};

function setTimeOfDay(mode) {
  const p = TIME_PRESETS[mode] || TIME_PRESETS.night;
  scene.fog = new THREE.Fog(p.fog, 5, 40);
  scene.background = new THREE.Color(p.fog);
  hemi.intensity = p.hemi;
  dirLight.intensity = p.dir;
  ambient.intensity = p.ambient;
  world.lamps.forEach((l) => { l.intensity = p.lamp; });
}
setTimeOfDay('night');

function showKnife() {
  knifeGroup.visible = true;
}

const game = { scene, camera, renderer, world, player, visitor, policeman, ui: UI, setTimeOfDay, showKnife };
const story = new Story(game);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyE') story.onKeyE();
  if (e.code === 'Escape' && player.locked) player.unlock();
});

renderer.domElement.addEventListener('click', () => {
  if (!UI.endScreen.classList.contains('hidden')) return;
  player.lock();
});

document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  audio.initAudio();
  audio.startAmbient();
  player.lock();
  story.run();
});

document.getElementById('restartBtn').addEventListener('click', () => {
  window.location.reload();
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  player.update(dt, world.solids);
  visitor.update(dt);
  story.update(dt);

  if (story.currentTargetId) {
    const inRange = player.nearestInteractable(world.interactables, story.currentTargetId);
    if (inRange) UI.showPrompt(story.promptFor(story.currentTargetId, story.currentVerb));
    else UI.hidePrompt();
  } else {
    UI.hidePrompt();
  }

  renderer.render(scene, camera);
}
animate();
