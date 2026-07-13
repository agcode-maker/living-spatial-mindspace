import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useWorld } from '../state/store.js';

export default function KnowledgeObject({ obj }) {
  const meshRef = useRef();
  const targetedId = useWorld((s) => s.targetedId);
  const carryingId = useWorld((s) => s.carryingId);
  const linkFrom = useWorld((s) => s.linkFrom);
  const isTargeted = targetedId === obj.id;
  const isCarried = carryingId === obj.id;
  const isLinkSource = linkFrom === obj.id;

  // Gentle idle float when at rest - makes the space feel alive.
  // Skipped while carried, since position is being driven every frame already.
  useFrame(({ clock }) => {
    if (!meshRef.current || isCarried) return;
    const t = clock.getElapsedTime();
    meshRef.current.position.y = Math.sin(t * 0.8 + obj.position[0]) * 0.06;
  });

  const emissiveIntensity = isCarried || isLinkSource ? 1 : isTargeted ? 0.7 : 0.25;
  const scale = isTargeted || isCarried ? 1.15 : 1;

  return (
    <group position={obj.position}>
      <mesh ref={meshRef} userData={{ objId: obj.id }} scale={scale}>
        {obj.type === 'note' && <boxGeometry args={[0.5, 0.35, 0.05]} />}
        {obj.type === 'task' && <octahedronGeometry args={[0.3, 0]} />}
        {obj.type === 'idea' && <sphereGeometry args={[0.28, 16, 16]} />}
        {obj.type === 'image' && <boxGeometry args={[0.5, 0.5, 0.05]} />}
        <meshStandardMaterial
          color={obj.color}
          emissive={obj.color}
          emissiveIntensity={emissiveIntensity}
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
