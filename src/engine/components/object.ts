import * as THREE from "three";
import Component from "../ecs/component";

export default class Object3DComponent<
  T extends THREE.Object3D = THREE.Object3D
> extends Component {
    object: T;

    constructor(object: T) {
        super();
        this.object = object;
    }
}