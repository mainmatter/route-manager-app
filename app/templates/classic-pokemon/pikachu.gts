<template>
  <div class="classic">
    <h1>{{@model.pokemon.name}}</h1>

    <img
      src={{@model.pokemon.sprites.front_default}}
      alt={{@model.pokemon.name}}
    />

    {{outlet}}
  </div>
</template>
