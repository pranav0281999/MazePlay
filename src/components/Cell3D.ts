import * as BABYLON from "@babylonjs/core";
import { CellWallConfigTRBL } from "../types/cell-types";
import { WallTypeEnum } from "../enums/wall-type-enum";
import { ICell } from "../interfaces/ICell";

export class Cell3D implements ICell {
    private static verWallMeshRef: BABYLON.Mesh | undefined;
    private static horWallMeshRef: BABYLON.Mesh | undefined;
    public walls: CellWallConfigTRBL;
    public readonly positionX: number;
    public readonly positionZ: number;
    private wallMatRef: BABYLON.StandardMaterial | undefined;
    private readonly scene: BABYLON.Scene;
    private readonly size: number;

    public constructor(cell: ICell, scene: BABYLON.Scene, size: number) {
        this.positionX = cell.positionX;
        this.positionZ = cell.positionZ;
        this.walls = cell.walls;
        this.scene = scene;
        this.size = size;
    }

    public draw() {
        if (this.walls[WallTypeEnum.LEFT] && this.positionX === 0) {
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

        if (this.walls[WallTypeEnum.TOP] && this.positionZ === this.size - 1) {
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

    private getPosition(pos: WallTypeEnum) {
        if (pos === WallTypeEnum.TOP || pos === WallTypeEnum.BOTTOM) {
            return new BABYLON.Vector3(
                this.positionX + 0.5 - this.size / 2,
                0.5,
                this.positionZ -
                    0.005 +
                    (pos === WallTypeEnum.TOP ? 1 : 0) -
                    this.size / 2,
            );
        }
        if (pos === WallTypeEnum.LEFT || pos === WallTypeEnum.RIGHT) {
            return new BABYLON.Vector3(
                this.positionX -
                    0.005 +
                    (pos === WallTypeEnum.RIGHT ? 1 : 0) -
                    this.size / 2,
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
            wallMat.disableLighting = true;
            wallMat.emissiveColor = new BABYLON.Color3(
                (this.positionX / this.size) * 0.5,
                (this.positionZ / this.size) * 0.5,
                0.5,
            );
            this.wallMatRef = wallMat;
        }

        return this.wallMatRef;
    }

    private createVerticalWall(name: string) {
        if (!Cell3D.verWallMeshRef) {
            Cell3D.verWallMeshRef = BABYLON.MeshBuilder.CreateBox(
                "verWall",
                {
                    height: 1,
                    depth: 1,
                    width: 0.01,
                },
                this.scene,
            );
            Cell3D.verWallMeshRef.setEnabled(false);
        }
        const instance = Cell3D.verWallMeshRef.clone(name);
        instance.material = this.getWallMat();
        instance.setEnabled(true);
        instance.checkCollisions = true;
        instance.ellipsoid = new BABYLON.Vector3(1, 1, 0.01);
        return instance;
    }

    private createHorizontalWall(name: string) {
        if (!Cell3D.horWallMeshRef) {
            Cell3D.horWallMeshRef = BABYLON.MeshBuilder.CreateBox(
                "horWall",
                {
                    height: 1,
                    depth: 0.01,
                    width: 1,
                },
                this.scene,
            );
            Cell3D.horWallMeshRef.setEnabled(false);
        }
        const instance = Cell3D.horWallMeshRef.clone(name);
        instance.material = this.getWallMat();
        instance.setEnabled(true);
        instance.checkCollisions = true;
        instance.ellipsoid = new BABYLON.Vector3(1, 1, 0.01);
        return instance;
    }
}
