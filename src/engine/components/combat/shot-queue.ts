import Component from '../../ecs/component';

export default class ShotQueue extends Component {
  count = 0;

  enqueue(amount = 1) {
    this.count += amount;
  }

  consumeAll() {
    const count = this.count;
    this.count = 0;
    return count;
  }
}
