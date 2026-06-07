import Component from "../../ecs/component";

export default class WheelComponent extends Component {
    chassisEntity: number;
    
    currentSteerAngle = 0;
    maxSteerAngle = 0;
    steerInverse = false;
    isRear = false;
    isGrounded = false;

    constructor(chassisEntity: number) {
        super();
        this.chassisEntity = chassisEntity;
    }
}