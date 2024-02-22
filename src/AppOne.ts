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
    groundMat.disableLighting = true;
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

    const lightCoords = [
        new BABYLON.Vector3(-SIZE / 2, SIZE / 2, SIZE / 2),
        new BABYLON.Vector3(SIZE / 2, SIZE / 2, -SIZE / 2),
        new BABYLON.Vector3(-SIZE / 2, SIZE / 2, -SIZE / 2),
        new BABYLON.Vector3(SIZE / 2, SIZE / 2, SIZE / 2),
    ];
    lightCoords.forEach(
        (coord, index) => new BABYLON.PointLight(`light_${index}`, coord),
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
        new BABYLON.Vector3(0, 1, 1),
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

    // Load hero character
    BABYLON.SceneLoader.ImportMesh(
        "",
        "http://localhost:8080/",
        "untitled.glb",
        scene,
        function (newMeshes, particleSystems, skeletons, animationGroups) {
            var hero = newMeshes[0];
            hero.ellipsoid = new BABYLON.Vector3(0.1, 0.5, 0.1);
            camRoot.parent = hero;

            console.log(animationGroups);

            hero.position.y = 0;

            //Hero character variables
            var heroSpeed = 0.03;
            var heroSpeedBackwards = 0.01;
            var heroRotationSpeed = 0.1;

            var animating = true;

            const walkAnim = scene.getAnimationGroupByName("Running");
            const walkBackAnim = scene.getAnimationGroupByName("Moonwalk");
            const idleAnim = scene.getAnimationGroupByName("Idle");
            const sambaAnim = scene.getAnimationGroupByName("Dance");

            //Rendering loop (executed for everyframe)
            scene.onBeforeRenderObservable.add(() => {
                var keydown = false;
                //Manage the movements of the character (e.g. position, direction)
                if (inputMap["w"]) {
                    const forwardScale = hero.forward.scaleInPlace(heroSpeed);
                    hero.moveWithCollisions(forwardScale);
                    hero.position.y = 0;
                    keydown = true;
                }
                if (inputMap["s"]) {
                    hero.moveWithCollisions(
                        hero.forward.scaleInPlace(-heroSpeedBackwards),
                    );
                    keydown = true;
                }
                if (inputMap["a"]) {
                    hero.rotate(BABYLON.Vector3.Up(), heroRotationSpeed);
                    keydown = true;
                }
                if (inputMap["d"]) {
                    hero.rotate(BABYLON.Vector3.Up(), -heroRotationSpeed);
                    keydown = true;
                }
                if (inputMap["b"]) {
                    keydown = true;
                }

                //Manage animations to be played
                if (keydown) {
                    if (!animating) {
                        animating = true;
                        if (inputMap["s"]) {
                            //Walk backwards
                            walkBackAnim?.start(
                                true,
                                1.0,
                                walkBackAnim.from,
                                walkBackAnim.to,
                                false,
                            );
                        } else if (inputMap["b"]) {
                            //Samba!
                            sambaAnim?.start(
                                true,
                                1.0,
                                sambaAnim.from,
                                sambaAnim.to,
                                false,
                            );
                        } else {
                            //Walk
                            walkAnim?.start(
                                true,
                                1.0,
                                walkAnim.from,
                                walkAnim.to,
                                false,
                            );
                        }
                    }
                } else {
                    if (animating) {
                        //Default animation is idle when no key is down
                        idleAnim?.start(
                            true,
                            1.0,
                            idleAnim.from,
                            idleAnim.to,
                            false,
                        );

                        //Stop all animations besides Idle Anim when no key is down
                        sambaAnim?.stop();
                        walkAnim?.stop();
                        walkBackAnim?.stop();

                        //Ensure animation are played only once per rendering loop
                        animating = false;
                    }
                }
            });
        },
    );

    return scene;
};
