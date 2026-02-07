import * as THREE from "three";
import GameScene from "./gameScene";
import pixelTex from "../utils/pixelTex";
import { stopGoEased } from "../utils/math";

export default class SimpleScene extends GameScene {
  crystalMesh?: THREE.Mesh<
    THREE.IcosahedronGeometry,
    THREE.MeshPhongMaterial,
    THREE.Object3DEventMap
  >;

  protected init() {
    this.background = new THREE.Color(0x202025);

    const texLoader = new THREE.TextureLoader();
    const tex_checker = pixelTex(
      texLoader.load(
        "https://threejsfundamentals.org/threejs/resources/images/checker.png",
      ),
    );
    const tex_checker2 = pixelTex(
      texLoader.load(
        "https://threejsfundamentals.org/threejs/resources/images/checker.png",
      ),
    );
    tex_checker.repeat.set(3, 3);
    tex_checker2.repeat.set(1.5, 1.5);

    let boxMaterial = new THREE.MeshPhongMaterial({ map: tex_checker2 });
    // let boxMaterial = new THREE.MeshPhongMaterial()

    this.addBox(0.4, 0, 0, Math.PI / 4, boxMaterial);
    this.addBox(0.2, -0.4, -0.15, Math.PI / 4, boxMaterial);

    const planeSideLength = 2;
    let planeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(planeSideLength, planeSideLength),
      new THREE.MeshPhongMaterial({
        map: tex_checker,
      }),
    );
    planeMesh.receiveShadow = true;
    planeMesh.rotation.x = -Math.PI / 2;
    this.add(planeMesh);

    const radius = 0.2;
    const geometry = new THREE.IcosahedronGeometry(radius);
    this.crystalMesh = new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({
        color: 0x2379cf,
        emissive: 0x143542,
        shininess: 100,
        specular: 0xffffff,
        opacity: 0.5,
      }),
    );
    this.crystalMesh.receiveShadow = true;
    this.crystalMesh.castShadow = true;
    this.add(this.crystalMesh);

    // Lights
    this.add(new THREE.AmbientLight(0x2d3645, 10.5));

    let directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    this.add(directionalLight);

    let spotLight = new THREE.SpotLight(
      0xff8800,
      10,
      10,
      Math.PI / 16,
      0.02,
      2,
    );
    spotLight.position.set(2, 2, 0);
    let target = spotLight.target;
    this.add(target);
    target.position.set(0, 0, 0);
    spotLight.castShadow = true;
    this.add(spotLight);
  }

  update() {
    this.animateCrystalMesh();
  }

  animateCrystalMesh() {
    if (!this.crystalMesh) return;

    let t = performance.now() / 1000;

    let mat = this.crystalMesh.material as THREE.MeshPhongMaterial;
    mat.emissiveIntensity = Math.sin(t * 3) * 0.5 + 0.5;
    this.crystalMesh.position.y = 0.7 + Math.sin(t * 2) * 0.05;
    this.crystalMesh.rotation.y = stopGoEased(t, 2, 4) * 2 * Math.PI;
  }

  addBox(
    boxSideLength: number,
    x: number,
    z: number,
    rotation: number,
    boxMaterial: THREE.MeshPhongMaterial,
  ) {
    let mesh = new THREE.Mesh(
      new THREE.BoxGeometry(boxSideLength, boxSideLength, boxSideLength),
      boxMaterial,
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.y = rotation;
    mesh.position.y = boxSideLength / 2;
    mesh.position.set(x, boxSideLength / 2 + 0.0001, z);
    this.add(mesh);
    return mesh;
  }
}
