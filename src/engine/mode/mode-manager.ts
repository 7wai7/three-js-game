export type AppState = 'menu' | 'game';
export type SceneMode = 'play' | 'inspect';
export type SceneModeListener = (sceneMode: SceneMode) => void;

export default class ModeManager {
  private _appState: AppState = 'game';
  private _sceneMode: SceneMode = 'play';
  private readonly sceneModeListeners = new Set<SceneModeListener>();

  get appState() {
    return this._appState;
  }

  get sceneMode() {
    return this._sceneMode;
  }

  get isInspectMode() {
    return this._sceneMode === 'inspect';
  }

  get isPlayMode() {
    return this._sceneMode === 'play';
  }

  canEnterInspectMode() {
    return this._appState === 'game';
  }

  subscribeSceneMode(listener: SceneModeListener) {
    this.sceneModeListeners.add(listener);

    return () => {
      this.sceneModeListeners.delete(listener);
    };
  }

  enterGame() {
    this._appState = 'game';
  }

  enterMenu() {
    this._appState = 'menu';
    this.exitInspectMode();
  }

  enterInspectMode() {
    if (!this.canEnterInspectMode()) {
      return false;
    }

    return this.setSceneMode('inspect');
  }

  exitInspectMode() {
    return this.setSceneMode('play');
  }

  toggleInspectMode() {
    return this.isInspectMode ? this.exitInspectMode() : this.enterInspectMode();
  }

  private setSceneMode(sceneMode: SceneMode) {
    if (this._sceneMode === sceneMode) {
      return true;
    }

    this._sceneMode = sceneMode;

    for (const listener of this.sceneModeListeners) {
      listener(sceneMode);
    }

    return true;
  }
}
