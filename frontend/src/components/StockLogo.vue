<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  symbol: string;
}>();

const logoUrl = computed(() => {
  return `https://api.elbstream.com/logos/symbol/${props.symbol.replace('.', '-').toLowerCase()}`;
});

const isError = ref(false);
</script>

<template>
  <div class="relative">
    <img :src="logoUrl" class="size-6 rounded-md" @error="isError = true" />
    <div v-if="isError" class="absolute inset-0 flex items-center justify-center size-6 rounded-md bg-neutral-600 ">
      <span class="text-neutral-50 text-xs">{{ symbol.slice(0, 2) }}</span>
    </div>
  </div>
</template>