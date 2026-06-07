import { Vector3 } from "three";
import Component from "../../ecs/component";

export default class CarComponent extends Component {
    inputMoveDir = new Vector3();
    inputBrake = false;

    engineForce = 70;
    maxSpeed = 20;
    brakeForce = 12;
    sideGrip = 17;
    pullingGrip = 20;

    wheels: number[] = [];
}