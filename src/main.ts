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

window.addEventListener("DOMContentLoaded", () => {
    joinRoom(serverUrlInput.value).then(() => {
        startRender();
    });
});

joinBtn.addEventListener("click", () => joinRoom(serverUrlInput.value));
startBtn.addEventListener("click", startRender);
