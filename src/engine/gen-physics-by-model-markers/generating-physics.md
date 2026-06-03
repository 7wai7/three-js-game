# Physics Collider Definition Rules

Physics colliders are defined by special Blender objects (collider markers) that are exported together with the model and used at runtime to generate Rapier colliders.

## Rules

1. A collider definition object must be a child of the mesh it describes.

2. Collider definition names must start with:

```text
COL_
```

3. Supported collider shapes:

```text
BOX (default)
BALL
CAPSULE
CYLINDER
```

4. Supported rigid body types:

```text
FIXED
DYNAMIC (default)
KINEMATIC
```

5. Collider axis:

```text
X
Y (default)
Z
```

6. Naming pattern:

```text
COL_<RIGIDBODY_TYPE>_<SHAPE>_<AXIS>_<NAME>
```

Examples:

```text
COL_BOX_Chassis
COL_DYNAMIC_CYLINDER_X_FL
COL_DYNAMIC_CYLINDER_X_FR
COL_DYNAMIC_CYLINDER_X_BL
COL_DYNAMIC_CYLINDER_X_BR
COL_FIXED_BOX_Wall
COL_KINEMATIC_CAPSULE_X_Player
```

## Blender Requirements

Before exporting:

* Apply Rotation (`Ctrl+A → Rotation`)
* Apply Scale (`Ctrl+A → Scale`)

Recommended:

```text
Rotation = (0, 0, 0)
Scale = (1, 1, 1)
```

for both visual meshes and collider markers.

## Runtime Behavior

At runtime:

* Collider markers are hidden.
* A Rapier RigidBody is created according to the specified rigid body type.
* A Rapier Collider is generated from the marker transform and dimensions.
* The collider is attached to the generated rigid body.
* The parent visual mesh is synchronized with the rigid body transform.
