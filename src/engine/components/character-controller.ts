import RAPIER from '@dimforge/rapier3d';
import Component from '../ecs/component';

export default class CharacterController extends Component {
  characterController: RAPIER.KinematicCharacterController;

  speed = 2;
  runSpeed = 6;
  turnSpeed = 6;

  verticalVelocity = 0;

  jumpForce = 11;
  gravityScale = 2;

  isGrounded = false;
  landingPredictionDistance = 1.5;

  colliderHalfHeight = 0;

  constructor(
    characterController: RAPIER.KinematicCharacterController,
    values?: Omit<Partial<CharacterController>, 'characterController'>,
  ) {
    super();
    this.characterController = characterController;

    Object.assign(this, values);
  }
}
