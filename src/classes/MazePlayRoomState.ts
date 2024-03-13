import { MapSchema, Schema, type } from "@colyseus/schema";

export class PositionState extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") z: number = 0;

    constructor(x?: number, y?: number, z?: number) {
        super();
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.z = z ?? 0;
    }
}

export class DirectionState extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") z: number = 0;
    @type("number") w: number = 0;

    constructor(x?: number, y?: number, z?: number, w?: number) {
        super();
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.z = z ?? 0;
        this.w = w ?? 0;
    }
}

export class PlayerState extends Schema {
    @type(PositionState) position: PositionState = new PositionState();
    @type(DirectionState) direction: DirectionState = new DirectionState();
    @type("string") animation: string = "";
}

export class MazePlayRoomState extends Schema {
    @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
