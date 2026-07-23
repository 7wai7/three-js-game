import Component from '../../ecs/component';

/*
 * Визначає мінімальний інтервал між пострілами:
 * shot -> wait 100ms -> shot -> wait 100ms
 */
export default class FireRate extends Component {
  interval: number;
  remaining = 0;

  constructor(shotsPerSecond: number) {
    super();
    this.interval = 1 / shotsPerSecond;
  }

  get ready() {
    return this.remaining <= 0;
  }

  reset() {
    this.remaining = this.interval;
  }
}
