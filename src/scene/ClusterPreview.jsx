import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useWorld } from '../state/store.js';

export default function ClusterPreview() {
  const objects = useWorld((s) => s.objects);
  const pendingClusters = useWorld((s) => s.pendingClusters);
  const byId = useMemo(() => Object.fromEntries(objects.map((o) => [o.id, o])), [objects]);

  return (
    <>
      {pendingClusters.map(([a, b]) => {
        const from = byId[a];
        const to = byId[b];
        if (!from || !to) return null;
        return (
          <Line
            key={`${a}-${b}`}
            points={[from.position, to.position]}
            color="#ffd77a"
            lineWidth={1.5}
            dashed
            dashSize={0.15}
            gapSize={0.1}
            transparent
            opacity={0.8}
          />
        );
      })}
    </>
  );
}
