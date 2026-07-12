import { createRouter, createWebHashHistory } from "vue-router";
import CenterView from "@/views/CenterView.vue";
import DownloadsView from "@/views/DownloadsView.vue";
import ScriptDetailView from "@/views/ScriptDetailView.vue";
import AdminUnlockView from "@/views/AdminUnlockView.vue";
import AdminOverviewView from "@/views/AdminOverviewView.vue";
import AdminBackendView from "@/views/AdminBackendView.vue";
import AdminExportsView from "@/views/AdminExportsView.vue";
import { useAuthStore } from "@/stores/auth";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";
import { getSharedSelect } from "@/services/globals";

const routes = [
  {
    path: "/",
    redirect: "/center",
  },
  {
    path: "/center",
    name: "center",
    component: CenterView,
  },
  {
    path: "/downloads",
    name: "downloads",
    component: DownloadsView,
  },
  {
    path: "/script/:scriptId",
    name: "script-detail",
    component: ScriptDetailView,
  },
  {
    path: "/admin",
    redirect: "/admin/overview",
  },
  {
    path: "/admin/unlock",
    name: "admin-unlock",
    component: AdminUnlockView,
    meta: {
      adminPublic: true,
    },
  },
  {
    path: "/admin/overview",
    name: "admin-overview",
    component: AdminOverviewView,
    meta: {
      requiresAdmin: true,
    },
  },
  {
    path: "/admin/backend",
    name: "admin-backend",
    component: AdminBackendView,
    meta: {
      requiresAdmin: true,
    },
  },
  {
    path: "/admin/exports",
    name: "admin-exports",
    component: AdminExportsView,
    meta: {
      requiresAdmin: true,
    },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/center",
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const settingsStore = useSettingsStore();
  const scriptsStore = useScriptsStore();
  const authStore = useAuthStore();

  if (!settingsStore.hasSettings) {
    await settingsStore.hydrate();
    scriptsStore.sync(settingsStore.settings || {});
  }

  if (!authStore.session) {
    await authStore.restore();
  }

  if (to.name === "script-detail") {
    const scriptId = String(to.params.scriptId || "").trim();
    const script = scriptsStore.getScript(scriptId);
    if (!script) {
      return {
        name: "center",
      };
    }
  }

  if (to.meta.requiresAdmin && !authStore.isUnlocked) {
    return {
      name: "admin-unlock",
    };
  }

  if (to.name === "admin-unlock" && authStore.isUnlocked) {
    return {
      name: "admin-overview",
    };
  }

  return true;
});

router.afterEach(() => {
  const sharedSelect = getSharedSelect();
  if (typeof sharedSelect.closeAllCustomSelects === "function") {
    sharedSelect.closeAllCustomSelects(null);
  }
});

export default router;
