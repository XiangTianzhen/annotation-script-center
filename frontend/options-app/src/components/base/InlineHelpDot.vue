<script>
import { computed, defineComponent, nextTick, onBeforeUnmount, ref, watch } from "vue";

let helpDotSequence = 0;
const activeHelpId = ref("");
const activeHelpText = ref("");
const activeHelpMode = ref("");
const activeAnchorNode = ref(null);
let globalPopoverNode = null;

function ensureGlobalPopoverNode() {
  const existingNodes = Array.from(document.body.querySelectorAll(".inline-help-popover"));
  if (existingNodes.length > 1) {
    existingNodes.slice(1).forEach((node) => node.remove());
  }

  const currentNode = existingNodes[0] || globalPopoverNode;
  if (currentNode instanceof HTMLElement && document.body.contains(currentNode)) {
    globalPopoverNode = currentNode;
    return currentNode;
  }

  const node = document.createElement("div");
  node.className = "inline-help-popover";
  document.body.appendChild(node);
  globalPopoverNode = node;
  return node;
}

function hideGlobalPopover() {
  if (!(globalPopoverNode instanceof HTMLElement) || !document.body.contains(globalPopoverNode)) {
    return;
  }
  globalPopoverNode.classList.remove("visible");
  globalPopoverNode.textContent = "";
  globalPopoverNode.style.left = "0px";
  globalPopoverNode.style.top = "0px";
}

export default defineComponent({
  name: "InlineHelpDot",
  props: {
    text: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    const anchorRef = ref(null);
    const instanceId = `inline-help-${++helpDotSequence}`;

    const helpText = computed(() => String(props.text || "").trim());
    const visible = computed(
      () =>
        Boolean(helpText.value) &&
        activeHelpId.value === instanceId &&
        activeHelpText.value === helpText.value
    );

    function closePopover() {
      if (activeHelpId.value !== instanceId) {
        return;
      }
      activeHelpId.value = "";
      activeHelpText.value = "";
      activeHelpMode.value = "";
      activeAnchorNode.value = null;
      hideGlobalPopover();
    }

    async function syncPopoverPosition() {
      if (!visible.value) {
        return;
      }
      await nextTick();
      const anchor = anchorRef.value;
      const popover = ensureGlobalPopoverNode();
      if (!(anchor instanceof HTMLElement) || !(popover instanceof HTMLElement)) {
        return;
      }

      popover.textContent = helpText.value;
      popover.classList.add("visible");
      popover.style.left = "0px";
      popover.style.top = "0px";

      const anchorRect = anchor.getBoundingClientRect();
      const margin = 12;
      const viewportWidth = globalThis.innerWidth || document.documentElement.clientWidth || 0;
      const viewportHeight = globalThis.innerHeight || document.documentElement.clientHeight || 0;
      popover.style.maxWidth = `${Math.max(220, viewportWidth - margin * 2)}px`;
      const popoverRect = popover.getBoundingClientRect();

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

      popover.style.left = `${Math.round(left)}px`;
      popover.style.top = `${Math.round(top)}px`;
    }

    function openPopover(mode) {
      if (!helpText.value) {
        return;
      }
      activeHelpId.value = instanceId;
      activeHelpText.value = helpText.value;
      activeHelpMode.value = mode;
      activeAnchorNode.value = anchorRef.value;
      void syncPopoverPosition();
    }

    function handleDocumentPointerDown(event) {
      const anchor = activeAnchorNode.value;
      const popover = ensureGlobalPopoverNode();
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
      if (activeHelpMode.value === "pin") {
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
      if (activeHelpId.value === instanceId && activeHelpMode.value === "pin") {
        closePopover();
        return;
      }
      openPopover("pin");
    }

    function handleMouseLeave() {
      if (activeHelpId.value === instanceId && activeHelpMode.value === "hover") {
        closePopover();
      }
    }

    function handleBlur() {
      if (activeHelpId.value === instanceId && activeHelpMode.value === "focus") {
        closePopover();
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
      closePopover();
      document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
      document.removeEventListener("keydown", handleDocumentKeydown, true);
      window.removeEventListener("resize", handleWindowChange, true);
      window.removeEventListener("scroll", handleWindowChange, true);
      hideGlobalPopover();
    });

    return {
      activeHelpMode,
      anchorRef,
      handleBlur,
      handleMouseLeave,
      helpText,
      openPopover,
      togglePinned,
    };
  },
});
</script>

<template>
  <span
    v-if="helpText"
    ref="anchorRef"
    class="inline-help-anchor"
    @mouseenter="openPopover('hover')"
    @mouseleave="handleMouseLeave"
  >
    <span
      class="inline-help-dot"
      tabindex="0"
      :title="helpText"
      :data-help-text="helpText"
      @focus="openPopover('focus')"
      @blur="handleBlur"
      @click.prevent.stop="togglePinned"
      @keydown.enter.prevent="togglePinned"
      @keydown.space.prevent="togglePinned"
    >?</span>
  </span>
</template>
