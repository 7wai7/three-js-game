import { Object3D } from 'three';
import { getObjectSizeBox3 } from './get-object-size';

export default function getUniformScale(object: Object3D, desiredHeight: number) {
  const size = getObjectSizeBox3(object);
  const currentHeight = Math.max(size.y, 0.0001);
  return desiredHeight / currentHeight;
}
