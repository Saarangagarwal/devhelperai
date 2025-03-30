<script>
  export let value = "";
  export let minRows;
  export let maxRows;

  let textarea;

  $: minHeight = `${1 + minRows * 1.1}em`;
  $: maxHeight = maxRows ? `${1 + maxRows * 1.1}em` : `auto`;

  function resize() {
    if (value === undefined || value === null || !value.trim()) {
      minHeight = `${1 + minRows * 1.1}em`;
      maxHeight = maxRows ? `${1 + maxRows * 1.1}em` : `auto`;
    }
  }

  $: value, resize();
</script>

<div class="container">
  <pre
    aria-hidden="true"
    style="min-height: {minHeight}; max-height: {maxHeight}; overflow: hidden; visibility: hidden;">{value +
      "\n"}</pre>

  <textarea
    bind:this={textarea}
    bind:value
    on:input={resize}
    style="min-height: {minHeight}; max-height: {maxHeight}; overflow-y: auto;"
    {...$$restProps}
  ></textarea>
</div>

<style>
  .container {
    position: relative;
    height: 100%;
  }

  pre,
  textarea {
    font-family: inherit;
    padding: 0.5em;
    box-sizing: border-box;
    border: 1px solid #eee;
    line-height: 1.2;
    overflow: hidden;
  }

  textarea {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    resize: none;
  }
</style>
