import Component from '../../ecs/component';
import type { InputAction } from '../../input/types';

export type FireInputMode = 'pressed' | 'clicked' | 'released';

export type FireControlProps = {
  action?: InputAction;
  mode?: FireInputMode;
};

export default class FireControl extends Component {
  active = false;
  started = false;
  stopped = false;
  blocked = false;
  action: InputAction = 'firePrimary';
  mode: FireInputMode = 'pressed';

  constructor(props: FireControlProps = {}) {
    super();

    if (props.action !== undefined) {
      this.action = props.action;
    }

    if (props.mode !== undefined) {
      this.mode = props.mode;
    }
  }

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
