import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useWorld } from '../state/store.js';

export default function KnowledgeObject({ obj }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const select = useWorld((s) => s.select);
  const selectedId = useWorld((s) => s.selectedId);
  const linkFrom = useWorld((s) => s.linkFrom);
  const beginOrCompleteLink = useWorld((s) => s.beginOrCompleteLink);
  const isSelected = selectedId === obj.id;
  const isLinkSource = linkFrom === obj.id;

  // Gentle idle float — makes the space feel alive rather than static.
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.position.y = obj.position[1] + Math.sin(t * 0.8 + obj.position[0]) * 0.06;
  });

  function handleClick(e) {
    e.stopPropagation();
    if (e.shiftKey) {
      beginOrCompleteLink(obj.id);
    } else {
      select(obj.id);
    }
  }

  return (
    <group position={obj.position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.12 : 1}
      >
        {obj.type === 'note' && <boxGeometry args={[0.5, 0.35, 0.05]} />}
        {obj.type === 'task' && <octahedronGeometry args={[0.3, 0]} />}
        {obj.type === 'idea' && <sphereGeometry args={[0.28, 16, 16]} />}
        {obj.type === 'image' && <boxGeometry args={[0.5, 0.5, 0.05]} />}
        <meshStandardMaterial
          color={obj.color}
          emissive={obj.color}
          emissiveIntensity={isSelected || isLinkSource ? 0.9 : hovered ? 0.5 : 0.25}
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
