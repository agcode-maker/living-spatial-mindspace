import { useEffect, useRef, useState } from 'react';
import { useWorld } from '../state/store.js';
import { askCurator } from '../ai/curatorAgent.js';

export default function CuratorChatPanel() {
  const curatorChatOpen = useWorld((s) => s.curatorChatOpen);
  const closeCuratorChat = useWorld((s) => s.closeCuratorChat);
  const objects = useWorld((s) => s.objects);
  const curatorLog = useWorld((s) => s.curatorLog);
  const setCuratorMessage = useWorld((s) => s.setCuratorMessage);
  const setCuratorBusy = useWorld((s) => s.setCuratorBusy);
  const addCuratorLog = useWorld((s) => s.addCuratorLog);
  const curatorBusy = useWorld((s) => s.curatorBusy);

  const inputRef = useRef();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (curatorChatOpen) requestAnimationFrame(() => inputRef.current?.focus());
  }, [curatorChatOpen]);

  if (!curatorChatOpen) return null;

  async function send() {
    const message = value.trim();
    if (!message || curatorBusy) return;
    setValue('');
    setCuratorBusy(true);
    const reply = await askCurator(message, objects, curatorLog);
    setCuratorMessage(reply);
    addCuratorLog(reply);
    setCuratorBusy(false);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') send();
    if (e.key === 'Escape') closeCuratorChat();
  }

  return (
    <div className="edit-panel-overlay">
      <div className="edit-panel">
        <div className="edit-panel-label">Ask the curator</div>
        <input
          ref={inputRef}
          className="edit-panel-input"
          value={value}
          placeholder="e.g. what should I focus on today?"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={curatorBusy}
        />
        <div className="edit-panel-actions">
          <button className="menu-btn edit-panel-btn" onClick={send} disabled={curatorBusy}>
            {curatorBusy ? 'Thinking…' : 'Send (Enter)'}
          </button>
          <button className="menu-btn edit-panel-btn" onClick={closeCuratorChat}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
