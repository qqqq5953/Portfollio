<script setup lang="ts">
import { ChevronRight, type LucideIcon } from "lucide-vue-next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { RouterLink } from "vue-router";
defineProps<{
  items: {
    title: string;
    url?: string;
    icon?: LucideIcon;
    isActive?: boolean;
    children?: {
      title: string;
      url: string;
    }[];
  }[];
}>();
</script>

<template>
  <SidebarGroup>
    <SidebarMenu>
      <template v-for="item in items" :key="item.title">
        <Collapsible
          v-if="item.children"
          as-child
          :default-open="item.isActive"
          class="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger as-child>
              <SidebarMenuButton :tooltip="item.title">
                <component :is="item.icon" v-if="item.icon" />
                <span>{{ item.title }}</span>
                <ChevronRight
                  class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem
                  v-for="subItem in item.children"
                  :key="subItem.title"
                >
                  <SidebarMenuSubButton as-child>
                    <RouterLink :to="subItem.url">
                      {{ subItem.title }}
                    </RouterLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>

        <SidebarMenuItem v-else class="flex items-center gap-2">
          <SidebarMenuButton :tooltip="item.title" class="py-0">
            <component :is="item.icon" v-if="item.icon" />
            <RouterLink
              :to="item.url"
              v-if="item.url"
              class="flex items-center size-full"
            >
              {{ item.title }}
            </RouterLink>
            <span v-else>{{ item.title }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </template>
    </SidebarMenu>
  </SidebarGroup>
</template>
