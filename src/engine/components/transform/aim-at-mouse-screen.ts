import Component from '../../ecs/component';
import { RequireComponent } from '../../ecs/require-component';
import { GROUP_PLAYER, GROUP_WORLD, interactionGroups } from '../../game/physics-groups';
import AimAtTarget from './aim-at-target';

export type AimAtMouseScreenProps = {
  maxDistance?: number;
  filterGroups?: number;
  solid?: boolean;
  enabled?: boolean;
};

@RequireComponent(AimAtTarget)
export default class AimAtMouseScreen extends Component {
  maxDistance = 1000;
  filterGroups = interactionGroups(GROUP_PLAYER, GROUP_WORLD);
  solid = false;
  enabled = true;

  constructor(props: AimAtMouseScreenProps = {}) {
    super();

    if (props.maxDistance !== undefined) {
      this.maxDistance = props.maxDistance;
    }

    if (props.filterGroups !== undefined) {
      this.filterGroups = props.filterGroups;
    }

    if (props.solid !== undefined) {
      this.solid = props.solid;
    }

    if (props.enabled !== undefined) {
      this.enabled = props.enabled;
    }
  }
}
