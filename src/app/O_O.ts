/// <reference types="https://cdn.jsdelivr.net/npm/babylonjs@5.45.0/babylon.module.d.ts"/>
/// <reference types="https://cdn.jsdelivr.net/npm/babylonjs-gui@5.45.0/babylon.gui.module.d.ts"/>

import {
  assign,
  BaseActionObject,
  interpret,
  Interpreter,
  ResolveTypegenMeta,
  ServiceMap,
  StateMachine,
  StateSchema,
  TypegenDisabled,
} from "./deps.ts";
import { Context, DirErrorEvent, DirEvent, MediaEvent } from "./types.ts";
import { Actions, Events, Guards, initMachine, States } from "./machine.ts";
import {
  alignMeshWithXRCamera,
  createListItem,
  createMediaEvent,
  createUIObj,
  setBackEvent,
  setExitVREvent,
  setText,
} from "./ui.ts";
import { initEngine } from "./engine.ts";
import { createImmersiveImage, createImmersiveVideo } from "./media.ts";

export default class O_O {
  private static o_o: O_O;
  // BabylonJS
  private engine: BABYLON.Engine | undefined;
  private scene: BABYLON.Scene | undefined;
  private xr: BABYLON.WebXRExperienceHelper | undefined;
  // XState
  private machine;
  private service;

  private constructor(canvas: HTMLCanvasElement) {
    this.machine = this._addConfig(initMachine({
      engine: undefined,
      scene: undefined,
      xr: undefined,
      media: undefined,
      ui: undefined,
    }));
    this.service = this._addTransition(interpret(this.machine));
    initEngine(canvas).then((esx) => {
      this.engine = esx.engine;
      this.scene = esx.scene;
      this.xr = esx.xr;
      this.service.start();
    });
  }

  public static init(canvas: HTMLCanvasElement) {
    this.o_o || (this.o_o = new O_O(canvas));
    return this.o_o;
  }

  private _addTransition(
    service: Interpreter<
      Context,
      StateSchema,
      globalThis.Event,
      { value: string; context: Context },
      ResolveTypegenMeta<TypegenDisabled, globalThis.Event, BaseActionObject, ServiceMap>
    >,
  ) {
    return service.onTransition((state) => {
      switch (true) {
        case state.matches(States.WEB):
          state.context.xr?.onStateChangedObservable.add((states) =>
            (states === 2) && this.service.send(Events.ENTER_VR)
          );
          break;
        case state.matches(States.WEBXR):
          break;
      }
    });
  }

  private _addConfig(
    machine: StateMachine<
      Context,
      StateSchema,
      globalThis.Event,
      { value: string; context: Context },
      BaseActionObject,
      ServiceMap,
      ResolveTypegenMeta<TypegenDisabled, globalThis.Event, BaseActionObject, ServiceMap>
    >,
  ) {
    return machine.withConfig({
      actions: {
        // on entry of machine
        [Actions.INIT_SYSTEM]: assign((_context) => {
          return initSystem(this.engine!, this.scene!, this.xr!);
        }),
        // on entry/return to States.WEBXR with Guards.READ_FILE_SUCCESS
        [Actions.READ_FILES]: (_context) => {
          readFile(`${location.protocol}/dir`, this.service);
        },
        // on Events.READ_FILES_SUCCESS & Events.OPEN_FOLDER & Events.TO_PARENT_FOLDER
        [Actions.SHOW_FILE_BROWSER]: (context, event: Event | DirEvent) => {
          showFileBrowser(context.scene!, context.ui!.portal.adt, context.xr!, event, this.service);
        },
        [Actions.HIDE_FILE_BROWSER]: (context) => {
          const ui = context.ui;
          if (ui) {
            const portal = ui.portal.adt;
            portal && (portal.rootContainer.isVisible = false);
          }
        },
        [Actions.PLAY_VR180_VIDEO]: assign((context, event: Event | MediaEvent) => {
          const media = context.media;
          const scene = context.scene;
          if (media && scene) {
            scene.removeTransformNode(media);
            media.dispose();
          }
          return { media: createImmersiveVideo(scene!, (event as MediaEvent).mediaUrl, true) };
        }),
        [Actions.PLAY_360_VIDEO]: assign((context, event: Event | MediaEvent) => {
          const media = context.media;
          const scene = context.scene;
          if (media && scene) {
            scene.removeTransformNode(media);
            media.dispose();
          }
          return { media: createImmersiveVideo(scene!, (event as MediaEvent).mediaUrl) };
        }),
        [Actions.PLAY_VR180_IMAGE]: assign((context, event: Event | MediaEvent) => {
          const media = context.media;
          const scene = context.scene;
          if (media && scene) {
            scene.removeTransformNode(media);
            media.dispose();
          }
          return { media: createImmersiveImage(scene!, (event as MediaEvent).mediaUrl, true) };
        }),
        [Actions.PLAY_360_IMAGE]: assign((context, event: Event | MediaEvent) => {
          const media = context.media;
          const scene = context.scene;
          if (media && scene) {
            scene.removeTransformNode(media);
            media.dispose();
          }
          return { media: createImmersiveImage(scene!, (event as MediaEvent).mediaUrl) };
        }),
        [Actions.SHOW_VIDEO_PLAYER]: async (context) => {
          const scene = context.scene;
          const ui = context.ui;
          if (scene && ui) {
            const player = ui.player.adt;
            if (player.rootContainer.children.length === 0) {
              const xr = context.xr;
              if (xr) {
                const playerMesh = alignMeshWithXRCamera("player", scene, xr);
                if (playerMesh) {
                  // align buttom, 600-150=450 -> 2-0.5=1.5
                  playerMesh.position.y = playerMesh.position.y - 1.5;
                  // rotate a little bit
                  // https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/center_origin/rotation
                  // https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/center_origin/rotation_conventions
                }
                await player.parseFromURLAsync("/js/player.json", true);
                setExitVREvent(player, xr, this.service, Events.EXIT_VR);
                setBackEvent(player, this.service, Events.BACK_TO_FILE_BROWSER);
              }
              // make it visible if it's hidden
              player.rootContainer.isVisible || (player.rootContainer.isVisible = true);
            }
          }
        },
        [Actions.HIDE_VIDEO_PLAYER]: assign((context) => {
          const scene = context.scene;
          const ui = context.ui;
          const media = context.media;
          if (scene && ui && media) {
            scene.removeTransformNode(media);
            media.dispose();
            const player = ui.player.adt;
            player && (player.rootContainer.isVisible = false);
          }
          return { media: undefined };
        }),
        [Actions.SHOW_IMAGE_PLAYER]: async (context) => {
          const scene = context.scene;
          const ui = context.ui;
          if (scene && ui) {
            const player = ui.player.adt;
            if (player) {
              if (player.rootContainer.children.length === 0) {
                const xr = context.xr;
                if (xr) {
                  const playerMesh = alignMeshWithXRCamera("player", scene, xr);
                  // align buttom, 600-150=450 -> 2-0.5=1.5
                  playerMesh && (playerMesh.position.y = playerMesh.position.y - 1.5);
                  await player.parseFromURLAsync("/js/player.json", true);
                  setExitVREvent(player, xr, this.service, Events.EXIT_VR);
                  setBackEvent(player, this.service, Events.BACK_TO_FILE_BROWSER);
                }
              }
              // 1. make it visible if it's hidden
              player.rootContainer.isVisible || (player.rootContainer.isVisible = true);
            }
          }
        },
        [Actions.HIDE_IMAGE_PLAYER]: assign((context) => {
          const scene = context.scene;
          const ui = context.ui;
          const media = context.media;
          if (scene && ui && media) {
            scene.removeTransformNode(media);
            media.dispose();
            const player = ui.player.adt;
            player && (player.rootContainer.isVisible = false);
          }
          return { media: undefined };
        }),
        // on Guards.READ_FILE_SUCCESS false
        [Actions.READ_FILE_FAILED]: (context, event: Event | DirErrorEvent) => {
          const ui = context.ui;
          if (ui) {
            const error = ((event) as DirErrorEvent).error;
            console.log(error);
            // TODO: show error on modal with retry button
            // const modal = ui.modal;
          }
        },
      },
      guards: {
        // on entry/return to States.WEBXR
        [Guards.READ_FILE_SUCCESS]: (_context, event: Event | DirEvent) => {
          return (event as DirEvent).dirInfo instanceof Object;
        },
      },
    });
  }
}

const initSystem = (engine: BABYLON.Engine, scene: BABYLON.Scene, xr: BABYLON.WebXRExperienceHelper): Context => {
  return {
    engine: engine,
    scene: scene,
    xr: xr,
    ui: {
      portal: createUIObj(scene!, "portal", 3, 2, 3, 900, 600),
      player: createUIObj(scene!, "player", 3, 0.5, 3, 900, 150),
    },
  };
};

const readFile = (
  url: string,
  service: Interpreter<
    Context,
    StateSchema,
    globalThis.Event,
    { value: string; context: Context },
    ResolveTypegenMeta<TypegenDisabled, globalThis.Event, BaseActionObject, ServiceMap>
  >,
) => {
  fetch(url).then(async (resp) => {
    const dirInfo = await resp.json();
    dirInfo && service.send(Events.READ_FILES, { dirInfo: dirInfo });
  }).catch((error) => {
    service.send(Events.READ_FILES, { error: error });
  });
};

const showFileBrowser = async (
  scene: BABYLON.Scene,
  ui: BABYLON.GUI.AdvancedDynamicTexture,
  xr: BABYLON.WebXRExperienceHelper,
  event: Event | DirEvent,
  service: Interpreter<
    Context,
    StateSchema,
    globalThis.Event,
    { value: string; context: Context },
    ResolveTypegenMeta<TypegenDisabled, globalThis.Event, BaseActionObject, ServiceMap>
  >,
) => {
  // 0. if not initialized -> load layout from json -> bind behaviors to "exit-vr", clear state observables & exit WebXR when clicked
  if (ui.rootContainer.children.length === 0) {
    alignMeshWithXRCamera("portal", scene, xr);
    await ui.parseFromURLAsync("/js/portal.json", true);
    setExitVREvent(ui, xr, service, Events.EXIT_VR);
  }
  // 1. make it visible if it's hidden
  ui.rootContainer.isVisible || (ui.rootContainer.isVisible = true);
  // 2. update title-text
  setText(ui, "title-text", "File Browser");
  const dirInfo = (event as DirEvent).dirInfo;
  const path = dirInfo.path;
  const inRoot = Boolean(path === "");
  // 3. update path
  setText(ui, "line-1-text", inRoot ? "/" : path);
  // 4. clear file-list
  const contentList = ui.getControlByName("content-list") as BABYLON.GUI.StackPanel;
  contentList.clearControls();
  // 5. if path != /, add ".." list-item on top as parent folder
  if (!inRoot) {
    const listItem = await createListItem("..", true);
    contentList.addControl(listItem);
    // 5.1 bind open folder behavior to fileList
    const bg = listItem.getChildByName("bg") as BABYLON.GUI.Rectangle;
    bg.onPointerClickObservable.addOnce(() => {
      fetch(
        `${location.protocol}//${location.host}/dir${
          (path.lastIndexOf("/") === 0) ? "" : `?${path.substring(0, path.lastIndexOf("/"))}`
        }`,
      ).then(async (resp) => {
        const dirInfo = await resp.json();
        service.send(Events.OPEN_FOLDER, { dirInfo: dirInfo });
      });
    });
  }
  // 6. load folder list-item(s)
  const folderNames = dirInfo.folders;
  (folderNames.length > 0) && folderNames.every(async (folderName) => {
    const listItem = await createListItem(folderName, true);
    contentList.addControl(listItem);
    // 6.1. bind open folder behavior to fileList
    const bg = listItem.getChildByName("bg") as BABYLON.GUI.Rectangle;
    bg.onPointerClickObservable.addOnce(() => {
      fetch(`${location.protocol}//${location.host}/dir?${path}/${folderName}`).then(
        async (resp) => {
          const dirInfo = await resp.json();
          service.send(Events.OPEN_FOLDER, { dirInfo: dirInfo });
        },
      );
    });
  });
  // 7. load file list-item(s)
  const fileNames = dirInfo.files;
  (fileNames.length > 0) && fileNames.every(async (fileName) => {
    if (!fileName.startsWith(".")) {
      const listItem = await createListItem(fileName);
      contentList.addControl(listItem);
      // 7.1. bind play behavior to video(s)
      if (fileName.match(/(.mp4|.MP4)+/)) {
        (listItem.getChildByName("play-vr180") as BABYLON.GUI.Button)
          .onPointerClickObservable.add(() => {
            service.send(
              Events.PLAY_VR180_VIDEO,
              createMediaEvent("video", `${path}/${fileName}`, "vr180"),
            );
          });
        (listItem.getChildByName("play-360") as BABYLON.GUI.Button)
          .onPointerClickObservable.add(() => {
            service.send(
              Events.PLAY_360_VIDEO,
              createMediaEvent("video", `${path}/${fileName}`, "360"),
            );
          });
      }
      // 7.2. bind play behavior to image(s)
      if (fileName.match(/(.jpg|.jpeg|.png|.JPG|.JPEG|.PNG)+/)) {
        (listItem.getChildByName("play-vr180") as BABYLON.GUI.Button)
          .onPointerClickObservable.add(() => {
            service.send(
              Events.PLAY_VR180_IMAGE,
              createMediaEvent("image", `${path}/${fileName}`, "vr180"),
            );
          });
        (listItem.getChildByName("play-360") as BABYLON.GUI.Button)
          .onPointerClickObservable.add(() => {
            service.send(
              Events.PLAY_360_IMAGE,
              createMediaEvent("image", `${path}/${fileName}`, "360"),
            );
          });
      }
    }
  });
};
