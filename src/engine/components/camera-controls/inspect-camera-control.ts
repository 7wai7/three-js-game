import Component from '../../ecs/component';

export type InspectCameraControlProps = Partial<{
  moveSpeed: number;
  fastMoveMultiplier: number;
  lookSensitivity: number;
  yaw: number;
  pitch: number;
}>;

export default class InspectCameraControl extends Component {
  moveSpeed = 12;
  fastMoveMultiplier = 4;

  lookSensitivity = 0.005;

  yaw = 0;
  pitch = 0;

  wasActive = false;

  constructor(props: InspectCameraControlProps = {}) {
    super();

    if (props.moveSpeed !== undefined) this.moveSpeed = props.moveSpeed;
    if (props.fastMoveMultiplier !== undefined) this.fastMoveMultiplier = props.fastMoveMultiplier;
    if (props.lookSensitivity !== undefined) this.lookSensitivity = props.lookSensitivity;
    if (props.yaw !== undefined) this.yaw = props.yaw;
    if (props.pitch !== undefined) this.pitch = props.pitch;
  }
}
