import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useWorld } from '../state/store.js';
import FlightControls from './FlightControls.jsx';
import KnowledgeObject from './KnowledgeObject.jsx';
import Links from './Links.jsx';
import Interactions from './Interactions.jsx';
import CuratorEntity from './CuratorEntity.jsx';
import ClusterPreview from './ClusterPreview.jsx';
import AtmosphereController from './AtmosphereController.jsx';

export default function World() {
  const objects = useWorld((s) => s.objects);
  const viewMode = useWorld((s) => s.viewMode);
  const ambientRef = useRef();
  const pointRef = useRef();

  return (
    <Canvas camera={{ position: [0, 1.6, 6], fov: 65 }} dpr={[1, 1.5]}>
      <color attach="background" args={['#05060a']} />
      <fog attach="fog" args={['#05060a', 8, 30]} />
      <ambientLight ref={ambientRef} intensity={0.35} />
      <pointLight ref={pointRef} position={[0, 4, 0]} intensity={1.1} color="#7ea8ff" distance={20} decay={2} />
      <hemisphereLight args={['#1a2440', '#05060a', 0.4]} />
      <AtmosphereController ambientRef={ambientRef} pointRef={pointRef} />

      <Grid
        args={[40, 40]}
        cellColor="#1a1c26"
        sectionColor="#2a2d3a"
        fadeDistance={20}
        infiniteGrid
      />

      <Links />
      <ClusterPreview />
      <CuratorEntity />
      {objects.map((obj) => (
        <KnowledgeObject key={obj.id} obj={obj} />
      ))}

      {viewMode === 'first-person' ? (
        <>
          <Interactions />
          <FlightControls />
        </>
      ) : (
        <>
          {/* A separate camera + free-orbit controls for the bird's-eye
              constellation view, so it never fights the pointer-locked
              first-person controls. */}
          <PerspectiveCamera makeDefault position={[0, 16, 8]} fov={50} />
          <OrbitControls target={[0, 0, 0]} enableDamping dampingFactor={0.08} />
        </>
      )}
    </Canvas>
  );
}
