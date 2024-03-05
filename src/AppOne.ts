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
    const ground = BABYLON.MeshBuilder.CreateGround(
        "ground",
        { width: SIZE, height: SIZE },
        scene,
    );
    ground.material = groundMat;

    return ground;
};

const CAMERA_RADIUS = 1;
let FOCUS_POINT: BABYLON.Vector3;
let FOCUS_DIRECTION_FRONT: BABYLON.Vector3;
let FOCUS_DIRECTION_LEFT: BABYLON.Vector3;

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

        FOCUS_DIRECTION_FRONT = direction.clone();
        FOCUS_DIRECTION_LEFT = directionMesh
            .getDirection(new BABYLON.Vector3(1, 0, 0))
            .normalize();
        FOCUS_POINT = position.clone();

        const ray = new BABYLON.Ray(position, direction, 10);
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

const startAnimation = (
    animation: BABYLON.Nullable<BABYLON.AnimationGroup>,
) => {
    animation?.start(true, 1.0, animation.from, animation.to, false);
};

let createScene = function (engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    const scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;

    const gl = new BABYLON.GlowLayer("glow", scene);
    gl.intensity = 0.5;

    new BABYLON.HemisphericLight(
        "hemisphericLight",
        new BABYLON.Vector3(0, 1, 0),
    );
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
    let inputMap: { [key: string]: boolean } = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    const actions = [
        BABYLON.ActionManager.OnKeyDownTrigger,
        BABYLON.ActionManager.OnKeyUpTrigger,
    ];
    actions.forEach((actionManager) =>
        scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(actionManager, function (evt) {
                inputMap[evt.sourceEvent.key] =
                    evt.sourceEvent.type == "keydown";
            }),
        ),
    );

    BABYLON.SceneLoader.ImportMesh(
        null,
        character,
        undefined,
        scene,
        function (newMeshes, particleSystems, skeletons, animationGroups) {
            const character = newMeshes[0];
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

            let animating = true;

            const walkAnim = scene.getAnimationGroupByName("Running");
            const walkBackAnim = scene.getAnimationGroupByName("Moonwalk");
            const idleAnim = scene.getAnimationGroupByName("Idle");
            const sambaAnim = scene.getAnimationGroupByName("Dance");

            let heroSpeedLocal: number = 0;
            let characterFocusPoint: BABYLON.Vector3;
            //Rendering loop (executed for every frame)
            scene.onBeforeRenderObservable.add(() => {
                let keydown = false;
                //Manage the movements of the character (e.g. position, direction)
                if (inputMap["w"]) {
                    characterFocusPoint = FOCUS_POINT.add(
                        FOCUS_DIRECTION_FRONT,
                    );
                    heroSpeedLocal = heroSpeed;
                    keydown = true;
                }
                if (inputMap["s"]) {
                    characterFocusPoint = FOCUS_POINT.add(
                        FOCUS_DIRECTION_FRONT,
                    );
                    heroSpeedLocal = -heroSpeedBackwards;
                    keydown = true;
                }
                if (inputMap["a"]) {
                    characterFocusPoint = FOCUS_POINT.add(FOCUS_DIRECTION_LEFT);
                    heroSpeedLocal = heroSpeed;
                    keydown = true;
                }
                if (inputMap["d"]) {
                    characterFocusPoint =
                        FOCUS_POINT.subtract(FOCUS_DIRECTION_LEFT);
                    heroSpeedLocal = heroSpeed;
                    keydown = true;
                }
                if (inputMap["b"]) {
                    keydown = true;
                    heroSpeedLocal = 0;
                }

                if (keydown) {
                    characterFocusPoint.y = 0;
                    character.lookAt(characterFocusPoint);

                    character.moveWithCollisions(
                        character.forward.scaleInPlace(heroSpeedLocal),
                    );
                }

                //Manage animations to be played
                if (keydown) {
                    if (!animating) {
                        animating = true;
                        if (inputMap["s"]) {
                            startAnimation(walkBackAnim);
                        } else if (inputMap["b"]) {
                            startAnimation(sambaAnim);
                        } else {
                            startAnimation(walkAnim);
                        }
                    }
                } else {
                    if (animating) {
                        startAnimation(idleAnim);

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
