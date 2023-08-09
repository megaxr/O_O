/// <reference types="https://cdn.jsdelivr.net/npm/babylonjs@5.45.0/babylon.module.d.ts"/>
/// <reference types="https://cdn.jsdelivr.net/npm/babylonjs-gui@5.45.0/babylon.gui.module.d.ts"/>

const _B = BABYLON;
/**
 * @param scene scene for this video
 * @param mediaUrl http://localhost:8080/video?:path ex: ex: http://localhost:8080/image?:/folder/video.mp4
 * @param halfDome true = VR180, false/undefined = Mono 360
 * @returns BABYLON.VideoDome
 */
export const createImmersiveVideo = (scene: BABYLON.Scene, mediaUrl: string, halfDome?: boolean): BABYLON.VideoDome => {
  const video = new _B.VideoDome("video", mediaUrl, { halfDomeMode: halfDome ? true : false }, scene);
  video.videoMode = 2; // BABYLON.VideoDome.MODE_SIDEBYSIDE
  return video;
}

/**
 * @param scene scene for this video
 * @param mediaUrl http://localhost:8080/image?:path ex: http://localhost:8080/image?:/folder/image.jpg
 * @param halfDome true = VR180, false/undefined = Mono 360
 * @returns BABYLON.PhotoDome
 */
export const createImmersiveImage = (scene: BABYLON.Scene, mediaUrl: string, halfDome?: boolean): BABYLON.PhotoDome => {
  const photo = new _B.PhotoDome("image", mediaUrl, { halfDomeMode: halfDome ? true : false }, scene);
  return photo;
}
