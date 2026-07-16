import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useWorld } from '../state/store.js';

export default function Links() {
  const objects = useWorld((s) => s.objects);
  const byId = useMemo(() => Object.fromEntries(objects.map((o) => [o.id, o])), [objects]);

  const seen = new Set();
  const lines = [];
  for (const obj of objects) {
    for (const targetId of obj.links) {
      const key = [obj.id, targetId].sort().join('-');
      if (seen.has(key)) continue;
      seen.add(key);
      const target = byId[targetId];
      if (!target) continue;
      lines.push({ key, from: obj.position, to: target.position });
    }
  }

  return (
    <>
      {lines.map(({ key, from, to }) => (
        // drei's Line properly updates its GPU buffer whenever `points`
        // changes - a raw <line>/<bufferGeometry> here would silently keep
        // rendering stale positions while an endpoint is being carried.
        <Line key={key} points={[from, to]} color="#e8e6df" lineWidth={1} transparent opacity={0.35} />
      ))}
    </>
  );
}
