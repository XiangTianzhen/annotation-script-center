import { beforeEach, describe, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
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
          data: [
            {
              id: "project-dataset-a",
              label: "ASR 快判统计数据",
              suppliers: [
                "__all__",
                "全部",
                "供应商 A",
              ],
            },
          ],
        },
      };
    },
    async loadAiCallLogOptions() {
      return {
        response: { ok: true },
        body: {
          success: true,
          data: [
            {
              id: "ai-dataset-a",
              label: "DataBaker 一检 AI 调用记录",
              hasData: true,
            },
          ],
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
    globalThis.ASREdgeConstants = {};

    const settingsStore = useSettingsStore();
    settingsStore.settings = {
      meta: {
        backendEndpointMode: "server",
        backendBaseUrls: {
          server: "https://server.example.com",
          local: "http://127.0.0.1:3333",
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
      },
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

  test("backend and exports views keep the legacy form anchors", async () => {
    routeState.path = "/admin/backend";
    const backendWrapper = mount(AdminBackendView);
    routeState.path = "/admin/exports";
    const exportsWrapper = mount(AdminExportsView);
    await flushPromises();

    expect(backendWrapper.find(".admin-tab-strip").exists()).toBe(true);
    expect(backendWrapper.find("#admin-backend-card-slot").exists()).toBe(true);
    expect(backendWrapper.text()).toContain("服务器");
    expect(backendWrapper.text()).toContain("本机");
    expect(backendWrapper.text()).not.toContain("Beta");
    expect(backendWrapper.text()).toContain("折叠根地址配置");
    expect(backendWrapper.text()).toContain("保存后端根地址");
    expect(backendWrapper.text()).toContain("当前生效：");
    expect(backendWrapper.findAll(".home-endpoint-row input")).toHaveLength(2);
    expect(exportsWrapper.find("#admin-download-summary").exists()).toBe(true);
    expect(exportsWrapper.find("#project-data-download-panel").exists()).toBe(false);
    expect(exportsWrapper.find("#ai-call-log-download-panel").exists()).toBe(true);
    expect(exportsWrapper.findAll("select[data-options-custom-select='true']")).toHaveLength(1);
  });
});
