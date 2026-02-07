import "./style.css";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createRenderer } from "./render/createRenderer.js";
import Engine from "./engine/engine.js";
import TestScene from "./scenes/test.scene.js";

export const gltfLoader = new GLTFLoader();

const { renderer, camera, composer, passes } = createRenderer();
const engine = new Engine(renderer, camera, composer, passes);

engine.start(new TestScene());

// setTimeout(() => {
//   engine.setScene(new SimpleScene());
// }, 3000);

// setTimeout(() => {
//   engine.setScene(new TestScene());
// }, 6000);
