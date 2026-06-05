import Query from "../ecs/query";
import System from "./system";
import PlayerInputComponent from "../components/player-input";
import CarComponent from "../components/vehicle/car";
import WheelComponent from "../components/vehicle/wheel";

export default class VehicleInputSystem extends System {
    update(): void {
        const entities = Query.entitiesWith(
            this.world,
            CarComponent,
            PlayerInputComponent
        );

        if (entities.length === 0) return;

        const entity = entities[0];

        const controller = this.world.getComponent(entity, CarComponent)!;

        const forward = this.input.vertical();
        const right = this.input.horizontal();

        controller.inputMoveDir.set(right, 0, forward);
        controller.inputBrake = this.input.pressed("Space");

        for (const entity of controller.wheels) {
            const w = this.world.getComponent(entity, WheelComponent)!;
            if (!w.isRear) w.currentSteerAngle = w.maxSteerAngle * -this.input.horizontal();
        }
    }
}