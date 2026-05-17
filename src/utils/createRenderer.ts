import * as THREE from "three";

export function createRenderer() {
  let screenResolution = new THREE.Vector2(
    window.innerWidth,
    window.innerHeight,
  );
  let renderResolution = screenResolution.clone().divideScalar(1);
  renderResolution.x |= 0;
  renderResolution.y |= 0;

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.shadowMap.enabled = true;
  renderer.setSize(screenResolution.x, screenResolution.y);
  document.body.appendChild(renderer.domElement);

  return renderer;
}
