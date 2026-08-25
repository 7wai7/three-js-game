import { useSystemUiStore } from './stores/system-ui-store.js';

export default function SceneInspector() {
  const isPointerLocked = useSystemUiStore((state) => state.isPointerLocked);

  return (
    <main className="pointer-events-none absolute inset-0">
      {isPointerLocked && (
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-1.25 w-1.25 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.55)]"
        />
      )}
    </main>
  );
}
