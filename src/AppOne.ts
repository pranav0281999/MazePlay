import * as BABYLON from "babylonjs";
import { CellWallConfigTRBL } from "./types/cell-types";
import { WallTypeEnum } from "./enums/wall-type-enum";

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

class Cell {
    private readonly positionX;
    private readonly positionZ;
    public walls: CellWallConfigTRBL = {
        [WallTypeEnum.TOP]: true,
        [WallTypeEnum.RIGHT]: true,
        [WallTypeEnum.LEFT]: true,
        [WallTypeEnum.BOTTOM]: true,
    };
    static verWallMeshRef: BABYLON.Mesh;
    static horWallMeshRef: BABYLON.Mesh;
    private wallMatRef: BABYLON.StandardMaterial | undefined;
    private readonly scene: BABYLON.Scene;

    public constructor(x: number, z: number, scene: BABYLON.Scene) {
        this.positionX = x;
        this.positionZ = z;
        this.scene = scene;
    }

    private getPosition(pos: WallTypeEnum) {
        if (pos === WallTypeEnum.TOP || pos === WallTypeEnum.BOTTOM) {
            return new BABYLON.Vector3(
                this.positionX + 0.5,
                0.5,
                this.positionZ - 0.005 + (pos === WallTypeEnum.TOP ? 1 : 0),
            );
        }
        if (pos === WallTypeEnum.LEFT || pos === WallTypeEnum.RIGHT) {
            return new BABYLON.Vector3(
                this.positionX - 0.005 + (pos === WallTypeEnum.RIGHT ? 1 : 0),
                0.5,
                this.positionZ + 0.5,
            );
        }
        return new BABYLON.Vector3(0, 0, 0);
    }

    private getWallMat() {
        if (!this.wallMatRef) {
            const wallMat = new BABYLON.StandardMaterial(
                `mat_${this.positionX}_${this.positionZ}`,
            );
            wallMat.diffuseColor = new BABYLON.Color3(
                this.positionX / 10,
                this.positionZ / 10,
                1,
            );
            this.wallMatRef = wallMat;
        }

        return this.wallMatRef;
    }

    private createVerticalWall(name: string) {
        const instance = Cell.verWallMeshRef.clone(name);
        instance.material = this.getWallMat();
        instance.setEnabled(true);
        return instance;
    }

    private createHorizontalWall(name: string) {
        const instance = Cell.horWallMeshRef.clone(name);
        instance.material = this.getWallMat();
        instance.setEnabled(true);
        return instance;
    }

    public draw() {
        if (this.walls[WallTypeEnum.LEFT]) {
            const wallL = this.createVerticalWall(
                `wall_l_${this.positionX}_${this.positionZ}`,
            );
            wallL.position = this.getPosition(WallTypeEnum.LEFT);
        }

        if (this.walls[WallTypeEnum.RIGHT]) {
            const wallR = this.createVerticalWall(
                `wall_r_${this.positionX}_${this.positionZ}`,
            );
            wallR.position = this.getPosition(WallTypeEnum.RIGHT);
        }

        if (this.walls[WallTypeEnum.TOP]) {
            const wallT = this.createHorizontalWall(
                `wall_t_${this.positionX}_${this.positionZ}`,
            );
            wallT.position = this.getPosition(WallTypeEnum.TOP);
        }

        if (this.walls[WallTypeEnum.BOTTOM]) {
            const wallB = this.createHorizontalWall(
                `wall_b_${this.positionX}_${this.positionZ}`,
            );
            wallB.position = this.getPosition(WallTypeEnum.BOTTOM);
        }

        return this;
    }
}

var createScene = function (engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    const scene = new BABYLON.Scene(engine);

    const verWallMeshRef = BABYLON.MeshBuilder.CreateBox(
        "verWall",
        {
            height: 1,
            depth: 1,
            width: 0.01,
        },
        scene,
    );
    verWallMeshRef.setEnabled(false);

    const horWallMeshRef = BABYLON.MeshBuilder.CreateBox(
        "horWall",
        {
            height: 1,
            depth: 0.01,
            width: 1,
        },
        scene,
    );
    horWallMeshRef.setEnabled(false);

    Cell.verWallMeshRef = verWallMeshRef;
    Cell.horWallMeshRef = horWallMeshRef;

    const camera = new BABYLON.ArcRotateCamera(
        "camera",
        -Math.PI / 2,
        -Math.PI,
        20,
        new BABYLON.Vector3(5, 0, 5),
    );
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(1, 1, 0),
    );
    const axes = new BABYLON.Debug.AxesViewer(scene, 1);

    const grid: Cell[][] = [];
    for (let x = 0; x < 10; x++) {
        grid.push([]);
        for (let z = 0; z < 10; z++) {
            grid[x].push(new Cell(x, z, scene));
        }
    }

    grid[2][0].walls[WallTypeEnum.RIGHT] = false;
    grid[3][0].walls[WallTypeEnum.LEFT] = false;

    for (let x = 0; x < 10; x++) {
        for (let z = 0; z < 10; z++) {
            grid[x][z].draw();
        }
    }

    return scene;
};
