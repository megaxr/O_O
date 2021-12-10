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
        [OActions.PLAY_VIDEO]: (context) => {
          const v = context.video?.videoTexture.video;
          v?.muted && (v.muted = false);
          v?.paused && v?.play();
        },
        [OActions.PAUSE_VIDEO]: (context) => {
          const v = context.video?.videoTexture.video;
          v?.paused || v?.pause();
        },
      },
    });
  }
  private _initUI(): BABYLON.Mesh {
    const uiPlane = BABYLON.MeshBuilder.CreatePlane("ui-plane");
    uiPlane.position.z = 2.5;
    const uiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(uiPlane);
    const button = BABYLON.GUI.Button.CreateSimpleButton("button", "Pause");
    button.width = 1;
    button.height = 0.4;
    button.fontSize = 200;
    button.background = "green";
    button.onPointerClickObservable.add(() => {
      this._oService.send("PAUSE");
      (button.children[0] as BABYLON.GUI.TextBlock).text = "Click";
    });
    uiTexture.addControl(button);
    return uiPlane;
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
  ui?: BABYLON.Mesh;
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
  PLAY_VIDEO: "PLAY VIDEO",
  PAUSE_VIDEO: "PAUSE VIDEO",
};

type OTypeStates = {
  value: typeof OStates;
  context: OContext;
};
