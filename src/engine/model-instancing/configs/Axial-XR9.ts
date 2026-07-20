import RAPIER from '@dimforge/rapier3d';
import {
  GROUP_PLAYER,
  GROUP_VEHICLE,
  GROUP_WHEEL,
  GROUP_WORLD,
  interactionGroups,
} from '../../game/physics-groups';
import Car from '../../components/vehicle/car';
import Wheel from '../../components/vehicle/wheel';
import {
  component,
  type ColliderConfig,
  type ComponentObjectRefs,
  type ComponentProps,
  type EntityConfig,
  type ModelConfig,
  type RevoluteJointConfig,
} from '../config-types';
import { DEG2RAD } from 'three/src/math/MathUtils.js';

const wheelCollider: Omit<ColliderConfig, 'source'> = {
  shape: 'BALL' as const,
  axis: 'X' as const,
  mass: 300,
  friction: 0,
  frictionRule: RAPIER.CoefficientCombineRule.Min,
  collisionGroups: interactionGroups(GROUP_WHEEL, GROUP_WORLD | GROUP_PLAYER),
  enableCcd: true,
};

function createWheelRevoluteJoint(wheel: string, anchor: string, isFront = false) {
  const min = -20 * DEG2RAD;
  const max = 13 * DEG2RAD;

  const revoluteJoint: Omit<RevoluteJointConfig, 'bodyB' | 'anchor'> = {
    type: 'revolute',
    bodyA: 'Chassis',
    axis: { x: 1 },
    limits: !isFront
      ? {
          min,
          max,
        }
      : {
          min: max * -1,
          max: min * -1,
        },
    motorPosition: {
      target: !isFront ? min : min * -1,
      stiffness: 300,
      damping: 90,
    },
  };

  return {
    ...revoluteJoint,
    bodyB: wheel,
    anchor,
  };
}

function createWheel(
  collider: string,
  wheelProps: ComponentProps<typeof Wheel>,
  objectRefs: ComponentObjectRefs<typeof Wheel>,
): EntityConfig {
  return {
    components: [
      component(
        Wheel,
        {
          ...wheelProps,
          radius: 0.66,
        },
        { objectRefs },
      ),
    ],
    collider: {
      ...wheelCollider,
      source: collider,
    },
  };
}

export const axial_XR9_config: ModelConfig = {
  modelPath: 'src/assets/Axial-XR9.glb',

  entities: {
    Chassis: {
      components: [
        component(Car, {
          engineForce: 120,
          brakeForce: 22,
          sideGrip: 24,
          pullingForce: 5,
        }),
      ],
      collider: {
        source: 'COL_chassis',
        shape: 'BOX',
        mass: 400,
        collisionGroups: interactionGroups(
          GROUP_VEHICLE,
          GROUP_VEHICLE | GROUP_WORLD | GROUP_PLAYER,
        ),
      },
    },

    wheel_baseFR: createWheel(
      'COL_wheelFR',
      {
        maxSteerAngleDeg: 30,
      },
      {
        steerObject: 'wheel_steerFR',
        rollObject: 'wheel_rollFR',
      },
    ),

    wheel_baseFL: createWheel(
      'COL_wheelFL',
      {
        maxSteerAngleDeg: 30,
      },
      {
        steerObject: 'wheel_steerFL',
        rollObject: 'wheel_rollFL',
      },
    ),

    wheel_baseRR: createWheel(
      'COL_wheelRR',
      {
        isRear: true,
      },
      {
        steerObject: 'wheel_steerRR',
        rollObject: 'wheel_rollRR',
      },
    ),

    wheel_baseRL: createWheel(
      'COL_wheelRL',
      {
        isRear: true,
      },
      {
        steerObject: 'wheel_steerRL',
        rollObject: 'wheel_rollRL',
      },
    ),
  },

  joints: [
    createWheelRevoluteJoint('wheel_baseFR', 'wheel_armFR', true),
    createWheelRevoluteJoint('wheel_baseFL', 'wheel_armFL', true),
    createWheelRevoluteJoint('wheel_baseRR', 'wheel_armRR'),
    createWheelRevoluteJoint('wheel_baseRL', 'wheel_armRL'),
  ],
};
