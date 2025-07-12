<script setup lang="ts">
import { onMounted } from "vue";
import { callEdgeFunction } from "./lib/helper";

onMounted(async () => {
  const { data, error } = await callEdgeFunction({
    name: "hello-world",
    body: {
      name: "Functions",
    },
  });

  console.log("data", data);
  console.log("error", error);
});
</script>

<template>
  <router-view />
</template>
