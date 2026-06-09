import System from "./system";
import PlayerInputComponent from "../components/player-input";
import CarComponent from "../components/vehicle/car";

export default class VehicleInputSystem extends System {
    update(): void {
        const entities = this.world.entitiesWith(
            CarComponent,
            PlayerInputComponent
        );

        // if (entities.size === 0) return;

        const entity = entities.keys().next().value;
        if(!entity) return;

        const controller = this.world.getComponent(entity, CarComponent)!;

        const forward = this.input.vertical();
        const right = this.input.horizontal();

        controller.inputMoveDir.set(right, 0, forward);
        controller.inputBrake = this.input.pressed("Space");
    }
}