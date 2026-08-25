import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import type { SceneMode } from '../../engine/mode/mode-manager.js';

export type SystemUiState = {
  sceneMode: SceneMode;
  isPointerLocked: boolean;
};

export const systemUiStore = createStore<SystemUiState>()(() => ({
  sceneMode: 'play',
  isPointerLocked: false,
}));

export function useSystemUiStore<T>(selector: (state: SystemUiState) => T) {
  return useStore(systemUiStore, selector);
}

export function setSystemUiState(state: Partial<SystemUiState>) {
  systemUiStore.setState(state);
}
