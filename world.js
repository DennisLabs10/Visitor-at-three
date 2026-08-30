import * as THREE from 'three';

const WALL_H = 3.2;
const wallMat = new THREE.MeshStandardMaterial({ color: 0x2b2620, roughness: 0.95 });
const floorMat = new THREE.MeshStandardMaterial({ color: 0x3a3128, roughness: 1 });
const groundMat = new THREE.MeshStandardMaterial({ color: 0x0e1410, roughness: 1 });
const furnMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 });
const bedMat = new THREE.MeshStandardMaterial({ color: 0x6b5a63, roughness: 0.85 });
const fabricMat = new THREE.MeshStandardMaterial({ color: 0x35404a, roughness: 0.95 });
const bagMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.6 });

function wallBox(x, y, z, sx, sy, sz, scene, solids) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wallMat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  solids.push(new THREE.Box3().setFromObject(mesh));
  return mesh;
}

function furnBox(x, y, z, sx, sy, sz, mat, scene, solids, ry = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  scene.add(mesh);
  solids.push(new THREE.Box3().setFromObject(mesh));
  return mesh;
}

const houseBodyMat = new THREE.MeshStandardMaterial({ color: 0x241f1a, roughness: 0.9 });
const houseRoofMat = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.85 });
const windowMat = new THREE.MeshStandardMaterial({ color: 0x3a2c10, emissive: 0xd8a84a, emissiveIntensity: 0.9 });

function buildNeighborHouse(scene, solids, x, z, ry, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = ry;
  scene.add(group);

  const w = 5.5 * scale, h = 3.4 * scale, d = 5 * scale;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), houseBodyMat);
  body.position.y = h / 2;
  group.add(body);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.78, h * 0.6, 4), houseRoofMat);
  roof.position.y = h + (h * 0.6) / 2 - 0.05;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  [[-w * 0.25, d / 2 + 0.02], [w * 0.25, d / 2 + 0.02]].forEach(([wx, wz]) => {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7 * scale, 0.9 * scale), windowMat);
    win.position.set(wx, h * 0.55, wz);
    group.add(win);
  });

  group.updateMatrixWorld(true);
  solids.push(new THREE.Box3().setFromObject(body));
  return group;
}

export function buildWorld(scene) {
  const solids = [];

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), groundMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const houseFloor = new THREE.Mesh(new THREE.PlaneGeometry(24, 16), floorMat);
  houseFloor.rotation.x = -Math.PI / 2;
  houseFloor.position.set(0, 0.01, 0);
  scene.add(houseFloor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(24, 16), wallMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, WALL_H, 0);
  scene.add(ceiling);

  wallBox(0, WALL_H / 2, -8, 24, WALL_H, 0.3, scene, solids);
  wallBox(-7, WALL_H / 2, 8, 10, WALL_H, 0.3, scene, solids);
  wallBox(7, WALL_H / 2, 8, 10, WALL_H, 0.3, scene, solids);
  wallBox(-12, WALL_H / 2, 0, 0.3, WALL_H, 16, scene, solids);
  wallBox(12, WALL_H / 2, 0, 0.3, WALL_H, 16, scene, solids);

  wallBox(-4, WALL_H / 2, -4.5, 0.25, WALL_H, 7, scene, solids);
  wallBox(-4, WALL_H / 2, 6.5, 0.25, WALL_H, 3, scene, solids);
  wallBox(4, WALL_H / 2, -4.5, 0.25, WALL_H, 7, scene, solids);
  wallBox(4, WALL_H / 2, 6.5, 0.25, WALL_H, 3, scene, solids);

  const doorPivot = new THREE.Group();
  doorPivot.position.set(-1, 0, 8);
  scene.add(doorPivot);
  const doorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2, WALL_H - 0.4, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x1c1712, roughness: 0.8 })
  );
  doorMesh.position.set(1, (WALL_H - 0.4) / 2, 0);
  doorPivot.add(doorMesh);

  const porchLight = new THREE.PointLight(0xffdca0, 0, 6, 2);
  porchLight.position.set(-1, 2.6, 9.5);
  scene.add(porchLight);

  const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 8), furnMat);
  lampPost.position.set(-4, 1.5, 10);
  scene.add(lampPost);

  buildNeighborHouse(scene, solids, -20, 5, 0.4);
  buildNeighborHouse(scene, solids, 20, 5, -0.4);
  buildNeighborHouse(scene, solids, -17, 23, 0.85, 1.1);
  buildNeighborHouse(scene, solids, 17, 23, -0.85, 0.9);
  buildNeighborHouse(scene, solids, 1, 29, 0.1, 1.2);

  const bed = furnBox(-9, 0.35, -5, 3, 0.7, 4.6, bedMat, scene, solids);
  furnBox(-9, 0.85, -6.9, 3, 0.35, 0.8, bedMat, scene, solids);
  furnBox(-10.8, WALL_H * 0.6, -1, 1.6, WALL_H * 0.7, 1.2, furnMat, scene, solids);

  const kitchenTable = furnBox(8.2, 0.45, -5, 2.4, 0.9, 1.6, furnMat, scene, solids);
  furnBox(11.4, 0.55, -6.6, 1.2, 1.1, 3.2, furnMat, scene, solids);

  furnBox(-4, 0.4, 2, 1.0, 0.8, 0.5, furnMat, scene, solids);
  const knifeProp = new THREE.Group();
  knifeProp.position.set(-4, 0.82, 2);
  const kBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.3, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.3, metalness: 0.8 })
  );
  kBlade.rotation.z = Math.PI / 2;
  kBlade.position.x = 0.14;
  knifeProp.add(kBlade);
  const kHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.03, 0.14, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a1f18, roughness: 0.8 })
  );
  kHandle.rotation.z = Math.PI / 2;
  kHandle.position.x = -0.08;
  knifeProp.add(kHandle);
  scene.add(knifeProp);

  const couch = furnBox(-6.5, 0.4, -6, 3.4, 0.8, 1.3, fabricMat, scene, solids);
  const tv = furnBox(-6.5, 1.6, -7.85, 2, 1.1, 0.1, new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x111a22, roughness: 0.4 }), scene, solids);

  const clutterGroup = new THREE.Group();
  clutterGroup.visible = false;
  scene.add(clutterGroup);
  function addClutter(x, y, z, sx, sy, sz, ry) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), furnMat);
    c.position.set(x, y, z);
    c.rotation.y = ry;
    clutterGroup.add(c);
  }
  addClutter(-2.8, 0.15, -2, 0.5, 0.3, 0.5, 0.6);
  addClutter(6.5, 0.1, -1.8, 0.6, 0.2, 0.4, 1.1);
  addClutter(-8, 0.2, -2.5, 0.6, 0.4, 0.4, 0.3);
  couch.userData.originalRotY = couch.rotation.y;

  const bagGroup = new THREE.Group();
  bagGroup.visible = false;
  scene.add(bagGroup);
  function bag(x, z) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), bagMat);
    b.scale.set(1, 1.3, 1);
    b.position.set(x, 0.55, z);
    bagGroup.add(b);
  }
  bag(9.6, -3.2);
  bag(10.2, -2.7);

  const lampBedroom = new THREE.PointLight(0xffcf8a, 6, 16, 1.6);
  lampBedroom.position.set(-9, 2.8, -3);
  scene.add(lampBedroom);
  const lampLiving = new THREE.PointLight(0xffcf8a, 6, 18, 1.6);
  lampLiving.position.set(-5, 2.8, -2);
  scene.add(lampLiving);
  const lampKitchen = new THREE.PointLight(0xffe3b0, 6, 18, 1.6);
  lampKitchen.position.set(8, 2.8, -2);
  scene.add(lampKitchen);
  const lamps = [lampBedroom, lampLiving, lampKitchen];

  const bedroomZone = new THREE.Box3(
    new THREE.Vector3(-12, -1, -8),
    new THREE.Vector3(-4, 4, 4)
  );

  const roomPoints = {
    bedroomDoor: new THREE.Vector3(-4, 0, -1),
    bedroomInner: new THREE.Vector3(-9, 0, -4),
    hallway: new THREE.Vector3(0, 0, -1),
    livingRoom: new THREE.Vector3(-6.5, 0, -4.5),
    kitchen: new THREE.Vector3(8, 0, -4)
  };

  return {
    solids,
    clutterGroup,
    bagGroup,
    couch,
    lamps,
    bedroomZone,
    roomPoints,
    doorPivot,
    porchLight,
    knifeProp,
    interactables: {
      frontDoor: { pos: new THREE.Vector3(-1, 1.5, 8), range: 2.6 },
      bed: { pos: new THREE.Vector3(-9, 0.7, -5), range: 2.4 },
      kitchenTable: { pos: new THREE.Vector3(8.2, 0.9, -5), range: 2.4 },
      couch: { pos: new THREE.Vector3(-6.5, 0.8, -6), range: 2.4 },
      visitorConfront: { pos: new THREE.Vector3(8, 1, -4), range: 2.6 },
      knifeTable: { pos: new THREE.Vector3(-4, 0.8, 2), range: 2.2 }
    },
    playerStart: new THREE.Vector3(-2, 0, 3),
    outsidePos: new THREE.Vector3(-1, 0, 11.5)
  };
}

export function setMessy(world) {
  world.clutterGroup.visible = true;
  world.couch.rotation.y = world.couch.userData.originalRotY + 0.25;
}

export function spawnBags(world) {
  world.bagGroup.visible = true;
}
