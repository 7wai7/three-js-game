import Component from '../../ecs/component';

export default class Magazine extends Component {
  ammo: number;
  capacity: number;

  constructor(capacity: number) {
    super();

    this.capacity = capacity;
    this.ammo = capacity;
  }

  get empty() {
    return this.ammo <= 0;
  }

  consume(amount = 1) {
    if (this.ammo < amount) return false;

    this.ammo -= amount;
    return true;
  }

  consumeAvailable(amount: number) {
    const consumed = Math.min(this.ammo, amount);
    this.ammo -= consumed;
    return consumed;
  }
}
