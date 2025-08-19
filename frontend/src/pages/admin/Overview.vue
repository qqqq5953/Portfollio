<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useSidebar } from "@/components/ui/sidebar/utils";
import FormattedNumber from "@/components/FormattedNumber.vue";
import StockLogo from "@/components/StockLogo.vue";

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
const totalCost = ref(0);
const isLoading = ref(false);

const { state } = useSidebar();
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
    totalCost.value = Number(cost.toFixed(2));
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
    <div 
      class="grid grid-cols-2 lg:grid-cols-4 gap-4" 
      :class="[ state === 'expanded' ? 'md:grid-cols-2' : 'md:grid-cols-4' ]"
    >
      <Card>
        <CardContent>
          <div class="text-sm text-center text-muted-foreground mb-1">Profit %</div>
          <div v-if="isLoading" class="flex justify-center items-center h-7">
            <Loader2 class="animate-spin text-neutral-300" :size="24" />
          </div>
          <FormattedNumber 
            v-else
            type="percentage"
            align="center"
            :value="totalProfitPercentage" 
            :useInCard="true"  
            :useColor="true"
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent class="px-0">
          <div class="flex justify-center items-center gap-1 text-sm text-muted-foreground mb-1">
            <span>Total Profit</span>
            <span class="text-xs">(USD)</span>
          </div>
          <div v-if="isLoading" class="flex justify-center items-center h-7">
            <Loader2 class="animate-spin text-neutral-300" :size="24" />
          </div>
          <FormattedNumber 
            v-else
            type="decimal"
            align="center"
            :value="totalProfit" 
            :useInCard="true"  
            :useColor="true"
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent class="px-0">
          <div class="flex justify-center items-center gap-1 text-sm text-muted-foreground mb-1">
            <span>Asset Value</span>
            <span class="text-xs">(USD)</span>
          </div>
          <div v-if="isLoading" class="flex justify-center items-center h-7">
            <Loader2 class="animate-spin text-neutral-300" :size="24" />
          </div>
          <FormattedNumber 
            v-else
            type="decimal"
            align="center"
            :value="totalValue" 
            :useInCard="true"
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent class="px-0">
          <div class="flex justify-center items-center gap-1 text-sm text-muted-foreground mb-1">
            <span>Total Cost</span>
            <span class="text-xs">(USD)</span>
          </div>
          <div v-if="isLoading" class="flex justify-center items-center h-7">
            <Loader2 class="animate-spin text-neutral-300" :size="24" />
          </div>
          <FormattedNumber 
            v-else
            class="text-center"
            type="decimal"
            align="center"
            :value="totalCost" 
            :useInCard="true"  
          />
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
        <CardContent class="px-0 sm:px-6">
          <div class="hidden w-full mx-auto sm:max-w-5xl sm:block">
            <Table class="table sm:max-w-4xl sm:mx-auto">
              <TableHeader>
                <TableRow>
                  <TableHead class="text-center text-neutral-500 font-light p-4 w-[120px] min-w-[120px]">Ticker</TableHead>
                  <TableHead class="text-right text-neutral-500 font-light w-[100px] min-w-[100px]">Profit</TableHead>
                  <TableHead class="text-right text-neutral-500 font-light">
                    <div>Market Value</div>
                  </TableHead>
                  <TableHead class="text-right text-neutral-500 font-light">
                    <div>Total Cost</div>
                  </TableHead>
                  <TableHead class="text-right text-neutral-500 font-light p-4 w-[80px]">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-if="isLoading">
                  <TableRow v-for="i in 5" class="border-none h-10">
                    <TableCell colspan="5" :class="i === 1 ? 'px-1 pb-1 pt-2' : 'p-1'">
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
                    <TableCell class="font-medium py-6">
                      <div class="flex items-center gap-2 shrink-0">
                        <StockLogo :symbol="transaction.symbol" />
                        <span class="text-indigo-500 px-2 rounded-md font-semibold text-sm">
                          {{ transaction.symbol }}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="flex flex-col items-end gap-0 font-medium text-sm">
                        <FormattedNumber
                          type="decimal"
                          :value="transaction.profit"
                          :useColor="true"
                          :useSign="true"
                        />
                        <FormattedNumber
                          type="percentage"
                          :value="transaction.profitPercentage"
                          :useColor="true"
                          :useSign="true"
                          :useParentheses="true"
                        />
                      </div>
                    </TableCell>
                    <TableCell class="text-right">
                      <FormattedNumber
                        type="decimal"
                        :value="currentPrices[transaction.symbol] * transaction.remaingShare"
                      />
                    </TableCell>
                    <TableCell class="text-right">
                      <FormattedNumber
                        type="decimal"
                        :value="transaction.cost"
                      />
                    </TableCell>
                    <TableCell class="text-right p-4 w-[80px]">
                      <FormattedNumber
                        type="decimal"
                        :value="transaction.remaingShare"
                      />
                    </TableCell>
                  </TableRow>
                </template>
              </TableBody>
            </Table>
          </div>

          <div class="block w-full space-y-4 mx-auto sm:hidden">
            <Card 
              v-for="transaction in unrealizedStocks"
              :key="transaction.id"
              class="shadow-none border-none p-4"
            >
              <div class="space-y-3">
                <div class="flex justify-between items-end">
                  <div>
                    <StockLogo :symbol="transaction.symbol" class="mb-0.5 ml-2"/>
                    <span class="text-indigo-500 px-2 font-semibold text-lg">
                      {{ transaction.symbol }}
                    </span>
                  </div>
                  <FormattedNumber
                    class="font-medium rounded-full px-2 py-0.5 mb-0.5"
                    :class="{
                      'text-rose-600 bg-rose-100': transaction.profitPercentage < 0,
                      'text-green-600 bg-green-100': transaction.profitPercentage > 0,
                      'text-neutral-800 bg-neutral-200': transaction.profitPercentage === 0,
                    }"
                    type="percentage"
                    :value="transaction.profitPercentage"
                    :useColor="true"
                    :useArrow="true"
                  />
                </div>
                
                <div class="flex justify-between items-center border-t pt-3 px-2 text-sm">
                  <div class="text-neutral-500">
                    Profit
                  </div>
                  <FormattedNumber
                    class="font-medium"
                    :class="{
                      'text-rose-600': transaction.profit < 0,
                      'text-green-600': transaction.profit > 0,
                      'text-neutral-600': transaction.profit === 0,
                    }"
                    type="decimal"
                    :value="transaction.profit"
                    :useColor="true"
                  />
                </div>  
                <div class="flex justify-between items-center border-t pt-3 px-2 text-sm">
                  <div class="text-neutral-500">Market Value</div>
                  <FormattedNumber
                    type="decimal"
                    :value="currentPrices[transaction.symbol] * transaction.remaingShare"
                  />
                </div>

                <div class="flex justify-between items-center border-t pt-3 px-2 text-sm">
                  <div class="text-neutral-500">Total Cost</div>
                  <FormattedNumber
                    type="decimal"
                    :value="transaction.cost"
                  />
                </div>

                <div class="flex justify-between items-center border-t pt-3 px-2 text-sm">
                  <div class="text-neutral-500">Shares</div>
                  <FormattedNumber
                    type="decimal"
                    :value="transaction.remaingShare"
                  />
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
    <footer class="flex justify-center items-center text-sm text-neutral-500">
      <a href="https://elbstream.com" target="_blank" class="hover:underline">Logos provided by Elbstream</a>
    </footer>
  </div>
</template>
