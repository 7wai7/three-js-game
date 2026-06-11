# Physics Generation System

## Part 1. Runtime Logic

### Overview

The Physics Generation System automatically creates Rapier physics objects from specially prepared objects inside a 3D model.

The system supports automatic generation of:

* RigidBody
* Collider
* Joint
* Vehicle steering pivots

All generation data is stored directly inside the model and exported through GLTF.

---

## Object Types

The system scans the entire scene and registers every object whose name starts with one of the supported prefixes:

| Prefix | Purpose                |
| ------ | ---------------------- |
| PH_    | Physical object target |
| COL_   | Collider definition    |
| JOINT_ | Joint definition       |

Every discovered object is stored inside a shared registry:

```ts
Map<string, PhysicsNode>
```

The key is the object name.

Example:

```text
PH_chassis
PH_wheel_fl
PH_wheel_fr

COL_chassis
COL_wheel_fl
COL_wheel_fr

JOINT_fl
JOINT_fr
```

---

## PhysicsNode Structure

Each registered object becomes a node inside the registry.

```ts
type PhysicsNode = {
    source: THREE.Object3D;

    colliderDef?: ColliderDefinition;
    jointDef?: JointDefinition;

    rigidBody?: RAPIER.RigidBody;
    collider?: RAPIER.Collider;

    steerPivot?: THREE.Object3D;
}
```

The same node stores:

* original 3D object
* parsed physics definitions
* generated Rapier objects
* runtime helper objects

---

## Physics Generation Pipeline

### 1. Definition Extraction

```ts
extractPhysicsDefinitions(...)
```

The scene is scanned.

Collider definitions are extracted from:

```text
COL_*
```

Joint definitions are extracted from:

```text
JOINT_*
```

Parsed definitions are stored inside the corresponding PhysicsNode.

---

### 2. RigidBody Generation

```ts
createPhysicsObjectsFromDefinitions(...)
```

For every collider definition:

1. Target object is found using:

```ts
colliderDef.targetName
```

2. RigidBody is created.

3. Collider is generated.

4. Collider is attached to the created RigidBody.

5. Generated objects are stored back into PhysicsNode.

---

### 3. Joint Generation

```ts
createJointsFromDefinitions(...)
```

For every joint definition:

1. Joint target is found through:

```ts
jointDef.targetName
```

2. Both PhysicsNodes must contain generated RigidBodies.

3. Joint is created between those RigidBodies.

Current implementation supports:

```text
suspension
```

Future implementations may support:

```text
hinge
fixed
spherical
revolute
```

without changing the scene structure.

---

### 4. Vehicle Steering Pivot Creation

```ts
prepareWheelSteeringPivots(...)
```

For every wheel:

1. Empty Object3D is created.
2. Wheel mesh is reparented under this object.
3. Steering rotations are applied to the pivot.
4. Physics synchronization continues using the pivot object.

This prevents steering visuals from interfering with physics synchronization.

---

## Advantages

The system is independent from hierarchy structure.

Objects can be placed anywhere in the scene as long as references are configured correctly.

Physics generation depends only on:

```ts
targetName
```

and not on:

```ts
parent
children
scene hierarchy
```

This makes the system scalable for:

* vehicles
* trailers
* aircraft
* turrets
* articulated machinery
* mechanical systems

---

# Part 2. 3D Modeling Rules

## Physical Objects

Every physical object must have a unique name.

Examples:

```text
PH_chassis
PH_wheel_fl
PH_wheel_fr
PH_wheel_rl
PH_wheel_rr
```

These objects represent actual physics bodies.

---

## Collider Definitions

Collider markers define collider shape and rigidbody settings.

Collider objects must start with:

```text
COL_
```

Example:

```text
COL_chassis
COL_wheel_fl
```

Collider markers are usually hidden helper meshes.

They are not rendered during gameplay.

---

## Collider UserData

Each collider object must contain:

```json
{
    "targetName": "PH_chassis"
}
```

### Optional Properties

Shape:

```json
{
    "shape": "BOX"
}
```

Supported values:

```text
BOX
BALL
CAPSULE
CYLINDER
```

RigidBody type:

```json
{
    "rigidbodyType": "DYNAMIC"
}
```

Supported values:

```text
DYNAMIC
FIXED
KINEMATIC
```

Axis:

```json
{
    "axis": "Y"
}
```

Supported values:

```text
X
Y
Z
```

Used for:

* capsules
* cylinders

---

## Joint Definitions

Joint markers define connections between physics bodies.

Joint objects must start with:

```text
JOINT_
```

Example:

```text
JOINT_fl
JOINT_fr
```

Joint markers are usually Empty objects.

---

## Joint UserData

Each joint must contain:

```json
{
    "targetName": "PH_chassis",
    "jointType": "suspension"
}
```

Meaning:

```text
Current object
        ↓
connected to
        ↓
PH_chassis
```

---

## Vehicle Suspension Example

Scene:

```text
PH_chassis
PH_wheel_fl
PH_wheel_fr

COL_chassis
COL_wheel_fl
COL_wheel_fr

JOINT_fl
JOINT_fr
```

JOINT_fl:

```json
{
    "targetName": "PH_chassis",
    "jointType": "suspension"
}
```

JOINT_fr:

```json
{
    "targetName": "PH_chassis",
    "jointType": "suspension"
}
```

Generated result:

```text
PH_wheel_fl ← suspension → PH_chassis
PH_wheel_fr ← suspension → PH_chassis
```

---

## Wheel Setup

Wheel objects should use:

```text
PH_wheel_*
```

Optional metadata:

```json
{
    "maxSteerAngleDeg": 20,
    "isRear": false
}
```

Example:

Front wheel:

```json
{
    "maxSteerAngleDeg": 25,
    "isRear": false
}
```

Rear wheel:

```json
{
    "isRear": true
}
```

---

## Naming Recommendations

Recommended naming:

```text
PH_chassis

PH_wheel_fl
PH_wheel_fr
PH_wheel_rl
PH_wheel_rr

COL_chassis
COL_wheel_fl
COL_wheel_fr
COL_wheel_rl
COL_wheel_rr

JOINT_fl
JOINT_fr
JOINT_rl
JOINT_rr
```

All names should be unique within the exported model.

The system uses object names as identifiers and references.
