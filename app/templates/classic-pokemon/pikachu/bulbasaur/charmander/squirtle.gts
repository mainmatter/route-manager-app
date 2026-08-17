<template>
  <div
    class="classic"
    data-test-route-level="classic-pokemon.pikachu.bulbasaur.charmander.squirtle"
  >
    <h1>{{@model.pokemon.name}}</h1>

    <img
      src={{@model.pokemon.sprites.front_default}}
      alt={{@model.pokemon.name}}
    />

    {{outlet}}
  </div>
</template>
