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
import { Plus, Pencil, Trash } from "lucide-vue-next";
import { callEdgeFunction } from "@/lib/helper";
import { supabase } from "@/lib/supabase";
import { onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import FormattedNumber from "@/components/FormattedNumber.vue";
import Symbol from "@/components/Symbol.vue";

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
const totalGainPercentage = ref(0);

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
    const { _totalGain, _totalCost } = transactions.value.reduce((acc, item) => {
      acc._totalGain += item.gainAmount;
      acc._totalCost += item.price * item.share;
      return acc;
    }, { _totalGain: 0, _totalCost: 0 });
    totalGain.value = _totalGain;
    totalGainPercentage.value = (_totalGain / _totalCost) * 100;
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead class="text-neutral-500 font-light py-4">Date</TableHead>
                        <TableHead class="text-neutral-500 font-light">Symbol</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light">Share</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light">Price</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light">Total Cost</TableHead>
                        <TableHead class="text-right pr-8 text-neutral-500 font-light">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow
                        v-for="transaction in transactions"
                        :key="transaction.id"
                      >
                        <TableCell class="py-6 text-gray-500">{{ transaction.date }}</TableCell>
                        <TableCell>
                          <Symbol :symbol="transaction.symbol" type="table" />
                        </TableCell>
                        <TableCell class="text-right">{{
                          transaction.share
                        }}</TableCell>
                        <TableCell class="text-right">{{
                          transaction.price
                        }}</TableCell>
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
                </CardContent>
              </Card>
            </div>
  
            <!-- Mobile Cards -->
            <div class="block sm:hidden space-y-4">
              <Card>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead class="text-neutral-500 font-light py-4">Symbol</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light">Share</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light w-[100px]">
                          <div>Price</div>
                          <div>Total Cost</div>
                        </TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow
                        v-for="transaction in transactions"
                        :key="transaction.id"
                      >
                        <TableCell class="py-4">
                          <div class="text-gray-500 text-xs font-light">{{ transaction.date }}</div>
                          <Symbol :symbol="transaction.symbol" type="table" />
                        </TableCell>
                        <TableCell>
                          <FormattedNumber
                            type="decimal"
                            :value="transaction.share"
                          />
                        </TableCell>
                        <TableCell>
                          <FormattedNumber
                            type="decimal"
                            :value="transaction.price"
                          />
                          <FormattedNumber
                            type="decimal"
                            :value="transaction.price * transaction.share"
                          />
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
                </CardContent>
              </Card>
              <!-- <Card 
                v-for="transaction in transactions"
                :key="transaction.id"
                class="p-4"
              >
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <div class="flex flex-col gap-1">
                      <Symbol :symbol="transaction.symbol" type="card" />
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
              </Card> -->
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
                <CardContent class="h-full grid place-items-center">
                  <div>
                    <div class="text-sm text-center text-muted-foreground mb-1">Profit %</div>
                    <div  class="flex justify-center items-center">
                      <FormattedNumber 
                        type="percentage"
                        :value="totalGainPercentage" 
                        :useInCard="true"  
                        :useColor="true"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card class="w-1/2">
                <CardContent>
                  <div class="flex justify-center items-center gap-1 text-sm text-muted-foreground mb-1">
                    <span>Total Profit</span>
                    <span class="text-xs">(USD)</span>
                  </div>
                  <div class="flex items-end justify-center gap-2">
                    <FormattedNumber 
                      type="decimal"
                      :value="totalGain" 
                      :useInCard="true"  
                      :useColor="true"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
  
            <!-- Desktop Table -->
            <div class="hidden w-full mx-auto sm:max-w-5xl sm:block">
              <Card>
                <CardContent>
                  <Table class="table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead class="text-neutral-500 font-light py-4">Date</TableHead>
                        <TableHead class="text-neutral-500 font-light">Symbol</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light">Profit</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light">Share</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light">Settlement</TableHead>
                        <TableHead class="text-right text-neutral-500 font-light">Cost Basis</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow
                        v-for="transaction in transactions"
                        :key="transaction.id"
                      >
                        <TableCell class="py-6 text-gray-500">{{ transaction.date }}</TableCell>
                        <TableCell>
                          <Symbol :symbol="transaction.symbol" type="table" />
                        </TableCell>
                        <TableCell>
                          <FormattedNumber
                            type="decimal"
                            :value="transaction.gainAmount"
                            :useColor="true"
                            :useSign="true"
                          />
                          <FormattedNumber
                            type="percentage"
                            :value="transaction.gainPercentage"
                            :useColor="true"
                            :useSign="true"
                            :useParentheses="true"
                          />
                        </TableCell>
                        <TableCell>
                          <FormattedNumber
                            type="decimal"
                            :value="transaction.share"
                          />
                        </TableCell>
                        <TableCell>
                          <FormattedNumber
                            type="decimal"
                            :value="transaction.price * transaction.share"
                          />
                        </TableCell>
                        <TableCell>
                          <FormattedNumber
                            type="decimal"
                            :value="transaction.costBasis"
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
  
            <!-- Mobile Cards -->
            <div class="block w-full space-y-4 sm:hidden">
              <Card>
                <CardContent>
                  <div class="overflow-x-auto">
                    <Table class="table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead class="text-left text-neutral-500 font-light py-4">Symbol</TableHead>
                          <TableHead class="text-right text-neutral-500 font-light w-[200px]">Profit</TableHead>
                          <TableHead class="text-right text-neutral-500 font-light w-[80px]">Share</TableHead>
                          <TableHead class="text-right text-neutral-500 font-light w-[100px]">
                            <div>Settlement</div>
                            <div>Cost Basis</div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow
                          v-for="transaction in transactions"
                          :key="transaction.id"
                        >
                          <TableCell>
                            <div class="text-gray-500 text-xs font-light">{{ transaction.date }}</div>
                            <Symbol :symbol="transaction.symbol" type="card" />
                          </TableCell>
                          <TableCell>
                            <FormattedNumber
                              type="decimal"
                              :value="transaction.gainAmount"
                              :useColor="true"
                              :useSign="true"
                            />
                            <FormattedNumber
                              type="percentage"
                              :value="transaction.gainPercentage"
                              :useColor="true"
                              :useSign="true"
                              :useParentheses="true"
                            />
                          </TableCell>
                          <TableCell>
                            <FormattedNumber
                              type="decimal"
                              :value="transaction.share"
                            />
                          </TableCell>
                          <TableCell>
                            <FormattedNumber
                              type="decimal"
                              :value="transaction.price * transaction.share"
                            />
                            <FormattedNumber
                              type="decimal"
                              :value="transaction.costBasis"
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>             
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
