/// <reference types="https://cdn.jsdelivr.net/npm/babylonjs@5.45.0/babylon.module.d.ts"/>
/// <reference types="https://cdn.jsdelivr.net/npm/babylonjs-gui@5.45.0/babylon.gui.module.d.ts"/>

import { ESX } from "./types.ts";

const _B = BABYLON;

export const initEngine = async (canvas: HTMLCanvasElement): Promise<ESX> => {
  const engine = new _B.Engine(canvas);
  const scene = new _B.Scene(engine);
  const xr = (await scene.createDefaultXRExperienceAsync()).baseExperience;
  engine.runRenderLoop(() => scene.render());
  return { engine: engine, scene: scene, xr: xr };
};
