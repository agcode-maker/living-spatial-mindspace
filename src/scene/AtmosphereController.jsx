import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorld } from '../state/store.js';

const WARM = new THREE.Color('#ffb454');
const COLD = new THREE.Color('#5a6a9a');

export default function AtmosphereController({ ambientRef, pointRef }) {
  const { scene } = useThree();

  useFrame((_, delta) => {
    const objects = useWorld.getState().objects;
    if (objects.length === 0) return;

    // A rough "organization" score: how connected the space is relative
    // to how many objects are in it. 0 = cluttered/disconnected,
    // 1 = well-linked knowledge graph.
    const totalLinks = objects.reduce((sum, o) => sum + o.links.length, 0);
    const organization = Math.min(1, totalLinks / (objects.length * 1.5));

    const lerpSpeed = delta * 0.5;

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        0.25 + organization * 0.25,
        lerpSpeed
      );
    }

    if (pointRef.current) {
      pointRef.current.intensity = THREE.MathUtils.lerp(
        pointRef.current.intensity,
        0.8 + organization * 0.8,
        lerpSpeed
      );
      pointRef.current.color.lerp(organization > 0.5 ? WARM : COLD, delta * 0.3);
    }

    if (scene.fog) {
      scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, 18 + organization * 16, lerpSpeed);
    }
  });

  return null;
}
