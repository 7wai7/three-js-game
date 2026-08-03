import Component from '../../../../ecs/component';
import { RequireComponent } from '../../../../ecs/require-component';
import ShotQueue from '../../shot-queue';
import ProjectileEmitter from '../projectile-emitter';
import ProjectileSpawnQueue from '../projectile-spawn-queue';

export type AlternatingProjectileShotPatternProps = {
  shootPointIndices?: number[];
  projectilesPerShot?: number;
};

@RequireComponent(ShotQueue, ProjectileEmitter, ProjectileSpawnQueue)
export default class AlternatingProjectileShotPattern extends Component {
  shootPointIndices: number[] = [];
  projectilesPerShot = 1;
  nextShootPointIndex = 0;

  constructor(props: AlternatingProjectileShotPatternProps = {}) {
    super();

    if (props.shootPointIndices) {
      this.shootPointIndices = [...props.shootPointIndices];
    }

    if (props.projectilesPerShot !== undefined) {
      this.projectilesPerShot = props.projectilesPerShot;
    }
  }
}
