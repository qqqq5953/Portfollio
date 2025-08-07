<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar/index";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar/index";

import {
  AudioWaveform,
  BookOpen,
  Command,
  GalleryVerticalEnd,
  Plus,
  History,
  LayoutDashboard,
  LineChart,
} from "lucide-vue-next";
import NavMain from "@/components/NavMain.vue";
import NavUser from "@/components/NavUser.vue";
import TeamSwitcher from "@/components/TeamSwitcher.vue";

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
});

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Overview",
      url: "/admin/overview",
      icon: LayoutDashboard,
    },
    {
      title: "Performance",
      url: "/admin/performance",
      icon: LineChart,
    },
    {
      title: "Transactions",
      icon: BookOpen,
      children: [
        {
          title: "History",
          url: "/admin/transactions/history",
          icon: History,
        },
        {
          title: "New",
          url: "/admin/transactions/add",
          icon: Plus,
        },
      ],
    },
  ],
};
</script>

<template>
  <Sidebar v-bind="props" class="border-none shadow-sm">
    <SidebarHeader class="bg-white">
      <TeamSwitcher :teams="data.teams" />
    </SidebarHeader>
    <SidebarContent class="bg-white">
      <NavMain :items="data.navMain" />
    </SidebarContent>
    <SidebarFooter class="bg-white">
      <NavUser :user="data.user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
