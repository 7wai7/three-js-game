import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";
import type { Group } from "three";

export default class AssetManager {
  private gltfLoader = new GLTFLoader();
  private loadedModels = new Map<string, GLTF>();
  private loadingModels = new Map<
    string,
    Promise<GLTF>
  >();

  async loadModel(path: string): Promise<GLTF> {
    const loaded = this.loadedModels.get(path);

    if (loaded) {
      return this.cloneGltf(loaded);
    }

    const loading = this.loadingModels.get(path);

    if (loading) {
      const gltf = await loading;
      return this.cloneGltf(gltf);
    }

    const promise = this.loadAndCache(path);

    this.loadingModels.set(path, promise);

    const gltf = await promise;

    this.loadingModels.delete(path);

    return this.cloneGltf(gltf);
  }

  private async loadAndCache(
    path: string,
  ): Promise<GLTF> {
    const gltf = await this.gltfLoader.loadAsync(path);
    this.loadedModels.set(path, gltf);
    return gltf;
  }

  private cloneGltf(gltf: GLTF): GLTF {
    return {
      ...gltf,
      scene: SkeletonUtils.clone(gltf.scene) as Group,
      scenes: gltf.scenes.map(
        (s) => SkeletonUtils.clone(s) as Group,
      ),
      animations: gltf.animations,
    };
  }
}