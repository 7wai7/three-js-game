import "./style.css";

import { createRenderer } from "./render/createRenderer.js";
import Engine from "./engine/engine.js";
import TestScene from "./scenes/test.scene.js";
import CarScene from "./scenes/car.scene.js";

const { renderer, camera, composer, passes } = createRenderer();
const engine = new Engine(renderer, camera, composer, passes);

engine.start(new TestScene());

// setTimeout(() => {
//   engine.setScene(new SimpleScene());
// }, 3000);

// setTimeout(() => {
//   engine.setScene(new TestScene());
// }, 6000);
