import { createMachine, interpret, Interpreter, StateMachine } from "./deps.ts";

export default class O_O {
  private static o_o: O_O;
  private _engine: BABYLON.Engine;
  private _scene: BABYLON.Scene;
  private _xr: BABYLON.WebXRExperienceHelper | undefined;
  private _oMachine: StateMachine<
    OContext,
    Record<never, never>,
    OEvents,
    OTypeStates
  >;
  private _oService: Interpreter<
    OContext,
    Record<never, never>,
    OEvents,
    OTypeStates
  >;
  private constructor(canvas: HTMLCanvasElement) {
    // init engine
    this._engine = new BABYLON.Engine(canvas);
    this._scene = new BABYLON.Scene(this._engine);
    this._engine.runRenderLoop(() => this._scene.render());
    // init XR
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
    return createMachine<OContext, OEvents, OTypeStates>({
      context: {
        video: this._initVideo(),
        ui: this._initUI(),
      },
      initial: OStates.NOT_IN_XR,
      states: {
        [OStates.IN_XR]: {
          on: {
            EXIT: {
              target: OStates.NOT_IN_XR,
              actions: OActions.PAUSE_VIDEO,
            },
          },
          states: {
            [OStates.PLAYING]: {
              entry: OActions.SHOW_PAUSE,
              on: {
                PAUSE: {
                  target: OStates.PAUSING,
                  actions: OActions.PAUSE_VIDEO,
                },
              },
            },
            [OStates.PAUSING]: {
              entry: OActions.SHOW_PLAY,
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
        [OActions.PLAY_VIDEO]: (context) => {
          const v = context.video?.videoTexture.video;
          v?.muted && (v.muted = false);
          v?.paused && v?.play();
        },
        [OActions.PAUSE_VIDEO]: (context) => {
          const v = context.video?.videoTexture.video;
          v?.paused || v?.pause();
        },
        [OActions.SHOW_PLAY]: (context) => {
          const playBtn = context.ui?.playButton!;
          playBtn.isVisible = true;
          playBtn.onPointerClickObservable.addOnce(() =>
            this._oService.send("PLAY")
          );
          const pauseBtn = context.ui?.pauseButton!;
          pauseBtn.isVisible = false;
        },
        [OActions.SHOW_PAUSE]: (context) => {
          const playBtn = context.ui?.playButton!;
          playBtn.isVisible = false;
          const pauseBtn = context.ui?.pauseButton!;
          pauseBtn.isVisible = true;
          pauseBtn.onPointerClickObservable.addOnce(() => {
            this._oService.send("PAUSE");
          });
        },
      },
    });
  }
  private _initUI(): OUI {
    const uiMesh = BABYLON.MeshBuilder.CreatePlane("ui-mesh");
    uiMesh.position.z = 2.5;
    const uiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(uiMesh);
    
    const playButton = BABYLON.GUI.Button.CreateSimpleButton(
      "play-button",
      OActions.PLAY_VIDEO,
    );
    playButton.width = 1;
    playButton.height = 0.4;
    playButton.fontSize = 200;
    playButton.background = "green";
    uiTexture.addControl(playButton);

    const pauseButton = BABYLON.GUI.Button.CreateSimpleButton(
      "pause-button",
      OActions.PAUSE_VIDEO,
    );
    pauseButton.width = 1;
    pauseButton.height = 0.4;
    pauseButton.fontSize = 200;
    pauseButton.background = "green";
    uiTexture.addControl(pauseButton);

    return { uiMesh: uiMesh, playButton: playButton, pauseButton: pauseButton };
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

interface OContext {
  video?: BABYLON.VideoDome;
  ui?: OUI;
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
  PLAY_VIDEO: "PLAY",
  PAUSE_VIDEO: "PAUSE",
  SHOW_PAUSE: "SHOW PAUSE",
  SHOW_PLAY: "SHOW PLAY",
};

type OTypeStates = {
  value: typeof OStates;
  context: OContext;
};

type OUI = {
  uiMesh?: BABYLON.Mesh;
  playButton?: BABYLON.GUI.Button;
  pauseButton?: BABYLON.GUI.Button;
  exitButton?: BABYLON.GUI.Button;
};
