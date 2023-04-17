import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const camera = new THREE.PerspectiveCamera(75, 1, 0.01, 100);
camera.position.z = 1.5;

let currentMethod = 'neus';
let currentScene = 'materials';
const scenes = []
const meshes = {}
const methodNames = {
	'neus': 'NeuS',
	'nwarp': 'NeuralWarp'
}

const manager = new THREE.LoadingManager();

const defMaterial = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.5, metalness:0.1, flatShading: false, side: THREE.DoubleSide});

const overlay = document.querySelector('.loading-overlay');

manager.onStart = () => {
	overlay.style.display = 'flex';
};
manager.onLoad = () => {
	overlay.style.display = 'none';
};

function initializeCanvases() {
	const canvases = [document.getElementById('canvas_nerf1'), document.getElementById('canvas_nerf2')];
	for (let i=0, n=canvases.length; i < n; ++i) {
		const canvas = canvases[i]
		const scene = new THREE.Scene();
		scenes.push(scene);

		const light_amb = new THREE.AmbientLight(0xffffff, 0.2);
		const light = new THREE.DirectionalLight( 0xffffff, 0.7 );
		light.position.copy( camera.position );
		scene.add(light_amb);
    	scene.add(light);
		scene.background = new THREE.Color( 0xffffff );
		
		const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setClearColor(0xffffff, 1);
		renderer.setSize(canvas.clientWidth, canvas.clientWidth);
		window.addEventListener('resize', () => {
			console.log(canvas.clientWidth);
			renderer.setSize(canvas.clientWidth, canvas.clientWidth);
			camera.aspect = 1; 
			camera.updateProjectionMatrix(); 
		})
		const controls = new TrackballControls(camera, renderer.domElement);
		controls.addEventListener( 'change', light_update );
		function light_update()
		{
			light.position.copy( camera.position );
		}
		const rendering = function () {
			requestAnimationFrame(rendering);
			controls.update();// Constantly rotate box
			renderer.render(scene, camera);
		}
		rendering();
	}
}

function addMeshToScene(scene, mesh) {
	if (scene.children[scene.children.length - 1].type === 'Mesh'){
		scene.children.pop(); 
	}
	scene.add(mesh);
}

function loadScene() {
	document.getElementById('method_h').textContent = methodNames[currentMethod];
	const meshid = currentMethod + '_' + currentScene;
	if (!(meshid in meshes)) {
		const loader = new GLTFLoader(manager);
		meshes[meshid] = [, ];
		loader.load('./meshes/' + currentMethod + '/' + currentScene + '.glb', function (obj) {
			meshes[meshid][0] = obj.scene.children[0].children[0];
			meshes[meshid][0].material = defMaterial;
			meshes[meshid][0].geometry.computeVertexNormals();
			addMeshToScene(scenes[0], meshes[meshid][0]);
		});
		loader.load('./meshes/' + currentMethod + 'sb/' + currentScene + '.glb', function (obj) {
			meshes[meshid][1] = obj.scene.children[0].children[0];
			meshes[meshid][1].material = defMaterial;
			meshes[meshid][1].geometry.computeVertexNormals();
			addMeshToScene(scenes[1], meshes[meshid][1]);
		});	
	}
	else {
		addMeshToScene(scenes[0], meshes[meshid][0]);
		addMeshToScene(scenes[1], meshes[meshid][1]);
	}
}

document.getElementById("bton_lego").addEventListener("click", function() {
	currentScene = 'lego';
	loadScene();
});
document.getElementById("bton_ficus").addEventListener("click", function() {
	currentScene = 'ficus';
	loadScene();
});
document.getElementById("bton_materials").addEventListener("click", function() {
	currentScene = 'materials';
	loadScene();
});
document.getElementById("bton_ship").addEventListener("click", function() {
	currentScene = 'ship';
	loadScene();
});
document.getElementById("bton_neus").addEventListener("click", function() {
	currentMethod = 'neus';
	loadScene();
});
document.getElementById("bton_nwarp").addEventListener("click", function() {
	currentMethod = 'nwarp';
	loadScene();
});

function startAllVideos() {
	var videos = document.getElementsByTagName("video");
	for (var i = 0; i < videos.length; i++) {
	  videos[i].play();
	}
}

window.onload = function() {
	startAllVideos();
	initializeCanvases();
	loadScene();
}
