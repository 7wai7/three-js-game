import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import SceneNodeIndex from '../../src/engine/model-instancing/scene-node-index';

describe('SceneNodeIndex', () => {
  it('indexes every named object in a model tree', () => {
    const root = new THREE.Group();
    root.name = 'Root';

    const mesh = new THREE.Object3D();
    mesh.name = 'Mesh';

    const shootPoint = new THREE.Object3D();
    shootPoint.name = 'ShootPoint';

    const bone = new THREE.Bone();
    bone.name = 'ArmatureBone';

    mesh.add(shootPoint);
    root.add(mesh, bone);

    const index = SceneNodeIndex.fromModel(root);

    expect(index.get('Root')?.source).toBe(root);
    expect(index.get('Mesh')?.source).toBe(mesh);
    expect(index.get('ShootPoint')?.source).toBe(shootPoint);
    expect(index.get('ArmatureBone')?.source).toBe(bone);
  });

  it('keeps prefilled nodes when names collide', () => {
    const existing = new THREE.Object3D();
    const replacement = new THREE.Object3D();
    replacement.name = 'SharedName';

    const nodesByName = new Map([
      [
        'SharedName',
        {
          source: existing,
        },
      ],
    ]);

    SceneNodeIndex.fromModel(replacement, nodesByName);

    expect(nodesByName.get('SharedName')?.source).toBe(existing);
  });
});
