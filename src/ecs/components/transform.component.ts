import type { Point } from "../ecs.types"
import Component from "./component"

export default class TransformComponent extends Component {
    position: Point
    rotation: Point
    scale: Point

    constructor({ position = { x: 0, y: 0, z: 0 }, rotation = { x: 0, y: 0, z: 0 }, scale = { x: 1, y: 1, z: 1 } }: {
        position?: Point
        rotation?: Point
        scale?: Point
    } = {}) {
        super();
        this.position = position
        this.rotation = rotation
        this.scale = scale
    }
}