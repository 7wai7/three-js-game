import System from "../system";
import PlayerController from "../../components/player-control";
import Car from "../../components/vehicle/car";

export default class VehicleInputSystem extends System {
    update(): void {
        const entities = this.world.entitiesWith(
            Car,
            PlayerController
        );

        const entity = entities.keys().next().value;
        if(!entity) return;

        const controller = this.world.getComponent(entity, Car)!;

        const forward = this.input.vertical();
        const right = this.input.horizontal();

        controller.inputMoveDir.set(right, 0, forward);
        controller.inputBrake = this.input.pressed("Space");
    }
}