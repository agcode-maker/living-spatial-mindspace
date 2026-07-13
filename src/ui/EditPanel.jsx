import { useEffect, useRef, useState } from 'react';
import { useWorld } from '../state/store.js';

export default function EditPanel() {
  const editingId = useWorld((s) => s.editingId);
  const objects = useWorld((s) => s.objects);
  const updateObject = useWorld((s) => s.updateObject);
  const closeEditor = useWorld((s) => s.closeEditor);
  const inputRef = useRef();
  const [value, setValue] = useState('');

  const obj = objects.find((o) => o.id === editingId);

  useEffect(() => {
    if (obj) {
      setValue(obj.label);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  if (!editingId || !obj) return null;

  function commit() {
    if (value.trim()) updateObject(editingId, { label: value.trim() });
    closeEditor();
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') closeEditor();
  }

  return (
    <div className="edit-panel-overlay">
      <div className="edit-panel">
        <div className="edit-panel-label">Rename {obj.type}</div>
        <input
          ref={inputRef}
          className="edit-panel-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="edit-panel-actions">
          <button className="menu-btn edit-panel-btn" onClick={commit}>Save (Enter)</button>
          <button className="menu-btn edit-panel-btn" onClick={closeEditor}>Cancel (Esc)</button>
        </div>
      </div>
    </div>
  );
}
