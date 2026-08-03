import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SkeletonUtils } from 'three/examples/jsm/Addons.js';
import type { Group } from 'three';

export default class GLTFAssetManager {
  private gltfLoader = new GLTFLoader();
  private loadedModels = new Map<string, GLTF>();
  private loadingModels = new Map<string, Promise<GLTF>>();

  async preloadModel(path: string): Promise<void> {
    if (this.loadedModels.has(path)) {
      return;
    }

    const loading = this.loadingModels.get(path);

    if (loading) {
      await loading;
      return;
    }

    const promise = this.loadAndCache(path);

    this.loadingModels.set(path, promise);

    try {
      await promise;
    } finally {
      this.loadingModels.delete(path);
    }
  }

  hasModel(path: string) {
    return this.loadedModels.has(path);
  }

  getLoadedModel(path: string): GLTF | undefined {
    const loaded = this.loadedModels.get(path);
    return loaded ? this.cloneGltf(loaded) : undefined;
  }

  async loadModel(path: string): Promise<GLTF> {
    await this.preloadModel(path);

    const loaded = this.getLoadedModel(path);

    if (!loaded) {
      throw new Error(`GLTF model "${path}" was not loaded`);
    }

    return loaded;
  }

  private async loadAndCache(path: string): Promise<GLTF> {
    const gltf = await this.gltfLoader.loadAsync(path);
    this.loadedModels.set(path, gltf);
    return gltf;
  }

  private cloneGltf(gltf: GLTF): GLTF {
    return {
      ...gltf,
      scene: SkeletonUtils.clone(gltf.scene) as Group,
      scenes: gltf.scenes.map((s) => SkeletonUtils.clone(s) as Group),
      animations: gltf.animations,
    };
  }
}
