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

        if (!object) {
            super.destroyEntity(entity);
            return;
        }

        const entitiesToDestroy = new Set<EntityId>();

        object.traverse((child) => {
            if (this.gameObjects.has(child.uuid)) {
                entitiesToDestroy.add(child.uuid);
            }
        });

        object.removeFromParent();

        for (const entityToDestroy of entitiesToDestroy) {
            this.gameObjects.delete(entityToDestroy);
        }

        for (const entityToDestroy of entitiesToDestroy) {
            super.destroyEntity(entityToDestroy);
        }
    }

    destroyGameObject(object: THREE.Object3D) {
        this.destroyEntity(object.uuid);
    }

    getChildEntities(
        entity: EntityId,
        recursive = false,
    ): EntityId[] {
        const object = this.getGameObject(entity);
        return this.getChildEntitiesFromObject(object, recursive);
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

    getChildEntitiesFromObject(
        object: THREE.Object3D,
        recursive = false,
    ): EntityId[] {
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

    getChildComponentsFromObject<T extends Component>(
        gameObject: THREE.Object3D,
        componentClass: ComponentClass<T>,
        recursive = true,
    ): T[] {
        const result: T[] = [];

        for (const child of this.getChildEntitiesFromObject(gameObject, recursive)) {
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

    getParentEntities(entity: EntityId): EntityId[] {
        const object = this.getGameObject(entity);
        const result: EntityId[] = [];

        let parent = object.parent;

        while (parent) {
            if (this.gameObjects.has(parent.uuid)) {
                result.push(parent.uuid);
            }

            parent = parent.parent;
        }

        return result;
    }

    getParentComponent<T extends Component>(
        entity: EntityId,
        componentClass: ComponentClass<T>,
    ): T | undefined {
        for (const parentEntity of this.getParentEntities(entity)) {
            const component = this.getComponent(
                parentEntity,
                componentClass,
            );

            if (component) {
                return component;
            }
        }
    }
}
