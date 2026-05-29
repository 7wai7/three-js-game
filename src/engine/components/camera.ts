import type { Camera } from "three";
import Object3DComponent from "./object";

export default class CameraComponent extends Object3DComponent<Camera> {
    constructor(camera: Camera) {
        super(camera);
    }
}