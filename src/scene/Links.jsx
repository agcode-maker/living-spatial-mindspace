import { useWorld } from '../state/store.js';

export default function Links() {
  const objects = useWorld((s) => s.objects);
  const byId = Object.fromEntries(objects.map((o) => [o.id, o]));
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
        <line key={key}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([...from, ...to])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#e8e6df" transparent opacity={0.35} />
        </line>
      ))}
    </>
  );
}
