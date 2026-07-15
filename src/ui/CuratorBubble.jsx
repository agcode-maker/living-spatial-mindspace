import { useEffect, useState } from 'react';
import { useWorld } from '../state/store.js';

export default function CuratorBubble() {
  const curatorMessage = useWorld((s) => s.curatorMessage);
  const curatorBusy = useWorld((s) => s.curatorBusy);
  const pendingClusters = useWorld((s) => s.pendingClusters);
  const acceptClusters = useWorld((s) => s.acceptClusters);
  const rejectClusters = useWorld((s) => s.rejectClusters);
  const [visible, setVisible] = useState(false);

  // Fade the caption out a while after the curator finishes speaking,
  // unless there's a pending decision waiting on the user.
  useEffect(() => {
    if (!curatorMessage) return;
    setVisible(true);
    if (pendingClusters.length > 0) return;
    const t = setTimeout(() => setVisible(false), 9000);
    return () => clearTimeout(t);
  }, [curatorMessage, pendingClusters.length]);

  if (!curatorBusy && !visible && pendingClusters.length === 0) return null;

  return (
    <div className="curator-bubble">
      <div className="curator-bubble-label">Curator</div>
      <div className="curator-bubble-text">
        {curatorBusy ? 'thinking…' : curatorMessage}
      </div>
      {pendingClusters.length > 0 && !curatorBusy && (
        <div className="curator-bubble-actions">
          <button
            className="menu-btn edit-panel-btn"
            onClick={() => {
              acceptClusters();
              setVisible(false);
            }}
          >
            Accept links (Y)
          </button>
          <button
            className="menu-btn edit-panel-btn"
            onClick={() => {
              rejectClusters();
              setVisible(false);
            }}
          >
            Dismiss (N)
          </button>
        </div>
      )}
    </div>
  );
}
