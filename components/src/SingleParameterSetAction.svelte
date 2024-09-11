<svelte:options customElement={{tag: 'single-parameter-set-action', shadow: 'none'}} />
<script>
  import { AtomicInput, AtomicSuggestions, MeltCheckbox } from "@intechstudio/grid-uikit";
    import { onMount } from "svelte";
  let parameterType = "";
  let parameterId = "";
  let parameterValue = "";
  let isRelativeMode = false;
  let currentCodeValue = "";
  let ref;
  let suggestionElement;
  $: suggestions = ({
    "tool-parameter" : [
    {info: "Angle", value : "angle"},
    {info: "Flow", value : "flow"},
    {info: "Hardness", value : "hardness"},
    //{info: "Mode", value : "mode"},
    {info: "Opacity", value : "opacity"},
    {info: "Pressure", value : "pressure"},
    {info: "Roundness", value : "roundness"},
    {info: "Size", value : "size"},
    {info: "Smoothing", value : "smoothing"},
    {info: "Spacing", value : "spacing"},
  ],
  "image-adjustment" : [
    {info: "Brightness", value : "brigthness"},
    {info: "Contrast", value : "contrast"},
    {info: "Hue", value : "hue"},
    {info: "Lightness", value : "lightness"},
    {info: "Saturation", value : "saturation"},
  ],
  "adjust-adjustment" : [
    {info: "Brightness", value : "brightness"},
    {info: "Contrast", value : "contrast"},
    {info: "Exposure", value : "exposure"},
    {info: "Offset", value : "offset"},
    {info: "Gamma", value : "gamma"},
  ]})[parameterType];

  function handleConfigUpdate(config) {
    const regex =
        /^gps\("package-photoshop", "*(.*?)", "*(.*?)", (.*?), (1|0)\)$/;
    if (currentCodeValue != config.script){
        currentCodeValue = config.script;
        const match = config.script.match(regex);
        if (match) {
            parameterType = match[1] ?? "tool-parameter";
            parameterId = match[2] ?? "";
            parameterValue = match[3] ?? "";
            isRelativeMode = match[4] == "1";
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

  $: parameterId, parameterValue, isRelativeMode, function() {
    var code = `gps("package-photoshop", "${parameterType}", "${parameterId}", ${parameterValue}, ${isRelativeMode ? 1 : 0})`;
    if (currentCodeValue != code){
        currentCodeValue = code;    
        const event = new CustomEvent("updateCode", {
            bubbles: true,
            detail: { script: String(code) },
        });
        if (ref){
            ref.dispatchEvent(event);
        }
    }
  }()
</script>

<single-parameter-set
  class="{$$props.class} flex flex-col w-full pb-2 px-2 pointer-events-auto"
  bind:this={ref}
>
    <div class="w-full flex">
        <div class="atomicInput" style="width: 50%;">
            <div class="text-gray-500 text-sm pb-1">Parameter ID</div>
            <AtomicInput
                inputValue={parameterId}
                suggestions={suggestions}
                suggestionTarget={suggestionElement}
                on:change={(e) => {
                    parameterId = e.detail;
                }}/>
        </div>
        <div class="atomicInput" style="width: 50%;">
            <div class="text-gray-500 text-sm pb-1">Parameter value</div>
            <AtomicInput
                inputValue={parameterValue}
                suggestions={[]}
                suggestionTarget={suggestionElement}
                on:change={(e) => {
                    parameterValue = e.detail;
                }}/>
        </div>
    </div>

    <AtomicSuggestions bind:component={suggestionElement} />
    {#if parameterType != "image-adjustment"}  
      <MeltCheckbox bind:target={isRelativeMode} title={"Relative Mode"} />
    {/if}
</single-parameter-set>