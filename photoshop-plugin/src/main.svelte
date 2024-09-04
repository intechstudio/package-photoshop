<script lang="ts">
  import { photoshop } from "./globals";
  import { onMount } from "svelte";
  import { psAppRef } from "./lib/variables";
  import { batchPlayInModal, getPropety } from "./lib/uxp";
  import { ActionDescriptor } from "photoshop/dom/CoreModules";
  import photoshopCommandHandler from "./commands/command-handler"

  let uiInfo = [];
  async function buildUiInfo() {
    uiInfo = await getPropety("tools", psAppRef).catch((err) => {
      return err;
    });
    console.log("List of UI items", uiInfo);
  }

  let webSocketClient: WebSocket | undefined = undefined;
  let webSocketUrl = "ws://localhost:3542";
  let wsClientStatus = "closed";

  photoshopCommandHandler.photoshopService = {
    
    async executeActions(actions : ActionDescriptor[]) : Promise<any>{
      const batchPlayOptions = {
        synchronousExecution: false,
        propagateErrorToDefaultHandler: true,
      };
      console.log({actions});
      return await batchPlayInModal(actions, batchPlayOptions);
    },
    
    async performMenuCommand(commandID : number) : Promise<any>{
      return await photoshop.core.performMenuCommand({commandID: commandID!});
    },

    async addActionNotificationListener(events, handler) {
      return await photoshop.action.addNotificationListener(events, handler);
    },
  }

  function connectToWebSocket() {
    if (webSocketClient) {
      console.info("WebSocket is already connected, disconnect first.");
      return;
    }

    console.log(`CONNECTING TO ${webSocketUrl}`);
    webSocketClient = new WebSocket(webSocketUrl);

    webSocketClient.addEventListener("open", function () {
      wsClientStatus = "open";
      console.info("WS is open");
    });

    webSocketClient.addEventListener("close", function (event) {
      wsClientStatus = "closed";
      console.log("WS Close, retrying");
      webSocketClient = undefined;
      connectToWebSocket();
    });

    webSocketClient.addEventListener("error", function (event) {
      wsClientStatus = "error";
      console.log("WS Error, retrying");
      console.info("WS error", event);
      webSocketClient?.close();
      connectToWebSocket();
    });

    webSocketClient.addEventListener("message", function (event) {
      console.log("Received data at3", new Date());
      const EDITOR_PACKET = JSON.parse(event.data);

      switch (EDITOR_PACKET["event"]) {
        case "message":
          if (EDITOR_PACKET.data != undefined) {
            const decodedMessage = EDITOR_PACKET.data;
            console.log(decodedMessage);
            callMessageHandler(decodedMessage);
          }
          break;
        default:
      }
    });
  }

  async function callMessageHandler(params: any) {
    console.log({params});
    console.log({currentTool : photoshop.app.currentTool});
    await photoshopCommandHandler.handleCommand(params);
  }

  async function changeBrushTipShape(brushParams: any) {
    let newBrushAction = {
      _obj: "set",
      _target: {
        _ref: "brush",
        _enum: "ordinal",
        _value: "targetEnum",
      },
      to: {
        _obj: "brush",
        masterDiameter: brushParams.diameter,
      },
      _options: {
        dialogOptions: "dontDisplay", // silentab
      },
    };

    const actionJSON = [
      newBrushAction,
      {
        _obj: "updateCurrentToolCursor",
        _target: psAppRef,
      },
    ];

    const batchPlayOptions = {
      synchronousExecution: false,
    };

    const result = await batchPlayInModal(actionJSON, batchPlayOptions)
      .then((res) => {
        setEventHandler("set", newBrushAction);
        return "done";
      })
      .catch((err) => {
        return "err" + err;
      });

    console.log("DONE2", result);

    return result;
  } /*

  // CODE JUST COPIED, NOT TESTED
  async function changePaintbrushTool(brushParams : any) {
    const { currentToolOptions } = await getPropety(
      "currentToolOptions",
      psAppRef,
    );

    // runs only, if current tool option has brush property

    if (currentToolOptions) {
      for (const param in brushParams) {
        currentToolOptions[param] = brushParams[param];
      }

      const actionJSON = [
        {
          _obj: "set",
          _target: [{ _ref: "paintbrushTool" }],
          to: currentToolOptions,
          _options: {
            //dialogOptions: "dontDisplay"
          },
        },
      ];

      const batchPlayOptions = {
        synchronousExecution: false,
        //modalBehavior: "wait"
      };

      //uxpLog(1, 'batch-play-in-progress');
      const result = await batchPlayInModal(actionJSON, batchPlayOptions)
        .then((res) => {
          //uxpLog(2,res);
          return res;
        })
        .catch((err) => {
          //uxpLog(0, err.message);
          return err;
        });
    }
  }

  // CODE JUST COPIED, NOT TESTED
  async function changeBrushShapeDynamics(brushParams : any) {
    const { currentToolOptions } = await getPropety(
      "currentToolOptions",
      psAppRef,
    );

    // runs only, if current tool option has brush property

    if (currentToolOptions) {
      for (const param in brushParams) {
        currentToolOptions[param] = brushParams[param];
      }

      const actionJSON = [
        {
          _obj: "set",
          _target: [{ _ref: "paintbrushTool" }],
          to: currentToolOptions,
          _options: {
            //dialogOptions: "dontDisplay"
          },
        },
      ];

      const batchPlayOptions = {
        synchronousExecution: false,
        //modalBehavior: "wait"
      };

      //uxpLog(1, 'batch-play-in-progress');
      await batchPlayInModal(actionJSON, batchPlayOptions)
        .then((res) => {
          //uxpLog(2,res);

          return res;
        })
        .catch((err) => {
          //uxpLog(0, err.message);
          return err;
        });
    }
  }

  async function performMenuCommand(commandId : any) {
    await photoshop.core
      .getMenuCommandState({ commandID: commandId })
      .then((res) => {
        /*
        uxpLog(2, res)
        HERE WE COULD CHECK IF COMMAND IS AVAILABLE TO BE RUN
        
      })
      .catch((err) => {});

    await photoshop.core
      .performMenuCommand({ commandID: commandId })
      .catch((err) => console.info(err));
  }*/

  let menuBar: any;
  async function buildCommandCollection() {
    menuBar = await getPropety("menuBarInfo", psAppRef)
      .then((res) => {
        return res.menuBarInfo.submenu;
      })
      .catch((err) => {
        return err;
      });

    let commandCollection = [];
    function crawlSubmenu(name: any, array: any) {
      // iterate on input array, check if it has submenu
      array.forEach((element: any) => {
        // if the array element has submenu, check the name of current depth and go deeper
        if (element.submenu) {
          let nextName = "";
          if (name == "") {
            // name == '' if it's starting the recursion
            nextName = element.name;
          } else {
            nextName = name + " | " + element.name;
          }
          crawlSubmenu(nextName, element.submenu);
        } else {
          commandCollection.push({
            category: name,
            name: element.name,
            enabled: element.enabled,
            visible: element.visible,
            command: element.command,
          });
        }
      });
    }

    crawlSubmenu("", menuBar);
  }

  function setEventHandler(event: string, descriptor: ActionDescriptor) {
    if (descriptor.to?._obj == "brush") {
      webSocketClient?.send(
        JSON.stringify({
          brushDiameter:
            descriptor.to.masterDiameter._value ?? descriptor.to.masterDiameter,
        }),
      );
    }
  }

  onMount(async () => {
    await buildUiInfo();
    await buildCommandCollection();
    photoshop.action.addNotificationListener(["set"], setEventHandler);
    console.log("menubar items", menuBar);
    connectToWebSocket();
  });
</script>

<main>
  Connection status: {wsClientStatus}
</main>

<style lang="scss">
  @import "./variables.scss";
</style>
