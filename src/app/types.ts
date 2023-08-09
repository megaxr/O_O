/// <reference types="https://cdn.jsdelivr.net/npm/babylonjs@5.45.0/babylon.module.d.ts"/>
/// <reference types="https://cdn.jsdelivr.net/npm/babylonjs-gui@5.45.0/babylon.gui.module.d.ts"/>

import { EventObject } from "./deps.ts";

export type Context = {
  engine?: BABYLON.Engine | undefined;
  scene?: BABYLON.Scene | undefined;
  xr?: BABYLON.WebXRExperienceHelper | undefined;
  ui?: UI | undefined;
  media?: BABYLON.VideoDome | BABYLON.PhotoDome | undefined;
};

export type UI = {
  // portal?: BABYLON.GUI.AdvancedDynamicTexture | undefined;
  // player?: BABYLON.GUI.AdvancedDynamicTexture | undefined;
  // modal?: BABYLON.GUI.AdvancedDynamicTexture | undefined;
  portal: UIObj;
  player: UIObj;
  modal?: UIObj;
};

export type UIObj = {
  adt: BABYLON.GUI.AdvancedDynamicTexture;
  mesh: BABYLON.Mesh;
};

export type ESX = {
  engine: BABYLON.Engine;
  scene: BABYLON.Scene;
  xr: BABYLON.WebXRExperienceHelper;
};

export type DirEvent =
  & {
    dirInfo: {
      path: string;
      folders: Array<string>;
      files: Array<string>;
    };
  }
  & EventObject;

export type DirErrorEvent = {
  error: string;
} & EventObject;

export type MediaEvent = {
  mediaType: MediaEventType;
  mediaUrl: string;
  mediaFormat: MediaEventFormat;
} & EventObject;

export type MediaEventType = "image" | "video";
export type MediaEventFormat = "2d" | "vr180" | "360";
