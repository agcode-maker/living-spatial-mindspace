import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorld } from '../state/store.js';
import { summarizeSessionStart } from '../ai/curatorAgent.js';

const WANDER_SPEED = 0.6;
const WANDER_RADIUS = 3.5;

function randomWanderTarget() {
  const angle = Math.random() * Math.PI * 2;
  const radius = 1 + Math.random() * WANDER_RADIUS;
  return new THREE.Vector3(Math.cos(angle) * radius, 1.6 + Math.random() * 1.2, Math.sin(angle) * radius);
}

export default function CuratorEntity() {
  const groupRef = useRef();
  const target = useRef(randomWanderTarget());
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
    const pos = groupRef.current.position;

    // Wander gently unless the chat panel is open (pause and "listen").
    if (!curatorChatOpen) {
      const dist = pos.distanceTo(target.current);
      if (dist < 0.15) target.current = randomWanderTarget();
      pos.lerp(target.current, Math.min(1, WANDER_SPEED * delta));
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
