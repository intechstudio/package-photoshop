<svelte:options customElement={{tag: 'single-event-action', shadow: 'none'}} />
<script>
  import { AtomicInput, AtomicSuggestions } from "@intechstudio/grid-uikit";
  import { onMount } from "svelte";
  let eventType = "";
  let eventId = "";
  let currentCodeValue = "";
  let ref;
  let suggestionElement;
  $: suggestions = ({
    "select-tool" : [
    {info: "Brush", value : "paintbrushTool"},
    {info: "Burn", value : "burnInTool"},
    {info: "Clone Stamp", value : "cloneStampTool"},
    {info: "Crop", value : "cropTool"},
    {info: "Eyedropper", value : "eyedropperTool"},
    {info: "Healing Brush", value : "magicStampTool"},
    {info: "Lasso", value : "lassoTool"},
    {info: "Paint Bucket", value : "bucketTool"},
  ],
  "create-adjustment" : [
    {info: "Solid Color", value : "solidColorLayer"},
    {info: "Gradient", value : "gradientLayer"},
    {info: "Pattern", value : "patternLayer"},
    {info: "Brightness", value : "brightnessEvent"},
    {info: "Levels", value : "levels"},
    {info: "Curves", value : "curves"},
    {info: "Exposure", value : "exposure"},
    {info: "Vibrance", value : "vibrance"},
    {info: "Hue/Saturation", value : "hueSaturation"},
    {info: "Color Balance", value : "colorBalance"},
    {info: "Black and White", value : "blackAndWhite"},
    {info: "Photo Filter", value : "photoFilter"},
    {info: "Channel Mixer", value : "channelMixer"},
    {info: "Color Lookup", value : "colorLookup"},
    {info: "Invert", value : "invert"},
    {info: "Posterize", value : "posterization"},
    {info: "Threshold", value : "thresholdClassEvent"},
    {info: "Gradient Map", value : "gradientMapClass"},
    {info: "Selective Color", value : "selectiveColor"},
  ],
  "menu" : [
    {info: "Save as", value : "32"},
    {info: "Save for web", value : "1695"},
    {info: "Shadow/Highlight Dialog", value : "3065"},
    {info: "Brightness/Contrast Dialog", value : "1803"},
    {info: "Hue/Saturation Dialog", value : "1805"},
    {info: "Merge layers", value : "1166"},
  ]})[eventType];

  function handleConfigUpdate(config) {
    const regex =
        /^gps\("package-photoshop", "*(.*?)", "*(.*?)"\)$/;
    if (currentCodeValue != config.script){
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

  $: eventId, function() {
    var code = `gps("package-photoshop", "${eventType}", "${eventId}")`;
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

<single-event
  class="{$$props.class} flex flex-col w-full pb-2 px-2 pointer-events-auto"
  bind:this={ref}
>
    <div class="w-full flex">
        <div class="atomicInput">
            <div class="text-gray-500 text-sm pb-1">Parameter ID</div>
            <AtomicInput
                inputValue={eventId}
                suggestions={suggestions}
                suggestionTarget={suggestionElement}
                on:change={(e) => {
                    eventId = e.detail;
                }}/>
        </div>
    </div>

    <AtomicSuggestions bind:component={suggestionElement} />
  </single-event>