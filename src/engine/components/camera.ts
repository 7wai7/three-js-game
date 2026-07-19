import type { Camera as ThreeCamera } from 'three';
import Component from '../ecs/component';

export default class Camera extends Component {
  camera: ThreeCamera;

  constructor(camera: ThreeCamera) {
    super();
    this.camera = camera;
  }
}
