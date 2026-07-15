import { useEffect } from 'react';
import { useWorld } from '../state/store.js';

export default function Onboarding() {
  const onboarded = useWorld((s) => s.onboarded);
  const helpOpen = useWorld((s) => s.helpOpen);
  const completeOnboarding = useWorld((s) => s.completeOnboarding);
  const toggleHelp = useWorld((s) => s.toggleHelp);

  const visible = !onboarded || helpOpen;

  useEffect(() => {
    if (!visible) return;
    function onKeyDown(e) {
      if (e.code === 'Enter' || e.code === 'Escape' || e.code === 'Space') {
        if (!onboarded) completeOnboarding();
        if (helpOpen) toggleHelp();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, onboarded, helpOpen, completeOnboarding, toggleHelp]);

  if (!visible) return null;

  function dismiss() {
    if (!onboarded) completeOnboarding();
    if (helpOpen) toggleHelp();
  }

  return (
    <div className="edit-panel-overlay">
      <div className="edit-panel" style={{ maxWidth: 420 }}>
        <div className="edit-panel-label">
          {onboarded ? 'Controls' : 'Welcome to The Archive'}
        </div>
        <div className="curator-bubble-text">
          {!onboarded && (
            <>
              This is a persistent 3D space for your notes, tasks, ideas, and
              images. Everything you place stays exactly where you leave it.
              <br /><br />
            </>
          )}
          <strong>WASD</strong> to move, mouse to look around.<br />
          <strong>1–4</strong> spawn a note / task / idea / image in front of you.<br />
          <strong>E</strong> picks up whatever you're looking at, <strong>E</strong> again drops it.<br />
          <strong>L</strong> links two objects, <strong>R</strong> renames, <strong>backspace</strong> deletes.<br />
          While carrying: <strong>scroll</strong> scales it, <strong>Z</strong>/<strong>X</strong> rotate it.<br />
          <strong>G</strong> asks the curator to find connections, <strong>T</strong> talks to it directly.<br />
          <strong>C</strong> pulls back to a bird's-eye view of everything.<br />
          <strong>H</strong> reopens this panel anytime.
        </div>
        <button className="menu-btn" onClick={dismiss}>
          Got it (Enter)
        </button>
      </div>
    </div>
  );
}
