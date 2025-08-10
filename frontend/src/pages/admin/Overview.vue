<script setup lang="ts">
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-vue-next";
import PieChart from "@/components/PieChart.vue";
import { onMounted, ref, computed } from "vue";
import { callEdgeFunction } from "@/lib/helper";
import { supabase } from "@/lib/supabase";
import { useRouter } from "vue-router";

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
const isLoading = ref(false);

const router = useRouter();

const pieChartData = computed(() => {
  if (unrealizedStocks.value.length === 0) return [];
  return unrealizedStocks.value.map(stock => {
    const marketValue = currentPrices.value[stock.symbol] * stock.remaingShare;
    return {
      value: Number(marketValue.toFixed(2)),
      name: stock.symbol,
      symbol: stock.symbol,
      shares: stock.remaingShare,
      cost: stock.cost,
      profit: stock.profit,
      profitPercentage: stock.profitPercentage,
      currentPrice: currentPrices.value[stock.symbol]
    };
  });
});

function handleClickSymbol(symbol: string) {
  router.push({
    name: "symbol-transactions",
    params: { symbol },
  });
}

async function handleDisplayTransactions() {
  isLoading.value = true;

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

  if (data && data.unrealized.length > 0) {
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
  }

  isLoading.value = false;
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
          >
          <span class="mr-0.5">{{ totalProfitPercentage > 0 ? '+' :
          totalProfitPercentage < 0 ? '-' : '' }}</span>
          <span>{{ Math.abs(totalProfitPercentage) }} %</span>
          </div>
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
          <span class="mr-0.5">{{ totalProfit > 0 ? '+' :
          totalProfit < 0 ? '-' : '' }}</span>
          <span>{{ Math.abs(totalProfit) }}</span>
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
          <PieChart :chartData="pieChartData" :isLoading="isLoading" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="px-6">
          <CardTitle class="font-medium text-neutral-600">Unrealized Stocks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table class="table sm:max-w-4xl sm:mx-auto">
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
                  @click="handleClickSymbol(transaction.symbol)"
                  class="cursor-pointer"
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
                  >
                    <div class="space-x-0.5">
                      <span>{{ transaction.profitPercentage >= 0 ? '+' : '-' }}</span>
                      <span>{{ Math.abs(transaction.profitPercentage).toFixed(2) }} %</span>
                    </div>  
                  </TableCell>
                  <TableCell
                    :class="{
                      'text-rose-600': transaction.profit < 0,
                      'text-green-500': transaction.profit > 0,
                    }"
                    class="text-right"
                    >
                    <div class="space-x-0.5">
                      <span>{{ transaction.profit >= 0 ? '+' : '-' }}</span>
                      <span>{{ Math.abs(transaction.profit).toFixed(2) }}</span>
                    </div>
                  </TableCell>
                  <TableCell class="text-right">
                    <span>{{ (currentPrices[transaction.symbol] * transaction.remaingShare).toFixed(2) }}</span>
                  </TableCell>
                  <TableCell class="text-right">
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
