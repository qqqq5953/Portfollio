<script setup lang="ts">
import { PieChart } from "echarts/charts";
import {
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { computed, provide } from "vue";
import VChart, { THEME_KEY } from "vue-echarts";

type ChartDataItem = {
  value: number;
  name: string;
  symbol: string;
  shares: number;
  cost: number;
  profit: number;
  profitPercentage: number;
  currentPrice: number;
};

const props = defineProps<{
  chartData: ChartDataItem[];
  isLoading: boolean;
}>();

use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
]);

provide(THEME_KEY, "light");

const option = computed(() => ({
  title: {
    text: "Portfolio Composition",
    left: "left",
    textStyle: {
      fontSize: 16,
      color: "#525252",
    },
  },
  tooltip: {
    trigger: "item",
    formatter: (params: any) => {
      const data = params.data;
      return `
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-8">
            <span class="font-bold text-neutral-800">${data.symbol}</span>
            <div class="flex items-center font-medium ${data.profit >= 0 ? 'text-green-500' : 'text-red-500'}">
              <span>${data.profit >= 0 ? '+' : ''}</span>
              <span class="ml-0.5 mr-1">${data.profit.toFixed(2)}</span>
              <span>(${data.profitPercentage.toFixed(2)}%)</span>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-neutral-500 mr-1">Market Value:</span>
            <span>${data.value}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-neutral-500 mr-1">Shares:</span><span class="text-neutral-500">${data.shares}</span>
          </div>
        </div>
      `;
    },
  },
  legend: {
    orient: "horizontal",
    bottom: "bottom",
    data: props.chartData.map(item => item.symbol),
  },
  series: [
    {
      name: "Portfolio",
      type: "pie",
      radius: "55%",
      center: ["50%", "60%"],
      data: props.chartData.map(item => ({
        value: item.value,
        name: item.symbol,
        symbol: item.symbol,
        shares: item.shares,
        cost: item.cost,
        profit: item.profit,
        profitPercentage: item.profitPercentage,
        currentPrice: item.currentPrice,
      })),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
      },
      label: {
        show: true,
        formatter: '{b}: {d}%',
        fontSize: 12,
      },
    },
  ],
}));
</script>

<template>
  <div class="chart-container">
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="text-sm text-muted-foreground mt-2">Loading portfolio data...</p>
    </div>
    <div v-else-if="chartData.length === 0" class="empty-state">
      <p class="text-sm text-muted-foreground">No portfolio data available</p>
    </div>
    <v-chart v-else class="chart" :option="option" :autoresize="true" />
  </div>
</template>

<style scoped>
.chart-container {
  height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.chart {
  height: 100%;
  width: 100%;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
