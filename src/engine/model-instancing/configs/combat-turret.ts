import * as THREE from 'three';
import PlayerControlled from '../../components/player-controlled';
import AutomaticTrigger from '../../components/combat/firing-modes/automatic-trigger';
import FireControl from '../../components/combat/fire-control';
import FireRate from '../../components/combat/fire-rate';
import Magazine from '../../components/combat/magazine';
import ProjectileEmitter from '../../components/combat/projectiles/projectile-emitter';
import ProjectileSpawnQueue from '../../components/combat/projectiles/projectile-spawn-queue';
import SingleProjectileShotPattern from '../../components/combat/projectiles/shot-patterns/single-projectile-shot-pattern';
import ShotQueue from '../../components/combat/shot-queue';
import Weapon from '../../components/combat/weapon';
import { component, type ModelConfig } from '../config-types';
import AimAtTarget from '../../components/transform/aim-at-target';
import { DEG2RAD } from 'three/src/math/MathUtils.js';

export const combatTurretConfig: ModelConfig = {
  modelPath: 'src/assets/Weapons/Combat turret.glb',

  entities: {
    Weapon: {
      components: [
        component(PlayerControlled),
        component(Weapon),
        component(FireControl, { action: 'firePrimary' }),
        component(AutomaticTrigger),
        component(FireRate, 3),
        component(Magazine, 1000),
        component(ShotQueue),
        component(ProjectileSpawnQueue),
        component(SingleProjectileShotPattern),
        component(
          ProjectileEmitter,
          {
            speed: 1,
            lifetime: 5,
            gravityScale: 0.01,
          },
          {
            objectRefLists: {
              shootPoints: ['Shootpoint'],
            },
          },
        ),
      ],

      collider: {
        source: 'Col_Weapon',
        shape: 'BALL',
      },
    },
    Weapon_Stand: {
      components: [
        component(AimAtTarget, {
          rotationAxis: new THREE.Vector3(0, 0, 1),
          forwardAxis: new THREE.Vector3(0, 1, 0),
          maxAngularSpeed: 70 * DEG2RAD,
        }),
        // component(AimAtMouseScreen),
      ],
    },
    Gun: {
      components: [
        component(AimAtTarget, {
          rotationAxis: new THREE.Vector3(0, 0, 1),
          forwardAxis: new THREE.Vector3(0, 1, 0),
          maxAngularSpeed: 50 * DEG2RAD,
          minAngle: -40 * DEG2RAD,
          maxAngle: 40 * DEG2RAD,
        }),
        // component(AimAtMouseScreen),
      ],
    },
    Camera_Stand: {
      components: [
        component(AimAtTarget, {
          rotationAxis: new THREE.Vector3(0, 0, 1),
          forwardAxis: new THREE.Vector3(0, 1, 0),
          maxAngularSpeed: 150 * DEG2RAD,
        }),
        // component(AimAtMouseScreen),
      ],
    },
    Camera: {
      components: [
        component(AimAtTarget, {
          rotationAxis: new THREE.Vector3(0, 0, 1),
          forwardAxis: new THREE.Vector3(0, 1, 0),
          maxAngularSpeed: 120 * DEG2RAD,
          minAngle: -50 * DEG2RAD,
          maxAngle: 50 * DEG2RAD,
        }),
        // component(AimAtMouseScreen),
      ],
    },
  },
};
