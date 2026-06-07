export default function moveTowards(
    current: number,
    target: number,
    maxDelta: number,
) {
    const delta = target - current;

    if (Math.abs(delta) <= maxDelta) {
        return target;
    }

    return current + Math.sign(delta) * maxDelta;
}