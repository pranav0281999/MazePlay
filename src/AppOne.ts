import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import * as BABYLON from "@babylonjs/core";
import { Maze } from "./Maze";

// @ts-ignore
import character from "./assets/character.glb";

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

const CAMERA_RADIUS = 1;
let globalPosition: BABYLON.Vector3;
let globalDirection: BABYLON.Vector3;

const setPlayerCamera = (
    scene: BABYLON.Scene,
    character: BABYLON.AbstractMesh,
    camera: BABYLON.ArcRotateCamera,
) => {
    const directionMesh = new BABYLON.Mesh("directionMesh");
    directionMesh.setParent(camera);
    directionMesh.bakeCurrentTransformIntoVertices();
    directionMesh.isPickable = false;

    const playerCameraFocusMesh = new BABYLON.AbstractMesh(
        "playerCameraFocusMesh",
        scene,
    );
    playerCameraFocusMesh.position.y = 0.5;
    playerCameraFocusMesh.isPickable = false;

    playerCameraFocusMesh.setParent(character);
    camera.setTarget(playerCameraFocusMesh);

    scene.onBeforeRenderObservable.add(function () {
        let worldMatrix = playerCameraFocusMesh.getWorldMatrix();
        let quaternion = new BABYLON.Quaternion();
        let position = new BABYLON.Vector3();
        let scale = new BABYLON.Vector3();

        worldMatrix.decompose(scale, quaternion, position);

        const direction = directionMesh.getDirection(
            new BABYLON.Vector3(0, 0, -1),
        );
        direction.normalize();

        globalDirection = direction.clone();
        globalPosition = position.clone();

        const ray = new BABYLON.Ray(position, direction, 10);
        // let rayHelper = new BABYLON.RayHelper(ray);
        // rayHelper.show(scene);
        let hits = scene.pickWithRay(ray);
        if (hits?.pickedMesh) {
            const distance = hits?.pickedPoint?.subtract(position).length();
            if (distance) {
                camera.radius = Math.min(distance, CAMERA_RADIUS);
            }
        } else {
            camera.radius = CAMERA_RADIUS;
        }
    });
};

let createScene = function (engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    const scene = new BABYLON.Scene(engine);
    // scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    // scene.fogDensity = 0.3;
    // scene.fogColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    // scene.gravity = new BABYLON.Vector3(0, -9, 0);
    scene.collisionsEnabled = true;

    const gl = new BABYLON.GlowLayer("glow", scene);
    gl.intensity = 0.5;

    new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0));

    new BABYLON.AxesViewer(scene, 1);

    new Maze(SIZE, scene);

    createGround(scene);

    const camera = new BABYLON.ArcRotateCamera(
        "camera",
        BABYLON.Tools.ToRadians(-90),
        BABYLON.Tools.ToRadians(60),
        CAMERA_RADIUS,
        new BABYLON.Vector3(0, 0, 0),
        scene,
    );
    camera.attachControl(canvas, true);
    camera.wheelPrecision = 15;
    camera.fov = BABYLON.Tools.ToRadians(90);
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
        null,
        character,
        undefined,
        scene,
        function (newMeshes, particleSystems, skeletons, animationGroups) {
            let character = newMeshes[0];
            character.ellipsoid = new BABYLON.Vector3(0.1, 0.5, 0.1);

            setPlayerCamera(scene, character, camera);

            character.position.y = 0;
            character.position.x = 0.5;
            character.position.z = 0.5;

            function setIsPickableRecursive(mesh: BABYLON.AbstractMesh) {
                mesh.isPickable = false;
                for (let childMesh of mesh.getChildMeshes()) {
                    setIsPickableRecursive(childMesh);
                }
            }

            setIsPickableRecursive(character);

            //Hero character variables
            let heroSpeed = 0.03;
            let heroSpeedBackwards = 0.01;
            let heroRotationSpeed = 0.1;

            let animating = true;

            const walkAnim = scene.getAnimationGroupByName("Running");
            const walkBackAnim = scene.getAnimationGroupByName("Moonwalk");
            const idleAnim = scene.getAnimationGroupByName("Idle");
            const sambaAnim = scene.getAnimationGroupByName("Dance");

            //Rendering loop (executed for every frame)
            scene.onBeforeRenderObservable.add(() => {
                let keydown = false;
                //Manage the movements of the character (e.g. position, direction)
                if (inputMap["w"]) {
                    const characterFocusPoint = globalPosition.add(globalDirection);
                    characterFocusPoint.y = 0;
                    character.lookAt(characterFocusPoint);

                    const forwardScale =
                        character.forward.scaleInPlace(heroSpeed);
                    character.moveWithCollisions(forwardScale);
                    character.position.y = 0;
                    keydown = true;
                }
                if (inputMap["s"]) {
                    character.moveWithCollisions(
                        character.forward.scaleInPlace(-heroSpeedBackwards),
                    );
                    keydown = true;
                }
                if (inputMap["a"]) {
                    character.rotate(BABYLON.Vector3.Up(), -heroRotationSpeed);
                    keydown = true;
                }
                if (inputMap["d"]) {
                    character.rotate(BABYLON.Vector3.Up(), heroRotationSpeed);
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
