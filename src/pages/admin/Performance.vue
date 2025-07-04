<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import LineChart from "@/components/LineChart.vue";
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

    <Card>
      <CardContent><LineChart /></CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>AI 分析投資組合</CardTitle></CardHeader>
      <CardContent class="space-y-4">
        <Textarea placeholder="我目前投資報酬率偏低的原因是什麼？" />
        <div class="flex flex-wrap gap-2">
          <Button variant="outline">資產配置建議</Button>
          <Button variant="outline">比較與 S&P500</Button>
          <Button variant="outline">集中度分析</Button>
        </div>
        <p class="text-sm text-muted-foreground">
          每日可提問 {`{n}`} 次，限制 300 字內問題。若需更多請升級。
        </p>
      </CardContent>
    </Card>
  </div>
</template>
