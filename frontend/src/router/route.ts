import { supabase } from "@/lib/supabase";
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';

export const routes = [
  {
    path: "/",
    name: "guest",
    component: () => import("@/pages/guest/GuestLayout.vue"),
    children: [
      {
        path: "/",
        name: "home",
        component: () => import("@/pages/guest/Home.vue"),
      },
      {
        path: "/about",
        name: "about",
        component: () => import("@/pages/guest/About.vue"),
      },
    ],
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@/pages/guest/Login.vue"),
    beforeEnter: async (
      _to: RouteLocationNormalized, 
      _from: RouteLocationNormalized, 
      next: NavigationGuardNext
    ) => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        next("/admin/overview");
      } else {
        next();
      }
    },
  },
  {
    path: "/auth/callback",
    name: "auth-callback",
    component: () => import("@/pages/guest/AuthRedirect.vue"),
  },
  {
    path: "/admin",
    name: "admin",
    component: () => import("@/pages/admin/AdminLayout.vue"),
    redirect: "/admin/overview",
    beforeEnter: async (
      _to: RouteLocationNormalized, 
      _from: RouteLocationNormalized, 
      next: NavigationGuardNext
    ) => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        next();
      } else {
        next("/login");
      }
    },
    children: [
      {
        path: "overview",
        name: "overview",
        component: () => import("@/pages/admin/Overview.vue"),
        meta: {
          title: "Overview",
        },
      },
      {
        path: "performance",
        name: "performance",
        component: () => import("@/pages/admin/Performance.vue"),
        meta: {
          title: "Performance",
        },
      },
      {
        path: "transactions",
        name: "transactions",
        children: [
          {
            path: "history",
            name: "history",
            component: () =>
              import("@/pages/admin/transaction/TransactionHistory.vue"),
            meta: {
              title: "Transaction History",
            },
          },
          {
            path: "add",
            name: "add",
            component: () =>
              import("@/pages/admin/transaction/TransactionAdd.vue"),
            meta: {
              title: "New Transaction",
            },
          },
        ],
      },  
      {
        path: "symbol/:symbol/transactions",
        name: "symbol-transactions",
        component: () => import("@/pages/admin/symbol/SymbolTransactions.vue"),
        props: true,
        meta: {
          title: "Transactions History",
        },
      }
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/pages/NotFound.vue"),
  },
];
