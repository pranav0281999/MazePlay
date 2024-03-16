import * as BABYLON from "@babylonjs/core";
import { Cell3D } from "./Cell3D";
import { ICell } from "../interfaces/ICell";

export class Maze3D {
    private grid: ICell[][];
    private readonly size: number;

    public constructor(grid: ICell[][], size: number, scene: BABYLON.Scene) {
        this.grid = grid;
        this.size = size;

        for (let x = 0; x < this.size; x++) {
            for (let z = 0; z < this.size; z++) {
                new Cell3D(this.grid[x][z], scene, size).draw();
            }
        }
    }
}
