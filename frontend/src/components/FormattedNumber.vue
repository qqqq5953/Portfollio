<script setup lang="ts">
import { computed } from 'vue';
import { ArrowUp, ArrowDown } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  value: number;
  type?: 'percentage' | 'decimal';
  align?: 'left' | 'center' | 'right';
  useInCard?: boolean;
  useColor?: boolean;
  useSign?: boolean;
  useArrow?: boolean;
  useParentheses?: boolean;
}>(), {
  type: 'decimal',
  align: 'right',
  useInCard: false,
  useColor: false,
  useSign: false,
  useArrow: false,
  useParentheses: false,
});

const sign = computed(() => {
  return props.value > 0 ? '+' : props.value < 0 ? '-' : '';
});

const color = computed(() => {
  if (props.useColor) {
    return props.value > 0 ? 'text-green-500' : props.value < 0 ? 'text-red-500' : 'text-neutral-800';
  }
  return 'text-neutral-800';
});

const alignClass = computed(() => {
  const align = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }
  return align[props.align] || 'justify-end';
});

const number = computed(() => {
  return props.useSign ? formatNumber(Math.abs(props.value)) : formatNumber(props.value);
});

const formattedNumber = computed(() => {
  return new Intl.NumberFormat("en-US").format(number.value);
});

function formatNumber(num: number): number {
  return Number.isInteger(num) || num.toString().split(".")[1]?.length <= 2
      ? num
      : Number(num.toFixed(2));
}

</script>

<template>
  <div
    class="flex items-center gap-0.5"
    :class="[
      color,
      alignClass,
      props.useInCard ? 'text-lg md:text-xl font-medium ' : 'text-sm'
    ]"
  >
    <span v-if="props.useParentheses">(</span>
    <div class="flex items-center">
      <span v-if="props.useSign" class="mr-0.5">
        {{ sign }}
      </span>
      <span v-if="props.useArrow" class="mr-1">
        <ArrowUp v-if="number > 0" :size="14" stroke-width="2.5" /> 
        <ArrowDown v-else-if="number < 0" :size="14" stroke-width="2.5" />
      </span>
      <span class="proportional-nums">{{ formattedNumber }} {{ props.type === 'percentage' ? '%' : '' }}</span>
    </div>
    <span v-if="props.useParentheses">)</span>
  </div>
</template>