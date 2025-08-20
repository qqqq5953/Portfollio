<script setup lang="ts">
const props = defineProps<{
  symbol: string;
  type: 'card' | 'table';
}>();
</script> 

<template>
  <div class="text-indigo-500 font-semibold" :class="[
    props.type === 'card' ? 'text-lg' : 'text-base text-left',
  ]">
    {{ props.symbol }}
  </div>
</template>