import { createMachine, interpret, StateMachine } from "./deps.ts";

const states = {
  ENTERING_XR: "entering XR",
  IN_XR: "in XR",
  NOT_IN_XR: "not in XR",
};
const events = {
  CHECK_XR: "check",
  ENTER_XR: "enter",
  EXIT_XR: "exit",
};
const actions = {
  PLAY_VIDEO: "play video",
  PAUSE_VIDEO: "pause video",
  SHOW_PLAYER: "show player",
  HIDE_PLAYER: "hide player",
};
type OContext = {
  dome: BABYLON.VideoDome;
  player: BABYLON.Mesh;
};
export default class O_O {
  private static o_o: O_O;
  private _engine: BABYLON.Engine;
  private _scene: BABYLON.Scene;
  private _machine: StateMachine.Machine;
  private _service: StateMachine.Service;

  private constructor(canvas: HTMLCanvasElement) {
    this._engine = new BABYLON.Engine(canvas);
    this._scene = new BABYLON.Scene(this._engine);
    this._engine.runRenderLoop(() => this._scene.render());
    this._machine = createMachine<OContext>({
      id: "machine",
      context: {
        dome: this._initVideo(),
        player: this._initPlayer(),
      },
      initial: states.NOT_IN_XR,
      states: {
        [states.ENTERING_XR]: {
          on: {
            [events.ENTER_XR]: {
              target: states.IN_XR,
              actions: [actions.PLAY_VIDEO, actions.SHOW_PLAYER],
            },
          },
        },
        [states.IN_XR]: {
          on: {
            [events.EXIT_XR]: {
              target: states.NOT_IN_XR,
              actions: [actions.PAUSE_VIDEO, actions.HIDE_PLAYER],
            },
          },
        },
        [states.NOT_IN_XR]: {
          on: {
            [events.CHECK_XR]: states.ENTERING_XR,
          },
        },
      },
    }, {
      actions: {
        [actions.PLAY_VIDEO]: (context: OContext) => {
          const dome = context.dome;
          dome.setEnabled(true);
          dome.videoTexture.video.muted = false;
          dome.videoTexture.video.play();
        },
        [actions.PAUSE_VIDEO]: (context: OContext) => {
          const dome = context.dome;
          dome.videoTexture.video.pause();
          dome.setEnabled(false);
        },
        [actions.SHOW_PLAYER]: (context: OContext) => {
          const player = context.player;
          player.setEnabled(true);
        },
        [actions.HIDE_PLAYER]: (context: OContext) => {
          const player = context.player;
          player.setEnabled(false);
        },
      },
    });
    this._service = interpret(this._machine).start();
    this._initXR().then((xrHelper) => {
      xrHelper.onStateChangedObservable.add((xrStates) => {
        switch (xrStates) {
          case 0: // ENTERING_XR
            this._matchThenSend(states.NOT_IN_XR, events.CHECK_XR);
            break;
          // case 1: // EXITING_XR
          // console.log("EXITING_XR");
          // break;
          case 2: // IN_XR
            this._matchThenSend(states.ENTERING_XR, events.ENTER_XR);
            break;
          case 3: // NOT_IN_XR
            this._matchThenSend(states.IN_XR, events.EXIT_XR);
            // scene.debugLayer.show();
            break;
        }
      });
    });
  }
  private _matchThenSend(state: string, event: string) {
    this._service.state.matches(state) && this._service.send(event);
  }
  private _initVideo(): BABYLON.VideoDome {
    const dome = new BABYLON.VideoDome("videoDome", ["../assets/vr180.mp4"], {
      autoPlay: false,
    }, this._scene);
    dome.halfDome = true;
    dome.videoMode = BABYLON.VideoDome.MODE_SIDEBYSIDE;
    dome.videoTexture.video.autoplay = false;
    dome.videoTexture.video.crossOrigin = "anonymous";
    dome.videoTexture.video.muted = true;
    dome.setEnabled(false);
    return dome;
  }
  private _initPlayer(): BABYLON.Mesh {
    const uiPlane = BABYLON.MeshBuilder.CreatePlane("ui-plane");
    uiPlane.position.z = 2.5;
    const uiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(uiPlane);
    const button = BABYLON.GUI.Button.CreateSimpleButton("button", "vr180.mp4");
    button.width = 1;
    button.height = 0.4;
    button.fontSize = 200;
    uiTexture.addControl(button);
    return uiPlane;
  }
  private async _initXR(): Promise<BABYLON.WebXRExperienceHelper> {
    const xrHelper = await this._scene.createDefaultXRExperienceAsync();
    return xrHelper.baseExperience;
  }
  public static init(canvas: HTMLCanvasElement) {
    this.o_o || (this.o_o = new O_O(canvas));
    return this.o_o;
  }
}
