import { App as App } from "./App";

const startBtn = document.getElementById("start-btn") as HTMLButtonElement;
const startScreen = document.getElementById("start-screen-div") as HTMLDivElement;

console.log(`main.ts starting ${App.name}`);

function startRender() {
    startScreen.style.display = "none";
    let canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    let app = new App(canvas);
    app.run();
}

// window.addEventListener('DOMContentLoaded', () => {
//     startRender();
// });

startBtn.addEventListener("click", startRender);
