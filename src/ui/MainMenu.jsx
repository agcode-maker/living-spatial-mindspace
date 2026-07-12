import { useWorld } from '../state/store.js';

export default function MainMenu() {
  const enterWorld = useWorld((s) => s.enterWorld);
  const resetWorld = useWorld((s) => s.resetWorld);
  const objectCount = useWorld((s) => s.objects.length);

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
      {objectCount > 0 && (
        <button
          className="menu-btn"
          onClick={() => {
            if (confirm('Reset your entire space? This cannot be undone.')) resetWorld();
          }}
        >
          Reset space
        </button>
      )}
    </div>
  );
}
