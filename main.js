import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as BGU from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise";

import { tileToPosition, hexMesh } from './functions.js';

let envmap;
let max_height = 15;
let circleRadius = 20;
let oceanSize = circleRadius / 2 + 4;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#131345");

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 50);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Create a directional light to simulate moonlight
const moonLight = new THREE.DirectionalLight(new THREE.Color(0x8899ff), 1);
moonLight.position.set(-10, 20, -10);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 512;
moonLight.shadow.mapSize.height = 512;
moonLight.shadow.camera.near = 0.5;
moonLight.shadow.camera.far = 1000;
scene.add(moonLight);

// Add an ambient light to soften shadows and add some base illumination
const ambientLight = new THREE.AmbientLight(new THREE.Color(0x404040), 0.3);
scene.add(ambientLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);

const form = document.getElementById('terrainForm');
form.addEventListener('submit', (event) => {
    event.preventDefault();
    circleRadius = parseFloat(document.getElementById('circleRadius').value);
    max_height = parseFloat(document.getElementById('maxHeight').value);
    oceanSize = circleRadius / 2 + 4;

    // Clear the scene
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }

    // Re-add lights and controls
    scene.add(moonLight);
    scene.add(ambientLight);
    controls.target.set(0, 0, 0);

    generateTerrain();
});

let stoneGeometry = new THREE.BoxGeometry(0, 0, 0);
let dirtGeometry = new THREE.BoxGeometry(0, 0, 0);
let grassGeometry = new THREE.BoxGeometry(0, 0, 0);
let sandGeometry = new THREE.BoxGeometry(0, 0, 0);
let dirt2Geometry = new THREE.BoxGeometry(0, 0, 0);

let hexagonGeometries = new THREE.BoxGeometry(0, 0, 0);

function hexGeometry(height, position) {
    let geo = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
    geo.translate(position.x, height * 0.5, position.y);

    return geo;
}

function makeHex(height, position) {
    let geo = hexGeometry(height, position);

    if (height > STONE_HEIGHT) {
        stoneGeometry = BGU.mergeGeometries([geo, stoneGeometry]);
    } else if (height > GRASS_HEIGHT) {
        grassGeometry = BGU.mergeGeometries([geo, grassGeometry]);
    } else if (height > SAND_HEIGHT) {
        sandGeometry = BGU.mergeGeometries([geo, sandGeometry]);
    } else if (height > DIRT2_HEIGHT) {
        dirt2Geometry = BGU.mergeGeometries([geo, dirt2Geometry]);
    } else if (height > DIRT_HEIGHT) {
        dirtGeometry = BGU.mergeGeometries([geo, dirtGeometry]);
    }
}


const STONE_HEIGHT = max_height * 0.8;
const GRASS_HEIGHT = max_height * 0.5;
const DIRT_HEIGHT = max_height * 0.7;
const SAND_HEIGHT = max_height * 0.3;
const DIRT2_HEIGHT = max_height * 0;

async function generateTerrain() {
    // Clear all meshes from the scene
    for (let i = scene.children.length - 1; i >= 0; i--) {
        if (scene.children[i].type === "Mesh") {
            scene.remove(scene.children[i]);
        }
    }

    // Re-initialize the geometry variables
    stoneGeometry = new THREE.BoxGeometry(0, 0, 0);
    dirtGeometry = new THREE.BoxGeometry(0, 0, 0);
    grassGeometry = new THREE.BoxGeometry(0, 0, 0);
    sandGeometry = new THREE.BoxGeometry(0, 0, 0);
    dirt2Geometry = new THREE.BoxGeometry(0, 0, 0);

    const STONE_HEIGHT = max_height * 0.8;
    const GRASS_HEIGHT = max_height * 0.5;
    const DIRT_HEIGHT = max_height * 0.7;
    const SAND_HEIGHT = max_height * 0.3;
    const DIRT2_HEIGHT = max_height * 0;

    let textures = {
        dirt: new THREE.TextureLoader().load('assets/dirt.jpg'),
        dirt2: new THREE.TextureLoader().load('assets/dirt2.jpeg'),
        grass: new THREE.TextureLoader().load('assets/grass.jpg'),
        sand: new THREE.TextureLoader().load('assets/sand.jpg'),
        stone: new THREE.TextureLoader().load('assets/stone.png'),
        water: new THREE.TextureLoader().load('assets/water.jpg')
    };
    const simplex = new SimplexNoise();

    for (let i = -circleRadius; i <= circleRadius; i++) {
        for (let j = -circleRadius; j <= circleRadius; j++) {
            let position = tileToPosition(i, j);
            if (position.length() > circleRadius / 2) {
                continue;
            }
            let noise = (simplex.noise(i * 0.1, j * 0.1) + 1) * 0.5;
            noise = Math.pow(noise, 1.5);

            makeHex(noise * max_height, position);
        }
    }

    let stoneMesh = hexMesh(stoneGeometry, textures.stone, envmap);
    let grassMesh = hexMesh(grassGeometry, textures.grass, envmap);
    let dirtMesh = hexMesh(dirtGeometry, textures.dirt, envmap);
    let dirt2Mesh = hexMesh(dirt2Geometry, textures.dirt2, envmap);
    let sandMesh = hexMesh(sandGeometry, textures.sand, envmap);

    let oceanMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(oceanSize, oceanSize, max_height * 0.05, 50),
        new THREE.MeshPhysicalMaterial({
            envMap: envmap,
            color: new THREE.Color("#55aaff").convertSRGBToLinear().multiplyScalar(3),
            ior: 1,
            transmission: 1,
            transparent: true,
            thickness: 0.5,
            envMapIntensity: 0.5,
            roughness: 1,
            metalness: 0.055,
            roughnessMap: textures.water,
            metalnessMap: textures.water,
        })
    );

    oceanMesh.receiveShadow = true;
    oceanMesh.position.set(0, max_height * 0.05, 0);
    scene.add(oceanMesh);

    let mapBorder = new THREE.Mesh(
        new THREE.CylinderGeometry(oceanSize + 0.1, oceanSize + 0.1, max_height * 0.2, 50, 1, true),
        new THREE.MeshPhysicalMaterial({
            envMap: envmap,
            map: textures.dirt,
            envMapIntensity: 0.45,
            side: THREE.DoubleSide,
        })
    );
    mapBorder.receiveShadow = true;
    mapBorder.position.set(0, 0, 0);
    let mapBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1, oceanSize + 0.1, 1, 50, 1, true),
        new THREE.MeshPhysicalMaterial({
            envMap: envmap,
            map: textures.dirt,
            envMapIntensity: 0.2,
            side: THREE.DoubleSide,
        })
    );
    mapBase.receiveShadow = true;
    mapBase.position.set(0, 0, 0);
    scene.add(mapBorder);
    scene.add(mapBase);

    scene.add(stoneMesh, grassMesh, dirtMesh, dirt2Mesh, sandMesh);

    // Function to create and add clouds
    function createCloud(position) {
        let cloud = new THREE.Group();
        let cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

        for (let i = 0; i < 4 + Math.random() * 4; i++) {
            let geometry = new THREE.SphereGeometry(1 + Math.random(), 32, 32);
            let sphere = new THREE.Mesh(geometry, cloudMaterial);
            sphere.position.set(
                (Math.random() - 0.5) * circleRadius * 0.2,
                (Math.random() - 0.5) * circleRadius * 0.1,
                (Math.random() - 0.5) * circleRadius * 0.2
            );
            sphere.castShadow = true;
            cloud.add(sphere);
        }

        cloud.position.copy(position);
        scene.add(cloud);
    }

    const cloudCount = Math.random() * circleRadius; // Number of clouds
    for (let i = 0; i < cloudCount; i++) {
        let x = (Math.random() - 0.65) * circleRadius;
        let z = (Math.random() - 0.65) * circleRadius;
        let y = max_height + 5 + Math.random() * 10;
        createCloud(new THREE.Vector3(x, y, z));
    }

    renderer.setAnimationLoop(() => {
        controls.update();
        renderer.render(scene, camera);
    });
}

generateTerrain();

