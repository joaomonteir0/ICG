import * as THREE from 'three';

const textures = {
    dirt: new THREE.TextureLoader().load('assets/dirt.jpg'),
    dirt2: new THREE.TextureLoader().load('assets/dirt2.jpeg'),
    grass: new THREE.TextureLoader().load('assets/grass.jpg'),
    sand: new THREE.TextureLoader().load('assets/sand.jpg'),
    stone: new THREE.TextureLoader().load('assets/stone.png'),
    water: new THREE.TextureLoader().load('assets/water.jpg'),
};

export { textures };
