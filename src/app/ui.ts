/// <reference types="https://cdn.jsdelivr.net/npm/babylonjs@5.45.0/babylon.module.d.ts"/>
/// <reference types="https://cdn.jsdelivr.net/npm/babylonjs-gui@5.45.0/babylon.gui.module.d.ts"/>

import {
  BaseActionObject,
  EventData,
  Interpreter,
  ResolveTypegenMeta,
  ServiceMap,
  StateSchema,
  TypegenDisabled,
} from "./deps.ts";
import { Context, MediaEventFormat, MediaEventType, UIObj } from "./types.ts";

const _B = BABYLON;
const _G = BABYLON.GUI;

/**
 * @param scene scene for this ui
 * @param name mesh name used on scene.getMeshByName(meshName)
 * @param planeW ui mesh width (ratio should match uiW)
 * @param planeH ui mesh height (ratio should match uiH)
 * @param planeZ distance facing user when user is in (0,cameraHeight(=1.6),0)
 * @param uiW ui texture width (Babylon.js use 1024 by default)
 * @param uiH ui texture height (Babylon.js use 1024 by default)
 * @returns BABYLON.GUI.AdvancedDynamicTexture
 */
export const createUIObj = (
  scene: BABYLON.Scene,
  name: string,
  planeW: number,
  planeH: number,
  planeZ: number,
  uiW: number,
  uiH: number,
): UIObj => {
  const plane = _B.CreatePlane(name, { width: planeW, height: planeH }, scene);
  plane.position.z = planeZ;
  return {
    adt: _G.AdvancedDynamicTexture.CreateForMesh(plane, uiW, uiH),
    mesh: plane,
  };
};

/**
 * @param meshName mesh name to search in the scene
 * @param scene scene for this ui
 * @returns BABYLON.Mesh
 */
export const alignMeshWithXRCamera = (
  meshName: string,
  scene: BABYLON.Scene,
  xr: BABYLON.WebXRExperienceHelper,
): BABYLON.Mesh => {
  const mesh = scene.getMeshByName(meshName) as BABYLON.Mesh;
  mesh && (mesh.position = new _B.Vector3(
    mesh.position.x,
    xr.camera.position.y,
    mesh.position.z,
  ));
  return mesh;
};

export const createListItem = async (text: string, isFolder?: boolean) => {
  const resp = await fetch("/js/list-item.json");
  const json = await resp.json();
  const listItem = new _G.Container();
  listItem.parse(json.root);
  // update text to file/folder name
  (listItem.getChildByName("filename") as BABYLON.GUI.TextBlock).text = text;

  if (isFolder) {
    // remove play-2d, play-vr180, play-360 button if isFolder
    listItem.removeControl(listItem.getChildByName("play-2d")!);
    listItem.removeControl(listItem.getChildByName("play-vr180")!);
    listItem.removeControl(listItem.getChildByName("play-360")!);
  } else {
    // temporarily remove before implementation
    listItem.removeControl(listItem.getChildByName("play-2d")!);
  }
  return listItem;
};

export const createMediaEvent = (type: MediaEventType, path: string, format: MediaEventFormat): EventData => {
  return { mediaType: type, mediaUrl: `${location.protocol}//${location.host}/${type}?${path}`, mediaFormat: format };
};

export const setExitVREvent = (
  ui: BABYLON.GUI.AdvancedDynamicTexture,
  xr: BABYLON.WebXRExperienceHelper,
  service: Interpreter<
    Context,
    StateSchema,
    Event,
    { value: string; context: Context },
    ResolveTypegenMeta<TypegenDisabled, globalThis.Event, BaseActionObject, ServiceMap>
  >,
  event: string,
): BABYLON.GUI.Button => {
  const exitVR = ui.getControlByName("exit-vr") as BABYLON.GUI.Button;
  exitVR && exitVR.onPointerClickObservable.add(() => {
    xr.exitXRAsync();
    xr.onStateChangedObservable.clear();
    service.send(event);
  });
  return exitVR;
};

export const setBackEvent = (
  ui: BABYLON.GUI.AdvancedDynamicTexture,
  service: Interpreter<
    Context,
    StateSchema,
    Event,
    { value: string; context: Context },
    ResolveTypegenMeta<TypegenDisabled, globalThis.Event, BaseActionObject, ServiceMap>
  >,
  event: string,
): BABYLON.GUI.Button => {
  const back = ui.getControlByName("back") as BABYLON.GUI.Button;
  back && back.onPointerClickObservable.add(() => {
    service.send(event);
  });
  return back;
};

export const setText = (
  ui: BABYLON.GUI.AdvancedDynamicTexture,
  textBlockName: string,
  text: string,
): BABYLON.GUI.TextBlock => {
  const textBlock = ui.getControlByName(textBlockName) as BABYLON.GUI.TextBlock;
  textBlock && (textBlock.text = text);
  return textBlock;
};
