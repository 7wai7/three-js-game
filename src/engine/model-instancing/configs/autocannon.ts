import * as THREE from 'three';
import PlayerControlled from '../../components/player-controlled';
import AutomaticTrigger from '../../components/combat/firing-modes/automatic-trigger';
import FireControl from '../../components/combat/fire-control';
import FireRate from '../../components/combat/fire-rate';
import Magazine from '../../components/combat/magazine';
import ProjectileEmitter from '../../components/combat/projectiles/projectile-emitter';
import ShotQueue from '../../components/combat/shot-queue';
import Weapon from '../../components/combat/weapon';
import { component, type ModelConfig } from '../config-types';
import ProjectileShotPattern from '../../components/combat/projectiles/projectile-shot-pattern';

export const autocannonConfig: ModelConfig = {
  modelPath: 'src/assets/Weapons/Autocannon.glb',

  entities: {
    Weapon_Body: {
      components: [
        component(PlayerControlled),
        component(Weapon),
        component(FireControl, { action: 'firePrimary' }),
        component(AutomaticTrigger),
        component(FireRate, 3),
        component(Magazine, 1000),
        component(ShotQueue),
        component(ProjectileShotPattern, {
          shotsPerTrigger: 1,
          // shootPointIndices: [1,2]
        }),
        component(
          ProjectileEmitter,
          {
            speed: 1,
            lifetime: 5,
            gravity: new THREE.Vector3(),
          },
          {
            objectRefLists: {
              shootPoints: ['ShootpointL', 'ShootpointR'],
            },
          },
        ),
      ],

      collider: {
        source: 'Col_Weapon',
        rigidBodyType: 'FIXED',
        shape: 'BALL',
      },
    },
  },
};
