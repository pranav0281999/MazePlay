import { CellWallConfigTRBL } from "../types/cell-types";

export interface ICell {
    walls: CellWallConfigTRBL;
    positionX: number;
    positionZ: number;
}
