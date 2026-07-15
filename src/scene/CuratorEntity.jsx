import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorld } from '../state/store.js';
import { summarizeSessionStart } from '../ai/curatorAgent.js';

const SEEK_SPEED = 1.4;
const IDLE_WANDER_INTERVAL = 6; // seconds between idle wander target changes
const HOVER_OFFSET = new THREE.Vector3(0.35, 0.55, 0.35);

function objectPos(obj) {
  return new THREE.Vector3(...obj.position);
}

export default function CuratorEntity() {
  const groupRef = useRef();
  const currentTarget = useRef(new THREE.Vector3(0, 2, 0));
  const idleTarget = useRef(new THREE.Vector3(0, 2, 0));
  const idleTimer = useRef(0);
  const [greeted, setGreeted] = useState(false);

  const objects = useWorld((s) => s.objects);
  const curatorLog = useWorld((s) => s.curatorLog);
  const setCuratorMessage = useWorld((s) => s.setCuratorMessage);
  const setCuratorBusy = useWorld((s) => s.setCuratorBusy);
  const addCuratorLog = useWorld((s) => s.addCuratorLog);
  const curatorChatOpen = useWorld((s) => s.curatorChatOpen);

  // Session-start greeting - fires once when the space is entered, using
  // both current objects and the persisted memory log ("contextual memory
  // across sessions").
  useEffect(() => {
    if (greeted) return;
    setGreeted(true);
    setCuratorBusy(true);
    summarizeSessionStart(objects, curatorLog).then((text) => {
      setCuratorMessage(text);
      addCuratorLog(text);
      setCuratorBusy(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const s = useWorld.getState();
    const pos = groupRef.current.position;

    if (!curatorChatOpen) {
      let desired = null;

      if (s.curatorBusy) {
        // "Thinking" - hold still rather than drifting, so busy reads
        // as deliberate rather than random.
        desired = pos.clone();
      } else if (s.pendingClusters.length > 0) {
        // Hovers directly over the connection it's proposing - the
        // movement itself points at what it means.
        const [aId, bId] = s.pendingClusters[0];
        const a = s.objects.find((o) => o.id === aId);
        const b = s.objects.find((o) => o.id === bId);
        if (a && b) {
          desired = objectPos(a).add(objectPos(b)).multiplyScalar(0.5).add(HOVER_OFFSET);
        }
      } else if (s.carryingId) {
        // Stays near whatever you're actively organizing.
        const carried = s.objects.find((o) => o.id === s.carryingId);
        if (carried) desired = objectPos(carried).add(HOVER_OFFSET);
      } else if (s.targetedId) {
        // Drifts toward whatever you're looking at - reads as "watching"
        // what you're doing rather than being on an independent loop.
        const targeted = s.objects.find((o) => o.id === s.targetedId);
        if (targeted) desired = objectPos(targeted).add(HOVER_OFFSET);
      } else {
        // Idle: drift slowly among existing objects (or the origin, if
        // the space is still empty) instead of wandering freely.
        idleTimer.current -= delta;
        if (idleTimer.current <= 0) {
          idleTimer.current = IDLE_WANDER_INTERVAL;
          if (s.objects.length > 0) {
            const pick = s.objects[Math.floor(Math.random() * s.objects.length)];
            idleTarget.current = objectPos(pick).add(HOVER_OFFSET);
          } else {
            idleTarget.current = new THREE.Vector3(0, 2, 0);
          }
        }
        desired = idleTarget.current;
      }

      if (desired) currentTarget.current.copy(desired);
      pos.lerp(currentTarget.current, Math.min(1, SEEK_SPEED * delta));
    }

    const t = performance.now() * 0.001;
    groupRef.current.children[0].scale.setScalar(1 + Math.sin(t * 2) * 0.08);
  });

  return (
    <group ref={groupRef} position={[0, 2, 0]}>
      <mesh>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshStandardMaterial color="#fff2c9" emissive="#ffd77a" emissiveIntensity={1.6} roughness={0.2} />
      </mesh>
      <pointLight color="#ffd77a" intensity={1.6} distance={4} decay={2} />
    </group>
  );
}
