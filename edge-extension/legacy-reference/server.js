const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// ================= 0. 日志系统 =================
const logDir = path.join(__dirname, 'log');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
    console.log(`[ASR-Server] init: 已创建日志目录 ${logDir}`);
}
const statsFilePath = path.join(logDir, 'asr-stats.json');
try {
    if (!fs.existsSync(statsFilePath)) {
        fs.writeFileSync(statsFilePath, '{}');
        console.log(`[ASR-Server] init: 已创建统计数据文件 ${statsFilePath}`);
    } else {
        console.log(`[ASR-Server] init: 统计数据文件已存在 ${statsFilePath}`);
    }
} catch(e) {
    console.error(`[ASR-Server] init: 统计数据文件初始化失败 ${e.message}`);
}

function writeAiLog(data) {
    try {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const name = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        const filePath = path.join(logDir, `${name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch(e) {
        console.error('[ASR-Server] writeAiLog: 写入失败', e.message);
    }
}

const app = express();

// 配合 Nginx 的反向代理端口
const PORT = 3101; 

// ================= 1. 目录结构精确定位 =================
const asrDir = __dirname;
const dictFilePath = path.join(asrDir, 'asr-dict.json');               // 线上默认生效的词库（只读分发）
const reviewFilePath = path.join(asrDir, 'asr-dict-review.json');       // 收集用户推送的待审词库（写入目标）
const scriptFilePath = path.join(asrDir, 'asr-script.user.js');

// 初始化：保护性创建文件
if (!fs.existsSync(dictFilePath)) {
    fs.writeFileSync(dictFilePath, '[]', 'utf8');
    console.log(`[ASR-Server] init: 已创建默认词库文件 ${dictFilePath}`);
} else {
    console.log(`[ASR-Server] init: 默认词库文件已存在 ${dictFilePath}`);
}
if (!fs.existsSync(reviewFilePath)) {
    fs.writeFileSync(reviewFilePath, '[]', 'utf8');
    console.log(`[ASR-Server] init: 已创建待审词库文件 ${reviewFilePath}`);
} else {
    console.log(`[ASR-Server] init: 待审词库文件已存在 ${reviewFilePath}`);
}

// 中间件配置
app.use(cors()); 
app.use(express.json({ limit: '5mb' })); 

// ================= 2. 动态资源接口 (极速异步流式优化) =================
app.get('/asr/asr-dict.json', (req, res) => {
    console.log('[ASR-Server] 收到请求: GET /asr/asr-dict.json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(dictFilePath, err => {
        if (err) {
            console.error('[ASR-Server] 词库文件发送失败:', err.message);
            res.status(404).json([]);
        } else {
            console.log('[ASR-Server] 词库文件发送成功:', dictFilePath);
        }
    });
});

app.get('/asr/asr-script.user.js', (req, res) => {
    console.log('[ASR-Server] 收到请求: GET /asr/asr-script.user.js');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(scriptFilePath, err => {
        if (err) {
            console.error('[ASR-Server] 脚本文件发送失败:', err.message);
            res.status(404).send('// Script not found');
        } else {
            console.log('[ASR-Server] 脚本文件发送成功:', scriptFilePath);
        }
    });
});

// ================= 3. 核心 API：多重校验与写入待审库 =================
app.post('/asr/submit-dict-review', (req, res) => {
    const incomingDict = req.body;
    const word = incomingDict?.[0]?.to || '';
    const reading = incomingDict?.[0]?.from || '';
    const source = 'api';
    console.log(`[ASR-Server] submit-dict-review: 收到请求 | word="${word}" reading="${reading}" source="${source}"`);

    if (!incomingDict || !Array.isArray(incomingDict)) {
        console.error('[ASR-Server] submit-dict-review: early return - 数据格式错误');
        return res.status(400).json({ success: false, message: '数据格式错误' });
    }

    console.log(`[ASR-Server] submit-dict-review: incomingDict总条数=${incomingDict.length}`);
    let defaultDict = [];
    let reviewDict = [];
    
    if (fs.existsSync(dictFilePath)) {
        try {
            const raw = fs.readFileSync(dictFilePath, 'utf8');
            defaultDict = JSON.parse(raw);
            console.log(`[ASR-Server] submit-dict-review: 默认词库读取成功 共${defaultDict.length}条`);
        } catch(e) {
            console.error(`[ASR-Server] submit-dict-review: 默认词库读取失败 ${e.message}`);
            defaultDict = [];
        }
    }
    if (fs.existsSync(reviewFilePath)) {
        try {
            const raw2 = fs.readFileSync(reviewFilePath, 'utf8');
            reviewDict = JSON.parse(raw2);
            console.log(`[ASR-Server] submit-dict-review: 待审词库读取成功 共${reviewDict.length}条`);
        } catch(e) {
            console.error(`[ASR-Server] submit-dict-review: 待审词库读取失败 ${e.message}`);
            reviewDict = [];
        }
    }

    let addedCount = 0;
    let mergedCount = 0;
    let skipMissingFields = 0;
    let skipDefaultCovered = 0;
    let skipReviewNoExpand = 0;

    incomingDict.forEach(newRule => {
        if (!newRule.to || !newRule.from) { skipMissingFields++; return; }
        
        // 切分前端传来的源词列表
        let incomingWords = newRule.from.split(/[,，|]/).map(w => w.trim()).filter(w => w);
        if (incomingWords.length === 0) { skipMissingFields++; return; }

        // 【校验 1】：检查默认词库 asr-dict.json 是否已经存在这些词汇，如果在默认词库已有，则剔除
        let existingInDefault = defaultDict.find(r => r.to === newRule.to);
        let filteredCount = 0;
        if (existingInDefault) {
            let defaultWords = new Set(existingInDefault.from.split(/[,，|]/).map(w => w.trim()).filter(w => w));
            // 只保留默认词库中没有的新词汇
            const beforeFilter = incomingWords.length;
            incomingWords = incomingWords.filter(w => !defaultWords.has(w));
            filteredCount = beforeFilter - incomingWords.length;
            skipDefaultCovered += filteredCount;
        }

        // 如果剔除后没有新词汇了，说明这条规则完全是重复的，直接跳过
        if (incomingWords.length === 0) { skipReviewNoExpand++; return; }

        // 【校验 2】：将剩下的真正"新词汇"，智能合并到待审词库 asr-dict-review.json 中
        let existingInReview = reviewDict.find(r => r.to === newRule.to);
        if (existingInReview) {
            let oldReviewWords = existingInReview.from.split(/[,，|]/).map(w => w.trim()).filter(w => w);
            let originalLength = oldReviewWords.length;
            
            // Set 自动去重
            let mergedSet = new Set([...oldReviewWords, ...incomingWords]);
            if (mergedSet.size > originalLength) {
                existingInReview.from = Array.from(mergedSet).join(','); 
                mergedCount++;
            } else {
                skipReviewNoExpand++;
            }
        } else {
            // 待审库中完全没有这个目标词，作为新条目增加
            reviewDict.push({ from: incomingWords.join(','), to: newRule.to });
            addedCount++;
        }
    });

    // 第三步：转为 JSON 并将结果写入【待审文件】，绝不污染默认文件
    console.log(`[ASR-Server] submit-dict-review: 统计 incoming=${incomingDict.length} 缺字段跳过=${skipMissingFields} 默认覆盖跳过=${skipDefaultCovered} 待审无扩容跳过=${skipReviewNoExpand} 新增=${addedCount} 合并=${mergedCount}`);
    try {
        fs.writeFileSync(reviewFilePath, JSON.stringify(reviewDict, null, 2), 'utf8');
        console.log(`[ASR-Server] submit-dict-review: 推送处理完成 | 新增=${addedCount} 合并=${mergedCount} 待审库总数=${reviewDict.length}`);
        res.status(200).json({ success: true, message: '已成功推送至待审词库' });
        console.log(`[ASR-Server] submit-dict-review: 成功响应已发送`);
    } catch (err) {
        console.error(`[ASR-Server] submit-dict-review: 待审词库保存失败 ${err.message}`);
        res.status(500).json({ success: false, message: '服务器写入文件失败' });
    }
});

// ================= 4. AI 标点修复接口（单次合并请求，节省 token） =================
app.post('/asr/fix-punctuation', async (req, res) => {
    const { texts, apiKey, meta = {}, duration = 0, useAdvancedRules = false, model: reqModel } = req.body || {};
    console.log(`[ASR-Server] fix-punctuation: 收到请求 | texts=${texts?.length ?? 0} model=${reqModel || 'default'} useAdvancedRules=${useAdvancedRules} taskName=${meta.taskName || ''} taskId=${meta.taskId || ''} subTaskId=${meta.subTaskId || ''} batchId=${meta.batchId || ''} annotator=${meta.annotator || ''}`);

    if (!apiKey) {
        console.error('[ASR-Server] fix-punctuation: early return - 未提供API Key');
        return res.status(400).json({ success: false, message: '未提供 API Key' });
    }
    if (!Array.isArray(texts) || texts.length === 0) {
        console.error('[ASR-Server] fix-punctuation: early return - 无有效文本');
        return res.status(400).json({ success: false, message: '无有效文本' });
    }

    const model = reqModel && reqModel.trim() ? reqModel.trim() : 'qwen3.5-flash';
    console.log(`[ASR-Server] fix-punctuation: 调用通义千问 API | model=${model} texts=${texts.length}`);

    const baseSystemPrompt = '你是一个中文标点符号修复助手。用户会给出一个JSON数组，每个元素是一条ASR语音转写文本。请逐条进行标点修复，遵守以下全部规则：\n1.标点基础：句末必须有标点（句号、问号、感叹号之一）。\n2.文字完整性：不要修改任何文字内容、不要增删字、不要纠错、不要改变语序。\n3.疑问与语气词规则：明确是疑问语气的结尾（如"对不对"、"吗"、"是不是"、"为什么"）必须使用问号（？）；非疑问语气的陈述或祈使结尾（如"好的"、"谢谢啊"、"好的好的"）必须使用句号（。），绝不能乱用问号。\n4.长句断句规则：长句必须根据语义在中间合理断句，使用逗号（，）、分号（；）或感叹号（！），绝对不能出现超长文本没有中间标点的情况。\n5.防碎片化与句号限制：断句不能过碎，保持语义连贯；**只能在整段结尾使用唯一一个句号**，中间停顿全部用逗号或分号，绝对禁止连续使用句号。\n6.禁止标点堆叠：严禁出现连续、重复使用标点符号的情况（如"x、x、x、x"的连续顿号堆砌），应根据语境优化为逗号或省略。\n7.返回格式：直接返回一个等长的JSON数组，每个元素对应输入的修复结果，不要任何解释或包裹。';
    const advancedRulesEnabled = useAdvancedRules === true || useAdvancedRules === 'true';
    const advancedRulesPrompt = '另外必须严格遵守以下规则：1.对于专有名词、强调字眼或特定提示语，绝对不要使用引号（“”或""）进行包裹；2.如果人物话未说完或出现停顿，严禁使用省略号（......或...），必须直接使用句号（。）截断。';
    const systemPrompt = advancedRulesEnabled ? `${baseSystemPrompt}${advancedRulesPrompt}` : baseSystemPrompt;

    try {
        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: JSON.stringify(texts) }
                ],
                enable_thinking: false
            })
        });

        const data = await response.json();
        console.log(`[ASR-Server] fix-punctuation: API响应状态=${response.status}`);

        if (!response.ok) {
            const errMsg = data?.error?.message || `HTTP ${response.status}`;
            console.error(`[ASR-Server] fix-punctuation: API请求失败 ${errMsg}`);
            return res.status(502).json({ success: false, message: errMsg });
        }

        const raw = data?.choices?.[0]?.message?.content || '';
        console.log(`[ASR-Server] fix-punctuation: choices=${!!data?.choices} raw长度=${raw.length}`);
        let fixedTexts;
        try {
            const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/,'').trim();
            fixedTexts = JSON.parse(cleaned);
            if (!Array.isArray(fixedTexts)) throw new Error('not an array');
        } catch(e) {
            console.error(`[ASR-Server] fix-punctuation: JSON解析失败 ${e.message} raw长度=${raw.length}`);
            writeAiLog({ total: texts.length, error: 'JSON parse failed', raw: raw.substring(0, 200), tokens: data?.usage || null });
            return res.status(502).json({ success: false, message: 'AI返回格式异常，无法解析' });
        }
        console.log(`[ASR-Server] fix-punctuation: JSON解析成功 返回数量=${fixedTexts.length}/${texts.length}`);

        // 逐条对齐：模型少返回则补原文，多返回则截断
        const results = texts.map((text, index) => ({
            index,
            success: !!(fixedTexts[index]),
            text: fixedTexts[index] || text
        }));

        const successCount = results.filter(r => r.success).length;
        const fallbackCount = results.filter(r => !r.success).length;
        console.log(`[ASR-Server] fix-punctuation: results构建完成 success=${successCount} fallback=${fallbackCount}`);

        const logEntries = texts.map((text, index) => ({
            index,
            input: text,
            output: fixedTexts[index] || null,
            success: !!(fixedTexts[index])
        }));

        const rawUsage = data?.usage || {};
        const tokens = {
            prompt_tokens: rawUsage.prompt_tokens || 0,
            completion_tokens: rawUsage.completion_tokens || 0,
            total_tokens: rawUsage.total_tokens || 0
        };

        writeAiLog({
            taskName: meta.taskName || '',
            taskId: meta.taskId || '',
            subTaskId: meta.subTaskId || '',
            batchId: meta.batchId || '',
            annotator: meta.annotator || '',
            gmtCreate: meta.gmtCreate || '',
            duration: parseFloat(duration).toFixed(2),
            total: texts.length,
            model: model,
            tokens,
            items: logEntries
        });
        console.log(`[ASR-Server] fix-punctuation: 完成 token消耗=${tokens.total_tokens} taskName=${meta.taskName || 'N/A'}`);

        res.json({ success: true, results });
        console.log(`[ASR-Server] fix-punctuation: 响应已发送`);
    } catch(e) {
        console.error(`[ASR-Server] fix-punctuation: 异常 ${e.message}${e.stack ? ' ' + e.stack.substring(0, 200) : ''}`);
        res.status(500).json({ success: false, message: e.toString() });
    }
});

// 兜底静态服务
app.use('/asr', express.static(asrDir));

// ================= 5. 排行榜数据上传接口 =================
app.post('/asr/upload-stats', (req, res) => {
    const records = req.body;
    console.log(`[ASR-Server] upload-stats: 收到请求 | records=${records?.length ?? 0}`);
    if (!Array.isArray(records)) {
        console.error('[ASR-Server] upload-stats: early return - 需要传入数组');
        return res.status(400).json({ success: false, message: '需要传入数组' });
    }
    try {
        let stats = {};
        try {
            const raw = fs.readFileSync(statsFilePath, 'utf8');
            stats = JSON.parse(raw);
            console.log(`[ASR-Server] upload-stats: 读取成功 当前记录数=${Object.keys(stats).length}`);
        } catch(e) {
            console.error(`[ASR-Server] upload-stats: 读取失败 ${e.message}`);
            stats = {};
        }
        let updateCount = 0;
        let skipNoBatchId = 0;
        for (const r of records) {
            if (!r.batchId) { skipNoBatchId++; continue; }
            stats[r.batchId] = { annotator: r.annotator || '', duration: parseFloat(r.duration) || 0, batchId: r.batchId, commitDate: r.commitDate || '' };
            updateCount++;
        }
        fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2));
        console.log(`[ASR-Server] upload-stats: 写入成功 | 有效写入=${updateCount} 缺batchId跳过=${skipNoBatchId} 总记录数=${Object.keys(stats).length}`);
        res.json({ success: true, count: records.length });
        console.log(`[ASR-Server] upload-stats: 成功响应已发送`);
    } catch(e) {
        console.error(`[ASR-Server] upload-stats: 保存失败 ${e.message}`);
        res.status(500).json({ success: false, message: e.toString() });
    }
});

// ================= 6. 排行榜查询接口 =================
app.get('/asr/leaderboard', (req, res) => {
    const { date } = req.query;
    console.log(`[ASR-Server] leaderboard: 收到请求 | date=${date}`);
    if (!date) {
        console.error('[ASR-Server] leaderboard: early return - 缺少date参数');
        return res.status(400).json({ success: false, message: '缺少 date 参数' });
    }
    try {
        let stats = {};
        try {
            const raw = fs.readFileSync(statsFilePath, 'utf8');
            stats = JSON.parse(raw);
            console.log(`[ASR-Server] leaderboard: 读取成功 总记录数=${Object.keys(stats).length}`);
        } catch(e) {
            console.error(`[ASR-Server] leaderboard: 读取失败 ${e.message}`);
            stats = {};
        }
        const map = {};
        let matchCount = 0;
        Object.values(stats).forEach(v => {
            if (!v.commitDate || !v.commitDate.startsWith(date)) return;
            if (!map[v.annotator]) map[v.annotator] = 0;
            map[v.annotator] += parseFloat(v.duration) || 0;
            matchCount++;
        });
        const result = Object.entries(map).map(([annotator, totalDuration]) => ({ annotator, totalDuration }))
            .sort((a, b) => b.totalDuration - a.totalDuration);
        console.log(`[ASR-Server] leaderboard: 计算完成 | 匹配记录=${matchCount} | 榜单人数=${result.length}`);
        res.json({ success: true, data: result });
        console.log(`[ASR-Server] leaderboard: 响应已发送 | 结果数=${result.length}`);
    } catch(e) {
        console.error(`[ASR-Server] leaderboard: 异常 ${e.message}`);
        res.status(500).json({ success: false, message: e.toString() });
    }
});

// ================= 4. 启动服务 =================
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 阿里ASR后端极客服务已完美启动!`);
    console.log(`📡 本地监听端口: ${PORT} (等待 Nginx 转发)`);
    console.log(`📂 线上分发词库: ${dictFilePath}`);
    console.log(`📝 收集待审词库: ${reviewFilePath}`);
    console.log(`🤖 AI标点修复接口: POST /asr/fix-punctuation`);
    console.log(`=========================================`);
});