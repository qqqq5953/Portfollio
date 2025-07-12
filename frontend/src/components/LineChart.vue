<script setup lang="ts">
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import VChart, { THEME_KEY } from "vue-echarts";
import { ref, provide } from "vue";

use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
]);

provide(THEME_KEY, "light");

const option = ref({
  title: {
    text: "Portfolio Value Over Time",
    left: "left",
  },
  tooltip: {
    trigger: "axis",
  },
  legend: {
    orient: "horizontal",
    bottom: "bottom",
    data: ["Portfolio", "Benchmark"],
  },
  xAxis: {
    type: "category",
    data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      name: "Portfolio",
      type: "line",
      smooth: true,
      data: [12000, 14000, 13000, 15000, 17000, 16000],
      lineStyle: {
        width: 2,
        color: "#4f46e5", // blue
      },
      itemStyle: {
        color: "#4f46e5",
      },
      symbol: "circle",
      symbolSize: 6,
    },
    {
      name: "Benchmark",
      type: "line",
      smooth: true,
      data: [7200, 6400, 5300, 7500, 7700, 6600],
      lineStyle: {
        width: 2,
        color: "#0ea5e9", // blue
      },
      itemStyle: {
        color: "#0ea5e9",
      },
      symbol: "circle",
      symbolSize: 6,
    },
  ],
});
</script>

<template>
  <v-chart class="chart" :option="option" :autoresize="true" />
</template>

<style scoped>
.chart {
  height: 400px;
}
</style>
