import Component from "./component";

export default class MonoBehaviourComponent extends Component {
  protected override __internalInit() {
    this.engine.monoBehaviourSystem.addComponent(this);
  }

  update(): void {}
  postUpdate(): void {}
  preRender(): void {}

  override onDestroy() {
    this.engine.monoBehaviourSystem.removeComponent(this);
  }
}
