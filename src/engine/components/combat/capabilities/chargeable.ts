import Component from '../../../ecs/component';

export default class Chargeable extends Component {
  duration: number;
  elapsed = 0;
  active = false;

  constructor(duration: number) {
    super();
    this.duration = duration;
  }

  get charge01() {
    return Math.min(this.elapsed / this.duration, 1);
  }
}
