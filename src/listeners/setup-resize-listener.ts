import * as THREE from 'three';

export default function setupResizeHandler(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
) {
  window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const aspect = width / height;

    renderer.setSize(width, height);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = aspect;
    } else if (camera instanceof THREE.OrthographicCamera) {
      camera.left = -aspect;
      camera.right = aspect;
    }

    camera.updateProjectionMatrix();
  });
}
