import fs from "node:fs";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { resolveRepo } from "#repo-paths";
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

const routerMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
}));

const adminServiceMocks = vi.hoisted(() => ({
  loadAiKeySlots: vi.fn(),
  switchAiKeySlot: vi.fn(),
}));

vi.mock("@/services/admin-service", async () => {
  const actual = await vi.importActual("@/services/admin-service");
  return {
    ...actual,
    ...adminServiceMocks,
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
      return routerMocks;
    },
  };
});

describe("Admin legacy shells", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    globalThis.ASREdgeConstants = {};
    routerMocks.replace.mockReset();
    routerMocks.push.mockReset();
    adminServiceMocks.loadAiKeySlots.mockReset();
    adminServiceMocks.switchAiKeySlot.mockReset();

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
    adminStore.aiKeySlots = {
      activeSlotId: "key-1",
      slots: [
        { id: "key-1", label: "密钥一", configured: true, active: true },
        { id: "key-2", label: "密钥二", configured: true, active: false },
      ],
    };
    adminStore.aiKeySlotsLoading = false;
    adminStore.aiKeySlotsError = "";
    adminStore.aiKeySlotSwitchingId = "";
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
    expect(backendWrapper.text()).toContain("折叠根地址配置");
    expect(backendWrapper.text()).toContain("保存后端根地址");
    expect(backendWrapper.text()).toContain("当前生效：");
    expect(backendWrapper.findAll(".home-endpoint-row input")).toHaveLength(2);
    expect(exportsWrapper.find("#admin-download-summary").exists()).toBe(true);
    expect(exportsWrapper.find("#project-data-download-panel").exists()).toBe(false);
    expect(exportsWrapper.find("#ai-call-log-download-panel").exists()).toBe(true);
    expect(exportsWrapper.findAll("select[data-options-custom-select='true']")).toHaveLength(1);
  });

  test("server backend view selects 王 locally and saves it only after confirmation", async () => {
    routeState.path = "/admin/backend";
    const adminStore = useAdminStore();
    const wangActiveSlots = {
      activeSlotId: "key-2",
      slots: [
        { id: "key-1", label: "密钥一", configured: true, active: false },
        { id: "key-2", label: "密钥二", configured: true, active: true },
      ],
    };
    adminStore.loadAiKeySlots = vi.fn().mockImplementation(async () => adminStore.aiKeySlots);
    adminStore.switchAiKeySlot = vi.fn().mockImplementation(async () => {
      adminStore.aiKeySlots = wangActiveSlots;
      return wangActiveSlots;
    });
    const wrapper = mount(AdminBackendView);
    await flushPromises();

    expect(wrapper.find("#admin-ai-key-slots").exists()).toBe(true);
    expect(wrapper.findAll("[data-ai-key-choice]")).toHaveLength(2);
    expect(wrapper.find("[data-ai-key-choice='key-1']").text()).toBe("吴");
    expect(wrapper.find("[data-ai-key-choice='key-2']").text()).toBe("王");
    expect(wrapper.find("[data-ai-key-choice='key-1']").attributes("aria-pressed")).toBe("true");
    expect(wrapper.find("[data-ai-key-save]").attributes("disabled")).toBeDefined();

    await wrapper.find("[data-ai-key-choice='key-2']").trigger("click");
    expect(adminStore.switchAiKeySlot).not.toHaveBeenCalled();
    expect(wrapper.find("[data-ai-key-choice='key-2']").attributes("aria-pressed")).toBe("true");
    expect(wrapper.find("[data-ai-key-save]").attributes("disabled")).toBeUndefined();

    await wrapper.find("[data-ai-key-save]").trigger("click");
    await flushPromises();
    expect(adminStore.switchAiKeySlot).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "key-2"
    );
    expect(adminStore.loadAiKeySlots).toHaveBeenCalledTimes(2);
    expect(wrapper.find("[data-ai-key-save]").attributes("disabled")).toBeDefined();
    expect(wrapper.text()).not.toContain("test-key-one");
    expect(wrapper.text()).not.toContain("dashscope-key-1.env");
  });

  test("server backend view disables an unconfigured key choice", async () => {
    routeState.path = "/admin/backend";
    const adminStore = useAdminStore();
    adminStore.aiKeySlots = {
      activeSlotId: "key-1",
      slots: [
        { id: "key-1", label: "密钥一", configured: true, active: true },
        { id: "key-2", label: "密钥二", configured: false, active: false },
      ],
    };
    adminStore.loadAiKeySlots = vi.fn().mockResolvedValue(adminStore.aiKeySlots);
    const wrapper = mount(AdminBackendView);
    await flushPromises();

    expect(wrapper.find("[data-ai-key-choice='key-2']").attributes("disabled")).toBeDefined();
  });

  test("saving a key choice exits the admin session when the server returns 401", async () => {
    routeState.path = "/admin/backend";
    const adminStore = useAdminStore();
    const authStore = useAuthStore();
    authStore.logout = vi.fn();
    adminStore.loadAiKeySlots = vi.fn().mockResolvedValue(adminStore.aiKeySlots);
    adminStore.switchAiKeySlot = vi.fn().mockResolvedValue({ authFailed: true });
    const wrapper = mount(AdminBackendView);
    await flushPromises();

    await wrapper.find("[data-ai-key-choice='key-2']").trigger("click");
    await wrapper.find("[data-ai-key-save]").trigger("click");
    await flushPromises();

    expect(authStore.logout).toHaveBeenCalledTimes(1);
    expect(routerMocks.replace).toHaveBeenCalledWith({ name: "admin-unlock" });
  });

  test("local backend mode hides server AI key slots", async () => {
    routeState.path = "/admin/backend";
    const adminStore = useAdminStore();
    adminStore.backendDraft.backendEndpointMode = "local";
    adminStore.loadAiKeySlots = vi.fn();
    const wrapper = mount(AdminBackendView);
    await flushPromises();

    expect(wrapper.find("#admin-ai-key-slots").exists()).toBe(false);
    expect(adminStore.loadAiKeySlots).not.toHaveBeenCalled();
  });

  test("server backend mode shows a safe key-slot error without exposing configuration details", async () => {
    routeState.path = "/admin/backend";
    const adminStore = useAdminStore();
    adminStore.aiKeySlots = null;
    adminStore.aiKeySlotsError = "服务器 AI 密钥状态加载失败。";
    adminStore.loadAiKeySlots = vi.fn().mockResolvedValue(null);
    const wrapper = mount(AdminBackendView);
    await flushPromises();

    expect(wrapper.find("#admin-ai-key-slots [role='status']").text()).toContain("加载失败");
    expect(wrapper.text()).not.toContain("DASHSCOPE_API_KEY");
    expect(wrapper.text()).not.toContain("config/secrets");
  });

  test("a missing dual-key endpoint has a clear save message without raw endpoint details", async () => {
    routeState.path = "/admin/backend";
    const adminStore = useAdminStore();
    adminServiceMocks.switchAiKeySlot.mockResolvedValue({
      response: { ok: false, status: 404 },
      body: { success: false, message: "接口不存在。" },
      authFailed: false,
    });

    const result = await adminStore.switchAiKeySlot({}, { token: "demo" }, "key-2");

    expect(result).toBeNull();
    expect(adminStore.aiKeySlotsError).toBe("服务器尚未部署双密钥接口，无法保存。");
  });

  test("AI key selector style remains compact and wraps on narrow screens", () => {
    const source = fs.readFileSync(
      resolveRepo("frontend", "options-app", "src", "styles", "layouts", "_admin.scss"),
      "utf8"
    );

    expect(source).toContain(".admin-ai-key-switcher");
    expect(source).toContain(".admin-ai-key-choice-group");
    expect(source).toContain("flex-wrap: wrap");
    expect(source).not.toContain(".admin-ai-key-slot-card");
  });
});
