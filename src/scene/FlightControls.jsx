import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useWorld } from '../state/store.js';

const SPEED = 4.2;

export default function FlightControls() {
  const controlsRef = useRef();
  const { camera } = useThree();
  const keys = useRef({});

  useEffect(() => {
    const down = (e) => (keys.current[e.code] = true);
    const up = (e) => (keys.current[e.code] = false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const move = new THREE.Vector3();

  useFrame((_, delta) => {
    if (useWorld.getState().editingId) return;
    const k = keys.current;
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, camera.up).normalize();

    move.set(0, 0, 0);
    if (k['KeyW']) move.add(forward);
    if (k['KeyS']) move.sub(forward);
    if (k['KeyD']) move.add(right);
    if (k['KeyA']) move.sub(right);
    if (k['Space']) move.y += 1;
    if (k['ShiftLeft']) move.y -= 1;

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(SPEED * delta);
      camera.position.add(move);
      camera.position.y = Math.max(1, camera.position.y);
    }
  });

  return <PointerLockControls ref={controlsRef} />;
}
