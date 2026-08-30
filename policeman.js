import * as THREE from 'three';

const uniformMat = new THREE.MeshStandardMaterial({ color: 0x18223a, roughness: 0.8 });
const skinMat = new THREE.MeshStandardMaterial({ color: 0xc79a72, roughness: 0.9 });
const capMat = new THREE.MeshStandardMaterial({ color: 0x0d1220, roughness: 0.6 });
const badgeMat = new THREE.MeshStandardMaterial({ color: 0x3a2e00, emissive: 0xd4af37, emissiveIntensity: 1.2 });

function buildPoliceman() {
  const group = new THREE.Group();

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.85, 0.3), uniformMat);
  torso.position.set(0, 1.15, 0);
  group.add(torso);

  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.02), badgeMat);
  badge.position.set(-0.15, 1.35, 0.16);
  group.add(badge);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), skinMat);
  head.position.set(0, 1.75, 0);
  group.add(head);

  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.14, 12), capMat);
  capTop.position.set(0, 1.94, 0);
  group.add(capTop);

  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 16), capMat);
  brim.position.set(0, 1.87, 0.05);
  group.add(brim);

  const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8);
  const armL = new THREE.Mesh(armGeo, uniformMat);
  armL.position.set(-0.32, 1.05, 0);
  group.add(armL);
  const armR = new THREE.Mesh(armGeo, uniformMat);
  armR.position.set(0.32, 1.05, 0);
  group.add(armR);

  const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.9, 8);
  const legL = new THREE.Mesh(legGeo, capMat);
  legL.position.set(-0.14, 0.45, 0);
  group.add(legL);
  const legR = new THREE.Mesh(legGeo, capMat);
  legR.position.set(0.14, 0.45, 0);
  group.add(legR);

  return group;
}

export class Policeman {
  constructor(scene) {
    this.group = buildPoliceman();
    this.group.visible = false;
    scene.add(this.group);
  }

  show(pos) {
    this.group.visible = true;
    if (pos) this.group.position.copy(pos);
  }

  hide() {
    this.group.visible = false;
  }

  faceToward(pos) {
    const dx = pos.x - this.group.position.x;
    const dz = pos.z - this.group.position.z;
    if (Math.hypot(dx, dz) > 0.01) this.group.rotation.y = Math.atan2(dx, dz);
  }
}
