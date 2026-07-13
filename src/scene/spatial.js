import * as THREE from 'three';

export function pointInFrontOfCamera(camera, distance = 2) {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const pos = camera.position.clone().add(dir.multiplyScalar(distance));
  return [pos.x, pos.y, pos.z];
}
