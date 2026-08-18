import { useStore } from 'zustand';
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

export function useGameUiStore<T>(selector: (state: GameUiState) => T) {
  return useStore(gameUiStore, selector);
}

export function setPlayerVehicleTelemetry(telemetry: Partial<VehicleTelemetry>) {
  gameUiStore.setState((state) => ({
    playerVehicle: {
      ...state.playerVehicle,
      ...telemetry,
    },
  }));
}
