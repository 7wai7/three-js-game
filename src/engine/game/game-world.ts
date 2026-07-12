import * as THREE from "three";
import World from "../ecs/world";
import type { ComponentClass, EntityId } from "../ecs/types";
import type Component from "../ecs/component";

export default class GameWorld extends World {
    readonly gameObjects = new Map<EntityId, THREE.Object3D>();

    createGameObject(object: THREE.Object3D): EntityId {
        const entity = this.createEntity(object.uuid);
        this.gameObjects.set(entity, object);
        return entity;
    }

    getGameObject(entity: EntityId): THREE.Object3D {
        const object = this.gameObjects.get(entity);

        if (!object) {
            throw new Error(
                `Game object not found for entity '${entity}'`,
            );
        }

        return object;
    }

    destroyEntity(entity: EntityId) {
        const object = this.gameObjects.get(entity);

        if (object) {
            object.removeFromParent();
            this.gameObjects.delete(entity);
        }

        super.destroyEntity(entity);
    }

    getChildEntities(
        entity: EntityId,
        recursive = false,
    ): EntityId[] {
        const object = this.getGameObject(entity);
        const result: EntityId[] = [];

        if (recursive) {
            object.traverse((child) => {
                if (child === object) return;

                if (this.gameObjects.has(child.uuid)) {
                    result.push(child.uuid);
                }
            });
        } else {
            for (const child of object.children) {
                if (this.gameObjects.has(child.uuid)) {
                    result.push(child.uuid);
                }
            }
        }

        return result;
    }

    getChildComponents<T extends Component>(
        entity: EntityId,
        componentClass: ComponentClass<T>,
        recursive = true,
    ): T[] {
        const result: T[] = [];

        for (const child of this.getChildEntities(entity, recursive)) {
            const component = this.getComponent(
                child,
                componentClass,
            );

            if (component) {
                result.push(component);
            }
        }

        return result;
    }
}