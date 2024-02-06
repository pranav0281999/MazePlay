import * as BABYLON from "@babylonjs/core";
import { Cell } from "./Cell";
import { WallTypeEnum } from "./enums/wall-type-enum";

export class Maze {
    private grid: Cell[][];
    private readonly size: number;
    private readonly scene: BABYLON.Scene;
    private readonly visitArr: boolean[][];

    public constructor(size: number, scene: BABYLON.Scene) {
        this.grid = [];
        this.visitArr = [];
        this.size = size;
        this.scene = scene;

        for (let x = 0; x < this.size; x++) {
            this.grid.push([]);
            this.visitArr.push([]);
            for (let z = 0; z < this.size; z++) {
                this.grid[x].push(new Cell(x, z, this.scene, this.size));
                this.visitArr[x].push(false);
            }
        }

        this.scan(
            Math.floor(Math.random() * this.size),
            Math.floor(Math.random() * this.size),
        );

        for (let x = 0; x < this.size; x++) {
            for (let z = 0; z < this.size; z++) {
                this.grid[x][z].draw();
            }
        }
    }

    private scan(x: number, z: number) {
        this.visitArr[x][z] = true;
        const dirs = [
            WallTypeEnum.LEFT,
            WallTypeEnum.RIGHT,
            WallTypeEnum.BOTTOM,
            WallTypeEnum.TOP,
        ];
        dirs.sort(() => Math.random() - 0.5);
        dirs.forEach((dir) => {
            if (WallTypeEnum.LEFT === dir) {
                if (x > 0) {
                    if (!this.visitArr[x - 1][z]) {
                        this.grid[x - 1][z].walls[WallTypeEnum.RIGHT] = false;
                        this.grid[x][z].walls[WallTypeEnum.LEFT] = false;
                        this.scan(x - 1, z);
                    }
                }
            }
            if (WallTypeEnum.RIGHT === dir) {
                if (x < this.size - 1) {
                    if (!this.visitArr[x + 1][z]) {
                        this.grid[x][z].walls[WallTypeEnum.RIGHT] = false;
                        this.grid[x + 1][z].walls[WallTypeEnum.LEFT] = false;
                        this.scan(x + 1, z);
                    }
                }
            }
            if (WallTypeEnum.TOP === dir) {
                if (z < this.size - 1) {
                    if (!this.visitArr[x][z + 1]) {
                        this.grid[x][z + 1].walls[WallTypeEnum.BOTTOM] = false;
                        this.grid[x][z].walls[WallTypeEnum.TOP] = false;
                        this.scan(x, z + 1);
                    }
                }
            }
            if (WallTypeEnum.BOTTOM === dir) {
                if (z > 0) {
                    if (!this.visitArr[x][z - 1]) {
                        this.grid[x][z].walls[WallTypeEnum.BOTTOM] = false;
                        this.grid[x][z - 1].walls[WallTypeEnum.TOP] = false;
                        this.scan(x, z - 1);
                    }
                }
            }
        });
    }
}
