import RAPIER from "@dimforge/rapier3d";
import Component from "../ecs/component";
import { Vector3 } from "three";

export default class PlayerController extends Component {
    characterController: RAPIER.KinematicCharacterController;

    inputMoveDir = new Vector3();
    speed = 2;
    runSpeed = 6;
    isRunning = false;
    turnSpeed = 6;

    verticalVelocity = 0;

    jumpForce = 11;
    gravityScale = 2;

    isGrounded = false;
    jumpRequested = false;
    landingPredictionDistance = 1.5;

    colliderHalfHeight = 0;

    constructor(
        characterController: RAPIER.KinematicCharacterController,
        values?: Omit<Partial<PlayerController>, "characterController">
    ) {
        super();
        this.characterController = characterController;
        
        Object.assign(this, values);
    }
}