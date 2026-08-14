import RigidBody from '../components/rigidbody';
import PlayerControlled from '../components/player-controlled';
import Car from '../components/vehicle/car';
import { setPlayerVehicleTelemetry } from '../../ui/stores/game-ui-store';
import System from './system';

export default class VehicleTelemetrySystem extends System {
  update(): void {
    const playerVehicle = this.world.query(Car, RigidBody, PlayerControlled)[0];

    if (!playerVehicle) {
      setPlayerVehicleTelemetry({ speedKmh: 0 });
      return;
    }

    const [, , { rigidBody }] = playerVehicle;

    if (!rigidBody.isValid()) {
      setPlayerVehicleTelemetry({ speedKmh: 0 });
      return;
    }

    const velocity = rigidBody.linvel();
    const speedKmh = Math.hypot(velocity.x, velocity.y, velocity.z) * 3.6;

    setPlayerVehicleTelemetry({ speedKmh });
  }
}
