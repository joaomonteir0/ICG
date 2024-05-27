import * as THREE from 'three';

export function tileToPosition(tileX, tileY) {
    return new THREE.Vector2(
        (tileX + (tileY % 2) * 0.5) * 1.7,
        tileY * 1.5
    );
}
export function hexMesh(geo, map, envmap) {
    let mat = new THREE.MeshPhysicalMaterial({
        envMap: envmap,
        envMapIntensity: 0.12,
        flatShading: true,
        map
    });

    let mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}
