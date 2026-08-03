import * as THREE from 'three';
import BallisticProjectile from '../../components/combat/projectiles/ballistic-projectile';
import System from '../system';

export default class ProjectileMotionSystem extends System {
  private displacement = new THREE.Vector3();
  private scaledGravity = new THREE.Vector3();
  private readonly forward = new THREE.Vector3(0, 0, 1);
  private readonly direction = new THREE.Vector3();

  update(): void {
    for (const [entity, projectile] of this.world.query(BallisticProjectile)) {
      projectile.age += this.dt;

      if (projectile.age >= projectile.lifetime) {
        this.world.destroyEntity(entity);
        continue;
      }

      const g = this.physicsWorld.gravity;
      this.scaledGravity.set(g.x, g.y, g.z).multiplyScalar(projectile.gravityScale);
      projectile.velocity.addScaledVector(this.scaledGravity, this.dt);

      if (projectile.drag > 0) {
        projectile.velocity.multiplyScalar(Math.exp(-projectile.drag * this.dt));
      }

      this.displacement.copy(projectile.velocity).multiplyScalar(this.dt);
      projectile.gameObject.position.add(this.displacement);

      if (projectile.velocity.lengthSq() > 0) {
        this.direction.copy(projectile.velocity).normalize();
        projectile.gameObject.quaternion.setFromUnitVectors(this.forward, this.direction);
      }
    }
  }
}
