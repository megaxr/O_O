/// <reference types="https://cdn.jsdelivr.net/npm/babylonjs@5.45.0/babylon.module.d.ts"/>
/// <reference types="https://cdn.jsdelivr.net/npm/babylonjs-gui@5.45.0/babylon.gui.module.d.ts"/>

import { createMachine, interpret } from "https://esm.sh/xstate@4.35.4";

export default class O_O {
  private static o_o: O_O;
  // BabylonJS
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private xr: BABYLON.WebXRExperienceHelper | undefined;
  // XState
  private machine;
  private service;

  private constructor(canvas: HTMLCanvasElement) {
    // init engine
    this.engine = new BABYLON.Engine(canvas);
    this.scene = new BABYLON.Scene(this.engine);
    this.engine.runRenderLoop(() => this.scene.render());
    // init XR
    new BABYLON.FreeCamera("", BABYLON.Vector3.Zero(), this.scene); // hack for keep camera height when re-entry XR.
    this.scene.createDefaultXRExperienceAsync().then((xrHelper) => {
      this.xr = xrHelper.baseExperience;
      this.xr && this.xr.onStateChangedObservable.add((state) => {
        (state == 2) && this.service.send("按進XR"); // IN_XR
        (state == 3) && this.service.send("按離開XR"); // NOT_IN_XR
      });
    });
    // init machine & service
    this.machine = this._initMachine();
    this.service = interpret(this.machine).start();
  }

  public static init(canvas: HTMLCanvasElement) {
    this.o_o || (this.o_o = new O_O(canvas));
    return this.o_o;
  }

  private _initMachine() {
    /** @xstate-layout N4IgpgJg5mDOIC5QHkD6yB0gKdUE2+hADIGJBIY0CYEgDQCUBtABgF1FQAHAe1gEsAXdlgO0ZAAPRAFoAjDQAcGAMwB2AKwAaEAE9EYsdIBsATgUyALDJpjFcyWIBMAXxsq0mLJQyBak0B8poFo5YoGqzQDoKtAxIIKwc3HwCwgi6MhhWJnLWkro02lbKaohWVrpxYtqShYZWcnJGMpJ2DujYLh7eRIBHaYDRqZSBAqFcPPzBUfK51jIpYjLaiZKKKuoIcjQYNHJWmibyEjGV9iCOtRQY-g0e7cGd4T2gUVpicQY5CsmSxpOZCNm5SwVFJWXGG9VOLvtiC02vQOmwuhFeohDPoMPkxDCUvFHhlprN5osaLpShYZFYaDIxHZNrwWBA4AJHGCwt1IqIxAptLIntMRJIFBh9IYCiNdNpDA8KlUtjVcHhqRCzkJ6QSMJZ+al0lMNBgFIYDFptASFAy0gphdtnBQJac6Qh1XEEkkUnrlQgxhh+Q8CqZzJZbJtDXUvCbaVCECMOQo5NjNLoEYrURoFByEc7JK7g+6DaKAX5PL7IecNMVZGZTNotbqlc8jHI5fEZFW5IYaMjDMSbEA */
    return createMachine<Context, Event>(
      {
        id: "O_O",
        context: {
          video: this._initVideo(),
          ui: this._initUI(),
        },
        initial: "在網頁",
        states: {
          "在網頁": {
            on: {
              "按進XR": {
                target: "在XR.播放中",
                actions: [Actions.ENTER_XR, Actions.PLAY_VIDEO],
              },
            },
          },
          "在XR": {
            states: {
              "播放中": {
                on: {
                  "按暫停": {
                    target: "暫停中",
                    actions: Actions.PAUSE_VIDEO,
                  },
                  "按離開XR": {
                    target: "#O_O.在網頁",
                    actions: [Actions.EXIT_XR, Actions.PAUSE_VIDEO],
                  },
                },
              },

              "暫停中": {
                on: {
                  "按播放": {
                    target: "播放中",
                    actions: Actions.PLAY_VIDEO,
                  },
                  "按離開XR": {
                    target: "#O_O.在網頁",
                    actions: [Actions.EXIT_XR, Actions.PAUSE_VIDEO],
                  },
                },
              },
            },
          },
        },
      },
      {
        actions: {
          [Actions.ENTER_XR]: (context: Context) => {
            const exitBtn = context.ui?.exitButton!;
            exitBtn.onPointerClickObservable.addOnce(() => {
              this.xr?.exitXRAsync().then(() => this.service.send("按離開XR"));
            });
          },
          [Actions.EXIT_XR]: () => {
          },
          [Actions.PAUSE_VIDEO]: (context: Context) => {
            const v = context.video?.videoTexture.video;
            v?.paused || v?.pause();

            const playBtn = context.ui?.playButton!;
            playBtn.isVisible = true;
            playBtn.onPointerClickObservable.addOnce(() => this.service.send("按播放"));

            const pauseBtn = context.ui?.pauseButton!;
            pauseBtn.isVisible = false;
          },
          [Actions.PLAY_VIDEO]: (context: Context) => {
            const v = context.video?.videoTexture.video;
            v?.muted && (v.muted = false);
            v?.paused && v?.play();

            const pauseBtn = context.ui?.pauseButton!;
            pauseBtn.isVisible = true;

            pauseBtn.onPointerClickObservable.addOnce(() => this.service.send("按暫停"));
            const playBtn = context.ui?.playButton!;
            playBtn.isVisible = false;
          },
        },
      },
    );
  }

  private _initVideo(): BABYLON.VideoDome {
    const dome = new BABYLON.VideoDome("video", ["/video"], { autoPlay: false }, this.scene);
    dome.halfDome = true;
    dome.videoMode = BABYLON.VideoDome.MODE_SIDEBYSIDE;
    const v = dome.videoTexture.video;
    v.autoplay = false;
    v.crossOrigin = "anonymous";
    v.muted = true;
    return dome;
  }

  private _initUI(): OUI {
    const uiMesh = BABYLON.MeshBuilder.CreatePlane("ui-mesh");
    uiMesh.position.z = 3;
    const uiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(uiMesh);

    const playButton = BABYLON.GUI.Button.CreateSimpleButton(
      "play-button",
      Actions.PLAY_VIDEO,
    );
    playButton.fontSize = 200;
    playButton.background = "grey";
    playButton.paddingBottomInPixels = 512;
    uiTexture.addControl(playButton);

    const pauseButton = BABYLON.GUI.Button.CreateSimpleButton(
      "pause-button",
      Actions.PAUSE_VIDEO,
    );
    pauseButton.fontSize = 200;
    pauseButton.background = "grey";
    pauseButton.paddingBottomInPixels = 512;
    uiTexture.addControl(pauseButton);

    const exitButton = BABYLON.GUI.Button.CreateSimpleButton(
      "exit-button",
      Actions.EXIT_XR,
    );
    exitButton.fontSize = 200;
    exitButton.background = "grey";
    exitButton.paddingTopInPixels = 512;
    uiTexture.addControl(exitButton);

    return {
      uiMesh: uiMesh,
      playButton: playButton,
      pauseButton: pauseButton,
      exitButton: exitButton,
    };
  }
}

type Context = {
  video?: BABYLON.VideoDome;
  ui?: OUI;
};

type Event =
  | { type: "按進XR" }
  | { type: "按離開XR" }
  | { type: "按暫停" }
  | { type: "按播放" };

type OUI = {
  uiMesh?: BABYLON.Mesh;
  playButton?: BABYLON.GUI.Button;
  pauseButton?: BABYLON.GUI.Button;
  exitButton?: BABYLON.GUI.Button;
};

const Actions = {
  ENTER_XR: "進XR",
  EXIT_XR: "離開XR",
  PLAY_VIDEO: "播放",
  PAUSE_VIDEO: "暫停",
};
