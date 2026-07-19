import Animation from '../components/animation';
import System from './system';
import * as THREE from 'three';

export default class AnimationsSystem extends System {
  postUpdate(): void {
    const entities = this.world.entitiesWith(Animation);

    for (const entity of entities) {
      const anim = this.world.getComponent(entity, Animation)!;
      const mixer = anim.mixer;
      mixer.update(this.engine.deltaTime);

      this.playAnimation(anim);
    }
  }

  async loadAnimation(entity: string, name: string, path: string) {
    const anim = this.world.getComponent(entity, Animation);
    if (!anim) {
      console.warn(`Entity ${entity} has no animation component`);
      return;
    }

    try {
      const gltf = await this.assets.gltf.loadModel(path);

      if (gltf.animations.length === 0) {
        console.error(`No animations in ${path}`);
        return;
      }

      const clip = gltf.animations[0];
      anim.actions[name] = anim.mixer.clipAction(clip);
    } catch {
      console.error(`Failed to load gltf scene for animation ${name} by path ${path}`);
    }
  }

  private playAnimation(anim: Animation) {
    if (!anim.requestedAnimationName || anim.currentAnimation === anim.requestedAnimationName)
      return;

    const next = anim.actions[anim.requestedAnimationName];
    if (!next) {
      console.warn(`Animation "${anim.requestedAnimationName}" not found`);
      return;
    }

    if (next === anim.currentAction) return;
    anim.currentAnimation = anim.requestedAnimationName;

    next.reset().fadeIn(anim.requestedFadeTime).play();
    anim.currentAction?.fadeOut(anim.requestedFadeTime);
    anim.currentAction = next;

    if (!anim.requestedLoop) {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    }

    anim.clearAnimationRequest();
  }
}
