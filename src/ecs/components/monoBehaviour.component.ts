import Component from "./component";

export default class MonoBehaviourComponent extends Component {
  constructor() {
    super();
  }

  init() {
    this.engine.monoBehaviourSystem.addComponent(this);
  }

  update(): void {}

  postUpdate(): void {}

  preRender(): void {}

  onDestroy() {
    this.engine.monoBehaviourSystem.removeComponent(this);
  }
}
