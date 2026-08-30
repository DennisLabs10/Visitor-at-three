import * as THREE from 'three';

const skinMat = new THREE.MeshStandardMaterial({ color: 0x2e2b28, roughness: 1 });
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xaa1111, emissiveIntensity: 2 });

function buildDeformedHuman() {
  const group = new THREE.Group();

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.1, 0.32), skinMat);
  torso.position.set(0.03, 1.1, 0);
  torso.rotation.z = 0.09;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), skinMat);
  head.position.set(-0.05, 1.85, 0.02);
  head.scale.set(0.85, 1.15, 0.9);
  head.rotation.z = -0.15;
  group.add(head);

  const eyeGeo = new THREE.SphereGeometry(0.035, 6, 6);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.16, 1.88, 0.2);
  group.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.02, 1.82, 0.22);
  group.add(eyeR);

  const armLongGeo = new THREE.CylinderGeometry(0.07, 0.06, 1.35, 6);
  const armLong = new THREE.Mesh(armLongGeo, skinMat);
  armLong.position.set(-0.42, 0.95, 0.05);
  armLong.rotation.z = 0.35;
  group.add(armLong);

  const armShortGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.85, 6);
  const armShort = new THREE.Mesh(armShortGeo, skinMat);
  armShort.position.set(0.4, 1.25, -0.05);
  armShort.rotation.z = -0.5;
  group.add(armShort);

  const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 1.0, 6);
  const legL = new THREE.Mesh(legGeo, skinMat);
  legL.position.set(-0.14, 0.5, 0);
  group.add(legL);
  const legR = new THREE.Mesh(legGeo, skinMat);
  legR.position.set(0.16, 0.48, 0.03);
  legR.rotation.z = 0.05;
  group.add(legR);

  return group;
}

export class Visitor {
  constructor(scene) {
    this.scene = scene;
    this.group = buildDeformedHuman();
    this.group.visible = false;
    scene.add(this.group);

    this.light = new THREE.PointLight(0x662222, 0, 3, 2);
    this.group.add(this.light);
    this.light.position.set(0, 1.8, 0);

    this.target = null;
    this.speed = 1.6;
    this.arrived = true;

    this.patrolPoints = [];
    this.patrolIndex = 0;
    this.dwellTimer = 0;
    this.dwellTime = 2.5;
    this.patrolling = false;
    this.currentWaypointName = null;
  }

  show(pos) {
    this.group.visible = true;
    if (pos) this.group.position.copy(pos);
  }

  hide() {
    this.group.visible = false;
    this.patrolling = false;
  }

  faceToward(pos) {
    const dx = pos.x - this.group.position.x;
    const dz = pos.z - this.group.position.z;
    if (Math.hypot(dx, dz) > 0.01) this.group.rotation.y = Math.atan2(dx, dz);
  }

  moveTo(pos, speed = 1.6) {
    this.target = pos.clone();
    this.speed = speed;
    this.arrived = false;
  }

  startSearching(namedPoints, order, dwellTime = 3) {
    this.patrolPoints = order.map((n) => ({ name: n, pos: namedPoints[n] }));
    this.patrolIndex = 0;
    this.dwellTimer = 0;
    this.dwellTime = dwellTime;
    this.patrolling = true;
    this.currentWaypointName = this.patrolPoints[0].name;
    this.moveTo(this.patrolPoints[0].pos, 1.4);
  }

  stopSearching() {
    this.patrolling = false;
  }

  update(dt) {
    if (this.target && !this.arrived) {
      const p = this.group.position;
      const dx = this.target.x - p.x;
      const dz = this.target.z - p.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.15) {
        this.arrived = true;
      } else {
        const step = Math.min(dist, this.speed * dt);
        p.x += (dx / dist) * step;
        p.z += (dz / dist) * step;
        this.group.rotation.y = Math.atan2(dx, dz);
      }
    }

    if (this.patrolling && this.arrived) {
      this.dwellTimer += dt;
      if (this.dwellTimer >= this.dwellTime) {
        this.dwellTimer = 0;
        this.patrolIndex = (this.patrolIndex + 1) % this.patrolPoints.length;
        const wp = this.patrolPoints[this.patrolIndex];
        this.currentWaypointName = wp.name;
        this.moveTo(wp.pos, 1.4);
      }
    }
  }

  distanceTo(pos) {
    return Math.hypot(this.group.position.x - pos.x, this.group.position.z - pos.z);
  }
}
