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
    path: "/admin",
    name: "admin",
    component: () => import("@/pages/admin/AdminLayout.vue"),
    children: [
      {
        path: "overview",
        name: "overview",
        component: () => import("@/pages/admin/Overview.vue"),
      },
      {
        path: "performance",
        name: "performance",
        component: () => import("@/pages/admin/Performance.vue"),
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
          },
          {
            path: "add",
            name: "add",
            component: () =>
              import("@/pages/admin/transaction/TransactionAdd.vue"),
          },
        ],
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/pages/NotFound.vue"),
  },
];
