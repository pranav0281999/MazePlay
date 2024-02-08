import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import * as BABYLON from "@babylonjs/core";
import { Maze } from "./Maze";

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
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.emissiveColor = new BABYLON.Color3(0.6, 0, 0.6);
    const ground = BABYLON.MeshBuilder.CreatePlane(
        "ground",
        { width: SIZE, height: SIZE },
        scene,
    );
    ground.material = groundMat;
    ground.rotation.x = BABYLON.Tools.ToRadians(90);

    return ground;
};

let createScene = function (engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    const scene = new BABYLON.Scene(engine);
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.3;
    scene.fogColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    scene.gravity = new BABYLON.Vector3(0, -9, 0);
    scene.collisionsEnabled = true;

    const gl = new BABYLON.GlowLayer("glow", scene);
    gl.intensity = 0.5;

    // const camera = new BABYLON.ArcRotateCamera(
    //     "camera",
    //     -Math.PI / 2,
    //     -Math.PI,
    //     SIZE * 2,
    //     new BABYLON.Vector3(0, 0, 0),
    // );
    // camera.attachControl(canvas, true);

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

    // https://doc.babylonjs.com/guidedLearning/createAGame/playerCamera
    let camRoot = new BABYLON.TransformNode("root");
    camRoot.position = new BABYLON.Vector3(0, 0, 0);
    camRoot.rotation = new BABYLON.Vector3(0, Math.PI, 0);

    let yTilt = new BABYLON.TransformNode("ytilt");
    yTilt.parent = camRoot;

    const camera = new BABYLON.UniversalCamera(
        "cam",
        new BABYLON.Vector3(0, 0.2, 0.5),
        scene,
    );
    camera.lockedTarget = camRoot.position;
    camera.fov = BABYLON.Tools.ToRadians(90);
    camera.parent = yTilt;
    camera.minZ = 0;

    // Keyboard events
    let inputMap: { [key: string]: string } = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnKeyDownTrigger,
            function (evt) {
                // @ts-ignore
                inputMap[evt.sourceEvent.key] =
                    evt.sourceEvent.type == "keydown";
            },
        ),
    );
    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnKeyUpTrigger,
            function (evt) {
                // @ts-ignore
                inputMap[evt.sourceEvent.key] =
                    evt.sourceEvent.type == "keydown";
            },
        ),
    );

    let hero = BABYLON.MeshBuilder.CreateSphere(
        "sphere",
        { diameter: 0.2 },
        scene,
    );
    hero.ellipsoid = new BABYLON.Vector3(0.2, 0.2, 0.2);
    camRoot.parent = hero;

    //Scale the model down
    hero.position.y = 0.1;
    hero.position.x = 0.25;
    hero.position.z = 0.25;
    hero.checkCollisions = true;

    let heroSpeed = 0.03;
    let heroSpeedBackwards = 0.01;
    let heroRotationSpeed = 0.1;

    scene.onBeforeRenderObservable.add(() => {
        if (inputMap["w"]) {
            const abc = hero.forward.scaleInPlace(heroSpeed);
            hero.moveWithCollisions(abc);
            hero.position.y = 0.1;
        }
        if (inputMap["s"]) {
            hero.moveWithCollisions(
                hero.forward.scaleInPlace(-heroSpeedBackwards),
            );
        }
        if (inputMap["a"]) {
            hero.rotate(BABYLON.Vector3.Up(), -heroRotationSpeed);
        }
        if (inputMap["d"]) {
            hero.rotate(BABYLON.Vector3.Up(), heroRotationSpeed);
        }
    });

    return scene;
};
