import RAPIER from "@dimforge/rapier3d";
import Component from "../ecs/component";

export default class PlayerControllerComponent extends Component {
    controller: RAPIER.KinematicCharacterController;

    constructor(controller: RAPIER.KinematicCharacterController) {
        super();

        this.controller = controller;
    }
}