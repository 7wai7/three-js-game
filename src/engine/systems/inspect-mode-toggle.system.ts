import System from './system';

export default class InspectModeToggleSystem extends System {
  update(): void {
    const input = this.engine.getInputLayer('inspect');

    if (input?.clicked('toggleInspectMode')) {
      this.engine.mode.toggleInspectMode();
    }
  }
}
