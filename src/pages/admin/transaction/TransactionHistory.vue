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
</script>

<template>
  <div class="flex justify-end items-center px-6">
    <RouterLink
      to="/admin/transactions/add"
      class="text-sm text-muted-foreground"
    >
      Add Trade
    </RouterLink>
  </div>
  <div class="p-6 space-y-6">
    <Tabs defaultValue="buy">
      <TabsList class="w-full md:w-1/2 mx-auto">
        <TabsTrigger value="buy">Buy</TabsTrigger>
        <TabsTrigger value="sell">Sell</TabsTrigger>
      </TabsList>
      <TabsContent value="buy" class="flex flex-col gap-4 py-4">
        <Card class="w-full md:w-1/2 mx-auto">
          <CardContent>
            <div class="text-sm text-muted-foreground text-center">
              Total Cost
            </div>
            <div class="flex items-end justify-center gap-2">
              <span class="text-2xl font-bold">$100</span>
              <span class="text-sm text-muted-foreground mb-1 font-medium"
                >USD</span
              >
            </div>
          </CardContent>
        </Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>ROI</TableHead>
              <TableHead>Gain/Loss</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Avg Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="font-medium">AAPL</TableCell>
              <TableCell>10%</TableCell>
              <TableCell>200</TableCell>
              <TableCell>3000</TableCell>
              <TableCell>150</TableCell>
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
              <TableHead>Ticker</TableHead>
              <TableHead>ROI</TableHead>
              <TableHead>Gain/Loss</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Avg Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="font-medium">AAPL</TableCell>
              <TableCell>10%</TableCell>
              <TableCell>200</TableCell>
              <TableCell>3000</TableCell>
              <TableCell>150</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  </div>
</template>
