// ==UserScript==
// @name         阿里ASR标注效率提升脚本
// @namespace    http://tampermonkey.net/
// @version      33.04
// @description  全方位ASR标注效率提升：全页标有效智能填充(四阶段批处理)｜单条快速填入(疑问词识别)｜AI标点修复(通义千问单次合并请求)｜双核中文数字转换(千问/蜂鸟模式)｜全页空格消除｜防错质检(无效清空/有效拦截/校验联动保存)｜云端纠错词库(多对一哈希合并+推送审核)｜深度拦截平台自动保存防数据覆盖｜手动合并保存(blur flush/防重复/自动刷新)｜本页时长DOM实时计算｜导出统计Excel(日期/时间依据筛选)｜自动闭环批量提交(10s寻址流转)｜自定义快捷键与多档定速｜配置持久化与智能版本升级｜进入页面自动全页填充｜标注员用户名自动获取(PointerEvents模拟)｜新增全局可拖拽云端排行榜(定时自动刷新/静默防中断上传/审核与标注身份分离)｜智能提交防并发控制与底层逻辑深度重构
// @author       想天真
// @match        *://labelx.alibaba-inc.com/corpora/labeling/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @updateURL    http://47.108.254.138:3101/asr/asr-script.user.js
// @downloadURL  http://47.108.254.138:3101/asr/asr-script.user.js
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // ================= 0. 底层网络请求拦截 (新增批量手动保存支持 & 强化兼容性) =================
    const interceptorScript = document.createElement('script');
    interceptorScript.textContent = `
        (function() {
            if (window.__asr_hooked) return; // 防止重复劫持导致栈溢出
            window.__asr_hooked = true;

            window.__asr_pending_saves = {};
            window.__asr_pending_save_url = '';

            window.addEventListener('ASR_TriggerManualSave', async () => {
                const keys = Object.keys(window.__asr_pending_saves);
                if (keys.length === 0) {
                    window.dispatchEvent(new CustomEvent('ASR_ManualSaveResult', { detail: { success: true, count: 0 } }));
                    return;
                }
                const dataList = Object.values(window.__asr_pending_saves);
                try {
                    const res = await window.origFetch(window.__asr_pending_save_url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-Manual-Save': 'true', 'accept': 'application/json, text/plain' },
                        body: JSON.stringify({ dataList, timestamp: Date.now() })
                    });
                    const json = await res.json();
                    if (json.success || json.code === 0) {
                        window.__asr_pending_saves = {};
                        window.dispatchEvent(new CustomEvent('ASR_PendingSaveCount', { detail: 0 }));
                        window.dispatchEvent(new CustomEvent('ASR_ManualSaveResult', { detail: { success: true, count: dataList.length } }));
                    } else {
                        console.error('[ASR] ASR_TriggerManualSave: 业务失败，后端返回:', JSON.stringify(json));
                        window.dispatchEvent(new CustomEvent('ASR_ManualSaveResult', { detail: { success: false, msg: json.message || '未知错误' } }));
                    }
                } catch(e) {
                    console.error('[ASR] ASR_TriggerManualSave: 请求异常', e);
                    window.dispatchEvent(new CustomEvent('ASR_ManualSaveResult', { detail: { success: false, msg: e.toString() } }));
                }
            });

            window.addEventListener('ASR_InjectPendingSaves', (e) => {
                const { dataList, url } = e.detail;
                if (url) window.__asr_pending_save_url = url;
                dataList.forEach(item => { window.__asr_pending_saves[item.dataId] = item; });
                window.dispatchEvent(new CustomEvent('ASR_PendingSaveCount', { detail: Object.keys(window.__asr_pending_saves).length }));
            });

            window.origFetch = window.fetch;
            window.fetch = async function(...args) {
                const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
                const opts = args[1] || {};
                const method = (opts.method || 'GET').toUpperCase();

                if (url.includes('/api/v1/label/center/subTask/') && url.includes('/data') && method === 'POST') {
                    let isManual = false;
                    if (opts.headers) {
                        if (typeof opts.headers.get === 'function') {
                            isManual = opts.headers.get('X-Manual-Save') === 'true';
                        } else {
                            isManual = !!opts.headers['X-Manual-Save'];
                        }
                    }

                    const disableAutoSave = document.documentElement.getAttribute('data-asr-disable-autosave') === 'true';

                    if (disableAutoSave && !isManual) {
                        console.log('[ASR] fetch拦截: 拦截自动保存请求');
                        try {
                            const body = JSON.parse(opts.body);
                            if (body && body.dataList) {
                                body.dataList.forEach(item => { window.__asr_pending_saves[item.dataId] = item; });
                                window.__asr_pending_save_url = url;
                            }
                        } catch(e) { console.error('[ASR] fetch拦截器-解析待保存数据失败:', e); }
                        window.dispatchEvent(new CustomEvent('ASR_PendingSaveCount', { detail: Object.keys(window.__asr_pending_saves).length }));
                        return new Response(JSON.stringify({"code":0,"data":true,"success":true}), { status: 200, headers: { 'Content-Type': 'application/json' }});
                    }
                }

                let response;
                try {
                    response = await window.origFetch.apply(this, args);
                } catch(e) {
                    console.error('[ASR] fetch拦截: 请求失败 method=' + method + ' url=' + url + ' error=' + e);
                    throw e;
                }

                if (url.includes('/api/v1/label/tasks/getLabelTaskInfo')) {
                    window.dispatchEvent(new CustomEvent('ASR_DataLoaded'));
                }
                if (url.includes('/api/v1/label/center/timer')) {
                    window.dispatchEvent(new CustomEvent('ASR_TimerTriggered'));
                }
                if (url.includes('/api/v1/label/center/subTask/') && url.includes('/data') && method === 'GET') {
                    try {
                        const resClone = response.clone();
                        resClone.json().then(data => {
                            if (data?.data?.dataList) {
                                const itemDurations = {};
                                data.data.dataList.forEach(item => {
                                    if (item.data?.raw_audio_path && item.data?.duration) {
                                        const filename = item.data.raw_audio_path.split('/').pop().split('?')[0];
                                        itemDurations[filename] = parseFloat(item.data.duration);
                                    }
                                });
                                window.__asr_cached_dataList = data.data.dataList;
                                window.__asr_pending_save_url = url;
                                const d = data.data;
                                window.__asr_subtask_meta = {
                                    subTaskId: d.id,
                                    taskId: d.taskId,
                                    batchId: d.batchId,
                                    taskName: d.taskName || '',
                                    gmtCreate: d.gmtCreate || ''
                                };
                                window.dispatchEvent(new CustomEvent('ASR_SubTaskMetaReady', { detail: window.__asr_subtask_meta }));
                                window.dispatchEvent(new CustomEvent('ASR_ItemDurationsReady', { detail: itemDurations }));
                                window.dispatchEvent(new CustomEvent('ASR_DataListReady', { detail: data.data.dataList }));
                            }
                        });
                    } catch(e) { console.error('[ASR] fetch拦截器-解析任务详情失败:', e); }
                }
                if (url.includes('/api/v1/label/center/subTasks?type=')) {
                    try {
                        const resClone = response.clone();
                        resClone.json().then(data => {
                            if (location.pathname.toLowerCase().includes('/sdk')) return;
                            if (data?.data?.data) {
                                window.dispatchEvent(new CustomEvent('ASR_CurrentPageTasksReady', { detail: data.data.data }));
                            }
                        });
                    } catch(e) { console.error('[ASR] fetch拦截器-解析当前页任务失败:', e); }
                }
                return response;
            };
        })();
    `;
    document.documentElement.appendChild(interceptorScript);
    interceptorScript.remove();

    // ================= 1. 配置管理 (保证兼容旧版本数据不丢失) =================
    const DEFAULT_CONFIG = {
        itemsPerPage: '50 条/页',
        autoPlay: true,
        defaultValid: false,
        fillOnValid: true,
        clearOnInvalid: true,
        autoNext: false,
        autoAssignCheckTasks: false,
        autoAssignTaskKeyword: '',
        autoAssignTargetUser: '',
        autoAssignBatchSize: 99999,
        autoAssignAllTasks: false,
        autoAssignFetchAll: true,
        autoBatchSubmit: false,
        shortcutRemoveSpaces: { ctrl: false, alt: false, shift: false, meta: false, key: 'h', button: null },
        shortcutRemoveAllSpaces: { ctrl: false, alt: false, shift: false, meta: false, key: 'g', button: null },
        shortcutFixPunctuationAll: { ctrl: false, alt: false, shift: false, meta: false, key: 'j', button: null },
        shortcutToggleAutoBatchSubmit: { ctrl: false, alt: false, shift: false, meta: false, key: 'l', button: null },
        shortcutToggleAutoSubmitAfterValidation: { ctrl: false, alt: false, shift: false, meta: false, key: 'k', button: null },
        shortcutLeaderboard: { ctrl: false, alt: false, shift: false, meta: false, key: 'm', button: null },
        autoResetRate: false,
        resetRateValue: 1.0,
        volumeValue: 100,
        autoReceiveOnSubmit: false,
        validateBeforeSubmit: false,
        autoClearInvalidValidation: false,
        autoFillOnValidValidation: false,
        autoSubmitAfterValidation: false,
        autoFillOnLoad: false,
        qwenApiKey: '',
        useAdvancedRules: false,
        qwenModel: 'qwen3.5-flash',
        numConvertMode: '千问',

        customReplacements: [
            { from: '小二,小恶,小乐,小额', to: '小饿' },
            { from: '小二小二,小额小额,小恶小恶', to: '小饿小饿' },
            { from: '批掉,劈掉', to: 'p' },
            { from: '饿了吗,二了,饿了么？,饿了吧,饿了马', to: '饿了么' },
            { from: '淘宝选购,淘宝上购,淘宝返购', to: '淘宝闪购' },
            { from: '千份,千分,千万,先问,前问,前文,亲们,请吻,千吻,前吻,qw,家人们,千温,天问,钱问,钱文,千文,千味,田伟,田问,田文,亲我,前卫,钱伟,千闷,千梦', to: '千问' },
            { from: '请问请问,千万千万', to: '千问千问' },
            { from: '临时有名', to: '零食有鸣' },
            { from: '物探', to: '木炭' },
            { from: '河马', to: '盒马' },
            { from: '飞驰人生三,奔驰人生三,飞驰三,真实人生三', to: '《飞驰人生3》' },
            { from: '飞驰人生', to: '《飞驰人生》' },
            { from: '坦斯丁,塔斯丁', to: '塔斯汀' },
            { from: '博雅绝学,伯牙绝学', to: '伯牙绝弦' },
            { from: 'VIVO', to: 'vivo' },
            { from: '瑞星,瑞信', to: '瑞幸' },
            { from: '惊蛰无声', to: '《惊蛰无声》' },
            { from: '龙江猪脚饭', to: '隆江猪脚饭' },
            { from: '雨雨涵,余雨涵,雨余涵,俞宇航', to: '余宇涵' },
            { "from": "李若陶", "to": "李若桃" },
            { "from": "风跑", "to": "蜂跑" },
            { "from": "一键到电,确认到电", "to": "一键到店" },
            { "from": "全部都电", "to": "全部到店" },
            { "from": "确认照片,确认到点,确认到地", "to": "确认到店" },
            { "from": "散购便利店", "to": "闪购便利店" },
            { "from": "申咐", "to": "申诉" },
            { "from": "舞栋", "to": "5栋" },
            { "from": "拒绝接待", "to": "拒绝接单" },
            { "from": "充门奖", "to": "冲单奖" }
        ],

        customRates: [
            { rate: 0.5, shortcut: { ctrl: false, alt: false, shift: false, meta: false, key: 'f1', button: null } },
            { rate: 1.0, shortcut: { ctrl: false, alt: false, shift: false, meta: false, key: 'f2', button: null } },
            { rate: 1.5, shortcut: { ctrl: false, alt: false, shift: false, meta: false, key: 'f3', button: null } },
            { rate: 2.0, shortcut: { ctrl: false, alt: false, shift: false, meta: false, key: 'f4', button: null } }
        ],

        shortcutPanel: { ctrl: true, alt: false, shift: false, meta: false, key: 'p', button: null },
        shortcutPlayPause: { ctrl: false, alt: false, shift: false, meta: false, key: ' ', button: null },
        shortcutForward: { ctrl: false, alt: false, shift: false, meta: false, key: 'arrowright', button: null },
        shortcutBackward: { ctrl: false, alt: false, shift: false, meta: false, key: 'arrowleft', button: null },
        shortcutToggleFocus: { ctrl: false, alt: false, shift: false, meta: false, key: 'tab', button: null },
        shortcutVolUp: { ctrl: false, alt: false, shift: false, meta: false, key: ']', button: null },
        shortcutVolDown: { ctrl: false, alt: false, shift: false, meta: false, key: '[', button: null },
        shortcutResetVol: { ctrl: false, alt: false, shift: false, meta: false, key: '\\', button: null },

        shortcutSpeedDown: { ctrl: false, alt: false, shift: false, meta: false, key: 'z', button: null },
        shortcutSpeedUp: { ctrl: false, alt: false, shift: false, meta: false, key: 'x', button: null },
        shortcutResetSpeed: { ctrl: false, alt: false, shift: false, meta: false, key: 'c', button: null },
        shortcutValid: { ctrl: false, alt: false, shift: false, meta: false, key: '1', button: null },
        shortcutInvalid: { ctrl: false, alt: false, shift: false, meta: false, key: '2', button: null },
        shortcutFill: { ctrl: false, alt: false, shift: false, meta: false, key: 'f', button: null },
        shortcutConvertNum: { ctrl: false, alt: false, shift: false, meta: false, key: 'v', button: null },
        shortcutCopyDuration: { ctrl: false, alt: false, shift: false, meta: false, key: 'b', button: null },
        shortcutSubmit: { ctrl: false, alt: false, shift: false, meta: false, key: 't', button: null },
        shortcutValidateItems: { ctrl: false, alt: false, shift: false, meta: false, key: 'r', button: null },
        shortcutAllValid: { ctrl: false, alt: false, shift: false, meta: false, key: 'o', button: null }
    };

    let config = {
        ...DEFAULT_CONFIG,
        // 自动将本地存储的老数据覆盖进来
        ...Object.keys(DEFAULT_CONFIG).reduce((acc, key) => ({ ...acc, [key]: GM_getValue(key, DEFAULT_CONFIG[key]) }), {})
    };

    let currentAudio = null;
    let currentPendingSaveCount = 0;
    let paginationSetting = location.pathname.toLowerCase().includes('/sdk');
    let isTaskValidated = false;
    let isBulkProcessing = false;
    let recordingTarget = null;
    let currentTotalDuration = 0;
    let isDebugMode = GM_getValue('asr_debug_mode', false);
    const getApiBase = () => isDebugMode ? 'http://127.0.0.1:3101' : 'http://47.108.254.138:3101';

    let _cachedCurrentPageTasks = [];
    window.addEventListener('ASR_CurrentPageTasksReady', (e) => {
        _cachedCurrentPageTasks = e.detail || [];
    });

    const PAGE_OPTIONS = ['1 条/页', '2 条/页', '3 条/页', '4 条/页', '5 条/页', '10 条/页', '20 条/页', '30 条/页', '40 条/页', '50 条/页'];


    // ================= 新增：语义化版本对比引擎 =================
    function isVersionNewer(newVer, oldVer) {
        const v1 = String(newVer).split('.'), v2 = String(oldVer).split('.');
        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            let n1 = parseInt(v1[i] || 0), n2 = parseInt(v2[i] || 0);
            if (n1 > n2) return true; if (n1 < n2) return false;
        }
        return false;
    }

    // ================= 云端词库同步引擎（可复用） =================
    function syncDictFromCloud(onComplete) {
        console.log('[ASR] 正在从云端同步词库...');
        GM_xmlhttpRequest({
            method: "GET",
            url: getApiBase() + "/asr/asr-dict.json?t=" + Date.now(),
            timeout: 20000,
            onload: function(response) {
                console.log(`[ASR] 词库同步响应状态: ${response.status}`);
                if (response.status !== 200) {
                    console.error('[ASR] 词库同步失败: HTTP ' + response.status);
                    showToast(`❌ 词库同步失败，服务器状态码：${response.status}`);
                    if (onComplete) onComplete(false);
                    return;
                }
                try {
                    const remoteDict = JSON.parse(response.responseText);
                    if (!Array.isArray(remoteDict)) throw new Error('非数组结构');
                    console.log(`[ASR] 云端词库解析成功，共 ${remoteDict.length} 条规则`);
                    config.customReplacements = remoteDict.map(rule => ({ to: rule.to || '', from: rule.from || '' }));
                    GM_setValue('customReplacements', config.customReplacements);
                    console.log(`[ASR] 词库已保存到本地存储，当前规则数=${config.customReplacements.length}`);
                    if (typeof renderCustomReplacementsUI === 'function') renderCustomReplacementsUI();
                    if (onComplete) onComplete(true);
                } catch(e) {
                    console.error('[ASR] 词库解析失败:', e);
                    showToast('❌ 词库解析失败，请检查云端JSON格式！');
                    if (onComplete) onComplete(false);
                }
            },
            onerror: function() { console.error('[ASR] 连接云服务器失败'); showToast('❌ 连接云服务器失败'); if (onComplete) onComplete(false); },
            ontimeout: function() { console.error('[ASR] 连接云服务器超时'); showToast('❌ 连接云服务器超时'); if (onComplete) onComplete(false); }
        });
    }

    // ================= 自动化更新生命周期感知 =================
    function checkAndUpdateLifecycle() {
        console.log('[ASR] checkAndUpdateLifecycle: 检查脚本更新');
        const currentVer = GM_info.script.version;
        const savedVer = GM_getValue('asr_script_version', '0');
        console.log(`[ASR] checkAndUpdateLifecycle: 当前版本=${currentVer} 保存版本=${savedVer}`);

        if (savedVer !== '0' && isVersionNewer(currentVer, savedVer)) {
            console.log('[ASR] checkAndUpdateLifecycle: 检测到新版本');
            syncDictFromCloud((success) => {
                setTimeout(() => showUpgradeResetNotification(savedVer, currentVer, success), 800);
            });
        }
        GM_setValue('asr_script_version', currentVer);

        const lastCheckTime = GM_getValue('asr_last_update_check_time', 0);
        const now = Date.now();
        if (now - lastCheckTime > 6 * 60 * 60 * 1000) {
            GM_xmlhttpRequest({
                method: "GET",
                url: getApiBase() + "/asr/asr-script.user.js?t=" + now,
                headers: { "Range": "bytes=0-1000" },
                onload: function(res) {
                    try {
                        const match = res.responseText.match(/@version\s+([\d\.]+)/);
                        if (match && match[1]) {
                            const remoteVer = match[1];
                            if (isVersionNewer(remoteVer, currentVer)) showFloatingUpdatePrompt(remoteVer);
                            GM_setValue('asr_last_update_check_time', now);
                        }
                    } catch(e) { console.error('[ASR] 检查脚本更新失败:', e); }
                }
            });
        }
    }

    function showUpgradeResetNotification(oldVer, newVer, dictSyncSuccess) {
        console.log(`[ASR] showUpgradeResetNotification: 旧版本=${oldVer} 新版本=${newVer} 词库同步=${dictSyncSuccess}`);
        if (document.getElementById('asr-upgrade-reset-notice')) {
            console.log('[ASR] showUpgradeResetNotification: 通知已存在');
            return;
        }
        const div = document.createElement('div');
        div.id = 'asr-upgrade-reset-notice';
        div.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); z-index:999999; animation:asrFadeIn 0.4s ease-out;';
        const dictStatus = dictSyncSuccess
            ? `<span style="color:#389e0d; font-weight:bold;">✅ 「自定义文本纠错规则」已自动同步为最新云端词库。</span>`
            : `<span style="color:#fa541c; font-weight:bold;">⚠️ 云端词库同步失败，请手动点击设置面板中的「🔄 同步云端词库」按钮。</span>`;
        div.innerHTML = `
            <style>@keyframes asrFadeIn { from { opacity:0; transform:translateX(-50%) translateY(-20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }</style>
            <div style="background:#fff; border-radius:12px; box-shadow:0 12px 40px rgba(0,0,0,0.18); border-left:4px solid #52c41a; padding:20px 24px; width:440px; font-family:sans-serif;">
                <div style="font-size:16px; font-weight:bold; color:#1d1d1d; margin-bottom:12px;">🎉 已升级至 v${newVer}（从 v${oldVer}）</div>
                <div style="font-size:13px; color:#555; line-height:1.9;">
                    快捷键、开关状态、自定义定速、抢单配置等个人设置均已保留。<br>
                    ${dictStatus}
                </div>
                <div style="margin-top:14px; text-align:right;">
                    <button onclick="this.closest('#asr-upgrade-reset-notice').remove()" style="padding:6px 18px; background:#1677ff; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:13px; font-weight:500;">知道了</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    }

    function showFloatingUpdatePrompt(newVer) {
        if (document.getElementById('asr-floating-update-prompt')) return;
        const div = document.createElement('div');
        div.id = 'asr-floating-update-prompt';
        div.style.cssText = 'position:fixed; top:24px; right:24px; background:#e6f4ff; border:1px solid #91caff; padding:12px 20px; border-radius:8px; z-index:999999; box-shadow:0 6px 16px rgba(0,0,0,0.12); display:flex; align-items:center; gap:16px; font-family:sans-serif; transition:all 0.3s ease; animation: asrSlideIn 0.5s ease-out;';
        
        const style = document.createElement('style');
        style.innerHTML = `@keyframes asrSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
        document.head.appendChild(style);

        div.innerHTML = `
            <div>
                <div style="font-size:15px; color:#0958d9; font-weight:bold; margin-bottom:4px;">🚀 发现新版本 v${newVer}</div>
                <div style="font-size:12px; color:#555;">快捷键与开关配置保留，词库将自动同步云端</div>
            </div>
            <button id="asr-floating-update-btn" style="padding:6px 14px; background:#1677ff; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; transition: background 0.2s;">一键更新</button>
            <span id="asr-floating-close-btn" style="cursor:pointer; color:#bfbfbf; font-size:16px; transition: color 0.2s;" title="暂时忽略">✖</span>
        `;
        document.body.appendChild(div);

        document.getElementById('asr-floating-update-btn').onclick = () => {
            window.open('http://47.108.254.138:3101/asr/asr-script.user.js?t=' + Date.now(), '_blank');
            showRefreshReminder();
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 300);
        };
        document.getElementById('asr-floating-close-btn').onclick = () => {
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 300);
        };
    }

    function showRefreshReminder() {
        if (document.getElementById('asr-refresh-prompt')) return;
        const div = document.createElement('div');
        div.id = 'asr-refresh-prompt';
        div.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#fffbe6; border:2px solid #faad14; padding:16px 24px; border-radius:8px; z-index:999999; box-shadow:0 6px 16px rgba(0,0,0,0.15); display:flex; align-items:center; gap:16px; font-family:sans-serif;';
        div.innerHTML = `
            <div style="font-size:14px; color:#d46b08; font-weight:bold;">🚀 脚本更新已触发！<br>请在弹出的油猴页面完成安装后，手动点击右侧刷新网页即可生效。</div>
            <button onclick="location.reload()" style="padding:6px 16px; background:#faad14; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; transition: background 0.2s;">立即刷新</button>
            <span onclick="this.parentElement.remove()" style="cursor:pointer; color:#bfbfbf; font-size:18px; transition: color 0.2s;" title="关闭提示">✖</span>
        `;
        document.body.appendChild(div);
    }
    function showLoadingMask(msg = '处理中，请稍候...') {
        console.log(`[ASR] showLoadingMask: msg=${msg}`);
        let mask = document.getElementById('asr-loading-mask');
        if (!mask) {
            mask = document.createElement('div');
            mask.id = 'asr-loading-mask';
            mask.style.cssText = 'position:fixed; inset:0; background:rgba(255,255,255,0.7); z-index:999999; display:flex; justify-content:center; align-items:center; backdrop-filter:blur(2px); flex-direction:column; gap:16px;';
            mask.innerHTML = `
                <div style="width:40px; height:40px; border:4px solid #1677ff; border-top-color:transparent; border-radius:50%; animation:asr-spin 1s linear infinite;"></div>
                <style>@keyframes asr-spin { to { transform: rotate(360deg); } }</style>
                <div id="asr-loading-mask-text" style="font-size:16px; font-weight:bold; color:#1677ff;">${msg}</div>
            `;
            document.body.appendChild(mask);
        } else {
            document.getElementById('asr-loading-mask-text').innerText = msg;
            mask.style.display = 'flex';
        }
    }

    function hideLoadingMask() {
        const mask = document.getElementById('asr-loading-mask');
        if (mask) mask.style.display = 'none';
    }

    // ================= 2. 终极抗干扰模糊搜索器 =================
    function getTargetTextarea(item) {
        let ta = item.querySelector('textarea[label="转写文本"]');
        if (ta) {
            return ta;
        }
        const wraps = item.querySelectorAll('.labelRender-item-answer-wrap');
        for (let w of wraps) {
            const title = w.querySelector('.labelRender-item-answer-title');
            if (title && title.textContent.includes('转写文本')) {
                return w.querySelector('textarea');
            }
        }
        ta = item.querySelector('textarea');
        return ta;
    }

    function getSourceText(item) {
        let text = "";
        const titles = item.querySelectorAll('.labelRender-item-content-title, .labelRender-item-area-head-name');
        for (let t of titles) {
            if (t.textContent.includes('文本')) {
                let container = t.nextElementSibling;
                if (!container && t.parentElement) container = t.parentElement.nextElementSibling;
                if (container) {
                    const txtDiv = container.querySelector('.dt-text-container') || container.querySelector('div');
                    if (txtDiv) text = txtDiv.innerText.trim();
                }
            }
        }
        if (!text) {
            const containers = item.querySelectorAll('.dt-text-container');
            if (containers.length > 0) text = containers[0].innerText.trim();
        }
        return text.replace(/[\u200B-\u200D\uFEFF]/g, '');
    }

    function setRadioValue(item, valueStr) {
        console.log(`[ASR] setRadioValue: valueStr=${valueStr}`);
        let input = item.querySelector(`input[type="radio"][value="${valueStr}"]`);
        if (input) {
            if (!input.checked) {
                input.click();
                console.log('[ASR] setRadioValue: 通过value点击radio');
                setTimeout(() => { if (document.activeElement === input) { input.blur(); document.body.focus(); } }, 10);
            }
            return;
        }
        const labels = item.querySelectorAll('.ant-v5-radio-wrapper, label');
        for (let lbl of labels) {
            if (lbl.textContent.includes(valueStr)) {
                if (lbl.classList.contains('ant-v5-radio-wrapper-checked')) {
                    console.log('[ASR] setRadioValue: radio已选中');
                    return;
                }
                const innerInput = lbl.querySelector('input[type="radio"]');
                if (innerInput) {
                    innerInput.click();
                    console.log('[ASR] setRadioValue: 通过label点击radio');
                    setTimeout(() => { if (document.activeElement === innerInput) { innerInput.blur(); document.body.focus(); } }, 10);
                } else {
                    lbl.click();
                }
                return;
            }
        }
    }

    async function markAllValid() {
        const totalItems = document.querySelectorAll('.labelRender-item').length;
        if (totalItems === 0) {
            showToast('⚠️ 当前页面没有找到标注数据');
            return;
        }

        const wasAutoSaveDisabled = document.documentElement.getAttribute('data-asr-disable-autosave') === 'true';
        if (!wasAutoSaveDisabled) document.documentElement.setAttribute('data-asr-disable-autosave', 'true');

        const hasCachedData = cachedDataList.length > 0;
        if (hasCachedData) {
            showToast(`⏳ 四阶段批处理已启动 (${totalItems} 条)，请勿操作...`);
            showLoadingMask(`正在执行全页填充 (${totalItems}条)，请勿操作...`);
        } else {
            showToast(`⏳ 两阶段批处理已启动 (${totalItems} 条)，请勿操作...`);
            showLoadingMask(`正在执行两阶段填充 (${totalItems}条)，请勿操作...`);
        }

        const t0 = performance.now();
        isBulkProcessing = true;

        try {
            const items = document.querySelectorAll('.labelRender-item');
            for (let i = 0; i < items.length; i++) {
                setRadioValue(items[i], '有效');
            }

            for(let wait = 0; wait < 4; wait++) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            let filledCount = 0;
            const freshItems = document.querySelectorAll('.labelRender-item');
            const processPromises = [];
            for (let i = 0; i < freshItems.length; i++) {
                processPromises.push((async () => {
                    const item = freshItems[i];
                    const checkedRadio = item.querySelector('input[type="radio"]:checked');
                    if (checkedRadio && checkedRadio.value === '有效') {
                        performQuickFill(item);
                        filledCount++;
                        await new Promise(r => setTimeout(r, 10));
                    }
                })());
            }
            await Promise.all(processPromises);

            if (hasCachedData) {
                await new Promise(resolve => setTimeout(resolve, 200));
                buildAndInjectPayloadFromDOM();
            }

            const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
            if (hasCachedData) {
                showToast(`✅ 四阶段批处理完成：${filledCount}/${totalItems} 条已填充 (${elapsed}s)，正在自动保存并刷新...`);
                showLoadingMask('正在合并保存并刷新页面...');
                performManualSave(true, false);
            } else {
                showToast(`✅ 两阶段批处理完成：${filledCount}/${totalItems} 条已填充 (${elapsed}s)，请仔细核对修改！`);
                hideLoadingMask();
            }
        } catch(e) {
            console.error('[ASR] markAllValid: 执行异常', e);
            showToast('❌ 批处理执行失败，请查看控制台');
        } finally {
            isBulkProcessing = false;
            updateDurationDisplay();
            if (!wasAutoSaveDisabled) {
                document.documentElement.removeAttribute('data-asr-disable-autosave');
                console.log('[ASR] markAllValid: autosave已恢复，bulk模式已结束');
            } else {
                console.log('[ASR] markAllValid: bulk模式已结束(autosave原本就禁用)');
            }
        }
    }

    // 公共函数：从当前 DOM 状态读取 radio + textarea，对比 cachedDataList 构造全量 payload 注入 pending_saves
    function buildAndInjectPayloadFromDOM() {
        if (cachedDataList.length === 0) {
            console.log('[ASR] buildAndInjectPayloadFromDOM: 缓存数据为空，跳过');
            return 0;
        }
        console.log(`[ASR] buildAndInjectPayloadFromDOM: 开始构建payload | 缓存数据=${cachedDataList.length}`);

        const domItems = document.querySelectorAll('.labelRender-item');
        console.log(`[ASR] buildAndInjectPayloadFromDOM: DOM匹配成功=${domItems.length}`);
        const filenameToDOM = {};
        domItems.forEach(domItem => {
            const audio = domItem.querySelector('audio');
            if (!audio) return;
            const src = audio.src || audio.currentSrc || '';
            if (src) filenameToDOM[src.split('/').pop().split('?')[0]] = domItem;
        });

        let domNotMatched = 0;
        let missingRawAudioPath = 0;
        const updatedList = [];
        cachedDataList.forEach(item => {
            if (!item.data?.raw_audio_path) { missingRawAudioPath++; return; }
            const filename = item.data.raw_audio_path.split('/').pop().split('?')[0];
            const domItem = filenameToDOM[filename];
            if (!domItem) { domNotMatched++; return; }

            const cloned = JSON.parse(JSON.stringify(item));
            const checkedRadio = domItem.querySelector('input[type="radio"]:checked');
            const markValue = checkedRadio ? checkedRadio.value : '无效';
            const textarea = domItem.querySelector('textarea');
            const textValue = textarea ? textarea.value : '';

            if (!cloned.result) cloned.result = {};
            if (!Array.isArray(cloned.result.markResult)) cloned.result.markResult = [];

            const ve = cloned.result.markResult.find(r => r.title === '是否有效');
            if (ve) ve.value = [markValue]; else cloned.result.markResult.push({ title: '是否有效', value: [markValue] });

            const te = cloned.result.markResult.find(r => r.title === '转写文本');
            if (te) te.value = textValue; else cloned.result.markResult.push({ title: '转写文本', value: textValue });

            updatedList.push(cloned);
        });

        console.log(`[ASR] buildAndInjectPayloadFromDOM: 统计 DOM匹配成功=${domItems.length} 缓存跳过=${cachedDataList.length - missingRawAudioPath - domNotMatched - updatedList.length} 缺失raw_audio_path=${missingRawAudioPath} DOM未命中=${domNotMatched}`);
        console.log(`[ASR] buildAndInjectPayloadFromDOM: 成功构建 ${updatedList.length} 个payload`);
        if (updatedList.length > 0) {
            console.log(`[ASR] buildAndInjectPayloadFromDOM: 准备派发ASR_InjectPendingSaves事件`);
            window.dispatchEvent(new CustomEvent('ASR_InjectPendingSaves', { detail: { dataList: updatedList } }));
            console.log(`[ASR] buildAndInjectPayloadFromDOM: 已派发ASR_InjectPendingSaves事件`);
        }
        return updatedList.length;
    }

    async function removeAllSpaces() {
        console.log('[ASR] removeAllSpaces: 开始执行全页消除空格');
        const allItems = document.querySelectorAll('.labelRender-item');
        if (allItems.length === 0) {
            console.log('[ASR] removeAllSpaces: 未找到标注项');
            showToast('⚠️ 当前页面没有找到标注数据');
            return;
        }
        console.log(`[ASR] removeAllSpaces: 找到 ${allItems.length} 个标注项`);

        const wasAutoSaveDisabled = document.documentElement.getAttribute('data-asr-disable-autosave') === 'true';
        if (!wasAutoSaveDisabled) document.documentElement.setAttribute('data-asr-disable-autosave', 'true');

        const hasCachedData = cachedDataList.length > 0;
        isBulkProcessing = true;
        showLoadingMask('正在全页消除空格，请勿操作...');

        let clearedCount = 0;
        try {
            allItems.forEach(item => {
                const ta = getTargetTextarea(item);
                if (!ta || !ta.value) return;
                const newText = ta.value.replace(/\s+/g, '');
                if (newText !== ta.value) {
                    safeSetReactInputValue(ta, newText);
                    clearedCount++;
                }
            });
            console.log(`[ASR] removeAllSpaces: 消除空格完成 | 处理数量=${clearedCount}`);

            await new Promise(resolve => setTimeout(resolve, 200));

            if (hasCachedData) {
                buildAndInjectPayloadFromDOM();
            }

            document.body.focus();

            if (clearedCount === 0) {
                console.log('[ASR] removeAllSpaces: 未发现任何空格');
                showToast('⚠️ 全页没有发现任何空格');
                hideLoadingMask();
                return;
            }

            if (hasCachedData) {
                console.log(`[ASR] removeAllSpaces: 正在自动保存并刷新 (${clearedCount} 条)`);
                showToast(`✅ 全页空格消除完成 (${clearedCount} 条)，正在自动保存并刷新...`);
                showLoadingMask('正在合并保存并刷新页面...');
                performManualSave(true, false);
            } else {
                console.log(`[ASR] removeAllSpaces: 完成，未启用自动保存 (${clearedCount} 条)`);
                showToast(`✅ 全页空格消除完成 (${clearedCount} 条)，请仔细核对修改！`);
                hideLoadingMask();
            }
        } catch(e) {
            console.error('[ASR] removeAllSpaces: 执行异常', e);
            showToast('❌ 消除空格执行失败，请查看控制台');
        } finally {
            isBulkProcessing = false;
            if (!wasAutoSaveDisabled) {
                document.documentElement.removeAttribute('data-asr-disable-autosave');
                console.log('[ASR] removeAllSpaces: autosave已恢复，bulk模式已结束');
            } else {
                console.log('[ASR] removeAllSpaces: bulk模式已结束(autosave原本就禁用)');
            }
        }
    }

    // ===== 校验自动修改标记与保存刷新 =====
    let _lastValidationModified = false;

    // 返回 true 表示触发了保存+刷新（调用方应停止后续流程，遮罩不应关闭）；false 表示无需保存
    async function flushValidationChanges() {
        if (!_lastValidationModified || cachedDataList.length === 0) {
            console.log('[ASR] flushValidationChanges: 无需保存');
            _lastValidationModified = false;
            return false;
        }
        console.log('[ASR] flushValidationChanges: 检测到变更，正在保存...');
        _lastValidationModified = false;
        const wasDisabled = document.documentElement.getAttribute('data-asr-disable-autosave') === 'true';
        if (!wasDisabled) document.documentElement.setAttribute('data-asr-disable-autosave', 'true');
        try {
            await new Promise(resolve => setTimeout(resolve, 200));
            buildAndInjectPayloadFromDOM();
            performManualSave(true, false);
        } catch(e) {
            console.error('[ASR] flushValidationChanges: 执行异常', e);
        } finally {
            if (!wasDisabled) {
                document.documentElement.removeAttribute('data-asr-disable-autosave');
                console.log('[ASR] flushValidationChanges: autosave已恢复');
            }
        }
        return true;
    }

    async function fixPunctuationAll() {
        console.log('[ASR] fixPunctuationAll: 开始执行AI标点修复');
        if (!config.qwenApiKey) {
            console.error('[ASR] fixPunctuationAll: 未配置API Key');
            showToast('⚠️ 请先在脚本设置中填入通义千问 API Key');
            return;
        }
        const allItems = document.querySelectorAll('.labelRender-item');
        if (allItems.length === 0) {
            console.log('[ASR] fixPunctuationAll: 未找到标注项');
            showToast('⚠️ 当前页面没有找到标注数据');
            return;
        }

        const wasAutoSaveDisabled = document.documentElement.getAttribute('data-asr-disable-autosave') === 'true';
        if (!wasAutoSaveDisabled) document.documentElement.setAttribute('data-asr-disable-autosave', 'true');

        const hasCachedData = cachedDataList.length > 0;
        const tasks = [];
        const texts = [];
        allItems.forEach(item => {
            const ta = getTargetTextarea(item);
            if (!ta || !ta.value.trim()) return;
            tasks.push({ index: texts.length, ta });
            texts.push(ta.value);
        });

        if (texts.length === 0) {
            console.log('[ASR] fixPunctuationAll: 没有非空文本');
            showToast('⚠️ 当前页面没有非空的转写文本');
            hideLoadingMask();
            return;
        }
        console.log(`[ASR] fixPunctuationAll: 准备修复 ${texts.length} 条文本`);

        isBulkProcessing = true;
        showToast(`🤖 AI标点修复中 (${texts.length} 条)，请稍候...`);
        showLoadingMask(`🤖 AI标点修复中 (${texts.length} 条)，请稍候...`);

        try {
            await ensureUserName();

            console.log(`[ASR] fixPunctuationAll: 发送请求到服务器 | 文本数量=${texts.length}`);
            const result = await new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: getApiBase() + '/asr/fix-punctuation',
                    headers: { 'Content-Type': 'application/json' },
                    data: JSON.stringify({ texts, apiKey: config.qwenApiKey, useAdvancedRules: config.useAdvancedRules === true, model: config.qwenModel, meta: { ...cachedSubTaskMeta, annotator: getCurrentUserName() }, duration: calcDurationFromDOM() }),
                    onload: (res) => { try { console.log(`[ASR] fixPunctuationAll: 服务器响应状态=${res.status}`); resolve(JSON.parse(res.responseText)); } catch(e) { console.error('[ASR] fixPunctuationAll: 响应解析失败:', e); resolve(null); } },
                    onerror: () => { console.error('[ASR] fixPunctuationAll: 请求失败'); resolve(null); },
                    ontimeout: () => { console.error('[ASR] fixPunctuationAll: 请求超时'); resolve(null); }
                });
            });

            if (!result || !result.success || !Array.isArray(result.results)) {
                console.error('[ASR] fixPunctuationAll: API调用失败');
                showToast('❌ AI标点修复请求失败，请检查服务器连接或 API Key');
                hideLoadingMask();
                return;
            }

            let successCount = 0, failCount = 0;
            for (let i = 0; i < result.results.length; i++) {
                const r = result.results[i];
                const task = tasks.find(t => t.index === r.index);
                if (!task) { console.warn('[ASR] fixPunctuationAll: 未找到对应任务', { index: r.index, success: r.success, text: r.text }); failCount++; continue; }
                if (r.success && r.text) {
                    safeSetReactInputValue(task.ta, r.text);
                    successCount++;
                    await new Promise(resolve => setTimeout(resolve, 10));
                } else {
                    console.warn('[ASR] fixPunctuationAll: 单条修复失败', { index: r.index, success: r.success, text: r.text, message: r.message || '' });
                    failCount++;
                }
            }
            console.log(`[ASR] fixPunctuationAll: 修复完成 | 成功=${successCount} 失败=${failCount}`);

            await new Promise(resolve => setTimeout(resolve, 200));
            if (hasCachedData) buildAndInjectPayloadFromDOM();

            document.body.focus();

            if (hasCachedData) {
                console.log('[ASR] fixPunctuationAll: 正在自动保存并刷新');
                showToast(`✅ AI标点修复完成：成功 ${successCount} 条 / 失败 ${failCount} 条，正在自动保存...`);
                showLoadingMask('正在合并保存并刷新页面...');
                performManualSave(true, false);
            } else {
                console.log('[ASR] fixPunctuationAll: 完成，未启用自动保存');
                showToast(`✅ AI标点修复完成：成功 ${successCount} 条 / 失败 ${failCount} 条，请仔细核对修改！`);
                hideLoadingMask();
            }
        } catch(e) {
            console.error('[ASR] fixPunctuationAll: 执行异常', e);
            showToast('❌ AI标点修复执行失败，请查看控制台');
        } finally {
            isBulkProcessing = false;
            if (!wasAutoSaveDisabled) {
                document.documentElement.removeAttribute('data-asr-disable-autosave');
                console.log('[ASR] fixPunctuationAll: autosave已恢复，bulk模式已结束');
            } else {
                console.log('[ASR] fixPunctuationAll: bulk模式已结束(autosave原本就禁用)');
            }
        }
    }

    // ================= 3. 辅助系统 (通知与并发引擎) =================
    function formatDuration(seconds) {
        if (isNaN(seconds)) return '0.00s';
        if (seconds < 60) return seconds.toFixed(2) + 's';
        const m = Math.floor(seconds / 60);
        const s = (seconds % 60).toFixed(2);
        return `${m}m${s}s`;
    }

    function copyToClipboard(text) {
        console.log(`[ASR] copyToClipboard: 尝试复制 ${text}`);
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => { showToast(`✅ 成功复制秒数: ${text}`); });
        } else {
            let textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed"; textArea.style.left = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus(); textArea.select();
            try {
                document.execCommand('copy');
                console.log('[ASR] copyToClipboard: 复制成功');
                showToast(`✅ 成功复制秒数: ${text}`);
            } catch (err) { console.error('[ASR] copyToClipboard: 复制失败:', err); showToast(`❌ 复制失败，请手动操作`); }
            textArea.remove();
        }
    }

    let audioCtx = null;
    function getAudioContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function setAudioVolume(audio, volPercent) {
        if (!audio) return;
        try {
            if (!audio._gainNode) {
                const ctx = getAudioContext();
                if (!ctx) throw new Error("AudioContext not supported");
                const source = ctx.createMediaElementSource(audio);
                const gainNode = ctx.createGain();
                source.connect(gainNode);
                gainNode.connect(ctx.destination);
                audio._gainNode = gainNode;
            }
            audio._gainNode.gain.value = volPercent / 100;
        } catch (e) {
            audio.volume = Math.max(0, Math.min(volPercent / 100, 1.0));
        }
    }

    function showToast(msg) {
        console.log(`[ASR] showToast: ${msg}`);
        let toast = document.getElementById('asr-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'asr-toast';
            toast.style.cssText = 'position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 999999; transition: opacity 0.2s; opacity: 0; pointer-events: none;';
            document.body.appendChild(toast);
        }

        toast.innerHTML = `
            <div class="ant-v5-message">
                <div class="ant-v5-message-notice">
                    <div class="ant-v5-message-notice-content" style="padding: 10px 16px; border-radius: 8px; box-shadow: 0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12); background: #fff; color: rgba(0,0,0,0.88); font-size: 14px; display: inline-block;">
                        ${msg}
                    </div>
                </div>
            </div>
        `;
        toast.style.opacity = 1;
        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => toast.style.opacity = '0', 2000);
    }

    async function runConcurrent(items, maxConcurrent, asyncFn) {
        const results = [];
        const executing = [];
        for (const item of items) {
            const p = asyncFn(item).then(result => {
                executing.splice(executing.indexOf(p), 1);
                return result;
            });
            executing.push(p);
            results.push(p);
            if (executing.length >= maxConcurrent) await Promise.race(executing);
        }
        return Promise.all(results);
    }

    let leaderboardRefreshTimer = null;

    function toggleLeaderboard() {
        const id = 'asr-leaderboard-panel';
        let panel = document.getElementById(id);

        if (!panel) {
            const today = new Date().toISOString().split('T')[0];
            panel = document.createElement('div');
            panel.id = id;
            panel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:999999;width:480px;max-height:80vh;background:#ffffff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.15);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;flex-direction:column;overflow:hidden;border:1px solid #f0f0f0;user-select:none;';
            panel.innerHTML = `
                <div id="asr-lb-titlebar" style="background:#fafafa;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f0f0f0;cursor:move;">
                    <div style="font-size:18px;font-weight:bold;color:#333;display:flex;align-items:center;gap:6px;">🏆 云端排行榜</div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <input type="date" id="asr-lb-date" value="${today}" style="border:1px solid #d9d9d9;border-radius:6px;padding:4px 8px;font-size:13px;cursor:pointer;color:#333;">
                        <button id="asr-lb-close" style="background:transparent;border:none;color:#999;font-size:18px;cursor:pointer;padding:2px 8px;border-radius:6px;transition:color 0.2s;">✕</button>
                    </div>
                </div>
                <div id="asr-lb-body" style="padding:16px;overflow-y:auto;flex:1;color:#333;font-size:14px;min-height:100px;">加载中...</div>
            `;
            document.body.appendChild(panel);

            const closeBtn = panel.querySelector('#asr-lb-close');
            closeBtn.onclick = () => toggleLeaderboardPanel(false);
            closeBtn.onmouseover = () => closeBtn.style.color = '#ff4d4f';
            closeBtn.onmouseout = () => closeBtn.style.color = '#999';
            panel.onkeydown = (e) => { if (e.key === 'Escape') toggleLeaderboardPanel(false); };

            const titlebar = panel.querySelector('#asr-lb-titlebar');
            titlebar.addEventListener('mousedown', (e) => {
                if (e.target.id === 'asr-lb-date' || e.target.tagName === 'INPUT') return;
                e.preventDefault();
                panel.style.transition = 'none';
                const rect = panel.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const offsetY = e.clientY - rect.top;

                const onMove = (moveEvent) => {
                    const x = moveEvent.clientX - offsetX;
                    const y = moveEvent.clientY - offsetY;
                    const maxX = window.innerWidth - rect.width;
                    const maxY = window.innerHeight - rect.height;
                    panel.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
                    panel.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
                    panel.style.transform = 'none';
                };
                const onUp = () => {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    panel.style.transition = '';
                };
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });

            panel.querySelector('#asr-lb-date').addEventListener('change', (e) => {
                fetchAndRender(e.target.value);
            });
        }

        const isVisible = panel.style.display !== 'none';
        toggleLeaderboardPanel(isVisible ? false : true);
    }

    function toggleLeaderboardPanel(show) {
        const panel = document.getElementById('asr-leaderboard-panel');
        if (!panel) return;
        if (show === false) {
            panel.style.display = 'none';
            if (leaderboardRefreshTimer) {
                clearInterval(leaderboardRefreshTimer);
                leaderboardRefreshTimer = null;
            }
        } else {
            const today = new Date().toISOString().split('T')[0];
            const dateInput = panel.querySelector('#asr-lb-date');
            if (dateInput) dateInput.value = today;
            panel.style.display = 'flex';
            if (leaderboardRefreshTimer) clearInterval(leaderboardRefreshTimer);
            fetchAndRender(today);
            leaderboardRefreshTimer = setInterval(() => {
                const curDate = panel.querySelector('#asr-lb-date')?.value;
                if (curDate) fetchAndRender(curDate);
            }, 300000);
        }
    }

    function fetchAndRender(date) {
        const panel = document.getElementById('asr-leaderboard-panel');
        if (!panel) return;
        const body = panel.querySelector('#asr-lb-body');
        if (!body) return;
        body.innerHTML = '<div style="text-align:center;padding:30px;color:#888;">加载中...</div>';

        GM_xmlhttpRequest({
            method: "GET",
            url: getApiBase() + '/asr/leaderboard?date=' + encodeURIComponent(date),
            onload: function(response) {
                try {
                    const res = JSON.parse(response.responseText);
                    if (!res?.success || !res.data || res.data.length === 0) {
                        body.innerHTML = `
                            <div style="text-align:center;padding:40px 20px;color:#999;">
                                <div style="font-size:32px;margin-bottom:12px;">📭</div>
                                <div>该日期暂无排行榜数据</div>
                            </div>`;
                        return;
                    }
                    const maxDur = Math.max(...res.data.map(d => d.totalDuration));
                    body.innerHTML = res.data.map((d, i) => {
                        const pct = maxDur > 0 ? (d.totalDuration / maxDur * 100).toFixed(1) : 0;
                        const durStr = d.totalDuration > 1000 ? (d.totalDuration / 1000).toFixed(2) + 'k' : d.totalDuration.toFixed(1);
                        const rank = i + 1;
                        const rankColor = i === 0 ? '#ff0000' : i === 1 ? '#ff8c00' : i === 2 ? '#aa00aa' : i < 10 ? '#0000ff' : '#03a89e';
                        const barColor = i === 0 ? 'linear-gradient(90deg, #ff4d4f, #ff7875)' : i === 1 ? 'linear-gradient(90deg, #fa8c16, #ffc069)' : i === 2 ? 'linear-gradient(90deg, #eb2f96, #ff85c0)' : i < 10 ? 'linear-gradient(90deg, #1677ff, #69b1ff)' : 'linear-gradient(90deg, #13c2c2, #5cdbd3)';
                        const crown = i === 0 ? '👑 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : '';
                        return `<div style="margin-bottom:14px;">
                            <div style="display:flex;justify-content:space-between;margin-bottom:6px;align-items:center;">
                                <span style="color:#333;font-weight:600;display:flex;align-items:center;gap:4px;">
                                    <span style="display:inline-block;width:20px;text-align:center;color:${rankColor};font-weight:bold;">${rank}</span>
                                    <span>${crown}${d.annotator || '未知'}</span>
                                </span>
                                <span style="color:${rankColor};font-weight:bold;font-family:monospace;font-size:15px;">${durStr}s</span>
                            </div>
                            <div style="background:#f0f0f0;border-radius:4px;height:12px;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,0.05);">
                                <div style="width:${pct}%;height:100%;background:${barColor};border-radius:4px;transition:width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);"></div>
                            </div>
                        </div>`;
                    }).join('');
                } catch(e) {
                    console.error('[ASR] 排行榜解析失败:', e);
                    body.innerHTML = '<div style="text-align:center;padding:30px;color:#ff4d4f;">加载失败，请检查服务器连接</div>';
                }
            },
            onerror: function() { console.error('[ASR] 排行榜加载失败: 网络请求失败'); body.innerHTML = '<div style="text-align:center;padding:30px;color:#ff4d4f;">网络请求失败</div>'; }
        });
    }

    function showExportDialog() {
        console.log('[ASR] showExportDialog: 打开导出对话框');
        return new Promise((resolve) => {
            const old = document.getElementById('asr-export-dialog-backdrop');
            if (old) old.remove();

            const today = new Date().toISOString().slice(0, 10);

            const backdrop = document.createElement('div');
            backdrop.id = 'asr-export-dialog-backdrop';
            backdrop.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:999998; display:flex; justify-content:center; align-items:center;';

            backdrop.innerHTML = `
                <div style="background:#fff; border-radius:12px; padding:24px 28px; width:400px; box-shadow:0 12px 40px rgba(0,0,0,0.2); font-family:sans-serif;">
                    <div style="font-size:16px; font-weight:bold; margin-bottom:18px; color:#1d1d1d;">📥 导出统计数据</div>

                    <div style="margin-bottom:14px;">
                        <div style="font-size:13px; color:#666; margin-bottom:6px;">导出模式</div>
                        <div style="display:flex; gap:12px; align-items:center;">
                            <label style="cursor:pointer; display:flex; align-items:center; gap:4px; font-size:14px;">
                                <input type="radio" name="asr-export-type" value="stats" checked> 统计模式
                            </label>
                            <label style="cursor:pointer; display:flex; align-items:center; gap:4px; font-size:14px;">
                                <input type="radio" name="asr-export-type" value="detect"> 检测数据模式
                            </label>
                        </div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="font-size:13px; color:#666; margin-bottom:6px;">日期范围</div>
                        <div style="display:flex; gap:12px; align-items:center;">
                            <label style="cursor:pointer; display:flex; align-items:center; gap:4px; font-size:14px;">
                                <input type="radio" name="asr-export-date-mode" value="all" checked> 全部
                            </label>
                            <label style="cursor:pointer; display:flex; align-items:center; gap:4px; font-size:14px;">
                                <input type="radio" name="asr-export-date-mode" value="specific"> 指定日期
                            </label>
                        </div>
                        <input type="date" id="asr-export-date-input" value="${today}"
                               style="display:none; margin-top:8px; padding:6px 10px; border:1px solid #d9d9d9; border-radius:6px; width:100%; box-sizing:border-box; font-size:14px;">
                    </div>

                    <div id="asr-export-time-field-section" style="display:none; margin-bottom:14px;">
                        <div style="font-size:13px; color:#666; margin-bottom:6px;">时间依据</div>
                        <div style="display:flex; gap:12px; align-items:center;">
                            <label style="cursor:pointer; display:flex; align-items:center; gap:4px; font-size:14px;">
                                <input type="radio" name="asr-export-time-field" value="gmtCommit" checked> 提交时间
                            </label>
                            <label style="cursor:pointer; display:flex; align-items:center; gap:4px; font-size:14px;">
                                <input type="radio" name="asr-export-time-field" value="gmtCreate"> 领取时间
                            </label>
                        </div>
                    </div>

                    <div style="margin-bottom:20px;">
                        <div style="font-size:13px; color:#666; margin-bottom:6px;">并发数 <span style="color:#999; font-size:12px;">（数值越小越稳，建议 3~10）</span></div>
                        <input type="number" id="asr-export-concurrency" value="5" min="1" max="999"
                               style="padding:6px 10px; border:1px solid #d9d9d9; border-radius:6px; width:100px; box-sizing:border-box; font-size:14px;">
                    </div>

                    <div style="margin-bottom:16px; display:flex; align-items:center; gap:8px;">
                        <label style="cursor:pointer; display:flex; align-items:center; gap:5px; font-size:13px; color:#555;">
                            <input type="checkbox" id="asr-export-upload-server" checked> ☁️ 同步上传至云端排行榜
                        </label>
                    </div>

                    <div style="display:flex; gap:10px; justify-content:flex-end;">
                        <button id="asr-export-cancel-btn" style="padding:7px 18px; background:#fff; color:#666; border:1px solid #d9d9d9; border-radius:6px; cursor:pointer; font-size:14px; transition:all 0.2s;">取消</button>
                        <button id="asr-export-start-btn" style="padding:7px 18px; background:#1677ff; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:14px; font-weight:500; transition:all 0.2s;">开始导出</button>
                    </div>
                </div>
            `;

            document.body.appendChild(backdrop);

            const updateDateModeUI = () => {
                const isSpecific = backdrop.querySelector('input[name="asr-export-date-mode"]:checked').value === 'specific';
                document.getElementById('asr-export-date-input').style.display = isSpecific ? 'block' : 'none';
                document.getElementById('asr-export-time-field-section').style.display = isSpecific ? 'block' : 'none';
            };

            backdrop.querySelectorAll('input[name="asr-export-date-mode"]').forEach(r => {
                r.addEventListener('change', updateDateModeUI);
            });

            const cleanup = (result) => { backdrop.remove(); resolve(result); };

            backdrop.addEventListener('click', (e) => { if (e.target === backdrop) { console.log('[ASR] showExportDialog: 点击背景关闭'); cleanup(null); } });
            document.getElementById('asr-export-cancel-btn').onclick = () => { console.log('[ASR] showExportDialog: 点击取消'); cleanup(null); };
            document.getElementById('asr-export-start-btn').onclick = () => {
                console.log('[ASR] showExportDialog: 点击开始导出');
                const exportType = backdrop.querySelector('input[name="asr-export-type"]:checked').value;
                const dateMode = backdrop.querySelector('input[name="asr-export-date-mode"]:checked').value;
                const concurrency = Math.max(1, Math.min(999, parseInt(document.getElementById('asr-export-concurrency').value) || 5));
                const uploadToServer = document.getElementById('asr-export-upload-server').checked;
                cleanup({
                    exportType,
                    dateMode,
                    specificDate: document.getElementById('asr-export-date-input').value,
                    timeField: dateMode === 'specific'
                        ? backdrop.querySelector('input[name="asr-export-time-field"]:checked').value
                        : null,
                    concurrency,
                    uploadToServer
                });
            };
        });
    }

    async function uploadCurrentTaskStats() {
        console.log('[ASR] uploadCurrentTaskStats: 开始上传任务统计');
        try {
            let meta = window.__asr_subtask_meta || {};
            const isCheckMode = window.location.href.includes('checkTask') || window.location.href.includes('missionType=check');
            let realAnnotator = null;
            console.log(`[ASR] uploadCurrentTaskStats: isCheckMode=${isCheckMode}`);

            if (!meta.batchId || isCheckMode) {
                const urlParams = new URLSearchParams(window.location.search);
                const subTaskId = urlParams.get('subTaskId');
                if (subTaskId) {
                    try {
                        console.log(`[ASR] uploadCurrentTaskStats: 尝试获取 batchId | subTaskId=${subTaskId}`);
                        const res = await fetch(`/api/v1/label/center/subTask/${subTaskId}/data?page=1&pageSize=1&filterPassedVote=false&filter=%7B%22questions%22%3A%5B%5D%2C%22dataStatus%22%3A%22ALL%22%2C%22questionsQueryConditions%22%3A%22AND%22%7D&_=${Date.now()}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data && data.data && data.data.batchId) {
                                meta.batchId = data.data.batchId;
                                console.log('[ASR] uploadCurrentTaskStats: batchId补全成功:', meta.batchId);
                            }
                            try {
                                if (data?.data?.dataResultHistory) {
                                    const historyMap = data.data.dataResultHistory;
                                    const firstKey = Object.keys(historyMap)[0];
                                    if (firstKey && historyMap[firstKey] && historyMap[firstKey].length > 0) {
                                        const historyArray = historyMap[firstKey];
                                        realAnnotator = historyArray[historyArray.length - 1].userName;
                                        if (realAnnotator) console.log('[ASR] uploadCurrentTaskStats: 从接口提取到原始标注员:', realAnnotator);
                                    }
                                }
                            } catch(e) { console.error('[ASR] uploadCurrentTaskStats: 提取原始标注员失败:', e); }
                        }
                    } catch (fetchErr) {
                        console.error('[ASR] uploadCurrentTaskStats: batchId获取接口请求失败:', fetchErr);
                    }
                }
            }

            if (!meta.batchId) {
                console.error('[ASR] uploadCurrentTaskStats: 放弃静默上传 - 无法获取batchId');
                return;
            }

            const duration = calcDurationFromDOM();
            if (duration <= 0) {
                console.error('[ASR] uploadCurrentTaskStats: 放弃静默上传 - 持续时间无效:', duration);
                return;
            }

            let annotator = null;

            if (isCheckMode) {
                if (realAnnotator) {
                    annotator = realAnnotator;
                    console.log('[ASR] uploadCurrentTaskStats: 审核模式标注员:', annotator);
                } else {
                    console.error('[ASR] uploadCurrentTaskStats: 放弃静默上传 - 无法获取原始标注员');
                    return;
                }
            } else {
                annotator = await ensureUserName();
                if (!annotator || annotator === '未知用户') {
                    console.error('[ASR] uploadCurrentTaskStats: 放弃静默上传 - 用户名无效');
                    return;
                }
            }

            const today = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const commitDate = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())} ${pad(today.getHours())}:${pad(today.getMinutes())}:${pad(today.getSeconds())}`;

            const payloadData = [{
                annotator,
                duration,
                batchId: meta.batchId,
                commitDate
            }];

            console.log(`[ASR] uploadCurrentTaskStats: 上传数据 | annotator=${annotator} duration=${duration}`);

            await new Promise((resolve) => {
                const timer = setTimeout(() => {
                    console.error('[ASR] uploadCurrentTaskStats: 上传超时，强制放行');
                    resolve();
                }, 2000);
                GM_xmlhttpRequest({
                    method: "POST",
                    url: getApiBase() + '/asr/upload-stats',
                    headers: { 'Content-Type': 'application/json' },
                    data: JSON.stringify(payloadData),
                    onload: () => { clearTimeout(timer); console.log('[ASR] uploadCurrentTaskStats: 上传成功'); resolve(); },
                    onerror: (e) => { clearTimeout(timer); console.error('[ASR] uploadCurrentTaskStats: 上传请求失败:', e); resolve(); },
                    ontimeout: () => { clearTimeout(timer); console.error('[ASR] uploadCurrentTaskStats: 上传请求超时'); resolve(); }
                });
            });
        } catch(e) {
            console.error('[ASR] uploadCurrentTaskStats: 发生异常:', e);
        }
    }

    async function exportTasksToExcel() {
        console.log('[ASR] exportTasksToExcel: 开始导出任务到Excel');

        const exportPasswordSeed = 'ASR-EXPORT-KEY-7F3D9A';
        const exportPassword = exportPasswordSeed.split('-').reverse().join('');
        const inputPassword = window.prompt('请输入导出密码');
        if (inputPassword === null) {
            console.log('[ASR] exportTasksToExcel: 用户取消密码验证');
            return;
        }
        if (inputPassword.trim() !== exportPassword) {
            console.warn('[ASR] exportTasksToExcel: 密码验证失败');
            showToast('❌ 导出密码错误');
            return;
        }

        const choice = await showExportDialog();
        if (!choice) {
            console.log('[ASR] exportTasksToExcel: 用户取消导出');
            return;
        }

        let { exportType, dateMode, specificDate, timeField, concurrency, uploadToServer } = choice;
        const timeFieldLabel = timeField === 'gmtCommit' ? '提交时间' : timeField === 'gmtCreate' ? '领取时间' : '';
        console.log(`[ASR] exportTasksToExcel: dateMode=${dateMode} concurrency=${concurrency}`);

        showToast('🔄 正在从服务器拉取任务列表...');

        try {
            const params = new URLSearchParams(location.search);
            const appId = params.get('projectId') || params.get('appId') || '1023';
            const type = location.pathname.toLowerCase().includes('labelingtask') ? 'label' : 'check';

            const _t = Date.now();
            const fetchOpts = { cache: 'no-store' };

            concurrency = parseInt(concurrency, 10);
            if (isNaN(concurrency) || concurrency < 1) concurrency = 1;
            if (concurrency > 999) concurrency = 999;

            let allData = [];

            if (dateMode === 'specific' && specificDate) {
                showToast(`🔍 开启二分检索模式，高速定位 ${specificDate} 的数据边界...`);

                const fetchPage = async (finishedStr, page) => {
                    const res = await fetch(`/api/v1/label/center/subTasks?type=${type}&keyword=&appId=${appId}&finished=${finishedStr}&page=${page}&pageSize=50&_t=${Date.now()}`, fetchOpts);
                    return await res.json();
                };

                async function fetchByDateBinary(finishedStr) {
                    const initRes = await fetchPage(finishedStr, 1);
                    if (!initRes?.data?.data || initRes.data.data.length === 0) return [];

                    const totalRecords = initRes.data.recordCount || 0;
                    const totalPages = Math.ceil(totalRecords / 50);
                    if (totalPages === 0) return [];

                    let targetPages = new Set();
                    let l = 1, r = totalPages;

                    while (l <= r) {
                        const mid = Math.floor((l + r) / 2);
                        const midData = await fetchPage(finishedStr, mid);
                        const items = midData?.data?.data || [];
                        if (items.length === 0) break;

                        const firstItemTime = (items[0][timeField] || '').substring(0, 10);
                        const lastItemTime = (items[items.length - 1][timeField] || '').substring(0, 10);

                        if (specificDate >= lastItemTime && specificDate <= firstItemTime) {
                            targetPages.add(mid);

                            let leftExt = mid - 1;
                            while (leftExt >= 1) {
                                const extData = await fetchPage(finishedStr, leftExt);
                                const extItems = extData?.data?.data || [];
                                if (extItems.length === 0) break;
                                if ((extItems[extItems.length - 1][timeField] || '').substring(0, 10) > specificDate) break;
                                targetPages.add(leftExt);
                                leftExt--;
                            }

                            let rightExt = mid + 1;
                            while (rightExt <= totalPages) {
                                const extData = await fetchPage(finishedStr, rightExt);
                                const extItems = extData?.data?.data || [];
                                if (extItems.length === 0) break;
                                if ((extItems[0][timeField] || '').substring(0, 10) < specificDate) break;
                                targetPages.add(rightExt);
                                rightExt++;
                            }
                            break;
                        }

                        if (firstItemTime < specificDate) {
                            r = mid - 1;
                        } else {
                            l = mid + 1;
                        }
                    }

                    let results = [];
                    const pagesToFetch = Array.from(targetPages).sort((a, b) => a - b);
                    for (let p of pagesToFetch) {
                        const d = await fetchPage(finishedStr, p);
                        if (d?.data?.data) results.push(...d.data.data);
                    }
                    return results.filter(row => (row[timeField] || '').startsWith(specificDate));
                }

                const [finData, unfinData] = await Promise.all([fetchByDateBinary('true'), fetchByDateBinary('false')]);
                allData = [...finData, ...unfinData];

            } else {
                showToast(`🚀 正在全量拉取 50000 条，可能需要较长时间...`);
                const [resFinished, resUnfinished] = await Promise.all([
                    fetch(`/api/v1/label/center/subTasks?type=${type}&keyword=&appId=${appId}&finished=true&page=1&pageSize=50000&_t=${_t}`, fetchOpts),
                    fetch(`/api/v1/label/center/subTasks?type=${type}&keyword=&appId=${appId}&finished=false&page=1&pageSize=50000&_t=${_t}`, fetchOpts)
                ]);

                const jsonFinished = await resFinished.json();
                const jsonUnfinished = await resUnfinished.json();

                if (jsonFinished?.data?.data) allData.push(...jsonFinished.data.data);
                if (jsonUnfinished?.data?.data) allData.push(...jsonUnfinished.data.data);
            }

            if (allData.length === 0) {
                showToast(dateMode === 'specific' ? `⚠️ 在 ${specificDate}（${timeFieldLabel}）未找到任何任务` : '⚠️ 未获取到任何任务数据');
                return;
            }

            let filteredData = allData;

            showToast(`📊 共 ${filteredData.length} 个任务${dateMode === 'specific' ? `（${specificDate} ${timeFieldLabel}）` : ''}，并发数 ${concurrency}，开始拉取详情...`);

            let completedCount = 0;
            const taskDetails = {};

            await runConcurrent(filteredData, concurrency, async (row) => {
                try {
                    const res = await fetch(`/api/v1/label/center/subTask/${row.id}/data?page=1&pageSize=5000&_t=${Date.now()}`, fetchOpts);
                    const json = await res.json();

                    let dur = 0, ann = '', errorCount = 0, errorIndexes = [];

                    if (json?.data?.dataList) {
                        json.data.dataList.forEach((item, index) => {
                            const validMark = item.result?.markResult?.find(r => r?.title === '是否有效');
                            const validVal = validMark?.value?.[0];

                            if (exportType === 'detect') {
                                const textMark = item.result?.markResult?.find(r => r?.title === '转写文本');
                                const textVal = (textMark?.value || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
                                if (validVal === '无效' && textVal !== '') {
                                    errorCount++;
                                    errorIndexes.push(index + 1);
                                } else if (validVal === '有效' && textVal === '') {
                                    errorCount++;
                                    errorIndexes.push(index + 1);
                                }
                            } else {
                                if (item.data?.duration && validVal === '有效') {
                                    dur += parseFloat(item.data.duration) || 0;
                                }
                            }
                        });
                    }
                    if (json?.data?.dataResultHistory) {
                        const keys = Object.keys(json.data.dataResultHistory);
                        if (keys.length > 0) {
                            const hList = json.data.dataResultHistory[keys[0]];
                            if (Array.isArray(hList)) {
                                const initial = hList.find(x => x.type === 0) || hList[hList.length - 1];
                                if (initial?.userName) ann = initial.userName;
                            }
                        }
                    }
                    taskDetails[row.id] = { dur, ann, errorCount, errorIndexes: errorIndexes.join('，') };
                } catch(e) {
                    console.error(`[ASR] 任务 ${row.id} 详情拉取失败:`, e);
                    taskDetails[row.id] = { dur: 0, ann: '', errorCount: 0, errorIndexes: '' };
                }
                completedCount++;
                if (completedCount % 20 === 0 || completedCount === filteredData.length) {
                    showToast(`⏱️ 拉取进度: ${completedCount} / ${filteredData.length}`);
                }
            });

            showToast('✅ 数据拉取完毕，正在生成 CSV...');

            if (uploadToServer) {
                const statsPayload = filteredData
                    .map(row => {
                        const d = taskDetails[row.id] || {};
                        return { annotator: d.ann || '', duration: d.dur || 0, batchId: row.batchId || '', commitDate: row.gmtCommit || '' };
                    })
                    .filter(r => r.duration > 0 && r.batchId);
                if (statsPayload.length > 0) {
                    GM_xmlhttpRequest({
                        method: "POST",
                        url: getApiBase() + '/asr/upload-stats',
                        headers: { 'Content-Type': 'application/json' },
                        data: JSON.stringify(statsPayload)
                    });
                }
            }

            let csvContent = '\uFEFF';
            if (exportType === 'detect') {
                csvContent += '任务名称,任务ID,子任务ID,分包ID,题数,异常数量,异常题号,标注员,领取时间,提交时间,是否完成\n';
            } else {
                csvContent += '任务名称,任务ID,子任务ID,分包ID,题数,有效时长(秒),标注员,领取时间,提交时间,是否完成\n';
            }

            filteredData.forEach(row => {
                const detail = taskDetails[row.id] || {};
                const baseRow = [
                    `"${row.taskName || ''}"`,
                    row.taskId || '',
                    row.id || '',
                    row.batchId || '',
                    row.size || 0
                ];

                if (exportType === 'detect') {
                    baseRow.push(detail.errorCount || 0);
                    baseRow.push(`"${detail.errorIndexes || ''}"`);
                } else {
                    baseRow.push((detail.dur || 0).toFixed(2));
                }

                baseRow.push(
                    `"${detail.ann || ''}"`,
                    `"${row.gmtCreate || ''}"`,
                    `"${row.gmtCommit || ''}"`,
                    row.status === 1 ? '已完成' : '未完成'
                );

                csvContent += baseRow.join(',') + '\n';
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            const now = new Date();
            const ts = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
            const dateTag = dateMode === 'specific' ? `_${specificDate}` : '_全部';
            const filePrefix = exportType === 'detect' ? '检测数据' : '统计数据';
            link.setAttribute('download', `${filePrefix}${dateTag}_${ts}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast(`✅ 导出成功！共 ${filteredData.length} 条，文件已下载`);
        } catch (e) {
            console.error('[ASR] exportTasksToExcel 发生致命错误:', e);
            showToast('❌ 导出失败，详情请按 F12 查看控制台报错');
        }
    }

    // ================= 4. 现代化 UI 面板 =================
    function createSettingsPanel() {
        console.log('[ASR] createSettingsPanel: 创建设置面板');
        if (document.getElementById('asr-settings-backdrop')) {
            console.log('[ASR] createSettingsPanel: 面板已存在');
            return;
        }

        const backdrop = document.createElement('div');
        backdrop.id = 'asr-settings-backdrop';
        backdrop.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.45); z-index: 99998;
            display: none; align-items: center; justify-content: center;
            backdrop-filter: blur(2px); transition: all 0.3s;
        `;

        const panel = document.createElement('div');
        panel.id = 'asr-settings-panel';
        panel.style.cssText = `
            width: 720px; max-height: 92vh; overflow-y: auto;
            background: #ffffff; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15); padding: 24px;
            display: flex; flex-direction: column; gap: 14px;
        `;

        const optionsHtml = PAGE_OPTIONS.map(opt => `<option value="${opt}" ${config.itemsPerPage === opt ? 'selected' : ''}>${opt}</option>`).join('');

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px;">
                <div style="display:flex; align-items:center;">
                    <h3 id="asr-panel-title" style="margin: 0; font-size: 18px; color: #1f1f1f; font-weight: 600; cursor: pointer; user-select: none;" title="连击5次开启开发者选项">阿里ASR标注效率提升脚本</h3>
                    <span id="asr-debug-indicator" style="display:none; margin-left:12px; font-size:12px; color:#ff4d4f; border:1px solid #ff4d4f; padding:2px 6px; border-radius:4px; cursor:pointer;" title="点击切换环境"></span>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <button id="asr-check-update-btn" style="padding: 4px 10px; background: #52c41a; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: bold; transition: background 0.2s;">🔄 手动检查更新</button>
                    <span id="asr-close-btn" style="cursor: pointer; font-size: 18px; color: #8c8c8c; transition: color 0.2s;">✖</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; background: #fafafa; padding: 12px; border-radius: 8px;">
                <label style="font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="asr-autoplay" ${config.autoPlay ? 'checked' : ''}> 自动播放音频</label>
                <label style="font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="asr-autonext" ${config.autoNext ? 'checked' : ''}> 播完切下条(S)</label>
                <label style="font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="asr-defaultvalid" ${config.defaultValid ? 'checked' : ''}> 切入标"有效"</label>

                <label style="font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; color:#fa541c; font-weight:bold;"><input type="checkbox" id="asr-autobatchsubmit" ${config.autoBatchSubmit ? 'checked' : ''}> 🤖 开启全自动批量提交引擎 (10s自动流转)</label>
                <label style="font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; color:#0958d9;"><input type="checkbox" id="asr-fillonvalid" ${config.fillOnValid ? 'checked' : ''}> 标有效时填入</label>
                <label style="font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; color:#cf1322;"><input type="checkbox" id="asr-clearoninvalid" ${config.clearOnInvalid ? 'checked' : ''}> 标无效时清空</label>
                <label style="font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; color:#389e0d; font-weight:bold; grid-column: span 3;"><input type="checkbox" id="asr-autofillonload" ${config.autoFillOnLoad ? 'checked' : ''}> ⚡ 进入页面自动全页填充</label>

                <label style="font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; color:#c41d7f; font-weight:bold;"><input type="checkbox" id="asr-validatebeforesubmit" ${config.validateBeforeSubmit ? 'checked' : ''}> 加载完成后自动校验数据</label>
                <label style="font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; color:#c41d7f; grid-column: span 2;"><input type="checkbox" id="asr-autoclearinvalidvalidation" ${config.autoClearInvalidValidation ? 'checked' : ''}> 校验时遇到"无效"自动清空文本</label>
                <label style="font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; color:#c41d7f; grid-column: span 2;"><input type="checkbox" id="asr-autofillonvalidvalidation" ${config.autoFillOnValidValidation ? 'checked' : ''}> 校验时遇到"有效"自动填入文本</label>
                <label style="font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; color:#c41d7f;"><input type="checkbox" id="asr-autosubmitaftervalidation" ${config.autoSubmitAfterValidation ? 'checked' : ''}> 校验完毕后自动提交</label>
                <label style="font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; color:#52c41a; grid-column: span 3; margin-top:4px;">
                    <input type="checkbox" id="asr-autoreceiveonsubmit" ${config.autoReceiveOnSubmit ? 'checked' : ''}>
                    自动领取 (开启:快捷键点"提交任务" / 关闭:点"提交并结束")
                </label>
            </div>

            <div style="background: #f0f5ff; padding: 12px; border-radius: 8px; border: 1px solid #adc6ff;">
                <div style="font-size: 12px; color: #1d39c4; font-weight: bold; margin-bottom: 8px;">🤖 AI 标点修复 (通义千问 Qwen3.5-Flash，由服务器代理调用)</div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <label style="font-size: 13px; color: #333; white-space: nowrap;">API Key:</label>
                    <input type="password" id="asr-qwen-apikey" value="${config.qwenApiKey}" placeholder="sk-..." style="flex: 1; padding: 6px 10px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 13px;">
                </div>
                <label style="font-size: 12px; color: #1d39c4; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                    <input type="checkbox" id="asr-useadvancedrules" ${config.useAdvancedRules ? 'checked' : ''}> 启用 AI 标点严格规则（无引号/无省略号/加书名号）
                </label>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
                    <label style="font-size: 12px; color: #1d39c4; white-space: nowrap;">模型:</label>
                    <select id="asr-qwen-model" style="padding: 3px 6px; font-size: 12px; border: 1px solid #d9d9d9; border-radius: 4px; color: #333;">
                        <option value="qwen3.5-flash" ${config.qwenModel === 'qwen3.5-flash' ? 'selected' : ''}>Qwen3.5-Flash (默认)</option>
                        <option value="qwen3.6-plus" ${config.qwenModel === 'qwen3.6-plus' ? 'selected' : ''}>Qwen3.6-Plus</option>
                        <option value="siliconflow/deepseek-v3.2" ${config.qwenModel === 'siliconflow/deepseek-v3.2' ? 'selected' : ''}>DeepSeek-V3.2</option>
                        <option value="glm-5" ${config.qwenModel === 'glm-5' ? 'selected' : ''}>GLM-5</option>
                        <option value="kimi/kimi-k2.5" ${config.qwenModel === 'kimi/kimi-k2.5' ? 'selected' : ''}>Kimi-K2.5</option>
                    </select>
                </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 4px; gap: 20px;">
                <div style="flex: 1; display: flex; align-items: center; justify-content: space-between;">
                    <label style="font-size: 13px; color: #333; font-weight:bold;">全局音量调节 (0~1000%):</label>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <input type="number" id="asr-volumeval" value="${config.volumeValue}" step="50" min="0" max="1000" style="width: 60px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; text-align: center;"> %
                    </div>
                </div>
                <div style="flex: 1; display: flex; align-items: center; justify-content: space-between;">
                    <label style="font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight:bold;">
                        <input type="checkbox" id="asr-autoresetrate" ${config.autoResetRate ? 'checked' : ''}> 切换倍速重置为:
                    </label>
                    <input type="number" id="asr-resetrateval" value="${config.resetRateValue}" step="0.1" min="0.1" max="8.0" style="width: 60px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; text-align: center;">
                </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 4px; border-bottom: 1px dashed #eee; padding-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-size: 13px; color: #333; font-weight:bold;">数字转换模式:</label>
                    <select id="asr-numconvertmode" style="width: 100px; padding: 4px; border: 1px solid #d9d9d9; border-radius: 4px;">
                        <option value="千问" ${config.numConvertMode === '千问' ? 'selected' : ''}>千问模式</option>
                        <option value="蜂鸟众包" ${config.numConvertMode === '蜂鸟众包' ? 'selected' : ''}>蜂鸟众包</option>
                    </select>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-size: 13px; color: #333; font-weight:bold;">默认每页条数:</label>
                    <select id="asr-itemsperpage" style="width: 120px; padding: 4px; border: 1px solid #d9d9d9; border-radius: 4px;">
                        ${optionsHtml}
                    </select>
                </div>
            </div>

            <div id="asr-shortcuts-toggle" style="font-size: 13px; color: #1677ff; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: space-between; background: #e6f4ff; padding: 8px 12px; border-radius: 6px; margin-top: 4px;">
                <span>⌨️ 键盘快捷键录制 (点击展开 / 收起)</span>
                <span id="asr-shortcuts-icon" style="transition: transform 0.3s;">▼</span>
            </div>
            <div id="asr-shortcuts-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; overflow: hidden; max-height: 0px; transition: max-height 0.3s ease-in-out, margin-top 0.3s; padding: 0 4px; flex-shrink: 0;">
                ${createShortcutRow('面板开关', 'shortcutPanel')}
                ${createShortcutRow('全页标有效并填充', 'shortcutAllValid')}
                ${createShortcutRow('播放 / 暂停', 'shortcutPlayPause')}
                ${createShortcutRow('标记有效', 'shortcutValid')}
                ${createShortcutRow('标记无效', 'shortcutInvalid')}
                ${createShortcutRow('快速填入', 'shortcutFill')}
                ${createShortcutRow('切换输入(焦点)', 'shortcutToggleFocus')}
                ${createShortcutRow('全页数据校验', 'shortcutValidateItems')}
                ${createShortcutRow('转当前选择阿拉伯数字', 'shortcutConvertNum')}
                ${createShortcutRow('倍速 -0.1', 'shortcutSpeedDown')}
                ${createShortcutRow('倍速 +0.1', 'shortcutSpeedUp')}
                ${createShortcutRow('重置倍速', 'shortcutResetSpeed')}
                ${createShortcutRow('后退 1秒', 'shortcutBackward')}
                ${createShortcutRow('前进 1秒', 'shortcutForward')}
                ${createShortcutRow('复制总时长(秒)', 'shortcutCopyDuration')}
                ${createShortcutRow('音量 -50%', 'shortcutVolDown')}
                ${createShortcutRow('音量 +50%', 'shortcutVolUp')}
                ${createShortcutRow('重置音量 (100%)', 'shortcutResetVol')}
                ${createShortcutRow('去除当前空格', 'shortcutRemoveSpaces')}
                ${createShortcutRow('全页空格消除', 'shortcutRemoveAllSpaces')}
                ${createShortcutRow('智能提交', 'shortcutSubmit')}
                ${createShortcutRow('AI标点修复', 'shortcutFixPunctuationAll')}
                ${createShortcutRow('开关全自动批量提交', 'shortcutToggleAutoBatchSubmit')}
                ${createShortcutRow('开关校验后自动提交', 'shortcutToggleAutoSubmitAfterValidation')}
                ${createShortcutRow('排行榜开关', 'shortcutLeaderboard')}
                <div style="grid-column: 1 / -1; font-size: 11px; color: #999; text-align: center; padding: 4px 0;">如果在正在录制中，可以使用ESC退出录制</div>
            </div>

            <div style="background: #fffbe6; padding: 12px; border-radius: 8px; border: 1px solid #b7eb8f; margin-top: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; color: #389e0d; font-weight: bold;">自定义文本纠错规则 (支持多对一，原词用逗号分隔)：</span>
                    <div style="display:flex; gap:8px;">
                        <button id="asr-sync-dict-btn" style="padding: 2px 8px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">🔄 同步云端词库(覆盖本地)</button>
                        <button id="asr-upload-dict-btn" style="padding: 2px 8px; background: #faad14; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">⬆️ 上传本地数据</button>
                        <button id="asr-add-replace-btn" style="padding: 2px 8px; background: #52c41a; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">+ 本地添加</button>
                    </div>
                </div>
                <div id="asr-custom-replacements-container" style="display: flex; flex-direction: column; gap: 6px; max-height: 120px; overflow-y: auto;"></div>
            </div>

            <div style="background: #e6f4ff; padding: 12px; border-radius: 8px; border: 1px solid #91caff; margin-top: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; color: #0958d9; font-weight: bold;">自定义定速快捷键 (范围 0.1 ~ 8.0)：</span>
                    <button id="asr-add-rate-btn" style="padding: 2px 8px; background: #1677ff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">+ 添加定速</button>
                </div>
                <div id="asr-custom-rates-container" style="display: flex; flex-direction: column; gap: 6px; max-height: 120px; overflow-y: auto;"></div>
            </div>

            <div style="background: #f6ffed; padding: 12px; border-radius: 8px; border: 1px solid #b7eb8f; margin-top: 6px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <label style="font-size: 13px; color: #389e0d; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                        <input type="checkbox" id="asr-autoassign-check" ${config.autoAssignCheckTasks ? 'checked' : ''}> 🚀 开启定时轮询抢单 (每 60 秒)
                    </label>
                    <button id="asr-manual-assign-btn" style="padding: 2px 8px; background: #52c41a; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">⚡ 手动立即执行</button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <label style="font-size: 12px; color: #333; display: flex; align-items: center; gap: 4px; white-space: nowrap;"><input type="checkbox" id="asr-autoassign-all-tasks" ${config.autoAssignAllTasks ? 'checked' : ''}>检查全部任务</label>
                        <input type="text" id="asr-autoassign-keyword" value="${config.autoAssignTaskKeyword}" placeholder="或输入任务词/ID (逗号分隔)" style="flex: 2; padding: 4px; font-size: 12px; border: 1px solid #ccc; border-radius: 4px;" ${config.autoAssignAllTasks ? 'disabled' : ''}>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="text" id="asr-autoassign-user" value="${config.autoAssignTargetUser}" placeholder="目标人员名称 (逗号分隔)" style="flex: 2; padding: 4px; font-size: 12px; border: 1px solid #ccc; border-radius: 4px;">
                        <label style="font-size: 12px; color: #333; display: flex; align-items: center; gap: 4px; white-space: nowrap;"><input type="checkbox" id="asr-autoassign-fetch-all" ${config.autoAssignFetchAll ? 'checked' : ''}>全部领取</label>
                        <input type="number" id="asr-autoassign-batch" value="${config.autoAssignBatchSize}" placeholder="指定包数量" style="flex: 1; padding: 4px; font-size: 12px; border: 1px solid #ccc; border-radius: 4px;" ${config.autoAssignFetchAll ? 'disabled' : ''}>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 4px;">
                <button id="asr-clear-cache-btn" style="flex: 1; padding: 8px 0; background: #fff; color: #fa8c16; border: 1px solid #fa8c16; border-radius: 6px; cursor: pointer; transition: all 0.2s;">清除所有缓存</button>
                <button id="asr-reset-btn" style="flex: 1; padding: 8px 0; background: #fff; color: #ff4d4f; border: 1px solid #ff4d4f; border-radius: 6px; cursor: pointer; transition: all 0.2s;">恢复默认(覆写现有)</button>
                <button id="asr-save-btn" style="flex: 2; padding: 8px 0; background: #1677ff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s;">保存并生效</button>
            </div>
        `;

        backdrop.appendChild(panel);
        document.body.appendChild(backdrop);

        const titleEl = document.getElementById('asr-panel-title');
        const debugIndicator = document.getElementById('asr-debug-indicator');
        debugIndicator.innerText = isDebugMode ? '🔧 调试模式(127.0.0.1)' : '🌐 正式模式(线上)';

        let titleClickCount = 0;
        let titleClickTimer = null;
        titleEl.onmousedown = (e) => {
            e.preventDefault(); 
            titleClickCount++;
            if (titleClickTimer) clearTimeout(titleClickTimer);

            if (titleClickCount >= 5) {
                titleClickCount = 0;
                debugIndicator.style.display = 'inline-block';
                showToast('🛠️ 开发者模式开关已显现！');
            } else if (titleClickCount >= 2) {
                showToast(`再按 ${5 - titleClickCount} 次唤出开发者选项`);
            }

            titleClickTimer = setTimeout(() => { titleClickCount = 0; }, 600); 
        };

        debugIndicator.onclick = () => {
            isDebugMode = !isDebugMode;
            GM_setValue('asr_debug_mode', isDebugMode);
            debugIndicator.innerText = isDebugMode ? '🔧 调试模式(127.0.0.1)' : '🌐 正式模式(线上)';
            showToast(isDebugMode ? '🔄 已切换至本地调试模式 (127.0.0.1)' : '🔄 已切换至线上正式模式');
        };

        renderCustomRatesUI();

        const toggleBtn = document.getElementById('asr-shortcuts-toggle');
        const shortcutsContainer = document.getElementById('asr-shortcuts-container');
        const toggleIcon = document.getElementById('asr-shortcuts-icon');
        let isShortcutsOpen = false;
        toggleBtn.onclick = () => {
            isShortcutsOpen = !isShortcutsOpen;
            shortcutsContainer.style.maxHeight = isShortcutsOpen ? '1500px' : '0px';
            shortcutsContainer.style.marginTop = isShortcutsOpen ? '8px' : '0px';
            toggleIcon.style.transform = isShortcutsOpen ? 'rotate(180deg)' : 'rotate(0deg)';
        };

        renderCustomReplacementsUI();

        const checkAllTasks = document.getElementById('asr-autoassign-all-tasks');
        const kwInput = document.getElementById('asr-autoassign-keyword');
        if (checkAllTasks && kwInput) checkAllTasks.onchange = (e) => kwInput.disabled = e.target.checked;

        const checkFetchAll = document.getElementById('asr-autoassign-fetch-all');
        const batchInput = document.getElementById('asr-autoassign-batch');
        if (checkFetchAll && batchInput) checkFetchAll.onchange = (e) => batchInput.disabled = e.target.checked;

        const manualBtn = document.getElementById('asr-manual-assign-btn');
        if (manualBtn) {
            manualBtn.onclick = () => {
                config.autoAssignTargetUser = document.getElementById('asr-autoassign-user').value;
                config.autoAssignAllTasks = document.getElementById('asr-autoassign-all-tasks').checked;
                config.autoAssignTaskKeyword = document.getElementById('asr-autoassign-keyword').value;
                config.autoAssignFetchAll = document.getElementById('asr-autoassign-fetch-all').checked;
                config.autoAssignBatchSize = parseInt(document.getElementById('asr-autoassign-batch').value) || 1;
                executeAutoAssign(true); // true 表示手动触发，无视定时器开关
            };
        }

        const closePanel = () => { backdrop.style.display = 'none'; resetRecordingUI(recordingTarget); recordingTarget = null; };
        document.getElementById('asr-close-btn').onclick = closePanel;
        backdrop.onclick = (e) => { if(e.target === backdrop) closePanel(); };

        document.getElementById('asr-check-update-btn').onclick = (e) => {
            const btn = e.target;
            btn.innerText = '检测中...';
            btn.style.background = '#8c8c8c';

            GM_xmlhttpRequest({
                method: "GET",
                url: getApiBase() + "/asr/asr-script.user.js?t=" + Date.now(),
                headers: { "Range": "bytes=0-1000" },
                onload: function(res) {
                    try {
                        const remoteScript = res.responseText;
                        const versionMatch = remoteScript.match(/@version\s+([\d\.]+)/);
                        if (versionMatch && versionMatch[1]) {
                            const remoteVersion = versionMatch[1];
                            const currentVersion = GM_info.script.version;

                            if (isVersionNewer(remoteVersion, currentVersion)) {
                                showToast(`🚀 发现新版本 v${remoteVersion}，正在为您跳转更新...`);
                                setTimeout(() => {
                                    window.open('http://47.108.254.138:3101/asr/asr-script.user.js?t=' + Date.now(), '_blank');
                                    showRefreshReminder();
                                }, 1000);
                            } else {
                                showToast(`✅ 当前(v${currentVersion})已是最新版！`);
                                btn.innerText = '已是最新';
                                btn.style.background = '#52c41a';
                                setTimeout(() => {
                                    btn.innerText = '🔄 手动检查更新';
                                    btn.style.background = '#52c41a';
                                }, 3000);
                            }
                        } else {
                            showToast('❌ 无法解析云端版本号');
                            btn.innerText = '🔄 手动检查更新';
                            btn.style.background = '#52c41a';
                        }
                    } catch (e) {
                        showToast('❌ 检测更新失败，请重试');
                        btn.innerText = '🔄 手动检查更新';
                        btn.style.background = '#52c41a';
                    }
                },
                onerror: function() {
                    showToast('❌ 连接云服务器失败');
                    btn.innerText = '🔄 手动检查更新';
                    btn.style.background = '#ff4d4f';
                    setTimeout(() => {
                        btn.innerText = '🔄 手动检查更新';
                        btn.style.background = '#52c41a';
                    }, 3000);
                }
            });
        };

        document.getElementById('asr-add-rate-btn').onclick = () => {
            config.customRates.push({ rate: 1.0, shortcut: null });
            renderCustomRatesUI();
        };

        document.getElementById('asr-add-replace-btn').onclick = () => {
            config.customReplacements.push({ from: '', to: '' });
            renderCustomReplacementsUI();
        };

        const syncBtn = document.getElementById('asr-sync-dict-btn');
        if (syncBtn) {
            syncBtn.onclick = () => {
                syncBtn.innerHTML = '⏳ 同步中...';
                syncBtn.style.background = '#8c8c8c';
                syncBtn.disabled = true;
                syncDictFromCloud((success) => {
                    syncBtn.disabled = false;
                    if (success) {
                        showToast('✅ 本地规则已清空！云端最新数据已成功同步并应用！');
                        syncBtn.innerHTML = '✔️ 同步成功';
                        syncBtn.style.background = '#52c41a';
                        setTimeout(() => { syncBtn.innerHTML = '🔄 同步云端词库(覆盖本地)'; syncBtn.style.background = '#1890ff'; }, 2000);
                    } else {
                        syncBtn.innerHTML = '🔄 同步云端词库(覆盖本地)';
                        syncBtn.style.background = '#1890ff';
                    }
                });
            };
        }

        const uploadBtn = document.getElementById('asr-upload-dict-btn');
            if (uploadBtn) {
                uploadBtn.onclick = () => {
                    uploadBtn.innerText = '上传中...';
                    uploadBtn.style.background = '#8c8c8c';
                    GM_xmlhttpRequest({
                        method: "POST",
                        url: getApiBase() + "/asr/submit-dict-review",
                        headers: { "Content-Type": "application/json" },
                        data: JSON.stringify(config.customReplacements),
                        onload: function(res) {
                            if (res.status === 200) {
                                showToast('✅ 本地词库已成功推送至云端待审库！');
                                uploadBtn.innerText = '已上传 ✔️';
                                uploadBtn.style.background = '#52c41a';
                            } else {
                                showToast(`❌ 上传失败，状态码: ${res.status}`);
                                resetUploadBtn();
                            }
                            setTimeout(resetUploadBtn, 2000);
                        },
                        onerror: function() { showToast('❌ 连接服务器失败'); resetUploadBtn(); }
                    });
                    function resetUploadBtn() { uploadBtn.innerText = '⬆️ 上传本地数据'; uploadBtn.style.background = '#faad14'; }
                };
            }

        const allShortcutKeys = [
            'shortcutPanel', 'shortcutAllValid', 'shortcutFill', 'shortcutValid', 'shortcutInvalid', 'shortcutPlayPause',
            'shortcutForward', 'shortcutBackward', 'shortcutSpeedUp', 'shortcutSpeedDown',
            'shortcutToggleFocus', 'shortcutResetSpeed', 'shortcutVolUp', 'shortcutVolDown', 'shortcutResetVol',
            'shortcutCopyDuration', 'shortcutSubmit', 'shortcutValidateItems', 'shortcutConvertNum',
            'shortcutRemoveSpaces', 'shortcutRemoveAllSpaces', 'shortcutFixPunctuationAll',
            'shortcutToggleAutoBatchSubmit', 'shortcutToggleAutoSubmitAfterValidation', 'shortcutLeaderboard'
        ];

        allShortcutKeys.forEach(key => {
            const btn = document.getElementById(`btn-${key}`);
            if(btn) {
                btn.onclick = (e) => {
                    if (recordingTarget) resetRecordingUI(recordingTarget);
                    recordingTarget = key;
                    btn.innerText = '录制中...';
                    btn.style.background = '#e6f4ff'; btn.style.borderColor = '#1677ff'; btn.style.color = '#1677ff';
                };
            }
        });

        shortcutsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('asr-shortcut-del-btn')) {
                const key = e.target.getAttribute('data-shortcut-key');
                if (key) {
                    if (recordingTarget === key) {
                        resetRecordingUI(key);
                        recordingTarget = null;
                    }
                    config[key] = null;
                    const btn = document.getElementById(`btn-${key}`);
                    if (btn) {
                        btn.innerText = '未设置';
                        btn.style.background = '#f5f5f5'; btn.style.borderColor = '#d9d9d9'; btn.style.color = '#999';
                    }
                    showToast('已清除快捷键绑定');
                }
            }
        });

        document.getElementById('asr-clear-cache-btn').onclick = () => {
            if(confirm('确定要清除脚本所有缓存吗？（更新检测缓存、本页时长等，您的个人配置不受影响）')) {
                GM_setValue('asr_last_update_check_time', 0);
                GM_setValue('asr_script_version', '0');
                currentTotalDuration = 0;
                audioFilenameToDuration = {};
                cachedDataList = [];
                updateDurationDisplay();
                showToast('✅ 所有缓存已清空！本页时长已重置为当前有效条目。');
            }
        };

        document.getElementById('asr-reset-btn').onclick = () => {
            if(confirm('⚠️ 确定要恢复所有设置到默认状态吗？\n(这将会应用最新的默认快捷键与词库，并覆盖您当前的数据)')) {
                Object.keys(DEFAULT_CONFIG).forEach(k => GM_setValue(k, DEFAULT_CONFIG[k]));
                location.reload();
            }
        };

        // 绑定数字模式下拉框实时生效（免保存）
        const numModeSelect = document.getElementById('asr-numconvertmode');
        if (numModeSelect) {
            numModeSelect.onchange = (e) => {
                config.numConvertMode = e.target.value;
                showToast(`🔄 已实时切换为【${config.numConvertMode}】`);
            };
        }

        document.getElementById('asr-save-btn').onclick = (e) => {
            const saveBtn = e.target;

            const newReplacements = [];
            document.querySelectorAll('#asr-custom-replacements-container > div').forEach(row => {
                const fromVal = row.querySelector('.asr-replace-from-input').value;
                const toVal = row.querySelector('.asr-replace-to-input').value;
                if (fromVal !== undefined && toVal !== undefined) {
                    newReplacements.push({ from: fromVal, to: toVal });
                }
            });
            config.customReplacements = newReplacements;

            const newRates = [];
            document.querySelectorAll('#asr-custom-rates-container > div').forEach((row, idx) => {
                const rateVal = parseFloat(row.querySelector('.asr-rate-val-input').value) || 1.0;
                newRates.push({ rate: rateVal, shortcut: config.customRates[idx]?.shortcut || null });
            });
            config.customRates = newRates;

            config.autoPlay = document.getElementById('asr-autoplay').checked;
            config.defaultValid = document.getElementById('asr-defaultvalid').checked;
            config.autoBatchSubmit = document.getElementById('asr-autobatchsubmit').checked;
            config.fillOnValid = document.getElementById('asr-fillonvalid').checked;
            config.clearOnInvalid = document.getElementById('asr-clearoninvalid').checked;
            config.autoNext = document.getElementById('asr-autonext').checked;
            config.itemsPerPage = document.getElementById('asr-itemsperpage').value;

            config.autoReceiveOnSubmit = document.getElementById('asr-autoreceiveonsubmit').checked;
            config.validateBeforeSubmit = document.getElementById('asr-validatebeforesubmit').checked;
            config.autoClearInvalidValidation = document.getElementById('asr-autoclearinvalidvalidation').checked;
            config.autoFillOnValidValidation = document.getElementById('asr-autofillonvalidvalidation').checked;
            config.autoSubmitAfterValidation = document.getElementById('asr-autosubmitaftervalidation').checked;
            config.numConvertMode = document.getElementById('asr-numconvertmode').value;
            config.autoResetRate = document.getElementById('asr-autoresetrate').checked;
            config.resetRateValue = parseFloat(document.getElementById('asr-resetrateval').value) || 1.0;
            config.volumeValue = parseInt(document.getElementById('asr-volumeval').value) || 100;
            config.autoAssignCheckTasks = document.getElementById('asr-autoassign-check').checked;
            config.autoAssignTaskKeyword = document.getElementById('asr-autoassign-keyword').value;
            config.autoAssignTargetUser = document.getElementById('asr-autoassign-user').value;
            config.autoAssignBatchSize = parseInt(document.getElementById('asr-autoassign-batch').value) || 99999;
            config.autoAssignAllTasks = document.getElementById('asr-autoassign-all-tasks').checked;
            config.autoAssignFetchAll = document.getElementById('asr-autoassign-fetch-all').checked;
            config.autoFillOnLoad = document.getElementById('asr-autofillonload').checked;
            config.qwenApiKey = document.getElementById('asr-qwen-apikey').value.trim();
            config.useAdvancedRules = document.getElementById('asr-useadvancedrules').checked;
            config.qwenModel = document.getElementById('asr-qwen-model').value;

            startAutoAssignPoll();
            Object.keys(config).forEach(k => GM_setValue(k, config[k]));
            if (currentAudio) setAudioVolume(currentAudio, config.volumeValue);

            // 彻底剥离云端请求，只做极速本地保存
            saveBtn.innerText = '已保存并生效 ✔️';
            saveBtn.style.background = '#52c41a';
            showToast('✅ 设置已在本地保存并生效');
            setTimeout(() => {
                saveBtn.innerText = '保存并生效';
                saveBtn.style.background = '#1677ff';
                closePanel();
            }, 500);
        };
    }

    function resetRecordingUI(targetKey) {
        if (!targetKey) {
            console.log('[ASR] resetRecordingUI: targetKey无效');
            return;
        }
        console.log(`[ASR] resetRecordingUI: targetKey=${targetKey}`);
        if (targetKey.startsWith('customRate_')) {
            renderCustomRatesUI();
        } else {
            const btn = document.getElementById(`btn-${targetKey}`);
            if (btn) {
                btn.innerText = formatShortcut(config[targetKey]);
                btn.style.background = '#f5f5f5'; btn.style.borderColor = '#d9d9d9'; btn.style.color = '#333';
            }
        }
    }

    function createShortcutRow(label, key) {
        return `
            <div style="display: flex; flex-direction: column; margin-bottom: 2px;">
                <span style="font-size: 11px; color: #555; margin-bottom: 2px;">${label}</span>
                <div style="display: flex; gap: 4px;">
                    <button id="btn-${key}" data-shortcut-key="${key}" class="asr-shortcut-rec-btn" style="flex: 1; padding: 4px 6px; background: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 4px; cursor: pointer; font-size: 11px; color: #333; transition: all 0.2s; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; text-align: left;">
                        ${formatShortcut(config[key])}
                    </button>
                    <button class="asr-shortcut-del-btn" data-shortcut-key="${key}" style="padding: 4px 8px; background: #ff4d4f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; flex-shrink: 0;" title="删除此快捷键">×</button>
                </div>
            </div>
        `;
    }

    function renderCustomRatesUI() {
        const container = document.getElementById('asr-custom-rates-container');
        if (!container) return;
        container.innerHTML = '';

        config.customRates.forEach((cr, index) => {
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; align-items: center; gap: 8px; background: #fff; padding: 4px 8px; border-radius: 6px; border: 1px solid #d9d9d9;';
            row.innerHTML = `
                <span style="font-size:12px;color:#333;">倍速:</span>
                <input type="number" step="0.1" min="0.1" max="8.0" class="asr-rate-val-input" data-index="${index}" value="${cr.rate}" style="width: 50px; padding: 2px; text-align: center; font-size: 12px; border: 1px solid #ccc; border-radius: 4px;">
                <button class="asr-rate-shortcut-btn" data-index="${index}" style="flex: 1; padding: 4px; background: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 4px; cursor: pointer; font-size: 11px; color: #333;">
                    ${formatShortcut(cr.shortcut)}
                </button>
                <button class="asr-rate-del-btn" data-index="${index}" style="padding: 4px 8px; background: #ff4d4f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">删</button>
            `;
            container.appendChild(row);
        });

        container.querySelectorAll('.asr-rate-val-input').forEach(input => {
            input.onchange = (e) => {
                const idx = e.target.getAttribute('data-index');
                config.customRates[idx].rate = parseFloat(e.target.value) || 1.0;
            };
        });

        container.querySelectorAll('.asr-rate-shortcut-btn').forEach(btn => {
            btn.onclick = (e) => {
                if (recordingTarget) resetRecordingUI(recordingTarget);
                const idx = e.target.getAttribute('data-index');
                recordingTarget = `customRate_${idx}`;
                e.target.innerText = '录制中...';
                e.target.style.background = '#e6f4ff'; e.target.style.borderColor = '#1677ff'; e.target.style.color = '#1677ff';
            };
        });

        container.querySelectorAll('.asr-rate-del-btn').forEach(btn => {
            btn.onclick = (e) => {
                const idx = e.target.getAttribute('data-index');
                config.customRates.splice(idx, 1);
                renderCustomRatesUI();
            };
        });
    }

    function renderCustomReplacementsUI() {
        const container = document.getElementById('asr-custom-replacements-container');
        if (!container) return;
        container.innerHTML = '';

        config.customReplacements.forEach((rule, index) => {
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; align-items: center; gap: 8px; background: #fff; padding: 4px 8px; border-radius: 6px; border: 1px solid #d9d9d9;';
            row.innerHTML = `
                <span style="font-size:12px;color:#333; white-space:nowrap;">将</span>
                <input type="text" class="asr-replace-from-input" data-index="${index}" value="${rule.from}" placeholder="识别文本 (多个用逗号隔开)" style="flex: 1; min-width: 0; padding: 2px 4px; font-size: 12px; border: 1px solid #ccc; border-radius: 4px;" title="支持输入多个词，用逗号或者竖线隔开">
                <span style="font-size:12px;color:#333; white-space:nowrap;">替换为</span>
                <input type="text" class="asr-replace-to-input" data-index="${index}" value="${rule.to}" placeholder="目标文本" style="flex: 1; min-width: 0; padding: 2px 4px; font-size: 12px; border: 1px solid #ccc; border-radius: 4px;">
                <button class="asr-replace-del-btn" data-index="${index}" style="padding: 4px 8px; background: #ff4d4f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">删</button>
            `;
            container.appendChild(row);
        });

        container.querySelectorAll('.asr-replace-from-input').forEach(input => {
            input.onchange = (e) => {
                const idx = e.target.getAttribute('data-index');
                config.customReplacements[idx].from = e.target.value;
            };
        });

        container.querySelectorAll('.asr-replace-to-input').forEach(input => {
            input.onchange = (e) => {
                const idx = e.target.getAttribute('data-index');
                config.customReplacements[idx].to = e.target.value;
            };
        });

        container.querySelectorAll('.asr-replace-del-btn').forEach(btn => {
            btn.onclick = (e) => {
                const idx = e.target.getAttribute('data-index');
                config.customReplacements.splice(idx, 1);
                renderCustomReplacementsUI();
            };
        });
    }

    // ================= 5. 快捷键与多媒体控制核心 =================
    function formatShortcut(sc) {
        if (!sc) return '未设置';
        let keys = [];
        if (sc.ctrl) keys.push('Ctrl');
        if (sc.alt) keys.push('Alt');
        if (sc.shift) keys.push('Shift');
        if (sc.meta) keys.push('Meta');
        if (sc.key) {
            let keyName = sc.key.toUpperCase();
            if (keyName === ' ') keyName = '空格';
            if (keyName.includes('ARROW')) keyName = keyName.replace('ARROW', '按键');
            keys.push(keyName);
        }
        if (sc.button !== null) keys.push(`鼠标${sc.button}`);
        return keys.join('+');
    }

    function isShortcutEqual(sc1, sc2) {
        if (!sc1 || !sc2) return false;
        const equal = sc1.ctrl === sc2.ctrl && sc1.alt === sc2.alt && sc1.shift === sc2.shift &&
               sc1.meta === sc2.meta && sc1.key === sc2.key && sc1.button === sc2.button;
        console.log(`[ASR] isShortcutEqual: ${equal} key1=${sc1.key} key2=${sc2.key}`);
        return equal;
    }

    function checkShortcutConflict(newSc, excludeKey) {
        if (!newSc || (newSc.key === null && newSc.button === null)) {
            console.log('[ASR] checkShortcutConflict: 配置无效');
            return false;
        }
        console.log(`[ASR] checkShortcutConflict: key=${newSc.key} excludeKey=${excludeKey}`);
        const flatKeys = [
            'shortcutPanel', 'shortcutAllValid', 'shortcutFill', 'shortcutValid', 'shortcutInvalid', 'shortcutPlayPause',
            'shortcutForward', 'shortcutBackward', 'shortcutSpeedUp', 'shortcutSpeedDown',
            'shortcutToggleFocus', 'shortcutResetSpeed', 'shortcutVolUp', 'shortcutVolDown', 'shortcutResetVol',
            'shortcutCopyDuration', 'shortcutSubmit', 'shortcutValidateItems', 'shortcutConvertNum',
            'shortcutRemoveSpaces', 'shortcutRemoveAllSpaces', 'shortcutFixPunctuationAll',
            'shortcutToggleAutoBatchSubmit', 'shortcutToggleAutoSubmitAfterValidation', 'shortcutLeaderboard'
        ];
        for (const key of flatKeys) {
            if (key !== excludeKey && isShortcutEqual(config[key], newSc)) return true;
        }
        for (let i = 0; i < config.customRates.length; i++) {
            if (`customRate_${i}` !== excludeKey && isShortcutEqual(config.customRates[i].shortcut, newSc)) return true;
        }
        return false;
    }

    function isShortcutMatch(e, sc) {
        if (!sc) return false;
        const keyLower = e.key ? e.key.toLowerCase() : null;
        const isKeyMatch = e.type === 'keydown' && keyLower !== null && sc.key === keyLower && sc.button === null;
        const isMouseMatch = e.type === 'mousedown' && sc.button === e.button && sc.key === null;
        return (isKeyMatch || isMouseMatch) && sc.ctrl === e.ctrlKey && sc.alt === e.altKey && sc.shift === e.shiftKey && sc.meta === e.metaKey;
    }

    function haltEvent(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }

    function getSafeActiveAudio() {
        if (currentAudio && !currentAudio.paused) return currentAudio;
        const activeItem = document.querySelector('.labelRender-item-selected');
        if (activeItem) {
            const audio = activeItem.querySelector('audio');
            if (audio) {
                currentAudio = audio;
                return audio;
            }
        }
        return currentAudio;
    }

    function adjustAudioRate(delta, absoluteRate = null) {
        const audioToAdjust = getSafeActiveAudio();
        if (!audioToAdjust) return;
        let rate = audioToAdjust.playbackRate;
        if (absoluteRate !== null) {
            rate = absoluteRate;
        } else {
            rate = Math.round((rate + delta) * 10) / 10;
        }
        rate = Math.max(0.1, Math.min(rate, 8.0));

        audioToAdjust.playbackRate = rate;
        showToast(`倍速: ${rate.toFixed(1)}x`);

        const container = audioToAdjust.closest('.labelRender-item');
        if (container) {
            const speedSpan = container.querySelector('.ant-v5-select-selection-item');
            if (speedSpan && speedSpan.innerText.includes('x')) {
                speedSpan.innerText = `${rate.toFixed(1)}x`;
                speedSpan.title = `${rate.toFixed(1)}x`;
            }
        }
    }

    function adjustAudioTime(deltaSec) {
        const audioToAdjust = getSafeActiveAudio();
        if (!audioToAdjust) return;
        let newTime = audioToAdjust.currentTime + deltaSec;
        newTime = Math.max(0, Math.min(newTime, audioToAdjust.duration || 9999));
        audioToAdjust.currentTime = newTime;
        showToast(`${deltaSec > 0 ? '前进' : '后退'}: 1s`);
    }

    function adjustVolume(delta, absoluteVol = null) {
        if (absoluteVol !== null) {
            config.volumeValue = absoluteVol;
        } else {
            config.volumeValue = Math.max(0, Math.min(1000, config.volumeValue + delta));
        }
        GM_setValue('volumeValue', config.volumeValue);

        const volInput = document.getElementById('asr-volumeval');
        if (volInput) volInput.value = config.volumeValue;

        const audioToAdjust = getSafeActiveAudio();
        if (audioToAdjust) {
            setAudioVolume(audioToAdjust, config.volumeValue);
            showToast(`音量: ${config.volumeValue}%`);
        }
    }

    function triggerShortcutEvent(sc) {
        if (!sc || (sc.key === null && sc.button === null)) {
            console.log('[ASR] triggerShortcutEvent: 配置无效，跳过');
            return;
        }
        console.log(`[ASR] triggerShortcutEvent: key=${sc.key} button=${sc.button}`);
        if (sc.key !== null) {
            const event = new KeyboardEvent('keydown', {
                key: sc.key,
                code: 'Key' + sc.key.toUpperCase(),
                ctrlKey: sc.ctrl,
                altKey: sc.alt,
                shiftKey: sc.shift,
                metaKey: sc.meta,
                bubbles: true,
                cancelable: true
            });
            window.dispatchEvent(event); // 使用 window 派发以确保被 capture 阶段完美捕获
        } else if (sc.button !== null) {
            const event = new MouseEvent('mousedown', {
                button: sc.button,
                ctrlKey: sc.ctrl,
                altKey: sc.alt,
                shiftKey: sc.shift,
                metaKey: sc.meta,
                bubbles: true,
                cancelable: true
            });
            window.dispatchEvent(event);
        }
    }

    function handleGlobalInput(e) {
        if (recordingTarget) {
            console.log(`[ASR] handleGlobalInput: 录制快捷键 type=${e.type} key=${e.key}`);
            e.preventDefault(); e.stopPropagation();
            if (e.type === 'keydown' && e.key === 'Escape') {
                resetRecordingUI(recordingTarget);
                recordingTarget = null;
                return;
            }
            if (e.type === 'keydown' && ['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

            let newShortcut = { ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey, key: e.type === 'keydown' ? e.key.toLowerCase() : null, button: e.type === 'mousedown' ? e.button : null };

            if (checkShortcutConflict(newShortcut, recordingTarget)) {
                showToast('⚠️ 快捷键设置失败：该按键已被占用！');
                resetRecordingUI(recordingTarget);
                recordingTarget = null;
                return;
            }

            if (recordingTarget.startsWith('customRate_')) {
                const idx = parseInt(recordingTarget.split('_')[1]);
                config.customRates[idx].shortcut = newShortcut;
                renderCustomRatesUI();
            } else {
                config[recordingTarget] = newShortcut;
                resetRecordingUI(recordingTarget);
            }
            recordingTarget = null;
            return;
        }

        if (isShortcutMatch(e, config.shortcutRemoveSpaces)) {
            haltEvent(e);
            const activeItem = document.querySelector('.labelRender-item-selected');
            if (activeItem) removeCurrentItemSpaces(activeItem);
            else showToast('⚠️ 请先选中一条数据');
            return;
        }

        if (isShortcutMatch(e, config.shortcutRemoveAllSpaces)) {
            haltEvent(e);
            removeAllSpaces();
            return;
        }

        if (isShortcutMatch(e, config.shortcutFixPunctuationAll)) {
            haltEvent(e);
            fixPunctuationAll();
            return;
        }

        if (isShortcutMatch(e, config.shortcutToggleAutoBatchSubmit)) {
            haltEvent(e);
            config.autoBatchSubmit = !config.autoBatchSubmit;
            GM_setValue('autoBatchSubmit', config.autoBatchSubmit);
            showToast(config.autoBatchSubmit ? '🤖 全自动批量提交引擎已开启' : '已关闭');
            return;
        }

        if (isShortcutMatch(e, config.shortcutToggleAutoSubmitAfterValidation)) {
            haltEvent(e);
            config.autoSubmitAfterValidation = !config.autoSubmitAfterValidation;
            GM_setValue('autoSubmitAfterValidation', config.autoSubmitAfterValidation);
            showToast(config.autoSubmitAfterValidation ? '✅ 校验后自动提交已开启' : '已关闭');
            return;
        }

        if (isShortcutMatch(e, config.shortcutLeaderboard)) {
            haltEvent(e);
            toggleLeaderboard();
            return;
        }

        if (isShortcutMatch(e, config.shortcutToggleFocus)) {
            haltEvent(e);
            const activeItem = document.querySelector('.labelRender-item-selected');
            if (activeItem) {
                const ta = getTargetTextarea(activeItem);
                if (ta) {
                    if (document.activeElement === ta) {
                        ta.blur();
                        document.body.focus();
                    } else {
                        ta.focus();
                        ta.selectionStart = ta.value.length;
                        ta.selectionEnd = ta.value.length;
                    }
                }
            }
            return;
        }


        const activeEl = document.activeElement;
        const isTextInput = activeEl && (
            (activeEl.tagName === 'INPUT' && !['radio', 'checkbox', 'button', 'submit'].includes(activeEl.type)) ||
            activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable
        );
        if (isTextInput && !e.ctrlKey && !e.altKey && !e.metaKey) return;

        if (isShortcutMatch(e, config.shortcutAllValid)) {
            haltEvent(e);
            markAllValid();
            return;
        }

        if (isShortcutMatch(e, config.shortcutCopyDuration)) {
            haltEvent(e);
            copyToClipboard(currentTotalDuration.toFixed(2));
            return;
        }

        if (isShortcutMatch(e, config.shortcutSubmit)) {
            haltEvent(e);
            showLoadingMask('正在准备智能提交...');
            performQuickSubmit();
            return;
        }

        if (isShortcutMatch(e, config.shortcutValidateItems)) {
            haltEvent(e);
            showLoadingMask('正在校验全页数据...');
            if (validateAllItems()) {
                showToast('✅ 页面所有数据校验通过！');
                if (config.autoSubmitAfterValidation) {
                    showLoadingMask('正在准备智能提交...');
                    setTimeout(performQuickSubmit, 300);
                } else {
                    hideLoadingMask(); // 只有当不需要提交时才隐藏
                }
            } else {
                hideLoadingMask();
            }
            return;
        }

        if (isShortcutMatch(e, config.shortcutConvertNum)) {
            haltEvent(e);
            const activeItem = document.querySelector('.labelRender-item-selected');
            if (activeItem) {
                convertAllChineseNums(activeItem);
            } else {
                showToast('⚠️ 请先选中一条需要转换的数据');
            }
            return;
        }

        if (isShortcutMatch(e, config.shortcutPanel)) {
            haltEvent(e);
            const backdrop = document.getElementById('asr-settings-backdrop');
            if (backdrop.style.display === 'none') {
                backdrop.style.display = 'flex';
                const dbgInd = document.getElementById('asr-debug-indicator');
                if (dbgInd) dbgInd.style.display = 'none';
            } else {
                backdrop.style.display = 'none';
            }
            return;
        }

        if (!isTextInput) {
            if (e.type === 'keydown' && e.code === 'Space') {
                haltEvent(e);
                const targetAudio = getSafeActiveAudio();
                if (targetAudio) { targetAudio.paused ? targetAudio.play() : targetAudio.pause(); }
                return;
            }
        }

        const activeItem = document.querySelector('.labelRender-item-selected');

        for (let i = 0; i < config.customRates.length; i++) {
            if (isShortcutMatch(e, config.customRates[i].shortcut)) {
                haltEvent(e);
                adjustAudioRate(0, config.customRates[i].rate);
                return;
            }
        }

        let matched = false;
        
        if (isShortcutMatch(e, config.shortcutPlayPause)) { 
            matched = true;
            const targetAudio = getSafeActiveAudio();
            if (targetAudio) { targetAudio.paused ? targetAudio.play() : targetAudio.pause(); } 
        }
        else if (isShortcutMatch(e, config.shortcutForward)) { matched = true; adjustAudioTime(1.0); }
        else if (isShortcutMatch(e, config.shortcutBackward)) { matched = true; adjustAudioTime(-1.0); }
        else if (isShortcutMatch(e, config.shortcutSpeedUp)) { 
            matched = true; 
            if (!e.repeat) adjustAudioRate(0.1); 
        }
        else if (isShortcutMatch(e, config.shortcutSpeedDown)) { 
            matched = true; 
            if (!e.repeat) adjustAudioRate(-0.1); 
        }
        else if (isShortcutMatch(e, config.shortcutResetSpeed)) { matched = true; adjustAudioRate(0, config.resetRateValue); }
        else if (isShortcutMatch(e, config.shortcutVolUp)) { matched = true; adjustVolume(50); }
        else if (isShortcutMatch(e, config.shortcutVolDown)) { matched = true; adjustVolume(-50); }
        else if (isShortcutMatch(e, config.shortcutResetVol)) { matched = true; adjustVolume(0, 100); }
        else if (activeItem) {
            if (isShortcutMatch(e, config.shortcutFill)) { matched = true; performQuickFill(activeItem); }
            else if (isShortcutMatch(e, config.shortcutValid)) {
                matched = true;
                setRadioValue(activeItem, '有效');
                scheduleRadioSideEffectsForItem(activeItem);
            }
            else if (isShortcutMatch(e, config.shortcutInvalid)) {
                matched = true;
                setRadioValue(activeItem, '无效');
                scheduleRadioSideEffectsForItem(activeItem);
            }
        }

        if (matched) {
            haltEvent(e);
            return;
        }
    }

    window.addEventListener('keydown', handleGlobalInput, { capture: true });
    window.addEventListener('mousedown', handleGlobalInput, { capture: true });

    function convertChineseNumberStr(chnStr) {
        console.log(`[ASR] convertChineseNumberStr: 输入=${chnStr}`);
        const chnNumChar = { '幺':1, '零':0, '一':1, '二':2, '两':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9 };
        const chnNameValue = { '十':10, '百':100, '千':1000, '万':10000, '亿':100000000 };
        let rtn = 0;
        let section = 0;
        let number = 0;
        let str = chnStr.split('');
        
        if (str.length === 0) return null;
        // 智能补全：如果开头直接是“十”，先补齐为“一十”，防止计算塌陷
        if (str[0] === '十') str.unshift('一'); 
        
        for (let i = 0; i < str.length; i++) {
            let char = str[i];
            let num = chnNumChar[char];

            if (num !== undefined) {
                number = num; // 记录当前的个位数字
                // 如果已经是最后一位，进行口语化省略判定（解决"一百八"变成180的问题）
                if (i === str.length - 1) {
                    let prevChar = str[i-1];
                    let prevUnit = prevChar ? chnNameValue[prevChar] : undefined;

                    // 【核心修复】：如果前一个字是百、千、万、亿，且末尾跟了单字，则它隐含了降一级的单位
                    // 例如："一百八"，前一个单位是100，所以 8 实际上要乘以 (100/10) = 10，结果为 80。
                    if (prevUnit && prevUnit >= 100) {
                        section += number * (prevUnit / 10);
                    } else {
                        // 否则（如："十一"、"一百零八"），直接相加
                        section += number;
                    }
                }
            } else {
                let unit = chnNameValue[char];
                if (unit !== undefined) {
                    // 处理口语化省略，如“百五”补全为“一百五”
                    if (number === 0 && (unit === 10 || unit === 100 || unit === 1000)) {
                        number = 1; 
                    }
                    
                    // 遇到大进位节点（万、亿），结算当前 section
                    if (unit === 10000 || unit === 100000000) {
                        section += number;
                        // 如果 section 为空，说明是“万”或“亿”开头，默认乘 1
                        rtn += (section === 0 ? 1 : section) * unit; 
                        section = 0; // 大节点结算后清空段落累加器
                    } else {
                        section += (number * unit); // 普通十百千累加
                    }
                    number = 0; // 重置当前个位
                } else {
                    return null; // 遇到无法解析的字符，抛弃该序列
                }
            }
        }
        rtn += section;
        return rtn;
    }

    // ================= 6. 核心：文本处理与转换引擎 =================
    
    function applyCustomReplacements(text) {
        if (!text) return text;
        console.log(`[ASR] applyCustomReplacements: 原始文本长度=${text.length}`);
        let resultText = text;
        config.customReplacements.forEach(rule => {
            if (rule.from && rule.from.trim() !== '' && rule.to !== undefined) {
                const fromArr = rule.from.split(/[,，|]/);
                fromArr.forEach(kw => {
                    const word = kw.trim();
                    if (word) {
                        resultText = resultText.split(word).join(rule.to);
                    }
                });
            }
        });
        return resultText;
    }

    function convertAllChineseNums(item) {
        const targetTextarea = getTargetTextarea(item);
        if (!targetTextarea) return;
        let text = targetTextarea.value;
        if (!text) return;

        let newText = text;

        // 【前置智能预处理】：强制转换带有特殊前缀/后缀的数字（无视千问/蜂鸟的位数限制）
        // 1. 处理 块、楼、号
        newText = newText.replace(/([幺零一二两三四五六七八九十百千万]+)(块|楼|号)/g, (match, p1, p2) => {
            if (/^[百千万]+$/.test(p1)) return match;
            let isPureDigit = true;
            for (let i = 0; i < p1.length; i++) { if (['十','百','千','万'].includes(p1[i])) { isPureDigit = false; break; } }
            if (isPureDigit && p1.length > 1) {
                const chnNumChar = { '幺':1, '零':0, '一':1, '二':2, '两':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9 };
                let res = '';
                for (let i = 0; i < p1.length; i++) res += chnNumChar[p1[i]];
                if (parseInt(res, 10) >= 1 || res.includes('0')) return res + p2;
                return match;
            }
            const num = convertChineseNumberStr(p1);
            if (num !== null && num >= 1) return num.toString() + p2;
            return match;
        });

        // 2. 处理 饿了/饿了么 + 数字
        newText = newText.replace(/(饿了么|饿了)([幺零一二两三四五六七八九十百千万]+)/g, (match, p1, p2) => {
            if (/^[百千万]+$/.test(p2)) return match;
            let isPureDigit = true;
            for (let i = 0; i < p2.length; i++) { if (['十','百','千','万'].includes(p2[i])) { isPureDigit = false; break; } }
            if (isPureDigit && p2.length > 1) {
                const chnNumChar = { '幺':1, '零':0, '一':1, '二':2, '两':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9 };
                let res = '';
                for (let i = 0; i < p2.length; i++) res += chnNumChar[p2[i]];
                if (parseInt(res, 10) >= 1 || res.includes('0')) return p1 + res;
                return match;
            }
            const num = convertChineseNumberStr(p2);
            if (num !== null && num >= 1) return p1 + num.toString();
            return match;
        });

        // 记录预处理完的文本，交给双核引擎继续处理常规数字
        let tempText = newText;

        if (config.numConvertMode === '千问') {
            // 【千问模式】
            let tempQianwen = tempText.replace(/(\d+(?:\.\d+)?)([十百千万亿]+)/g, (match, digits, units) => {
                let multiplier = convertChineseNumberStr(units);
                if (multiplier !== null) {
                    return (parseFloat(digits) * multiplier).toString();
                }
                return match;
            });

            newText = tempQianwen.replace(/([幺零一二两三四五六七八九十百千万亿]+)/g, (match) => {
                let isPureDigit = true;
                for(let i=0; i<match.length; i++) { if (['十','百','千','万','亿'].includes(match[i])) { isPureDigit = false; break; } }
                
                if (isPureDigit) {
                    const chnNumChar = { '幺':1, '零':0, '一':1, '二':2, '两':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9 };
                    let res = '';
                    for(let i=0; i<match.length; i++) res += chnNumChar[match[i]];
                    return res;
                }
                
                let val = convertChineseNumberStr(match);
                if (val !== null) return val.toString();
                return match;
            });
        } else {
            // 【蜂鸟众包模式】
            newText = tempText.replace(/([幺零一二两三四五六七八九十百]+)/g, (match) => {
                if (/^[百十]+$/.test(match)) return match;
                
                let singleVal = strictEvaluate(match);
                let seqInfo = splitIntoIncreasingSequence(match);
                let isPureDigit = true;
                for(let i=0; i<match.length; i++) { if (['十','百'].includes(match[i])) isPureDigit = false; }
                
                // 【核心修复】：赋予序列切分最高优先级！只要能切出合理的连续数字（如8、9、12 或 30、31），彻底无视单值运算，并改用顿号、
                if (seqInfo && seqInfo.partition && seqInfo.partition.length >= 2 && seqInfo.score <= 15) {
                    return seqInfo.partition.join('、');
                } else {
                    if (singleVal !== null && singleVal <= 999) {
                        if (singleVal >= 3 || (isPureDigit && match.includes('零'))) return singleVal.toString();
                    } else if (singleVal === null) {
                        let oldVal = convertChineseNumberStr(match);
                        if (oldVal !== null && oldVal >= 3 && oldVal <= 999) return oldVal.toString();
                    }
                    return match;
                }
            });
        }

        // 判断是否有内容更新，并交还焦点
        if (newText !== text) {
            safeSetReactInputValue(targetTextarea, newText);
            targetTextarea.blur();
            document.body.focus();
            showToast(`✅ 中文数字已按【${config.numConvertMode}】模式成功转换`);
        } else {
            targetTextarea.blur();
            document.body.focus();
            showToast('⚠️ 未发现需转换的中文数字');
        }
    }

    function strictEvaluate(str) {
        let isPureDigit = true;
        for(let i=0; i<str.length; i++) { if (['十','百'].includes(str[i])) isPureDigit = false; }
        
        if (isPureDigit) {
            const chnNumChar = { '幺':1, '零':0, '一':1, '二':2, '两':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9 };
            let res = '';
            for(let i=0; i<str.length; i++) {
                if(chnNumChar[str[i]] === undefined) return null;
                res += chnNumChar[str[i]];
            }
            return parseInt(res, 10);
        }
        
        let countShi = 0, countBai = 0;
        for(let i=0; i<str.length; i++) {
            if (str[i] === '十') countShi++;
            if (str[i] === '百') countBai++;
        }
        if (countShi > 1 || countBai > 1) return null;
        if (countShi === 1 && countBai === 1 && str.indexOf('十') < str.indexOf('百')) return null;
        
        return convertChineseNumberStr(str);
    }

    function splitIntoIncreasingSequence(s) {
        let bestPartition = null;
        let bestScore = Infinity; 
        
        function backtrack(index, prev_val, partition) {
            if (index === s.length) {
                if (partition.length > 1) {
                    let maxDiff = 0;
                    for (let i = 1; i < partition.length; i++) {
                        let diff = partition[i] - partition[i-1];
                        if (diff > maxDiff) maxDiff = diff;
                    }
                    if (maxDiff < bestScore) {
                        bestScore = maxDiff;
                        bestPartition = [...partition];
                    } else if (maxDiff === bestScore) {
                        if (!bestPartition || partition.length > bestPartition.length) {
                            bestPartition = [...partition];
                        }
                    }
                }
                return;
            }
            
            for (let len = 1; len <= s.length - index; len++) {
                let subStr = s.slice(index, index + len);
                let val = strictEvaluate(subStr);
                if (val !== null && val <= 999 && (prev_val === -1 || val > prev_val)) {
                    partition.push(val);
                    backtrack(index + len, val, partition);
                    partition.pop();
                }
            }
        }
        backtrack(0, -1, []);
        return { partition: bestPartition, score: bestScore };
    }

    // ================= 7. 功能操作与DOM搜索器 =================
    function safeSetReactInputValue(textarea, value) {
        if (!textarea) {
            console.error('[ASR] safeSetReactInputValue: textarea为空');
            return;
        }
        try {
            console.log(`[ASR] safeSetReactInputValue: 设置值长度=${value.length}`);
            textarea.focus({ preventScroll: true });
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(textarea, value);
            } else {
                textarea.value = value;
            }

            const tracker = textarea._valueTracker;
            if (tracker) tracker.setValue(value === '' ? ' ' : '');

            textarea.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            console.log('[ASR] safeSetReactInputValue: 设置成功');
        } catch (e) {
            console.error('[ASR] safeSetReactInputValue: 发生异常:', e);
        }
    }

    function removeCurrentItemSpaces(item) {
        console.log('[ASR] removeCurrentItemSpaces: 开始处理');
        const ta = getTargetTextarea(item);
        if (!ta || !ta.value) {
            console.log('[ASR] removeCurrentItemSpaces: 未找到文本框或内容为空');
            return;
        }
        const newText = ta.value.replace(/\s+/g, '');
        if (newText !== ta.value) {
            safeSetReactInputValue(ta, newText);
            ta.blur();
            document.body.focus();
            console.log(`[ASR] removeCurrentItemSpaces: 已去除空格 | 原长度=${ta.value.length} 新长度=${newText.length}`);
            showToast('✅ 当前文本空格已一键去除');
        } else {
            ta.blur();
            document.body.focus();
            console.log('[ASR] removeCurrentItemSpaces: 未发现空格，跳过');
            showToast('⚠️ 当前文本没有发现空格');
        }
    }

    function clearTextarea(item) {
        const targetTextarea = getTargetTextarea(item);
        if (!targetTextarea) {
            console.log('[ASR] clearTextarea: 未找到目标文本框');
            return false;
        }
        if (targetTextarea.value !== "") {
            safeSetReactInputValue(targetTextarea, "");
            targetTextarea.blur();
            document.body.focus();
            console.log('[ASR] clearTextarea: 已清空文本框');
            return true;
        }
        return false;
    }

    function enforceInvalidTextareaClearing(item, delays = [0, 80, 220, 500]) {
        if (!item || !config.clearOnInvalid || isBulkProcessing) return;

        if (Array.isArray(item._asrInvalidClearTimers)) {
            item._asrInvalidClearTimers.forEach(timer => clearTimeout(timer));
        }

        item._asrInvalidClearTimers = delays.map(delay => setTimeout(() => {
            const checkedRadio = getCheckedRadio(item);
            if (checkedRadio?.value === '无效') {
                clearTextarea(item);
            }
        }, delay));
    }

    function getCheckedRadio(item) {
        return item.querySelector('.ant-v5-radio-wrapper-checked input[type="radio"]') || item.querySelector('input[type="radio"]:checked');
    }

    function syncInvalidClearForItem(item) {
        if (!config.clearOnInvalid || isBulkProcessing) return;
        const checkedRadio = getCheckedRadio(item);
        if (checkedRadio?.value === '无效') {
            clearTextarea(item);
        }
    }

    function applyRadioSideEffects(item, checkedRadio) {
        if (!item || isBulkProcessing || !checkedRadio) return;
        if (checkedRadio.value === '有效' && config.fillOnValid) {
            triggerShortcutEvent(config.shortcutFill);
        } else if (checkedRadio.value === '无效' && config.clearOnInvalid) {
            enforceInvalidTextareaClearing(item);
        }
        updateDurationDisplay();
    }

    function scheduleRadioSideEffectsForItem(item, delay = 50, preferredRadio = null) {
        if (!item) return;
        if (item._asrRadioSyncTimer) clearTimeout(item._asrRadioSyncTimer);
        item._asrRadioSyncTimer = setTimeout(() => {
            item._asrRadioSyncTimer = null;
            const checkedRadio = (preferredRadio && preferredRadio.isConnected)
                ? preferredRadio
                : getCheckedRadio(item);
            applyRadioSideEffects(item, checkedRadio);
        }, delay);
    }

    function performQuickFill(item) {
        const targetTextarea = getTargetTextarea(item);
        if (!targetTextarea) {
            console.log('[ASR] performQuickFill: 未找到目标文本框');
            return;
        }
        console.log('[ASR] performQuickFill: 开始快速填充');

        let sourceText = getSourceText(item);

        if (!sourceText) {
            console.log('[ASR] performQuickFill: sourceText为空，跳过');
            return;
        }

        sourceText = applyCustomReplacements(sourceText);

        sourceText = sourceText.replace(/([幺零一二两三四五六七八九十百千万]+)(块|楼|号)/g, (match, p1, p2) => {
            if (/^[百千万]+$/.test(p1)) return match;

            let isPureDigit = true;
            for (let i = 0; i < p1.length; i++) {
                if (['十','百','千','万'].includes(p1[i])) { isPureDigit = false; break; }
            }
            if (isPureDigit && p1.length > 1) {
                const chnNumChar = { '幺':1, '零':0, '一':1, '二':2, '两':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9 };
                let res = '';
                for (let i = 0; i < p1.length; i++) res += chnNumChar[p1[i]];
                if (parseInt(res, 10) >= 1 || res.includes('0')) return res + p2;
                return match;
            }

            const num = convertChineseNumberStr(p1);
            if (num !== null && num >= 1) return num.toString() + p2;
            return match;
        });

        // 【新增：饿了么智能转数字】
        sourceText = sourceText.replace(/(饿了么|饿了)([幺零一二两三四五六七八九十百千万]+)/g, (match, p1, p2) => {
            if (/^[百千万]+$/.test(p2)) return match;
            let isPureDigit = true;
            for (let i = 0; i < p2.length; i++) {
                if (['十','百','千','万'].includes(p2[i])) { isPureDigit = false; break; }
            }
            if (isPureDigit && p2.length > 1) {
                const chnNumChar = { '幺':1, '零':0, '一':1, '二':2, '两':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9 };
                let res = '';
                for (let i = 0; i < p2.length; i++) res += chnNumChar[p2[i]];
                if (parseInt(res, 10) >= 1 || res.includes('0')) return p1 + res;
                return match;
            }
            const num = convertChineseNumberStr(p2);
            if (num !== null && num >= 1) return p1 + num.toString();
            return match;
        });

        sourceText = sourceText.trim();
        if (sourceText && !/[。？！.!?]$/.test(sourceText)) {
            // 取最后一句（按逗号或顿号切分）来判断疑问词
            const lastClause = sourceText.split(/[，、,]/).pop();
            // 如果最后一句包含常见疑问词，则补问号，否则补句号
            if (/[吗呢啊吧呀怎谁哪什]/.test(lastClause)) {
                sourceText += '？';
            } else {
                sourceText += '。';
            }
        }

        if (targetTextarea.value === sourceText) {
            console.log('[ASR] performQuickFill: 文本未变化，跳过');
            return;
        }
        console.log(`[ASR] performQuickFill: 填充文本 | 长度=${sourceText.length}`);
        safeSetReactInputValue(targetTextarea, sourceText);
        targetTextarea.blur();
        document.body.focus();
        console.log('[ASR] performQuickFill: 填充完成');
    }

    function showErrorHighlight(item, msg) {
        console.error(`[ASR] showErrorHighlight: ${msg}`);
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        item.style.boxShadow = '0 0 0 3px #ff4d4f';
        item.style.transition = 'box-shadow 0.3s';
        setTimeout(() => { item.style.boxShadow = ''; }, 3000);
        showToast(msg);
    }

    function validateAllItems() {
        console.log('[ASR] validateAllItems: 开始验证所有标注项');
        document.querySelectorAll('.labelRender-item').forEach(el => el.style.boxShadow = '');
        _lastValidationModified = false;

        const items = document.querySelectorAll('.labelRender-item');
        if (items.length === 0) {
            console.log('[ASR] validateAllItems: 无标注项');
            return true;
        }
        console.log(`[ASR] validateAllItems: 找到 ${items.length} 个标注项`);

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const checkedRadio = item.querySelector('.ant-v5-radio-wrapper-checked input[type="radio"]') || item.querySelector('input[type="radio"]:checked');

            if (!checkedRadio) {
                showErrorHighlight(item, `❌ 第 ${i + 1} 条数据：未选择【有效 / 无效】！`);
                console.error(`[ASR] validateAllItems: 第${i+1}条未选择有效性`);
                return false;
            }

            const val = checkedRadio.value;
            if (val === '特殊') {
                showErrorHighlight(item, `❌ 第 ${i + 1} 条数据：不能选择【特殊】！`);
                console.error(`[ASR] validateAllItems: 第${i+1}条选择了特殊`);
                return false;
            }

            if (val === '无效') {
                const textarea = getTargetTextarea(item);
                if (textarea && textarea.value.trim() !== '') {
                    if (config.autoClearInvalidValidation) {
                        clearTextarea(item);
                        _lastValidationModified = true;
                        console.log(`[ASR] validateAllItems: 第${i+1}条已自动清除无效文本`);
                    } else {
                        showErrorHighlight(item, `❌ 第 ${i + 1} 条数据：选择【无效】时，转写文本必须为空！`);
                        console.error(`[ASR] validateAllItems: 第${i+1}条无效但有文本`);
                        return false;
                    }
                }
            }

            if (val === '有效') {
                const textarea = getTargetTextarea(item);
                if (!textarea) {
                    showErrorHighlight(item, `❌ 第 ${i + 1} 条数据：找不到转写文本框！`);
                    console.error(`[ASR] validateAllItems: 第${i+1}条找不到文本框`);
                    return false;
                }
                const textVal = textarea.value.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
                if (textVal === '') {
                    if (config.autoFillOnValidValidation) {
                        performQuickFill(item);
                        _lastValidationModified = true;
                        console.log(`[ASR] validateAllItems: 第${i+1}条已自动填入`);
                        if (textarea.value.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() === '') {
                            showErrorHighlight(item, `❌ 第 ${i + 1} 条数据：自动填入失败，因为源文本本身为空！`);
                            return false;
                        }
                    } else {
                        showErrorHighlight(item, `❌ 第 ${i + 1} 条数据：选择【有效】时，转写文本绝对不能为空！`);
                        console.error(`[ASR] validateAllItems: 第${i+1}条有效但文本为空`);
                        return false;
                    }
                }
            }
        }
        console.log('[ASR] validateAllItems: 验证通过');
        return true;
    }

    async function performQuickSubmit() {
        console.log('[ASR] performQuickSubmit: 开始快捷提交');
        if (!validateAllItems()) {
            console.error('[ASR] performQuickSubmit: 验证失败');
            hideLoadingMask();
            return;
        }
        console.log('[ASR] performQuickSubmit: 验证通过');
        if (_lastValidationModified && cachedDataList.length > 0) {
            _lastValidationModified = false;
            buildAndInjectPayloadFromDOM();
        }

        if (config.disableAutoSave) {
            console.log('[ASR] performQuickSubmit: 禁用自动保存模式，先手动保存');
            if (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) {
                document.activeElement.blur();
            }
            showToast('⏳ 提交前正在触发强制安全保存...');
            await new Promise(r => setTimeout(r, 150));
            performManualSave();
            await new Promise(r => setTimeout(r, 1000));
            await executeActualSubmit();
        } else {
            await executeActualSubmit();
        }
    }

    async function executeActualSubmit() {
        console.log('[ASR] executeActualSubmit: 开始执行实际提交');
        await uploadCurrentTaskStats();

        if (config.autoReceiveOnSubmit) {
                console.log('[ASR] executeActualSubmit: 自动领取模式');
                const spans = document.querySelectorAll('span');
                let targetBtn = null;
                for (let span of spans) {
                    // 【修复】：同时兼容 提交任务 与 提交并领取
                    if (span.textContent.trim() === '提交任务' || span.textContent.trim() === '提交并领取') {
                        targetBtn = span.closest('button');
                        break;
                    }
                }
                if (targetBtn) {
                    if (targetBtn.disabled) {
                        console.error('[ASR] executeActualSubmit: 提交按钮被禁用');
                        showToast('⚠️ 提交任务按钮当前不可用 (Disabled)');
                    } else {
                        console.log('[ASR] executeActualSubmit: 点击提交任务按钮');
                        targetBtn.click();
                        showToast('🚀 已执行: 提交任务 (自动领取)');
                    }
                } else {
                    console.error('[ASR] executeActualSubmit: 未找到提交按钮');
                    showToast('❌ 未找到 [提交任务/领取] 按钮');
                }
            } else {
                console.log('[ASR] executeActualSubmit: 普通提交模式');
                const trigger = document.querySelector('button.ant-v5-dropdown-trigger') || document.querySelector('.ant-v5-dropdown-button .ant-v5-dropdown-trigger');
                if (!trigger) {
                    // 【核心修复】：极端防错，如果找不到下拉框，强行查找页面上任何带有“提交”的蓝色主要按钮
                    const fallbackBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText && (b.innerText.includes('提交并结束') || b.innerText === '提交'));
                    if (fallbackBtns.length > 0) {
                        fallbackBtns[fallbackBtns.length - 1].click();
                        console.log('[ASR] executeActualSubmit: 使用后备提交按钮');
                        showToast('🚀 已执行: 后备无下拉提交');
                        return;
                    }
                    console.error('[ASR] executeActualSubmit: 未找到下拉触发器');
                    showToast('❌ 未找到提交按钮下拉触发器');
                    return;
                }

                trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
                trigger.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
                trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                trigger.click();

                let attempts = 0;
                let timer = setInterval(() => {
                    const spans = document.querySelectorAll('.ant-v5-dropdown-menu-title-content');
                    let targetSpan = null;
                    for (let span of spans) {
                        if (span.textContent.trim() === '提交并结束') {
                            targetSpan = span;
                            break;
                        }
                    }

                    if (targetSpan) {
                        clearInterval(timer);
                        const li = targetSpan.closest('.ant-v5-dropdown-menu-item');
                        if (li) {
                            li.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                            li.click();
                        } else {
                            targetSpan.click();
                        }
                        console.log('[ASR] executeActualSubmit: 已执行提交并结束');
                        showToast('🚀 已执行: 提交并结束');
                    } else if (++attempts > 40) {
                        clearInterval(timer);
                        console.error('[ASR] executeActualSubmit: 唤出提交菜单超时');
                        showToast('⚠️ 唤出提交菜单超时，请检查网页状态');
                    }
                }, 50);
            }
    }

    let checkPaginationInterval = null;

    function tryCheckPagination() {
        console.log('[ASR] tryCheckPagination: 开始检查分页');
        if (checkPaginationInterval) clearInterval(checkPaginationInterval);
        let waitCount = 0;
        checkPaginationInterval = setInterval(() => {
            // 【核心防御重构】：全页扫描，精准咬住带有“条/页”的元素，彻底抛弃不可靠的 closest 查找
            let targetSelector = null;
            const selectionItems = document.querySelectorAll('.ant-v5-select-selection-item');
            for (let item of selectionItems) {
                if (item.getAttribute('title') && item.getAttribute('title').includes('条/页')) {
                    targetSelector = item.closest('.ant-v5-select-selector');
                    break;
                }
            }

            if (targetSelector) {
                clearInterval(checkPaginationInterval);
                checkPaginationInterval = null;
                executePaginationChange(targetSelector);
            } 
            // 兜底防御：如果等了 10 秒都没找到下拉框，才强行解锁防止死锁
            else if (++waitCount > 100) { 
                clearInterval(checkPaginationInterval);
                checkPaginationInterval = null;
                paginationSetting = false; 
            }
        }, 100);
    }

    function executePaginationChange(selector) {
        const currentItem = selector.querySelector('.ant-v5-select-selection-item');
        if (currentItem && currentItem.getAttribute('title') !== config.itemsPerPage) {
            paginationSetting = true; // 维持死锁状态
            selector.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            let checkCount = 0;
            let pollInterval = setInterval(() => {
                const dropdowns = document.querySelectorAll('.ant-v5-select-dropdown:not(.ant-v5-select-dropdown-hidden)');
                let clicked = false;
                for (let dropdown of dropdowns) {
                    const targetOption = dropdown.querySelector(`.ant-v5-select-item-option[title="${config.itemsPerPage}"]`);
                    if (targetOption) {
                        clearInterval(pollInterval);
                        targetOption.click();

                        isTaskValidated = false;

                        // 【时序结界】：给 React 留足 1200ms 彻底销毁并重绘 50 条数据的 DOM
                        setTimeout(() => {
                            paginationSetting = false; // 【关键】：挂载彻底完毕，解开封印！
                            if (config.autoFillOnLoad) {
                                setTimeout(() => markAllValid(), 300);
                            } else {
                                setTimeout(async () => {
                                    if (!isTaskValidated && config.validateBeforeSubmit) {
                                        const isValid = validateAllItems();
                                        isTaskValidated = true;
                                        const flushed = await flushValidationChanges();
                                        if (isValid && !flushed && config.autoSubmitAfterValidation) {
                                            showToast('✅ 自动校验通过，正在联动智能提交...');
                                            showLoadingMask('正在准备智能提交...');
                                            performQuickSubmit();
                                        }
                                    }
                                }, 300);
                            }
                        }, 1200);

                        clicked = true;
                        break;
                    }
                }
                if (++checkCount > 50 && !clicked) {
                    clearInterval(pollInterval);
                    paginationSetting = false; // 异常兜底解锁
                }
            }, 100);
        } else {
            // 【核心新增】：就算进来时正好已经是 50 条/页了，也绝对不允许秒解锁！
            // 必须强行等待 1200 毫秒，等当前页面的文本框完全挂载渲染完毕，再松开指纹引擎的脖子。
            setTimeout(() => {
                paginationSetting = false;
                if (config.autoFillOnLoad) setTimeout(() => markAllValid(), 300);
            }, 1200);
        }
    }

    // ===== 本页时长 DOM 实时计算体系 =====
    let audioFilenameToDuration = {};
    let cachedDataList = [];
    let cachedSubTaskMeta = {};

    function calcDurationFromDOM() {
        let total = 0;
        document.querySelectorAll('.labelRender-item').forEach(item => {
            const isValid = Array.from(item.querySelectorAll('input[type="radio"]'))
                .some(r => r.checked && r.value === '有效');
            if (!isValid) return;
            const audio = item.querySelector('audio');
            if (!audio) return;
            if (isFinite(audio.duration) && audio.duration > 0) {
                total += audio.duration;
                return;
            }
            const src = audio.src || audio.currentSrc || '';
            if (src) {
                const filename = src.split('/').pop().split('?')[0];
                if (audioFilenameToDuration[filename]) total += audioFilenameToDuration[filename];
            }
        });
        console.log(`[ASR] calcDurationFromDOM: 总时长=${total.toFixed(2)}秒`);
        return total;
    }

    function updateDurationDisplay() {
        const total = calcDurationFromDOM();
        currentTotalDuration = total;
        const durationSpan = document.getElementById('asr-duration-val');
        const durationLi = document.getElementById('asr-duration-btn');
        if (durationSpan) durationSpan.innerText = total > 0 ? formatDuration(total) : '0s';
        if (durationLi) durationLi.style.display = 'flex';
        console.log(`[ASR] updateDurationDisplay: 显示时长=${formatDuration(total)}`);
    }

    window.addEventListener('ASR_ItemDurationsReady', (e) => {
        const detail = e.detail || {};
        const keys = Object.keys(detail);
        const count = keys.length;
        const sample = keys.slice(0, 3).map(k => `${k}:${detail[k]}s`).join(', ');
        console.log(`[ASR] ASR_ItemDurationsReady: 收到${count}条时长 sample=${sample || '(空)'}`);
        audioFilenameToDuration = Object.assign(audioFilenameToDuration, detail);
        setTimeout(updateDurationDisplay, 400);
    });

    window.addEventListener('ASR_DataListReady', (e) => {
        cachedDataList = e.detail || [];
        const count = cachedDataList.length;
        const samples = cachedDataList.slice(0, 3).map(d => d.id || d.taskId || '?').join(', ');
        console.log(`[ASR] ASR_DataListReady: 收到${count}条数据 samples=${samples || '(空)'}`);
    });

    window.addEventListener('ASR_SubTaskMetaReady', (e) => {
        cachedSubTaskMeta = e.detail || {};
        const meta = cachedSubTaskMeta;
        console.log(`[ASR] ASR_SubTaskMetaReady: taskName=${meta.taskName || ''} taskId=${meta.taskId || ''} subTaskId=${meta.subTaskId || ''} batchId=${meta.batchId || ''} annotator=${meta.annotator || ''}`);
    });

    let _cachedUserName = '';

    async function ensureUserName() {
        console.log('[ASR] ensureUserName: 开始获取用户名');
        if (_cachedUserName) {
            console.log(`[ASR] ensureUserName: 返回缓存用户名=${_cachedUserName}`);
            return _cachedUserName;
        }

        const getEl = () => document.querySelector('[data-menu-id$="-userAvatar"] .ant-v5-dropdown-menu-title-content, li[class*="userAvatar"] .ant-v5-dropdown-menu-title-content');

        let el = getEl();
        if (el) { _cachedUserName = el.textContent.trim(); console.log(`[ASR] ensureUserName: 从DOM获取=${_cachedUserName}`); return _cachedUserName; }

        try {
            if (window.unsafeWindow && window.unsafeWindow.INITIAL_STATE?.user?.nickName) {
                _cachedUserName = window.unsafeWindow.INITIAL_STATE.user.nickName;
                console.log(`[ASR] ensureUserName: 从unsafeWindow获取=${_cachedUserName}`);
                return _cachedUserName;
            }
        } catch(e) { console.error('[ASR] ensureUserName: 获取用户名失败(unsafeWindow):', e); }

        const trigger = document.querySelector('.ant-v5-dropdown-trigger.avatar');
        if (!trigger) {
            console.error('[ASR] ensureUserName: 未找到用户菜单触发器');
            return '';
        }

        try {
            const eventConfig = { bubbles: true, cancelable: true };
            trigger.dispatchEvent(new MouseEvent('mouseenter', eventConfig));
            trigger.dispatchEvent(new MouseEvent('mouseover', eventConfig));
            trigger.click();
        } catch (e) {
            console.error("[ASR] ensureUserName: 唤出用户菜单报错:", e);
        }

        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 150));
            el = getEl();
            if (el) break;
        }

        if (el) _cachedUserName = el.textContent.trim();

        try {
            const eventConfig = { bubbles: true, cancelable: true };
            trigger.dispatchEvent(new MouseEvent('mouseleave', eventConfig));
            trigger.dispatchEvent(new MouseEvent('mouseout', eventConfig));
            document.body.click();
        } catch(e) { console.error('[ASR] ensureUserName: 触发用户名下拉菜单事件失败:', e); }

        console.log(`[ASR] ensureUserName: 返回=${_cachedUserName || '未知用户'}`);
        return _cachedUserName || '未知用户';
    }

    function getCurrentUserName() {
        return _cachedUserName;
    }

    let autoBatchSubmitTimer = null; // 全局定时器缓存

    window.addEventListener('ASR_DataLoaded', () => {
        console.log('[ASR] ASR_DataLoaded: 数据加载事件触发');
        isTaskValidated = false;
        paginationSetting = true;
        tryCheckPagination();

        if (config.autoBatchSubmit && location.pathname.toLowerCase().includes('/sdk')) {
            console.log('[ASR] ASR_DataLoaded: 启动全自动批量引擎');
            showToast('🚀 全自动批量引擎已介入，将在 10 秒后自动校验并提交！');
            // 清除之前的冗余定时器，防止叠加并发触发多次提交！
            if (autoBatchSubmitTimer) clearTimeout(autoBatchSubmitTimer);
            
            autoBatchSubmitTimer = setTimeout(async () => {
                if (validateAllItems()) {
                    const flushed = await flushValidationChanges();
                    if (!flushed) {
                        showToast('✅ 自动校验通过，正在发起提交流转...');
                        performQuickSubmit();
                    }
                } else {
                    showToast('❌ 校验失败，引擎暂停流转，请人工核对修改！');
                }
            }, 10000);
        }
    });

    window.addEventListener('ASR_TimerTriggered', () => {
        if (paginationSetting) {
            return;
        }

        let isTargetPageSize = false;
        const selectionItems = document.querySelectorAll('.ant-v5-select-selection-item');
        for (let item of selectionItems) {
            if (item.getAttribute('title') === config.itemsPerPage) {
                isTargetPageSize = true;
                break;
            }
        }

        if (isTargetPageSize) {
            setTimeout(async () => {
                if (!isTaskValidated && config.validateBeforeSubmit) {
                    const isValid = validateAllItems();
                    isTaskValidated = true;
                    const flushed = await flushValidationChanges();
                    if (isValid && !flushed && config.autoSubmitAfterValidation) {
                        showToast('✅ 检索校验通过，正在联动智能提交...');
                        showLoadingMask('正在准备智能提交...');
                        performQuickSubmit();
                    }
                }
            }, 500);
        }
    });

    // ================= 独创：数据指纹追踪引擎 (彻底无视 React 虚拟 DOM 回收) =================
    let globalActiveFingerprint = null;
    
    function watchActiveItemFingerprint() {
        if (paginationSetting || isBulkProcessing) return;
        const activeItem = document.querySelector('.labelRender-item-selected');
        if (!activeItem) return;
        
        if (!activeItem.querySelector('input[type="radio"]')) return;

        const audioNode = activeItem.querySelector('audio');
        const sourceText = getSourceText(activeItem) || '';
        const fingerprint = (audioNode ? audioNode.src : '') + sourceText;
        
        if (fingerprint && fingerprint !== globalActiveFingerprint) {
            globalActiveFingerprint = fingerprint;
            
            // 核心激活逻辑
            if (audioNode) {
                setAudioVolume(audioNode, config.volumeValue);
                if (config.autoResetRate) { 
                    audioNode.playbackRate = config.resetRateValue; 
                    const speedSpan = activeItem.querySelector('.ant-v5-select-selection-item');
                    if (speedSpan && speedSpan.innerText.includes('x')) {
                        speedSpan.innerText = `${config.resetRateValue.toFixed(1)}x`;
                        speedSpan.title = `${config.resetRateValue.toFixed(1)}x`;
                    }
                }
                if (config.autoPlay && (currentAudio !== audioNode || audioNode.paused)) {
                    setTimeout(() => audioNode.play().catch(() => {}), 50);
                }
            }
            if (config.defaultValid) {
                const hasChecked = activeItem.querySelector('input[type="radio"]:checked') || activeItem.querySelector('.ant-v5-radio-wrapper-checked');
                if (!hasChecked) {
                    setTimeout(() => triggerShortcutEvent(config.shortcutValid), 50);
                }
            }
        }
    }

    function processContentItems() {
        const items = document.querySelectorAll('.labelRender-item');

        items.forEach(item => {
            const targetTextarea = getTargetTextarea(item);
            if (targetTextarea) {
                let titleDiv = targetTextarea.previousElementSibling;
                if (!titleDiv || !titleDiv.classList.contains('labelRender-item-answer-title')) {
                    const wrap = targetTextarea.closest('.labelRender-item-answer-wrap');
                    if (wrap) titleDiv = wrap.querySelector('.labelRender-item-answer-title');
                }
                if (titleDiv && !titleDiv.querySelector('.asr-quick-fill-btn')) {
                    const copyBtn = document.createElement('button');
                    copyBtn.className = 'asr-quick-fill-btn';
                    copyBtn.innerHTML = '🚀 快速填入';
                    copyBtn.style.cssText = 'margin-left: 12px; padding: 2px 8px; cursor: pointer; background: #e6f4ff; color: #1677ff; border: 1px solid #91caff; border-radius: 4px; font-size: 12px; transition: all 0.2s;';
                    copyBtn.onmouseover = () => { copyBtn.style.background = '#1677ff'; copyBtn.style.color = '#fff'; };
                    copyBtn.onmouseout = () => { copyBtn.style.background = '#e6f4ff'; copyBtn.style.color = '#1677ff'; };
                    copyBtn.onclick = (e) => { e.stopPropagation(); e.preventDefault(); performQuickFill(item); };
                    titleDiv.appendChild(copyBtn);
                }
            }

            const audio = item.querySelector('audio');
            if (audio && !audio.dataset.asrBound) {
                audio.dataset.asrBound = 'true';
                audio.addEventListener('ended', () => {
                    if (config.autoNext) {
                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', code: 'KeyS', keyCode: 83, bubbles: true }));
                    }
                });
            }

            if (!item.dataset.asrRadioDelegated) {
                item.dataset.asrRadioDelegated = 'true';
                item.addEventListener('change', (e) => {
                    if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'radio') {
                        const changedRadio = e.target;
                        scheduleRadioSideEffectsForItem(item, 50, changedRadio);
                    }
                });
            }

            const radioWrappers = item.querySelectorAll('.ant-v5-radio-wrapper');
            radioWrappers.forEach(lbl => {
                if (!lbl.dataset.asrRadioMouseBound) {
                    lbl.dataset.asrRadioMouseBound = 'true';
                    lbl.addEventListener('mousedown', () => {
                        const radioInput = lbl.querySelector('input[type="radio"]');
                        if (radioInput?.value === '无效' && config.clearOnInvalid && !isBulkProcessing) {
                            clearTextarea(item);
                            enforceInvalidTextareaClearing(item, [80, 220, 500]);
                        }
                    }, true);
                }
                if (!lbl.dataset.asrRadioBound) {
                    lbl.dataset.asrRadioBound = 'true';
                    lbl.addEventListener('click', () => scheduleRadioSideEffectsForItem(item));
                }
            });

        });
    }

    // ================= 9. 智能场景路由隔离 =================
    function injectMenuButton() {
        const menu = document.querySelector('.ant-v5-menu-root.ant-v5-menu-horizontal');
        if (!menu) {
            return;
        }

        const isAnnotationPage = location.pathname.toLowerCase().includes('/sdk');
        console.log(`[ASR] injectMenuButton: isAnnotationPage=${isAnnotationPage}`);

        if (isAnnotationPage && !document.getElementById('asr-duration-btn')) {
            const liDuration = document.createElement('li');
            liDuration.id = 'asr-duration-btn';
            liDuration.className = 'ant-v5-menu-overflow-item ant-v5-menu-item ant-v5-menu-item-only-child';
            liDuration.style.cssText = 'opacity: 1; order: 1; padding: 0 20px; display: none; align-items: center; pointer-events: none;';
            liDuration.innerHTML = '<span class="ant-v5-menu-title-content" style="color: #52c41a; font-weight: bold; display:flex; align-items:center; gap:4px;"><span style="font-size:16px;">⏱️</span>本页时长: <span id="asr-duration-val">计算中...</span></span>';
            menu.appendChild(liDuration);
        }

        if (!isAnnotationPage && !document.getElementById('asr-export-btn')) {
            const liExport = document.createElement('li');
            liExport.id = 'asr-export-btn';
            liExport.className = 'ant-v5-menu-overflow-item ant-v5-menu-item ant-v5-menu-item-only-child';
            liExport.style.cssText = 'opacity: 1; order: 2; padding: 0 20px; cursor: pointer; display: flex; align-items: center; transition: background 0.2s;';
            liExport.innerHTML = '<span class="ant-v5-menu-title-content" style="color: #fa8c16; font-weight: bold; display:flex; align-items:center; gap:4px;"><span style="font-size:16px;">📥</span>导出统计</span>';
            liExport.onclick = exportTasksToExcel;
            liExport.onmouseover = () => liExport.style.background = '#f5f5f5';
            liExport.onmouseout = () => liExport.style.background = 'transparent';
            menu.appendChild(liExport);
        }

        if (!document.getElementById('asr-nav-btn')) {
            const li = document.createElement('li');
            li.id = 'asr-nav-btn';
            li.className = 'ant-v5-menu-overflow-item ant-v5-menu-item ant-v5-menu-item-only-child';
            li.style.cssText = 'opacity: 1; order: 3; padding: 0 20px; cursor: pointer; display: flex; align-items: center; transition: background 0.2s;';
            li.innerHTML = '<span class="ant-v5-menu-title-content" style="color: #1677ff; font-weight: bold; display:flex; align-items:center; gap:4px;"><span style="font-size:16px;">⚙️</span>脚本设置</span>';
            li.onclick = () => { 
                document.getElementById('asr-settings-backdrop').style.display = 'flex'; 
                const dbgInd = document.getElementById('asr-debug-indicator');
                if (dbgInd) dbgInd.style.display = 'none';
            };
            li.onmouseover = () => li.style.background = '#f5f5f5';
            li.onmouseout = () => li.style.background = 'transparent';
            menu.appendChild(li);
        }

        if (!isAnnotationPage && !document.getElementById('asr-batchopen-btn')) {
            const isCheckTaskPage = location.pathname.toLowerCase().includes('checktask');
            const shouldShowBatchBtn = isCheckTaskPage;

            if (shouldShowBatchBtn) {
                const liBatch = document.createElement('li');
                liBatch.id = 'asr-batchopen-btn';
                liBatch.className = 'ant-v5-menu-overflow-item ant-v5-menu-item ant-v5-menu-item-only-child';
                liBatch.style.cssText = 'opacity: 1; order: 4; padding: 0 20px; cursor: pointer; display: flex; align-items: center; transition: background 0.2s;';
                liBatch.innerHTML = '<span class="ant-v5-menu-title-content" style="color: #52c41a; font-weight: bold; display:flex; align-items:center; gap:4px;"><span style="font-size:16px;">🚀</span>批量打开当前页任务</span>';

                liBatch.onclick = async () => {
                    if (!config.validateBeforeSubmit || !config.autoClearInvalidValidation || !config.autoFillOnValidValidation || !config.autoSubmitAfterValidation) {
                        showToast('❌ 批量打开需同时开启：自动校验+无效清空+有效填入+校验后自动提交');
                        return;
                    }

                    try {
                        const urlParams = new URLSearchParams(window.location.search);
                        const appId = urlParams.get('projectId') || urlParams.get('appId') || '1023';
                        const type = isCheckTaskPage ? 'check' : 'label';
                        const missionType = isCheckTaskPage ? 'check' : 'label';

                        let currentPage = 1;
                        const activePageEl = document.querySelector('.ant-v5-pagination-item-active a, .ant-v5-pagination-item-active');
                        if (activePageEl && activePageEl.textContent) {
                            const pageNum = parseInt(activePageEl.textContent.trim(), 10);
                            if (!isNaN(pageNum)) currentPage = pageNum;
                        }

                        showToast(`🚀 正在拉取第 ${currentPage} 页的任务数据...`);
                        const apiUrl = `/api/v1/label/center/subTasks?type=${type}&keyword=&appId=${appId}&finished=false&page=${currentPage}&pageSize=5&_=${Date.now()}`;

                        const res = await fetch(apiUrl, {
                            method: 'GET',
                            headers: { 'accept': 'application/json, text/plain, */*' },
                            credentials: 'include'
                        });

                        const json = await res.json();

                        if (!json || !json.success || !json.data || !Array.isArray(json.data.data) || json.data.data.length === 0) {
                            showToast(`⚠️ 第 ${currentPage} 页暂无未完成的任务`);
                            return;
                        }

                        let openedCount = 0;
                        for (let i = 0; i < json.data.data.length; i++) {
                            const item = json.data.data[i];
                            const id = item.id || item.subTaskId || item.taskId;
                            if (id) {
                                setTimeout(() => {
                                    window.open(`/corpora/labeling/sdk?missionType=${missionType}&projectId=${appId}&subTaskId=${id}`, '_blank');
                                }, i * 300);
                                openedCount++;
                            }
                        }

                        setTimeout(() => {
                            showToast(`🚀 已触发打开 ${openedCount} 个任务，如果只打开了 1 个，请在浏览器地址栏右侧点击【允许弹出窗口】`);
                        }, openedCount * 300 + 100);

                    } catch(e) {
                        console.error('[ASR] 批量打开当前页任务失败:', e);
                        showToast('❌ 批量打开失败，网络或接口异常');
                    }
                };

                liBatch.onmouseover = () => liBatch.style.background = '#f5f5f5';
                liBatch.onmouseout = () => liBatch.style.background = 'transparent';
                menu.appendChild(liBatch);
            }

            if (!document.getElementById('asr-leaderboard-nav-btn')) {
                const liLB = document.createElement('li');
                liLB.id = 'asr-leaderboard-nav-btn';
                liLB.className = 'ant-v5-menu-overflow-item ant-v5-menu-item ant-v5-menu-item-only-child';
                liLB.style.cssText = 'opacity: 1; order: 5; padding: 0 20px; cursor: pointer; display: flex; align-items: center; transition: background 0.2s;';
                liLB.innerHTML = '<span class="ant-v5-menu-title-content" style="color: #eb2f96; font-weight: bold; display:flex; align-items:center; gap:4px;"><span style="font-size:16px;">🏆</span>排行榜</span>';
                liLB.onclick = toggleLeaderboard;
                liLB.onmouseover = () => liLB.style.background = '#f5f5f5';
                liLB.onmouseout = () => liLB.style.background = 'transparent';
                menu.appendChild(liLB);
            }
        }
    }

    document.addEventListener('play', function(e){
        if(e.target.tagName === 'AUDIO'){
            if(currentAudio && currentAudio !== e.target){
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            currentAudio = e.target;
        }
    }, true);

    let autoAssignTimer = null;
    let isAssigning = false;

    async function executeAutoAssign(isManual = false) {
        console.log(`[ASR] executeAutoAssign: 开始 | isManual=${isManual}`);
        if (!isManual && !config.autoAssignCheckTasks) {
            console.log('[ASR] executeAutoAssign: 跳过(未启用自动抢单)');
            return;
        }
        if (!config.autoAssignTargetUser) {
            console.error('[ASR] executeAutoAssign: 目标人员未设置');
            if (isManual) showToast('⚠️ 无法领取：请先设置目标人员名称');
            return;
        }
        if (!config.autoAssignAllTasks && !config.autoAssignTaskKeyword) {
            console.error('[ASR] executeAutoAssign: 关键词未设置');
            if (isManual) showToast('⚠️ 无法领取：请设置任务关键词或勾选"检查全部任务"');
            return;
        }

        if (isAssigning) {
            console.log('[ASR] executeAutoAssign: 跳过(正在运行中)');
            if (isManual) showToast('⏳ 抢单引擎正在运行中，请勿频繁点击...');
            return;
        }

        isAssigning = true; 
        console.log('[ASR] executeAutoAssign: 开始检索任务');
        if (isManual) showToast('⚡ 手动抢单已启动，正在检索实时任务...');

        try {
            const params = new URLSearchParams(location.search);
            const appId = params.get('projectId') || params.get('appId') || '1023';
            
            const taskRes = await fetch(`/api/v1/label/center/tasks?subTaskType=check&keyword=&appId=${appId}&page=1&pageSize=50&_=${Date.now()}`);
            const taskJson = await taskRes.json();
            console.log(`[ASR] executeAutoAssign: 任务列表响应 status=${taskRes.status} success=${taskJson?.success} dataLength=${taskJson?.data?.data?.length ?? 0}`);
            if (!taskJson?.success || !taskJson?.data?.data || taskJson.data.data.length === 0) {
                console.error(`[ASR] executeAutoAssign: 任务列表为空或失败 appId=${appId} success=${taskJson?.success} dataLength=${taskJson?.data?.data?.length ?? 0}`);
                if (isManual) showToast('⚠️ 当前列表没有可供领取的任务数据');
                isAssigning = false; return;
            }

            let tasks = taskJson.data.data;
            const rawTaskCount = tasks.length;
            if (!config.autoAssignAllTasks) {
                const keywords = config.autoAssignTaskKeyword.split(/[,，|]/).map(k => k.trim()).filter(k => k);
                console.log(`[ASR] executeAutoAssign: 关键词过滤前 rawCount=${rawTaskCount} keywords=${keywords.join('|')}`);
                tasks = tasks.filter(t => keywords.some(kw => (t.name && t.name.includes(kw)) || (t.taskId && t.taskId.toString() === kw)));
                console.log(`[ASR] executeAutoAssign: 关键词过滤后 filteredCount=${tasks.length}`);
            }

            if (tasks.length === 0) {
                console.warn(`[ASR] executeAutoAssign: 过滤后无任务 isManual=${isManual} rawCount=${rawTaskCount}`);
                if (isManual) showToast('⚠️ 未找到匹配该关键词的任务');
                isAssigning = false; return;
            }

            const targetUsers = config.autoAssignTargetUser.split(/[,，|]/).map(u => u.trim()).filter(u => u);
            let totalAssigned = 0;
            let totalCheckedTasks = 0;

            for (let task of tasks) {
                console.log(`[ASR] executeAutoAssign: 处理任务 taskId=${task.taskId} name=${task.name || ''}`);
                const detailRes = await fetch(`/api/v1/label/center/${task.taskId}/check/filter-detail`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
                    body: `id=${task.taskId}&_=${Date.now()}`
                });
                const detailJson = await detailRes.json();
                console.log(`[ASR] executeAutoAssign: 详情响应 taskId=${task.taskId} status=${detailRes.status} success=${detailJson?.success}`);
                if (!detailJson?.success || !detailJson?.data?.userProcesses) {
                    console.warn(`[ASR] executeAutoAssign: 跳过 taskId=${task.taskId} success=${detailJson?.success} message=${detailJson?.message || ''} hasUserProcesses=${!!detailJson?.data?.userProcesses}`);
                    continue;
                }
                totalCheckedTasks++;

                const matchedUsers = detailJson.data.userProcesses.filter(u => 
                    u.operator && targetUsers.some(tu => 
                        (u.operator.name && u.operator.name.includes(tu)) || 
                        (u.operator.nickName && u.operator.nickName.includes(tu))
                    )
                );
                console.log(`[ASR] executeAutoAssign: matchedUsers taskId=${task.taskId} matchedCount=${matchedUsers.length} targetUsers=${targetUsers.join('|')}`);

                if (matchedUsers.length > 0) {
                    const batchSize = config.autoAssignFetchAll ? 99999 : config.autoAssignBatchSize;
                    const userListPayload = matchedUsers.map(mu => ({ userId: mu.operator.userId, batchSize: batchSize }));
                    
                    const assignRes = await fetch(`/api/v1/label/center/batch/check_batch?taskId=${task.taskId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
                        body: JSON.stringify({ taskId: task.taskId, userList: userListPayload })
                    });
                    const assignJson = await assignRes.json();
                    console.log(`[ASR] executeAutoAssign: 分派响应 taskId=${task.taskId} status=${assignRes.status} success=${assignJson?.success} message=${assignJson?.message || ''}`);

                    if (assignJson?.success && assignJson.data !== false) {
                        const assignedNames = matchedUsers.map(mu => mu.operator.name).join(', ');
                        console.log(`[ASR] executeAutoAssign: 分派成功 taskId=${task.taskId} assignedNames=${assignedNames} batchSize=${batchSize}`);
                        showToast(`🎉 抢单成功: 任务[${task.taskId}] 已分配给 ${assignedNames}`);
                        totalAssigned++;
                        setTimeout(() => location.reload(), 1500);
                    } else if (assignJson?.message) {
                        console.warn(`[ASR] executeAutoAssign: 分派失败 taskId=${task.taskId} message=${assignJson.message}`);
                        if (assignJson.message.includes('不足') || assignJson.message.includes('超出') || assignJson.message.includes('数量')) {
                            if (isManual) showToast(`ℹ️ 任务[${task.taskId}]：系统提示当前任务数据已被全部领取完毕或达到上限。`);
                        } else if (isManual) {
                            showToast(`ℹ️ 分派提示: ${assignJson.message}`);
                        }
                    }
                }
            }

            // 最终综合状态汇报
            if (isManual && totalAssigned === 0) {
                if (totalCheckedTasks > 0) {
                    console.log(`[ASR] executeAutoAssign: 最终汇报 totalAssigned=0 totalCheckedTasks=${totalCheckedTasks} 原因=无剩余数据或人员不匹配`);
                    showToast('⚠️ 检查完毕：任务中已没有可领取的剩余数据，或人员不匹配。');
                } else {
                    console.log(`[ASR] executeAutoAssign: 最终汇报 totalAssigned=0 totalCheckedTasks=${totalCheckedTasks} 原因=获取任务详情失败`);
                    showToast('⚠️ 检查完毕：获取任务详细数据失败。');
                }
            }
        } catch (e) {
            console.error('[ASR] executeAutoAssign: 抢单引擎发生严重错误:', e);
            if (isManual) showToast('❌ 抢单引擎发生网络错误，详情请看控制台');
        } finally {
            isAssigning = false; 
            console.log('[ASR] executeAutoAssign: 完成');
        }
    }

    function startAutoAssignPoll() {
        console.log('[ASR] startAutoAssignPoll: 开始自动分配轮询');
        if (autoAssignTimer) clearInterval(autoAssignTimer);
        if (location.pathname.toLowerCase().includes('checktask') && config.autoAssignCheckTasks) {
            console.log('[ASR] startAutoAssignPoll: 审核自动抢单引擎已启动');
            showToast('🤖 审核自动抢单引擎已启动！(后台每 60 秒检索中...)');
            executeAutoAssign(false);
            autoAssignTimer = setInterval(() => executeAutoAssign(false), 60000);
        } else {
            console.log('[ASR] startAutoAssignPoll: 不在审核页面或未启用自动抢单');
        }
    }

    // ================= 手动保存通信与顶部工具栏注入 =================
    let _manualSaveReload = false;
    let _manualSaveLock = false;

    // flushFirst=true 时先 blur 当前输入框，等 React onBlur/onChange 被平台捕获
    // 再延迟 250ms 触发发送，保证 __asr_pending_saves 包含最新状态
    function performManualSave(reloadAfter = false, flushFirst = false) {
        if (_manualSaveLock) {
            console.log('[ASR] performManualSave: 已被锁定，跳过');
            return;
        }
        _manualSaveLock = true;
        _manualSaveReload = reloadAfter;
        console.log(`[ASR] performManualSave: 开始 | reloadAfter=${reloadAfter} flushFirst=${flushFirst}`);

        const doSend = () => {
            console.log('[ASR] performManualSave: 触发手动保存事件');
            showToast('⏳ 正在打包合并提交到服务器，请稍候...');
            window.dispatchEvent(new CustomEvent('ASR_TriggerManualSave'));
        };

        if (flushFirst && document.activeElement &&
            (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) {
            document.activeElement.blur();
            setTimeout(doSend, 250);
        } else {
            doSend();
        }
    }

    window.addEventListener('ASR_ManualSaveResult', (e) => {
        const { success, count, msg } = e.detail || {};
        console.log(`[ASR] ASR_ManualSaveResult: success=${success} count=${count || 0} msg=${msg || ''} willReload=${_manualSaveReload}`);
        const shouldReload = _manualSaveReload;
        _manualSaveReload = false;
        _manualSaveLock = false;

        // 恢复保存按钮可点击状态
        const btn = document.getElementById('asr-manual-save-btn');
        if (btn) btn.disabled = false;

        if (success) {
            currentPendingSaveCount = 0;
            if (count > 0) {
                showToast(`✅ 成功合并保存 ${count} 条数据！${shouldReload ? ' 即将刷新页面...' : ''}`);
                if (shouldReload) setTimeout(() => location.reload(), 1200);
            } else {
                showToast('✅ 当前没有需要保存的修改');
            }
        } else {
            showToast(`❌ 保存失败: ${msg}`);
        }
    });

    window.addEventListener('ASR_PendingSaveCount', (e) => {
        currentPendingSaveCount = e.detail;
        console.log(`[ASR] ASR_PendingSaveCount: count=${currentPendingSaveCount} isZero=${currentPendingSaveCount === 0}`);
    });

    async function autoNavigateToNextTask() {
        console.log('[ASR] autoNavigateToNextTask: 开始自动导航到下一任务');
        showToast('🤖 批量引擎：正在通过接口获取最新待办任务...');
        try {
            const params = new URLSearchParams(location.search);
            const appId = params.get('projectId') || params.get('appId') || '1023';
            const pathname = location.pathname.toLowerCase();
            const type = pathname.includes('checktask') ? 'check' : 'label';
            console.log(`[ASR] autoNavigateToNextTask: appId=${appId} type=${type}`);

            const res = await fetch(`/api/v1/label/center/subTasks?type=${type}&keyword=&appId=${appId}&finished=false&page=1&pageSize=100&_=${Date.now()}`);
            const json = await res.json();
            const subTasks = Array.isArray(json?.data?.data) ? json.data.data : [];
            const nextSubTask = subTasks.find(task => task?.rejectReason == null);

            if (json?.success && nextSubTask?.id) {
                const skippedCount = subTasks.findIndex(task => task?.id === nextSubTask.id);
                const targetUrl = `/corpora/labeling/sdk?missionType=${type}&projectId=${appId}&subTaskId=${nextSubTask.id}`;
                console.log(`[ASR] autoNavigateToNextTask: 找到下一任务 subTaskId=${nextSubTask.id} skipped=${Math.max(skippedCount, 0)}`);
                showToast(`✅ 找到可进入任务，3秒后自动进入...`);
                setTimeout(() => { location.href = targetUrl; }, 3000);
            } else if (json?.success) {
                console.log('[ASR] autoNavigateToNextTask: 当前返回任务均不可自动进入');
                showToast('⏸️ 批量引擎：当前没有可自动进入的任务');
            } else {
                console.log('[ASR] autoNavigateToNextTask: 未找到未完成任务');
                showToast('🎉 批量引擎：当前列表已无未完成的任务！');
            }
        } catch(e) {
            console.error('[ASR] autoNavigateToNextTask: 获取下一题失败:', e);
            showToast('❌ 批量引擎：获取任务接口失败，请检查网络');
        }
    }

    function injectToolbarButtons() {
        console.log('[ASR] injectToolbarButtons: 开始注入工具栏按钮');
        const statContainer = document.querySelector('.mark-toolbox-statistic');
        if (statContainer && !document.getElementById('asr-tool-buttons-group')) {
            console.log('[ASR] injectToolbarButtons: 找到statContainer，创建按钮组');
            const group = document.createElement('div');
            group.id = 'asr-tool-buttons-group';
            group.style.cssText = 'display: flex; flex-direction: column; gap: 5px; margin-left: 14px; align-items: flex-start;';

            const btnStyle = (color) => `
                height: 26px; padding: 0 10px; border-radius: 6px; font-size: 12px; font-weight: 500;
                border: 1px solid #d9d9d9; background: #fafafa; color: ${color || '#333'};
                cursor: pointer; display: inline-flex; align-items: center; gap: 3px;
                transition: all 0.18s; white-space: nowrap; line-height: 1;
            `;

            const makeBtn = (label, action, color) => {
                const b = document.createElement('button');
                b.style.cssText = btnStyle(color);
                b.innerHTML = label;
                b.onmouseenter = () => { b.style.background = '#e6f4ff'; b.style.borderColor = '#1677ff'; b.style.color = '#1677ff'; };
                b.onmouseleave = () => { b.style.background = '#fafafa'; b.style.borderColor = '#d9d9d9'; b.style.color = color || '#333'; };
                b.onmousedown = () => { b.style.transform = 'scale(0.95)'; };
                b.onmouseup = () => { b.style.transform = 'scale(1)'; };
                b.onclick = (e) => { haltEvent(e); action(); };
                return b;
            };

            const makeRow = () => {
                const row = document.createElement('div');
                row.style.cssText = 'display: inline-flex; gap: 5px; align-items: center; flex-wrap: wrap;';
                return row;
            };

            // 行1：标注操作
            const row1 = makeRow();
            [
                ['⚡全页填充', markAllValid, '#389e0d'],
                ['🧹全页去空格', removeAllSpaces, '#08979c'],
                ['🤖AI标点', fixPunctuationAll, '#1d39c4'],
                ['🛡️全页校验', async () => { 
                    showLoadingMask('正在校验全页数据...');
                    if (validateAllItems()) { 
                        const flushed = await flushValidationChanges(); 
                        if (!flushed) {
                            showToast('✅ 页面数据校验通过！');
                            hideLoadingMask(); // 校验通过且没有触发保存刷新时，才隐藏遮罩
                        }
                        // 如果 flushed 为 true，则 flushValidationChanges 会调用 performManualSave 并刷新页面，此时遮罩应继续保留
                    } else {
                        hideLoadingMask(); // 校验失败时隐藏遮罩
                    }
                }, '#d46b08'],
                ['🔢数字转换', () => triggerShortcutEvent(config.shortcutConvertNum), '#531dab'],
                ['🚀智能提交', () => { showLoadingMask('正在准备智能提交...'); performQuickSubmit(); }, '#0958d9'],
            ].forEach(([label, action, color]) => row1.appendChild(makeBtn(label, action, color)));

            // 行2：音频控制
            const row2 = makeRow();
            [
                ['🐌倍速-0.1', () => adjustAudioRate(-0.1), '#595959'],
                ['🐇倍速+0.1', () => adjustAudioRate(0.1), '#595959'],
                ['🔄重置倍速', () => adjustAudioRate(0, config.resetRateValue), '#595959'],
                ['⏪后退1s', () => adjustAudioTime(-1), '#595959'],
                ['⏩前进1s', () => adjustAudioTime(1), '#595959'],
                ['🔈音量-50%', () => adjustVolume(-50), '#595959'],
                ['🔊音量+50%', () => adjustVolume(50), '#595959'],
                ['🔉重置音量', () => adjustVolume(0, 100), '#595959'],
            ].forEach(([label, action, color]) => row2.appendChild(makeBtn(label, action, color)));

            group.appendChild(row1);
            group.appendChild(row2);
            statContainer.parentNode.insertBefore(group, statContainer.nextSibling);
        }

        // 3. 让“本页时长”支持点击复制
        const durationLi = document.getElementById('asr-duration-btn');
        if (durationLi && !durationLi.dataset.clickBound) {
            durationLi.dataset.clickBound = 'true';
            durationLi.style.cursor = 'pointer';
            durationLi.style.pointerEvents = 'auto'; // 覆盖原版的 none
            durationLi.title = '点击复制秒数';
            durationLi.onclick = () => { if (currentTotalDuration > 0) copyToClipboard(currentTotalDuration.toFixed(2)); };
        }
    }


    function init() {
        console.log('[ASR] init: 脚本初始化');
        const oldPanel = document.getElementById('asr-settings-backdrop');
        if (oldPanel) oldPanel.remove();

        createSettingsPanel();
        checkAndUpdateLifecycle();

        injectMenuButton();
        startAutoAssignPoll();

        const isListPage = () => location.pathname.toLowerCase().includes('labelingtask') || location.pathname.toLowerCase().includes('checktask');

        if (config.autoBatchSubmit && isListPage()) autoNavigateToNextTask();

        setInterval(watchActiveItemFingerprint, 150);

        let domUpdateTimer = null;
        let lastUrl = location.href; 

        const observer = new MutationObserver((mutations) => {
            // 检测 React 单页应用(SPA)的软路由 URL 变化，重新激活请求
            if (lastUrl !== location.href) {
                lastUrl = location.href;

                // 【核心防御 2】：软路由进入标注页的瞬间，光速上锁并清空所有标识！
                if (location.pathname.toLowerCase().includes('/sdk')) {
                    paginationSetting = true;
                    isTaskValidated = false;
                }

                if (config.autoBatchSubmit && isListPage()) autoNavigateToNextTask();
            }

            if (domUpdateTimer) clearTimeout(domUpdateTimer);
            domUpdateTimer = setTimeout(() => {

                injectMenuButton();
                injectToolbarButtons();
                processContentItems();

                domUpdateTimer = null;
            }, 200);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') { init(); } 
    else { window.addEventListener('DOMContentLoaded', init); }

})();