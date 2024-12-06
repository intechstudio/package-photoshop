<script lang="ts">
  import { photoshop } from "./globals";
  import { onMount } from "svelte";
  import { batchPlayInModal, getPropety } from "./lib/uxp";
  import { ActionDescriptor } from "photoshop/dom/CoreModules";
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
            nextName = name + " | " + element.name;
          }
          crawlSubmenu(nextName, element.submenu);
        } else if (element.visible) {
          let menuName: string =
            (element.name ?? "") == "" ? element.title : element.name;
          if ((name ?? "") !== "") {
            menuName = `${name} | ${menuName}`;
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

  photoshopCommandHandler.initializeCommunication(
    {
      async executeActions(actions: ActionDescriptor[]): Promise<any> {
        const batchPlayOptions = {
          synchronousExecution: false,
          propagateErrorToDefaultHandler: true,
        };
        console.log({ actions });
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
      if (webSocketClient?.readyState === WebSocket.OPEN) {
        webSocketClient!.send(
          JSON.stringify({
            type: "set-dynamic-suggestions",
            suggestions: {
              "select-tool": uiInfo,
              menu: commandCollection,
            },
          })
        );
      }
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
    await photoshopCommandHandler.handleCommand(params);
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
