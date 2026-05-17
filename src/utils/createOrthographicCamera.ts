import * as THREE from "three";

export default function createOrthographicCamera() {
    let screenResolution = new THREE.Vector2(
        window.innerWidth,
        window.innerHeight,
    );
    let renderResolution = screenResolution.clone().divideScalar(1);
    renderResolution.x |= 0;
    renderResolution.y |= 0;
    let aspectRatio = screenResolution.x / screenResolution.y;

    const camera = new THREE.OrthographicCamera(-aspectRatio, aspectRatio, 1, -1);
    camera.position.z = -5;
    camera.position.y = 5;
    camera.zoom = 0.4;
    camera.updateProjectionMatrix()
    camera.lookAt(new THREE.Vector3(0, 1, 0));

    return camera;
}