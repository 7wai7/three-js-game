import { Box3, Object3D, Vector3 } from "three";

export default function getUniformScale(
    object: Object3D,
    desiredHeight: number,
) {
    object.updateMatrixWorld(true);

    const box = new Box3().setFromObject(object);

    const size = new Vector3();
    box.getSize(size);

    const currentHeight = Math.max(size.y, 0.0001);

    return desiredHeight / currentHeight;
}