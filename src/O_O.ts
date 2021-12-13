import { createMachine, interpret, Interpreter, StateMachine } from "./deps.ts";

export default class O_O {
  private static o_o: O_O;
  private _engine: BABYLON.Engine;
  private _scene: BABYLON.Scene;
  private _xr: BABYLON.WebXRExperienceHelper | undefined;
  private _oMachine: StateMachine<OContext, OStateSchema, OEvents>;
  private _oService: Interpreter<OContext, OStateSchema, OEvents>;
  private constructor(canvas: HTMLCanvasElement) {
    // init engine
    this._engine = new BABYLON.Engine(canvas);
    this._scene = new BABYLON.Scene(this._engine);
    this._engine.runRenderLoop(() => this._scene.render());
    // init XR
    new BABYLON.FreeCamera("", BABYLON.Vector3.Zero(), this._scene); // hack for keep camera height when re-entry XR.
    this._scene.createDefaultXRExperienceAsync().then((xrHelper) => {
      this._xr = xrHelper.baseExperience;
      this._xr.onStateChangedObservable.add((state) => {
        (state == 2) && this._oService.send("ENTER"); // IN_XR
        (state == 3) && this._oService.send("EXIT"); // NOT_IN_XR
      });
    });
    // init machine & service
    this._oMachine = this._initMachine();
    this._oService = interpret(this._oMachine).start();
  }
  public static init(canvas: HTMLCanvasElement) {
    this.o_o || (this.o_o = new O_O(canvas));
    return this.o_o;
  }
  private _initMachine() {
    return createMachine<OContext, OEvents>({
      context: {
        video: this._initVideo(),
        ui: this._initUI(),
      },
      initial: OStates.NOT_IN_XR,
      states: {
        [OStates.IN_XR]: {
          entry: OActions.ENTER_XR,
          on: {
            EXIT: {
              target: OStates.NOT_IN_XR,
              actions: OActions.PAUSE_VIDEO,
            },
          },
          states: {
            [OStates.PLAYING]: {
              on: {
                PAUSE: {
                  target: OStates.PAUSING,
                  actions: OActions.PAUSE_VIDEO,
                },
              },
            },
            [OStates.PAUSING]: {
              on: {
                PLAY: {
                  target: OStates.PLAYING,
                  actions: OActions.PLAY_VIDEO,
                },
              },
            },
          },
        },
        [OStates.NOT_IN_XR]: {
          on: {
            ENTER: {
              target: OStates.IN_XR__PLAYING,
              actions: OActions.PLAY_VIDEO,
            },
          },
        },
      },
    }, {
      actions: {
        [OActions.ENTER_XR]: (context) => {
          const exitBtn = context.ui?.exitButton!;
          exitBtn.onPointerClickObservable.addOnce(() => {
            this._xr?.exitXRAsync().then(() => this._oService.send("EXIT"));
          });
        },
        [OActions.PLAY_VIDEO]: (context) => {
          const v = context.video?.videoTexture.video;
          v?.muted && (v.muted = false);
          v?.paused && v?.play();
          const playBtn = context.ui?.playButton!;
          playBtn.isVisible = false;
          const pauseBtn = context.ui?.pauseButton!;
          pauseBtn.isVisible = true;
          pauseBtn.onPointerClickObservable.addOnce(() => {
            this._oService.send("PAUSE");
          });
        },
        [OActions.PAUSE_VIDEO]: (context) => {
          const v = context.video?.videoTexture.video;
          v?.paused || v?.pause();
          const playBtn = context.ui?.playButton!;
          playBtn.isVisible = true;
          playBtn.onPointerClickObservable.addOnce(() =>
            this._oService.send("PLAY")
          );
          const pauseBtn = context.ui?.pauseButton!;
          pauseBtn.isVisible = false;
        },
      },
    });
  }
  private _initUI(): OUI {
    const uiMesh = BABYLON.MeshBuilder.CreatePlane("ui-mesh");
    uiMesh.position.z = 3;
    const uiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(uiMesh);

    const playButton = BABYLON.GUI.Button.CreateSimpleButton(
      "play-button",
      OActions.PLAY_VIDEO,
    );
    playButton.fontSize = 200;
    playButton.background = "grey";
    playButton.paddingBottomInPixels = 512;
    uiTexture.addControl(playButton);

    const pauseButton = BABYLON.GUI.Button.CreateSimpleButton(
      "pause-button",
      OActions.PAUSE_VIDEO,
    );
    pauseButton.fontSize = 200;
    pauseButton.background = "grey";
    pauseButton.paddingBottomInPixels = 512;
    uiTexture.addControl(pauseButton);

    const exitButton = BABYLON.GUI.Button.CreateSimpleButton(
      "exit-button",
      OActions.EXIT_XR,
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
  private _initVideo(): BABYLON.VideoDome {
    const dome = new BABYLON.VideoDome("video", ["../assets/vr180.mp4"], {
      autoPlay: false,
    }, this._scene);
    dome.halfDome = true;
    dome.videoMode = BABYLON.VideoDome.MODE_SIDEBYSIDE;
    const v = dome.videoTexture.video;
    v.autoplay = false;
    v.crossOrigin = "anonymous";
    v.muted = true;
    return dome;
  }
}

const OStates = {
  // main
  IN_XR: "IN XR",
  NOT_IN_XR: "NOT IN XR",
  // in XR
  IN_XR__PLAYING: "IN XR.PLAYING",
  PLAYING: "PLAYING",
  PAUSING: "PAUSING",
};

type OEvents =
  // main
  | { type: "ENTER" }
  | { type: "EXIT" }
  // in XR
  | { type: "PLAY" }
  | { type: "PAUSE" };

const OActions = {
  ENTER_XR: "ENTER XR",
  EXIT_XR: "EXIT XR",
  PLAY_VIDEO: "PLAY",
  PAUSE_VIDEO: "PAUSE",
};

type OContext = {
  video?: BABYLON.VideoDome;
  ui?: OUI;
};

type OUI = {
  uiMesh?: BABYLON.Mesh;
  playButton?: BABYLON.GUI.Button;
  pauseButton?: BABYLON.GUI.Button;
  exitButton?: BABYLON.GUI.Button;
};

type OStateSchema = {
  states: {
    [state in keyof typeof OStates]: Record<never, never>;
  };
};
