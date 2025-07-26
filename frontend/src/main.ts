import { createApp } from "vue";
import "./index.css";
import App from "./App.vue";
import router from "./router";
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      select: (data: any) => {
        console.log("select data", data);
        return data.data
      },
      // optionally add other defaults
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

createApp(App).use(VueQueryPlugin, { queryClient }).use(router).mount("#app");
