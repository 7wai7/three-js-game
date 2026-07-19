import * as THREE from 'three';

export default class TextureAssetManager {
  private loader = new THREE.TextureLoader();

  private loaded = new Map<string, THREE.Texture>();
  private loading = new Map<string, Promise<THREE.Texture>>();

  async load(path: string): Promise<THREE.Texture> {
    const cached = this.loaded.get(path);

    if (cached) {
      return cached.clone();
    }

    const loading = this.loading.get(path);

    if (loading) {
      const texture = await loading;
      return texture.clone();
    }

    const promise = this.loader.loadAsync(path);

    this.loading.set(path, promise);

    const texture = await promise;

    this.loading.delete(path);

    this.loaded.set(path, texture);

    return texture.clone();
  }
}
