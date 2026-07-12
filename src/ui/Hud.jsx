import { useEffect } from 'react';
import { useWorld } from '../state/store.js';
import { randomSpawnPoint } from '../scene/World.jsx';

const TYPE_KEYS = { Digit1: 'note', Digit2: 'task', Digit3: 'idea', Digit4: 'image' };

export default function Hud() {
  const addObject = useWorld((s) => s.addObject);
  const returnToMenu = useWorld((s) => s.returnToMenu);
  const linkFrom = useWorld((s) => s.linkFrom);
  const cancelLink = useWorld((s) => s.cancelLink);

  useEffect(() => {
    function onKeyDown(e) {
      if (TYPE_KEYS[e.code]) {
        addObject(TYPE_KEYS[e.code], randomSpawnPoint());
      }
      if (e.code === 'Escape') {
        if (linkFrom) cancelLink();
        else returnToMenu();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [addObject, returnToMenu, linkFrom, cancelLink]);

  return (
    <>
      <div className="crosshair" />
      <div className="hint">
        WASD move · space/shift up/down · click to look around{'\n'}
        1 note · 2 task · 3 idea · 4 image · shift+click two objects to link · esc menu
        {linkFrom && ' — linking: click a second object'}
      </div>
    </>
  );
}
