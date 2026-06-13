import * as THREE from "three";
import type { Axis, InstanceNodeMap } from "./config-types";

export function getColliderRotationByAxis(axis?: Axis) {
    switch (axis) {
        case "X":
            return new THREE.Quaternion().setFromEuler(
                new THREE.Euler(0, 0, Math.PI / 2),
            );

        case "Z":
            return new THREE.Quaternion().setFromEuler(
                new THREE.Euler(Math.PI / 2, 0, 0),
            );

        default:
            return new THREE.Quaternion();
    }
}

export function getAxisDimensions(
    size: THREE.Vector3,
    axis?: Axis,
) {
    switch (axis) {
        case "X":
            return {
                length: size.x,
                radius: Math.max(size.y, size.z) * 0.5,
            };

        case "Z":
            return {
                length: size.z,
                radius: Math.max(size.x, size.y) * 0.5,
            };

        default:
            return {
                length: size.y,
                radius: Math.max(size.x, size.z) * 0.5,
            };
    }
}

export function prepareWheelSteeringPivots(objectsMap: InstanceNodeMap) {
    const wheels = [];
    for (const value of objectsMap.values()) {
        if (!value.source.name.startsWith("wheel")) continue;
        if (!value.source.parent) {
            console.warn(`Wheel ${value.source.name} doesn't have parent object`);
            continue;
        }

        wheels.push(value);

        const steerPivot = new THREE.Object3D();

        value.source.parent.attach(steerPivot);
        steerPivot.attach(value.source);
        value.source.position.set(0, 0, 0);
        value.steerPivot = steerPivot;
    }

    return wheels;
}