import * as THREE from 'three';
import Component from '../../ecs/component';
import type { EntityId } from '../../ecs/types';

export type OrbitFollowCameraProps = Partial<{
  targetEntity: EntityId;
  targetPosition: THREE.Vector3;
  mouseSensitivity: number;
  lookAtOffset: THREE.Vector3;
  distance: number;
  minDistance: number;
  maxDistance: number;
  zoomStep: number;
  yaw: number;
  pitch: number;
  rotationSmoothness: number;
}>;

export default class OrbitFollowCamera extends Component {
  targetEntity?: EntityId;
  readonly targetPosition = new THREE.Vector3();
  readonly lookAtOffset = new THREE.Vector3();

  mouseSensitivity = 0.01;

  distance = 10;
  minDistance = 2;
  maxDistance = 20;
  zoomStep = 0.3;

  yaw = 0;
  pitch = THREE.MathUtils.degToRad(-20);

  rotationSmoothness = 10;
  readonly currentRotation = new THREE.Quaternion();
  hasCurrentRotation = false;

  constructor(props: OrbitFollowCameraProps = {}) {
    super();

    if (props.targetEntity !== undefined) this.targetEntity = props.targetEntity;
    if (props.targetPosition) this.targetPosition.copy(props.targetPosition);
    if (props.lookAtOffset) this.lookAtOffset.copy(props.lookAtOffset);
    if (props.mouseSensitivity !== undefined) this.mouseSensitivity = props.mouseSensitivity;
    if (props.distance !== undefined) this.distance = props.distance;
    if (props.minDistance !== undefined) this.minDistance = props.minDistance;
    if (props.maxDistance !== undefined) this.maxDistance = props.maxDistance;
    if (props.zoomStep !== undefined) this.zoomStep = props.zoomStep;
    if (props.yaw !== undefined) this.yaw = props.yaw;
    if (props.pitch !== undefined) this.pitch = props.pitch;
    if (props.rotationSmoothness !== undefined) this.rotationSmoothness = props.rotationSmoothness;
  }
}
