import { useEffect } from 'react';
import { useWorld } from '../state/store.js';

export default function Hud() {
  const returnToMenu = useWorld((s) => s.returnToMenu);
  const linkFrom = useWorld((s) => s.linkFrom);
  const cancelLink = useWorld((s) => s.cancelLink);
  const toggleViewMode = useWorld((s) => s.toggleViewMode);
  const viewMode = useWorld((s) => s.viewMode);

  useEffect(() => {
    function onKeyDown(e) {
      if (useWorld.getState().editingId || useWorld.getState().curatorChatOpen) return;
      if (e.code === 'KeyC') {
        document.exitPointerLock?.();
        toggleViewMode();
        return;
      }
      if (e.code === 'Escape') {
        if (linkFrom) cancelLink();
        else returnToMenu();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [returnToMenu, linkFrom, cancelLink, toggleViewMode]);

  return (
    <>
      {viewMode === 'first-person' && <div className="crosshair" />}
      <div className="hint">
        {viewMode === 'first-person' ? (
          <>
            WASD move · space/shift up/down · click to look around{'\n'}
            1 note · 2 task · 3 idea · 4 image · E pick up/drop · L link · R rename · backspace delete{'\n'}
            G ask curator to organize · T talk to curator · C constellation view · esc menu
            {linkFrom && ' — linking: look at a second object and press L'}
          </>
        ) : (
          <>drag to orbit · scroll to zoom · C back to first-person · esc menu</>
        )}
      </div>
    </>
  );
}
