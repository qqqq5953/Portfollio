import { createApp } from "vue";
import "./index.css";
import App from "./App.vue";
import router from "./router";
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // optionally add other defaults
      refetchOnWindowFocus: false,
    },
  },
});

createApp(App).use(VueQueryPlugin, { queryClient }).use(router).mount("#app");
