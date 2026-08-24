import System from './system';

export default class EditModeToggleSystem extends System {
  update(): void {
    const input = this.engine.getInputLayer('edit');

    if (input?.clicked('toggleEditMode')) {
      this.engine.mode.toggleEditMode();
    }
  }
}
