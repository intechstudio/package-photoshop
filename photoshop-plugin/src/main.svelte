<script lang="ts">
  import { photoshop } from "./globals";
  import { onMount } from "svelte";
  import { batchPlayInModal } from "./lib/uxp";
  import { ActionDescriptor } from "photoshop/dom/CoreModules";
  import photoshopCommandHandler from "./commands/command-handler"

  let webSocketClient: WebSocket | undefined = undefined;
  let webSocketUrl = "ws://localhost:3542";
  let wsClientStatus = "closed";

  photoshopCommandHandler.initializeCommunication({
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
  },{
    async sendMessageToEditor(message) {
      console.log({message});
      if (webSocketClient){
        webSocketClient.send(message);
      }   
    },
  });

  function connectToWebSocket() {
    if (webSocketClient) {
      console.info("WebSocket is already connected, disconnect first.");
      return;
    }

    console.log(`CONNECTING TO ${webSocketUrl}`);
    webSocketClient = new WebSocket(webSocketUrl);

    webSocketClient.addEventListener("open", function () {
      wsClientStatus = "connected";
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
