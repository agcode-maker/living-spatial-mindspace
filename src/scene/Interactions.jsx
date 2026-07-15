import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorld } from '../state/store.js';
import { pointInFrontOfCamera } from './spatial.js';
import { suggestClusters } from '../ai/curatorAgent.js';

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
  const scaleObjectLive = useWorld((s) => s.scaleObjectLive);
  const rotateObjectLive = useWorld((s) => s.rotateObjectLive);
  const deleteObject = useWorld((s) => s.deleteObject);
  const beginOrCompleteLink = useWorld((s) => s.beginOrCompleteLink);
  const openEditor = useWorld((s) => s.openEditor);
  const openCuratorChat = useWorld((s) => s.openCuratorChat);
  const acceptClusters = useWorld((s) => s.acceptClusters);
  const rejectClusters = useWorld((s) => s.rejectClusters);
  const setPendingClusters = useWorld((s) => s.setPendingClusters);
  const setCuratorMessage = useWorld((s) => s.setCuratorMessage);
  const setCuratorBusy = useWorld((s) => s.setCuratorBusy);
  const addCuratorLog = useWorld((s) => s.addCuratorLog);

  // Every frame: raycast straight out from the crosshair to find what's
  // being looked at, and keep any carried object glued in front of the camera.
  useFrame(() => {
    const s = useWorld.getState();
    if (s.editingId || s.curatorChatOpen || s.helpOpen || !s.onboarded) return;
    raycaster.current.setFromCamera({ x: 0, y: 0 }, camera);
    const hits = raycaster.current.intersectObjects(scene.children, true);
    const hit = hits.find((h) => h.object.userData?.objId && h.distance < TARGET_DISTANCE);
    setTargeted(hit ? hit.object.userData.objId : null);

    if (carryingId) {
      moveObjectLive(carryingId, pointInFrontOfCamera(camera, CARRY_DISTANCE));
    }
  });

  useEffect(() => {
    async function askCuratorToOrganize() {
      const s = useWorld.getState();
      if (s.curatorBusy) return;
      setCuratorBusy(true);
      const { pairs, note } = await suggestClusters(s.objects);
      setPendingClusters(pairs);
      setCuratorMessage(
        pairs.length > 0 ? note || `I found ${pairs.length} connection(s) worth drawing.` : note || "I don't see any new connections to make right now."
      );
      addCuratorLog(note || 'Reviewed the space for connections.');
      setCuratorBusy(false);
    }

    function onKeyDown(e) {
      // While the rename panel or curator chat is open, let the input
      // field handle keys - don't spawn objects, move, or fly the camera.
      const s = useWorld.getState();
      if (s.editingId || s.curatorChatOpen || s.helpOpen || !s.onboarded) return;

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
        return;
      }
      if (e.code === 'KeyG') {
        askCuratorToOrganize();
        return;
      }
      if (e.code === 'KeyZ' || e.code === 'KeyX') {
        if (!carryingId) return;
        const obj = useWorld.getState().objects.find((o) => o.id === carryingId);
        if (!obj) return;
        const delta = e.code === 'KeyZ' ? -Math.PI / 8 : Math.PI / 8;
        rotateObjectLive(carryingId, (obj.rotationY ?? 0) + delta);
        return;
      }
      if (e.code === 'KeyT') {
        document.exitPointerLock?.();
        openCuratorChat();
        return;
      }
      if (e.code === 'KeyY') {
        if (useWorld.getState().pendingClusters.length > 0) acceptClusters();
        return;
      }
      if (e.code === 'KeyN') {
        if (useWorld.getState().pendingClusters.length > 0) rejectClusters();
      }
    }
    function onWheel(e) {
      const s = useWorld.getState();
      if (!s.carryingId || s.editingId || s.curatorChatOpen || s.helpOpen) return;
      const obj = s.objects.find((o) => o.id === s.carryingId);
      if (!obj) return;
      const next = THREE.MathUtils.clamp((obj.scale ?? 1) - e.deltaY * 0.001, 0.4, 2.5);
      scaleObjectLive(s.carryingId, next);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('wheel', onWheel);
    };
  }, [
    camera,
    carryingId,
    targetedId,
    addObject,
    pickUp,
    drop,
    beginOrCompleteLink,
    deleteObject,
    openEditor,
    openCuratorChat,
    acceptClusters,
    rejectClusters,
    setPendingClusters,
    setCuratorMessage,
    setCuratorBusy,
    addCuratorLog,
    scaleObjectLive,
    rotateObjectLive,
  ]);

  return null;
}
