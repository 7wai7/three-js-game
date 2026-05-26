import { Box3, Object3D, Vector3 } from "three";

export default function getObjectSize(object: Object3D) {
    object.updateMatrixWorld(true);
    const box = new Box3().setFromObject(object);
    const size = new Vector3();
    box.getSize(size);
    return size;
}