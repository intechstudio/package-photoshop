<svelte:options
  customElement={{ tag: "single-parameter-set-action", shadow: "none" }}
/>

<script>
  import { MeltCombo, MeltCheckbox } from "@intechstudio/grid-uikit";
  import { onMount } from "svelte";
  import data from "./single_parameter_set_data.js";
  let parameterType = "";
  let parameterId = "";
  let parameterValue = "";
  let isRelativeMode = false;
  let currentCodeValue = "";
  let ref;
  let isInitialized = false;
  $: suggestions = data[parameterType];

  function handleConfigUpdate(config) {
    const regex =
      /^gps\("package-photoshop", "*(.*?)", "*(.*?)", (.*?), (1|0)\)$/;
    if (currentCodeValue != config.script) {
      currentCodeValue = config.script;
      const match = config.script.match(regex);
      if (match) {
        parameterType = match[1] ?? "tool-parameter";
        parameterId = match[2] ?? "";
        parameterValue = match[3] ?? "";
        isRelativeMode = match[4] == "1";
        isInitialized = true;
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

  $: parameterId,
    parameterValue,
    isRelativeMode,
    isInitialized &&
      (function () {
        var code = `gps("package-photoshop", "${parameterType}", "${parameterId}", ${parameterValue}, ${
          isRelativeMode ? 1 : 0
        })`;
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

<single-parameter-set
  class="{$$props.class} flex flex-col w-full pb-2 px-2 pointer-events-auto"
  bind:this={ref}
>
  <div class="w-full flex">
    <div style="width: 50%;">
      <MeltCombo
        title={"Parameter ID"}
        bind:value={parameterId}
        {suggestions}
        searchable={true}
        size={"full"}
      />
    </div>
    <div style="width: 50%;">
      <MeltCombo
        title={"Parameter value"}
        bind:value={parameterValue}
        size={"full"}
      />
    </div>
  </div>

  {#if parameterType != "image-adjustment" && parameterType != "custom-keys"}
    <MeltCheckbox bind:target={isRelativeMode} title={"Relative Mode"} />
  {/if}
</single-parameter-set>
