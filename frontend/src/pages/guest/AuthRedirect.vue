<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";

const router = useRouter();
const statusMessage = ref("Checking authentication...");

onMounted(async () => {
  const { data, error } = await supabase.auth.getSession();
  console.log("data", data);

  if (error || !data.session) {
    console.log("error", error);
    router.replace("/login");
  } else {
    statusMessage.value = "Logged in successfully. Redirecting...";
    router.replace("/admin/overview");
  }
});
</script>

<template>
  <div class="flex justify-center items-center h-screen">
    <p>{{ statusMessage }}</p>
  </div>
</template>
