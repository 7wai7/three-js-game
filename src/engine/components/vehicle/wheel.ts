import Component from "../../ecs/component";

export type WheelComponentProps = {
    maxSteerAngle?: number;
    isRear?: boolean;
}

export default class WheelComponent extends Component {
    maxSteerAngle?: number;
    isRear?: boolean;

    currentSteerAngle = 0;
    steerInverse = false;
    isGrounded = false;

    constructor(initialData: Partial<WheelComponentProps>) {
        super();
        Object.assign(this, initialData);
    }
}