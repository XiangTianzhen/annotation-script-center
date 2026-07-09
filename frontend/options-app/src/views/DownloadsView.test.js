import { beforeEach, describe, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import DownloadsView from "@/views/DownloadsView.vue";
import { useDownloadsStore } from "@/stores/downloads";
import { useSettingsStore } from "@/stores/settings";

describe("DownloadsView legacy shell", () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    const settingsStore = useSettingsStore();
    settingsStore.settings = {};

    const downloadsStore = useDownloadsStore();
    downloadsStore.loading = false;
    downloadsStore.error = "";
    downloadsStore.releases = {
      latestVersion: "0.4.0",
      items: [
        {
          version: "0.4.0",
          isLatest: true,
          createdAt: "2026-07-09 10:00:00",
          crxUrl: "https://example.com/current.crx",
          zipUrl: "https://example.com/current.zip",
          notes: ["当前推荐版本"],
        },
        {
          version: "0.3.9",
          isLatest: false,
          createdAt: "2026-07-08 10:00:00",
          crxUrl: "https://example.com/prev.crx",
          zipUrl: "",
          notes: [],
        },
      ],
    };
    downloadsStore.selectedVersion = "0.4.0";
  });

  test("renders the legacy summary and release panel anchors", () => {
    const wrapper = mount(DownloadsView);

    expect(wrapper.find(".download-center-shell").exists()).toBe(true);
    expect(wrapper.find("#public-download-summary").exists()).toBe(true);
    expect(wrapper.find("#public-script-release-panel").exists()).toBe(true);
    expect(wrapper.find("#public-release-version-select").exists()).toBe(true);
    expect(wrapper.text()).toContain("脚本下载中心");
    expect(wrapper.text()).toContain("默认展示最新版，历史版本可通过下拉框切换");
    expect(wrapper.text()).toContain("当前可分发最新版");
    expect(wrapper.text()).toContain("查看外部目录");
    expect(wrapper.find("select[data-options-custom-select='true']").exists()).toBe(true);
  });
});
