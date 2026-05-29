import type GLTFAssetManager from "./gltf-asset-manager"
import type TextureAssetManager from "./texture-asset-manager"

export type Assets = {
    gltf: GLTFAssetManager,
    textures: TextureAssetManager
}