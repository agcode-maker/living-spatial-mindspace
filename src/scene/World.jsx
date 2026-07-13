import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { useWorld } from '../state/store.js';
import FlightControls from './FlightControls.jsx';
import KnowledgeObject from './KnowledgeObject.jsx';
import Links from './Links.jsx';
import Interactions from './Interactions.jsx';

export default function World() {
  const objects = useWorld((s) => s.objects);

  return (
    <Canvas camera={{ position: [0, 1.6, 6], fov: 65 }} shadows>
      <color attach="background" args={['#05060a']} />
      <fog attach="fog" args={['#05060a', 8, 30]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 4, 0]} intensity={1.1} color="#7ea8ff" distance={20} decay={2} />
      <hemisphereLight args={['#1a2440', '#05060a', 0.4]} />

      <Grid
        args={[40, 40]}
        cellColor="#1a1c26"
        sectionColor="#2a2d3a"
        fadeDistance={20}
        infiniteGrid
      />

      <Links />
      {objects.map((obj) => (
        <KnowledgeObject key={obj.id} obj={obj} />
      ))}

      <Interactions />
      <FlightControls />
    </Canvas>
  );
}
