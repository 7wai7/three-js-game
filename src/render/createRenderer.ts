import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import RenderPixelatedPass from "./RenderPixelatedPass";
import { UnrealBloomPass } from "three/examples/jsm/Addons.js";
import PixelatePass from "./PixelatePass";

export function createRenderer() {
  let screenResolution = new THREE.Vector2(
    window.innerWidth,
    window.innerHeight,
  );
  let renderResolution = screenResolution.clone().divideScalar(4);
  renderResolution.x |= 0;
  renderResolution.y |= 0;
  let aspectRatio = screenResolution.x / screenResolution.y;

  const camera = new THREE.OrthographicCamera(-aspectRatio, aspectRatio, 1, -1);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.shadowMap.enabled = true;
  renderer.setSize(screenResolution.x, screenResolution.y);
  document.body.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);

  // Pass створюємо БЕЗ сцени
  const pixelPass = new RenderPixelatedPass(renderResolution, null, camera);
  const bloomPass = new UnrealBloomPass(screenResolution, 0.4, 0.1, 0.9);
  const pixelatePass = new PixelatePass(renderResolution);

  composer.addPass(pixelPass);
  composer.addPass(bloomPass);
  composer.addPass(pixelatePass);

  return {
    renderer,
    camera,
    composer,
    passes: {
      pixelPass,
      bloomPass,
      pixelatePass,
    },
  };
}
