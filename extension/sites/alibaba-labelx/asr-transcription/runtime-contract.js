(function () {
  const PAGE_WORLD_BRIDGE = {
    channel: "alibaba-labelx",
    version: "1",
    globalKey: "__ASREdgeAlibabaLabelxPageBridge",
    readyEvent: "ASREdge:AlibabaLabelx:PageBridgeReady",
    requestEvent: "ASREdge:AlibabaLabelx:PageBridgeRequest",
    responseEvent: "ASREdge:AlibabaLabelx:PageBridgeResponse",
    statusAttribute: "data-asr-edge-page-bridge",
  };

  const RUNTIME_MODULES = [
    {
      id: "siteContract",
      globalKey: "__ASREdgeAlibabaLabelxSiteContract",
      required: true,
      phase: "contract",
    },
    {
      id: "pageDetector",
      globalKey: "__ASREdgePageDetector",
      required: true,
      phase: "contract",
    },
    {
      id: "routeObserver",
      globalKey: "__ASREdgeRouteObserver",
      required: true,
      phase: "routing",
    },
    {
      id: "pageStateCollector",
      globalKey: "__ASREdgePageStateCollector",
      required: true,
      phase: "state",
    },
    {
      id: "annotationRuntimeConfig",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationRuntimeConfig",
      required: false,
      phase: "interaction",
    },
    {
      id: "annotationActiveItem",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationActiveItem",
      required: false,
      phase: "interaction",
    },
    {
      id: "annotationDurationController",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationDurationController",
      required: false,
      phase: "interaction",
    },
    {
      id: "annotationAudioController",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationAudioController",
      required: false,
      phase: "interaction",
    },
    {
      id: "annotationInteractionRunner",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationInteractionRunner",
      required: false,
      phase: "interaction",
    },
    {
      id: "annotationToolbar",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationToolbar",
      required: false,
      phase: "interaction",
    },
    {
      id: "annotationShortcutBus",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationShortcutBus",
      required: false,
      phase: "interaction",
    },
    {
      id: "legacyApiClient",
      globalKey: "__ASREdgeAlibabaLabelxLegacyApiClient",
      required: false,
      phase: "interaction",
    },
    {
      id: "legacyUserContext",
      globalKey: "__ASREdgeAlibabaLabelxLegacyUserContext",
      required: false,
      phase: "interaction",
    },
    {
      id: "legacyDictionarySync",
      globalKey: "__ASREdgeAlibabaLabelxLegacyDictionarySync",
      required: false,
      phase: "interaction",
    },
    {
      id: "legacyVersionCheck",
      globalKey: "__ASREdgeAlibabaLabelxLegacyVersionCheck",
      required: false,
      phase: "ui",
    },
    {
      id: "annotationItemCollector",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationItemCollector",
      required: true,
      phase: "annotation-read",
    },
    {
      id: "annotationItemValidator",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationItemValidator",
      required: true,
      phase: "annotation-read",
    },
    {
      id: "annotationFeedback",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationFeedback",
      required: true,
      phase: "annotation-read",
    },
    {
      id: "annotationItemWriter",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationItemWriter",
      required: true,
      phase: "annotation-write",
    },
    {
      id: "annotationValidityWriter",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationValidityWriter",
      required: true,
      phase: "annotation-write",
    },
    {
      id: "annotationTextPipeline",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationTextPipeline",
      required: true,
      phase: "annotation-write",
    },
    {
      id: "annotationQuickfillRunner",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationQuickfillRunner",
      required: true,
      phase: "annotation-write",
    },
    {
      id: "annotationApplyRunner",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationApplyRunner",
      required: true,
      phase: "annotation-flow",
    },
    {
      id: "annotationApplyPolicy",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationApplyPolicy",
      required: true,
      phase: "annotation-flow",
    },
    {
      id: "annotationPolicyExecutor",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationPolicyExecutor",
      required: true,
      phase: "annotation-flow",
    },
    {
      id: "annotationPagePlanPreview",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationPagePlanPreview",
      required: true,
      phase: "annotation-flow",
    },
    {
      id: "annotationPageReport",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationPageReport",
      required: true,
      phase: "annotation-flow",
    },
    {
      id: "annotationPageApplyRunner",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationPageApplyRunner",
      required: true,
      phase: "annotation-flow",
    },
    {
      id: "annotationFlowReport",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationFlowReport",
      required: true,
      phase: "annotation-flow",
    },
    {
      id: "annotationControlPanel",
      globalKey: "__ASREdgeAlibabaLabelxAnnotationControlPanel",
      required: false,
      phase: "ui",
    },
    {
      id: "settingsPanel",
      globalKey: "__ASREdgeAlibabaLabelxSettingsPanel",
      required: false,
      phase: "ui",
    },
    {
      id: "runtimeGate",
      globalKey: "__ASREdgeAlibabaLabelxRuntimeGate",
      required: true,
      phase: "gate",
    },
    {
      id: "runtimeDebug",
      globalKey: "__ASREdgeAlibabaLabelxRuntimeDebug",
      required: true,
      phase: "debug",
    },
  ];

  const STARTUP_SEQUENCE = [
    "page-world-bridge",
    "contract",
    "routing",
    "state",
    "interaction",
    "annotation-read",
    "annotation-write",
    "annotation-flow",
    "gate",
    "debug",
    "content-assembly",
  ];

  function getModuleDescriptor(moduleId) {
    return RUNTIME_MODULES.find(function (moduleDescriptor) {
      return moduleDescriptor.id === moduleId;
    }) || null;
  }

  function getRequiredModuleIds() {
    return RUNTIME_MODULES.filter(function (moduleDescriptor) {
      return moduleDescriptor.required !== false;
    }).map(function (moduleDescriptor) {
      return moduleDescriptor.id;
    });
  }

  globalThis.__ASREdgeAlibabaLabelxRuntimeContract = {
    STAGE_ID: "basic-transcription-foundation",
    PAGE_WORLD_BRIDGE: PAGE_WORLD_BRIDGE,
    RUNTIME_MODULES: RUNTIME_MODULES,
    STARTUP_SEQUENCE: STARTUP_SEQUENCE,
    getModuleDescriptor: getModuleDescriptor,
    getRequiredModuleIds: getRequiredModuleIds,
  };
})();
