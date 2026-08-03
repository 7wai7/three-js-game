import Component from '../../../../ecs/component';
import { RequireComponent } from '../../../../ecs/require-component';
import ShotQueue from '../../shot-queue';
import ProjectileEmitter from '../projectile-emitter';
import ProjectileSpawnQueue from '../projectile-spawn-queue';

export type ProjectileVolleyShotPatternProps = {
  groups?: number[][];
};

@RequireComponent(ShotQueue, ProjectileEmitter, ProjectileSpawnQueue)
export default class ProjectileVolleyShotPattern extends Component {
  groups: number[][] = [];
  nextGroupIndex = 0;

  constructor(props: ProjectileVolleyShotPatternProps = {}) {
    super();

    if (props.groups) {
      this.groups = props.groups.map((group) => [...group]);
    }
  }
}
