import { Vector3 } from "three";
import Component from "../../ecs/component";

export default class CarComponent extends Component {
    inputMoveDir = new Vector3();
    inputBrake = false;

    engineForce = 400;
    brakeForce = 100;
    steerTorque = 100;
    maxSpeed = 20;
    sideGrip = 12;
    pullingGrip = 20;

    wheels: number[] = [];
    rearCenter = new Vector3();
    wheelsCenter = new Vector3();
}