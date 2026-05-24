import * as THREE from "three";
import Component from "../ecs/component";

export default class Object3DComponent extends Component {
    object: THREE.Object3D;

    constructor(object: THREE.Object3D) {
        super();
        this.object = object;
    }
}