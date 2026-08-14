import { createStore } from 'zustand/vanilla';

export type VehicleTelemetry = {
  speedKmh: number;
};

export type GameUiState = {
  playerVehicle: VehicleTelemetry;
};

const initialVehicleTelemetry: VehicleTelemetry = {
  speedKmh: 0,
};

export const gameUiStore = createStore<GameUiState>()(() => ({
  playerVehicle: initialVehicleTelemetry,
}));

export function setPlayerVehicleTelemetry(telemetry: Partial<VehicleTelemetry>) {
  gameUiStore.setState((state) => ({
    playerVehicle: {
      ...state.playerVehicle,
      ...telemetry,
    },
  }));
}
