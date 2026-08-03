import Component from '../../../ecs/component';
import { RequireComponent } from '../../../ecs/require-component';
import FireRate from '../fire-rate';
import ShotQueue from '../shot-queue';

@RequireComponent(FireRate, ShotQueue)
export default class AutomaticTrigger extends Component {}
