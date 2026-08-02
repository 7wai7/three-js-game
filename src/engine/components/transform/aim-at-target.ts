import * as THREE from 'three';
import Component from '../../ecs/component';

export type AimAtTargetProps = {
  targetObject?: THREE.Object3D;
  targetPosition?: THREE.Vector3;
  rotationAxis?: THREE.Vector3Like;
  forwardAxis?: THREE.Vector3Like;
  maxAngularSpeed?: number;
  enabled?: boolean;
};

export default class AimAtTarget extends Component {
  targetObject?: THREE.Object3D;
  targetPosition?: THREE.Vector3;
  rotationAxis = new THREE.Vector3(0, 1, 0);
  forwardAxis = new THREE.Vector3(0, 0, 1);
  maxAngularSpeed?: number;
  enabled = true;

  constructor(props: AimAtTargetProps = {}) {
    super();

    this.targetObject = props.targetObject;

    if (props.rotationAxis) {
      this.rotationAxis.copy(props.rotationAxis);
    }

    if (props.forwardAxis) {
      this.forwardAxis.copy(props.forwardAxis);
    }

    if (props.maxAngularSpeed !== undefined) {
      this.maxAngularSpeed = props.maxAngularSpeed;
    }

    if (props.enabled !== undefined) {
      this.enabled = props.enabled;
    }
  }
}
