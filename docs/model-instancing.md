# Model Instance System

## Overview

The Model Instance System creates complete gameplay objects from a combination of:

* GLTF model
* ModelConfig
* ECS World
* Rapier Physics World

The system automatically generates:

* RigidBodies
* Colliders
* Joints
* ECS Entities
* ECS Components
* Runtime object references

The model contains only visual and spatial data.

Gameplay and physics configuration are defined entirely in ModelConfig.

---

# Runtime Pipeline

## 1. Model Loading

A GLTF model is loaded and added to the scene.

Example:

```ts
const model = await assets.gltf.loadModel(
    config.modelPath,
);
```

---

## 2. Object Registration

```ts
fillObjectsMap(...)
```

The scene is traversed.

Every object referenced by ModelConfig is registered.

Example:

```ts
entities: {
    chassis: {...},
    wheel_FR: {...}
}
```

```ts
collider: {
    source: "COL_FR"
}
```

Objects:

```text
chassis
wheel_FR
COL_FR
```

become entries inside:

```ts
InstanceNodeMap
```

```ts
Map<SceneRef, InstanceNode>
```

---

## 3. Collider Generation

```ts
createCollidersByConfig(...)
```

For every entity that contains collider configuration:

```ts
entities: {
    chassis: {
        collider: {...}
    }
}
```

the system:

1. Finds collider source object
2. Calculates collider dimensions
3. Creates RigidBody
4. Creates Collider
5. Attaches Collider to RigidBody
6. Stores generated objects inside InstanceNode

Result:

```ts
node.rigidBody
node.collider
```

become available.

---

## 4. ECS Entity Creation

For every configured entity:

```ts
entities: {
    chassis: {...},
    wheel_FR: {...}
}
```

the system creates:

```ts
world.createEntity()
```

and stores the mapping:

```ts
Map<SceneRef, EntityId>
```

```ts
entitiesByName
```

Example:

```text
chassis  -> 1
wheel_FR -> 2
wheel_FL -> 3
```

---

## 5. Component Creation

Every component definition is passed through:

```ts
COMPONENT_FACTORY
```

Example:

```ts
{
    type: "RigidBodyComponent"
}
```

creates:

```ts
new RigidBodyComponent(
    node.rigidBody
)
```

while:

```ts
{
    type: "CarComponent",
    props: {
        engineForce: 70
    }
}
```

creates:

```ts
new CarComponent({
    engineForce: 70
})
```

The factory is responsible for translating configuration data into runtime component instances.

---

## 6. Joint Generation

```ts
createJointsFromConfig(...)
```

After all physics bodies are created, joints are generated.

Example:

```ts
{
    type: "prismatic",

    bodyA: "chassis",
    bodyB: "wheel_FR",

    axis: {
        y: 1
    },

    limits: {
        min: 0,
        max: 0.15
    }
}
```

The system:

1. Finds both InstanceNodes
2. Gets generated RigidBodies
3. Creates Rapier Joint
4. Applies limits
5. Applies motors

Current supported joints:

```text
prismatic
```

Future implementations may include:

```text
revolute
fixed
spherical
rope
spring
```

without changing the scene structure.

---

## 7. Runtime Initialization

Some components require references to other entities.

Examples:

* vehicle wheels
* weapon ownership
* turret hierarchy
* inventory slots

For such cases the system executes:

```ts
initialize(...)
```

after all entities and components already exist.

Example:

```ts
CarComponent
```

can automatically find wheel entities and populate:

```ts
car.wheels
```

without requiring manual setup.

---

## 8. Scene Registration

The root model is added to the scene:

```ts
scene.add(model)
```

and becomes active.

---

# InstanceNode

Every registered scene object is represented by:

```ts
type InstanceNode = {
    source: THREE.Object3D;

    rigidBody?: RAPIER.RigidBody;
    collider?: RAPIER.Collider;
}
```

The node acts as a bridge between:

* scene objects
* physics objects
* ECS objects

---

# RuntimeContext

Runtime initialization receives:

```ts
type RuntimeContext = {
    world: World;

    physicsWorld: RAPIER.World;

    entitiesByName:
        Map<SceneRef, EntityId>;

    nodesByName:
        InstanceNodeMap;
}
```

This allows components to resolve references by configured names.

Example:

```ts
wheel_FR
```

can be converted into:

```ts
entityId
```

or

```ts
RigidBody
```

during initialization.

---

# Creating New Components

Simple components only require configuration data.

Example:

```ts
{
    type: "WheelComponent",
    props: {
        maxSteerAngle: 30
    }
}
```

Runtime-dependent components should use:

```ts
initialize(...)
```

for resolving references after entity creation.

The factory should only create the component.

Cross-entity links should be established during initialization.

---

# Model Authoring Rules

## Required Object Names

Every object referenced from ModelConfig must exist inside the model.

Example:

```ts
bodyA: "chassis"
```

requires:

```text
chassis
```

inside the GLTF scene.

---

## Collider Source Objects

Collider geometry is still authored visually in the model.

Example:

```ts
collider: {
    source: "COL_chassis"
}
```

requires:

```text
COL_chassis
```

inside the scene.

The source object is used only for shape extraction and sizing.

It is not used as a gameplay object.

---

## Unique Names

All referenced scene objects should have unique names.

Example:

```text
chassis

wheel_FR
wheel_FL
wheel_RR
wheel_RL

COL_chassis
COL_FR
COL_FL
COL_RR
COL_RL
```

Scene object names are used as runtime identifiers and lookup keys.

Duplicate names are not supported.

---

# Vehicle Example

```ts
entities: {
    chassis: {...},
    wheel_FR: {...},
    wheel_FL: {...},
    wheel_RR: {...},
    wheel_RL: {...}
}
```

```ts
joints: [
    {
        type: "prismatic",
        bodyA: "chassis",
        bodyB: "wheel_FR"
    }
]
```

Generated result:

```text
chassis
 ├─ RigidBody
 ├─ Collider
 ├─ CarComponent
 │
 ├─ wheel_FR
 ├─ wheel_FL
 ├─ wheel_RR
 └─ wheel_RL

prismatic joints connect
each wheel to the chassis
```
