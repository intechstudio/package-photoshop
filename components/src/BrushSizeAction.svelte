<svelte:options customElement={{tag: 'brush-size-action', shadow: 'none'}} />
<script>
  import { MoltenInput } from "@intechstudio/grid-uikit";
    import { onMount } from "svelte";
  let textValue = "";
  let currentCodeValue = "";
  let ref;

  function handleConfigUpdate(config) {
    const regex = /^gps\("package-photoshop", "brushsize", (.*?)\)$/;
    console.log("CONFIG RECEIVED!");
    const match = config.script.match(regex);
    if (match) {
      currentCodeValue = match[1];
      textValue = match[1];
    }
  }

  onMount(() => {
    console.log("SENDING HANDLER");
    const event = new CustomEvent("updateConfigHandler", {
        bubbles: true,
        detail: { handler: handleConfigUpdate },
    });
    ref.dispatchEvent(event);
  });

  $: textValue && function() {
    if (currentCodeValue != textValue){
        currentCodeValue = textValue;    
        var code = `gps("package-photoshop", "brushsize", ${textValue})`;
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

<action-brush-size 
  class="{$$props.class} flex flex-col w-full pb-2 px-2 pointer-events-auto"
  bind:this={ref}
>
  <MoltenInput bind:target={textValue} />
</action-brush-size>