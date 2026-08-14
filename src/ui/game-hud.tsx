import Speedometer from './components/speedometer.js';

export default function GameHud() {
  return (
    <main className="pointer-events-none absolute inset-0 p-6">
      <Speedometer />
    </main>
  );
}
