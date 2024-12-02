<svelte:options customElement={{tag: 'single-event-dynamic-action', shadow: 'none'}} />
<script>
  import { AtomicInput, AtomicSuggestions } from "@intechstudio/grid-uikit";
  import { onMount } from "svelte";
  let eventType = "";
  let eventId = "";
  let currentCodeValue = "";
  let ref;
  let suggestionElement;
  let suggestions = undefined;

  $: eventType && loadSuggestions();

  function loadSuggestions(){
    // @ts-ignore
    let port = createPackageMessagePort("package-photoshop", "dynamic-action");
    port.onmessage = (e) => {
      const data = e.data;
      if (data.type === "init-suggestions") {
        suggestions = data.suggestions[eventType];
      }
      port.close();
    };
    port.start();
  }

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