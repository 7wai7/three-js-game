import Component from '../../../ecs/component';

export type ProjectileShotPatternProps = {
  shotsPerTrigger?: number;
  shootPointIndices?: number[];
  loop?: boolean;
};

export default class ProjectileShotPattern extends Component {
  shotsPerTrigger = 1;
  shootPointIndices: number[] = [];
  loop = true;

  constructor(props: ProjectileShotPatternProps = {}) {
    super();

    if (props.shotsPerTrigger !== undefined) {
      this.shotsPerTrigger = props.shotsPerTrigger;
    }

    if (props.shootPointIndices) {
      this.shootPointIndices = [...props.shootPointIndices];
    }

    if (props.loop !== undefined) {
      this.loop = props.loop;
    }
  }

  getShootPointIndex(sequenceIndex: number) {
    if (this.shootPointIndices.length === 0) {
      return undefined;
    }

    if (!this.loop && sequenceIndex >= this.shootPointIndices.length) {
      return this.shootPointIndices[this.shootPointIndices.length - 1];
    }

    return this.shootPointIndices[sequenceIndex % this.shootPointIndices.length];
  }
}
