let fs = require("fs");
let path = require("path");
const WebSocket = require("ws");
const openExplorer = require("open-file-explorer");

let wss = undefined;
let photoshopWs = undefined;
let controller;
let preferenceMessagePort = undefined;
let clientConnected = false;

exports.loadPackage = async function (gridController, persistedData) {
  controller = gridController;
  let photoshopIconSvg = fs.readFileSync(
    path.resolve(__dirname, "photoshop_icon.svg"),
    { encoding: "utf-8" },
  );

  let actionId = 0;
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
    actionComponent: "single-event-action",
  });

  createPhotoshopAction({
    short: "xpscf",
    displayName: "Content-aware fill",
    defaultLua: 'gps("package-photoshop", "content-fill")',
    toggleable: false,
  });
  createPhotoshopAction({
    short: "xpstt",
    displayName: "Toggle previous/current tool",
    defaultLua: 'gps("package-photoshop", "toggle-tool")',
    toggleable: false,
  });
  createPhotoshopAction({
    short: "xpsst",
    displayName: "Select Tool",
    defaultLua: 'gps("package-photoshop", "select-tool", "paintbrushTool")',
    actionComponent: "single-event-action",
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
    actionComponent: "single-event-action",
  });
  createPhotoshopAction({
    short: "xpsaal",
    displayName: "Adjust Adjustment Layer",
    defaultLua:
      'gps("package-photoshop", "adjust-adjustment", "brightness", val, 1)',
    actionComponent: "single-parameter-set-action",
  });

  wss = new WebSocket.Server({ port: 3542 });

  console.log("WebSocket server is listening on ws://localhost:3542");
  // Event listener for when a client connects to the server
  wss.on("connection", (ws) => {
    photoshopWs = ws;

    ws.on("message", handlePhotoshopMessage);
    clientConnected = true;
    notifyStatusChange();

    ws.on("close", () => {
      clientConnected = false;
      notifyStatusChange();
    });
  });
};

exports.unloadPackage = async function () {
  photoshopWs?.close();
  wss?.close();
  preferenceMessagePort?.close();
};

exports.addMessagePort = async function (port) {
  preferenceMessagePort = port;
  port.on("close", () => {
    preferenceMessagePort = undefined;
  });
  port.on("message", (e) => {
    console.log({ e });
    if (e.data.type === "open-plugin-folder") {
      openExplorer(__dirname);
    }
  });
  port.start();
  notifyStatusChange();
};

exports.sendMessage = async function (args) {
  console.log({ args });
  photoshopWs?.send(
    JSON.stringify({
      event: "message",
      data: args,
    }),
  );
};

function handlePhotoshopMessage(message) {
  let data = JSON.parse(message);
  console.log({ data });
  controller.sendMessageToEditor(data);
}

function notifyStatusChange() {
  preferenceMessagePort.postMessage({
    type: "clientStatus",
    clientConnected,
  });
}
