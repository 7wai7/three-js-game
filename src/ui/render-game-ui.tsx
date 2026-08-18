import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import GameHud from './game-hud.js';

export function renderGameUi(container: HTMLElement) {
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <GameHud />
    </StrictMode>,
  );

  return root;
}
