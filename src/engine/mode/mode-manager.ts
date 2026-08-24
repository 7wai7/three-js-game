export type AppState = 'menu' | 'game';
export type SceneMode = 'play' | 'edit';

export default class ModeManager {
  private _appState: AppState = 'game';
  private _sceneMode: SceneMode = 'play';

  get appState() {
    return this._appState;
  }

  get sceneMode() {
    return this._sceneMode;
  }

  get isEditMode() {
    return this._sceneMode === 'edit';
  }

  get isPlayMode() {
    return this._sceneMode === 'play';
  }

  canEnterEditMode() {
    return this._appState === 'game';
  }

  enterGame() {
    this._appState = 'game';
  }

  enterMenu() {
    this._appState = 'menu';
    this.exitEditMode();
  }

  enterEditMode() {
    if (!this.canEnterEditMode()) {
      return false;
    }

    this._sceneMode = 'edit';
    return true;
  }

  exitEditMode() {
    this._sceneMode = 'play';
    return true;
  }

  toggleEditMode() {
    return this.isEditMode ? this.exitEditMode() : this.enterEditMode();
  }
}
