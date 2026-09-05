import * as THREE from 'three';

const EYE_STAND = 1.7;
const EYE_CROUCH = 0.9;
const SPEED_STAND = 4.6;
const SPEED_CROUCH = 2.2;
const RADIUS = 0.4;
const GRAVITY = -18;
const JUMP_SPEED = 6.2;

export class Player {
  constructor(camera, domElement) {
    this.holder = new THREE.Group();
    this.camera = camera;
    this.holder.add(camera);
    this.dom = domElement;

    this.holder.position.set(0, 0, 0);
    this.eyeHeight = EYE_STAND;
    this.camera.position.set(0, this.eyeHeight, 0);

    this.yaw = 0;
    this.pitch = 0;

    this.velocityY = 0;
    this.grounded = true;
    this.crouching = false;
    this.locked = false;
    this.enabled = true;

    this.keys = {};
    window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom;
    });
    window.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.look(e.movementX, e.movementY);
    });
  }

  look(dx, dy) {
    this.yaw -= dx * 0.0022;
    this.pitch -= dy * 0.0022;
    this.pitch = Math.max(-1.3, Math.min(1.3, this.pitch));
  }

  lock() { if (this.dom.requestPointerLock) this.dom.requestPointerLock(); }
  unlock() { document.exitPointerLock(); }

  teleport(pos, yaw = null) {
    this.holder.position.copy(pos);
    if (yaw !== null) this.yaw = yaw;
    this.velocityY = 0;
  }

  getFeetPos() {
    return new THREE.Vector3(this.holder.position.x, 0, this.holder.position.z);
  }

  getForward() {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }

  nearestInteractable(interactables, currentId) {
    if (!currentId) return false;
    const def = interactables[currentId];
    if (!def) return false;
    const d = this.getFeetPos().distanceTo(new THREE.Vector3(def.pos.x, 0, def.pos.z));
    return d <= def.range;
  }

  collide(x, z, solids) {
    const box = new THREE.Box3(
      new THREE.Vector3(x - RADIUS, 0.1, z - RADIUS),
      new THREE.Vector3(x + RADIUS, 1.6, z + RADIUS)
    );
    for (const s of solids) {
      if (box.intersectsBox(s)) return true;
    }
    return false;
  }

  update(dt, solids) {
    this.camera.rotation.set(0, 0, 0);
    this.holder.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    if (!this.enabled) return;

    const wantCrouch = !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'];
    this.crouching = wantCrouch;
    const targetEye = this.crouching ? EYE_CROUCH : EYE_STAND;
    this.eyeHeight += (targetEye - this.eyeHeight) * Math.min(1, dt * 10);
    this.camera.position.y = this.eyeHeight;

    const speed = this.crouching ? SPEED_CROUCH : SPEED_STAND;
    let mx = 0, mz = 0;
    if (this.keys['ArrowUp']) mz -= 1;
    if (this.keys['ArrowDown']) mz += 1;
    if (this.keys['ArrowLeft']) mx -= 1;
    if (this.keys['ArrowRight']) mx += 1;

    if (mx !== 0 || mz !== 0) {
      const len = Math.hypot(mx, mz);
      mx /= len; mz /= len;
      const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
      const worldX = mx * cos + mz * sin;
      const worldZ = mz * cos - mx * sin;

      const px = this.holder.position.x;
      const pz = this.holder.position.z;
      const nx = px + worldX * speed * dt;
      const nz = pz + worldZ * speed * dt;

      if (!this.collide(nx, pz, solids)) this.holder.position.x = nx;
      if (!this.collide(this.holder.position.x, nz, solids)) this.holder.position.z = nz;
    }

    if (this.keys['Space'] && this.grounded) {
      this.velocityY = JUMP_SPEED;
      this.grounded = false;
    }
    this.velocityY += GRAVITY * dt;
    this.holder.position.y += this.velocityY * dt;
    if (this.holder.position.y <= 0) {
      this.holder.position.y = 0;
      this.velocityY = 0;
      this.grounded = true;
    }
  }
}
