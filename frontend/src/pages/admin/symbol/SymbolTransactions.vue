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
import FormattedNumber from '@/components/FormattedNumber.vue';
import { fetchStockInfo } from '@/api/stock';
import { useSidebar } from '@/components/ui/sidebar/utils';

type Status = "realized" | "unrealized";
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
const { state } = useSidebar();

const symbol = ref<string>(route.params.symbol as string);
const transactions = ref<Transaction[]>([]);
const sellTransactions = ref<SellTransaction[]>([]);
const selectedStatus = ref<Status>("unrealized");
const totalProfitPercentage = ref(0);
const totalProfit = ref(0);
const totalShares = ref(0);
const totalCost = ref(0);
const info = ref({
  name: '',
  currentPrice: 0,
  timestamp: Date.now(),
});
const dateFormat = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});
const isBuyLoading = ref(false);
const isSellLoading = ref(false);
const isInfoLoading = ref(false);

async function handleDisplayTransactions (status: Status) { 
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if(status === 'unrealized') {
    try {
      isBuyLoading.value = true;
  
      const res = await callEdgeFunction<{
        transactions: Transaction[];
      }>({
        name: 'unrealized-stock-read',
        body: {
          userId: session?.user?.id || "",
          symbol: symbol.value,
        },
      });
      console.log("res", res);

      if(res.data) {
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
  } else {
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
        name: 'realized-stock-read',
        body: {
          userId: session?.user?.id || "",
          symbol: symbol.value,
        },
      });
      console.log("res", res);

      if(res.data) {
        const hasData = res.data.transactions && res.data.transactions.length > 0;
        sellTransactions.value = hasData ? res.data.transactions : [];
        const { profit, totalCost } = hasData ? sellTransactions.value.reduce((acc, item) => {
          acc.profit += item.profit;
          acc.totalCost += item.costBasis;
          return acc;
        }, { profit: 0, totalCost: 0 }) : { profit: 0, totalCost: 0 };
        totalProfit.value = profit;
        totalProfitPercentage.value = hasData ? (profit / totalCost) * 100 : 0;
      }
    } catch (error) {
      console.log("error", error);
    } finally {
      isSellLoading.value = false;
    }
  }
};

async function handleFetchInfo() {
  try {
    isInfoLoading.value = true;
    const res = await fetchStockInfo(symbol.value);
    console.log("fetchStockInfo", res);
    if (res.statusCode === 200 && res.data && res.data.length > 0) {
      info.value.currentPrice = res.data[0]['6'];
      info.value.timestamp = res.data[0]['200007'];
      info.value.name = res.data[0]['200009'];
    }
  } catch (error) {
    console.log("handleFetchInfo error", error);
  } finally {
    isInfoLoading.value = false;
  }
}

watch(selectedStatus, async (newStatus: Status) => {
  await handleDisplayTransactions(newStatus);
}, { immediate: true });

onMounted(async () => {
  await handleFetchInfo();
});
</script>

<template>
  <div class="lg:px-12 space-y-4 sm:space-y-6">
    <header class="flex flex-col gap-2">
      <router-link to="/admin/overview" class="hidden sm:block w-fit">
        <Button variant="ghost" size="sm" class="flex w-fit bg-transparent cursor-pointer">
          <ChevronLeft :size="24" />
          Back
        </Button>
      </router-link>
      <div class="flex items-end justify-between">
        <div v-if="isInfoLoading">
          <div class="flex flex-col gap-2 sm:flex-row-reverse sm:items-end">
            <Skeleton class="w-24 h-9" />
            <Skeleton class="w-48 h-9" />
          </div>
        </div>
        <div v-else class="grow pr-4 max-w-60 sm:max-w-2/3">
          <h1 class="text-2xl text-neutral-500 leading-6">{{ symbol }}</h1>
          <h2 class="text-[28px] text-neutral-700 font-medium truncate md:whitespace-normal md:overflow-visible md:break-all">{{ info.name }}</h2>
        </div>
        <div v-if="isInfoLoading">
          <Skeleton class="w-32 h-9" />
        </div>
        <div v-else class="shrink-0">
          <div class="hidden space-y-0.5 sm:block">
            <span class="text-sm text-muted-foreground font-light">Close Price: <span class="font-medium text-neutral-600">{{ info.currentPrice }}</span></span>
          </div>
          <div class="text-sm text-muted-foreground font-light text-right leading-4">{{ dateFormat.format(new Date(info.timestamp * 1000)) }}</div>
        </div>
      </div>
    </header>
    
    <div 
      v-if="selectedStatus === 'unrealized'" 
      class="grid grid-cols-1 lg:grid-cols-2 gap-4" 
      :class="[ state === 'expanded' ? 'md:grid-cols-1' : 'md:grid-cols-2' ]"
    >
      <div class="grid grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <div class="text-sm text-muted-foreground text-center mb-1">Profit %</div>
            <div v-if="isBuyLoading" class="flex justify-center items-center">
              <Loader2 class="animate-spin text-neutral-400" />
            </div>
            <FormattedNumber
              v-else
              type="percentage"
              align="center"
              :value="totalProfitPercentage"
              :useColor="true"
              :useInCard="true"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div class="text-sm text-muted-foreground text-center mb-1">Profit</div>
            <div v-if="isBuyLoading" class="flex justify-center items-center">
              <Loader2 class="animate-spin text-neutral-400" />
            </div>
            <FormattedNumber
              v-else
              type="decimal"
              align="center"
              :value="totalProfit"
              :useColor="true"
              :useInCard="true"
            />
          </CardContent>
        </Card>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <Card class="sm:hidden">
          <CardContent>
            <div class="text-sm text-muted-foreground text-center mb-1">Closing Price</div>
            <div v-if="isBuyLoading" class="flex justify-center items-center">
              <Loader2 class="animate-spin text-neutral-400" />
            </div>
            <FormattedNumber
              v-else
              type="decimal"
              align="center"
              :value="info.currentPrice"
              :useInCard="true"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div class="text-sm text-muted-foreground text-center mb-1">Average Cost</div>
            <div v-if="isBuyLoading" class="flex justify-center items-center">
              <Loader2 class="animate-spin text-neutral-400" />
            </div>
            <FormattedNumber
              v-else
              type="decimal"
              align="center"
              :value="totalCost / totalShares"
              :useInCard="true"
            />
          </CardContent>
        </Card>
        <Card class="hidden sm:flex">
          <CardContent>
            <div class="text-sm text-muted-foreground text-center mb-1">Total Shares</div>
            <div v-if="isBuyLoading" class="flex justify-center items-center">
              <Loader2 class="animate-spin text-neutral-400" />
            </div>
            <FormattedNumber
              v-else
              type="decimal"
              align="center"
              :value="totalShares"
              :useInCard="true"
            />
          </CardContent>
        </Card>
      </div>
      <Card class="sm:hidden">
        <CardContent>
          <div class="text-sm text-muted-foreground text-center mb-1">Total Shares</div>
          <div v-if="isBuyLoading" class="flex justify-center items-center">
            <Loader2 class="animate-spin text-neutral-400" />
          </div>
          <FormattedNumber
            v-else
            type="decimal"
            align="center"
            :value="totalShares"
            :useInCard="true"
          />
        </CardContent>
      </Card>
    </div>

    <div v-else class="grid grid-cols-2 gap-4">
      <Card>
        <CardContent>
          <div class="text-sm text-muted-foreground text-center mb-1">Profit %</div>
          <div v-if="isSellLoading" class="flex justify-center items-center">
            <Loader2 class="animate-spin text-neutral-400" />
          </div>
          <FormattedNumber
            v-else
            type="percentage"
            align="center"
            :value="totalProfitPercentage"
            :useColor="true"
            :useInCard="true"
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <div class="flex justify-center items-center gap-1 text-sm text-muted-foreground mb-1">
            <span>Profit</span>
            <span class="text-xs">(USD)</span>
          </div>
          <div v-if="isSellLoading" class="flex justify-center items-center">
            <Loader2 class="animate-spin text-neutral-400" />
          </div>
          <FormattedNumber
            v-else
            type="decimal"
            align="center"
            :value="totalProfit"
            :useColor="true"
            :useInCard="true"
          />
        </CardContent>
      </Card>
    </div>

    <Card class="-mx-4 rounded-none sm:mx-0 sm:rounded-xl pb-0">
      <CardContent>
        <Tabs v-model="selectedStatus">
          <TabsList class="w-full rounded-none bg-transparent">
            <TabsTrigger value="unrealized" class="cursor-pointer py-6 rounded-none border-0 w-1/2 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 data-[state=active]:border-b-[1.5px] data-[state=active]:border-indigo-500 data-[state=inactive]:border-b-[1.5px] data-[state=inactive]:border-neutral-300 data-[state=inactive]:text-neutral-500 font-medium">
              <div class="text-base sm:hidden">Unrealized</div>
              <div class="text-wrap hidden sm:text-base sm:block">Unrealized Transactions</div>
            </TabsTrigger>
            <TabsTrigger value="realized" class="cursor-pointer py-6 rounded-none border-0 w-1/2 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-indigo-500 data-[state=active]:border-b-[1.5px] data-[state=active]:border-indigo-500 data-[state=inactive]:border-b-[1.5px] data-[state=inactive]:border-neutral-300 data-[state=inactive]:text-neutral-500">
              <div class="text-base sm:hidden">Realized</div>
              <div class="text-wrap hidden sm:text-base sm:block">Realized Transactions</div>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="unrealized" class="mt-6">
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
              <div class="block sm:hidden">
                <div 
                  v-for="transaction in transactions"
                  :key="transaction.id"
                  class="border-b px-4 py-6 first:pt-0 last:border-b-0"
                >
                  <div class="space-y-2.5">                   
                    <div class="flex justify-between items-center text-sm">
                      <div class="font-medium text-neutral-700">{{ transaction.date }}</div>
                      <div class="-mr-2">
                        <FormattedNumber
                          type="percentage"
                          class="font-medium rounded-full px-2 py-0.5"
                          :class="{
                              'text-rose-600 bg-rose-100': (info.currentPrice - transaction.price) / transaction.price * 100 < 0,
                              'text-green-600 bg-green-100': (info.currentPrice - transaction.price) / transaction.price * 100 > 0,
                              'text-neutral-800 bg-neutral-200': (info.currentPrice - transaction.price) / transaction.price * 100 === 0,
                            }"
                            :value="(info.currentPrice - transaction.price) / transaction.price * 100"
                            :useColor="true"
                        />
                      </div>
                    </div>

                    <div class="flex justify-between items-center text-sm">
                      <div class="text-neutral-500">Profit</div>
                      <FormattedNumber
                        type="decimal"
                        :class="{
                          'text-rose-600': (info.currentPrice - transaction.price) * transaction.share < 0,
                          'text-green-600': (info.currentPrice - transaction.price) * transaction.share > 0,
                          'text-neutral-600': (info.currentPrice - transaction.price) * transaction.share === 0,
                        }"
                        :value="(info.currentPrice - transaction.price) * transaction.share"
                        :useColor="true"
                      /> 
                    </div>

                    <div class="flex justify-between items-center text-sm">
                      <div class="text-neutral-500">Buy Price</div>
                      <FormattedNumber
                        type="decimal"
                        :value="transaction.price"
                      />
                    </div>

                    <div class="flex justify-between items-center text-sm">
                      <div class="text-neutral-500">Shares</div>
                      <FormattedNumber
                        type="decimal"
                        :value="transaction.share"
                      />
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="realized" class="flex flex-col gap-4 mt-4">
            <div v-if="isSellLoading" class="space-y-8">
              <div class="space-y-4 mt-4">
                <div class="h-10 w-full bg-neutral-200 mx-auto animate-pulse rounded-xl" v-for="_i in 5" />
              </div>
            </div>
            <div v-else-if="sellTransactions.length > 0" class="flex flex-col gap-4">
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
                  v-for="transaction in sellTransactions"
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
            <div v-else>
              <div class="flex flex-col items-center justify-center h-full">
                <p class="text-sm text-neutral-400">No realized transactions</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>
</template>


