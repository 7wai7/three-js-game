import * as THREE from 'three';
import Stats from "three/examples/jsm/libs/stats.module.js";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import RenderPixelatedPass from './RenderPixelatedPass';
import PixelatePass from './PixelatePass';


let
    scene: THREE.Scene,
    camera: THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer,
    composer: EffectComposer,
    light: THREE.DirectionalLight,
    controls: OrbitControls,
    stats: Stats

export const SCALE = 0.25;

export function initThree() {

    let screenResolution = new THREE.Vector2( window.innerWidth, window.innerHeight )
    let renderResolution = screenResolution.clone().divideScalar( 6 )
    renderResolution.x |= 0
    renderResolution.y |= 0
    let aspectRatio = screenResolution.x / screenResolution.y

    camera = new THREE.OrthographicCamera( -aspectRatio, aspectRatio, 1, -1, 0.1, 10 )
    scene = new THREE.Scene()
    scene.background = new THREE.Color( 0x151729 )
    // scene.background = new THREE.Color( 0xffffff )

    // Renderer
    renderer = new THREE.WebGLRenderer( { antialias: false } )
    // renderer.toneMapping = THREE.ACESFilmicToneMapping
    // renderer.toneMappingExposure = .75
    renderer.shadowMap.enabled = true
    renderer.setSize( screenResolution.x, screenResolution.y )
    document.body.appendChild( renderer.domElement )

    composer = new EffectComposer( renderer )
    // composer.addPass( new RenderPass( scene, camera ) )
    composer.addPass( new RenderPixelatedPass( renderResolution, scene, camera ) )
    let bloomPass = new UnrealBloomPass( screenResolution, .4, .1, .9 )
    composer.addPass( bloomPass )
    composer.addPass( new PixelatePass( renderResolution ) )

    controls = new OrbitControls( camera, renderer.domElement )
    controls.target.set( 0, 0, 0 )
    camera.position.z = 2
    camera.position.y = 2 * Math.tan( Math.PI / 6 )
    controls.update()
    // controls.minPolarAngle = controls.maxPolarAngle = controls.getPolarAngle()

    // const texLoader = new THREE.TextureLoader()
    // const tex_crate = pixelTex( texLoader.load( crateURL ) )
    // const tex_warningStripes = pixelTex( texLoader.load( warningStipesURL ) )
    // const tex_checker = pixelTex( texLoader.load( "https://threejsfundamentals.org/threejs/resources/images/checker.png" ) )
    // const tex_checker2 = pixelTex( texLoader.load( "https://threejsfundamentals.org/threejs/resources/images/checker.png" ) )
    // tex_checker.repeat.set( 3, 3 )
    // tex_checker2.repeat.set( 1.5, 1.5 )


    // camera = new THREE.OrthographicCamera();
    // camera.position.set(11, 11, 11);
    // camera.lookAt(0, 0, 0);

    // scene = new THREE.Scene();
    // scene.background = new THREE.Color(0xa0a0a0);
    // // scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

    // const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
    // hemiLight.position.set(0, 20, 0);
    // scene.add(hemiLight);

    // light = new THREE.DirectionalLight(0xffffff, 3);
    // light.position.set(- 3, 10, - 10);
    // light.castShadow = true;

    // scene.add(light);

    // const mesh = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false }));
    // mesh.rotation.x = - Math.PI / 2;
    // mesh.receiveShadow = true;
    // scene.add(mesh);


    // renderer = new THREE.WebGLRenderer({ antialias: false });
    // renderer.setPixelRatio(.3);
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.BasicShadowMap;
    // renderer.outputColorSpace = THREE.SRGBColorSpace;
    // renderer.toneMapping = THREE.NoToneMapping;

    // document.body.appendChild(renderer.domElement);

    // controls = new OrbitControls(camera, renderer.domElement);


    stats = new Stats()
    document.body.appendChild(stats.dom)
    window.addEventListener('resize', onWindowResize, false)
    function onWindowResize() {
        // camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        render()
    }

    function render() {
        renderer.render(scene, camera)
    }

    onWindowResize()

    return {
        scene,
        camera,
        renderer,
        stats,
        controls,
        render
    }
}


export const useScene = () => scene;
export const useCamera = () => camera;
export const useRenderer = () => renderer;
export const useStats = () => stats;