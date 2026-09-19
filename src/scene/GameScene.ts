import * as THREE from 'three';

import { EnvironmentManager } from '../environment/EnvironmentManager';

export class GameScene {
  readonly scene = new THREE.Scene();
  readonly environment: EnvironmentManager;

  constructor() {
    this.environment = new EnvironmentManager(this.scene);
  }

  add(...objects: THREE.Object3D[]): void {
    for (const object of objects) {
      this.scene.add(object);
    }
  }
}
