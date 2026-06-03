import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import type { Axis } from "./types";

export function getColliderRotationByAxis(axis: Axis) {
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
    axis: "x" | "y" | "z",
) {
    switch (axis) {
        case "x":
            return {
                length: size.x,
                radius: Math.max(size.y, size.z) * 0.5,
            };

        case "y":
            return {
                length: size.y,
                radius: Math.max(size.x, size.z) * 0.5,
            };

        case "z":
            return {
                length: size.z,
                radius: Math.max(size.x, size.y) * 0.5,
            };
    }
}

export function createWheelSuspensionJoint(
    physicsWorld: RAPIER.World,
    chassis: RAPIER.RigidBody,
    wheel: RAPIER.RigidBody,
    {
        min = -0.25,
        max = 0.25,
        targetPos = -0.25,
        stiffness = 300,
        damping = 40
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