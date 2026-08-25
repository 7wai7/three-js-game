import { setSystemUiState } from '../../ui/stores/system-ui-store';

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
    setSystemUiState({ sceneMode });

    return true;
  }
}
