import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";

export default class AssetManager {
  private gltfLoader = new GLTFLoader();

  private loadedModels = new Map<string, THREE.Object3D>();

  private loadingModels = new Map<
    string,
    Promise<THREE.Object3D>
  >();

  async loadModel(path: string): Promise<THREE.Object3D> {

    const loaded = this.loadedModels.get(path);

    if (loaded) {
      return SkeletonUtils.clone(loaded);
    }

    const loading = this.loadingModels.get(path);

    if (loading) {
      const model = await loading;
      return SkeletonUtils.clone(model);
    }

    const promise = this.loadAndCache(path);

    this.loadingModels.set(path, promise);

    const model = await promise;

    this.loadingModels.delete(path);

    return SkeletonUtils.clone(model);
  }

  private async loadAndCache(
    path: string,
  ): Promise<THREE.Object3D> {

    const gltf = await this.gltfLoader.loadAsync(path);

    const model = gltf.scene;

    this.loadedModels.set(path, model);

    return model;
  }
}