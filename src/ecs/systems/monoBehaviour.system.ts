import type MonoBehaviourComponent from "../components/monoBehaviour.component";
import type { ComponentId } from "../ecs.types";

class MonoBehaviourSystem {
    private components = new Map<ComponentId, MonoBehaviourComponent>();

    update() {
        for (const component of this.components.values()) {
            component?.update();
        }
    }

    addComponent(component: MonoBehaviourComponent) {
        this.components.set(component.id, component);
    }

    removeComponent(component: MonoBehaviourComponent) {
        this.components.delete(component.id);
    }
}

export const monoBehaviourSystem = new MonoBehaviourSystem()