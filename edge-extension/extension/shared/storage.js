/**
 * @fileoverview Shared chrome.storage helpers with legacy-settings compatibility.
 */

(function () {
  function getConstants() {
    return globalThis.ASREdgeConstants || {
      STORAGE_KEY: "asrEdgeSettings",
      DEFAULT_SETTINGS: {
        platforms: {
          alibabaLabelx: {
            enabled: true,
            scriptCenter: {
              activeProjectId: "transcription",
              projects: {},
            },
            annotation: {
              shortcuts: {},
              customReplacements: [],
              customRates: [],
            },
            automation: {},
            aiPunctuation: {},
            dictionary: {},
            safety: {},
            legacyServer: {},
            reporting: {},
          },
          lightwheel: {
            enabled: false,
            scripts: {
              viewPanel: {
                id: "lightwheelViewPanel",
                enabled: false,
              },
            },
          },
        },
        asr: {},
        debug: {
          enabled: false,
        },
        cache: {},
        meta: {
          schemaVersion: 7,
        },
      },
      DEFAULT_ASR_CONFIG: {},
      DEFAULT_JUDGEMENT_ASR_CONFIG: {},
      DEFAULT_LIGHTWHEEL_PLATFORM_SETTINGS: {},
      SCRIPT_PROJECTS: {},
      SCRIPT_LIBRARY: {},
      TRANSCRIPTION_PROJECT_ID: "transcription",
      JUDGEMENT_PROJECT_ID: "judgement",
      LIGHTWHEEL_VIEW_PANEL_SCRIPT_ID: "lightwheelViewPanel",
      JUDGEMENT_PROJECT_ASR_KEYS: [
        "itemsPerPage",
        "autoPlay",
        "autoResetRate",
        "resetRateValue",
        "playbackRateValue",
        "rateStepValue",
        "volumeValue",
        "shortcuts",
      ],
      SHORTCUT_COMPATIBILITY_MAP: {},
    };
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }

  function hasOwn(target, key) {
    return Object.prototype.hasOwnProperty.call(target, key);
  }

  function deepMerge(base, override) {
    const source = isPlainObject(base) ? base : {};
    const patch = isPlainObject(override) ? override : {};
    const result = { ...source };

    Object.keys(patch).forEach(function (key) {
      if (isPlainObject(source[key]) && isPlainObject(patch[key])) {
        result[key] = deepMerge(source[key], patch[key]);
        return;
      }

      result[key] = clone(patch[key]);
    });

    return result;
  }

  function normalizeShortcut(shortcut, fallback) {
    const base = isPlainObject(fallback) ? fallback : {};
    const input = isPlainObject(shortcut) ? shortcut : {};

    return {
      ctrl: input.ctrl === true || base.ctrl === true,
      alt: input.alt === true || base.alt === true,
      shift: input.shift === true || base.shift === true,
      meta: input.meta === true || base.meta === true,
      key:
        typeof input.key === "string"
          ? input.key
          : typeof base.key === "string"
            ? base.key
            : null,
      button:
        typeof input.button === "number"
          ? input.button
          : typeof base.button === "number"
            ? base.button
            : null,
    };
  }

  function normalizeReplacementRules(rules) {
    return Array.isArray(rules)
      ? rules
          .map(function (rule) {
            return {
              from: typeof rule?.from === "string" ? rule.from : "",
              to: typeof rule?.to === "string" ? rule.to : "",
            };
          })
          .filter(function (rule) {
            return rule.from.trim().length > 0 || rule.to.trim().length > 0;
          })
      : [];
  }

  function normalizeCustomRates(rates, fallback) {
    const defaults = Array.isArray(fallback) ? fallback : [];
    const source = Array.isArray(rates) ? rates : defaults;
    return source.map(function (entry, index) {
      const base = defaults[index] || {};
      const rateValue =
        typeof entry?.rate === "number"
          ? entry.rate
          : typeof base.rate === "number"
            ? base.rate
            : 1.0;

      return {
        rate: Math.max(0.1, Math.min(8, Number(rateValue) || 1.0)),
        shortcut:
          entry?.shortcut === null
            ? null
            : normalizeShortcut(entry?.shortcut, base.shortcut || null),
      };
    });
  }

  function normalizeNumber(value, fallback) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
  }

  const JUDGEMENT_ITEMS_PER_PAGE_VALUES = [
    "1 条/页",
    "2 条/页",
    "3 条/页",
    "4 条/页",
    "5 条/页",
    "10 条/页",
    "20 条/页",
    "30 条/页",
    "40 条/页",
    "50 条/页",
    "100 条/页",
    "150 条/页",
    "200 条/页",
    "400 条/页",
  ];

  function normalizeJudgementItemsPerPage(value, fallback) {
    const text = typeof value === "string" ? value.trim() : "";
    if (
      text === "all" ||
      text === "全部" ||
      text === "全部/400条" ||
      text === "全部（400 条）" ||
      text === "全部（400条）" ||
      text === "400 条/页" ||
      text === "400条/页"
    ) {
      return "400 条/页";
    }

    if (JUDGEMENT_ITEMS_PER_PAGE_VALUES.indexOf(text) >= 0) {
      return text;
    }

    return JUDGEMENT_ITEMS_PER_PAGE_VALUES.indexOf(fallback) >= 0 ? fallback : "100 条/页";
  }

  function normalizeJudgementAsrConfig(config) {
    const constants = getConstants();
    const fallback = constants.DEFAULT_JUDGEMENT_ASR_CONFIG?.itemsPerPage || "100 条/页";
    const nextConfig = isPlainObject(config) ? config : {};
    nextConfig.itemsPerPage = normalizeJudgementItemsPerPage(
      nextConfig.itemsPerPage,
      fallback
    );
    return nextConfig;
  }

  function createStoragePromise(method, payload) {
    if (!chrome?.storage?.local?.[method]) {
      return Promise.resolve(method === "get" ? {} : undefined);
    }

    return new Promise(function (resolve, reject) {
      chrome.storage.local[method](payload, function (result) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve(result);
      });
    });
  }

  async function getStoredValue() {
    const constants = getConstants();
    const result = await createStoragePromise("get", constants.STORAGE_KEY);
    return result?.[constants.STORAGE_KEY] || {};
  }

  async function setStoredValue(settings) {
    const constants = getConstants();
    await createStoragePromise("set", {
      [constants.STORAGE_KEY]: settings,
    });
    return settings;
  }

  function ensurePlatformRoot(settings) {
    if (!isPlainObject(settings.platforms)) {
      settings.platforms = {};
    }

    if (!isPlainObject(settings.platforms.alibabaLabelx)) {
      settings.platforms.alibabaLabelx = {};
    }

    return settings.platforms.alibabaLabelx;
  }

  function ensureLightwheelRoot(settings) {
    const constants = getConstants();
    const defaults = clone(constants.DEFAULT_SETTINGS || {});

    if (!isPlainObject(settings.platforms)) {
      settings.platforms = {};
    }

    settings.platforms.lightwheel = deepMerge(
      defaults?.platforms?.lightwheel || constants.DEFAULT_LIGHTWHEEL_PLATFORM_SETTINGS || {},
      settings.platforms.lightwheel || {}
    );

    return settings.platforms.lightwheel;
  }

  function getProjectDefinitions(constants) {
    return isPlainObject(constants?.SCRIPT_PROJECTS) ? constants.SCRIPT_PROJECTS : {};
  }

  function normalizeProjectId(projectId, constants) {
    const definitions = getProjectDefinitions(constants);
    if (typeof projectId === "string" && hasOwn(definitions, projectId)) {
      return projectId;
    }

    return String(constants?.TRANSCRIPTION_PROJECT_ID || "transcription");
  }

  function pickAsrFields(source, allowedKeys) {
    const result = {};
    const input = isPlainObject(source) ? source : {};
    const keys = Array.isArray(allowedKeys) ? allowedKeys : [];

    keys.forEach(function (key) {
      if (hasOwn(input, key)) {
        result[key] = clone(input[key]);
      }
    });

    return result;
  }

  function ensureScriptCenter(settings) {
    const constants = getConstants();
    const defaults = clone(constants.DEFAULT_SETTINGS || {});
    const platform = ensurePlatformRoot(settings);
    const defaultCenter = defaults?.platforms?.alibabaLabelx?.scriptCenter || {
      activeProjectId: constants.TRANSCRIPTION_PROJECT_ID || "transcription",
      projects: {},
    };
    const activeProjectId = normalizeProjectId(
      platform?.scriptCenter?.activeProjectId || defaultCenter.activeProjectId,
      constants
    );
    const definitions = getProjectDefinitions(constants);

    platform.scriptCenter = deepMerge(defaultCenter, platform.scriptCenter || {});
    platform.scriptCenter.activeProjectId = activeProjectId;

    if (!isPlainObject(platform.scriptCenter.projects)) {
      platform.scriptCenter.projects = {};
    }

    Object.keys(definitions).forEach(function (projectId) {
      const definition = definitions[projectId];
      const defaultProject = defaultCenter?.projects?.[projectId] || {};
      const nextProject = deepMerge(defaultProject, platform.scriptCenter.projects[projectId] || {});

      nextProject.id = definition.id;
      nextProject.label = definition.label;
      nextProject.shortLabel = definition.shortLabel;
      nextProject.description = definition.description;
      nextProject.note = definition.note;
      nextProject.capabilityScope = definition.capabilityScope;
      nextProject.active = projectId === activeProjectId;

      if (projectId === constants.JUDGEMENT_PROJECT_ID) {
        nextProject.asrConfig = normalizeJudgementAsrConfig(
          deepMerge(
            constants.DEFAULT_JUDGEMENT_ASR_CONFIG || {},
            nextProject.asrConfig || {}
          )
        );
      } else {
        const fallbackAsrConfig =
          isPlainObject(nextProject.asrConfig) && Object.keys(nextProject.asrConfig).length > 0
            ? nextProject.asrConfig
            : settings.asr || {};
        nextProject.asrConfig = deepMerge(constants.DEFAULT_ASR_CONFIG || {}, fallbackAsrConfig);
      }

      platform.scriptCenter.projects[projectId] = nextProject;
    });

    return platform.scriptCenter;
  }

  function resolveProjectAsrConfig(settings, projectId) {
    const constants = getConstants();
    const scriptCenter = ensureScriptCenter(settings);
    const normalizedProjectId = normalizeProjectId(projectId, constants);
    const projectConfig = scriptCenter?.projects?.[normalizedProjectId]?.asrConfig || {};
    const defaultProjectConfig =
      normalizedProjectId === constants.JUDGEMENT_PROJECT_ID
        ? constants.DEFAULT_JUDGEMENT_ASR_CONFIG || {}
        : constants.DEFAULT_ASR_CONFIG || {};

    const nextConfig = deepMerge(defaultProjectConfig, projectConfig);
    return normalizedProjectId === constants.JUDGEMENT_PROJECT_ID
      ? normalizeJudgementAsrConfig(nextConfig)
      : nextConfig;
  }

  function syncProjectCenterFromActiveAsr(settings) {
    const constants = getConstants();
    const scriptCenter = ensureScriptCenter(settings);
    const activeProjectId = normalizeProjectId(scriptCenter.activeProjectId, constants);

    Object.keys(scriptCenter.projects || {}).forEach(function (projectId) {
      scriptCenter.projects[projectId].active = projectId === activeProjectId;
    });

    if (activeProjectId === constants.JUDGEMENT_PROJECT_ID) {
      scriptCenter.projects[activeProjectId].asrConfig = normalizeJudgementAsrConfig(
        deepMerge(
          constants.DEFAULT_JUDGEMENT_ASR_CONFIG || {},
          pickAsrFields(settings.asr || {}, constants.JUDGEMENT_PROJECT_ASR_KEYS || [])
        )
      );
      return;
    }

    scriptCenter.projects[activeProjectId].asrConfig = deepMerge(
      constants.DEFAULT_ASR_CONFIG || {},
      settings.asr || {}
    );
  }

  function getPatchedActiveProjectId(patch) {
    const projectId = patch?.platforms?.alibabaLabelx?.scriptCenter?.activeProjectId;
    return typeof projectId === "string" ? projectId : null;
  }

  function syncNestedFromAsr(settings) {
    const constants = getConstants();
    const defaults = clone(constants.DEFAULT_SETTINGS || {});
    const defaultPlatform = defaults?.platforms?.alibabaLabelx || {};
    const defaultAsr = defaults?.asr || constants.DEFAULT_ASR_CONFIG || {};
    const platform = ensurePlatformRoot(settings);
    const asr = deepMerge(defaultAsr, settings.asr || {});
    const debug = deepMerge(defaults.debug || { enabled: false }, settings.debug || {});

    platform.annotation = deepMerge(defaultPlatform.annotation || {}, platform.annotation || {});
    platform.automation = deepMerge(defaultPlatform.automation || {}, platform.automation || {});
    platform.aiPunctuation = deepMerge(
      defaultPlatform.aiPunctuation || {},
      platform.aiPunctuation || {}
    );
    platform.dictionary = deepMerge(defaultPlatform.dictionary || {}, platform.dictionary || {});
    platform.safety = deepMerge(defaultPlatform.safety || {}, platform.safety || {});
    platform.legacyServer = deepMerge(
      defaultPlatform.legacyServer || {},
      platform.legacyServer || {}
    );
    platform.reporting = deepMerge(defaultPlatform.reporting || {}, platform.reporting || {});

    platform.annotation.itemsPerPage = asr.itemsPerPage || platform.annotation.itemsPerPage;
    platform.annotation.autoPlay = asr.autoPlay === true;
    platform.annotation.defaultValid = asr.defaultValid === true;
    platform.annotation.fillOnValid = asr.fillOnValid !== false;
    platform.annotation.clearOnInvalid = asr.clearOnInvalid !== false;
    platform.annotation.autoNext = asr.autoNext === true;
    platform.annotation.autoBatchSubmit = asr.autoBatchSubmit === true;
    platform.annotation.autoResetRate = asr.autoResetRate === true;
    platform.annotation.resetRateValue = normalizeNumber(asr.resetRateValue, 1.0);
    platform.annotation.volumeValue = normalizeNumber(asr.volumeValue, 100);
    platform.annotation.autoReceiveOnSubmit = asr.autoReceiveOnSubmit === true;
    platform.annotation.validateBeforeSubmit = asr.validateBeforeSubmit === true;
    platform.annotation.autoClearInvalidValidation = asr.autoClearInvalidValidation === true;
    platform.annotation.autoFillOnValidValidation = asr.autoFillOnValidValidation === true;
    platform.annotation.autoSubmitAfterValidation = asr.autoSubmitAfterValidation === true;
    platform.annotation.autoFillOnLoad = asr.autoFillOnLoad === true;
    platform.annotation.numConvertMode =
      asr.numConvertMode === "蜂鸟众包" ? "蜂鸟众包" : "千问";
    platform.annotation.customReplacements = normalizeReplacementRules(
      asr.customReplacements || platform.annotation.customReplacements
    );
    platform.annotation.customRates = normalizeCustomRates(
      asr.customRates,
      defaultPlatform.annotation?.customRates || []
    );

    const defaultShortcuts = defaultPlatform.annotation?.shortcuts || {};
    const compatibilityMap = constants.SHORTCUT_COMPATIBILITY_MAP || {};
    platform.annotation.shortcuts = deepMerge(defaultShortcuts, platform.annotation.shortcuts || {});
    Object.keys(compatibilityMap).forEach(function (shortcutKey) {
      const asrKey = compatibilityMap[shortcutKey];
      platform.annotation.shortcuts[shortcutKey] = normalizeShortcut(
        asr[asrKey],
        platform.annotation.shortcuts[shortcutKey]
      );
    });

    platform.automation.autoAssignCheckTasks = asr.autoAssignCheckTasks === true;
    platform.automation.autoAssignTaskKeyword = String(asr.autoAssignTaskKeyword || "");
    platform.automation.autoAssignTargetUser = String(asr.autoAssignTargetUser || "");
    platform.automation.autoAssignBatchSize = Math.max(
      1,
      normalizeNumber(asr.autoAssignBatchSize, 99999)
    );
    platform.automation.autoAssignAllTasks = asr.autoAssignAllTasks === true;
    platform.automation.autoAssignFetchAll = asr.autoAssignFetchAll !== false;
    platform.automation.autoAssignPollIntervalMs = Math.max(
      5000,
      normalizeNumber(asr.autoAssignPollIntervalMs, platform.automation.autoAssignPollIntervalMs || 60000)
    );
    platform.automation.autoBatchSubmit = asr.autoBatchSubmit === true;
    platform.automation.autoFillOnLoad = asr.autoFillOnLoad === true;
    platform.automation.validateBeforeSubmit = asr.validateBeforeSubmit === true;
    platform.automation.autoSubmitAfterValidation = asr.autoSubmitAfterValidation === true;
    platform.automation.autoReceiveOnSubmit = asr.autoReceiveOnSubmit === true;
    platform.automation.autoPlay = asr.autoPlay === true;
    platform.automation.autoNext = asr.autoNext === true;
    platform.automation.defaultValid = asr.defaultValid === true;

    platform.aiPunctuation.apiKey = String(asr.qwenApiKey || "");
    platform.aiPunctuation.useAdvancedRules = asr.useAdvancedRules === true;
    platform.aiPunctuation.model = String(asr.qwenModel || platform.aiPunctuation.model || "");

    platform.dictionary.customReplacements = normalizeReplacementRules(
      asr.customReplacements || platform.dictionary.customReplacements
    );
    platform.reporting.itemsPerPage = asr.itemsPerPage || platform.reporting.itemsPerPage;
    if (platform.reporting.exportUploadEnabled !== false) {
      platform.reporting.exportUploadEnabled = true;
    }

    platform.legacyServer.useDebugApiBaseUrl = debug.enabled === true;
    settings.debug = debug;
  }

  function syncCompatibilityFromNested(settings) {
    const constants = getConstants();
    const defaults = clone(constants.DEFAULT_SETTINGS || {});
    const defaultAsr = defaults?.asr || constants.DEFAULT_ASR_CONFIG || {};
    const platform = ensurePlatformRoot(settings);
    const annotation = platform.annotation || {};
    const automation = platform.automation || {};
    const aiPunctuation = platform.aiPunctuation || platform.ai || {};
    const dictionary = platform.dictionary || {};
    const legacyServer = platform.legacyServer || {};
    const reporting = platform.reporting || {};
    const compatibilityMap = constants.SHORTCUT_COMPATIBILITY_MAP || {};
    const nextAsr = deepMerge(defaultAsr, settings.asr || {});

    nextAsr.itemsPerPage = reporting.itemsPerPage || annotation.itemsPerPage || nextAsr.itemsPerPage;
    nextAsr.autoPlay = annotation.autoPlay === true || automation.autoPlay === true;
    nextAsr.defaultValid =
      annotation.defaultValid === true || automation.defaultValid === true;
    nextAsr.fillOnValid = annotation.fillOnValid !== false;
    nextAsr.clearOnInvalid = annotation.clearOnInvalid !== false;
    nextAsr.autoNext = annotation.autoNext === true || automation.autoNext === true;
    nextAsr.autoAssignCheckTasks = automation.autoAssignCheckTasks === true;
    nextAsr.autoAssignTaskKeyword = String(automation.autoAssignTaskKeyword || "");
    nextAsr.autoAssignTargetUser = String(automation.autoAssignTargetUser || "");
    nextAsr.autoAssignBatchSize = Math.max(
      1,
      normalizeNumber(automation.autoAssignBatchSize, nextAsr.autoAssignBatchSize || 99999)
    );
    nextAsr.autoAssignAllTasks = automation.autoAssignAllTasks === true;
    nextAsr.autoAssignFetchAll = automation.autoAssignFetchAll !== false;
    nextAsr.autoAssignPollIntervalMs = Math.max(
      5000,
      normalizeNumber(automation.autoAssignPollIntervalMs, nextAsr.autoAssignPollIntervalMs || 60000)
    );
    nextAsr.autoBatchSubmit =
      annotation.autoBatchSubmit === true || automation.autoBatchSubmit === true;
    nextAsr.autoResetRate = annotation.autoResetRate === true;
    nextAsr.resetRateValue = normalizeNumber(annotation.resetRateValue, 1.0);
    nextAsr.volumeValue = normalizeNumber(annotation.volumeValue, 100);
    nextAsr.autoReceiveOnSubmit =
      annotation.autoReceiveOnSubmit === true || automation.autoReceiveOnSubmit === true;
    nextAsr.validateBeforeSubmit =
      annotation.validateBeforeSubmit === true || automation.validateBeforeSubmit === true;
    nextAsr.autoClearInvalidValidation = annotation.autoClearInvalidValidation === true;
    nextAsr.autoFillOnValidValidation = annotation.autoFillOnValidValidation === true;
    nextAsr.autoSubmitAfterValidation =
      annotation.autoSubmitAfterValidation === true ||
      automation.autoSubmitAfterValidation === true;
    nextAsr.autoFillOnLoad =
      annotation.autoFillOnLoad === true || automation.autoFillOnLoad === true;
    nextAsr.qwenApiKey = String(aiPunctuation.apiKey || aiPunctuation.qwenApiKey || "");
    nextAsr.useAdvancedRules = aiPunctuation.useAdvancedRules === true;
    nextAsr.qwenModel = String(
      aiPunctuation.model || aiPunctuation.qwenModel || nextAsr.qwenModel || ""
    );
    nextAsr.numConvertMode =
      annotation.numConvertMode === "蜂鸟众包" ? "蜂鸟众包" : "千问";
    nextAsr.customReplacements = normalizeReplacementRules(
      dictionary.customReplacements || annotation.customReplacements
    );
    nextAsr.customRates = normalizeCustomRates(
      annotation.customRates,
      defaults?.platforms?.alibabaLabelx?.annotation?.customRates || []
    );

    Object.keys(compatibilityMap).forEach(function (shortcutKey) {
      const asrKey = compatibilityMap[shortcutKey];
      nextAsr[asrKey] = normalizeShortcut(
        annotation.shortcuts?.[shortcutKey],
        nextAsr[asrKey]
      );
    });

    settings.asr = nextAsr;
    settings.debug = deepMerge(defaults.debug || {}, settings.debug || {});
    settings.debug.enabled = legacyServer.useDebugApiBaseUrl === true;
    settings.cache = deepMerge(defaults.cache || {}, settings.cache || {});
    settings.meta = deepMerge(defaults.meta || {}, settings.meta || {});
  }

  function normalizeSettings(input) {
    const constants = getConstants();
    const defaults = clone(constants.DEFAULT_SETTINGS || {});
    const settings = deepMerge(defaults, input || {});
    const currentSchemaVersion = Number(input?.meta?.schemaVersion || 0);

    ensureScriptCenter(settings);
    ensureLightwheelRoot(settings);

    const activeProjectId =
      settings?.platforms?.alibabaLabelx?.scriptCenter?.activeProjectId ||
      constants.TRANSCRIPTION_PROJECT_ID ||
      "transcription";
    const storedJudgementConfig =
      input?.platforms?.alibabaLabelx?.scriptCenter?.projects?.[
        constants.JUDGEMENT_PROJECT_ID
      ]?.asrConfig || {};
    if (
      activeProjectId === constants.JUDGEMENT_PROJECT_ID &&
      !hasOwn(storedJudgementConfig, "itemsPerPage")
    ) {
      settings.asr = isPlainObject(settings.asr) ? settings.asr : {};
      settings.asr.itemsPerPage =
        constants.DEFAULT_JUDGEMENT_ASR_CONFIG?.itemsPerPage || "100 条/页";
    }

    if (currentSchemaVersion < 6) {
      const judgementProject =
        settings?.platforms?.alibabaLabelx?.scriptCenter?.projects?.[constants.JUDGEMENT_PROJECT_ID] || null;
      if (judgementProject && isPlainObject(judgementProject.asrConfig)) {
        if (!isPlainObject(judgementProject.asrConfig.shortcuts)) {
          judgementProject.asrConfig.shortcuts = {};
        }

        [
          "choiceFirstBetter",
          "choiceSecondBetter",
          "choiceBothBad",
          "choiceUnsure",
          "choiceOtherDialect",
          "playPause",
        ].forEach(function (shortcutKey) {
          if (
            !hasOwn(judgementProject.asrConfig.shortcuts, shortcutKey) ||
            judgementProject.asrConfig.shortcuts[shortcutKey] === null
          ) {
            judgementProject.asrConfig.shortcuts[shortcutKey] = clone(
              constants.DEFAULT_JUDGEMENT_ASR_CONFIG?.shortcuts?.[shortcutKey] || null
            );
          }
        });
      }
    }

    syncNestedFromAsr(settings);
    syncCompatibilityFromNested(settings);
    syncProjectCenterFromActiveAsr(settings);
    settings.stage = defaults.stage || settings.stage || "mv3-legacy-migration";
    settings.meta = deepMerge(defaults.meta || {}, settings.meta || {});
    settings.meta.schemaVersion = constants.SCHEMA_VERSION || 7;
    return settings;
  }

  async function getSettings() {
    const stored = await getStoredValue();
    return normalizeSettings(stored);
  }

  async function saveSettings(nextSettings) {
    const normalized = normalizeSettings(nextSettings);
    await setStoredValue(normalized);
    return normalized;
  }

  async function patchSettings(patch) {
    const current = await getSettings();
    const next = deepMerge(current, patch || {});
    const constants = getConstants();
    const patchedProjectId = getPatchedActiveProjectId(patch);

    if (patchedProjectId && !isPlainObject(patch?.asr)) {
      next.asr = resolveProjectAsrConfig(next, normalizeProjectId(patchedProjectId, constants));
    }

    return saveSettings(next);
  }

  async function isPlatformEnabled(platformId) {
    const settings = await getSettings();
    return Boolean(settings.platforms?.[platformId || "alibabaLabelx"]?.enabled);
  }

  async function setDebugMode(enabled) {
    const nextSettings = await patchSettings({
      debug: {
        enabled: enabled === true,
        lastToggledAt: new Date().toISOString(),
      },
      platforms: {
        alibabaLabelx: {
          legacyServer: {
            useDebugApiBaseUrl: enabled === true,
          },
        },
      },
    });

    return clone(nextSettings.debug);
  }

  async function clearRuntimeCache() {
    const constants = getConstants();
    const nextSettings = await patchSettings({
      cache: clone(constants.DEFAULT_SETTINGS?.cache || {}),
    });
    return clone(nextSettings.cache);
  }

  async function resetSettings(options) {
    const constants = getConstants();
    const preservePlatformEnabled = options?.preservePlatformEnabled === true;
    const current = preservePlatformEnabled ? await getSettings() : null;
    const nextSettings = clone(constants.DEFAULT_SETTINGS || {});

    if (preservePlatformEnabled && current?.platforms?.alibabaLabelx) {
      nextSettings.platforms.alibabaLabelx.enabled = Boolean(
        current.platforms.alibabaLabelx.enabled
      );
    }

    if (preservePlatformEnabled && current?.platforms?.lightwheel) {
      nextSettings.platforms.lightwheel.enabled = Boolean(current.platforms.lightwheel.enabled);
      nextSettings.platforms.lightwheel.scripts = clone(current.platforms.lightwheel.scripts || {});
    }

    return saveSettings(nextSettings);
  }

  async function setActiveProject(projectId) {
    const constants = getConstants();
    const normalizedProjectId = normalizeProjectId(projectId, constants);
    return patchSettings({
      platforms: {
        alibabaLabelx: {
          scriptCenter: {
            activeProjectId: normalizedProjectId,
          },
        },
      },
    });
  }

  async function saveProjectSettings(projectId, patch) {
    const constants = getConstants();
    const normalizedProjectId = normalizeProjectId(projectId, constants);
    const current = await getSettings();
    const next = clone(current);
    const platform = ensurePlatformRoot(next);
    const scriptCenter = ensureScriptCenter(next);
    const targetProject = scriptCenter.projects[normalizedProjectId];
    const currentProjectConfig = targetProject?.asrConfig || {};
    const projectPatch = isPlainObject(patch) ? patch : {};
    const defaultProjectConfig =
      normalizedProjectId === constants.JUDGEMENT_PROJECT_ID
        ? constants.DEFAULT_JUDGEMENT_ASR_CONFIG || {}
        : constants.DEFAULT_ASR_CONFIG || {};

    targetProject.asrConfig = deepMerge(
      deepMerge(defaultProjectConfig, currentProjectConfig),
      projectPatch
    );
    if (normalizedProjectId === constants.JUDGEMENT_PROJECT_ID) {
      targetProject.asrConfig = normalizeJudgementAsrConfig(targetProject.asrConfig);
    }

    if (scriptCenter.activeProjectId === normalizedProjectId) {
      next.asr = resolveProjectAsrConfig(next, normalizedProjectId);
    }

    return saveSettings(next);
  }

  async function setScriptEnabled(scriptId, enabled) {
    const constants = getConstants();
    const nextEnabled = enabled === true;

    if (
      scriptId === constants.TRANSCRIPTION_PROJECT_ID ||
      scriptId === constants.JUDGEMENT_PROJECT_ID
    ) {
      return patchSettings({
        platforms: {
          alibabaLabelx: {
            enabled: nextEnabled,
            scriptCenter: {
              activeProjectId: scriptId,
            },
          },
        },
      });
    }

    if (scriptId === constants.LIGHTWHEEL_VIEW_PANEL_SCRIPT_ID) {
      return patchSettings({
        platforms: {
          lightwheel: {
            enabled: nextEnabled,
            scripts: {
              viewPanel: {
                enabled: nextEnabled,
              },
            },
          },
        },
      });
    }

    return getSettings();
  }

  globalThis.ASREdgeStorage = {
    getSettings: getSettings,
    saveSettings: saveSettings,
    patchSettings: patchSettings,
    isPlatformEnabled: isPlatformEnabled,
    setDebugMode: setDebugMode,
    clearRuntimeCache: clearRuntimeCache,
    resetSettings: resetSettings,
    setActiveProject: setActiveProject,
    saveProjectSettings: saveProjectSettings,
    setScriptEnabled: setScriptEnabled,
  };
})();
