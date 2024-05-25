import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as BGU from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {SimplexNoise} from "three/examples/jsm/math/SimplexNoise"


// variáveis de terreno
let envmap;
const max_height = 20;
const circleRadius = 50;
const oceanSize = circleRadius/2 + 4


const scene = new THREE.Scene();
scene.background = new THREE.Color("skyblue");


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

const skyColor = 0x11183b; 
const groundColor = 0xB97A20; 
const intensity = 2;
const light2 = new THREE.HemisphereLight(skyColor, groundColor, intensity);
scene.add(light2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);

const STONE_HEIGHT = max_height * 0.8;
const GRASS_HEIGHT = max_height * 0.5;
const DIRT_HEIGHT = max_height * 0.7;
const SAND_HEIGHT = max_height * 0.3;
const DIRT2_HEIGHT = max_height * 0;

(async function() {
    let pmrem = new THREE.PMREMGenerator(renderer);
    let envmapTexture = await new RGBELoader().setDataType(THREE.FloatType).loadAsync('assets/envmap.hdr');
    envmap = pmrem.fromEquirectangular(envmapTexture).texture;

    let textures = {
        dirt: new THREE.TextureLoader().load('assets/dirt.jpg'),
        dirt2: new THREE.TextureLoader().load('assets/dirt2.jpeg'),
        grass: new THREE.TextureLoader().load('assets/grass.jpg'),
        sand: new THREE.TextureLoader().load('assets/sand.jpg'),
        stone: new THREE.TextureLoader().load('assets/stone.png'),
        water : new THREE.TextureLoader().load('assets/water.jpg')
    };
    const simplex = new SimplexNoise();


    for(let i = -circleRadius; i <= circleRadius; i++) {
        for(let j = -circleRadius; j <= circleRadius; j++) {
            let position = tileToPosition(i, j);
            if(position.length() > circleRadius/2) {
                continue;
            }
            let noise = (simplex.noise(i * 0.1, j * 0.1) + 1) * 0.5;
            noise = Math.pow(noise, 1.5);

            makeHex(noise*max_height, position);
        }
    }

    let stoneMesh = hexMesh(stoneGeometry, textures.stone);
    let grassMesh = hexMesh(grassGeometry, textures.grass);
    let dirtMesh = hexMesh(dirtGeometry, textures.dirt);
    let dirt2Mesh = hexMesh(dirt2Geometry, textures.dirt2);
    let sandMesh = hexMesh(sandGeometry, textures.sand);

    let oceanMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(oceanSize, oceanSize, max_height * 0.05, 50),
        new THREE.MeshPhysicalMaterial({
            envMap:envmap,
            color: new THREE.Color("#55aaff").convertSRGBToLinear().multiplyScalar(3),
            ior : 1,
            transmission: 1,
            transparent: true,
            thickness: 0.5,
            envMapIntensity: 0.5,
            roughness: 1,
            metalness: 0.055,
            roughnessMap : textures.water,
            metalnessMap : textures.water,
        })
    );

    oceanMesh.receiveShadow = true;
    oceanMesh.position.set(0, max_height * 0.05, 0);
    scene.add(oceanMesh);

    let mapBorder = new THREE.Mesh(
        new THREE.CylinderGeometry(oceanSize+0.1, oceanSize+0.1, max_height * 0.2, 50, 1, true),
        new THREE.MeshPhysicalMaterial({
            envMap : envmap,
            map : textures.dirt,
            envMapIntensity: 0.45,
            side: THREE.DoubleSide,
        })
    );
    mapBorder.receiveShadow = true;
    mapBorder.position.set(0, 0, 0);
    let mapBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1, oceanSize+0.1, 1, 50, 1, true),
        new THREE.MeshPhysicalMaterial({
            envMap : envmap,
            map : textures.dirt,
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
                (Math.random()) * circleRadius * 0.1,  // Adjusted to fit within a fraction of the circle radius
                (Math.random()) * circleRadius * 0.1,  // Adjusted to fit within a fraction of the circle radius
                (Math.random()) * circleRadius * 0.1   // Adjusted to fit within a fraction of the circle radius
            );
            sphere.castShadow = true;
            cloud.add(sphere);
        }

        cloud.position.copy(position);
        scene.add(cloud);
    }

    const cloudCount = (Math.random())*circleRadius; // Number of clouds
    for (let i = 0; i < cloudCount; i++) {
        let x = (Math.random() - 0.65) * circleRadius;
        let z = (Math.random() - 0.55) * circleRadius;
        let y = max_height + 5 + Math.random()*10;
        console.log(x,y,z);
        createCloud(new THREE.Vector3(x, y, z));
    }

    renderer.setAnimationLoop(() => {
        controls.update();
        renderer.render(scene, camera);
    });
})();

function tileToPosition(tileX, tileY){
    return new THREE.Vector2(
        (tileX + (tileY % 2) * 0.5) * 1.7,
        tileY * 1.5
    ); 
}

let stoneGeometry = new THREE.BoxGeometry(0,0,0);
let dirtGeometry = new THREE.BoxGeometry(0,0,0);
let grassGeometry = new THREE.BoxGeometry(0,0,0);
let sandGeometry = new THREE.BoxGeometry(0,0,0);
let dirt2Geometry = new THREE.BoxGeometry(0,0,0);

let hexagonGeometries = new THREE.BoxGeometry(0,0,0);

function hexGeometry(height, position) {
    let geo = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
    geo.translate(position.x, height * 0.5, position.y);

    return geo;
}

function makeHex(height, position) {
    let geo = hexGeometry(height, position);
    
    if(height > STONE_HEIGHT) {
        stoneGeometry = BGU.mergeGeometries([geo, stoneGeometry]);
    }else if (height > GRASS_HEIGHT){
        grassGeometry = BGU.mergeGeometries([geo, grassGeometry]);
    }else if (height > SAND_HEIGHT){
        sandGeometry = BGU.mergeGeometries([geo, sandGeometry]);
    }else if (height > DIRT2_HEIGHT){
        dirt2Geometry = BGU.mergeGeometries([geo, dirt2Geometry]);
    }else if (height > DIRT_HEIGHT){
        dirtGeometry = BGU.mergeGeometries([geo, dirtGeometry]);
    }
}

function hexMesh(geo, map) {
    let mat = new THREE.MeshPhysicalMaterial({
        envMap: envmap,
        envMapIntensity: 0.12,
        flatShading: true,
        map
    });

    let mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh; // Create and return a mesh
}
