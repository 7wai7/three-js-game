import Component from '../../ecs/component';

/*
 * Визначає мінімальний інтервал між пострілами:
 * shot -> wait 100ms -> shot -> wait 100ms
 */
export default class FireRate extends Component {
  interval: number;
  accumulated: number;

  constructor(shotsPerSecond: number) {
    super();
    this.interval = 1 / shotsPerSecond;
    this.accumulated = this.interval;
  }

  get ready() {
    return this.accumulated >= this.interval;
  }

  tick(dt: number) {
    this.accumulated += dt;
  }

  holdReady() {
    this.accumulated = Math.min(this.accumulated, this.interval);
  }

  consumeReadyShots(maxShots = Number.POSITIVE_INFINITY) {
    const readyShots = Math.floor(this.accumulated / this.interval);
    const shots = Math.min(readyShots, maxShots);

    this.accumulated -= shots * this.interval;

    return shots;
  }

  clear() {
    this.accumulated = 0;
  }
}
