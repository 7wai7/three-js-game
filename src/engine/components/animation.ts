import * as THREE from "three";
import Component from "../ecs/component";

export default class Animation extends Component {
    mixer: THREE.AnimationMixer;
    actions: Record<string, THREE.AnimationAction> = {};
    currentAction: THREE.AnimationAction | null = null;
    currentAnimation = "";

    requestedAnimationName: AnimationName | null = null;
    requestedLoop = true;
    requestedFadeTime = 0.2;
    requestedClampWhenFinished = false;


    constructor(mixer: THREE.AnimationMixer) {
        super();
        this.mixer = mixer;
    }

    requestAnimation(
        name: AnimationName,
        options: {
            loop?: boolean;
            fadeTime?: number;
            clampWhenFinished?: boolean;
        } = {},
    ) {
        this.requestedAnimationName = name;
        this.requestedLoop = options.loop ?? true;
        this.requestedFadeTime = options.fadeTime ?? 0.2;
        this.requestedClampWhenFinished =
            options.clampWhenFinished ?? false;
    }

    clearAnimationRequest() {
        this.requestedAnimationName = null;
        this.requestedLoop = true;
        this.requestedFadeTime = 0.2;
        this.requestedClampWhenFinished = false;
    }
}

export type AnimationName =
    "Idle" |
    "Walk" |
    "Run" |
    "Jumping Up" |
    "Jumping Down" |
    "Fall" 
