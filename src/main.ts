import "./style.css";
import { createRenderer } from "./utils/createRenderer.js";
import Engine from "./engine/engine.js";
import CarScene from "./scenes/car.scene.js";

const renderer = createRenderer();
const engine = new Engine(renderer);

engine.start(new CarScene());
