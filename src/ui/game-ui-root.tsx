import { useEffect } from 'react';
import GameHud from './game-hud.js';
import SceneInspector from './scene-inspector.js';
import { useEngine } from './contexts/engine-react-context.js';
import {
  setPointerLocked,
  setSystemSceneMode,
  useSystemUiStore,
} from './stores/system-ui-store.js';

export default function GameUiRoot() {
  const engine = useEngine();
  const sceneMode = useSystemUiStore((state) => state.sceneMode);

  useEffect(() => {
    setSystemSceneMode(engine.mode.sceneMode);
    return engine.mode.subscribeSceneMode(setSystemSceneMode);
  }, [engine]);

  useEffect(() => {
    const syncPointerLock = () => {
      setPointerLocked(engine.input.isPointerLocked);
    };

    syncPointerLock();
    document.addEventListener('pointerlockchange', syncPointerLock);

    return () => {
      document.removeEventListener('pointerlockchange', syncPointerLock);
    };
  }, [engine]);

  return sceneMode === 'inspect' ? <SceneInspector /> : <GameHud />;
}
