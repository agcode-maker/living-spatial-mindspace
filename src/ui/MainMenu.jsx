import { useState } from 'react';
import { useWorld } from '../state/store.js';

export default function MainMenu() {
  const enterWorld = useWorld((s) => s.enterWorld);
  const resetWorld = useWorld((s) => s.resetWorld);
  const objectCount = useWorld((s) => s.objects.length);
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <div className="menu-overlay">
      <div className="menu-title">The Archive</div>
      <div className="menu-subtitle">
        {objectCount > 0
          ? `Your space has ${objectCount} object${objectCount === 1 ? '' : 's'} waiting`
          : 'An empty space, waiting to be filled'}
      </div>
      <button className="menu-btn" onClick={enterWorld}>
        {objectCount > 0 ? 'Continue' : 'Enter'}
      </button>

      {objectCount > 0 && !confirmingReset && (
        <button className="menu-btn" onClick={() => setConfirmingReset(true)}>
          Reset space
        </button>
      )}

      {confirmingReset && (
        <div className="edit-panel-actions" style={{ minWidth: 220 }}>
          <button
            className="menu-btn edit-panel-btn"
            onClick={() => {
              resetWorld();
              setConfirmingReset(false);
            }}
          >
            Yes, erase it
          </button>
          <button className="menu-btn edit-panel-btn" onClick={() => setConfirmingReset(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
