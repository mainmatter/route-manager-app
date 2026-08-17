<template>
  <div class="classic" data-test-route-level="classic-pokemon">
    <h1>Classic Pokemon be loaded</h1>

    <p>
      {{JSON.stringify @model.pokemon null 2}}
    </p>

    {{outlet}}
  </div>
</template>
