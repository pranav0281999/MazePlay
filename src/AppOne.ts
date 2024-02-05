import * as BABYLON from "babylonjs";
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

var createScene = function (engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera(
        "camera",
        -Math.PI / 2,
        -Math.PI,
        SIZE * 2,
        new BABYLON.Vector3(SIZE / 2, 0, SIZE / 2),
    );
    camera.attachControl(canvas, true);

    new BABYLON.PointLight("light", new BABYLON.Vector3(0, SIZE / 2, SIZE));
    new BABYLON.PointLight("light", new BABYLON.Vector3(SIZE, SIZE / 2, 0));
    new BABYLON.PointLight("light", new BABYLON.Vector3(0, SIZE / 2, 0));
    new BABYLON.PointLight("light", new BABYLON.Vector3(SIZE, SIZE / 2, SIZE));

    new BABYLON.Debug.AxesViewer(scene, 1);

    new Maze(SIZE, scene);

    return scene;
};
