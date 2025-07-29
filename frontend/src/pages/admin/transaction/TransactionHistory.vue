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
import { Plus, Loader2 } from "lucide-vue-next";
import { callEdgeFunction } from "@/lib/helper";
import { supabase } from "@/lib/supabase";
import { onMounted, ref } from "vue";
import { toast } from "vue-sonner";

type Side = "buy" | "sell";
type Transaction = {
  id: string;
  symbol: string;
  cost: number;
  closing_price: number;
  share: number;
  side: Side;
  currency: "USD" | "TWD";
  exchange_rate: number;
  date: string;
  created_at: string;
};

const transactions = ref<any[]>([]);
const totalCost = ref(0);
const isTransactionLoading = ref(false);
const selectedSide = ref<Side>("buy");

async function fetchTransactions(side: Side) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await callEdgeFunction<Transaction[]>({
    name: "transaction-read",
    body: {
      userId: session?.user?.id || "",
      side,
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
    transactions.value =
      data?.map((item) => {
        return {
          ...item,
          roi: (((item.closing_price - item.cost) / item.cost) * 100).toFixed(
            2
          ),
          gain_loss: ((item.closing_price - item.cost) * item.share).toFixed(2),
          value: (item.closing_price * item.share).toFixed(2),
        };
      }) ?? [];

    totalCost.value = transactions.value.reduce(
      (acc, item) => acc + item.cost,
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
        <TabsList class="w-full md:w-1/2 mx-auto">
          <TabsTrigger value="buy">Buy</TabsTrigger>
          <TabsTrigger value="sell">Sell</TabsTrigger>
        </TabsList>
        <TabsContent value="buy" class="flex flex-col gap-4 py-4">
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="py-4">Date</TableHead>
                <TableHead>Ticker</TableHead>
                <TableHead class="text-right">ROI</TableHead>
                <TableHead class="text-right">Gain / Loss</TableHead>
                <TableHead class="text-right">Share</TableHead>
                <TableHead class="text-right">Cost</TableHead>
                <TableHead class="text-right">Closing Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="transaction in transactions"
                :key="transaction.id"
              >
                <TableCell>{{ transaction.date }}</TableCell>
                <TableCell class="font-medium py-4">{{
                  transaction.symbol
                }}</TableCell>
                <TableCell
                  :class="{
                    'text-red-500': transaction.roi < 0,
                    'text-green-500': transaction.roi > 0,
                  }"
                  class="text-right"
                  >{{ transaction.roi }} %</TableCell
                >
                <TableCell
                  :class="{
                    'text-red-500': transaction.gain_loss < 0,
                    'text-green-500': transaction.gain_loss > 0,
                  }"
                  class="text-right"
                  >{{ transaction.gain_loss }}
                </TableCell>
                <TableCell class="text-right">{{
                  transaction.share
                }}</TableCell>
                <TableCell class="text-right"
                  >{{ transaction.cost }}
                </TableCell>
                <TableCell class="text-right"
                  >{{ transaction.closing_price }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="sell" class="flex flex-col gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <Card>
              <CardContent>
                <div class="text-sm text-muted-foreground text-center">
                  Gain / Loss
                </div>
                <div class="flex items-end justify-center gap-2">
                  <span class="text-2xl font-bold">$100</span>
                  <span class="text-sm text-muted-foreground mb-1 font-medium"
                    >USD</span
                  >
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div class="text-sm text-muted-foreground text-center">ROI</div>
                <div class="flex items-end justify-center gap-2">
                  <span class="text-2xl font-bold">20%</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Ticker</TableHead>
                <TableHead class="text-right">ROI</TableHead>
                <TableHead class="text-right">Gain/Loss</TableHead>
                <TableHead class="text-right">Share</TableHead>
                <TableHead class="text-right">Total Cost</TableHead>
                <TableHead class="text-right">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="transaction in transactions"
                :key="transaction.id"
              >
                <TableCell>{{ transaction.date }}</TableCell>
                <TableCell class="font-medium">{{
                  transaction.symbol
                }}</TableCell>
                <TableCell
                  :class="{
                    'text-red-500': transaction.roi < 0,
                    'text-green-500': transaction.roi > 0,
                  }"
                  class="text-right"
                  >{{ transaction.roi }} %</TableCell
                >
                <TableCell
                  :class="{
                    'text-red-500': transaction.gain_loss < 0,
                    'text-green-500': transaction.gain_loss > 0,
                  }"
                  class="text-right"
                  >{{ transaction.gain_loss }}
                </TableCell>
                <TableCell class="text-right">{{
                  transaction.share
                }}</TableCell>
                <TableCell class="text-right"
                  >{{ transaction.totalCost }}
                </TableCell>
                <TableCell class="text-right">{{
                  transaction.value
                }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
