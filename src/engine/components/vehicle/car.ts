import { Vector3 } from "three";
import Component from "../../ecs/component";

export default class CarComponent extends Component {
    inputMoveDir = new Vector3();
    inputBrake = false;

    engineForce = 200;
    brakeForce = 100;
    steerTorque = 100;
    maxSpeed = 10;

    wheels: number[] = [];
    rearCenter = new Vector3();
}