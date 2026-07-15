import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useWorld } from '../state/store.js';

// How long (in minutes) an untouched object takes to fade to its dim
// resting glow - this is the "living memory" system: notes you keep
// revisiting or connecting stay bright, ones you forget slowly dim.
const DECAY_MINUTES = 8;

export default function KnowledgeObject({ obj }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const targetedId = useWorld((s) => s.targetedId);
  const carryingId = useWorld((s) => s.carryingId);
  const linkFrom = useWorld((s) => s.linkFrom);
  const isTargeted = targetedId === obj.id;
  const isCarried = carryingId === obj.id;
  const isLinkSource = linkFrom === obj.id;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    if (!isCarried) {
      meshRef.current.position.y = Math.sin(t * 0.8 + obj.position[0]) * 0.06;
    }

    // Living memory glow: fresh/well-connected objects burn bright,
    // forgotten ones settle to a dim ember.
    const ageMinutes = (Date.now() - (obj.lastTouched ?? obj.createdAt)) / 60000;
    const recency = Math.max(0, 1 - ageMinutes / DECAY_MINUTES);
    const connectivity = Math.min(1, obj.links.length * 0.25);
    const restingGlow = 0.12 + recency * 0.35 + connectivity * 0.35;

    const targetIntensity = isCarried || isLinkSource ? 1 : isTargeted ? Math.max(0.7, restingGlow) : restingGlow;
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        targetIntensity,
        0.08
      );
    }
  });

  const scale = isTargeted || isCarried ? 1.15 : 1;

  return (
    <group position={obj.position}>
      <mesh ref={meshRef} userData={{ objId: obj.id }} scale={scale}>
        {obj.type === 'note' && <boxGeometry args={[0.5, 0.35, 0.05]} />}
        {obj.type === 'task' && <octahedronGeometry args={[0.3, 0]} />}
        {obj.type === 'idea' && <sphereGeometry args={[0.28, 16, 16]} />}
        {obj.type === 'image' && <boxGeometry args={[0.5, 0.5, 0.05]} />}
        <meshStandardMaterial
          ref={materialRef}
          color={obj.color}
          emissive={obj.color}
          emissiveIntensity={0.25}
          roughness={0.4}
        />
      </mesh>
      <Text
        position={[0, -0.36, 0]}
        fontSize={0.1}
        color="#e8e6df"
        anchorX="center"
        anchorY="top"
        maxWidth={1.2}
      >
        {obj.label}
      </Text>
    </group>
  );
}
