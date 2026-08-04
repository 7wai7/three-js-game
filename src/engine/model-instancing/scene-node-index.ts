import type { Object3D } from 'three';
import type { InstanceNodeMap, SceneRef } from './config-types';

const COLLIDER_HELPER_NAME = /^col/i;

export function isColliderHelperName(name: string) {
  return COLLIDER_HELPER_NAME.test(name);
}

export default class SceneNodeIndex {
  readonly nodesByName: InstanceNodeMap;

  constructor(nodesByName?: InstanceNodeMap) {
    this.nodesByName = nodesByName ?? new Map();
  }

  static fromModel(model: Object3D, nodesByName?: InstanceNodeMap) {
    const index = new SceneNodeIndex(nodesByName);
    index.addObjectTree(model);
    return index;
  }

  addObjectTree(root: Object3D) {
    root.traverse((object) => {
      this.addObject(object);
    });
  }

  addObject(object: Object3D) {
    if (isColliderHelperName(object.name)) {
      object.visible = false;
    }

    if (!object.name || this.nodesByName.has(object.name)) {
      return;
    }

    this.nodesByName.set(object.name, {
      source: object,
    });
  }

  get(name: SceneRef) {
    return this.nodesByName.get(name);
  }
}
