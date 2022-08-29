import "./style.css";

import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { DDSLoader } from "three/examples/jsm/loaders/DDSLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { TGALoader } from "three/examples/jsm/loaders/TGALoader";

//前進か後進か変数宣言
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

//移動速度と移動方向の定義
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const color = new THREE.Color();

let raycaster;

/**
 *  シーン
 **/
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
scene.fog = new THREE.Fog(0xffffff, 0, 750);

/**
 *  カメラ
 **/
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.matrixWorld.decompose(camera.position, camera.quaternion, camera.scale);
camera.position.set(0, 1.1, 2);

/**
 *  レンダラー
 **/
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/**
 *  ライト
 **/
const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.8);
light.position.set(0.5, 1, 0.75);
scene.add(light);

//FPS視点設定
const controls = new PointerLockControls(camera, renderer.domElement);
window.addEventListener("click", () => {
  controls.lock();
});

// ローディングマネージャの準備
const manager = new THREE.LoadingManager();
manager.addHandler(/\.dds$/i, new DDSLoader()); // DDSローダーの準備
manager.addHandler(/\.tga$/i, new TGALoader()); // TGAローダーの準備 (今回は未使用)

/**
 * オブジェクト生成
 **/
let world = new THREE.Box3();
let cameraobj = new THREE.Box3();

new MTLLoader(manager).load(
  "./models/Street environment_V01.mtl",
  // ロード完了時の処理
  function (materials) {
    materials.preload();

    // OBJファイルの読み込み
    new OBJLoader(manager)
      .setMaterials(materials) // マテリアルの指定
      .load(
        "./models/Street environment_V01.obj",
        // ロード完了時の処理
        function (object) {
          //当たり判定の追加
          world = new THREE.Box3().setFromObject(object);
          cameraobj = new THREE.Box3().setFromObject(camera);
          // シーンへのモデルの追加
          scene.add(object);
          object.position.y = 0.1;
        }
      );
  }
);

const planeGeometry = new THREE.PlaneGeometry(400, 400, 100, 100);
const material = new THREE.MeshBasicMaterial({
  color: "orange",
  wireframe: true,
});
const plane = new THREE.Mesh(planeGeometry, material);
plane.rotateX(-Math.PI / 2);
scene.add(plane);

const boxGeometry = new THREE.BoxGeometry(20, 20, 20);
let position = boxGeometry.attributes.position;
const colorsBox = [];
for (let i = 0, l = position.count; i < l; i++) {
  color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
  colorsBox.push(color.r, color.g, color.b);
}
boxGeometry.setAttribute(
  "color",
  new THREE.Float32BufferAttribute(colorsBox, 3)
);
for (let i = 0; i < 200; i++) {
  const boxMaterial = new THREE.MeshPhongMaterial({
    specular: 0xffffff,
    flatShading: true,
    vertexColors: true,
  });
  boxMaterial.color.setHSL(
    Math.random() * 0.2 + 0.5,
    0.75,
    Math.random() * 0.25 + 0.75
  );
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.x = Math.floor(Math.random() * 20 - 10) * 20;
  box.position.y = Math.floor(Math.random() * 20) * 20 + 10;
  box.position.z = Math.floor(Math.random() * 20 - 10) * 20;
  scene.add(box);
}

//カメラの正面を取得
var forward = new THREE.Vector4(0, 0, 1, 0);
forward.applyMatrix4(camera.matrix).normalize();
forward.multiplyScalar(3);

console.log(forward);

const geometryA = new THREE.BoxGeometry(0.5, 0.1, 0.5);
const materialA = new THREE.MeshStandardMaterial({
  color: 0x0000ff,
  opacity: 0.5,
  transparent: true,
  depthTest: false,
});


// new THREE.Mesh(ジオメトリ,マテリアル)
const newbox2 = new THREE.Mesh(geometryA, materialA);
newbox2.position.x = camera.position.x + forward.x * -1;
newbox2.position.y = -0.5;
newbox2.position.z = camera.position.z + forward.z * -1;
// シーンに追加
scene.add(newbox2);


//キーボード操作
const onKeyDown = (e) => {
  switch (e.code) {
    case "KeyW":
      moveForward = true;
      break;
    case "KeyS":
      moveBackward = true;
      break;
    case "KeyA":
      moveLeft = true;
      break;
    case "KeyD":
      moveRight = true;
      break;
  }
};

const onKeyUp = (e) => {
  switch (e.code) {
    case "KeyW":
      moveForward = false;
      break;
    case "KeyS":
      moveBackward = false;
      break;
    case "KeyA":
      moveLeft = false;
      break;
    case "KeyD":
      moveRight = false;
      break;
  }
};

document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

let prevTime = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now();

  // 前進後進判定
  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);

  let result = world.intersectsBox(cameraobj);

  //ポインターがONになったら
  if (controls.isLocked) {
    raycaster = new THREE.Raycaster(
      new THREE.Vector3(),
      new THREE.Vector3(0, 0, -1),
      0,
      10
    );
    //進行方向（z軸へ向けたray発射）、ジャンプなどしたい場合y方向に出す。

    const delta = (time - prevTime) / 1000;

    //減衰
    velocity.z -= velocity.z * 5.0 * delta;
    velocity.x -= velocity.x * 5.0 * delta;

    if (moveForward || moveBackward) {
      velocity.z -= direction.z * 50 * delta;
    }
    if (moveRight || moveLeft) {
      velocity.x -= direction.x * 50 * delta;
    }
    controls.moveForward(-velocity.z * delta);
    controls.moveRight(-velocity.x * delta);

    //設置予定のブロック
    var forward = new THREE.Vector4(0, 0, 1, 0);
    forward.applyMatrix4(camera.matrix).normalize();
    forward.multiplyScalar(3);
    newbox2.position.set(
      camera.position.x + forward.x * -1,
      0,
      camera.position.z + forward.z * -1
    );
  }

  prevTime = time;
  renderer.render(scene, camera);
}

animate();

document.addEventListener("mousedown", clickPosition, false);


function clickPosition(event) {
  if (controls.isLocked) {
    //カメラのポジションを取得
    console.log(camera.position.x);
    console.log(camera.position.y);
    console.log(camera.position.z);

    var forward = new THREE.Vector4(0, 0, 1, 0);
    forward.applyMatrix4(camera.matrix).normalize();
    forward.multiplyScalar(3);

    console.log(forward);

    new MTLLoader(manager).load(
      "./models/Sign11.mtl",
      // ロード完了時の処理
      function (materials) {
        materials.preload();

        // OBJファイルの読み込み
        new OBJLoader(manager)
          .setMaterials(materials) // マテリアルの指定
          .load(
            "./models/Sign11.obj",
            // ロード完了時の処理
            function (object) {
              // シーンへのモデルの追加
              object.scale.set(0.5, 0.5, 0.5);
              scene.add(object);
              object.position.x = camera.position.x + forward.x * -1;
              object.position.y = 0;
              object.position.z = camera.position.z + forward.z * -1;
            }
          );
      }
    );
  }
}

function moveobject(box) {
  var movepoint = Math.floor(Math.random() * 20) * 20 + 10;
  console.log(movepoint);
  box.position.set.y == movepoint;
}

/**
 * 画面リサイズ設定
 **/
window.addEventListener("resize", onWindowResize);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
