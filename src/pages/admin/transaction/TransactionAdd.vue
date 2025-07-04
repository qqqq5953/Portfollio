<script setup lang="ts">
import AddForm from "@/components/AddForm.vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
</script>

<template>
  <div class="px-4 py-6 space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Upload Statement</CardTitle>
      </CardHeader>
      <CardContent>
        <Input type="file" accept="application/pdf,image/*" />
        <p class="text-sm text-muted-foreground mt-2">
          Only support PDF or image, file size &lt;= 5MB.
        </p>
      </CardContent>
    </Card>

    <div class="text-center text-sm text-muted-foreground">or</div>

    <Card>
      <CardHeader>
        <CardTitle>Manual Input</CardTitle>
      </CardHeader>
      <CardContent>
        <AddForm />
      </CardContent>
    </Card>
  </div>
</template>
