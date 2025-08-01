const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const openExplorer = require("open-file-explorer");

let wss = undefined;
let photoshopWs = undefined;
let controller;
let preferenceMessagePort = undefined;
let dynamicSuggestionData = {};

let watchForActiveWindow = false;
let isPhotoshopActive = false;

let enableOverlay = false;
let useControlKeyForOverlay = false;
let currentControlKeyValue = false;

let actionId = 0;

let overlayMessagePort = undefined;

exports.loadPackage = async function (gridController, persistedData) {
  controller = gridController;
  let photoshopIconSvg = fs.readFileSync(
    path.resolve(__dirname, "photoshop-action-icon.svg"),
    { encoding: "utf-8" },
  );

  console.log({ persistedData });
  dynamicSuggestionData = persistedData?.dynamicSuggestionData ?? {};
  watchForActiveWindow = persistedData?.watchForActiveWindow ?? false;
  enableOverlay = persistedData?.enableOverlay ?? false;
  useControlKeyForOverlay = persistedData?.useControlKeyForOverlay ?? false;

  function createPhotoshopAction(overrides) {
    gridController.sendMessageToEditor({
      type: "add-action",
      info: {
        actionId: actionId++,
        rendering: "standard",
        category: "photoshop",
        color: "#5865F2",
        icon: photoshopIconSvg,
        blockIcon: photoshopIconSvg,
        selectable: true,
        movable: true,
        hideIcon: false,
        type: "single",
        toggleable: true,
        ...overrides,
      },
    });
  }

  createPhotoshopAction({
    short: "xpsms",
    displayName: "Menu Shortcut",
    defaultLua: 'gps("package-photoshop", "menu", "32")',
    actionComponent: "single-event-dynamic-action",
  });
  createPhotoshopAction({
    short: "xpsst",
    displayName: "Tool Select",
    defaultLua: 'gps("package-photoshop", "select-tool", "paintbrushTool")',
    actionComponent: "single-event-dynamic-action",
  });
  createPhotoshopAction({
    short: "xpstp",
    displayName: "Tool parameter",
    defaultLua: 'gps("package-photoshop", "tool-parameter", "angle", val, 0)',
    actionComponent: "single-parameter-set-action",
  });
  createPhotoshopAction({
    short: "xpsia",
    displayName: "Image adjustments",
    defaultLua:
      'gps("package-photoshop", "image-adjustment", "brightness", val, 1)',
    actionComponent: "single-parameter-set-action",
  });
  createPhotoshopAction({
    short: "xpscbcl",
    displayName: "Create Adjustment Layer",
    defaultLua:
      'gps("package-photoshop", "create-adjustment", "brightnessEvent")',
    actionComponent: "single-event-static-action",
  });
  createPhotoshopAction({
    short: "xpsaal",
    displayName: "Adjust Adjustment Layer",
    defaultLua:
      'gps("package-photoshop", "adjust-adjustment", "brightness", val, 1)',
    actionComponent: "single-parameter-set-action",
  });
  createPhotoshopAction({
    short: "xpsqa",
    displayName: "Quick Action",
    defaultLua: 'gps("package-photoshop", "quick-action", "switch-colors")',
    actionComponent: "single-event-static-action",
  });
  createPhotoshopAction({
    short: "xpsck",
    displayName: "Custom keys",
    defaultLua:
      'gps("package-photoshop", "custom-keys", "overlay-control", val, 0)',
    actionComponent: "single-parameter-set-action",
  });

  wss = new WebSocket.Server({ port: 3542 });

  console.log("WebSocket server is listening on ws://localhost:3542");
  wss.on("connection", (ws) => {
    photoshopWs = ws;

    ws.on("message", handlePhotoshopMessage);
    notifyStatusChange();

    ws.on("close", () => {
      photoshopWs = undefined;
      notifyStatusChange();
    });
  });

  if (enableOverlay) {
    createWindow();
  }

  if (watchForActiveWindow) {
    setTimeout(tryActivateActiveWindow, 50);
  }
};

exports.unloadPackage = async function () {
  while (--actionId >= 0) {
    controller.sendMessageToEditor({
      type: "remove-action",
      actionId,
    });
  }
  closeWindow();
  photoshopWs?.close();
  wss?.close();
  preferenceMessagePort?.close();
  overlayMessagePort?.close();
  if (watchForActiveWindow) {
    clearTimeout(activeWindowSubscribeTimeoutId);
    controller.sendMessageToEditor({
      type: "send-package-message",
      targetPackageId: "package-active-window",
      message: {
        type: "unsubscribe",
      },
    });
  }
};

exports.addMessagePort = async function (port, senderId) {
  if (senderId == "preferences") {
    preferenceMessagePort?.close();
    preferenceMessagePort = port;
    port.on("close", () => {
      preferenceMessagePort = undefined;
    });
    port.on("message", (e) => {
      console.log({ e });
      if (e.data.type === "open-plugin-folder") {
        openExplorer(__dirname);
      } else if (e.data.type === "set-setting") {
        console.log({ data: e.data });
        if (watchForActiveWindow !== e.data.watchForActiveWindow) {
          watchForActiveWindow = e.data.watchForActiveWindow;
          if (watchForActiveWindow) {
            tryActivateActiveWindow();
          } else {
            clearTimeout(activeWindowSubscribeTimeoutId);
            controller.sendMessageToEditor({
              type: "send-package-message",
              targetPackageId: "package-active-window",
              message: {
                type: "unsubscribe",
              },
            });
          }
        }
        watchForActiveWindow = e.data.watchForActiveWindow;
        if (enableOverlay != e.data.enableOverlay) {
          enableOverlay = e.data.enableOverlay;
          enableOverlay ? createWindow() : closeWindow();
        }
        useControlKeyForOverlay = e.data.useControlKeyForOverlay;
        controller.sendMessageToEditor({
          type: "persist-data",
          data: {
            dynamicSuggestionData,
            watchForActiveWindow,
            enableOverlay,
            useControlKeyForOverlay,
          },
        });
      }
    });
    port.start();
    notifyStatusChange();
  } else if (senderId == "dynamic-action") {
    port.start();
    port.postMessage({
      type: "init-suggestions",
      suggestions: dynamicSuggestionData,
    });
    port.close();
  } else if (senderId == "photoshop-overlay") {
    overlayMessagePort?.close();
    overlayMessagePort = port;
    port.start();
  }
};

exports.sendMessage = async function (args) {
  if (Array.isArray(args)) {
    if (args[0] == "custom-keys") {
      if (args[1] == "overlay-control") {
        currentControlKeyValue = Boolean(args[2]);
        return;
      } else if (args[1] == "spacebar-shortcut") {
        if (!watchForActiveWindow) {
          controller.sendMessageToEditor({
            type: "show-message",
            message:
              "Photoshop focus must be active for spacebar shortcut to work. Enable it in Photoshop Preference!",
            messageType: "fail",
          });
          return;
        }
        if (args[2] && !isPhotoshopActive) return;
        controller.sendMessageToEditor({
          type: "execute-lua-script",
          script: `<?lua --[[@gks]] gks(0, 0, ${args[2] ? 1 : 0}, 44) ?>`,
          targetDx: 0,
          targetDy: 0,
        });
        return;
      }
    }

    if (watchForActiveWindow && !isPhotoshopActive) {
      console.log("Photoshop is not active, ignoring message!");
      return;
    }
    if (!photoshopWs) {
      controller.sendMessageToEditor({
        type: "show-message",
        message: "Photoshop is not connected! Check if PS plugin is running!",
        messageType: "fail",
      });
      return;
    }
    let commandMode = "execute";
    if (enableOverlay && useControlKeyForOverlay && currentControlKeyValue) {
      commandMode = "overlay";
    } else if (enableOverlay && !useControlKeyForOverlay) {
      commandMode = "execute|overlay";
    }
    photoshopWs?.send(
      JSON.stringify({
        event: "command",
        data: args,
        commandMode,
      }),
    );
  } else {
    if (args.type === "active-window-status") {
      clearTimeout(activeWindowSubscribeTimeoutId);
      isPhotoshopActive = args.status;
      console.log({ isPhotoshopActive });
    }
  }
};

let activeWindowSubscribeTimeoutId = undefined;
function tryActivateActiveWindow() {
  activeWindowSubscribeTimeoutId = setTimeout(
    activeWindowRequestNoResponse,
    50,
  );
  controller.sendMessageToEditor({
    type: "send-package-message",
    targetPackageId: "package-active-win",
    message: {
      type: "subscribe",
      filter: "Photoshop",
      target: "application",
    },
  });
}

function activeWindowRequestNoResponse() {
  activeWindowSubscribeTimeoutId = undefined;
  controller.sendMessageToEditor({
    type: "show-message",
    message:
      "Couldn't connect to Active Window package! Make sure it is enabled!",
    messageType: "fail",
  });
  watchForActiveWindow = false;
  notifyStatusChange();
}

function handlePhotoshopMessage(message) {
  let data = JSON.parse(message);
  if (data.type === "set-dynamic-suggestions") {
    dynamicSuggestionData = data.suggestions;
    controller.sendMessageToEditor({
      type: "persist-data",
      data: {
        dynamicSuggestionData,
        watchForActiveWindow,
        enableOverlay,
        useControlKeyForOverlay,
      },
    });
  } else if (data.type === "show-overlay-info") {
    console.log(data.info);
    overlayMessagePort.postMessage({
      type: "info",
      info: data.info,
    });
  } else {
    controller.sendMessageToEditor(data);
  }
}

function notifyStatusChange() {
  preferenceMessagePort?.postMessage({
    type: "clientStatus",
    clientConnected: photoshopWs !== undefined,
    watchForActiveWindow,
    enableOverlay,
    useControlKeyForOverlay,
  });
}

function createWindow() {
  controller.sendMessageToEditor({
    type: "create-window",
    windowId: "photoshop-overlay",
    windowFile: `file://${path.join(__dirname, "overlay.html")}`,
    fullscreen: true,
    transparent: true,
    alwaysOnTop: true,
    ignoreMouse: true,
    x: 0,
    y: 0,
  });
}

function closeWindow() {
  controller.sendMessageToEditor({
    type: "close-window",
    windowId: "photoshop-overlay",
  });
}
