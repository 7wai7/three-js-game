import * as THREE from "three";
import Component from "../ecs/component";

export default class AnimationComponent extends Component {
    mixer: THREE.AnimationMixer;
    actions: Record<string, THREE.AnimationAction> = {};
    currentAction: THREE.AnimationAction | null = null;

    constructor(mixer: THREE.AnimationMixer) {
        super();
        this.mixer = mixer;
    }
}
