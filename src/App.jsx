import { useWorld } from './state/store.js';
import World from './scene/World.jsx';
import Hud from './ui/Hud.jsx';
import MainMenu from './ui/MainMenu.jsx';
import EditPanel from './ui/EditPanel.jsx';

export default function App() {
  const sessionState = useWorld((s) => s.sessionState);

  if (sessionState === 'menu') return <MainMenu />;

  return (
    <>
      <World />
      <Hud />
      <EditPanel />
    </>
  );
}
