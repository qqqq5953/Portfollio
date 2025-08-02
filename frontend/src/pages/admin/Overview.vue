<script setup lang="ts">
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, TrendingUp } from "lucide-vue-next";
import PieChart from "@/components/PieChart.vue";
import { onMounted, ref } from "vue";
import { callEdgeFunction } from "@/lib/helper";
import { supabase } from "@/lib/supabase";

type UnrealizedStocksReadResponse = {
  unrealized: {
    id: string;
    symbol: string;
    cost: number;
    profit: number;
    profitPercentage: number;
    remaingShare: number;
    side: "buy";
    currency: "USD" | "TWD";
    exchange_rate: number;
  }[];
  currentPrices: Record<string, number>;
};

const unrealizedStocks = ref<UnrealizedStocksReadResponse["unrealized"]>([]);
const currentPrices = ref<UnrealizedStocksReadResponse["currentPrices"]>({});
const totalProfitPercentage = ref(0);
const totalProfit = ref(0);
const totalValue = ref(0);
const isLoading = ref(true);

async function handleDisplayTransactions() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data } = await callEdgeFunction<UnrealizedStocksReadResponse>({
    name: "unrealized-stocks-read",
    body: {
      userId: session?.user?.id || ""
    },
  });
  console.log("data", data);

  if (data) {
    const {
      profit,
      cost,
      value, 
    } = data.unrealized.reduce((acc, item) => {
      acc.profit += item.profit;
      acc.cost += item.cost;
      acc.value += data.currentPrices[item.symbol] * item.remaingShare;
      return acc;
    }, { profit: 0, cost: 0, value: 0 });
  
    unrealizedStocks.value = data.unrealized;
    currentPrices.value = data.currentPrices;
    totalProfit.value = Number(profit.toFixed(2));
    totalProfitPercentage.value = Number(((profit / cost) * 100).toFixed(2));
    totalValue.value = Number(value.toFixed(2));
    isLoading.value = false;
  }
}

onMounted(async () => {
  await handleDisplayTransactions();
});
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent>
          <div class="text-sm text-muted-foreground text-center">Profit %</div>
          <div v-if="isLoading" class="flex justify-center items-center h-7 mt-1">
            <Loader2 class="animate-spin text-neutral-300" :size="24" />
          </div>
          <div v-else class="text-xl font-medium text-center mt-1"
          :class="{ 
            'text-green-500': totalProfitPercentage > 0, 
            'text-red-500': totalProfitPercentage < 0,
            'text-neutral-600': totalProfitPercentage === 0
          }"
          >{{ totalProfitPercentage >= 0 ? '+' : '-' }} {{ Math.abs(totalProfitPercentage) }}%</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <div class="text-sm text-muted-foreground text-center">
            Total Profit (USD)
          </div>
          <div v-if="isLoading" class="flex justify-center items-center h-7 mt-1">
            <Loader2 class="animate-spin text-neutral-300" :size="24" />
          </div>
          <div v-else class="text-xl font-medium text-center mt-1"
          :class="{ 
            'text-green-500': totalProfit > 0, 
            'text-red-500': totalProfit < 0,
            'text-neutral-600': totalProfit === 0
          }"
          >
          {{ totalProfit >= 0 ? '+' : '-' }} ${{ Math.abs(totalProfit) }}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <div class="text-sm text-muted-foreground text-center">
            Asset Value (USD)
          </div>
          <div v-if="isLoading" class="flex justify-center items-center h-7 mt-1">
            <Loader2 class="animate-spin text-neutral-300" :size="24" />
          </div>
          <div v-else class="text-xl font-medium text-center mt-1">{{ totalValue }}</div>
        </CardContent>
      </Card>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card class="flex flex-col">
        <CardContent>
          <PieChart />
        </CardContent>
        <CardFooter class="flex flex-col gap-2">
          <div class="flex items-center gap-2 leading-none font-medium">
            Trending up by 5.2% this month <TrendingUp class="h-4 w-4" />
          </div>
          <div class="text-muted-foreground leading-none">
            Showing total visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
      <Card>
        <CardContent>
          <Table class="hidden sm:table sm:max-w-4xl sm:mx-auto">
            <TableHeader>
              <TableRow>
                <TableHead class="text-neutral-500 font-light p-4">Ticker</TableHead>
                <TableHead class="text-right text-neutral-500 font-light">ROI</TableHead>
                <TableHead class="text-right text-neutral-500 font-light">Profit</TableHead>
                <TableHead class="text-right text-neutral-500 font-light">Market Value</TableHead>
                <TableHead class="text-right text-neutral-500 font-light">Total Cost</TableHead>
                <TableHead class="text-right text-neutral-500 font-light p-4 ">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="isLoading">
                <TableRow v-for="i in 5" class="border-none h-10">
                  <TableCell colspan="6" :class="i === 1 ? 'px-1 pb-1 pt-2' : 'p-1'">
                    <div class="h-10 bg-neutral-100 animate-pulse rounded-xl"></div>
                  </TableCell>
                </TableRow>
              </template>
              <template v-else>
                <TableRow
                  v-for="transaction in unrealizedStocks"
                  :key="transaction.id"
                >
                  <TableCell class="font-medium py-4">
                    <span class="bg-indigo-100 px-2 py-1 rounded-full text-xs">
                      {{transaction.symbol}}
                    </span>
                  </TableCell>
                  <TableCell
                    :class="{
                      'text-rose-600': transaction.profitPercentage < 0,
                      'text-green-500': transaction.profitPercentage > 0,
                    }"
                    class="text-right"
                    >{{ transaction.profitPercentage?.toFixed(2) }} %</TableCell
                  >
                  <TableCell
                    :class="{
                      'text-rose-600': transaction.profit < 0,
                      'text-green-500': transaction.profit > 0,
                    }"
                    class="text-right"
                    >
                    <span v-if="transaction.profit >= 0">+</span>
                    <span v-else>-</span>
                    <span class="mx-0.5">$</span>
                    <span>{{ Math.abs(transaction.profit).toFixed(2) }}</span>
                  </TableCell>
                  <TableCell class="text-right">
                    <span class="mr-0.5">$</span>
                    <span>{{ (currentPrices[transaction.symbol] * transaction.remaingShare).toFixed(2) }}</span>
                  </TableCell>
                  <TableCell class="text-right">
                    <span class="mr-0.5">$</span>
                    <span>{{ (transaction.cost).toFixed(2) }}</span>
                  </TableCell>
                  <TableCell class="text-right p-4">{{ transaction.remaingShare }}</TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
