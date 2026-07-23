import Component from '../../ecs/component';
import type { InputAction } from '../../input/types';

export default class FireInput extends Component {
  action: InputAction;

  constructor(action: InputAction = 'firePrimary') {
    super();
    this.action = action;
  }
}
