import * as THREE from "three";
import Component from "../../ecs/component";

export type WheelProps = {
    maxSteerAngleDeg?: number;
    isRear?: boolean;
    steerInverse?: boolean;
}

export default class Wheel extends Component {
    maxSteerAngle?: number;
    isRear?: boolean;
    steerInverse?: boolean;

    currentSteerAngle = 0;
    isGrounded = false;
    steerMesh!: THREE.Object3D;

    constructor(initialData: Partial<WheelProps>) {
        super();
        Object.assign(this, initialData);
        if(initialData.maxSteerAngleDeg) this.maxSteerAngle = THREE.MathUtils.DEG2RAD * initialData.maxSteerAngleDeg;
    }
}