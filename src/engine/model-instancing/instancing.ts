import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d/rapier.js';
import {
  type EntityComponentConfig,
  type InstanceNode,
  type InstanceNodeMap,
  type ColliderConfig,
  type ModelConfig,
  type SceneRef,
} from './config-types';
import { getObjectSize } from '../../utils/get-object-size';
import { getAxisDimensions, getColliderRotationByAxis } from './utils';
import SceneNodeIndex from './scene-node-index';
import type Engine from '../engine';
import type { EntityId } from '../ecs/types';
import type Component from '../ecs/component';
import RigidBody from '../components/rigidbody';
import Collider from '../components/collider';

type RuntimeContext = {
  entitiesByName: Map<SceneRef, EntityId>;
  nodesByName: InstanceNodeMap;
};

export type ModelInstanceResult = {
  entities: IterableIterator<EntityId>;
  model: THREE.Object3D;
  nodeIndex: SceneNodeIndex;
  nodesByName: InstanceNodeMap;
};

export default class ModelInstancer {
  private readonly engine: Engine;

  constructor(engine: Engine) {
    this.engine = engine;
  }

  async instance(config: ModelConfig, nodesByName?: InstanceNodeMap): Promise<ModelInstanceResult> {
    const { scene, assets } = this.engine;

    if (!nodesByName) nodesByName = new Map();

    const gltf = await assets.gltf.loadModel(config.modelPath);
    const model = gltf.scene;

    const nodeIndex = SceneNodeIndex.fromModel(model, nodesByName);
    nodesByName = nodeIndex.nodesByName;

    const runtimeContext: RuntimeContext = {
      entitiesByName: new Map<SceneRef, string>(),
      nodesByName,
    };

    this.createColliders(config, nodesByName);

    this.createJoints(config, runtimeContext);

    this.createEntities(config, runtimeContext);

    scene.add(model);

    return {
      entities: runtimeContext.entitiesByName.values(),
      model,
      nodeIndex,
      nodesByName,
    };
  }

  private addPhysicsComponents(entity: EntityId, node: InstanceNode) {
    if (node.rigidBody) {
      this.engine.world.addComponent(entity, new RigidBody(node.rigidBody));
    }

    if (node.collider) {
      this.engine.world.addComponent(entity, new Collider(node.collider));
    }
  }

  private createComponent(config: EntityComponentConfig): Component {
    return new config.type(config.props);
  }

  private bindObjectRefs(component: Component, config: EntityComponentConfig, ctx: RuntimeContext) {
    for (const [field, nodeName] of Object.entries(config.objectRefs ?? {})) {
      const node = ctx.nodesByName.get(nodeName as string);

      if (!node) {
        console.warn(
          `Object ref "${nodeName}" not found for component "${component.constructor.name}"`,
        );
        continue;
      }

      (component as Record<string, any>)[field] = node.source;
    }

    for (const [field, nodeNames] of Object.entries(config.objectRefLists ?? {})) {
      const refs: THREE.Object3D[] = [];

      for (const nodeName of nodeNames as string[]) {
        const node = ctx.nodesByName.get(nodeName);

        if (!node) {
          console.warn(
            `Object ref "${nodeName}" not found for component "${component.constructor.name}"`,
          );
          continue;
        }

        refs.push(node.source);
      }

      (component as Record<string, any>)[field] = refs;
    }
  }

  private createColliders(config: ModelConfig, nodesByName: InstanceNodeMap) {
    for (const [entityName, entityConfig] of Object.entries(config.entities)) {
      const colliderConfig = entityConfig.collider;
      if (!colliderConfig) continue;

      const target = nodesByName.get(entityName);
      if (!target) {
        console.warn(`Target entity not found "${entityName}"`);
        continue;
      }

      const colliderNode = nodesByName.get(colliderConfig.source);

      if (!colliderNode) {
        console.warn(`Collider source not found "${colliderConfig.source}"`);
        continue;
      }

      colliderNode.source.visible = false;

      const rb = this.createRigidBody(colliderConfig, target.source);
      const colliderDesc = this.createColliderDesc(
        colliderConfig,
        target.source,
        colliderNode.source,
        Boolean(rb),
      );
      const collider = rb
        ? this.engine.physicsWorld.createCollider(colliderDesc, rb)
        : this.engine.physicsWorld.createCollider(colliderDesc);

      collider.setRestitution(0);

      if (colliderConfig.mass !== undefined) {
        collider.setMass(colliderConfig.mass);
      }

      if (colliderConfig.friction !== undefined) {
        collider.setFriction(colliderConfig.friction);
      }

      if (colliderConfig.frictionRule !== undefined) {
        collider.setFrictionCombineRule(colliderConfig.frictionRule);
      }

      if (colliderConfig.collisionGroups !== undefined) {
        collider.setCollisionGroups(colliderConfig.collisionGroups);
      }

      if (rb) {
        target.rigidBody = rb;
      }

      target.collider = collider;
    }
  }

  private createRigidBody(config: ColliderConfig, target: THREE.Object3D) {
    if (config.rigidBodyType === 'NONE') {
      return;
    }

    const meshWorldPos = new THREE.Vector3();
    const meshWorldQuat = new THREE.Quaternion();

    target.getWorldPosition(meshWorldPos);
    target.getWorldQuaternion(meshWorldQuat);

    const rbDesc = this.createRigidBodyDesc(config);

    rbDesc.setTranslation(meshWorldPos.x, meshWorldPos.y, meshWorldPos.z);

    rbDesc.setRotation({
      x: meshWorldQuat.x,
      y: meshWorldQuat.y,
      z: meshWorldQuat.z,
      w: meshWorldQuat.w,
    });

    const rb = this.engine.physicsWorld.createRigidBody(rbDesc);

    rb.setLinearDamping(0.1);
    rb.setAngularDamping(0.1);

    if (config.enableCcd) {
      rb.enableCcd(true);
    }

    return rb;
  }

  private createRigidBodyDesc(config: ColliderConfig) {
    switch (config.rigidBodyType) {
      case 'FIXED':
        return RAPIER.RigidBodyDesc.fixed();

      case 'KINEMATIC':
        return RAPIER.RigidBodyDesc.kinematicPositionBased();

      default:
        return RAPIER.RigidBodyDesc.dynamic();
    }
  }

  private createColliderDesc(
    config: ColliderConfig,
    target: THREE.Object3D,
    colliderSource: THREE.Object3D,
    attachedToRigidBody: boolean,
  ) {
    const size = getObjectSize(colliderSource);
    const { length, radius } = getAxisDimensions(size, config.axis);

    let colliderDesc: RAPIER.ColliderDesc;

    switch (config.shape) {
      case 'BALL':
        colliderDesc = RAPIER.ColliderDesc.ball(Math.max(size.x, size.y, size.z) * 0.5);
        break;

      case 'CAPSULE':
        colliderDesc = RAPIER.ColliderDesc.capsule(Math.max(0, length * 0.5 - radius), radius);
        break;

      case 'CYLINDER':
        colliderDesc = RAPIER.ColliderDesc.cylinder(length * 0.5, radius);
        break;

      default:
        colliderDesc = RAPIER.ColliderDesc.cuboid(size.x * 0.5, size.y * 0.5, size.z * 0.5);
    }

    if (attachedToRigidBody) {
      this.setAttachedColliderTransform(colliderDesc, config, target, colliderSource);
    } else {
      this.setStandaloneColliderTransform(colliderDesc, config, target, colliderSource);
    }

    return colliderDesc;
  }

  private setAttachedColliderTransform(
    colliderDesc: RAPIER.ColliderDesc,
    config: ColliderConfig,
    target: THREE.Object3D,
    colliderSource: THREE.Object3D,
  ) {
    target.updateMatrixWorld(true);
    colliderSource.updateMatrixWorld(true);

    const localPos = new THREE.Vector3();

    const localMatrix = target.matrixWorld
      .clone()
      .invert()
      .multiply(colliderSource.matrixWorld.clone());

    localMatrix.decompose(localPos, new THREE.Quaternion(), new THREE.Vector3());

    colliderDesc.setTranslation(localPos.x, localPos.y, localPos.z);

    const localQuat = getColliderRotationByAxis(config.axis);

    colliderDesc.setRotation({
      x: localQuat.x,
      y: localQuat.y,
      z: localQuat.z,
      w: localQuat.w,
    });
  }

  private setStandaloneColliderTransform(
    colliderDesc: RAPIER.ColliderDesc,
    config: ColliderConfig,
    target: THREE.Object3D,
    colliderSource: THREE.Object3D,
  ) {
    target.updateMatrixWorld(true);
    colliderSource.updateMatrixWorld(true);

    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    const axisQuat = getColliderRotationByAxis(config.axis);

    colliderSource.getWorldPosition(worldPos);
    target.getWorldQuaternion(worldQuat);
    worldQuat.multiply(axisQuat);

    colliderDesc.setTranslation(worldPos.x, worldPos.y, worldPos.z);
    colliderDesc.setRotation({
      x: worldQuat.x,
      y: worldQuat.y,
      z: worldQuat.z,
      w: worldQuat.w,
    });
  }

  private createJoints(config: ModelConfig, ctx: RuntimeContext) {
    for (const joint of config.joints ?? []) {
      const bodyA = ctx.nodesByName.get(joint.bodyA)?.rigidBody;
      const bodyB = ctx.nodesByName.get(joint.bodyB)?.rigidBody;

      if (!bodyA || !bodyB) continue;

      switch (joint.type) {
        case 'prismatic': {
          const axis = joint.axis;

          const rapierAxis = {
            x: axis.x ?? 0,
            y: axis.y ?? 0,
            z: axis.z ?? 0,
          };

          const aPos = bodyA.translation();
          const bPos = bodyB.translation();

          const anchor1 = {
            x: bPos.x - aPos.x,
            y: bPos.y - aPos.y,
            z: bPos.z - aPos.z,
          };

          const anchor2 = { x: 0, y: 0, z: 0 };

          const jointData = RAPIER.JointData.prismatic(anchor1, anchor2, rapierAxis);

          const j = this.engine.physicsWorld.createImpulseJoint(
            jointData,
            bodyA,
            bodyB,
            true,
          ) as RAPIER.PrismaticImpulseJoint;

          if (joint.limits) {
            j.setLimits(joint.limits.min, joint.limits.max);
          }

          if (joint.motorPosition) {
            j.configureMotorPosition(
              joint.motorPosition.target,
              joint.motorPosition.stiffness,
              joint.motorPosition.damping,
            );
          }

          break;
        }

        case 'revolute': {
          const pivot = ctx.nodesByName.get(joint.anchor);

          if (!pivot) {
            console.warn("Failed to create 'revolute' joint: anchor object not found");
            continue;
          }

          const pivotWorld = new THREE.Vector3();

          pivot.source.getWorldPosition(pivotWorld);

          const bodyAPos = bodyA.translation();

          const anchor1 = {
            x: pivotWorld.x - bodyAPos.x,
            y: pivotWorld.y - bodyAPos.y,
            z: pivotWorld.z - bodyAPos.z,
          };

          const bodyBPos = bodyB.translation();

          const anchor2 = {
            x: pivotWorld.x - bodyBPos.x,
            y: pivotWorld.y - bodyBPos.y,
            z: pivotWorld.z - bodyBPos.z,
          };

          const axis = {
            x: joint.axis.x ?? 0,
            y: joint.axis.y ?? 0,
            z: joint.axis.z ?? 0,
          };

          const jointData = RAPIER.JointData.revolute(anchor1, anchor2, axis);

          const j = this.engine.physicsWorld.createImpulseJoint(
            jointData,
            bodyA,
            bodyB,
            true,
          ) as RAPIER.RevoluteImpulseJoint;

          if (joint.limits) {
            j.setLimits(joint.limits.min, joint.limits.max);
          }

          if (joint.motorPosition) {
            j.configureMotorPosition(
              joint.motorPosition.target,
              joint.motorPosition.stiffness,
              joint.motorPosition.damping,
            );
          }

          break;
        }
      }
    }
  }

  private createEntities(config: ModelConfig, runtimeContext: RuntimeContext) {
    for (const [nodeName, entityConfig] of Object.entries(config.entities)) {
      const node = runtimeContext.nodesByName.get(nodeName);
      if (!node) continue;

      const entity = this.engine.world.createGameObject(node.source);

      runtimeContext.entitiesByName.set(nodeName, entity);

      this.addPhysicsComponents(entity, node);

      for (const componentConfig of entityConfig.components ?? []) {
        const component = this.createComponent(componentConfig);
        this.bindObjectRefs(component, componentConfig, runtimeContext);
        this.engine.world.addComponent(entity, component);
      }
    }
  }
}

export async function instanceModelByConfig(
  engine: Engine,
  config: ModelConfig,
  nodesByName?: InstanceNodeMap,
) {
  return engine.modelInstancer.instance(config, nodesByName);
}
