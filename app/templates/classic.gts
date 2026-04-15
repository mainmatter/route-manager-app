<template>
  <div class="classic">
    <h2>Hello from a Classic Route!</h2>
    <p>Zebra striping of route managers works!</p>

    <p>Model data is passed in as expected: {{@model}}</p>
    <p>Model properties are accessible: {{@model.name}}</p>
    <p>Has a generated controller: {{@controller}}</p>

    {{outlet}}
  </div>
</template>
