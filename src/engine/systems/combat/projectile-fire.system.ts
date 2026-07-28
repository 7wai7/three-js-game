import * as THREE from 'three';
import BallisticProjectile from '../../components/combat/projectiles/ballistic-projectile';
import ProjectileEmitter, {
  DEFAULT_PROJECTILE_MODEL_PATH,
} from '../../components/combat/projectiles/projectile-emitter';
import ProjectileShotPattern from '../../components/combat/projectiles/projectile-shot-pattern';
import ShotQueue from '../../components/combat/shot-queue';
import Weapon from '../../components/combat/weapon';
import System from '../system';

export default class ProjectileFireSystem extends System {
  private readonly direction = new THREE.Vector3();

  start(): void {
    this.preloadProjectileModel(DEFAULT_PROJECTILE_MODEL_PATH);
  }

  update(): void {
    for (const [entity, shotQueue, , emitter] of this.world.query(
      ShotQueue,
      Weapon,
      ProjectileEmitter,
    )) {
      if (emitter.shootPoints.length === 0) {
        continue;
      }

      if (!this.assets.gltf.hasModel(emitter.projectileModelPath)) {
        this.preloadProjectileModel(emitter.projectileModelPath);
        continue;
      }

      const shots = shotQueue.consumeAll();
      const pattern = this.world.getComponent(entity, ProjectileShotPattern);
      const burstsPerTrigger = Math.max(pattern?.shotsPerTrigger ?? 1, 1);

      for (let shotIndex = 0; shotIndex < shots; shotIndex += 1) {
        const projectileModel = this.assets.gltf.getLoadedModel(emitter.projectileModelPath)?.scene;

        if (!projectileModel) {
          continue;
        }

        for (let burstIndex = 0; burstIndex < burstsPerTrigger; burstIndex += 1) {
          const shootPoint = this.resolveShootPoint(
            emitter,
            pattern,
            burstIndex,
            shotIndex,
            burstsPerTrigger,
          );

          if (shootPoint) {
            this.spawnProjectile(emitter, projectileModel, shootPoint);
          }
        }
      }
    }
  }

  private resolveShootPoint(
    emitter: ProjectileEmitter,
    pattern: ProjectileShotPattern | undefined,
    burstIndex: number,
    shotIndex: number,
    burstsPerTrigger: number,
  ) {
    if (pattern && pattern.shootPointIndices.length > 0) {
      const patternIndex = pattern.getShootPointIndex(shotIndex * burstsPerTrigger + burstIndex);
      if (patternIndex !== undefined) {
        return emitter.getShootPoint(patternIndex);
      }
    }

    return emitter.nextShootPoint();
  }

  private spawnProjectile(
    emitter: ProjectileEmitter,
    projectileModel: THREE.Object3D,
    shootPoint: THREE.Object3D,
  ) {
    shootPoint.updateWorldMatrix(true, false);

    const projectileObject = projectileModel.clone(true);
    shootPoint.getWorldPosition(projectileObject.position);
    shootPoint.getWorldQuaternion(projectileObject.quaternion);
    this.scene.add(projectileObject);

    this.direction.set(0, 0, 1).transformDirection(shootPoint.matrixWorld).normalize();
    const velocity = this.direction.clone().multiplyScalar(emitter.speed);
    const projectileEntity = this.world.createGameObject(projectileObject);

    this.world.addComponent(
      projectileEntity,
      new BallisticProjectile({
        velocity,
        gravity: emitter.gravity,
        drag: emitter.drag,
        lifetime: emitter.lifetime,
      }),
    );
  }

  private preloadProjectileModel(path: string) {
    this.assets.gltf.preloadModel(path).catch((error) => {
      console.error(`Failed to load projectile model "${path}"`, error);
    });
  }
}
