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
  let isRelativeMode = "";
  let currentCodeValue = "";
  let ref;
  let isInitialized = false;
  $: suggestions = data[parameterType];

  let isMinimalistMode = false;

  function handleConfigUpdate(config, minimalist) {
    const regex =
      /^gps\("package-photoshop", "*(.*?)", "*(.*?)", (.*?), (.*?)\)$/;
    if (currentCodeValue != config.script) {
      currentCodeValue = config.script;
      const match = config.script.match(regex);
      if (match) {
        parameterType = match[1] ?? "tool-parameter";
        parameterId = match[2] ?? "";
        parameterValue = match[3] ?? "";
        isRelativeMode = match[4] == 1 ? "1" : "0";
        if (!isInitialized) {
          isMinimalistMode = minimalist;
          if (
            minimalist &&
            parameterType != "image-adjustment" &&
            parameterType != "custom-keys"
          ) {
            isRelativeMode = "self:get_auto_mode()";
          }
        }
        isInitialized = true;
      }
    }
    if (isMinimalistMode !== minimalist) {
      isMinimalistMode = minimalist;
      if (minimalist) {
        if (
          parameterType != "image-adjustment" &&
          parameterType != "custom-keys"
        ) {
          isRelativeMode = "self:get_auto_mode()";
        } else {
          isRelativeMode = "0";
        }
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
        var code = `gps("package-photoshop", "${parameterType}", "${parameterId}", ${parameterValue}, ${isRelativeMode})`;
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
    <div class={!isMinimalistMode ? "w-1/2" : "w-full"}>
      <MeltCombo
        title={"Parameter ID"}
        bind:value={parameterId}
        {suggestions}
        searchable={true}
        size={"full"}
      />
    </div>
    {#if !isMinimalistMode}
      <div style="width: 50%;">
        <MeltCombo
          title={"Parameter value"}
          bind:value={parameterValue}
          size={"full"}
        />
      </div>
    {/if}
  </div>

  {#if parameterType != "image-adjustment" && parameterType != "custom-keys"}
    <MeltCheckbox
      target={isRelativeMode == "1"}
      title={"Relative Mode"}
      on:change={(e) => {
        isRelativeMode = e.detail ? "1" : "0";
      }}
    />
  {/if}
</single-parameter-set>
