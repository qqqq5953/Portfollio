<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import Cookies from "js-cookie";

const router = useRouter();
const statusMessage = ref("Checking authentication...");

onMounted(async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    console.log("error", error);
    router.replace("/login");
  } else {
    statusMessage.value = "Logged in successfully. Redirecting...";
    Cookies.set("portfolio-access_token", data.session.access_token);
    Cookies.set("portfolio-refresh_token", data.session.refresh_token);
    router.replace("/admin/overview");
  }
});
</script>

<template>
  <div class="flex justify-center items-center h-screen">
    <p>{{ statusMessage }}</p>
  </div>
</template>
https://gbkpiejgyqfhnaploktq.supabase.co/auth/v1/callback
