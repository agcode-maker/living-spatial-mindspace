import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorld } from '../state/store.js';
import { pointInFrontOfCamera } from './spatial.js';

const TYPE_KEYS = { Digit1: 'note', Digit2: 'task', Digit3: 'idea', Digit4: 'image' };
const TARGET_DISTANCE = 6; // how far the crosshair can "reach"
const CARRY_DISTANCE = 2.2; // how far in front of you a carried object hovers

export default function Interactions() {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());

  const addObject = useWorld((s) => s.addObject);
  const setTargeted = useWorld((s) => s.setTargeted);
  const targetedId = useWorld((s) => s.targetedId);
  const carryingId = useWorld((s) => s.carryingId);
  const pickUp = useWorld((s) => s.pickUp);
  const drop = useWorld((s) => s.drop);
  const moveObjectLive = useWorld((s) => s.moveObjectLive);
  const deleteObject = useWorld((s) => s.deleteObject);
  const beginOrCompleteLink = useWorld((s) => s.beginOrCompleteLink);
  const openEditor = useWorld((s) => s.openEditor);

  // Every frame: raycast straight out from the crosshair to find what's
  // being looked at, and keep any carried object glued in front of the camera.
  useFrame(() => {
    if (useWorld.getState().editingId) return;
    raycaster.current.setFromCamera({ x: 0, y: 0 }, camera);
    const hits = raycaster.current.intersectObjects(scene.children, true);
    const hit = hits.find((h) => h.object.userData?.objId && h.distance < TARGET_DISTANCE);
    setTargeted(hit ? hit.object.userData.objId : null);

    if (carryingId) {
      moveObjectLive(carryingId, pointInFrontOfCamera(camera, CARRY_DISTANCE));
    }
  });

  useEffect(() => {
    function onKeyDown(e) {
      // While the rename panel is open, let the input field handle keys -
      // don't spawn objects, move objects, or fly the camera.
      if (useWorld.getState().editingId) return;

      if (TYPE_KEYS[e.code]) {
        addObject(TYPE_KEYS[e.code], pointInFrontOfCamera(camera, 2.5));
        return;
      }
      if (e.code === 'KeyE') {
        if (carryingId) drop();
        else if (targetedId) pickUp(targetedId);
        return;
      }
      if (e.code === 'KeyL') {
        const id = carryingId ?? targetedId;
        if (id) beginOrCompleteLink(id);
        return;
      }
      if (e.code === 'Backspace' || e.code === 'Delete') {
        const id = carryingId ?? targetedId;
        if (id) deleteObject(id);
        return;
      }
      if (e.code === 'KeyR') {
        const id = carryingId ?? targetedId;
        if (!id) return;
        document.exitPointerLock?.();
        openEditor(id);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [camera, carryingId, targetedId, addObject, pickUp, drop, beginOrCompleteLink, deleteObject, openEditor]);

  return null;
}
