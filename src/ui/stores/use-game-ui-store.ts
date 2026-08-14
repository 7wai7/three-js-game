import { useStore } from 'zustand';
import { gameUiStore, type GameUiState } from './game-ui-store.js';

export function useGameUiStore<T>(selector: (state: GameUiState) => T) {
  return useStore(gameUiStore, selector);
}
