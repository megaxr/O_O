import { createMachine } from "./deps.ts";
import { Context } from "./types.ts";

export const initMachine = (context: Context) => {
  return createMachine<Context, Event>({
    id: "O_O",
    initial: "在Web",
    context: context,
    entry: [Actions.INIT_SYSTEM],
    states: {
      "在Web": {
        on: {
          [Events.ENTER_VR]: {
            target: "在WebXR",
            actions: [Actions.ENTER_VR],
          },
        },
      },

      "在WebXR": {
        initial: "初始化檔案瀏覽器",
        on: {
          [Events.EXIT_VR]: {
            target: "#O_O.在Web",
            actions: [Actions.EXIT_VR],
          },
        },
        states: {
          "初始化檔案瀏覽器": {
            entry: [Actions.READ_FILES],

            // after: {
            //   3000: {
            //     target: "讀取檔案失敗",
            //     actions: "讀取檔案超時",
            //   },
            // },

            on: {
              [Events.READ_FILES]: [
                {
                  target: "瀏覽檔案",
                  cond: "讀取檔案成功", //Guards.READ_FILE_SUCCESS
                },
                {
                  target: "讀取檔案失敗",
                },
              ],
            },
          },

          "瀏覽檔案": {
            entry: [Actions.SHOW_FILE_BROWSER],

            on: {
              [Events.PLAY_VR180_VIDEO]: {
                target: "#O_O.在WebXR.播放影片.播放中",
                actions: [Actions.PLAY_VR180_VIDEO, Actions.HIDE_FILE_BROWSER],
              },

              [Events.PLAY_360_VIDEO]: {
                target: "#O_O.在WebXR.播放影片.播放中",
                actions: [Actions.PLAY_360_VIDEO, Actions.HIDE_FILE_BROWSER],
              },

              [Events.PLAY_VR180_IMAGE]: {
                target: "#O_O.在WebXR.播放圖片",
                actions: [Actions.PLAY_VR180_IMAGE, Actions.HIDE_FILE_BROWSER],
              },

              [Events.PLAY_360_IMAGE]: {
                target: "#O_O.在WebXR.播放圖片",
                actions: [Actions.PLAY_360_IMAGE, Actions.HIDE_FILE_BROWSER],
              },

              [Events.OPEN_FOLDER]: {
                actions: [Actions.SHOW_FILE_BROWSER],
                internal: true,
              },
            },
          },

          "播放圖片": {
            entry: [Actions.SHOW_IMAGE_PLAYER],
            on: {
              "按顯示播放器": {
                target: "播放圖片",
                actions: [Actions.SHOW_IMAGE_PLAYER],
                internal: true,
              },
              [Events.BACK_TO_FILE_BROWSER]: {
                target: "#O_O.在WebXR.瀏覽檔案",
                actions: [Actions.HIDE_IMAGE_PLAYER, Actions.SHOW_FILE_BROWSER],
              },
            },
          },

          "播放影片": {
            entry: [Actions.SHOW_VIDEO_PLAYER],
            states: {
              "播放中": {
                on: {
                  "按暫停": "暫停中",
                },
              },

              "暫停中": {
                on: {
                  "按播放": "播放中",
                },
              },
            },
            on: {
              "按顯示播放器": {
                target: "播放影片",
                actions: [Actions.SHOW_VIDEO_PLAYER],
                internal: true,
              },
              [Events.BACK_TO_FILE_BROWSER]: {
                target: "#O_O.在WebXR.瀏覽檔案",
                actions: [Actions.HIDE_VIDEO_PLAYER, Actions.SHOW_FILE_BROWSER],
              },
            },
          },

          "讀取檔案失敗": {
            entry: [Actions.READ_FILE_FAILED],
            on: {
              [Events.RETRY_READ_FILES]: "#O_O.在WebXR.初始化檔案瀏覽器",
            },
          },
        },
      },
    },
  });
};

export const Events = {
  ENTER_VR: "進入VR中",
  EXIT_VR: "離開VR中",
  READ_FILES: "讀取檔案",
  READ_FILES_SUCCESS: "讀取檔案成功",
  READ_FILES_FAILED: "讀取檔案失敗",
  READ_FILES_TIMEOUT: "讀取檔案超時",
  RETRY_READ_FILES: "重新讀取檔案",
  OPEN_FOLDER: "開啟資料夾",
  PLAY_VR180_VIDEO: "播放VR180影片",
  PLAY_360_VIDEO: "播放360影片",
  PLAY_VR180_IMAGE: "播放VR180圖片",
  PLAY_360_IMAGE: "播放360圖片",
  BACK_TO_FILE_BROWSER: "返回檔案瀏覽器",
};

// deno-fmt-ignore
export const enum States {
  WEB               = "在Web",
  WEBXR             = "在WebXR",
  READ_FILES_FAILED = "讀檔失敗",
}

export const Actions = {
  ENTER_VR: "進入VR",
  EXIT_VR: "離開VR",
  INIT_SYSTEM: "系統初始化",
  SHOW_LOADING: "顯示讀取中",
  HIDE_LOADING: "隱藏讀取中",
  SHOW_FILE_BROWSER: "顯示檔案瀏覽器",
  HIDE_FILE_BROWSER: "隱藏檔案瀏覽器",
  READ_FILES: "讀取檔案",
  PLAY_VR180_VIDEO: "播放VR180影片",
  PLAY_360_VIDEO: "播放360影片",
  SHOW_VIDEO_PLAYER: "顯示影片播放器",
  HIDE_VIDEO_PLAYER: "隱藏影片播放器",
  PLAY_VR180_IMAGE: "播放VR180圖片",
  PLAY_360_IMAGE: "播放360圖片",
  SHOW_IMAGE_PLAYER: "顯示圖片播放器",
  HIDE_IMAGE_PLAYER: "隱藏圖片播放器",
  READ_FILE_FAILED: "讀取檔案失敗",
};

export const Guards = {
  READ_FILE_SUCCESS: "讀取檔案成功",
};
