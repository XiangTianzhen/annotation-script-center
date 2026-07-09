<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { buildPlatformEntryDescriptor, isScriptRuntimeAccessible } from "@/services/globals";
import { useAuthStore } from "@/stores/auth";
import { useAppStore } from "@/stores/app";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";

const router = useRouter();
const authStore = useAuthStore();
const appStore = useAppStore();
const scriptsStore = useScriptsStore();
const settingsStore = useSettingsStore();
const editingOrder = ref(false);
const platformOrderDraft = ref([]);
const editStatusMessage = ref("");
const workbenchRef = ref(null);
const PLATFORM_REORDER_HOVER_DELAY_MS = 200;
const PLATFORM_REORDER_EDGE_SCROLL_MARGIN = 92;
const PLATFORM_REORDER_EDGE_SCROLL_STEP = 22;
let dragState = null;

watch(
  () => scriptsStore.visiblePlatforms.slice(),
  (nextIds) => {
    platformOrderDraft.value = nextIds.slice();
  },
  { immediate: true }
);

const orderedPlatformIds = computed(() => {
  const visibleIds = scriptsStore.visiblePlatforms.slice();
  const seen = new Set();
  const ordered = [];

  platformOrderDraft.value.forEach((platformId) => {
    if (!platformId || seen.has(platformId) || visibleIds.includes(platformId) === false) {
      return;
    }
    seen.add(platformId);
    ordered.push(platformId);
  });

  visibleIds.forEach((platformId) => {
    if (!platformId || seen.has(platformId)) {
      return;
    }
    seen.add(platformId);
    ordered.push(platformId);
  });

  return ordered;
});

const platformGroups = computed(() =>
  orderedPlatformIds.value
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

const centerEditStatus = computed(() => {
  if (editStatusMessage.value) {
    return editStatusMessage.value;
  }
  if (!editingOrder.value) {
    return "默认只读浏览；进入编辑模式后可拖动整个平台区块上下重排。";
  }
  return "按住平台区块拖动；在目标区域停留片刻后，平台会自动让位并保存顺序。";
});

function getPlatformSectionNodes(root) {
  if (!(root instanceof HTMLElement)) {
    return [];
  }
  return Array.from(root.querySelectorAll(".platform-section.platform-module"));
}

function clearPlatformDropIndicators(root) {
  getPlatformSectionNodes(root).forEach((section) => {
    section.classList.remove("is-drop-before", "is-drop-after", "is-dragging", "is-drop-active");
  });
}

function getCurrentRenderedPlatformOrder(root) {
  return getPlatformSectionNodes(root)
    .map((section) => String(section.getAttribute("data-platform-id") || "").trim())
    .filter(Boolean);
}

function buildPlatformDragPlaceholder(section) {
  const rect = section.getBoundingClientRect();
  const placeholder = document.createElement("div");
  placeholder.className = "platform-workbench-placeholder";
  placeholder.style.height = `${Math.max(120, Math.round(rect.height))}px`;
  return placeholder;
}

function createPlatformDragGhost(section, rect) {
  section.classList.add("platform-drag-ghost");
  section.style.width = `${Math.round(rect.width)}px`;
  section.style.height = `${Math.round(rect.height)}px`;
  section.style.left = `${Math.round(rect.left)}px`;
  section.style.top = `${Math.round(rect.top)}px`;
  section.style.position = "fixed";
  section.style.margin = "0";
  section.style.zIndex = "1200";
  section.style.pointerEvents = "none";
  section.style.boxSizing = "border-box";
  document.body.appendChild(section);
  return section;
}

function resetPlatformDragGhost(section) {
  if (!(section instanceof HTMLElement)) {
    return;
  }
  section.classList.remove("platform-drag-ghost");
  section.style.width = "";
  section.style.height = "";
  section.style.left = "";
  section.style.top = "";
  section.style.position = "";
  section.style.margin = "";
  section.style.zIndex = "";
  section.style.pointerEvents = "";
  section.style.boxSizing = "";
}

function updatePlatformDragGhostPosition(state, clientX, clientY) {
  if (!(state?.ghost instanceof HTMLElement)) {
    return;
  }
  state.ghost.style.left = `${Math.round(clientX - state.offsetX)}px`;
  state.ghost.style.top = `${Math.round(clientY - state.offsetY)}px`;
}

function movePlatformPlaceholder(workbench, placeholder, target, position) {
  if (
    !(workbench instanceof HTMLElement) ||
    !(placeholder instanceof HTMLElement) ||
    !(target instanceof HTMLElement)
  ) {
    return;
  }
  if (position === "before") {
    workbench.insertBefore(placeholder, target);
    return;
  }
  if (target.nextSibling) {
    workbench.insertBefore(placeholder, target.nextSibling);
    return;
  }
  workbench.appendChild(placeholder);
}

function getPlatformReorderCandidate(workbench, movingId, clientY) {
  const sections = getPlatformSectionNodes(workbench).filter((section) => {
    const platformId = String(section.getAttribute("data-platform-id") || "").trim();
    return platformId && platformId !== String(movingId || "").trim();
  });
  if (sections.length <= 0) {
    return null;
  }

  let bestCandidate = null;
  sections.forEach((target) => {
    const rect = target.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const within = clientY >= rect.top && clientY <= rect.bottom;
    const distance = within ? 0 : Math.min(Math.abs(clientY - rect.top), Math.abs(clientY - rect.bottom));
    const position = clientY < midpoint ? "before" : "after";
    if (!bestCandidate || distance < bestCandidate.distance) {
      bestCandidate = {
        target,
        targetId: String(target.getAttribute("data-platform-id") || "").trim(),
        position,
        distance,
      };
    }
  });
  return bestCandidate;
}

function clearPlatformHoverTimer() {
  if (dragState?.hoverTimer) {
    globalThis.clearTimeout(dragState.hoverTimer);
    dragState.hoverTimer = null;
  }
}

function updatePlatformHoverIndicator(workbench, target, position) {
  clearPlatformDropIndicators(workbench);
  if (!(target instanceof HTMLElement)) {
    return;
  }
  target.classList.add(position === "before" ? "is-drop-before" : "is-drop-after", "is-drop-active");
}

function maybeAutoScrollPlatformWorkbench(clientY) {
  const viewportHeight = Number(globalThis.innerHeight || 0);
  if (!viewportHeight) {
    return;
  }
  if (clientY <= PLATFORM_REORDER_EDGE_SCROLL_MARGIN) {
    globalThis.scrollBy(0, -PLATFORM_REORDER_EDGE_SCROLL_STEP);
    return;
  }
  if (clientY >= viewportHeight - PLATFORM_REORDER_EDGE_SCROLL_MARGIN) {
    globalThis.scrollBy(0, PLATFORM_REORDER_EDGE_SCROLL_STEP);
  }
}

function cleanupPlatformDragState(options) {
  const config = options && typeof options === "object" ? options : {};
  const currentDragState = dragState;
  if (!currentDragState) {
    return;
  }
  clearPlatformHoverTimer();
  clearPlatformDropIndicators(currentDragState.workbench);
  if (currentDragState.workbench instanceof HTMLElement) {
    currentDragState.workbench.classList.remove("is-sorting");
  }
  if (currentDragState.ghost instanceof HTMLElement) {
    resetPlatformDragGhost(currentDragState.ghost);
  }
  if (
    currentDragState.placeholder instanceof HTMLElement &&
    currentDragState.placeholder.parentNode &&
    config.keepPlaceholder !== true
  ) {
    currentDragState.placeholder.parentNode.removeChild(currentDragState.placeholder);
  }
  document.body.classList.remove("is-platform-reordering");
  window.removeEventListener("pointermove", currentDragState.onPointerMove);
  window.removeEventListener("pointerup", currentDragState.onPointerUp);
  window.removeEventListener("pointercancel", currentDragState.onPointerUp);
  window.removeEventListener("keydown", currentDragState.onKeyDown);
  dragState = null;
}

async function toggleScript(scriptId, enabled) {
  await settingsStore.toggleScript(scriptId, enabled);
  scriptsStore.sync(settingsStore.settings || {});
  appStore.showToast(enabled ? "脚本已启用。" : "脚本已关闭。", "success");
}

async function persistPlatformOrder(nextOrder) {
  try {
    await settingsStore.persistPatch({
      meta: {
        publicCenterPlatformOrder: nextOrder,
      },
    });
    scriptsStore.sync(settingsStore.settings || {});
    platformOrderDraft.value = nextOrder.slice();
    editStatusMessage.value = "平台顺序已保存到本地缓存。";
  } catch (error) {
    editStatusMessage.value = `平台顺序保存失败：${error?.message || String(error)}`;
  }
}

function toggleEditMode() {
  if (dragState) {
    cleanupPlatformDragState();
  }
  editingOrder.value = !editingOrder.value;
  editStatusMessage.value = "";
}

function handlePlatformPointerDown(event, platformId) {
  if (!editingOrder.value || event.button !== 0) {
    return;
  }
  const workbench = workbenchRef.value;
  const section = event.currentTarget;
  if (!(workbench instanceof HTMLElement) || !(section instanceof HTMLElement) || !platformId) {
    return;
  }
  event.preventDefault();
  cleanupPlatformDragState();

  const rect = section.getBoundingClientRect();
  const placeholder = buildPlatformDragPlaceholder(section);
  const sourceIndex = getPlatformSectionNodes(workbench).indexOf(section);
  section.replaceWith(placeholder);
  const ghost = createPlatformDragGhost(section, rect);

  workbench.classList.add("is-sorting");
  document.body.classList.add("is-platform-reordering");

  const nextDragState = {
    platformId,
    workbench,
    sourceSection: section,
    placeholder,
    ghost,
    sourceIndex,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    hoverTargetId: "",
    hoverPosition: "",
    hoverTimer: null,
    isFinalizing: false,
  };

  const handleHoverCandidate = (clientY) => {
    const candidate = getPlatformReorderCandidate(workbench, platformId, clientY);
    if (!candidate) {
      nextDragState.hoverTargetId = "";
      nextDragState.hoverPosition = "";
      clearPlatformHoverTimer();
      clearPlatformDropIndicators(workbench);
      return;
    }

    updatePlatformHoverIndicator(workbench, candidate.target, candidate.position);
    if (
      nextDragState.hoverTargetId === candidate.targetId &&
      nextDragState.hoverPosition === candidate.position
    ) {
      return;
    }

    nextDragState.hoverTargetId = candidate.targetId;
    nextDragState.hoverPosition = candidate.position;
    clearPlatformHoverTimer();
    nextDragState.hoverTimer = globalThis.setTimeout(() => {
      movePlatformPlaceholder(workbench, placeholder, candidate.target, candidate.position);
      updatePlatformHoverIndicator(workbench, candidate.target, candidate.position);
    }, PLATFORM_REORDER_HOVER_DELAY_MS);
  };

  const finalizeDrag = (cancelled) => {
    if (nextDragState.isFinalizing) {
      return;
    }
    nextDragState.isFinalizing = true;
    clearPlatformHoverTimer();
    clearPlatformDropIndicators(workbench);

    if (cancelled && placeholder.parentNode) {
      const siblingSections = getPlatformSectionNodes(workbench).filter((item) => item !== placeholder);
      const restoreBefore = siblingSections[Math.max(0, nextDragState.sourceIndex)] || null;
      if (restoreBefore instanceof HTMLElement) {
        placeholder.parentNode.insertBefore(placeholder, restoreBefore);
      } else {
        placeholder.parentNode.appendChild(placeholder);
      }
    }

    placeholder.replaceWith(section);
    cleanupPlatformDragState({ keepPlaceholder: true });

    if (cancelled) {
      editStatusMessage.value = "已取消平台重排。";
      return;
    }

    const nextOrder = getCurrentRenderedPlatformOrder(workbench);
    if (nextOrder.length) {
      platformOrderDraft.value = nextOrder.slice();
      void persistPlatformOrder(nextOrder);
    }
  };

  nextDragState.onPointerMove = (moveEvent) => {
    updatePlatformDragGhostPosition(nextDragState, moveEvent.clientX, moveEvent.clientY);
    maybeAutoScrollPlatformWorkbench(moveEvent.clientY);
    handleHoverCandidate(moveEvent.clientY);
  };
  nextDragState.onPointerUp = () => {
    finalizeDrag(false);
  };
  nextDragState.onKeyDown = (keyEvent) => {
    if (keyEvent.key === "Escape") {
      finalizeDrag(true);
    }
  };

  dragState = nextDragState;
  updatePlatformDragGhostPosition(nextDragState, event.clientX, event.clientY);
  handleHoverCandidate(event.clientY);
  window.addEventListener("pointermove", nextDragState.onPointerMove);
  window.addEventListener("pointerup", nextDragState.onPointerUp, { once: true });
  window.addEventListener("pointercancel", nextDragState.onPointerUp, { once: true });
  window.addEventListener("keydown", nextDragState.onKeyDown);
}

onBeforeUnmount(() => {
  cleanupPlatformDragState();
});
</script>

<template>
  <div class="platform-grid">
    <section class="hero">
      <div class="hero-top">
        <div>
          <span class="hero-kicker">FUNCTION PANEL</span>
          <h1>标注脚本中心</h1>
          <p>
            功能面板只保留启停与详情入口；扩展版本下载统一进入脚本下载中心，后端设置与系统概况统一进入系统管理。
          </p>
        </div>
        <div class="hero-badges">
          <button class="ghost-button" type="button" @click="router.push('/downloads')">脚本下载中心</button>
          <button
            id="stage-label"
            class="badge stage"
            type="button"
            @click="router.push(authStore.isUnlocked ? '/admin/overview' : '/admin/unlock')"
          >
            系统管理
          </button>
        </div>
      </div>

      <div class="public-summary-strip">
        <div class="public-summary-card">
          <span class="summary-label">平台总数</span>
          <strong>{{ scriptsStore.visiblePlatforms.length }}</strong>
          <span class="summary-note">按平台分组管理脚本卡。</span>
        </div>
        <div class="public-summary-card">
          <span class="summary-label">脚本总数</span>
          <strong>{{ scriptsStore.visibleScripts.length }}</strong>
          <span class="summary-note">功能面板直接管理启停。</span>
        </div>
        <div class="public-summary-card">
          <span class="summary-label">当前生效</span>
          <strong>{{ enabledCount }}</strong>
          <span class="summary-note">同步平台后只统计当前启用脚本。</span>
        </div>
      </div>
    </section>

    <section class="public-center-toolbar">
      <div class="public-center-toolbar-copy">
        <strong>功能面板工作台</strong>
        <span>{{ centerEditStatus }}</span>
      </div>
      <div class="public-center-toolbar-actions">
        <button
          id="public-center-edit-toggle"
          :class="editingOrder ? 'primary-button' : 'ghost-button'"
          type="button"
          @click="toggleEditMode"
        >
          {{ editingOrder ? "完成编辑" : "编辑顺序" }}
        </button>
      </div>
      <div id="public-center-edit-status" class="status-text public-center-edit-status">{{ centerEditStatus }}</div>
    </section>

    <div ref="workbenchRef" class="platform-workbench" :class="{ 'is-editing': editingOrder }">
      <section
        v-for="group in platformGroups"
        :key="group.id"
        class="platform-section platform-module"
        :class="{ 'is-editing': editingOrder }"
        :data-platform-id="group.id"
        @pointerdown="handlePlatformPointerDown($event, group.id)"
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
