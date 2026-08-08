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
  type PrismaticJointConfig,
} from '../config-types';
import PlayerControlled from '../../components/player-controlled';

const wheelCollider: Omit<ColliderConfig, 'source'> = {
  shape: 'BALL' as const,
  mass: 300,
  friction: 0,
  frictionRule: RAPIER.CoefficientCombineRule.Min,
  collisionGroups: interactionGroups(GROUP_WHEEL, GROUP_WORLD | GROUP_PLAYER),
  enableCcd: true,
};

function createWheelPrismaticJoint(wheel: string) {
  const prismaticJoint: Omit<PrismaticJointConfig, 'bodyB'> = {
    type: 'prismatic',
    bodyA: 'chassis',
    axis: { y: 1 },
    limits: {
      min: -0.1,
      max: 0.15,
    },
    motorPosition: {
      target: -0.05,
      stiffness: 500,
      damping: 70,
    },
  };

  return {
    ...prismaticJoint,
    bodyB: wheel,
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
          radius: 0.39,
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

export const cyberpunk_2079_quadra_v_tech: ModelConfig = {
  modelPath: 'src/assets/Vehicles/cyberpunk-2079-quadra-v-tech.glb',

  entities: {
    chassis: {
      components: [
        component(Car, {
          engineForce: 120,
          brakeForce: 22,
          sideGrip: 24,
          pullingForce: 5,
        }),
        component(PlayerControlled),
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

    wheel_base_FR: createWheel(
      'COL_wheel_FR',
      {
        maxSteerAngleDeg: 30,
      },
      {
        steerObject: 'wheel_steer_FR',
        rollObject: 'wheel_roll_FR',
      },
    ),

    wheel_base_FL: createWheel(
      'COL_wheel_FL',
      {
        maxSteerAngleDeg: 30,
      },
      {
        steerObject: 'wheel_steer_FL',
        rollObject: 'wheel_roll_FL',
      },
    ),

    wheel_base_RR: createWheel(
      'COL_wheel_RR',
      {
        isRear: true,
      },
      {
        steerObject: 'wheel_steer_RR',
        rollObject: 'wheel_roll_RR',
      },
    ),

    wheel_base_RL: createWheel(
      'COL_wheel_RL',
      {
        isRear: true,
      },
      {
        steerObject: 'wheel_steer_RL',
        rollObject: 'wheel_roll_RL',
      },
    ),
  },

  joints: [
    createWheelPrismaticJoint('wheel_base_FR'),
    createWheelPrismaticJoint('wheel_base_FL'),
    createWheelPrismaticJoint('wheel_base_RR'),
    createWheelPrismaticJoint('wheel_base_RL'),
  ],
};
