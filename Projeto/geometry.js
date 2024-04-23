import * as THREE from 'three';
import * as BGU from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { textures } from './materials';

function hexMesh(height, position) {
    let geometry = new THREE.CylinderGeometry(1, 1, height, 6);
    geometry.translate(position.x, height * 0.5, position.y);
    let material = new THREE.MeshPhysicalMaterial({
        map: chooseMaterial(height),
    });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

function chooseMaterial(height) {
    if (height > 6) return textures.stone;
    else if (height > 4.5) return textures.grass;
    else if (height > 3) return textures.dirt;
    else if (height > 1.5) return textures.sand;
    else return textures.dirt2;
}

export { hexMesh };
