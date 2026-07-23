import Component from '../../ecs/component';

export default class FireControl extends Component {
  active = false;
  started = false;
  stopped = false;
  blocked = false;

  resetFrame() {
    this.started = false;
    this.stopped = false;
    this.blocked = false;
  }

  setActive(active: boolean) {
    this.started = active && !this.active;
    this.stopped = !active && this.active;
    this.active = active;
  }

  block() {
    this.blocked = true;
  }

  get canFire() {
    return this.active && !this.blocked;
  }
}
