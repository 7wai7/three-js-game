import { Vector3 } from "three";
import Component from "../../ecs/component";

export type CarParameters = {
    engineForce: number,
    brakeForce: number,
    sideGrip: number,
    pullingForce: number,
}

export default class CarComponent extends Component {
    inputMoveDir = new Vector3();
    inputBrake = false;

    engineForce = 70;
    brakeForce = 12;
    sideGrip = 17;
    pullingForce = 20;

    wheels: number[] = [];

    constructor(initialData: Partial<CarParameters>) {
        super();
        Object.assign(this, initialData);
    }
}