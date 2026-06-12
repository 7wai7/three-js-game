import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import type Engine from "../engine";

export function createTurret(engine: Engine) {
    const { root } = createTestTurretModel();
    engine.scene.add(root);
}

export function createTestTurretModel() {
    const root = new THREE.Object3D();

    const material = new THREE.MeshStandardMaterial({
        color: 0x808080,
    });

    // кругла плоска підставка
    const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 0.2, 32),
        material,
    );
    stand.position.y = 0.1;

    // поворот по Y
    const turretSteerPivot = new THREE.Object3D();
    turretSteerPivot.position.y = 0.2;

    // корпус турелі
    const turretBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.6, 1.2),
        material,
    );
    turretBody.position.y = 0.3;

    // ствол
    const gun = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 2, 16),
        material,
    );

    // циліндр дивиться по Y, повертаємо вперед по Z
    gun.rotation.x = Math.PI / 2;
    gun.position.set(0, 0.15, 1);

    // точка пострілу
    const shootPoint = new THREE.Object3D();
    shootPoint.position.set(0, 0, 1);

    root.add(stand);

    stand.add(turretSteerPivot);

    turretSteerPivot.add(turretBody);
    turretBody.add(gun);

    gun.add(shootPoint);

    return {
        root,
        stand,
        turretSteerPivot,
        turretBody,
        gun,
        shootPoint,
    };
}