import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react';
import EngineContext from '../../engine/contexts/engine.context.js';
import type Engine from '../../engine/engine.js';

const EngineReactContext = createContext<RefObject<Engine | null> | null>(null);

export function EngineProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef<Engine | null>(null);

  if (!engineRef.current) {
    engineRef.current = EngineContext.engine;
  }

  return <EngineReactContext.Provider value={engineRef}>{children}</EngineReactContext.Provider>;
}

export function useEngine() {
  const engineRef = useContext(EngineReactContext);

  if (!engineRef?.current) {
    throw new Error('Engine React context is not initialized');
  }

  return engineRef.current;
}

export function useEngineRef() {
  const engineRef = useContext(EngineReactContext);

  if (!engineRef) {
    throw new Error('Engine React context is not initialized');
  }

  return engineRef;
}
