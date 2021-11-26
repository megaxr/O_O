const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas);
const scene = new BABYLON.Scene(engine);

// credit: https://github.com/tuki0918/blender-vr-tips
const dome = new BABYLON.VideoDome("videoDome", ["../assets/vr180.mp4"], { autoPlay: false }, scene);

// videoDome
dome.halfDome = true;
dome.videoMode = BABYLON.VideoDome.MODE_SIDEBYSIDE;
dome.videoTexture.video.autoplay = false;
dome.videoTexture.video.crossOrigin = "anonymous";
dome.videoTexture.video.muted = true;
dome.setEnabled(false);

// UI
const uiPlane = BABYLON.MeshBuilder.CreatePlane("ui-plane");
uiPlane.position.z = 2.5;
const uiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(uiPlane);
const button = BABYLON.GUI.Button.CreateSimpleButton("button", "vr180.mp4");
button.width = 1;
button.height = 0.4;
button.fontSize = 200;
uiTexture.addControl(button);

scene.createDefaultXRExperienceAsync().then((xrHelper) => {
  xrHelper.baseExperience.onStateChangedObservable.add((state) => {
    switch (state) {
      case BABYLON.WebXRState.ENTERING_XR:
        // xr is being initialized, enter XR request was made
        console.log("ENTERING_XR");
        break;
      case BABYLON.WebXRState.IN_XR:
        // XR is initialized and already submitted one frame
        console.log("IN_XR");
        dome.setEnabled(true);
        dome.videoTexture.video.muted = false;
        dome.videoTexture.video.play();
        break;
      case BABYLON.WebXRState.EXITING_XR:
        // xr exit request was made. not yet done.
        console.log("EXITING_XR");
        break;
      case BABYLON.WebXRState.NOT_IN_XR:
        // self explanatory - either out or not yet in XR
        console.log("NOT_IN_XR");
        dome.videoTexture.video.pause();
        dome.setEnabled(false);
        // scene.debugLayer.show();
        break;
    }
  });
});

engine.runRenderLoop(() => {
  scene.render();
});
