# Combat Workflow

Combat is built as a small pipeline of independent ECS components and systems.
Each component owns only one part of the weapon behavior, so weapons can be
assembled like a constructor.

## Main Idea

A weapon should not know why it is allowed to shoot.

For example, a minigun may start from player input, AI logic, a script, or a
vehicle turret system. The firing system should not care. It only checks the
current fire intent and weapon state.

The workflow is:

```text
ControlInput
  -> FireInputSystem
  -> FireControl
  -> optional gates: SpinUp, Chargeable, Reloadable, Magazine
  -> AutomaticFireSystem
  -> ShotQueue
  -> ProjectileFireSystem
  -> BallisticProjectile
  -> ProjectileMotionSystem
```

## Components

`Weapon`

A marker component. It says that this entity is a weapon.

`FireControl`

Stores the normalized fire intent:

- `active`: the weapon wants to fire right now
- `started`: fire became active this frame
- `stopped`: fire became inactive this frame
- `blocked`: another system temporarily prevents firing

Other systems should read `FireControl` instead of reading raw input.
Defines which input action controls this weapon, for example `firePrimary`.

`SpinUp`

Stores minigun-like spin state. When fire is held, it spins up. When fire is
released, it spins down. While it is not ready, it blocks `FireControl`.

`Chargeable`

Stores charge progress. It can also block firing until enough charge is built.

`FireRate`

Stores cooldown between shots.

`Magazine`

Stores ammo and capacity.

`Reloadable`

Stores reload state and reload timer.

`ShotQueue`

Stores how many shots should be executed this frame. This separates "deciding
to shoot" from "creating the projectile".

`ProjectileEmitter`

Stores how this weapon creates ordinary projectile objects: projectile model,
initial speed, gravity, drag, lifetime, and shoot points.

Shoot points are `THREE.Object3D` references from the weapon model. In weapon
GLB files they should usually be named `ShootPoint`, `ShootPoint.001`,
`ShootPoint.002`, etc. A weapon can have one or many shoot points.

With model instancing, bind those nodes through `objectRefLists`:

```ts
component(
  ProjectileEmitter,
  {
    speed: 80,
  },
  {
    objectRefLists: {
      shootPoints: ['Shootpoint.L', 'Shootpoint.R'],
    },
  },
);
```

When a weapon has several shoot points, `ProjectileFireSystem` cycles through
them in order. This supports multi-barrel weapons without making the firing
logic special-case each weapon.

`BallisticProjectile`

Stores runtime movement data for a projectile entity: velocity, gravity, drag,
lifetime, and age.

## Systems

`FireInputSystem`

Reads `ControlInput` from the weapon entity or from its parent entity. Then it
writes the result into `FireControl`.

This is the input adapter. Replacing player input with AI should only require
another system that writes `FireControl`.

`SpinUpSystem`

Reads `SpinUp` and `FireControl`.

If fire is active, it increases spin. If fire is inactive, it decreases spin.
If the weapon is not spun up enough, it calls `fireControl.block()`.

`ChargingSystem`

Reads `Chargeable` and `FireControl`.

It starts charging when firing starts, increases charge while fire is active,
and can block firing while the charge is not ready.

`AutomaticFireSystem`

Reads `FireControl`, `FireRate`, `ShotQueue`, `AutomaticTrigger`, and `Weapon`.

If `FireControl.canFire` is true and cooldown is ready, it consumes ammo if a
`Magazine` exists, resets fire rate, and adds a shot to `ShotQueue`.

This system does not know about input, spin-up, charging, or projectile
creation.

`ProjectileFireSystem`

Reads `ShotQueue` and `ProjectileEmitter`, then creates projectile game objects.

For ordinary bullets it asks `GLTFAssetManager` for a clone of
`src/assets/Weapons/Bullet.glb`, places it at the next shoot point, and adds a
`BallisticProjectile` component. This system knows how to spawn projectiles, but
it does not own projectile model caches and it does not decide when the weapon
should shoot.

If the projectile model is still loading, `ShotQueue` is left untouched and the
shots are spawned after the asset is available.

`ProjectileMotionSystem`

Reads `BallisticProjectile` entities and moves them using velocity, gravity, air
drag, and lifetime. It does not know which weapon created the projectile.

## Example: Simple Automatic Weapon

Required components:

```text
Weapon
FireControl
AutomaticTrigger
FireRate
Magazine
ShotQueue
ProjectileEmitter
```

`ProjectileEmitter` needs at least one shoot point. With model instancing, bind
the weapon model's `ShootPoint` objects into `ProjectileEmitter.shootPoints`.

Flow:

```text
Player holds fire
  -> FireInputSystem sets FireControl.active
  -> AutomaticFireSystem checks cooldown and ammo
  -> ShotQueue receives a shot
  -> ProjectileFireSystem creates a projectile entity
  -> ProjectileMotionSystem moves the projectile
```

## Example: Minigun

Required components:

```text
Weapon
FireControl
SpinUp
AutomaticTrigger
FireRate
Magazine
ShotQueue
ProjectileEmitter
```

Flow:

```text
Player holds fire
  -> FireInputSystem sets FireControl.active
  -> SpinUpSystem starts spinning the barrel
  -> SpinUpSystem blocks FireControl until spin is ready
  -> AutomaticFireSystem starts adding shots to ShotQueue
  -> ProjectileFireSystem creates projectiles
```

The minigun is not a special weapon class. It is just an automatic weapon with
an extra `SpinUp` component.

## Extension Rules

Add a new component when the weapon needs a new piece of state.

Add a new system when that state needs behavior over time.

Prefer writing to `FireControl` or blocking `FireControl` instead of making the
firing system aware of every possible condition.

Prefer writing to `ShotQueue` instead of spawning projectiles directly from
decision systems.

For weapon-specific mechanics, keep the custom behavior in a focused component
and system for that weapon family. The system should still communicate through
shared combat data when possible: block or set `FireControl`, enqueue
`ShotQueue`, or use a custom emitter component if the projectile creation really
is unique.

This keeps weapon behavior composable:

```text
input / AI / scripts
  -> intent
  -> gates and modifiers
  -> shot decision
  -> shot execution
```
