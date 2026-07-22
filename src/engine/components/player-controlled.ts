import Component from '../ecs/component';

export default class PlayerControlled extends Component {
  inputLayer = 'gameplay';

  constructor(inputLayer = 'gameplay') {
    super();
    this.inputLayer = inputLayer;
  }
}
