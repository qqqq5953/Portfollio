<script lang="ts">
export const description = "An inset sidebar with secondary navigation.";
export const iframeHeight = "800px";
</script>

<script setup lang="ts">
import AppSidebar from "@/components/AppSidebar.vue";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const title = computed(() => route.meta.title);
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="flex flex-col gap-2 h-screen overflow-hidden">
      <header class="flex shrink-0 items-center gap-2 py-4">
        <div class="flex items-center gap-1 px-4">
          <SidebarTrigger class="-ml-2" />
          <Separator orientation="vertical" class="h-4" />
          <h1 class="text-2xl font-semibold">{{ title }}</h1>
        </div>
      </header>
      <main
        class="flex flex-1 flex-col gap-4 px-6 pb-6 overflow-y-auto base-scrollbar"
      >
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
