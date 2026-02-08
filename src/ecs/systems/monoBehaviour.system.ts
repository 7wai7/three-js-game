import type MonoBehaviourComponent from "../components/monoBehaviour.component";
import type { ComponentId } from "../ecs.types";

export default class MonoBehaviourSystem {
  components = new Map<ComponentId, MonoBehaviourComponent>();

  update() {
    for (const component of this.components.values()) {
      component?.update();
    }
  }

  postUpdate() {
    for (const component of this.components.values()) {
      component?.postUpdate();
    }
  }

  preRender() {
    for (const component of this.components.values()) {
      component?.preRender();
    }
  }

  addComponent(component: MonoBehaviourComponent) {
    this.components.set(component.id, component);
  }

  removeComponent(component: MonoBehaviourComponent) {
    this.components.delete(component.id);
  }

  dispose() {
    this.components.clear();
  }
}
