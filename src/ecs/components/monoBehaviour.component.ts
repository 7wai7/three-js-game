import { monoBehaviourSystem } from "../systems/monoBehaviour.system";
import Component from "./component";

export default class MonoBehaviourComponent extends Component {
    constructor() {
        super();
        monoBehaviourSystem.addComponent(this);
    }
    
    update() { }
    
    postUpdate() { }
    
    preRender() { }
}