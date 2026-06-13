import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
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

export function createWheelSuspensionJoint(
    physicsWorld: RAPIER.World,
    chassis: RAPIER.RigidBody,
    wheel: RAPIER.RigidBody,
    {
        min = 0,
        max = 0.25,
        targetPos = 0,
        stiffness = 400,
        damping = 50
    }: {
        min?: number;
        max?: number;
        targetPos?: number;
        stiffness?: number;
        damping?: number;
    } = {}
) {
    const chassisPos = chassis.translation();
    const wheelPos = wheel.translation();

    const anchor1 = {
        x: wheelPos.x - chassisPos.x,
        y: wheelPos.y - chassisPos.y,
        z: wheelPos.z - chassisPos.z,
    };

    const anchor2 = {
        x: 0,
        y: 0,
        z: 0,
    };

    const axis = {
        x: 0,
        y: 1,
        z: 0,
    };

    const joint = RAPIER.JointData.prismatic(
        anchor1,
        anchor2,
        axis,
    );

    const j = physicsWorld.createImpulseJoint(
        joint,
        chassis,
        wheel,
        true,
    ) as RAPIER.PrismaticImpulseJoint;

    j.setLimits(min, max);

    j.configureMotorPosition(
        targetPos,
        stiffness,
        damping,
    );

    // wheel.setEnabledRotations(
    //     false,
    //     true,
    //     false,
    //     true,
    // );
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