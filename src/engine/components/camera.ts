import type { Camera as ThreeCamera } from "three";
import Object3D from "./object";

export default class Camera extends Object3D<ThreeCamera> {
    constructor(camera: ThreeCamera) {
        super(camera);
    }
}