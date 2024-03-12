import { App as App } from "./App";
import * as Colyseus from "colyseus.js";
import { MazePlayRoomState } from "./classes/MazePlayRoomState";

const startBtn = document.getElementById("start-btn") as HTMLButtonElement;
const joinBtn = document.getElementById("join-btn") as HTMLButtonElement;
const startScreen = document.getElementById(
    "start-screen-div",
) as HTMLDivElement;
const loadingScreen = document.getElementById(
    "loading-screen-div",
) as HTMLDivElement;
const serverUrlInput = document.getElementById(
    "server-url-input",
) as HTMLInputElement;
let room: Colyseus.Room<MazePlayRoomState>;

console.log(`main.ts starting ${App.name}`);

function showLoadingScreen() {
    startScreen.style.display = "none";
    loadingScreen.style.display = "flex";
}

function showCanvas() {
    startScreen.style.display = "none";
    loadingScreen.style.display = "none";
}

function showStartScreen() {
    startScreen.style.display = "flex";
    loadingScreen.style.display = "none";
}

showStartScreen();

async function joinRoom(url: string) {
    let client = new Colyseus.Client(url);
    try {
        room = await client.joinOrCreate<MazePlayRoomState>("room_name");

        console.log(room.sessionId, "joined", room.name);

        room.state.players.onAdd((player, sessionId) => {
            console.log("player joined", player);

            // update local target position
            player.onChange(() => {
                console.log(
                    "player",
                    [player.position.x, player.position.y, player.position.z],
                    [
                        player.direction.x,
                        player.direction.y,
                        player.direction.z,
                    ],
                );
            });
        });

        room.state.players.onRemove((player, sessionId) => {
            console.log("player left", player);
        })

        room.onStateChange((state) => {
            console.log(room.name, "has new state:", state);
        });

        room.onMessage("message_type", (message) => {
            console.log(room.sessionId, "received on", room.name, message);
        });

        room.onError((code: number, message?: string) => {
            console.log(room.sessionId, "couldn't join", room.name);
        });

        room.onLeave((code: number) => {
            console.log(room.sessionId, "left", room.name);
        });
    } catch (e) {
        console.error("JOIN ERROR", e);
    }
}

function startRender() {
    if (!room) {
        return;
    }
    startScreen.style.display = "none";
    let canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    let app = new App(canvas, room);
    showLoadingScreen();
    app.loadAssets(
        () => {
            app.run();
            showCanvas();
        },
        () => {},
    );
}

// window.addEventListener('DOMContentLoaded', () => {
//     startRender();
// });

joinBtn.addEventListener("click", () => joinRoom(serverUrlInput.value));
startBtn.addEventListener("click", startRender);
