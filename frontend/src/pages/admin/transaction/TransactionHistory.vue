<script setup lang="ts">
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Plus, ArrowDown, ArrowUp, Pencil, Trash } from "lucide-vue-next";
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
      (acc, item) => acc + item.price * item.share,
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
  <div>
    <div class="flex justify-end items-center sm:hidden mb-6">
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
        <TabsList class="w-full mx-auto mb-4 py-6 px-1.5 bg-neutral-100 sm:max-w-sm">
          <TabsTrigger value="buy" class="py-4.5 text-base">Buy</TabsTrigger>
          <TabsTrigger value="sell" class="py-4.5 text-base">Sell</TabsTrigger>
        </TabsList>
        <!-- buy tab -->
        <TabsContent value="buy" class="flex flex-col gap-4 ">
          <div v-if="isTransactionLoading" class="space-y-8">
            <Card class="w-full sm:w-1/2 mx-auto bg-neutral-100/80 animate-pulse border-none shadow-none">
              <CardContent>
                <div class="text-neutral-100">
                  skeleton
                </div>
                <span class="text-neutral-100">skeleton</span>
              </CardContent>
            </Card>
            <div class="space-y-4">
              <div class="h-10 w-full bg-neutral-50 max-w-xl mx-auto animate-pulse rounded-xl" v-for="_i in 5" />
            </div>
          </div>
          <div v-else class="flex flex-col gap-4">
            <!-- Desktop Table -->
             <div class="hidden sm:block sm:max-w-3xl w-full sm:mx-auto">
               <Card>
                 <CardContent>
                   <Table class="">
                     <TableHeader>
                       <TableRow>
                         <TableHead class="text-neutral-500 font-light py-4 w-1/5">Date</TableHead>
                         <TableHead class="text-center text-neutral-500 font-light w-1/5">Ticker</TableHead>
                         <TableHead class="text-right text-neutral-500 font-light w-1/5">Total Cost</TableHead>
                         <TableHead class="text-right text-neutral-500 font-light w-1/5">Share</TableHead>
                         <TableHead class="text-right pr-8 text-neutral-500 font-light w-1/5">Action</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       <TableRow
                         v-for="transaction in transactions"
                         :key="transaction.id"
                       >
                         <TableCell class="py-4 text-gray-500">{{ transaction.date }}</TableCell>
                         <TableCell class="font-medium text-center">
                           <span class="bg-indigo-100 px-2 py-1 rounded-full text-xs">
                             {{transaction.symbol}}
                           </span>
                         </TableCell>
                         <TableCell class="text-right">
                           <span>{{ transaction.price * transaction.share }}</span>
                         </TableCell>
                         <TableCell class="text-right">{{
                           transaction.share
                         }}</TableCell>
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
                 </CardContent>
               </Card>
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

        <!-- sell tab -->
        <TabsContent value="sell">
          <div v-if="isTransactionLoading" class="space-y-8">
            <div class="flex w-full gap-4 sm:max-w-lg sm:mx-auto">
              <Card class="w-full sm:w-1/2 mx-auto bg-neutral-100/80 animate-pulse border-none shadow-none">
                <CardContent>
                  <div class="text-neutral-100">
                    skeleton
                  </div>
                  <span class="text-neutral-100">skeleton</span>
                </CardContent>
              </Card>
              <Card class="w-full sm:w-1/2 mx-auto bg-neutral-100/80 animate-pulse border-none shadow-none">
                <CardContent>
                  <div class="text-neutral-100">
                    skeleton
                  </div>
                  <span class="text-neutral-100">skeleton</span>
                </CardContent>
              </Card>
            </div>
            <div class="space-y-4">
              <div class="h-10 w-full bg-neutral-50 max-w-4xl mx-auto animate-pulse rounded-xl" v-for="_i in 5" />
            </div>
          </div>
          <div v-else class="flex flex-col gap-6">
            <div class="flex w-full gap-4 sm:max-w-sm sm:mx-auto">
              <Card class="w-1/2">
                <CardContent>
                  <div class="text-sm text-muted-foreground text-center">
                    Total Profit (USD)
                  </div>
                  <div class="flex items-end justify-center gap-2">
                  <span 
                    class="text-2xl font-bold" 
                    :class="{
                      'text-green-500': totalGain > 0,
                      'text-rose-600': totalGain < 0,
                      'text-neutral-600': totalGain === 0,
                    }"
                  >
                    <span class="mr-0.5">{{ totalGain >= 0 ? "+" : "-" }}</span> 
                    <span>{{ Math.abs(totalGain) }}</span>
                  </span>
                  </div>
                </CardContent>
              </Card>
              <Card class="w-1/2">
                <CardContent class="h-full grid place-items-center">
                  <div>
                    <div class="text-sm text-muted-foreground text-center">ROI</div>
                      <div class="flex items-end justify-center gap-2">
                        <span class="text-2xl font-bold" :class="{
                          'text-rose-600': totalGainPercentage < 0,
                          'text-green-500': totalGainPercentage > 0,
                        }">
                          <span>{{ totalGainPercentage >= 0 ? "+" : "-" }}</span> 
                          <span class="mx-0.5">{{ Math.abs(totalGainPercentage).toFixed(2) }}</span>
                          <span>%</span>
                        </span>
                      </div>
                  </div>
                </CardContent>
              </Card>
            </div>
  
            <!-- Desktop Table -->
            <div class="hidden w-full mx-auto sm:max-w-5xl md:block">
              <Card>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead class="text-neutral-500 font-light p-4 w-1/7">Date</TableHead>
                        <TableHead class="text-center text-neutral-500 font-light w-1/7">Ticker</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light w-1/7">ROI</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light w-1/7">Profit</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light w-1/7">Settlement</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light w-1/7">Cost Basis</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light p-4 w-1/7 ">Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow
                        v-for="transaction in transactions"
                        :key="transaction.id"
                      >
                        <TableCell class="p-4 text-gray-500">{{ transaction.date }}</TableCell>
                        <TableCell class="font-medium py-4 text-center">
                          <span class="bg-indigo-100 px-2 py-1 rounded-full text-xs">
                            {{transaction.symbol}}
                          </span>
                        </TableCell>
                        <TableCell
                          :class="{
                            'text-rose-600': transaction.gainPercentage < 0,
                            'text-green-500': transaction.gainPercentage > 0,
                          }"
                          class="text-right"
                          >{{ transaction.gainPercentage?.toFixed(2) }} %</TableCell
                        >
                        <TableCell
                          :class="{
                            'text-rose-600': transaction.gainAmount < 0,
                            'text-green-500': transaction.gainAmount > 0,
                          }"
                          class="text-right"
                          >
                          <span>{{ transaction.gainAmount > 0 ? "+" : "" }}</span>
                          <span class="ml-0.5">{{ transaction.gainAmount.toFixed(2) }}</span>
                        </TableCell>
                        <TableCell class="text-right">
                          <span>{{ (transaction.price * transaction.share).toFixed(2) }}</span>
                        </TableCell>
                        <TableCell class="text-right">
                          <span>{{ transaction.costBasis.toFixed(2) }}</span>
                        </TableCell>
                        <TableCell class="text-right p-4">{{
                          transaction.share
                        }}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
  
            <!-- Mobile Cards -->
            <div class="block w-full space-y-4 sm:max-w-sm mx-auto md:hidden">
              <Card 
                v-for="transaction in transactions"
                :key="transaction.id"
                class="shadow-none border-none p-4"
              >
                <div class="space-y-3">
                  <div class="flex justify-between items-end">
                    <div>
                      <div class="text-xs text-neutral-600 mb-2">{{ transaction.date }}</div>
                      <span class="bg-indigo-500 text-neutral-100 px-2 py-1 rounded-md text-sm font-medium">
                        {{ transaction.symbol }}
                      </span>
                    </div>
                    <div 
                      class="flex items-center gap-1 font-medium text-sm rounded-full px-2 py-0.5"
                      :class="{
                        'text-rose-600 bg-rose-100': transaction.gainPercentage < 0,
                        'text-green-600 bg-green-100': transaction.gainPercentage > 0,
                        'text-neutral-800 bg-neutral-200': transaction.gainPercentage === 0,
                      }"
                    >
                      <ArrowUp v-if="transaction.gainPercentage > 0" :size="14" stroke-width="3" /> 
                      <ArrowDown v-else-if="transaction.gainPercentage < 0" :size="14" stroke-width="3" /> 
                      {{ Math.abs(transaction.gainPercentage).toFixed(2) }} %
                    </div>
                  </div>
                  
                  <div class="flex justify-between items-center border-t pt-3 px-2 text-sm">
                    <div class="text-neutral-500">
                      Profit
                    </div>
                    <div 
                      :class="{
                        'text-rose-600': transaction.gainAmount < 0,
                        'text-green-600': transaction.gainAmount > 0,
                      }"
                    >
                      <span class="mr-0.5">{{ 
                        transaction.gainAmount > 0 
                          ? "+" 
                          : transaction.gainAmount < 0
                            ? "-"
                            : "" 
                        }}
                      </span>
                      <span>
                        {{ Math.abs(transaction.gainAmount).toFixed(2) }}
                      </span>
                    </div>
                    </div>
                    
                  <div class="flex justify-between items-center border-t pt-3 px-2 text-sm">
                    <div class="text-neutral-500">Settlement</div>
                    <div>
                      <span>{{ (transaction.price * transaction.share).toFixed(2) }}</span>
                    </div>
                  </div>
  
                  <div class="flex justify-between items-center border-t pt-3 px-2 text-sm">
                    <div class="text-neutral-500">Cost Basis</div>
                    <div>
                      <span>{{ transaction.costBasis.toFixed(2) }}</span>
                    </div>
                  </div>

                  <div class="flex justify-between items-center border-t pt-3 px-2 text-sm">
                    <div class="text-neutral-500">Shares</div>
                    <div>{{ transaction.share }}</div>
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
