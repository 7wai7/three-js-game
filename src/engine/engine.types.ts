import type { UnrealBloomPass } from "three/examples/jsm/Addons.js";
import type PixelatePass from "../render/PixelatePass";
import type RenderPixelatedPass from "../render/RenderPixelatedPass";

export type RenderPasses = {
  pixelPass: RenderPixelatedPass;
  bloomPass: UnrealBloomPass;
  pixelatePass: PixelatePass;
};
