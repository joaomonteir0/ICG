import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as BGU from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { tileToPosition, hexMesh } from './functions.js';

let envmap;
let max_height = 15;
let circleRadius = 25;
let oceanSize = circleRadius / 2 + 4;
let clouds = []; 
let textures = {
    dirt: new THREE.TextureLoader().load('/assets/dirt.jpg'),
    dirt2: new THREE.TextureLoader().load('/assets/dirt2.jpeg'),
    grass: new THREE.TextureLoader().load('/assets/grass.jpg'),
    sand: new THREE.TextureLoader().load('/assets/sand.jpg'),
    stone: new THREE.TextureLoader().load('/assets/stone.png'),
    water: new THREE.TextureLoader().load('/assets/water.jpg'),
    leaves: new THREE.TextureLoader().load('/assets/leaves.png'),
};

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

// scale nas luzes
const defaultMoonLightIntensity = 0.6;
const defaultSunLightIntensity = 1.2;
const defaultAmbientLightIntensity = 0.3;
const defaultFillLightIntensity = 0.6;

// iniciar luzes
const moonLight = new THREE.DirectionalLight(new THREE.Color(0x8899ff), defaultMoonLightIntensity);
moonLight.position.set(-10, max_height + 5, -10);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 2048; // diminuir se der crash (quanto maior maior a resolução das sombras)
moonLight.shadow.mapSize.height = 2048; // diminuir se der crash (quanto maior maior a resolução das sombras)
moonLight.shadow.camera.near = 0.5;
moonLight.shadow.camera.far = 1000;
moonLight.shadow.camera.left = -50;
moonLight.shadow.camera.right = 50;
moonLight.shadow.camera.top = 50;
moonLight.shadow.camera.bottom = -50;
scene.add(moonLight);

const sunLight = new THREE.DirectionalLight(new THREE.Color(0xffffff), defaultSunLightIntensity);
sunLight.position.set(-30, max_height + 20, -30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048; 
sunLight.shadow.mapSize.height = 2048; 
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 1000;
sunLight.shadow.camera.left = -50;
sunLight.shadow.camera.right = 50;
sunLight.shadow.camera.top = 50;
sunLight.shadow.camera.bottom = -50;
sunLight.visible = false;
scene.add(sunLight);

const fillLight = new THREE.HemisphereLight(0xffffff, 0x444444, defaultFillLightIntensity);
fillLight.position.set(0, max_height + 10, 0);
scene.add(fillLight);

const ambientLight = new THREE.AmbientLight(new THREE.Color(0x404040), defaultAmbientLightIntensity);
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

    // limpar a cena
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    clouds = []

    // adicionar as luzes
    scene.add(moonLight);
    scene.add(sunLight);
    scene.add(ambientLight);
    scene.add(fillLight);
    controls.target.set(0, 0, 0);

    generateTerrain();
});

// logica da luz baseada no toggle
const dayNightToggle = document.getElementById('dayNightToggle');
dayNightToggle.addEventListener('change', () => {
    if (dayNightToggle.checked) {
        sunLight.visible = true;
        moonLight.visible = false;
        ambientLight.intensity = 0.8;
        sunLight.intensity = 3.6;
        scene.background.set("#87CEEB");
        renderer.toneMappingExposure = 0.8;
    } else {
        sunLight.visible = false;
        moonLight.visible = true;
        ambientLight.intensity = 0.3;
        moonLight.intensity = 1.9;
        scene.background.set("#131345");
        renderer.toneMappingExposure = 0.5;
    }
});

// logica da luz baseada no range slider
const controlLight = document.getElementById('controlLight');
controlLight.addEventListener('input', (event) => {
    const value = parseFloat(event.target.value);
    const scale = value / 5; 

    moonLight.intensity = defaultMoonLightIntensity * scale;
    sunLight.intensity = defaultSunLightIntensity * scale;
    ambientLight.intensity = defaultAmbientLightIntensity * scale;
    fillLight.intensity = defaultFillLightIntensity * scale;
});

let stoneGeometry = new THREE.BoxGeometry(0, 0, 0);
let dirtGeometry = new THREE.BoxGeometry(0, 0, 0);
let grassGeometry = new THREE.BoxGeometry(0, 0, 0);
let sandGeometry = new THREE.BoxGeometry(0, 0, 0);
let dirt2Geometry = new THREE.BoxGeometry(0, 0, 0);
let leavesGeometry = new THREE.BoxGeometry(0, 0,0);
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
        if (Math.random() > 0.8) {
            stoneGeometry = BGU.mergeGeometries([stoneGeometry, createStone(height, position)]);
        }
    } else if (height > DIRT_HEIGHT) {
        dirtGeometry = BGU.mergeGeometries([geo, dirtGeometry]);
        if (Math.random() > 0.95) {
            grassGeometry = BGU.mergeGeometries([grassGeometry, createTree(height, position)]);
        }
    } else if (height > GRASS_HEIGHT) {
        grassGeometry = BGU.mergeGeometries([geo, grassGeometry]);
        if (Math.random() > 0.97) {
            grassGeometry = BGU.mergeGeometries([grassGeometry, createTree(height, position)]);
        }
    } else if (height > SAND_HEIGHT) {
        sandGeometry = BGU.mergeGeometries([geo, sandGeometry]);
        if (Math.random() > 0.8 && stoneGeometry) {
            stoneGeometry = BGU.mergeGeometries([stoneGeometry, createStone(height, position)]);
        }
    } else if (height > DIRT2_HEIGHT) {
        dirt2Geometry = BGU.mergeGeometries([geo, dirt2Geometry]);
    }
}

function createTree(height, position) {
    if(Math.random() > 0.5){
        const treeHeight = Math.random() * 1 + 1.25;
        const geo1 = new THREE.CylinderGeometry(0, 1.5, treeHeight, 3);
        geo1.translate(position.x, height + treeHeight * 0 + 1, position.y);
        
        const geo2 = new THREE.CylinderGeometry(0, 1.15, treeHeight, 3);
        geo2.translate(position.x, height + treeHeight * 0.55 + 1, position.y);
        
        const geo3 = new THREE.CylinderGeometry(0, 0.8, treeHeight, 3);
        geo3.translate(position.x, height + treeHeight * 1.15 + 1, position.y);
    
        return BGU.mergeGeometries([geo1, geo2, geo3]);
    }else{
        const treeHeight = Math.random() * 1 + 1.25;
        const geo1 = new THREE.CylinderGeometry(0, 1.5, treeHeight, 3);
        geo1.translate(position.x, height + treeHeight * 0 + 1, position.y);
        
        const geo2 = new THREE.CylinderGeometry(0, 1.15, treeHeight, 3);
        geo2.translate(position.x, height + treeHeight * 0.55 + 1, position.y);
        return BGU.mergeGeometries([geo1, geo2]);
    }

}

function createStone(height, position) {
    const px = Math.random() * 0.4;
    const pz = Math.random() * 0.4;

    const geo = new THREE.SphereGeometry(Math.random() * 0.3 + 0.1, 7, 7);
    geo.translate(position.x + px, height, position.y + pz);

    return geo;
}

const STONE_HEIGHT = max_height * 0.8;
const GRASS_HEIGHT = max_height * 0.5;
const DIRT_HEIGHT = max_height * 0.7;
const SAND_HEIGHT = max_height * 0.3;
const DIRT2_HEIGHT = max_height * 0;


// criar nuvens
function createCloud(position) {
    console.log("Creating cloud");
    let cloud = new THREE.Group();
    let cloudMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.9
    });

    let numSpheres = Math.floor(3 + Math.random() * 1);
    for (let i = 0; i < numSpheres; i++) {
        let geometry = new THREE.SphereGeometry(1.2 + Math.random(), 32, 32);
        let sphere = new THREE.Mesh(geometry, cloudMaterial);
        sphere.position.set(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 8
        );
        sphere.castShadow = true;
        cloud.add(sphere);
    }

    cloud.position.copy(position);
    clouds.push(cloud);
    scene.add(cloud);
}

async function generateTerrain() {
    console.log(circleRadius);
    // limpar cena
    for (let i = scene.children.length - 1; i >= 0; i--) {
        if (scene.children[i].type === "Mesh") {
            scene.remove(scene.children[i]);
        }
    }

    stoneGeometry = new THREE.BoxGeometry(0, 0, 0);
    dirtGeometry = new THREE.BoxGeometry(0, 0, 0);
    grassGeometry = new THREE.BoxGeometry(0, 0, 0);
    sandGeometry = new THREE.BoxGeometry(0, 0, 0);
    dirt2Geometry = new THREE.BoxGeometry(0, 0, 0);
    leavesGeometry = new THREE.BoxGeometry(0, 0, 0);

    const simplex = new SimplexNoise();
    const worldType = document.getElementById('worldType').value;

    if (worldType === 'circle') {
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
        oceanSize = circleRadius / 2 + 4;
    } else {
        for (let i = -circleRadius / 2; i <= circleRadius / 2; i++) {
            for (let j = -circleRadius / 2; j <= circleRadius / 2; j++) {
                let position = tileToPosition(i, j);
                let noise = (simplex.noise(i * 0.1, j * 0.1) + 1) * 0.5;
                noise = Math.pow(noise, 1.5);
                makeHex(noise * max_height, position);
            }
        }
        oceanSize = (circleRadius / 2 + 4)*2;
    }

    let stoneMesh = hexMesh(stoneGeometry, textures.stone, envmap);
    let grassMesh = hexMesh(grassGeometry, textures.grass, envmap);
    let dirtMesh = hexMesh(dirtGeometry, textures.dirt, envmap);
    let dirt2Mesh = hexMesh(dirt2Geometry, textures.dirt2, envmap);
    let sandMesh = hexMesh(sandGeometry, textures.sand, envmap);
    let leavesMesh = hexMesh(leavesGeometry, textures.leaves, envmap);

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

    let cloudCount = Math.random() * circleRadius / 2.2; // Number of clouds
    if (cloudCount < 2 || cloudCount > circleRadius / 2) {
        cloudCount = circleRadius / 2;
    }
    for (let i = 0; i < cloudCount; i++) {
        let x = (Math.random() - 0.5) * circleRadius * 1;
        let z = (Math.random() - 0.5) * circleRadius * 1;
        let y = max_height + 5 + Math.random() * 10;
        createCloud(new THREE.Vector3(x, y, z));
    }

    renderer.setAnimationLoop(() => {
        controls.update();
        moveClouds();
        renderer.render(scene, camera);
    });
}

function moveClouds() {
    const cloudSpeed = 0.01;
    const direction = new THREE.Vector3(1, 0, 0); 

    for (let i = clouds.length - 1; i >= 0; i--) {
        let cloud = clouds[i];
        cloud.position.add(direction.clone().multiplyScalar(cloudSpeed));

        if (cloud.position.x > circleRadius * 0.8) {
            scene.remove(cloud);
            clouds.splice(i, 1);

            let x = -circleRadius;
            let z = (Math.random() - 0.5) * circleRadius * 1.5;
            let y = max_height + 5 + Math.random() * 10;
            createCloud(new THREE.Vector3(x * Math.random() * 1.5, y, z));
        }
    }
}

generateTerrain();
