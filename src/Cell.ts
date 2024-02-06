import * as BABYLON from "@babylonjs/core";
import { CellWallConfigTRBL } from "./types/cell-types";
import { WallTypeEnum } from "./enums/wall-type-enum";

export class Cell {
    private readonly positionX;
    private readonly positionZ;
    public walls: CellWallConfigTRBL = {
        [WallTypeEnum.TOP]: true,
        [WallTypeEnum.RIGHT]: true,
        [WallTypeEnum.LEFT]: true,
        [WallTypeEnum.BOTTOM]: true,
    };
    private wallMatRef: BABYLON.StandardMaterial | undefined;
    private readonly scene: BABYLON.Scene;
    private readonly size: number;
    private static verWallMeshRef: BABYLON.Mesh | undefined;
    private static horWallMeshRef: BABYLON.Mesh | undefined;

    public constructor(
        x: number,
        z: number,
        scene: BABYLON.Scene,
        size: number,
    ) {
        this.positionX = x;
        this.positionZ = z;
        this.scene = scene;
        this.size = size;
    }

    private getPosition(pos: WallTypeEnum) {
        if (pos === WallTypeEnum.TOP || pos === WallTypeEnum.BOTTOM) {
            return new BABYLON.Vector3(
                this.positionX + 0.5 - this.size / 2,
                0.5,
                this.positionZ - 0.005 + (pos === WallTypeEnum.TOP ? 1 : 0) - this.size / 2,
            );
        }
        if (pos === WallTypeEnum.LEFT || pos === WallTypeEnum.RIGHT) {
            return new BABYLON.Vector3(
                this.positionX - 0.005 + (pos === WallTypeEnum.RIGHT ? 1 : 0) - this.size / 2,
                0.5,
                this.positionZ + 0.5 - this.size / 2,
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
                this.positionX / this.size,
                this.positionZ / this.size,
                1,
            );
            this.wallMatRef = wallMat;
        }

        return this.wallMatRef;
    }

    private createVerticalWall(name: string) {
        if (!Cell.verWallMeshRef) {
            Cell.verWallMeshRef = BABYLON.MeshBuilder.CreateBox(
                "verWall",
                {
                    height: 1,
                    depth: 1,
                    width: 0.01,
                },
                this.scene,
            );
            Cell.verWallMeshRef.setEnabled(false);
        }
        const instance = Cell.verWallMeshRef.clone(name);
        instance.material = this.getWallMat();
        instance.setEnabled(true);
        return instance;
    }

    private createHorizontalWall(name: string) {
        if (!Cell.horWallMeshRef) {
            Cell.horWallMeshRef = BABYLON.MeshBuilder.CreateBox(
                "horWall",
                {
                    height: 1,
                    depth: 0.01,
                    width: 1,
                },
                this.scene,
            );
            Cell.horWallMeshRef.setEnabled(false);
        }
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
