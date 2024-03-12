import * as BABYLON from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core";

export class Player {
    private mesh: BABYLON.AbstractMesh;

    public constructor(
        readonly container: BABYLON.AssetContainer,
        readonly scene: BABYLON.Scene,
    ) {
        this.mesh = container.meshes[0];
    }

    public setPosition(x: number, y: number, z: number) {
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;
    }

    public setDirection(x: number, y: number, z: number) {
        const lookAtPoint = this.mesh.position.add(new Vector3(x, y, z));
        this.mesh.lookAt(lookAtPoint);
    }

    public addToScene() {
        this.container.addAllToScene();
    }

    public removeFromScreen() {
        this.container.removeAllFromScene();
    }

    public dispose() {
        this.removeFromScreen();
        this.container.dispose();
    }
}
