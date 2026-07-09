<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  text: {
    type: String,
    default: "",
  },
});

const anchorRef = ref(null);
const popoverRef = ref(null);
const hovered = ref(false);
const pinned = ref(false);
const focused = ref(false);
const popoverStyle = ref({
  left: "0px",
  top: "0px",
  maxWidth: "320px",
});

const helpText = computed(() => String(props.text || "").trim());
const visible = computed(() => Boolean(helpText.value) && (hovered.value || pinned.value || focused.value));

function closePopover() {
  hovered.value = false;
  pinned.value = false;
  focused.value = false;
}

async function syncPopoverPosition() {
  if (!visible.value) {
    return;
  }
  await nextTick();
  const anchor = anchorRef.value;
  const popover = popoverRef.value;
  if (!(anchor instanceof HTMLElement) || !(popover instanceof HTMLElement)) {
    return;
  }
  const anchorRect = anchor.getBoundingClientRect();
  const popoverRect = popover.getBoundingClientRect();
  const margin = 12;
  const viewportWidth = globalThis.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = globalThis.innerHeight || document.documentElement.clientHeight || 0;

  let left = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2;
  let top = anchorRect.bottom + 10;

  if (left + popoverRect.width > viewportWidth - margin) {
    left = viewportWidth - popoverRect.width - margin;
  }
  if (left < margin) {
    left = margin;
  }

  if (top + popoverRect.height > viewportHeight - margin) {
    top = anchorRect.top - popoverRect.height - 10;
  }
  if (top < margin) {
    top = margin;
  }

  popoverStyle.value = {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
    maxWidth: `${Math.max(220, viewportWidth - margin * 2)}px`,
  };
}

function handleDocumentPointerDown(event) {
  const anchor = anchorRef.value;
  const popover = popoverRef.value;
  const target = event.target;
  if (
    (anchor instanceof HTMLElement && anchor.contains(target)) ||
    (popover instanceof HTMLElement && popover.contains(target))
  ) {
    return;
  }
  closePopover();
}

function handleWindowChange() {
  if (pinned.value) {
    closePopover();
    return;
  }
  void syncPopoverPosition();
}

function handleDocumentKeydown(event) {
  if (String(event?.key || "") !== "Escape") {
    return;
  }
  closePopover();
}

function togglePinned() {
  pinned.value = !pinned.value;
  if (pinned.value) {
    hovered.value = true;
  }
}

watch(visible, async (nextVisible) => {
  if (nextVisible) {
    await syncPopoverPosition();
    document.addEventListener("pointerdown", handleDocumentPointerDown, true);
    document.addEventListener("keydown", handleDocumentKeydown, true);
    window.addEventListener("resize", handleWindowChange, true);
    window.addEventListener("scroll", handleWindowChange, true);
    return;
  }
  document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
  document.removeEventListener("keydown", handleDocumentKeydown, true);
  window.removeEventListener("resize", handleWindowChange, true);
  window.removeEventListener("scroll", handleWindowChange, true);
});

watch(helpText, () => {
  if (!helpText.value) {
    closePopover();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
  document.removeEventListener("keydown", handleDocumentKeydown, true);
  window.removeEventListener("resize", handleWindowChange, true);
  window.removeEventListener("scroll", handleWindowChange, true);
});
</script>

<template>
  <span
    v-if="helpText"
    ref="anchorRef"
    class="inline-help-anchor"
    @mouseenter="() => { hovered = true; syncPopoverPosition(); }"
    @mouseleave="() => { if (!pinned) hovered = false; }"
  >
    <span
      class="inline-help-dot"
      tabindex="0"
      :title="helpText"
      :data-help-text="helpText"
      @focus="() => { focused = true; syncPopoverPosition(); }"
      @blur="() => { if (!pinned) focused = false; }"
      @click.prevent.stop="togglePinned"
      @keydown.enter.prevent="togglePinned"
      @keydown.space.prevent="togglePinned"
    >?</span>

    <Teleport to="body">
      <div
        v-if="visible"
        ref="popoverRef"
        class="inline-help-popover visible"
        :style="popoverStyle"
      >
        {{ helpText }}
      </div>
    </Teleport>
  </span>
</template>
