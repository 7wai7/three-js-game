import Component from '../../ecs/component';

export type CarProps = {
  engineForce: number;
  brakeForce: number;
  sideGrip: number;
  pullingForce: number;
};

export default class Car extends Component {
  engineForce = 70;
  brakeForce = 12;
  sideGrip = 17;
  pullingForce = 20;

  wheels: string[] = [];

  constructor(initialData: Partial<CarProps> = {}) {
    super();
    Object.assign(this, initialData);
  }
}
