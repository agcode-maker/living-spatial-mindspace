import { useEffect } from 'react';
import { useWorld } from '../state/store.js';

export default function Hud() {
  const returnToMenu = useWorld((s) => s.returnToMenu);
  const linkFrom = useWorld((s) => s.linkFrom);
  const cancelLink = useWorld((s) => s.cancelLink);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.code === 'Escape') {
        if (linkFrom) cancelLink();
        else returnToMenu();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [returnToMenu, linkFrom, cancelLink]);

  return (
    <>
      <div className="crosshair" />
      <div className="hint">
        WASD move · space/shift up/down · click to look around{'\n'}
        1 note · 2 task · 3 idea · 4 image · E pick up/drop · L link · R rename · backspace delete · esc menu
        {linkFrom && ' — linking: look at a second object and press L'}
      </div>
    </>
  );
}
