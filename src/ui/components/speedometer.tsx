import { useGameUiStore } from '../stores/game-ui-store.js';

export default function Speedometer() {
  const speedKmh = useGameUiStore((state) => state.playerVehicle.speedKmh);

  return (
    <section
      className="absolute right-6 bottom-6 min-w-33 rounded-lg border border-white/20 bg-[#080a0e]/70 px-3.5 py-3 text-right font-sans text-white backdrop-blur-md"
      aria-label="Vehicle speed"
    >
      <span className="block text-[34px] leading-none font-bold">{Math.round(speedKmh)}</span>
      <span className="mt-1 block text-[13px] leading-none text-white/70">km/h</span>
    </section>
  );
}
