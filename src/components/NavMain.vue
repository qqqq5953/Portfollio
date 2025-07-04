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
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { RouterLink, useRoute, useRouter } from "vue-router";

type NavItem = {
  title: string;
  url?: string;
  icon?: LucideIcon;
  isActive?: boolean;
  children?: NavItem[];
};

defineProps<{
  items: NavItem[];
}>();

const route = useRoute();
const router = useRouter();
const { open, setOpenMobile } = useSidebar();
function navigate(item: NavItem) {
  if (!open.value) {
    if (item.url) {
      router.push(item.url);
    } else if (item.children) {
      router.push(item.children[0]?.url ?? "");
    }
  }
}
</script>

<template>
  <SidebarGroup>
    <SidebarMenu>
      <template v-for="item in items" :key="item.title">
        <Collapsible
          v-if="item.children"
          as-child
          :default-open="true"
          class="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger as-child>
              <SidebarMenuButton
                :tooltip="item.title"
                :class="{
                  'text-indigo-600 hover:text-indigo-600 bg-neutral-100':
                    !open &&
                    item.children.find((child) => child.url === route.path),
                }"
              >
                <component
                  :is="item.icon"
                  v-if="item.icon"
                  @click="navigate(item)"
                />
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
                  @click="setOpenMobile(false)"
                >
                  <SidebarMenuButton
                    as-child
                    :class="{
                      'text-indigo-600 hover:text-indigo-600 bg-neutral-100':
                        route.path === subItem.url,
                    }"
                  >
                    <RouterLink :to="subItem.url" v-if="subItem.url">
                      <component :is="subItem.icon" v-if="subItem.icon" />
                      {{ subItem.title }}
                    </RouterLink>
                  </SidebarMenuButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>

        <SidebarMenuItem v-else class="flex items-center gap-2">
          <SidebarMenuButton
            as-child
            :tooltip="item.title"
            :class="{
              'text-indigo-600 hover:text-indigo-600 bg-neutral-100':
                route.path === item.url,
            }"
            @click="setOpenMobile(false)"
          >
            <RouterLink :to="item.url" v-if="item.url">
              <component :is="item.icon" v-if="item.icon" />
              {{ item.title }}
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </template>
    </SidebarMenu>
  </SidebarGroup>
</template>
