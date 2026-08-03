import Component from '../../../ecs/component';

export type SpinUpProps = {
  spinUpTime?: number;
  spinDownTime?: number;
  minFireSpin?: number;
};

export default class SpinUp extends Component {
  value = 0;
  spinUpTime = 0.6;
  spinDownTime = 0.4;
  minFireSpin = 1;

  constructor(props: SpinUpProps = {}) {
    super();
    Object.assign(this, props);
  }

  get ready() {
    return this.value >= this.minFireSpin;
  }
}
