import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import GameUiRoot from './game-ui-root.js';
import { EngineProvider } from './contexts/engine-react-context.js';

export function renderGameUi(container: HTMLElement) {
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <EngineProvider>
        <GameUiRoot />
      </EngineProvider>
    </StrictMode>,
  );

  return root;
}
