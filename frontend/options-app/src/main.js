import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "@/router";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { useAdminStore } from "@/stores/admin";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";
import "@/styles.css";

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(router);

  const appStore = useAppStore(pinia);
  const settingsStore = useSettingsStore(pinia);
  const scriptsStore = useScriptsStore(pinia);
  const authStore = useAuthStore(pinia);
  const adminStore = useAdminStore(pinia);

  await settingsStore.hydrate();
  scriptsStore.sync(settingsStore.settings || {});
  adminStore.syncDraft(settingsStore.settings || {});
  await authStore.restore();
  appStore.setInitialized(true);

  app.mount("#app");
}

bootstrap().catch((error) => {
  const root = document.getElementById("app");
  if (root) {
    root.innerHTML = `<main style="padding: 32px; font: 16px/1.6 'Microsoft YaHei', sans-serif;">
      <h1 style="margin: 0 0 12px;">Options 启动失败</h1>
      <pre style="white-space: pre-wrap;">${String(error?.message || error)}</pre>
    </main>`;
  }
  console.error("[options-app] bootstrap failed", error);
});
