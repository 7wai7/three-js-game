import * as THREE from 'three';
import PlayerControlled from '../../components/player-controlled';
import AutomaticTrigger from '../../components/combat/firing-modes/automatic-trigger';
import FireControl from '../../components/combat/fire-control';
import FireInput from '../../components/combat/fire-input';
import FireRate from '../../components/combat/fire-rate';
import Magazine from '../../components/combat/magazine';
import ProjectileEmitter from '../../components/combat/projectiles/projectile-emitter';
import ShotQueue from '../../components/combat/shot-queue';
import Weapon from '../../components/combat/weapon';
import { component, type ModelConfig } from '../config-types';

export const autocannonConfig: ModelConfig = {
  modelPath: 'src/assets/Weapons/Autocannon.glb',

  entities: {
    Weapon_Body: {
      components: [
        component(PlayerControlled),
        component(Weapon),
        component(FireInput, 'firePrimary'),
        component(FireControl),
        component(AutomaticTrigger),
        component(FireRate, 10),
        component(Magazine, 1000),
        component(ShotQueue),
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
