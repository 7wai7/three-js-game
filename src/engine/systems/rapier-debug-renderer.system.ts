import { LineSegments, BufferGeometry, LineBasicMaterial, BufferAttribute } from 'three';
import System from './system';

export default class RapierDebugRenderer extends System {
  mesh!: LineSegments;

  start(): void {
    const geometry = new BufferGeometry();
    const material = new LineBasicMaterial({ vertexColors: true });
    this.mesh = new LineSegments(geometry, material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  update() {
    if (this.input.clicked('KeyQ')) this.setVisible(!this.mesh.visible);

    if (this.mesh.visible) {
      const { vertices, colors } = this.physicsWorld.debugRender();
      this.mesh.geometry.setAttribute('position', new BufferAttribute(vertices, 3));
      this.mesh.geometry.setAttribute('color', new BufferAttribute(colors, 4));
    }
  }

  setVisible(flag: boolean) {
    this.mesh.visible = flag;
  }
}
