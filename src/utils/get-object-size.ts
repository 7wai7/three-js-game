import { Box3, Mesh, Object3D, Vector3 } from 'three';

export function getObjectSize(object: Object3D) {
  const geometry = (object as Mesh).geometry;

  geometry.computeBoundingBox();

  const size = new Vector3();

  geometry.boundingBox!.getSize(size);

  const scale = new Vector3();
  object.getWorldScale(scale);

  size.multiply(scale);

  return size;
}

export function getObjectSizeBox3(object: Object3D) {
  object.updateMatrixWorld(true);
  const box = new Box3().setFromObject(object);
  const size = new Vector3();
  box.getSize(size);
  return size;
}
