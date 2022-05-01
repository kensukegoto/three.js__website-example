// import * as THREE from 'https://unpkg.com/three@0.140.0/build/three.module.js';
import gsap from 'gsap';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import * as dat from 'dat.gui';
import { StaticReadUsage } from 'three';

const gui = new dat.GUI();
const world = {
  plane: {
    width: 400,
    height: 400,
    widthSegments: 50,
    heightSegments: 50,
  },
};
gui.add(world.plane, 'width', 1, 500).onChange(generatePlane);
gui.add(world.plane, 'height', 1, 500).onChange(generatePlane);
gui.add(world.plane, 'widthSegments', 1, 100).onChange(generatePlane);
gui.add(world.plane, 'heightSegments', 1, 100).onChange(generatePlane);

function generatePlane() {
  planeMesh.geometry.dispose();
  planeMesh.geometry = new THREE.PlaneGeometry(
    world.plane.width,
    world.plane.height,
    world.plane.widthSegments,
    world.plane.heightSegments
  );
  const { array } = planeMesh.geometry.attributes.position;
  const randomValues = [];
  for (let i = 0; i < array.length; i++) {
    if(i % 3 === 0) {
      const x = array[i];
      const y = array[i + 1];
      const z = array[i + 2];
      array[i] = x + (Math.random() - 0.5) * 3;
      array[i + 1] = y + (Math.random() - 0.5) * 3;
      array[i + 2] = z + (Math.random() - 0.5) * 3; // 大きいほど高低差が作れる
    }
    // Math.PI * 2はよりランダムな数字を作るためのおまけ、ぶっちゃけ適当な数字でも良いはず
    randomValues.push(Math.random() * Math.PI * 2); 
  }

  planeMesh.geometry.attributes.position.randomValues = randomValues;
  planeMesh.geometry.attributes.position.originalPosition = planeMesh.geometry.attributes.position.array;
  
  const colors = [];
  for (let i = 0; i < planeMesh.geometry.attributes.position.count; i++) {
    colors.push(0, 0.19, 0.4); // R,G,B
  }
  planeMesh.geometry.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array(colors), 3)
  );
}

const raycaster = new THREE.Raycaster();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

new OrbitControls(camera, renderer.domElement);
camera.position.z = 50;

const planeGeometry = new THREE.PlaneGeometry(
  world.plane.width,
  world.plane.height,
  world.plane.widthSegments,
  world.plane.heightSegments
);
const planeMaterial = new THREE.MeshPhongMaterial({
  // color: 0xff0000,
  side: THREE.DoubleSide,
  flatShading: THREE.FlatShading,
  vertexColors: true,
});
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(planeMesh);
generatePlane();

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 1);
scene.add(light);
const backLight = new THREE.DirectionalLight(0xffffff, 1);
backLight.position.set(0, 0, -1);
scene.add(backLight);

const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff
});
const starVertices = [];
for(let i = 0; i < 10000; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (Math.random() - 0.5) * 2000;
  starVertices.push(x,y,z);
}

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const mouse = {
  x: undefined,
  y: undefined,
};

let frame = 0;
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  raycaster.setFromCamera(mouse, camera);
  frame += 0.01;

  const { array, originalPosition, randomValues } = planeMesh.geometry.attributes.position;
  for(let i = 0; i < array.length; i += 3){
    array[i] = originalPosition[i] + Math.cos(frame + randomValues[i]) * 0.003;
    array[i + 1] = originalPosition[i + 1] + Math.sin(frame + randomValues[i + 1]) * 0.003;
  }
  planeMesh.geometry.attributes.position.needsUpdate = true;


  // meshのどの位置にマウスがあるか
  const intersects = raycaster.intersectObject(planeMesh);
  // console.log(intersects);
  if (intersects.length) {
    // console.log(intersects[0]);
    const { color } = intersects[0].object.geometry.attributes;

    intersects[0].object.geometry.attributes.color.needsUpdate = true;

    const initialColor = {
      r: 0,
      g: 0.19,
      b: 0.4,
    };
    const hoverColor = {
      r: 0.1,
      g: 0.5,
      b: 1,
    };
    gsap.to(hoverColor, {
      r: initialColor.r,
      g: initialColor.g,
      b: initialColor.b,
      duration: 1,
      onUpdate: () => {
        // vertice 1 setX: R setY: G setZ: B
        color.setX(intersects[0].face.a, hoverColor.r);
        color.setY(intersects[0].face.a, hoverColor.g);
        color.setZ(intersects[0].face.a, hoverColor.b);
        // vertice 2 setX: R setY: G setZ: B
        color.setX(intersects[0].face.b, hoverColor.r);
        color.setY(intersects[0].face.b, hoverColor.g);
        color.setZ(intersects[0].face.b, hoverColor.b);
        // vertice 3 setX: R setY: G setZ: B
        color.setX(intersects[0].face.c, hoverColor.r);
        color.setY(intersects[0].face.c, hoverColor.g);
        color.setZ(intersects[0].face.c, hoverColor.b);
      },
    });
  }

  stars.rotation.x += 0.0005;
}

animate();

addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / innerHeight) * 2 + 1;
});

gsap.to('#kensukegoto', {
  opacity: 1,
  duration: 1.5,
  y: 0,
  ease: 'expo'
});
gsap.to('#oneWithAn', {
  opacity: 1,
  duration: 1.5,
  delay: 0.3,
  y: 0,
  ease: 'expo'
});
gsap.to('#viewWorkBtn', {
  opacity: 1,
  duration: 1.5,
  delay: 0.6,
  y: 0,
  ease: 'expo'
});

document.querySelector('#viewWorkBtn').addEventListener('click', e => {
  e.preventDefault();
  gsap.to('#container',{
    opacity: 0
  });
  gsap.to(camera.position, {
    z: 25,
    ease: 'power3.inOut',
    duration: 2
  });
  gsap.to(camera.rotation, {
    x: Math.PI / 2, // 90度 ラジアン
    ease: 'power3.inOut',
    duration: 2
  });
  gsap.to(camera.position, {
    y: 1000,
    ease: 'power3.in',
    duration: 1,
    delay: 2
  });
});