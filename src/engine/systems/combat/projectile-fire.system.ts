import * as THREE from 'three';
import BallisticProjectile from '../../components/combat/projectiles/ballistic-projectile';
import ProjectileEmitter, {
  DEFAULT_PROJECTILE_MODEL_PATH,
} from '../../components/combat/projectiles/projectile-emitter';
import ProjectileSpawnQueue from '../../components/combat/projectiles/projectile-spawn-queue';
import Weapon from '../../components/combat/weapon';
import System from '../system';

export default class ProjectileFireSystem extends System {
  private readonly direction = new THREE.Vector3();

  start(): void {
    this.preloadProjectileModel(DEFAULT_PROJECTILE_MODEL_PATH);
  }

  update(): void {
    for (const [, spawnQueue, , emitter] of this.world.query(
      ProjectileSpawnQueue,
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

      const projectileModel = this.assets.gltf.getLoadedModel(emitter.projectileModelPath)?.scene;

      if (!projectileModel) {
        continue;
      }

      const requests = spawnQueue.consumeAll();

      for (const request of requests) {
        const shootPoint = emitter.getShootPoint(request.shootPointIndex);

        if (shootPoint) {
          this.spawnProjectile(emitter, projectileModel, shootPoint);
        }
      }
    }
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
        gravityScale: emitter.gravityScale,
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
