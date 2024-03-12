import * as BABYLON from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core";

export enum PlayerAnimEnum {
    walk = "walk",
    idle = "idle",
    dance = "dance",
    walkBack = "walkBack",
}

export class Player {
    private readonly rootNodes: BABYLON.Node[];
    private readonly walkAnim: BABYLON.AnimationGroup;
    private readonly walkBackAnim: BABYLON.AnimationGroup;
    private readonly idleAnim: BABYLON.AnimationGroup;
    private readonly danceAnim: BABYLON.AnimationGroup;
    private currentAnimation?: PlayerAnimEnum;

    public constructor(
        readonly instantiatedEntries: BABYLON.InstantiatedEntries,
        readonly scene: BABYLON.Scene,
    ) {
        this.rootNodes = instantiatedEntries.rootNodes;
        this.walkAnim = instantiatedEntries.animationGroups[3];
        this.walkBackAnim = instantiatedEntries.animationGroups[2];
        this.idleAnim = instantiatedEntries.animationGroups[1];
        this.danceAnim = instantiatedEntries.animationGroups[0];
    }

    public setPosition(x: number, y: number, z: number) {
        for (let node of this.rootNodes as BABYLON.Mesh[]) {
            node.position.x += x;
            node.position.x += x;
            node.position.x += x;
        }
    }

    public setDirection(x: number, y: number, z: number) {
        for (let node of this.rootNodes as BABYLON.Mesh[]) {
            const lookAtPoint = node.position.add(new Vector3(x, y, z));
            node.lookAt(lookAtPoint);
        }
    }

    public dispose() {
        this.instantiatedEntries.dispose();
    }

    public animate(animation: string) {
        switch (animation) {
            case PlayerAnimEnum.dance:
                if (this.currentAnimation !== PlayerAnimEnum.dance) {
                    this.stopAnimation(PlayerAnimEnum.walk);
                    this.stopAnimation(PlayerAnimEnum.walkBack);
                    this.stopAnimation(PlayerAnimEnum.idle);
                    this.startAnimation(this.danceAnim);
                }
                break;
            case PlayerAnimEnum.idle:
                if (this.currentAnimation !== PlayerAnimEnum.idle) {
                    this.stopAnimation(PlayerAnimEnum.dance);
                    this.stopAnimation(PlayerAnimEnum.walk);
                    this.stopAnimation(PlayerAnimEnum.walkBack);
                    this.startAnimation(this.idleAnim);
                }
                break;
            case PlayerAnimEnum.walk:
                if (this.currentAnimation !== PlayerAnimEnum.walk) {
                    this.stopAnimation(PlayerAnimEnum.dance);
                    this.stopAnimation(PlayerAnimEnum.walkBack);
                    this.stopAnimation(PlayerAnimEnum.idle);
                    this.startAnimation(this.walkAnim);
                }
                break;
            case PlayerAnimEnum.walkBack:
                if (this.currentAnimation !== PlayerAnimEnum.walkBack) {
                    this.stopAnimation(PlayerAnimEnum.dance);
                    this.stopAnimation(PlayerAnimEnum.walk);
                    this.stopAnimation(PlayerAnimEnum.idle);
                    this.startAnimation(this.walkBackAnim);
                }
                break;
            default:
                this.stopAllAnimation();
                break;
        }
    }

    public stopAllAnimation() {
        this.danceAnim.stop();
        this.walkAnim.stop();
        this.walkBackAnim.stop();
        this.idleAnim.stop();
    }

    public stopAnimation(animation: PlayerAnimEnum) {
        switch (animation) {
            case PlayerAnimEnum.dance:
                this.danceAnim.stop();
                break;
            case PlayerAnimEnum.idle:
                this.idleAnim.stop();
                break;
            case PlayerAnimEnum.walk:
                this.walkAnim.stop();
                break;
            case PlayerAnimEnum.walkBack:
                this.walkBackAnim.stop();
                break;
        }
    }

    private startAnimation(
        animation: BABYLON.Nullable<BABYLON.AnimationGroup>,
    ) {
        animation?.start(true, 1.0, animation.from, animation.to, false);
    }
}
