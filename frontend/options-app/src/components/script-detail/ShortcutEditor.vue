<script setup>
import { onBeforeUnmount, ref } from "vue";
import {
  formatShortcut,
  getShortcutFromKeyboardEvent,
  getShortcutFromMouseEvent,
  normalizeShortcut,
} from "@/services/script-settings";

const model = defineModel({
  type: Object,
  default: () => ({}),
});

const props = defineProps({
  actions: {
    type: Array,
    default: () => [],
  },
});

const recordingKey = ref("");
const statusText = ref("");
let removeKeyboardListener = null;
let removeMouseListener = null;

function stopRecording(status = "") {
  if (typeof removeKeyboardListener === "function") {
    removeKeyboardListener();
  }
  if (typeof removeMouseListener === "function") {
    removeMouseListener();
  }
  removeKeyboardListener = null;
  removeMouseListener = null;
  recordingKey.value = "";
  statusText.value = status;
}

function applyShortcut(actionKey, shortcut) {
  if (!recordingKey.value || recordingKey.value !== actionKey || shortcut === false) {
    return;
  }
  if (!shortcut) {
    stopRecording("已取消快捷键录制。");
    return;
  }
  model.value = {
    ...(model.value || {}),
    [actionKey]: normalizeShortcut(shortcut),
  };
  stopRecording("快捷键已录制，保存设置后生效。");
}

function startRecording(actionKey) {
  stopRecording("");
  recordingKey.value = actionKey;
  const action = props.actions.find((item) => item.key === actionKey);
  statusText.value = `正在录制「${action?.label || actionKey}」：按键盘组合，Esc 取消。`;

  const keyboardListener = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }
    applyShortcut(actionKey, getShortcutFromKeyboardEvent(event));
  };
  const mouseListener = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }
    applyShortcut(actionKey, getShortcutFromMouseEvent(event));
  };

  window.addEventListener("keydown", keyboardListener, true);
  window.addEventListener("mousedown", mouseListener, true);
  removeKeyboardListener = () => window.removeEventListener("keydown", keyboardListener, true);
  removeMouseListener = () => window.removeEventListener("mousedown", mouseListener, true);
}

function clearShortcut(actionKey) {
  model.value = {
    ...(model.value || {}),
    [actionKey]: null,
  };
  if (recordingKey.value === actionKey) {
    stopRecording("已取消快捷键录制。");
    return;
  }
  statusText.value = "快捷键已删除，保存设置后生效。";
}

onBeforeUnmount(() => {
  stopRecording("");
});
</script>

<template>
  <div class="shortcut-grid">
    <div
      v-for="action in actions"
      :key="action.key"
      class="shortcut-row"
    >
      <strong class="shortcut-label">{{ action.label }}</strong>
      <span class="shortcut-value">
        {{ recordingKey === action.key ? "录制中..." : formatShortcut(model?.[action.key]) }}
      </span>
      <button type="button" class="soft-button" @click="startRecording(action.key)">
        {{ recordingKey === action.key ? "录制中" : "录制" }}
      </button>
      <button type="button" class="ghost-button" @click="clearShortcut(action.key)">
        删除
      </button>
    </div>
    <p v-if="statusText" class="field-note">{{ statusText }}</p>
  </div>
</template>
