<script setup lang="ts">
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Plus, Loader2, ArrowDown, ArrowUp } from "lucide-vue-next";
import { callEdgeFunction } from "@/lib/helper";
import { supabase } from "@/lib/supabase";
import { computed, onMounted, ref } from "vue";
import { toast } from "vue-sonner";

type Side = "buy" | "sell";
type Transaction = {
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
  gainAmount: number;
  gainPercentage: number;
  breakdown: {
    buyDate: string;
    quantity: number;
    buyPrice: number;
  }[];
};

const transactions = ref<Transaction[]>([]);
const isTransactionLoading = ref(false);
const selectedSide = ref<Side>("buy");
const totalGain = ref(0);
const totalCost = ref(0);
const totalGainPercentage = computed(() => {
  return (totalGain.value / totalCost.value) * 100;
});
async function fetchTransactions(side: Side) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await callEdgeFunction<Transaction[]>({
    name: `transaction-read-${side}`,
    body: {
      userId: session?.user?.id || ""
    },
  });

  if (error) toast.error("Error fetching transactions");
  return { data, error };
}

async function handleDisplayTransactions(side: Side) {
  isTransactionLoading.value = true;
  const { data } = await fetchTransactions(side);
  console.log("data", data);
  if (data) {
    transactions.value = data;
    totalCost.value = transactions.value.reduce(
      (acc, item) => acc + item.price,
      0
    );
    totalGain.value = transactions.value.reduce(
      (acc, item) => acc + item.gainAmount,
      0
    );
  }

  isTransactionLoading.value = false;
}

onMounted(async () => {
  await handleDisplayTransactions(selectedSide.value);
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-end items-center">
      <RouterLink
        to="/admin/transactions/add"
        class="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Plus :size="14" />
        New Transaction
      </RouterLink>
    </div>
    <div class="space-y-6">
      <Tabs
        v-model="selectedSide"
        @update:model-value="(side) => handleDisplayTransactions(side as Side)"
      >
        <TabsList class="w-full md:w-1/2 mx-auto mb-5">
          <TabsTrigger value="buy">Buy</TabsTrigger>
          <TabsTrigger value="sell">Sell</TabsTrigger>
        </TabsList>
        <!-- buy tab -->
        <TabsContent value="buy" class="flex flex-col gap-4">
          <div v-if="isTransactionLoading">
            <div class="flex items-center justify-center">
              <Loader2 class="animate-spin" />
            </div>
          </div>
          <Card v-else class="w-full md:w-1/2 mx-auto">
            <CardContent>
              <div class="text-sm text-muted-foreground text-center">
                Total Cost
              </div>
              <div class="flex items-end justify-center gap-2">
                <span class="text-2xl font-bold">${{ totalCost }}</span>
                <span class="text-sm text-muted-foreground mb-1 font-medium"
                  >USD</span
                >
              </div>
            </CardContent>
          </Card>

          <!-- Desktop Table -->
          <Table class="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead class="py-4">Date</TableHead>
                <TableHead>Ticker</TableHead>
                <TableHead class="text-right">Share</TableHead>
                <TableHead class="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="transaction in transactions"
                :key="transaction.id"
              >
                <TableCell class="py-4">{{ transaction.date }}</TableCell>
                <TableCell class="font-medium">{{
                  transaction.symbol
                }}</TableCell>
                <TableCell class="text-right">{{
                  transaction.share
                }}</TableCell>
                <TableCell class="text-right"
                  >{{ transaction.price }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <!-- Mobile Cards -->
          <div class="block md:hidden space-y-4">
            <Card 
              v-for="transaction in transactions"
              :key="transaction.id"
              class="p-4"
            >
              <div class="space-y-3">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="font-medium text-lg">{{ transaction.symbol }}</div>
                    <div class="text-sm text-muted-foreground">{{ transaction.date }}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-semibold">${{ transaction.price }}</div>
                    <div class="text-sm text-muted-foreground">Cost</div>
                  </div>
                </div>
                <div class="pt-2 border-t">
                  <div class="flex justify-between">
                    <span class="text-sm text-muted-foreground">Shares</span>
                    <span class="font-medium">{{ transaction.share }}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <!-- sell tab -->
        <TabsContent value="sell">
          <div v-if="isTransactionLoading">
            <div class="flex items-center justify-center">
              <Loader2 class="animate-spin" />
            </div>
          </div>
          <div v-else class="flex flex-col gap-4">
            <div class="grid grid-cols-2 gap-4">
              <Card>
                <CardContent>
                  <div class="text-sm text-muted-foreground text-center">
                    Total {{ totalGain >= 0 ? "Gain" : "Loss" }} (USD)
                  </div>
                  <div class="flex items-end justify-center gap-2">
                  <span 
                    class="text-2xl font-bold" 
                    :class="{
                      'text-green-500': totalGain > 0,
                      'text-red-500': totalGain < 0,
                      'text-neutral-600': totalGain === 0,
                    }"
                  >
                    {{ totalGain >= 0 ? "+" : "-" }} ${{ Math.abs(totalGain) }}
                  </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent class="h-full grid place-items-center">
                  <div>
                    <div class="text-sm text-muted-foreground text-center">ROI</div>
                      <div class="flex items-end justify-center gap-2">
                        <span class="text-2xl font-bold" :class="{
                          'text-red-500': totalGainPercentage < 0,
                          'text-green-500': totalGainPercentage > 0,
                        }">{{ totalGainPercentage.toFixed(2) }} %</span>
                      </div>
                  </div>
                </CardContent>
              </Card>
            </div>
  
            <!-- Desktop Table -->
            <Table class="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead class="p-4">Date</TableHead>
                  <TableHead>Ticker</TableHead>
                  <TableHead class="text-right">ROI</TableHead>
                  <TableHead class="text-right">Gain/Loss</TableHead>
                  <TableHead class="text-right">Share</TableHead>
                  <TableHead class="text-right text-wrap">Settlement Amount</TableHead>
                  <TableHead class="p-4 text-right">Cost Basis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="transaction in transactions"
                  :key="transaction.id"
                >
                  <TableCell class="p-4">{{ transaction.date }}</TableCell>
                  <TableCell class="font-medium py-4">
                    <span class="bg-indigo-100 px-2 py-1 rounded-full text-xs">
                      {{transaction.symbol}}
                    </span>
                  </TableCell>
                  <TableCell
                    :class="{
                      'text-red-500': transaction.gainPercentage < 0,
                      'text-green-500': transaction.gainPercentage > 0,
                    }"
                    class="text-right"
                    >{{ transaction.gainPercentage?.toFixed(2) }} %</TableCell
                  >
                  <TableCell
                    :class="{
                      'text-red-500': transaction.gainAmount < 0,
                      'text-green-500': transaction.gainAmount > 0,
                    }"
                    class="text-right"
                    >{{ transaction.gainAmount?.toFixed(2) }}
                  </TableCell>
                  <TableCell class="text-right">{{
                    transaction.share
                  }}</TableCell>
                  <TableCell class="text-right">{{
                    transaction.price * transaction.share
                  }}</TableCell>
                  <TableCell class="text-right p-4">{{
                    transaction.costBasis
                  }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
  
            <!-- Mobile Cards -->
            <div class="block md:hidden space-y-4">
              <Card 
                v-for="transaction in transactions"
                :key="transaction.id"
                class="p-4 shadow-none border-none"
              >
                <div class="space-y-3">
                  <div class="flex justify-between items-end">
                    <div>
                      <div class="text-xs text-neutral-600 mb-2">{{ transaction.date }}</div>
                      <span class="bg-indigo-500 text-neutral-100 px-2 py-1 rounded-full text-xs font-medium">
                        {{ transaction.symbol }}
                      </span>
                    </div>
                    <div 
                      class="flex items-center gap-1 font-medium text-sm rounded-full px-2 py-0.5"
                      :class="{
                        'text-rose-600 bg-rose-100': transaction.gainPercentage < 0,
                        'text-green-600 bg-green-100': transaction.gainPercentage > 0,
                      }"
                    >
                      <ArrowUp v-if="transaction.gainPercentage >= 0" :size="14" stroke-width="3" /> 
                      <ArrowDown v-else :size="14" stroke-width="3" /> 
                      {{ Math.abs(transaction.gainPercentage).toFixed(2) }} %
                    </div>
                  </div>
                  
                  <div class="flex justify-between items-center border-t pt-3">
                    <div class="text-sm text-muted-foreground">
                      {{ transaction.gainAmount >= 0 ? "Gain" : "Loss" }}
                    </div>
                    <div 
                      class="text-sm"
                      :class="{
                        'text-rose-600': transaction.gainAmount < 0,
                        'text-green-600': transaction.gainAmount > 0,
                      }"
                    >
                      <span class="mr-0.5">$</span>
                      <span>
                        {{ Math.abs(transaction.gainAmount).toFixed(2) }}
                      </span>
                    </div>
                  </div>

                  <div class="flex justify-between items-center border-t pt-3">
                      <div class="text-sm text-muted-foreground">Shares</div>
                      <div class=" text-sm">{{ transaction.share }}</div>
                  </div>
                  
                  <div class="flex justify-between items-center border-t pt-3">
                    <div class="text-sm text-muted-foreground">Settlement</div>
                      <div class=" text-sm">
                        ${{ (transaction.price * transaction.share).toFixed(2) }}
                      </div>
                  </div>
  
                  <div class="flex justify-between items-center border-t pt-3">
                    <div class="text-sm text-muted-foreground">Cost Basis</div>
                    <div class=" text-sm">${{ transaction.costBasis.toFixed(2) }}</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
