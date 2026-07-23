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
```

## Components

`Weapon`

A marker component. It says that this entity is a weapon.

`FireInput`

Defines which input action controls this weapon, for example `firePrimary`.
This component does not store button state. It only stores the binding to a
semantic input action.

`FireControl`

Stores the normalized fire intent:

- `active`: the weapon wants to fire right now
- `started`: fire became active this frame
- `stopped`: fire became inactive this frame
- `blocked`: another system temporarily prevents firing

Other systems should read `FireControl` instead of reading raw input.

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

Reads `ShotQueue` and executes the actual shot creation.

Right now this is only a placeholder `console.log`, but later this is where
projectile spawning, raycasts, muzzle effects, or sounds can be triggered.

## Example: Simple Automatic Weapon

Required components:

```text
Weapon
FireInput
FireControl
AutomaticTrigger
FireRate
Magazine
ShotQueue
```

Flow:

```text
Player holds fire
  -> FireInputSystem sets FireControl.active
  -> AutomaticFireSystem checks cooldown and ammo
  -> ShotQueue receives a shot
  -> ProjectileFireSystem creates the projectile
```

## Example: Minigun

Required components:

```text
Weapon
FireInput
FireControl
SpinUp
AutomaticTrigger
FireRate
Magazine
ShotQueue
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

This keeps weapon behavior composable:

```text
input / AI / scripts
  -> intent
  -> gates and modifiers
  -> shot decision
  -> shot execution
```
