import { beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import AdminUnlockView from "@/views/AdminUnlockView.vue";
import AdminOverviewView from "@/views/AdminOverviewView.vue";
import AdminBackendView from "@/views/AdminBackendView.vue";
import AdminExportsView from "@/views/AdminExportsView.vue";
import { useAdminStore } from "@/stores/admin";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";

const routeState = vi.hoisted(() => ({
  path: "/admin/overview",
}));

vi.mock("@/services/admin-service", async () => {
  const actual = await vi.importActual("@/services/admin-service");
  return {
    ...actual,
    isAdminSessionExpired() {
      return false;
    },
    async loadProjectDataDownloadOptions() {
      return {
        response: { ok: true },
        body: {
          success: true,
          data: [],
        },
      };
    },
    async loadAiCallLogOptions() {
      return {
        response: { ok: true },
        body: {
          success: true,
          data: [],
        },
      };
    },
  };
});

vi.mock("vue-router", async () => {
  const actual = await vi.importActual("vue-router");
  return {
    ...actual,
    RouterLink: {
      props: ["to"],
      template: '<a :data-to="to"><slot /></a>',
    },
    useRoute() {
      return routeState;
    },
    useRouter() {
      return {
        replace: vi.fn(),
        push: vi.fn(),
      };
    },
  };
});

describe("Admin legacy shells", () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    const settingsStore = useSettingsStore();
    settingsStore.settings = {
      meta: {
        backendEndpointMode: "server",
        backendBaseUrls: {
          server: "https://server.example.com",
          local: "http://127.0.0.1:3333",
          beta: "https://beta.example.com",
        },
        aiUsageOperatorName: "测试员",
      },
    };

    const authStore = useAuthStore();
    authStore.session = {
      token: "demo",
    };

    const adminStore = useAdminStore();
    adminStore.backendDraft = {
      backendEndpointMode: "server",
      backendBaseUrls: {
        server: "https://server.example.com",
        local: "http://127.0.0.1:3333",
        beta: "https://beta.example.com",
      },
      aiUsageOperatorName: "测试员",
    };
    adminStore.dashboardLoading = false;
    adminStore.dashboardError = "";
    adminStore.dashboard = {
      runtime: {
        queue: {
          activePools: [],
        },
        jobs: {
          usedCount: 1,
          capacity: 5,
          runningCount: 1,
          pendingCount: 0,
          succeededCount: 2,
        },
      },
      downloads: {
        projectDataDatasets: [{ id: "dataset-a" }],
        aiCallLogDatasets: [{ id: "log-a" }],
      },
      logsSummary: {
        retentionDays: 7,
      },
      runtimeLogs: {
        items: [],
      },
    };
  });

  test("unlock view keeps the legacy admin-auth-gate shell", () => {
    const wrapper = mount(AdminUnlockView);

    expect(wrapper.find(".admin-auth-gate").exists()).toBe(true);
    expect(wrapper.text()).toContain("系统管理解锁");
    expect(wrapper.text()).toContain("输入系统管理密码");
  });

  test("overview view exposes the legacy dashboard anchors", () => {
    routeState.path = "/admin/overview";
    const wrapper = mount(AdminOverviewView);

    expect(wrapper.find(".admin-tab-strip").exists()).toBe(true);
    expect(wrapper.find("#admin-overview-pools").exists()).toBe(true);
    expect(wrapper.find("#admin-overview-log-summary").exists()).toBe(true);
    expect(wrapper.find("#admin-overview-runtime-logs").exists()).toBe(true);
    expect(wrapper.find("#admin-overview-status").exists()).toBe(true);
  });

  test("backend and exports views keep the legacy form anchors", () => {
    routeState.path = "/admin/backend";
    const backendWrapper = mount(AdminBackendView);
    routeState.path = "/admin/exports";
    const exportsWrapper = mount(AdminExportsView);

    expect(backendWrapper.find(".admin-tab-strip").exists()).toBe(true);
    expect(backendWrapper.find("#admin-backend-card-slot").exists()).toBe(true);
    expect(exportsWrapper.find("#admin-download-summary").exists()).toBe(true);
    expect(exportsWrapper.find("#project-data-download-panel").exists()).toBe(true);
    expect(exportsWrapper.find("#ai-call-log-download-panel").exists()).toBe(true);
  });
});
