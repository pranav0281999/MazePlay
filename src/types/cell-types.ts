import { WallTypeEnum } from "../enums/wall-type-enum";

export type CellWallConfigTRBL = {
    [WallTypeEnum.TOP]: boolean;
    [WallTypeEnum.RIGHT]: boolean;
    [WallTypeEnum.LEFT]: boolean;
    [WallTypeEnum.BOTTOM]: boolean;
};
