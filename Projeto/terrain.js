import * as THREE from 'three';
import { scene } from './sceneSetup';
import { hexMesh } from './geometry';
import { textures } from './materials';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';

const circleRadius = 20;
const max_height = 8;

function createTerrain() {
    const simplex = new SimplexNoise();
    for (let i = -circleRadius; i <= circleRadius; i++) {
        for (let j = -circleRadius; j <= circleRadius; j++) {
            let position = tileToPosition(i, j);
            if (position.length() > circleRadius / 2) {
                continue;
            }
            let noise = (simplex.noise(i * 0.1, j * 0.1) + 1) * 0.5;
            noise = Math.pow(noise, 1.5) * max_height;
            scene.add(hexMesh(noise, position));
        }
    }
}

function tileToPosition(tileX, tileY) {
    return new THREE.Vector3(
        (tileX + (tileY % 2) * 0.5) * 1.7,
        0,
        tileY * 1.5
    );
}

export { createTerrain };
