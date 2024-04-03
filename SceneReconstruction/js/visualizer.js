import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import PinholeCamera from './pinhole.js';

const manager = new THREE.LoadingManager();

const defMaterial = new THREE.MeshStandardMaterial({ vertexColors : true, roughness: 0.6, metalness:0.1, flatShading: false, side: THREE.DoubleSide});

const overlay = document.querySelector('.loading-overlay');

manager.onStart = () => {
	overlay.style.display = 'flex';
};
manager.onLoad = () => {
	overlay.style.display = 'none';
};

const canvas = document.getElementById('canvas_scene');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setClearColor(0xffffff, 1);

renderer.physicallyCorrectLights = true;
renderer.outputEncoding =  THREE.sRGBEncoding;

function createCompButton(parent, name, onClick) {
	const newButton = document.createElement('button');
	newButton.textContent = name;
	newButton.className = 'btn btn-large btn-light'
	newButton.addEventListener('click', onClick)
	parent.appendChild(newButton);
}

async function changeScene(currentScene) {
	const meshes = {}
	const image = document.getElementById('scene_img');
	image.src = "scenes/" + currentScene + "/input.png"
	
	const scene = new THREE.Scene();
	const light_amb = new THREE.AmbientLight(0xffffff, 0.5);
	scene.add(light_amb);
	const light = new THREE.PointLight( 0xffffff, 6);
	scene.add(light);
	scene.background = new THREE.Color( 0xffffff );
	
	const specs = await (await fetch('scenes/' + currentScene + '/specs.json')).json();
	const aspect = specs['W'] / specs['H'];
	renderer.setSize(canvas.clientWidth, canvas.clientWidth / aspect);
	const camera = new PinholeCamera(
		specs['K'],
		specs['W'],
		specs['H'],
		aspect,
		0.1,
		1000
	)
	const trans = new THREE.Vector3().fromArray(specs['translation']).multiplyScalar(specs['scale'])
	const scale = new THREE.Vector3(specs['scale'], specs['scale'], specs['scale'])
	camera.position.copy( trans)
	light.position.copy( camera.position );
	
	window.addEventListener('resize', () => {
		renderer.setSize(canvas.clientWidth, canvas.clientWidth / aspect);
		camera.updateProjectionMatrix(); 
	})
	specs['objects'].forEach(
		path => {
			const loader = new GLTFLoader(manager);
			loader.load('./scenes/' + currentScene + '/' + path, function (obj) {
				const mesh = obj.scene.children[0].children[0]
				mesh.material.roughness = defMaterial.roughness
				mesh.material.metalness = defMaterial.metalness
				mesh.scale.copy( scale )
				mesh.position.copy( trans )

				addMeshToScene(scene, mesh);
				meshes[parseInt(path.split('_')[0]) + 1] = mesh
			});
		}
	)

	const loader = new PLYLoader(manager)
	loader.load(
		'scenes/' + currentScene + '/fitted_background.ply',
		function (geometry) {
			geometry.computeVertexNormals()
			const mesh = new THREE.Mesh(geometry, defMaterial)
			mesh.scale.copy( scale )
			mesh.position.copy( trans )
			addMeshToScene(scene, mesh);
			meshes['Background'] = mesh
		}
	)

	const controls = new TrackballControls(camera, renderer.domElement);
	controls.target.x = trans.x
	controls.target.y = trans.y

	const rendering = function () {
		requestAnimationFrame(rendering);
		controls.update();
		renderer.render(scene, camera);
	}
	rendering();

	manager.onLoad = () => {
		const buttons = document.getElementById('comp_buttons'); 
		buttons.replaceChildren();

		function onBgClick() {
			for (let comps in meshes) {
				if (comps === 'Background') {
					meshes[comps].visible = true
				}
				else {
					meshes[comps].visible = false
				}
			}
		}
		createCompButton(buttons, 'Background', onBgClick)

		for (let component = specs['objects'].length; component >= Math.max(specs['objects'].length - 5, 1); component--) {
			function onButtonClick() {
				for (let comps in meshes) {
					if (comps == component) {
						meshes[comps].visible = true
					}
					else {
						meshes[comps].visible = false
					}
				}
			}
			createCompButton(buttons, specs['objects'].length - component + 1, onButtonClick)
		}

		function onAllClick() {
			for (let comps in meshes) {
					meshes[comps].visible = true
			}
		}
		createCompButton(buttons, 'All', onAllClick)

		overlay.style.display = 'none';
	};
}

function addMeshToScene(scene, mesh) {
	mesh.rotation.z += Math.PI
	scene.add(mesh);
}

const scene_names = ["1", "2", "3", "4", "5"]
scene_names.forEach(scene_name => {
	document.getElementById("bton_s" + scene_name).addEventListener("click", function() {
		changeScene(scene_name);
	});
});

window.onload = function() {
	changeScene('1');
}
