export function easeInOutCubic(x: number): number {
  return x ** 2 * 3 - x ** 3 * 2;
}

export function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

export function sawtooth(x: number, radius = 1, height = 1): number {
  x = Math.abs(x) / radius;
  const rising = x % 2;
  const falling = Math.max(0, rising * 2 - 2);
  return (rising - falling) * height;
}

export function linearStep(x: number, edge0: number, edge1: number): number {
  const w = edge1 - edge0;
  const m = 1 / w; // slope with a rise of 1
  const y0 = -m * edge0;
  return clamp(y0 + m * x, 0, 1);
}

export function stopGo(x: number, downtime: number, period: number): number {
  const cycle = (x / period) | 0;
  const tween = x - cycle * period;
  const linStep = linearStep(tween, downtime, period);
  return cycle + linStep;
}

export function stopGoEased(x: number, downtime: number, period: number): number {
  const cycle = (x / period) | 0;
  const tween = x - cycle * period;
  const linStep = easeInOutCubic(linearStep(tween, downtime, period));
  return cycle + linStep;
}
