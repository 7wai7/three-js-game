import Component from '../../../../ecs/component';
import { RequireComponent } from '../../../../ecs/require-component';
import ShotQueue from '../../shot-queue';
import ProjectileEmitter from '../projectile-emitter';
import ProjectileSpawnQueue from '../projectile-spawn-queue';

export type SingleProjectileShotPatternProps = {
  shootPointIndex?: number;
};

@RequireComponent(ShotQueue, ProjectileEmitter, ProjectileSpawnQueue)
export default class SingleProjectileShotPattern extends Component {
  shootPointIndex = 0;

  constructor(props: SingleProjectileShotPatternProps = {}) {
    super();

    if (props.shootPointIndex !== undefined) {
      this.shootPointIndex = props.shootPointIndex;
    }
  }
}
