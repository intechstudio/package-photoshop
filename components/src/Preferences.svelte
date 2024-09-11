<svelte:options customElement={{tag: 'photoshop-preference', shadow: 'none'}} />
<script>
  import { Block, BlockBody, BlockRow, BlockTitle, MoltenButton, MoltenInput } from "@intechstudio/grid-uikit";
  import { onMount } from "svelte";

  let currentlyConnected = false;

  // @ts-ignore
  const messagePort = createPackageMessagePort("package-photoshop");


  onMount(() => {
    messagePort.onmessage = (e) => {
      const data = e.data;
      if (data.type === "clientStatus") {
        currentlyConnected = data.clientConnected;
      }
    };
    messagePort.start();
    return () => {
      messagePort.close();
    }
  })
</script>

<main-app>

  <div class="px-4">
    <Block>
      <BlockTitle>
        <div class="flex flex-row content-center">Photoshop Preference <div style="margin-left: 12px; width: 12px; height: 12px; border-radius: 50%; background-color: {currentlyConnected ? "#00D248" : "#fb2323"}" /></div>
      </BlockTitle>
      <BlockBody>
        Connection status: {currentlyConnected ? "Connected" : "Connecting"}
      </BlockBody>
    </Block>
  </div>

</main-app>
