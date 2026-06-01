export const GROUP_PLAYER = 0b0001;
export const GROUP_WORLD = 0b0010;
export const GROUP_VEHICLE = 0b0011;
export const GROUP_TEST = 0b0100;

export function interactionGroups(
    memberships: number,
    filter: number,
) {
    return (memberships << 16) | filter;
}

// example:
//   interactionGroups(
//     GROUP_WORLD, до якої групи належить
//     GROUP_WORLD | GROUP_PLAYER, з якими групами взаємодіє
//   )