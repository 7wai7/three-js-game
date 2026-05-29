import { Object3D } from "three";
import getObjectSize from "./get-object-size";

export default function getUniformScale(
    object: Object3D,
    desiredHeight: number,
) {
    const size = getObjectSize(object);
    const currentHeight = Math.max(size.y, 0.0001);
    return desiredHeight / currentHeight;
}