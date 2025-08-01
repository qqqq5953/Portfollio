<script lang="ts">
export const description = "An inset sidebar with secondary navigation.";
export const iframeHeight = "800px";
</script>

<script setup lang="ts">
import AppSidebar from "@/components/AppSidebar.vue";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";

const route = useRoute();
const router = useRouter();
const title = computed(() => route.meta.title);

const handleLogout = async () => {
  await supabase.auth.signOut();
  router.replace("/login");
};
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="flex flex-col gap-2 h-screen overflow-hidden">
      <header class="flex shrink-0 items-center gap-2 p-4">
        <SidebarTrigger class="-ml-2" />
        <h1 class="text-2xl font-semibold">{{ title }}</h1>
        <Button @click="handleLogout" variant="ghost" class="ml-auto">
          Logout
        </Button>
      </header>
      <main
        class="flex flex-1 flex-col gap-4 p-6 overflow-y-auto base-scrollbar"
      >
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
