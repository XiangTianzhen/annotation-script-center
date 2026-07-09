<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { buildPlatformEntryDescriptor, isScriptRuntimeAccessible } from "@/services/globals";
import { useAppStore } from "@/stores/app";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";

const router = useRouter();
const appStore = useAppStore();
const scriptsStore = useScriptsStore();
const settingsStore = useSettingsStore();

const platformGroups = computed(() =>
  scriptsStore.visiblePlatforms
    .map((platformId) => {
      const platform = scriptsStore.platformMap[platformId];
      const scripts = scriptsStore.visibleScripts
        .map((scriptId) => scriptsStore.scriptMap[scriptId])
        .filter((script) => script?.platformId === platformId)
        .map((script) => ({
          ...script,
          runtimeEnabled: isScriptRuntimeAccessible(script.id, settingsStore.settings || {}),
        }));
      const preferredScript = scripts.find((item) => item.runtimeEnabled) || scripts[0] || null;
      return {
        ...platform,
        ...buildPlatformEntryDescriptor(platform),
        scripts,
        preferredScript,
      };
    })
    .filter((group) => group.scripts.length > 0)
);

const enabledCount = computed(
  () =>
    scriptsStore.visibleScripts.filter((scriptId) =>
      isScriptRuntimeAccessible(scriptId, settingsStore.settings || {})
    ).length
);

async function toggleScript(scriptId, enabled) {
  await settingsStore.toggleScript(scriptId, enabled);
  scriptsStore.sync(settingsStore.settings || {});
  appStore.showToast(enabled ? "脚本已启用。" : "脚本已关闭。", "success");
}
</script>

<template>
  <div class="platform-grid">
    <section class="hero">
      <div class="hero-top">
        <div>
          <span class="hero-kicker">FUNCTION PANEL</span>
          <h1>设置中心</h1>
          <p>
            功能面板继续只保留平台概览、脚本启停和详情入口，视觉口径回到旧版 options 工作台。
          </p>
        </div>
      </div>

      <div class="public-summary-strip">
        <div class="public-summary-card">
          <span class="summary-label">可见平台</span>
          <strong>{{ scriptsStore.visiblePlatforms.length }}</strong>
          <span class="summary-note">当前版本可进入的运行平台数量。</span>
        </div>
        <div class="public-summary-card">
          <span class="summary-label">可见脚本</span>
          <strong>{{ scriptsStore.visibleScripts.length }}</strong>
          <span class="summary-note">当前会展示在设置中心里的脚本总数。</span>
        </div>
        <div class="public-summary-card">
          <span class="summary-label">当前生效</span>
          <strong>{{ enabledCount }}</strong>
          <span class="summary-note">按共享 storage 计算的当前启用脚本数。</span>
        </div>
      </div>
    </section>

    <section class="public-center-toolbar">
      <div class="public-center-toolbar-copy">
        <strong>功能面板工作台</strong>
        <span>默认只读浏览，直接在这里启停脚本或进入详情页。</span>
      </div>
    </section>

    <div class="platform-workbench">
      <section
        v-for="group in platformGroups"
        :key="group.id"
        class="platform-section platform-module"
      >
        <div class="platform-body">
          <div class="platform-summary">
            <div class="platform-head platform-head-inline">
              <div>
                <h2>{{ group.label }}</h2>
                <p class="platform-copy">{{ group.description }}</p>
              </div>
            </div>

            <div class="platform-facts">
              <a
                v-if="group.entryUrl"
                class="pill info platform-link-pill"
                :href="group.entryUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ group.displayHost || group.host || "打开平台" }}
                <span class="platform-link-mark" aria-hidden="true">↗</span>
              </a>
              <span v-if="group.preferredScript" class="pill" :class="group.preferredScript.runtimeEnabled ? 'enabled' : 'info'">
                {{ group.preferredScript.runtimeEnabled ? "当前启用：" : "默认启用：" }}
                {{ group.preferredScript.label }}
              </span>
            </div>
          </div>

          <div class="platform-script-stack">
            <article
              v-for="script in group.scripts"
              :key="script.id"
              class="script-card"
              :class="{ active: script.runtimeEnabled }"
            >
              <div class="script-card-top">
                <div class="script-card-main">
                  <div class="script-title">
                    <h3>{{ script.label }}</h3>
                    <div class="meta-row">
                      <span class="script-pill info">{{ script.statusLabel || "脚本" }}</span>
                      <span class="script-pill" :class="script.runtimeEnabled ? 'enabled' : 'disabled'">
                        {{ script.runtimeEnabled ? "当前启用" : "当前未启用" }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="script-actions">
                  <button type="button" class="primary-button" @click="router.push(`/script/${script.id}`)">
                    打开设置
                  </button>
                  <button
                    v-if="script.runtimeEnabled"
                    type="button"
                    class="danger-button"
                    @click="toggleScript(script.id, false)"
                  >
                    关闭脚本
                  </button>
                  <button
                    v-else
                    type="button"
                    class="secondary-button"
                    @click="toggleScript(script.id, true)"
                  >
                    启用脚本
                  </button>
                </div>
              </div>

              <p class="script-copy">{{ script.description }}</p>
            </article>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
