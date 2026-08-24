export type AppState = 'menu' | 'game';
export type SceneMode = 'play' | 'inspect';

export default class ModeManager {
  private _appState: AppState = 'game';
  private _sceneMode: SceneMode = 'play';

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

    this._sceneMode = 'inspect';
    return true;
  }

  exitInspectMode() {
    this._sceneMode = 'play';
    return true;
  }

  toggleInspectMode() {
    return this.isInspectMode ? this.exitInspectMode() : this.enterInspectMode();
  }
}
