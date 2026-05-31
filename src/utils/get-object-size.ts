import { Mesh, Object3D, Vector3 } from "three";

export default function getObjectSize(object: Object3D) {
    const geometry = (object as Mesh).geometry;

    geometry.computeBoundingBox();

    const size = new Vector3();

    geometry.boundingBox!.getSize(size);

    const scale = new Vector3();
    object.getWorldScale(scale);

    size.multiply(scale);

    return size;
}