<svelte:options
  customElement={{ tag: "single-event-static-action", shadow: "none" }}
/>

<script>
  import { MeltCombo } from "@intechstudio/grid-uikit";
  import { onMount } from "svelte";
  import data from "./single_event_static_data.js";
  let eventType = "";
  let eventId = "";
  let currentCodeValue = "";
  let ref;
  $: suggestions = data[eventType];

  function handleConfigUpdate(config) {
    const regex = /^gps\("package-photoshop", "*(.*?)", "*(.*?)"\)$/;
    if (currentCodeValue != config.script) {
      currentCodeValue = config.script;
      const match = config.script.match(regex);
      if (match) {
        eventType = match[1] ?? "";
        eventId = match[2] ?? "";
      }
    }
  }

  onMount(() => {
    const event = new CustomEvent("updateConfigHandler", {
      bubbles: true,
      detail: { handler: handleConfigUpdate },
    });
    ref.dispatchEvent(event);
  });

  $: eventId,
    eventType &&
      (function () {
        var code = `gps("package-photoshop", "${eventType}", "${eventId}")`;
        if (currentCodeValue != code) {
          currentCodeValue = code;
          const event = new CustomEvent("updateCode", {
            bubbles: true,
            detail: { script: String(code) },
          });
          if (ref) {
            ref.dispatchEvent(event);
          }
        }
      })();
</script>

<single-event
  class="{$$props.class} flex flex-col w-full pb-2 px-2 pointer-events-auto"
  bind:this={ref}
>
  <div class="w-full flex">
    <MeltCombo
      title={"Parameter ID"}
      bind:value={eventId}
      {suggestions}
      searchable={true}
      size={"full"}
    />
  </div>
</single-event>
