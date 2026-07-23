import Component from '../../../ecs/component';

export default class Reloadable extends Component {
  duration: number;
  remaining = 0;
  active = false;

  constructor(duration: number) {
    super();
    this.duration = duration;
  }

  start() {
    this.active = true;
    this.remaining = this.duration;
  }
}
