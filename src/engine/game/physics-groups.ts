export const GROUP_PLAYER = 1 << 0;
export const GROUP_WORLD = 1 << 1;
export const GROUP_VEHICLE = 1 << 2;
export const GROUP_WHEEL = 1 << 3;

export function interactionGroups(memberships: number, filter: number) {
  return (memberships << 16) | filter;
}

// example:
//   interactionGroups(
//     GROUP_WORLD, до якої групи належить
//     GROUP_WORLD | GROUP_PLAYER, з якими групами взаємодіє
//   )
