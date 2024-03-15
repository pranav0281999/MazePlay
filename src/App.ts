import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import * as BABYLON from "@babylonjs/core";
import { Maze } from "./components/Maze";
// @ts-ignore
import characterGLB from "./assets/character.glb";
import * as Colyseus from "colyseus.js";
import { MazePlayRoomState, PlayerState } from "./classes/MazePlayRoomState";
import { Player, PlayerAnimEnum } from "./classes/Player";
import { throttle } from "./utils/throttle";

export class App {
    engine: BABYLON.Engine;
    scene: BABYLON.Scene;
    room: Colyseus.Room<MazePlayRoomState>;
    characterContainer?: BABYLON.AssetContainer;

    constructor(
        readonly canvas: HTMLCanvasElement,
        room: Colyseus.Room<MazePlayRoomState>,
    ) {
        this.room = room;
        this.engine = new BABYLON.Engine(canvas);
        this.scene = new BABYLON.Scene(this.engine);
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }

    loadAssets(resolve?: () => void, reject?: (e: any) => void) {
        BABYLON.SceneLoader.LoadAssetContainer(
            characterGLB,
            undefined,
            this.scene,
            (container) => {
                this.characterContainer = container;
                !!resolve && resolve();
            },
            undefined,
            (scene, message, e) => {
                console.error(message, e);
                !!reject && reject(e);
            },
        );
    }

    debug(debugOn: boolean = true) {
        if (debugOn) {
            this.scene.debugLayer.show({ overlay: true });
        } else {
            this.scene.debugLayer.hide();
        }
    }

    run() {
        if (!this.characterContainer) {
            return;
        }
        createScene(
            this.scene,
            this.canvas,
            this.room,
            this.characterContainer,
        );

        this.debug(false);
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

const players: { [key: string]: Player } = {};

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

    camera.setTarget(playerCameraFocusMesh);

    scene.onBeforeRenderObservable.add(function () {
        playerCameraFocusMesh.position.x = character.position.x;
        playerCameraFocusMesh.position.z = character.position.z;

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

let CURRENT_ANIMATION = "";

let createScene = function (
    scene: BABYLON.Scene,
    canvas: HTMLCanvasElement,
    room: Colyseus.Room<MazePlayRoomState>,
    characterContainer: BABYLON.AssetContainer,
) {
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

    const character = characterContainer.meshes[0];
    character.ellipsoid = new BABYLON.Vector3(0.1, 0.5, 0.1);

    characterContainer.addAllToScene();

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

    const walkAnim = characterContainer.animationGroups[3];
    const walkBackAnim = characterContainer.animationGroups[2];
    const idleAnim = characterContainer.animationGroups[1];
    const sambaAnim = characterContainer.animationGroups[0];

    let heroSpeedLocal: number = 0;
    let characterFocusPoint: BABYLON.Vector3;
    //Rendering loop (executed for every frame)
    scene.onBeforeRenderObservable.add(() => {
        let keydown = false;
        //Manage the movements of the character (e.g. position, direction)
        if (inputMap["w"]) {
            characterFocusPoint = FOCUS_POINT.add(FOCUS_DIRECTION_FRONT);
            heroSpeedLocal = heroSpeed;
            keydown = true;
        }
        if (inputMap["s"]) {
            characterFocusPoint = FOCUS_POINT.add(FOCUS_DIRECTION_FRONT);
            heroSpeedLocal = -heroSpeedBackwards;
            keydown = true;
        }
        if (inputMap["a"]) {
            characterFocusPoint = FOCUS_POINT.add(FOCUS_DIRECTION_LEFT);
            heroSpeedLocal = heroSpeed;
            keydown = true;
        }
        if (inputMap["d"]) {
            characterFocusPoint = FOCUS_POINT.subtract(FOCUS_DIRECTION_LEFT);
            heroSpeedLocal = heroSpeed;
            keydown = true;
        }
        if (inputMap["b"]) {
            keydown = true;
            heroSpeedLocal = 0;
        }

        if (keydown && !!characterFocusPoint) {
            characterFocusPoint.y = 0;
            character.lookAt(characterFocusPoint);

            character.moveWithCollisions(
                character.forward.scaleInPlace(heroSpeedLocal),
            );
        }

        if (keydown || animating) {
            throttle(() => {
                if (!FOCUS_POINT) {
                    return;
                }
                room.send("playerUpdate", {
                    position: { x: FOCUS_POINT.x, y: 0, z: FOCUS_POINT.z },
                    direction: {
                        x: character.rotationQuaternion?.x,
                        y: character.rotationQuaternion?.y,
                        z: character.rotationQuaternion?.z,
                        w: character.rotationQuaternion?.w,
                    },
                    animation: CURRENT_ANIMATION,
                } as PlayerState);
            }, 100);
        }

        //Manage animations to be played
        if (keydown) {
            if (!animating) {
                animating = true;
                if (inputMap["s"]) {
                    CURRENT_ANIMATION = PlayerAnimEnum.walkBack;
                    startAnimation(walkBackAnim);
                } else if (inputMap["b"]) {
                    CURRENT_ANIMATION = PlayerAnimEnum.dance;
                    startAnimation(sambaAnim);
                } else {
                    CURRENT_ANIMATION = PlayerAnimEnum.walk;
                    startAnimation(walkAnim);
                }
            }
        } else {
            if (animating) {
                CURRENT_ANIMATION = PlayerAnimEnum.idle;
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

    try {
        room.state.players.onAdd((player, sessionId) => {
            if (sessionId === room.sessionId) {
                return;
            }

            console.log("player joined", player);
            players[sessionId] = new Player(
                characterContainer.instantiateModelsToScene(),
                scene,
            );
            players[sessionId].animate(PlayerAnimEnum.idle);

            // update local target position
            player.onChange(() => {
                console.log(
                    "player",
                    [player.position.x, player.position.y, player.position.z],
                    [
                        player.direction.x,
                        player.direction.y,
                        player.direction.z,
                        player.direction.w,
                    ],
                    player.animation,
                );
                players[sessionId].setPosition(
                    player.position.x,
                    player.position.y,
                    player.position.z,
                );
                players[sessionId].setDirection(
                    new BABYLON.Quaternion(
                        player.direction.x,
                        player.direction.y,
                        player.direction.z,
                        player.direction.w,
                    ),
                );
                players[sessionId].animate(player.animation);
            });
        });

        room.state.players.onRemove((player, sessionId) => {
            console.log("player left", player);
            players[sessionId].dispose();
            delete players[sessionId];
        });

        room.onStateChange((state) => {
            // console.log(room.name, "has new state:", state);
        });

        room.onMessage("message_type", (message) => {
            // console.log(room.sessionId, "received on", room.name, message);
        });

        room.onError((code: number, message?: string) => {
            console.log(room.sessionId, "couldn't join", room.name);
        });

        room.onLeave((code: number) => {
            console.log(room.sessionId, "left", room.name);
        });
    } catch (e) {
        console.error(e);
    }
};
