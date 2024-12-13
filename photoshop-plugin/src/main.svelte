<script lang="ts">
  import { photoshop } from "./globals";
  import { onMount } from "svelte";
  import { batchPlayInModal, getPropety } from "./lib/uxp";
  import {
    ActionDescriptor,
    BatchPlayCommandOptions,
  } from "photoshop/dom/CoreModules";
  import photoshopCommandHandler from "./commands/command-handler";
  import { psAppRef } from "./lib/variables";

  let webSocketClient: WebSocket | undefined = undefined;
  let webSocketUrl = "ws://localhost:3542";
  let wsClientStatus = "closed";

  let uiInfo: { info: string; value: string }[] = [];
  async function buildUiInfo() {
    uiInfo = await getPropety("tools", psAppRef)
      .then((res) => {
        return res.tools
          .filter((t: any) => t.inToolBar == true)
          .map((e: any) => {
            return {
              info: e.toolTip
                .substring(
                  0,
                  e.toolTip.indexOf("(") == -1
                    ? e.toolTip.length
                    : e.toolTip.indexOf("(")
                )
                .trim(),
              value: e.toolID,
            };
          });
      })
      .catch((err) => {
        return err;
      });
    console.log("List of UI items", uiInfo);
  }

  let menuBar: any;
  let commandCollection: { info: string; value: string }[] = [];
  async function buildCommandCollection() {
    menuBar = await getPropety("menuBarInfo", psAppRef)
      .then((res) => {
        return res.menuBarInfo.submenu;
      })
      .catch((err) => {
        return err;
      });

    commandCollection = [];
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
            nextName = name + "/" + element.name;
          }
          crawlSubmenu(nextName, element.submenu);
        } else if (element.visible) {
          let menuName: string =
            (element.name ?? "") == "" ? element.title : element.name;
          if ((name ?? "") !== "") {
            menuName = `${name}/${menuName}`;
          }
          menuName.replace("&", "");
          commandCollection.push({
            info: menuName,
            value: `${element.command}`,
          });
        }
      });
    }

    crawlSubmenu("", menuBar);
  }

  async function tryInitializeCommandInfos() {
    if (uiInfo.length == 0) {
      await buildUiInfo();
    }
    if (commandCollection.length == 0) {
      await buildCommandCollection();
    }

    uiInfo.forEach((element) => {
      photoshopCommandHandler.toolInfo.set(element.value, element.info);
    });
    commandCollection.forEach((element) => {
      photoshopCommandHandler.menuInfo.set(element.value, element.info);
    });
  }

  photoshopCommandHandler.initializeCommunication(
    {
      async executeActions(actions: ActionDescriptor[]): Promise<any> {
        const batchPlayOptions: BatchPlayCommandOptions = {
          synchronousExecution: false,
          propagateErrorToDefaultHandler: true,
        };
        return await batchPlayInModal(actions, batchPlayOptions);
      },

      async performMenuCommand(commandID: number): Promise<any> {
        return await photoshop.core.performMenuCommand({
          commandID: commandID!,
        });
      },

      async addActionNotificationListener(events, handler) {
        return await photoshop.action.addNotificationListener(events, handler);
      },
    },
    {
      async sendMessageToEditor(message) {
        console.log({ message });
        if (webSocketClient) {
          webSocketClient.send(message);
        }
      },
    }
  );

  function connectToWebSocket() {
    if (webSocketClient) {
      console.info("WebSocket is already connected, disconnect first.");
      return;
    }

    console.log(`CONNECTING TO ${webSocketUrl}`);
    webSocketClient = new WebSocket(webSocketUrl);

    webSocketClient.addEventListener("open", async function () {
      wsClientStatus = "connected";
      console.info("WS is open");

      await buildUiInfo();
      await buildCommandCollection();
      if (uiInfo.length == 0 || commandCollection.length == 0) {
        return;
      }

      if (webSocketClient?.readyState !== WebSocket.OPEN) {
        return;
      }

      webSocketClient!.send(
        JSON.stringify({
          type: "set-dynamic-suggestions",
          suggestions: {
            "select-tool": uiInfo,
            menu: commandCollection,
          },
        })
      );
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

    webSocketClient.addEventListener("message", async function (event) {
      const EDITOR_PACKET = JSON.parse(event.data);

      switch (EDITOR_PACKET["event"]) {
        case "command":
          if (EDITOR_PACKET.data != undefined) {
            const commandParams = EDITOR_PACKET.data;
            const commandMode = EDITOR_PACKET.commandMode;
            if (
              commandMode.includes("overlay") &&
              (photoshopCommandHandler.menuInfo.size == 0 ||
                photoshopCommandHandler.toolInfo.size == 0)
            ) {
              await tryInitializeCommandInfos();
            }
            await photoshopCommandHandler.handleCommand(
              commandParams,
              commandMode
            );
          }
          break;
        default:
      }
    });
  }

  onMount(async () => {
    connectToWebSocket();
  });
</script>

<main>
  Connection status: {wsClientStatus}
</main>

<style lang="scss">
  @import "./variables.scss";
</style>
