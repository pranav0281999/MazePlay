import { MapSchema, Schema, type } from "@colyseus/schema";

export class Position extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") z: number = 0;

    constructor(x?: number, y?: number, z?: number) {
        super();
        if (!x || !y || !z) {
            return;
        }
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

export class Direction extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") z: number = 0;

    constructor(x?: number, y?: number, z?: number) {
        super();
        if (!x || !y || !z) {
            return;
        }
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

export class Player extends Schema {
    @type(Position) position: Position = new Position();
    @type(Direction) direction: Direction = new Direction();
    @type("string") animation: string = "";
}

export class MyRoomState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
}
