import Component from '../../../ecs/component';

export type ProjectileSpawnRequest = {
  shootPointIndex: number;
};

export default class ProjectileSpawnQueue extends Component {
  requests: ProjectileSpawnRequest[] = [];

  enqueue(shootPointIndex = 0) {
    this.requests.push({ shootPointIndex });
  }

  consumeAll() {
    const requests = this.requests;
    this.requests = [];
    return requests;
  }

  get count() {
    return this.requests.length;
  }
}
