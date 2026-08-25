import GameHud from './game-hud.js';
import SceneInspector from './scene-inspector.js';
import { useSystemUiStore } from './stores/system-ui-store.js';

export default function GameUiRoot() {
  const sceneMode = useSystemUiStore((state) => state.sceneMode);

  return sceneMode === 'inspect' ? <SceneInspector /> : <GameHud />;
}
