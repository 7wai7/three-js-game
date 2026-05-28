import AnimationComponent from "../components/animation";
import Query from "../ecs/query";
import System from "./system";

export default class AnimationsSystem extends System {
    update(): void {
        const entities = Query.entitiesWith(
            this.world,
            AnimationComponent
        );

        for (const entity of entities) {
            const mixer = this.world.getComponent(entity, AnimationComponent)!.mixer;
            mixer.update(this.engine.deltaTime);
        }
    }

    async loadAnimation(entity: number, name: string, path: string) {
        const anim = this.world.getComponent(entity, AnimationComponent);
        if (!anim) {
            console.warn(`Entity ${entity} has no animation component`);
            return;
        }

        const gltf = await this.assets.gltf.loadModel(path);

        if (gltf.animations.length === 0) {
            console.error(`No animations in ${path}`);
            return;
        }

        const clip = gltf.animations[0];
        anim.actions[name] = anim.mixer.clipAction(clip);
    }

    playAnimation(entity: number, name: string) {
        const anim = this.world.getComponent(entity, AnimationComponent);
        if (!anim) {
            console.warn(`Entity ${entity} has no animation component`);
            return;
        }

        const next = anim.actions[name];
        if(!next) {
            console.warn(`Animation "${name}" not found`);
            return;
        }

        if (next === anim.currentAction) return;

        next.reset().fadeIn(0.2).play();
        anim.currentAction?.fadeOut(0.2);
        anim.currentAction = next;
    }
}