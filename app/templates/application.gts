import { LinkTo } from '@ember/routing';

<template>
  <LinkTo @route="index">Go home</LinkTo>
  <LinkTo @route="thing">Go to thing route</LinkTo>
  <LinkTo @route="thing.sub">Go to thing.sub route</LinkTo>
  {{outlet}}
</template>
