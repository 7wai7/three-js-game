import { Box3, Object3D, Vector3 } from "three";

export default function getUniformScale(mesh: Object3D, desiredSize: Vector3 | number) {
        // 1) обчислити bounding box моделі в локальній системі
        const box = new Box3().setFromObject(mesh);
        const size = new Vector3();
        box.getSize(size); // current sizes in three units
        const center = new Vector3();
        box.getCenter(center);

        console.log('size', size);

        // 2) вибрати scale — зазвичай uniform scale зберігає пропорції моделі
        //    обираємо scale такий, щоб найбільша вісь моделі помістилась у бажаний розмір
        const desired = desiredSize instanceof Vector3
            ? desiredSize
            : new Vector3(desiredSize, desiredSize, desiredSize)

        // захист від ділення на 0:
        const safeSize = new Vector3(
            Math.max(0.0001, size.x),
            Math.max(0.0001, size.y),
            Math.max(0.0001, size.z)
        );

        // Варіант — uniform scale (рекомендується для моделей)
        const sx = desired.x / safeSize.x;
        const sy = desired.y / safeSize.y;
        const sz = desired.z / safeSize.z;
        const uniformScale = Math.min(sx, sy, sz); // влізе в усі розміри
        return {
            center,
            safeSize,
            uniformScale
        };
    }