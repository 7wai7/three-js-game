import * as THREE from "three";
import Component from "../ecs/component";

export default class MeshComponent extends Component {
    mesh: THREE.Object3D;

    constructor(mesh: THREE.Object3D) {
        super();
        this.mesh = mesh;
    }
}