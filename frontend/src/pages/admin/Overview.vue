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
import { TrendingUp } from "lucide-vue-next";
import PieChart from "@/components/PieChart.vue";
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent>
          <div class="text-sm text-muted-foreground text-center">
            Total Value
          </div>
          <div class="text-xl font-medium text-center">$100,000</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <div class="text-sm text-muted-foreground text-center">
            Total Gain/Loss
          </div>
          <div class="text-xl font-medium text-center">+$5,000</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <div class="text-sm text-muted-foreground text-center">Change %</div>
          <div class="text-xl font-medium text-center">+5%</div>
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
                <TableCell class="text-right">150</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
