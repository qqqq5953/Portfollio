<script setup lang="ts">
import { formatNumberWithCommasAndDecimals } from "@/lib/helper";
import { PieChart } from "echarts/charts";
import {
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { computed, provide, ref, onMounted, onUnmounted } from "vue";
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

// Media query detection
const isLargeScreen = ref(false);

onMounted(() => {
  const mediaQuery = window.matchMedia('(min-width: 768px)');
  isLargeScreen.value = mediaQuery.matches;
  
  const handleMediaChange = (e: MediaQueryListEvent) => {
    isLargeScreen.value = e.matches;
  };
  
  mediaQuery.addEventListener('change', handleMediaChange);
  
  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleMediaChange);
  });
});

const option = computed(() => ({
  legend: {
    orient: isLargeScreen.value?'horizontal':'vertical',
    top: isLargeScreen.value ? '5%' : 'middle',
    left: isLargeScreen.value ? 'center' : '5%',
    icon: 'circle',
    data: props.chartData.map(item => item.symbol),
    formatter: (name: string) => {
      const item = props.chartData.find(data => data.symbol === name);
      if (item) {
        const totalValue = props.chartData.reduce((sum, data) => sum + data.value, 0);
        const percentage = ((item.value / totalValue) * 100).toFixed(1);
        return `${name} - ${percentage}%`;
      }
      return name;
    }
  },
  series: [
    {
      name: "Portfolio",
      type: "pie",
      radius: isLargeScreen.value ? ['40%', '60%'] : ['50%', '33%'], // 粗細, 
      center: isLargeScreen.value ? ["50%", "65%"] : ["75%", "43%"],
      itemStyle: {
        borderRadius: 5,
        borderColor: '#fff',
        borderWidth: 1
      },
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
      label: {
        show: false,
        position: 'center',
        formatter: (params: any) => {
          const data = params.data;
          const profitStyle = data.profit >= 0 ? 'profitPositive' : 'profitNegative';
          
          function formatValue(value: number) {
            if (value >= 1000000) {
              return `$${formatNumberWithCommasAndDecimals(value / 1000000)}M`;
            } else if (value >= 1000) {
              return `$${formatNumberWithCommasAndDecimals(value / 1000)}K`;
            } else {
              return `$${formatNumberWithCommasAndDecimals(value)}`;
            }
          };
          
          function formatProfit(profit: number) {
            if (Math.abs(profit) >= 1000000) {
              return `${formatNumberWithCommasAndDecimals(profit / 1000000)}M`;
            } else if (Math.abs(profit) >= 1000) {
              return `${formatNumberWithCommasAndDecimals(profit / 1000)}K`;
            } else {
              return `${formatNumberWithCommasAndDecimals(profit)}`;
            }
          };
          
          const valueStr = formatValue(data.value);
          const profitStr = `${formatProfit(data.profit)}\n(${data.profitPercentage.toFixed(1)}%)`;

          return `{symbol|${data.symbol}}\n` +
                `{value|${valueStr}}\n` +
                `{${profitStyle}|${profitStr}}`
        },
        rich: {
          symbol: {
            fontSize: isLargeScreen.value ? 16 : 14,
            fontWeight: 'bold',
            color: '#374151',
            lineHeight: 18,
          },
          value: {
            fontSize: isLargeScreen.value ? 14 : 12,
            color: '#6b7280',
            lineHeight: 18,
          },
          profitPositive: {
            fontSize: isLargeScreen.value ? 14 : 12,
            fontWeight: 'bold',
            color: '#22c55e',
            lineHeight: 18,
          },
          profitNegative: {
            fontSize: isLargeScreen.value ? 14 : 12,
            fontWeight: 'bold',
            color: '#ef4444',
            lineHeight: 18,
          }
        }
      },
      emphasis: {
        label: {
          show: true, // show when hovered
        }
      }
    }
  ]
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
