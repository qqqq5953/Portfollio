<script setup lang="ts">
import { onMounted } from "vue";
import { supabase } from "./lib/supabase";

onMounted(async () => {
  const { data, error } = await supabase.functions.invoke("hello-world", {
    body: { name: "Functions" },
  });

  console.log("data", data);
  console.log("error", error);
});
</script>

<template>
  <router-view />
</template>
