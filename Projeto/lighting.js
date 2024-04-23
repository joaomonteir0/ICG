import * as THREE from 'three';
import { scene } from './sceneSetup';

function setupLights() {
    const light = new THREE.PointLight(new THREE.Color("rgb(244, 170, 150)").multiplyScalar(2), 80, 200);
    light.castShadow = true;
    light.position.set(10, 20, 10);
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;
    scene.add(light);
}

export { setupLights };
