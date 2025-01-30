<svelte:options
  customElement={{ tag: "photoshop-preference", shadow: "none" }}
/>

<script>
  import {
    Block,
    BlockBody,
    BlockTitle,
    MoltenButton,
    MeltCheckbox,
  } from "@intechstudio/grid-uikit";
  import { onMount } from "svelte";

  let currentlyConnected = false;

  // @ts-ignore
  const messagePort = createPackageMessagePort(
    "package-photoshop",
    "preferences"
  );

  let watchForActiveWindow = false;
  let enableOverlay = false;
  let useControlKeyForOverlay = false;

  $: watchForActiveWindow,
    enableOverlay,
    useControlKeyForOverlay,
    handleDataChange();

  function handleDataChange() {
    messagePort.postMessage({
      type: "set-setting",
      watchForActiveWindow,
      enableOverlay,
      useControlKeyForOverlay,
    });
  }

  onMount(() => {
    messagePort.onmessage = (e) => {
      const data = e.data;
      if (data.type === "clientStatus") {
        currentlyConnected = data.clientConnected;
        watchForActiveWindow = data.watchForActiveWindow;
        enableOverlay = data.enableOverlay;
        useControlKeyForOverlay = data.useControlKeyForOverlay;
      }
    };
    messagePort.start();
    return () => {
      messagePort.close();
    };
  });
</script>

<main-app>
  <div class="px-4 bg-secondary rounded-lg">
    <Block>
      <BlockTitle>
        <div class="flex flex-row content-center">
          Photoshop Preference <div
            style="margin-left: 12px; width: 12px; height: 12px; border-radius: 50%; background-color: {currentlyConnected
              ? '#00D248'
              : '#fb2323'}"
          />
        </div>
      </BlockTitle>
      <BlockBody>
        Connection to localhost:3542 : {currentlyConnected
          ? "Connected"
          : "Connecting"}
      </BlockBody>
      <BlockBody>
        Photoshop plugin must be installed!
        <MoltenButton
          title={"CCX file location"}
          click={() => {
            messagePort.postMessage({
              type: "open-plugin-folder",
            });
          }}
        />
      </BlockBody>
      <BlockBody>
        Photoshop focus
        <MeltCheckbox
          title={"Only run actions when Photoshop is in focus"}
          bind:target={watchForActiveWindow}
        />
      </BlockBody>

      <BlockBody>
        Overlay
        <MeltCheckbox
          title={"Enable overlay for photoshop commands"}
          bind:target={enableOverlay}
        />
        {#if enableOverlay}
          <MeltCheckbox
            title={"Use control key to switch between executing and showing command"}
            bind:target={useControlKeyForOverlay}
          />
        {/if}
      </BlockBody>
    </Block>
  </div>
</main-app>
