<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import { callEdgeFunction } from '@/lib/helper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button';
import { Pencil, Trash, ChevronLeft, Loader2 } from 'lucide-vue-next';

type Side = "buy" | "sell";
type Transaction = {
  id: string;
  price: number;
  symbol: string;
  share: number;
  side: Side;
  currency: string;
  exchange_rate: number;
  date: string;
  created_at: string;
}

type SellTransaction = {
  id: string;
  symbol: string;
  price: number;
  share: number;
  side: Side;
  currency: "USD" | "TWD";
  exchange_rate: number;
  date: string;
  created_at: string;
  costBasis: number;
  profit: number;
  profitPercentage: number;
  breakdown: {
    buyDate: string;
    quantity: number;
    buyPrice: number;
  }[];
};

const route = useRoute();
const symbol = ref('');
const transactions = ref<Transaction[]>([]);
const sellTransactions = ref<SellTransaction[]>([]);
const selectedSide = ref<Side>("buy");
const totalProfitPercentage = ref(0);
const totalProfit = ref(0);
const totalShares = ref(0);
const totalCost = ref(0);
const info = ref({
  name: '',
  currentPrice: 0,
  timestamp: 0,
});
const dateFormat = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});
const isBuyLoading = ref(false);
const isSellLoading = ref(false);

async function  handleDisplayTransactions (side: Side) { 
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if(side === 'buy') {
    try {
      isBuyLoading.value = true;
  
      const res = await callEdgeFunction<{
        transactions: Transaction[];
        info: {
          currentPrice: number;
          name: string;
          timestamp: number;
        };
      }>({
        name: 'transaction-read-symbol',
        body: {
          userId: session?.user?.id || "",
          symbol: symbol.value,
          side,
        },
      });
      console.log("res", res);

      if(res.data) {
        info.value = res.data.info
        transactions.value = res.data.transactions;
        const { _totalShares, _totalCost } = transactions.value.reduce((acc, item) => {
          acc._totalShares += item.share;
          acc._totalCost += item.price * item.share;
          return acc;
        }, { _totalShares: 0, _totalCost: 0 });
        totalShares.value = _totalShares;
        totalCost.value = _totalCost;
        totalProfit.value = info.value.currentPrice * totalShares.value - totalCost.value;
        totalProfitPercentage.value = totalProfit.value / totalCost.value * 100;
      }
    } catch (error) {
      console.log("error", error);
    } finally {
      isBuyLoading.value = false;
    }
  }

  if(side === 'sell') {
    try {
      isSellLoading.value = true;

      const res = await callEdgeFunction<{
        transactions: SellTransaction[];
        info: {
          currentPrice: number;
          name: string;
          timestamp: number;
        };
      }>({
        name: 'transaction-read-symbol',
        body: {
          userId: session?.user?.id || "",
          symbol: symbol.value,
          side,
        },
      });
      console.log("res", res);

      if(res.data) {
        sellTransactions.value = res.data.transactions;
        const { profit, totalCost } = sellTransactions.value.reduce((acc, item) => {
          acc.profit += item.profit;
          acc.totalCost += item.costBasis;
          return acc;
        }, { profit: 0, totalCost: 0 });
        totalProfit.value = profit;
        totalProfitPercentage.value = (profit / totalCost) * 100;
      }
    } catch (error) {
      console.log("error", error);
    } finally {
      isSellLoading.value = false;
    }
  }

};

watch(selectedSide, async (newSide: Side) => {
  await handleDisplayTransactions(newSide);
}, { immediate: true });

onMounted(() => {
  symbol.value = route.params.symbol as string;
});
</script>

<template>
  <div>
    <header class="flex flex-col gap-4 mb-4">
      <router-link to="/admin/overview" class="w-fit">
        <Button variant="outline" size="sm" class="hidden sm:flex w-fit bg-transparent cursor-pointer">
          <ChevronLeft :size="24" />
          Back
        </Button>
      </router-link>
      <div class="flex items-end sm:items-center justify-between">
        <div v-if="isBuyLoading">
          <div class="flex flex-col gap-2 sm:flex-row-reverse sm:items-end">
            <Skeleton class="w-24 h-9" />
            <Skeleton class="w-48 h-9" />
          </div>
        </div>
        <div v-else>
          <div class="flex flex-col sm:gap-2 sm:flex-row-reverse sm:items-end">
            <h1 class="text-2xl sm:text-3xl text-neutral-700">{{ symbol }}</h1>
            <h2 class="text-3xl text-neutral-700 font-semibold">{{ info.name }}</h2>
          </div>
        </div>
        <div v-if="isBuyLoading">
          <Skeleton class="w-32 h-9" />
        </div>
        <div v-else>
          <div class="hidden space-y-0.5 sm:block">
            <span class="text-sm text-muted-foreground font-light">Close Price: <span class="font-medium text-neutral-600">{{ info.currentPrice }}</span></span>
          </div>
          <div class="text-sm text-muted-foreground font-light text-right leading-4">{{ dateFormat.format(new Date(info.timestamp * 1000)) }}</div>
        </div>
      </div>
    </header>
    
    <div v-if="selectedSide === 'buy'" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <div class="grid grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <div class="text-sm text-muted-foreground text-center">Profit %</div>
            <div v-if="isBuyLoading" class="flex justify-center items-center pt-2">
              <Loader2 class="animate-spin text-neutral-400" />
            </div>
            <div 
              v-else
              class="text-xl font-medium text-center mt-1"
              :class="{ 
                'text-green-500': totalProfitPercentage > 0, 
                'text-red-500': totalProfitPercentage < 0,
                'text-neutral-600': totalProfitPercentage === 0
              }"
            >
              <span class="mr-0.5">{{ totalProfitPercentage > 0 ? '+' :
              totalProfitPercentage < 0 ? '-' : '' }}</span>
              <span>{{ totalProfitPercentage.toFixed(2) }} %</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div class="text-sm text-muted-foreground text-center">Profit</div>
            <div v-if="isBuyLoading" class="flex justify-center items-center pt-2">
              <Loader2 class="animate-spin text-neutral-400" />
            </div>
            <div
              v-else
              class="text-xl font-medium text-center mt-1"
              :class="{ 
                'text-green-500': totalProfit > 0, 
                'text-red-500': totalProfit < 0,
                'text-neutral-600': totalProfit === 0
              }"
            >
              <span class="mr-0.5">{{ totalProfit > 0 ? '+' :
              totalProfit < 0 ? '-' : '' }}</span>
              <span>{{ totalProfit.toFixed(2) }}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <Card class="sm:hidden">
          <CardContent>
            <div class="text-sm text-muted-foreground text-center">Closing Price</div>
            <div v-if="isBuyLoading" class="flex justify-center items-center pt-2">
              <Loader2 class="animate-spin text-neutral-400" />
            </div>
            <div v-else class="text-xl font-medium text-center mt-1">
              <span>{{ info.currentPrice }}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div class="text-sm text-muted-foreground text-center">Average Cost</div>
            <div v-if="isBuyLoading" class="flex justify-center items-center pt-2">
              <Loader2 class="animate-spin text-neutral-400" />
            </div>
            <div v-else class="text-xl font-medium text-center mt-1">
              <span>{{ (totalCost / totalShares).toFixed(2) }}</span>
            </div>
          </CardContent>
        </Card>
        <Card class="hidden sm:flex">
          <CardContent>
            <div class="text-sm text-muted-foreground text-center">Total Shares</div>
            <div v-if="isBuyLoading" class="flex justify-center items-center pt-2">
              <Loader2 class="animate-spin text-neutral-400" />
            </div>
            <div v-else class="text-xl font-medium text-center mt-1">
              <span>{{ totalShares }}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card class="sm:hidden">
        <CardContent>
          <div class="text-sm text-muted-foreground text-center">Total Shares</div>
          <div v-if="isBuyLoading" class="flex justify-center items-center pt-2">
            <Loader2 class="animate-spin text-neutral-400" />
          </div>
          <div v-else class="text-xl font-medium text-center mt-1">
            <span>{{ totalShares }}</span>
          </div>
        </CardContent>
      </Card>
    </div>
    <div v-else class="grid grid-cols-2 gap-4 mb-6">
      <Card>
        <CardContent>
          <div class="text-sm text-muted-foreground text-center">Profit %</div>
          <div v-if="isSellLoading" class="flex justify-center items-center pt-2">
            <Loader2 class="animate-spin text-neutral-400" />
          </div>
          <div 
            v-else
            class="text-xl font-medium text-center mt-1"
            :class="{ 
              'text-green-500': totalProfitPercentage > 0, 
              'text-red-500': totalProfitPercentage < 0,
              'text-neutral-600': totalProfitPercentage === 0
            }"
          >
            <span class="mr-0.5">{{ totalProfitPercentage > 0 ? '+' :
            totalProfitPercentage < 0 ? '-' : '' }}</span>
            <span>{{ totalProfitPercentage.toFixed(2) }} %</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <div class="text-sm text-muted-foreground text-center">Profit</div>
          <div v-if="isSellLoading" class="flex justify-center items-center pt-2">
            <Loader2 class="animate-spin text-neutral-400" />
          </div>
          <div
            v-else
            class="text-xl font-medium text-center mt-1"
            :class="{ 
              'text-green-500': totalProfit > 0, 
              'text-red-500': totalProfit < 0,
              'text-neutral-600': totalProfit === 0
            }"
          >
            <span class="mr-0.5">{{ totalProfit > 0 ? '+' :
            totalProfit < 0 ? '-' : '' }}</span>
            <span>{{ totalProfit.toFixed(2) }}</span>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardContent>
        <Tabs v-model="selectedSide">
          <TabsList class="w-full rounded-none bg-transparent">
            <TabsTrigger value="buy" class="text-base py-6 rounded-none border-0 w-1/2 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 data-[state=active]:border-b-[1.5px] data-[state=active]:border-indigo-500 data-[state=inactive]:border-b-[1.5px] data-[state=inactive]:border-neutral-300 data-[state=inactive]:text-neutral-500 font-medium">
              Buy
            </TabsTrigger>
            <TabsTrigger value="sell" class="text-base py-6 rounded-none border-0 w-1/2 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-indigo-500 data-[state=active]:border-b-[1.5px] data-[state=active]:border-indigo-500 data-[state=inactive]:border-b-[1.5px] data-[state=inactive]:border-neutral-300 data-[state=inactive]:text-neutral-500">
              Sell
            </TabsTrigger>
          </TabsList>
          <TabsContent value="buy" class="flex flex-col gap-4 mt-4">
            <div v-if="isBuyLoading" class="space-y-8">
              <div class="space-y-4 mt-4">
                <div class="h-10 w-full bg-neutral-200 mx-auto animate-pulse rounded-xl" v-for="_i in 5" />
              </div>
            </div>
            <div v-else class="flex flex-col gap-4">
              <!-- Desktop Table -->
                <div class="hidden w-full sm:block sm:mx-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead class="text-neutral-500 font-light py-4 w-1/5">Date</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light w-1/5">Share</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light w-1/5">Price</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light w-1/5">Total Cost</TableHead>
                        <TableHead class="text-right pr-8 text-neutral-500 font-light w-1/5">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow
                        v-for="transaction in transactions"
                        :key="transaction.id"
                      >
                        <TableCell class="py-4 text-gray-500">{{ transaction.date }}</TableCell>
                        <TableCell class="text-right">{{
                          transaction.share
                        }}</TableCell>
                        <TableCell class="font-medium text-right">
                          <span>
                            {{transaction.price}}
                          </span>
                        </TableCell>
                        <TableCell class="text-right">
                          <span>{{ transaction.price * transaction.share }}</span>
                        </TableCell>
                        <TableCell>
                          <div class="flex items-center justify-end gap-2">
                            <Button variant="outline" size="icon">
                              <Pencil />
                            </Button>
                            <Button variant="outline" size="icon">
                              <Trash />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
    
    
              <!-- Mobile Cards -->
              <div class="block sm:hidden space-y-4">
                <Card 
                  v-for="transaction in transactions"
                  :key="transaction.id"
                  class="p-4"
                >
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <div class="flex flex-col gap-1">
                        <span class="text-lg font-bold text-indigo-600">
                          {{ transaction.symbol }}
                        </span>
                        <span class="text-sm text-gray-400">{{ transaction.date }}</span>
                      </div>
                      <div class="flex flex-col items-end gap-1.5">
                        <div class="font-semibold">{{ (transaction.price * transaction.share).toFixed(2) }}</div>
                        <div class="flex items-center gap-1 text-sm text-gray-400">
                          <span>{{ transaction.price.toFixed(2) }}</span>
                          <span>x</span>
                          <span>{{ transaction.share }}</span>
                          <span class="">shares</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="sell" class="flex flex-col gap-4 mt-4">
            <div v-if="isSellLoading" class="space-y-8">
              <div class="space-y-4 mt-4">
                <div class="h-10 w-full bg-neutral-200 mx-auto animate-pulse rounded-xl" v-for="_i in 5" />
              </div>
            </div>
            <div v-else class="flex flex-col gap-4">
              <!-- Desktop Table -->
                <div class="hidden w-full sm:block sm:mx-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead class="text-neutral-500 font-light py-4">Date</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light">Profit %</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light">Profit</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light">Price</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light">Cost</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light">Share</TableHead>
                        <TableHead class="text-right pr-8 text-neutral-500 font-light">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow
                        v-for="transaction in sellTransactions"
                        :key="transaction.id"
                      >
                        <TableCell class="py-4 text-gray-500">{{ transaction.date }}</TableCell>
                        <TableCell 
                          class="text-right" 
                          :class="{
                            'text-rose-600': transaction.profitPercentage < 0,
                            'text-green-500': transaction.profitPercentage > 0,
                          }"
                        >
                          <div>
                            <span class="mr-0.5">{{ transaction.profitPercentage > 0 ? '+' :
                            transaction.profitPercentage < 0 ? '-' : '' }}</span>
                            <span>{{ transaction.profitPercentage.toFixed(2) }} %</span>
                          </div>
                        </TableCell>
                        <TableCell 
                          class="text-right"
                          :class="{
                            'text-rose-600': transaction.profit < 0,
                            'text-green-500': transaction.profit > 0,
                          }"
                        >
                          <div>
                            <span class="mr-0.5">{{ transaction.profit > 0 ? '+' :
                            transaction.profit < 0 ? '-' : '' }}</span>
                            <span>{{ transaction.profit.toFixed(2) }}</span>
                          </div>
                        </TableCell>
                        <TableCell class="text-right">
                          <span>{{ transaction.price}}</span>
                        </TableCell>
                        <TableCell class="text-right">
                          <span>
                            {{transaction.costBasis}}
                          </span>
                        </TableCell>
                        <TableCell class="text-right">{{ transaction.share }}</TableCell>
                        <TableCell>
                          <div class="flex items-center justify-end gap-2">
                            <Button variant="outline" size="icon">
                              <Pencil />
                            </Button>
                            <Button variant="outline" size="icon">
                              <Trash />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
    
    
              <!-- Mobile Cards -->
              <div class="block sm:hidden space-y-4">
                <Card 
                  v-for="transaction in transactions"
                  :key="transaction.id"
                  class="p-4"
                >
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <div class="flex flex-col gap-1">
                        <span class="text-lg font-bold text-indigo-600">
                          {{ transaction.symbol }}
                        </span>
                        <span class="text-sm text-gray-400">{{ transaction.date }}</span>
                      </div>
                      <div class="flex flex-col items-end gap-1.5">
                        <div class="font-semibold">{{ (transaction.price * transaction.share).toFixed(2) }}</div>
                        <div class="flex items-center gap-1 text-sm text-gray-400">
                          <span>{{ transaction.price.toFixed(2) }}</span>
                          <span>x</span>
                          <span>{{ transaction.share }}</span>
                          <span class="">shares</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>
</template>


