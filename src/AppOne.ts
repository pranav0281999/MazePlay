import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import * as BABYLON from "@babylonjs/core";
import { Maze } from "./Maze";
import { GradientMaterial } from "@babylonjs/materials";

export class AppOne {
    engine: BABYLON.Engine;
    scene: BABYLON.Scene;

    constructor(readonly canvas: HTMLCanvasElement) {
        this.engine = new BABYLON.Engine(canvas);
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
        this.scene = createScene(this.engine, this.canvas);
    }

    debug(debugOn: boolean = true) {
        if (debugOn) {
            this.scene.debugLayer.show({ overlay: true });
        } else {
            this.scene.debugLayer.hide();
        }
    }

    run() {
        this.debug(true);
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
}

const SIZE = 20;

const createGround = (scene: BABYLON.Scene) => {
    const groundMat = new GradientMaterial("groundMat", scene);
    groundMat.topColor = new BABYLON.Color3(1, 0, 1);
    groundMat.bottomColor = new BABYLON.Color3(0, 0, 1);
    groundMat.offset = 0.5;
    groundMat.smoothness = 1;
    groundMat.scale = 0.05;
    const ground = BABYLON.MeshBuilder.CreatePlane(
        "ground",
        { width: SIZE, height: SIZE },
        scene,
    );
    ground.material = groundMat;
    ground.rotation.x = BABYLON.Tools.ToRadians(90);
};

var createScene = function (engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera(
        "camera",
        -Math.PI / 2,
        -Math.PI,
        SIZE * 2,
        new BABYLON.Vector3(0, 0, 0),
    );
    camera.attachControl(canvas, true);

    new BABYLON.PointLight(
        "light",
        new BABYLON.Vector3(-SIZE / 2, SIZE / 2, SIZE / 2),
    );
    new BABYLON.PointLight(
        "light",
        new BABYLON.Vector3(SIZE / 2, SIZE / 2, -SIZE / 2),
    );
    new BABYLON.PointLight(
        "light",
        new BABYLON.Vector3(-SIZE / 2, SIZE / 2, -SIZE / 2),
    );
    new BABYLON.PointLight(
        "light",
        new BABYLON.Vector3(SIZE / 2, SIZE / 2, SIZE / 2),
    );

    new BABYLON.AxesViewer(scene, 1);

    new Maze(SIZE, scene);

    createGround(scene);

    return scene;
};
