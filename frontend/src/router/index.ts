import { createWebHistory, createRouter } from "vue-router";
import { routes } from "./route";

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
