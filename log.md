## 2026-06-12（README 补充服务器更新部署说明）
- 补充根 `README.md` 的服务器部署入口：
  - 新增“服务器日常更新”
  - 新增“扩展发布产物更新”
  - 明确区分“后端代码更新”和“静态下载包更新”
- 补充 `platform-resources/backend/README.md` 的详细部署流程：
  - 首次部署
  - 日常更新
  - 更新后检查清单
- 当前口径明确：
  - 本仓库服务器更新默认不是 `npm install`，而是 `git pull + env 复核 + pm2 restart + 接口检查`
  - 只替换 `dist/` 静态下载产物时，通常不需要重启后端
## 2026-06-12（config 扁平化与平台参考文档标准化）
- 本轮把两份单文件配置直接收口到 `config/` 根级：
  - `config/package-crx-release.json`
  - `config/aliyun-bailian-model-pricing.json`
- 已同步修改发布脚本与后端读取路径：
  - `scripts/package-crx-release.js`
  - `scripts/sync-local-build-meta.js`
  - `platform-resources/backend/ai/model-catalog.js`
  - `platform-resources/backend/ai/model-pricing.js`
- 已删除空目录：
  - `config/release/`
  - `config/pricing/`
- 已把 `platform-resources/**/(network|page-structure)` 的稳定参考文档统一到两层模板：
  - 索引 README 固定章节：`目录定位 / 适用范围 / 当前覆盖 / 文件列表 / 阅读顺序 / 通用约定 / 当前边界 / 待补项`
  - 单页参考固定章节：Network 使用 `请求标识 / 目的` 开头，Page-structure 使用 `页面标识 / 路由 / 前置条件` 开头
- 已清理主参考体系中的过程型文件：
  - `pending-capture.md`
  - `next-session-handoff.md`
  - `playwright-edge / devtools-readonly / readonly-retest` 一类复测记录
- 已补齐缺失索引：
  - `platform-resources/abaka-ai/page-structure/README.md`
- 已同步更新项目规则与导航：
  - `AGENTS.md`
  - `config/README.md`
  - `platform-resources/README.md`
  - `platform-resources/aishell-tech/README.md`
  - `platform-resources/data-baker-cvpc/README.md`
- 当前约束：后续新增平台参考文档时，必须继续使用这套统一章节顺序；过程历史统一写入 `log.md`，不再回流到主参考目录。
﻿## 2026-06-11锛堢粺涓€ AI 鎵归噺鐘舵€佸尯 Token 涓庝汉姘戝竵鍚堣灞曠ず锛?
- 褰撳墠鎶婃壒閲?AI 娑堣€楁眹鎬绘寮忔敹鍙ｅ埌 4 濂楀凡鏈夋壒閲忕姸鎬侀潰鏉匡細
  - `DataBaker round-one-quality`
  - `Aishell 闂藉崡璇姪鎵媊
  - `Aishell 瓒婂崡璇姪鎵媊
  - `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡
- 鍓嶇鎵归噺鐘舵€佸尯褰撳墠缁熶竴鏂板锛?  - `鎵归噺杈撳叆Token`
  - `鎵归噺杈撳嚭Token`
  - `鎵归噺鎬籘oken`
  - `鎵归噺棰勪及浜烘皯甯乣
- 鍙ｅ緞缁熶竴涓衡€滃凡杩斿洖 AI 缁撴灉鐨勮皟鐢ㄦ秷鑰椻€濓細
  - 鍗充娇鍚庣画椤甸潰濉叆鎴栦繚瀛樺け璐ワ紝鍙璇ユ潯宸茬粡杩斿洖鍙敤 `usage/cost`锛屼粛璁″叆鎵归噺鍚堣
  - 榛樿杩愯涓疄鏃剁疮璁★紝缁撴潫鍚庝繚鐣欐渶缁堝€?  - 缂哄皯浠锋牸鏁版嵁鏃堕〉闈㈡樉绀?`娌℃湁鏁版嵁婧恅锛屼笉鏄剧ず閮ㄥ垎閲戦
- 褰撳墠鏂板鍏变韩妯″潡锛?  - `extension/shared/ai-batch-summary.js`
  - 缁熶竴澶勭悊鍗曢樁娈?/ 澶氶樁娈?usage 姹囨€汇€佷汉姘戝竵姹囨€诲拰鎵归噺鐘舵€佸尯琛屾覆鏌?- 鏈疆鍚屾鏇存柊锛?  - `AGENTS.md`
  - `docs/README.md`
  - `docs/rules/project-collaboration-rules.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `extension/sites/data-baker/round-one-quality/content.js`
  - `extension/sites/data-baker/round-one-quality/ui-panel.js`
  - `extension/sites/data-baker/round-one-quality/README.md`
  - `extension/sites/aishell-tech/minnan-helper/content.js`
  - `extension/sites/aishell-tech/minnan-helper/ui-panel.js`
  - `extension/sites/aishell-tech/minnan-helper/README.md`
  - `extension/sites/aishell-tech/vietnamese-helper/content.js`
  - `extension/sites/aishell-tech/vietnamese-helper/ui-panel.js`
  - `extension/sites/aishell-tech/vietnamese-helper/README.md`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker/round-one-quality/README.md`
  - `platform-resources/aishell-tech/minnan-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --test extension/shared/ai-batch-summary.test.js`
  - `node --test extension/sites/data-baker/round-one-quality/ui-panel.test.js`
  - `node --test extension/sites/aishell-tech/minnan-helper/ui-panel.test.js`
  - `node --test extension/sites/aishell-tech/vietnamese-helper/ui-panel.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`

## 2026-06-11锛堥」鐩枃妗ｅ鑸敹鍙ｄ笌涓存椂 AI 娴嬭瘯娓呯悊锛?
- 鏂囨。鑱岃矗閲嶅垝鍒嗭細
  - `AGENTS.md` 褰撳墠閲嶅啓涓洪」鐩敮涓€涓昏鍒欐枃妗ｏ紝闆嗕腑缁存姢椤圭洰绾у崗浣滆鍒欍€丟it 瑙勮寖銆侀獙璇佽姹傘€佸畨鍏ㄨ竟鐣屻€佺増鏈鍒欎笌娴嬭瘯鏂囦欢娌荤悊
  - 鏍?`README.md` 褰撳墠鏀跺彛涓哄鑸椤碉紝鍙繚鐣欓」鐩畾浣嶃€佺洰褰曡鏄庛€佸惎鍔ㄥ叆鍙ｅ拰鏂囨。鍏ュ彛
  - `docs/README.md` 褰撳墠鏀跺彛涓?docs 瀵艰埅锛屼笉鍐嶇淮鎶ゅ巻鍙茶繃绋嬫枃浠跺叆鍙?  - `docs/platforms-index.md` 褰撳墠鏀跺彛涓哄钩鍙颁笌鑴氭湰绱㈠紩锛屽彧淇濈暀涓嬮捇璺緞涓庨槄璇婚『搴忥紝涓嶅啀鍫嗙儹淇祦姘磋处
- docs 鏋佺畝鍖栵細
  - 鍒犻櫎 `docs/archive/`
  - 鍒犻櫎 `docs/rules/`
  - 鍒犻櫎 `docs/superpowers/`
  - 鍒犻櫎宸蹭笉鍐嶄唬琛ㄥ綋鍓嶄粨搴撶湡瀹炵粨鏋勭殑鏃╂湡 `docs/architecture/*.md` 鍘嗗彶鏂囦欢锛屼粎淇濈暀缁熶竴鍚庣 / AI 妗嗘灦璁捐涓庤縼绉绘枃妗?- 涓存椂 AI / 妯″瀷娴嬭瘯娓呯悊锛?  - 鍒犻櫎缁熶竴 `ai / ai-framework / ai-service / ai-call-log / payload-merge / ai-job / ai-review / diagnostics / batch-pipeline / ai-recommendation` 鐩稿叧娴嬭瘯涓?smoke 楠岃瘉鑴氭湰
  - 鏄庣‘淇濈暀 `options`銆乣storage`銆乣ui-panel`銆乣content`銆乣data-api`銆乣shortcuts` 绛夋牳蹇冨洖褰掓祴璇?- 鏈疆鍚屾鏇存柊锛?  - `AGENTS.md`
  - `README.md`
  - `docs/README.md`
  - `docs/platforms-index.md`
  - `log.md`
- 鏈疆鏈敼锛?  - `extension/manifest.json` 鐗堟湰鍙?  - 鍙戝竷娴佺▼
  - 骞冲彴杩愯鏃朵唬鐮佷笌鍚庣涓氬姟閫昏緫

## 2026-06-11锛堟洿澶氬墠绔潰鏉胯ˉ榻愪汉姘戝竵浼扮畻灞曠ず锛?
- 褰撳墠鎶婄粺涓€ `cost` 鐨勫墠绔睍绀轰粠鏃㈡湁 `DataBaker CVPC / Aishell 瓒婂崡璇璥 鎵╁睍鍒版洿澶氳繍琛屾椂闈㈡澘锛?  - `extension/shared/ai-cost-display.js` 褰撳墠浣滀负鍓嶇鍏变韩閲戦鏍煎紡鍖栦笌 `娌℃湁鏁版嵁婧恅 瑙ｆ瀽鍏ュ彛锛岀粺涓€鎻愪緵鍗曢樁娈?澶氶樁娈典汉姘戝竵琛岀敓鎴?  - `Magic Data` shared core 涓?`hakka-helper/minnan-helper` 瀹為檯闈㈡澘褰撳墠閮芥妸鎬荤粨璁烘憳瑕佸尯鏀逛负 `妯″瀷 / 鑰楁椂 / 浜烘皯甯乣
  - `DataBaker round-one` 缁撴灉鍗″綋鍓嶆柊澧?`鍚煶棰勪及浜烘皯甯?/ 瀵规瘮棰勪及浜烘皯甯?/ 鎬婚浼颁汉姘戝竵`锛宍omni_single` 鍙樉绀?`棰勪及浜烘皯甯乣
  - `Aishell 闂藉崡璇姪鎵媊 褰撳墠琛ラ綈 `cost` 閫忎紶锛岃瘖鏂尯鏂板 `杞崲 / 鍚煶 / 姣旇緝 / 鎬籤 鍥涜浜烘皯甯佷及绠?  - `Alibaba LabelX` 蹇垽缁撴灉鍗″綋鍓嶆柊澧?`鍚煶 / 姣旇緝 / 鎬籤 浜烘皯甯佷及绠楋紝杞啓缁撴灉鍗℃柊澧炲崟琛?`棰勪及浜烘皯甯乣
- 瑙勫垯鍚屾锛?  - `AGENTS.md`
  - `docs/rules/project-collaboration-rules.md`
  - 褰撳墠鏄庣‘瑕佹眰锛氬彧瑕佸墠绔凡鏈?AI 缁撴灉淇℃伅鍖轰笖缁撴灉宸插甫缁熶竴 `cost`锛岄粯璁よˉ浜烘皯甯佷及绠楀睍绀猴紱鍗曢樁娈垫樉绀轰竴琛?`棰勪及浜烘皯甯乣锛屽闃舵鏄剧ず闃舵棰勪及涓?`鎬婚浼颁汉姘戝竵`
- 楠岃瘉锛?  - `node --check extension/shared/ai-cost-display.js`
  - `node --check extension/sites/magic-data/shared/assistant-panel-core.js`
  - `node --check extension/sites/magic-data/minnan-helper/assistant-panel.js`
  - `node --check extension/sites/magic-data/hakka-helper/assistant-panel.js`
  - `node --check extension/sites/data-baker/round-one-quality/ui-panel.js`
  - `node --check extension/sites/aishell-tech/minnan-helper/ai-recommendation.js`
  - `node --check extension/sites/aishell-tech/minnan-helper/diagnostics.js`
  - `node --check extension/sites/alibaba-labelx/asr-judgement/judgement-ai-suggestion.js`
  - `node --check extension/sites/alibaba-labelx/asr-transcription/ai-suggestion-panel.js`
  - `node --test extension/shared/ai-cost-display.test.js`
  - `node --test extension/sites/magic-data/shared/assistant-panel-core.test.js`
  - `node --test extension/sites/data-baker/round-one-quality/ui-panel.test.js`
  - `node --test extension/sites/aishell-tech/minnan-helper/diagnostics.test.js`

## 2026-06-11锛圖ataBaker CVPC 鏌冲窞璇濆甫鏍囩濉叆娓呯┖闂琛ヤ慨锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠琛ヤ慨涓€澶勪細璁╁師鐢熸爣绛惧洖鏀炬彁鍓嶅け璐ョ殑绌虹粨鏋勫寲鍊煎垽鏂細
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js` 褰撳墠鎶婄粨鏋勫寲绌烘暟缁?`[]` 缁熶竴瑙ｇ爜涓虹┖鏂囨湰锛屼笉鍐嶆妸瀹冭鍒ゆ垚瀛楅潰閲?`"[]"`
  - 杩欎細璁┾€滃厛娓呯┖缂栬緫鍣紝鍐嶉『搴忔彃鍏ユ枃鏈?+ 鐐瑰嚮椤甸潰鍘熺敓鏍囩鎸夐挳鈥濈殑涓昏矾寰勮兘缁х画寰€涓嬫墽琛岋紝涓嶄細鍦ㄦ竻绌烘牎楠岄樁娈电洿鎺ヤ腑姝?  - 鑻ュ師鐢熷洖鏀句换涓€姝ヤ粛鏈€氳繃鏍￠獙锛屽綋鍓嶄細鍏堟仮澶嶆棫 `modelvalue + 鍙 HTML` 蹇収锛岄伩鍏嶅啀娆″嚭鐜扳€滅偣濉叆鏍囨敞鏂囨湰鍚庤緭鍏ユ琚洿鎺ユ竻绌衡€?- 鏂板鍥炲綊娴嬭瘯锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js` 褰撳墠琛ヤ簡鈥滅┖ structured `modelvalue` 瑙嗕负绌烘枃鏈€濈敤渚嬶紝骞舵仮澶?`甯︽爣绛惧師鐢熷洖鏀綻 鐢ㄤ緥涓虹豢

## 2026-06-11锛圖ataBaker CVPC 鏌冲窞璇濆甫鏍囩褰撳墠娈靛～鍏ユ敼涓轰紭鍏堝師鐢熸寜閽洖鏀撅級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠瀵光€滅偣鍑?`濉叆鏍囨敞鏂囨湰` 鍚庯紝甯︽爣绛惧唴瀹逛笅涓€绉掕椤甸潰鍥炴粴鈥濈殑鍦烘櫙杩藉姞鏈€鍚庝竴灞傚厹搴曪細
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js` 褰撳墠鍦ㄦ娴嬪埌褰撳墠娈?`鏍囨敞鏂囨湰` 闇€瑕佸啓甯︽爣绛惧唴瀹癸紝涓旈〉闈㈠彲鐢ㄥ師鐢熸爣绛炬寜閽椂锛屼細浼樺厛璧扳€滅紪杈戝櫒鍐呴『搴忔彃鍏ユ枃鏈?+ 椤甸潰鍘熺敓鏍囩鎸夐挳鍥炴斁鈥?  - 鍙湁椤甸潰涓嶆敮鎸佽繖鏉″師鐢熷洖鏀捐矾寰勬椂锛屾墠缁х画鍥為€€鍒版棦鏈?`MAIN world` 缁撴瀯鍖栫姸鎬佹ˉ + DOM 鑷剤鏂规
  - 鐩爣鏄敖閲忚创杩戜汉宸ユ搷浣滐紝闄嶄綆 `<Meaningless>`銆乣#eh`銆乣<SPK/>` 涓€绫?chip 琚?Vue / tiptap 涓嬩竴杞覆鏌撳洖婊氱殑姒傜巼
- 鏈疆鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`

## 2026-06-11锛圖ataBaker CVPC 鏌冲窞璇濇爣绛炬湁鏁堟€ц仈鍔ㄤ笌缁撴瀯鍖栨爣绛惧啓鍏ョǔ瀹氬寲锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鎶婃爣绛炬湁鏁堟€у垽鏂寮忔敹鍙ｅ埌缁熶竴鍐欏叆灞傦細
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js` 褰撳墠浼氬厛鏍规嵁鏌冲窞璇?token/text 鎺ㄦ柇 `requiredValidity = valid | invalid | conflict | none`
  - `濉叆鏍囨敞鏂囨湰 / 濉叆鏅€氳瘽椤烘粦 / 鏁村崱濉叆 / 褰撳墠娈佃瘑鍒嚜鍔ㄥ～鍏?/ 鎵归噺鍐欏洖` 褰撳墠鍏ㄩ儴澶嶇敤鍚屼竴濂楄鍒?  - 鑻ユ帹鑽愬悓鏃跺嚭鐜版湁鏁堟爣绛句笌鏃犳晥鏍囩锛屾垨鏃犳晥鏍囩涓庤涔夋鏂囧苟瀛橈紝浼氱洿鎺ュ垽涓?`conflict`锛氬綋鍓嶆鍋滄鍐欏叆锛屾壒閲忚烦杩囧潖娈靛苟缁х画淇濆瓨鍏跺畠鎴愬姛娈?- 褰撳墠娈典氦浜掑啓鍏ュ綋鍓嶆柊澧?`鏍囩涓庢湁鏁堟€т笉涓€鑷存椂鐩存帴淇` 寮€鍏筹細
  - `extension/shared/constants.js`銆乣extension/shared/storage.js`銆乣extension/options/options.js`銆乣extension/options/options.html` 褰撳墠琛ラ綈榛樿鍊间笌 Options UI锛岄粯璁?`true`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js` 褰撳墠鍦ㄧ紪杈戦〉 `褰撳墠娈佃瘑鍒玚 鍖烘柊澧炲悓鍚嶉〉鍐呮寔涔呭寲 checkbox
  - 寮€鍚椂浼氱洿鎺ュ垏鎹?`Valid / Invalid` 骞剁户缁啓鍏ワ紱鍏抽棴鍚庢敼涓?`window.confirm`锛岀偣鈥滃惁鈥濆垯鏁存褰撳墠娈靛啓鍏ュ彇娑?- 缁撴瀯鍖栨爣绛惧啓鍏ュ綋鍓嶄粠鈥滅函 DOM 鎸佺画琛ュ啓鈥濆崌绾т负鈥滈〉闈㈢粍浠剁姸鎬佷紭鍏堬紝DOM 鑷剤鍏滃簳鈥濓細
  - `extension/sites/data-baker-cvpc/liuzhou-helper/page-world/audio-observer.js` 褰撳墠鏂板 `MAIN world` 缁撴瀯鍖栧瓧娈靛啓鍏ユˉ
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js` 褰撳墠鍦ㄥ啓甯︽爣绛?`鏍囨敞鏂囨湰` 鏃讹紝浼氫紭鍏堝悓姝ラ〉闈㈠唴閮?`modelvalue` 鐩稿叧鐘舵€佹Ы锛屽啀鐢卞彲瑙?chip 鑷剤鍏滃簳
  - 鐩爣鏄慨澶?`<Meaningless>`銆乣#eh`銆乣<SPK/>鏂囨湰<SPK/>` 杩欑被缁撴瀯鍖栧唴瀹瑰啓鍏ュ悗涓€绉掕 Vue / tiptap 涓嬩竴杞覆鏌撳洖婊氱殑闂
- 鏈疆鍚屾鏇存柊锛?  - `extension/shared/constants.js`
  - `extension/shared/storage.js`
  - `extension/shared/storage.data-baker-cvpc.test.js`
  - `extension/options/options.html`
  - `extension/options/options.js`
  - `extension/options/options-data-baker-cvpc-ai-ui.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/page-world/audio-observer.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/page-world/audio-observer.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --test extension/shared/storage.data-baker-cvpc.test.js`
  - `node --test extension/options/options-data-baker-cvpc-ai-ui.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/page-world/audio-observer.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`

## 2026-06-11锛圓ishell Tech 瓒婂崡璇姪鎵嬩竴鑷存枃鏈烦杩囧～鍏ヤ笌璐圭敤灞曠ず锛?
- `extension/sites/aishell-tech/vietnamese-helper/ui-panel.js` 褰撳墠鏂板鈥滀竴鑷存枃鏈烦杩囧～鍏モ€濋€昏緫锛?  - 褰?`璇嗗埆鏂囨湰` 涓?`鍘熷鏂囨湰` 鎸夎秺鍗楄鏍囩偣/绌烘牸瑙勮寖鍖栧悗瀹屽叏涓€鑷存椂锛屼笉鍐嶆樉绀?`濉叆骞朵繚瀛樺綋鍓嶆潯`
  - 褰撳墠缁撴灉鍖烘敼涓虹洿鎺ユ彁绀?`涓庢簮鏂囨湰涓€鑷达紝鏃犻渶澶勭悊`
- `extension/sites/aishell-tech/vietnamese-helper/content.js` 褰撳墠浼氭寜闈㈡澘鍥炰紶鐨?`matchesReferenceText` 鐘舵€佹洿鏂版垚鍔熸彁绀猴紝涓嶅啀涓€寰嬫樉绀烘櫘閫氬畬鎴愭枃妗?- 瓒婂崡璇崟闃舵璐圭敤閾捐矾褰撳墠琛ラ綈鍒扳€滅粨鏋滃崱 + AI 璋冪敤璁板綍鈥濓細
  - `platform-resources/aishell-tech/vietnamese-helper/backend/pipeline.js` 褰撳墠淇濈暀 Omni `raw usage` 鏄庣粏锛屽苟鍥炲啓 `meta.cost`
  - `extension/sites/aishell-tech/vietnamese-helper/ai-recommendation.js` 褰撳墠鎶婂悗绔?`cost` 閫忎紶鍒板墠绔粨鏋?  - `extension/sites/aishell-tech/vietnamese-helper/diagnostics.js` 褰撳墠鏂板 `棰勪及浜烘皯甯乣
  - `platform-resources/aishell-tech/vietnamese-helper/data/ai-call-log.js` 褰撳墠鎶婂崟闃舵鏃ュ織鎸?`璇嗗埆棰勪及浜烘皯甯?/ 鎬婚浼颁汉姘戝竵` 瀵煎嚭
- 鏈疆鍚屾鏇存柊锛?  - `extension/sites/aishell-tech/vietnamese-helper/content.js`
  - `extension/sites/aishell-tech/vietnamese-helper/ai-recommendation.js`
  - `extension/sites/aishell-tech/vietnamese-helper/diagnostics.js`
  - `extension/sites/aishell-tech/vietnamese-helper/ui-panel.js`
  - `extension/sites/aishell-tech/vietnamese-helper/diagnostics.test.js`
  - `extension/sites/aishell-tech/vietnamese-helper/ui-panel.test.js`
  - `platform-resources/aishell-tech/vietnamese-helper/backend/pipeline.js`
  - `platform-resources/aishell-tech/vietnamese-helper/backend/ai-service.test.js`
  - `platform-resources/aishell-tech/vietnamese-helper/data/ai-call-log.js`
  - `platform-resources/aishell-tech/vietnamese-helper/data/ai-call-log.test.js`
  - `extension/sites/aishell-tech/vietnamese-helper/README.md`
  - `platform-resources/aishell-tech/vietnamese-helper/README.md`
  - `platform-resources/aishell-tech/vietnamese-helper/backend/README.md`
  - `platform-resources/aishell-tech/vietnamese-helper/data/README.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `log.md`

## 2026-06-11锛圓ishell Tech 瓒婂崡璇姪鎵嬭皟鐢ㄤ笌 options 榛樿鍊?hotfix锛?
- 淇 `platform-resources/aishell-tech/vietnamese-helper/backend/pipeline.js` 瀵圭粺涓€ provider queue 杩斿洖鍊肩殑璇锛?  - 涔嬪墠鎶?`enqueueTask()` 鐨?`{ value, queueMeta }` 褰撴垚妯″瀷缁撴灉鏈韩浣跨敤锛屽鑷?`recognize` 鎴愬姛鍝嶅簲琚鍒や负绌烘枃鏈?  - 鐜板湪宸叉纭В鍖呴槦鍒楃粨鏋滐紝骞舵妸 `queueWaitMs / retryCount` 鍥炲啓鍒拌繑鍥?`meta`
- 淇 `platform-resources/aishell-tech/vietnamese-helper/backend/errors.js` 瀵?plain object 閿欒鐨勯檷绾э細
  - 鐜板湪浼氫繚鐣?`message / code / statusCode / providerStatus`
  - 涓嶅啀鎶婄粨鏋勫寲閿欒鏄剧ず鎴?`[object Object]`
- 淇 `extension/options/options.js` 閲岃秺鍗楄鍔╂墜鏈湴 fallback 榛樿鍊肩粨鏋勶細
  - `/api/aishell-tech/vietnamese-helper/ai/recommend/defaults` 澶辫触鏃讹紝options 褰撳墠浼氬洖閫€鍒板畬鏁寸殑鍗曢樁娈垫湰鍦伴粯璁ゅ€?  - 榛樿妯″瀷銆侀粯璁?Prompt 鍜屽叡浜珮绾у弬鏁颁笉鍐嶄涪澶辨垨鏄剧ず涓虹┖
- 鏈疆鍚屾鏇存柊锛?  - `platform-resources/aishell-tech/vietnamese-helper/backend/pipeline.js`
  - `platform-resources/aishell-tech/vietnamese-helper/backend/errors.js`
  - `platform-resources/aishell-tech/vietnamese-helper/backend/ai-service.test.js`
  - `platform-resources/aishell-tech/vietnamese-helper/backend/errors.test.js`
  - `extension/options/options.js`
  - `extension/options/options-aishell-tech-ui.test.js`
  - `extension/sites/aishell-tech/vietnamese-helper/README.md`
  - `platform-resources/aishell-tech/vietnamese-helper/README.md`
  - `platform-resources/aishell-tech/vietnamese-helper/backend/README.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/options/options.js`
  - `node --check platform-resources/aishell-tech/vietnamese-helper/backend/pipeline.js`
  - `node --check platform-resources/aishell-tech/vietnamese-helper/backend/errors.js`
  - `node --check platform-resources/aishell-tech/vietnamese-helper/backend/ai-service.test.js`
  - `node --check platform-resources/aishell-tech/vietnamese-helper/backend/errors.test.js`
  - `node --check extension/options/options-aishell-tech-ui.test.js`
  - `node --test platform-resources/aishell-tech/vietnamese-helper/backend/ai-service.test.js`
  - `node --test platform-resources/aishell-tech/vietnamese-helper/backend/errors.test.js`
  - `node --test extension/options/options-aishell-tech-ui.test.js`
  - `node --test extension/shared/storage.aishell-tech.test.js`
  - `node --test extension/sites/aishell-tech/vietnamese-helper/batch-pipeline.test.js`

## 2026-06-11锛圓ishell Tech 瓒婂崡璇姪鎵嬫寮忔帴鍏ワ級

- 鏂板 `Aishell Tech / 瓒婂崡璇姪鎵媊 姝ｅ紡鐗堣剼鏈紝鑴氭湰 ID锛歚aishellTechVietnameseAssistant`銆?- Aishell 骞冲彴褰撳墠浠庘€滃崟鑴氭湰纭紪鐮佲€濇墿鎴愨€滃悓骞冲彴鍙岃剼鏈簰鏂モ€濓細
  - 鏂板 `platforms.aishellTech.activeScriptId`
  - 鏂板 `platforms.aishellTech.scripts.vietnameseHelper`
  - options / popup / storage / manifest / constants 褰撳墠閮藉凡鎸夊弻鑴氭湰鍙ｅ緞鎺ュ叆
- 鍓嶇杩愯鏃跺綋鍓嶅凡鏀跺彛涓鸿秺鍗楄鍗曢樁娈?Omni锛?  - 鏂板 `extension/sites/aishell-tech/vietnamese-helper/`
  - 鍙繚鐣?`璇嗗埆鏂囨湰` 缁撴灉鍖猴紝涓嶅啀灞曠ず `杞崲鏂囨湰 / 鍚煶鏂囨湰 / 宸紓楂樹寒`
  - 鎵归噺鍏ュ彛淇濈暀 `鍏ㄩ儴AI鎵归噺璇嗗埆 / 鏈畬鎴愮殑AI鎵归噺璇嗗埆 / 鍋滄鎵归噺`
  - 鏂囨湰瑙勮寖鏀逛负瓒婂崡璇┖鏍间笌鏍囩偣瑙勫垯锛屼笉鍐嶈蛋涓枃鍘荤┖鏍奸摼璺?- 鍚庣褰撳墠鏂板 `platform-resources/aishell-tech/vietnamese-helper/backend/`锛?  - 鎺ュ彛锛歚health / defaults / recommend / jobs / jobs/:jobId / jobs/:jobId/debug / logs/summary`
  - 鍙帴鍙楀崟闃舵 `recognize`
  - 榛樿妯″瀷 `qwen3.5-omni-flash`
  - 涓嶆帴璇嶈〃锛屼笉鍐嶄繚鐣?`convert / listen / compare`
- AI 鏃ュ織涓庣粺涓€鍚庣褰撳墠宸插悓姝ユ帴鍏ワ細
  - 鏂板鑴氭湰绾ф棩蹇楀畾涔?`platform-resources/aishell-tech/vietnamese-helper/data/ai-call-log.js`
  - 鏂板瀵煎嚭鏁版嵁闆?ID锛歚aishell-tech-vietnamese-helper-ai`
  - `platform-resources/backend/registry.js` 涓?`platform-resources/backend/ai-call-log-download/routes.js` 宸叉敞鍐?- 鏂囨。褰撳墠宸插悓姝ユ洿鏂帮細
  - `extension/sites/aishell-tech/vietnamese-helper/README.md`
  - `platform-resources/aishell-tech/vietnamese-helper/README.md`
  - `platform-resources/aishell-tech/vietnamese-helper/backend/README.md`
  - `platform-resources/aishell-tech/vietnamese-helper/data/README.md`
  - `platform-resources/aishell-tech/README.md`
  - `platform-resources/README.md`
  - `platform-resources/backend/README.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/shared/constants.js`
  - `node --check extension/shared/storage.js`
  - `node --check extension/options/options.js`
  - `node --check extension/popup/popup.js`
  - `node --check extension/sites/aishell-tech/vietnamese-helper/data-api.js`
  - `node --check extension/sites/aishell-tech/vietnamese-helper/ai-recommendation.js`
  - `node --check extension/sites/aishell-tech/vietnamese-helper/content.js`
  - `node --check extension/sites/aishell-tech/vietnamese-helper/diagnostics.js`
  - `node --check extension/sites/aishell-tech/vietnamese-helper/shortcuts.js`
  - `node --check extension/sites/aishell-tech/vietnamese-helper/ui-panel.js`
  - `node --check platform-resources/aishell-tech/vietnamese-helper/backend/ai-service.js`
  - `node --check platform-resources/aishell-tech/vietnamese-helper/backend/ai-routes.js`
  - `node --check platform-resources/aishell-tech/vietnamese-helper/backend/pipeline.js`
  - `node --check platform-resources/backend/registry.js`
  - `node --check platform-resources/backend/ai-call-log-download/routes.js`
  - `node --test extension/shared/storage.aishell-tech.test.js`
  - `node --test extension/sites/aishell-tech/vietnamese-helper/data-api.test.js`
  - `node --test extension/sites/aishell-tech/vietnamese-helper/batch-pipeline.test.js`
  - `node --test platform-resources/aishell-tech/vietnamese-helper/backend/ai-service.test.js`

## 2026-06-11锛堝叏浠?AI 鏈嶅姟缁熶竴 AI 娑堣€楄褰曚笌浜烘皯甯佷及绠楋級

- 褰撳墠鎶娾€滀腑鏂?CSV 琛ㄥご + 鍒嗛樁娈?token + 棰勪及浜烘皯甯?+ 缁熶竴 `cost` 瀵硅薄鈥濅粠 `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 鎵╁睍鍒板叏浠撳凡鎺ュ叆 AI 鏈嶅姟锛?  - 鏂板鍏变韩鏃ュ織闃舵鍔╂墜 `platform-resources/backend/ai-call-log/stage-log-support.js`
  - `execute-project-pipeline` 褰撳墠浼氶€忎紶椤跺眰 `cost`锛屼緵 framework 鏃ュ織涓庡悗缁墠绔鐢?  - `DataBaker round-one / Aishell Minnan / Magic Data hakka-minnan / LabelX judgement-transcription / Abaka Task21` 褰撳墠閮藉凡鎺ュ叆缁熶竴浜烘皯甯佷及绠?- AI 璇锋眰璁板綍褰撳墠缁熶竴鍙ｅ緞锛?  - CSV 鍏叡鍒椾笌鑴氭湰鎵╁睍鍒楃粺涓€涓枃琛ㄥご
  - 鍗曢樁娈甸粯璁よ褰曟€?token锛屽苟琛モ€滃綋鍓嶈皟鐢ㄩ樁娈?/ 鎬婚浼颁汉姘戝竵鈥?  - 澶氶樁娈甸粯璁ゆ媶鍒嗛樁娈?token 涓庨樁娈甸浼颁汉姘戝竵
  - 缂哄皯浠锋牸閰嶇疆鏃讹紝椤甸潰缁х画鏄剧ず `娌℃湁鏁版嵁婧恅锛孋SV 閲戦鍒椾繚鎸佺┖鐧?- 椤圭洰绾ч暱鏈熻鍒欏綋鍓嶅悓姝ュ啓鍏ワ細
  - `AGENTS.md`
  - `docs/rules/project-collaboration-rules.md`
  - `README.md`
  - `docs/platforms-index.md`
  - `platform-resources/README.md`
  - `platform-resources/backend/README.md`

## 2026-06-11锛圖ataBaker CVPC 鏌冲窞璇濆崟鐙姘旇瘝缁撴灉鍗″睍绀轰笌 AI 鍙傝€冩敹鍙ｏ級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠琛ラ綈鈥滃簲鐢ㄥ眰宸茶惤 `<Meaningless>`锛屼絾缁撴灉鍗′粛鏄剧ず鍘熷 `#um / 鍡€俙鈥濈殑灞曠ず缂哄彛锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js` 褰撳墠鍦ㄥ綋鍓嶆璇嗗埆鎴愬姛鍚庯紝浼氫负灞曠ず灞傞檮甯?`applyPreset + rawDisplaySource`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js` 褰撳墠浼樺厛鐢ㄦ渶缁堝簲鐢ㄩ璁炬覆鏌?`淇鍚庣殑鏌冲窞璇濇枃鏈琡銆乣鏁寸悊鍚庣殑鏅€氳瘽鏂囨湰`锛屼互鍙?`AI淇℃伅` 閲岀殑 `鏌冲窞璇濅慨姝ｅ弬鑰?/ 鏅€氳瘽椤烘粦鍙傝€僠
  - 鍛戒腑鍗曠嫭璇皵璇?`<Meaningless>` 棰勮鏃讹紝钃濊壊缁撴灉鍗′笌 AI 鍙傝€冨尯涓嶅啀缁х画鏄剧ず鍘熷 `#um / 鍡€俙锛涘師濮嬪唴瀹圭户缁彧淇濈暀鍦?`AI 杩斿洖鍘熷鍐呭`
- 鏈疆鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `log.md`

## 2026-06-11锛圖ataBaker CVPC 鏌冲窞璇濅腑鏂?CSV 琛ㄥご涓?AI 娑堣€楄褰曟敹鍙ｏ級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠缁х画淇濈暀鍘熷杩斿洖澶嶅埗涓庝汉姘戝竵浼扮畻锛屼絾鏀跺彛鏄剧ず涓庡鍑哄彛寰勶細
  - 鍓嶇 `AI淇℃伅` 涓ら樁娈靛綋鍓嶅彧鏄剧ず `妯″瀷 / 杈撳叆 / 杈撳嚭 / 棰勪及浜烘皯甯乣
  - 鍓嶇涓嶅啀鏄剧ず `杈撳叆鍗曚环 / 杈撳嚭鍗曚环`
  - `璐圭敤姹囨€籤 缁х画淇濈暀 `鎬婚浼颁汉姘戝竵`
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 鐨?AI 璇锋眰璁板綍褰撳墠鏀规垚涓枃鎵╁睍琛ㄥご锛?  - 淇濈暀姹囨€诲垪 `杈撳叆Token / 杈撳嚭Token / 鎬籘oken`
  - 淇濈暀闃舵鍒?`鍚煶杈撳叆Token / 鍚煶杈撳嚭Token / 鍚煶鎬籘oken / 鏂囨湰淇杈撳叆Token / 鏂囨湰淇杈撳嚭Token / 鏂囨湰淇鎬籘oken`
  - 淇濈暀閲戦鍒?`鍚煶棰勪及浜烘皯甯?/ 鏂囨湰淇棰勪及浜烘皯甯?/ 鎬婚浼颁汉姘戝竵`
  - 鍒犻櫎閲嶅鍒?`listenPricingStatus / refinePricingStatus / listenInputPrice / listenOutputPrice / refineInputPrice / refineOutputPrice`
  - 缂哄皯浠锋牸鏁版嵁鏃讹紝CSV 閲戦鍒楀綋鍓嶄繚鎸佺┖鐧斤紝涓嶅啀鍐?`娌℃湁鏁版嵁婧恅
- 椤圭洰绾ц鍒欏綋鍓嶈ˉ榻愬埌 `AGENTS.md` 涓?`docs/rules/project-collaboration-rules.md`锛?  - 鍚庣画 AI 璋冪敤 CSV 琛ㄥご缁熶竴浣跨敤涓枃
  - 鍚庣画鏂板鎴栨敼鍔ㄧ殑 AI 璋冪敤璁板綍榛樿璁板綍 token 娑堣€楋紱鏈変汉姘戝竵浼扮畻鏃跺悓鏃惰褰曢噾棰濆垪
  - 澶氶樁娈?AI 璋冪敤榛樿鎷嗗垎闃舵 token 涓庨樁娈典汉姘戝竵鍒楋紝涓嶅啀瀵煎嚭閲嶅鍗曚环/鐘舵€佹枃鏈瓧娈?- 鏈疆鍚屾鏇存柊锛?  - `AGENTS.md`
  - `docs/rules/project-collaboration-rules.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-call-log.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-call-log.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `README.md`
  - `docs/platforms-index.md`
  - `log.md`

## 2026-06-11锛圖ataBaker CVPC 鏌冲窞璇濊瘑鍒悗鑷姩濉叆涓庡崟鐙姘旇瘝鑷姩钀?Meaningless锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鎶娾€滃崟鐙姘旇瘝杞?`<Meaningless>`鈥濅粠鎵嬪姩濉叆閾捐矾鎵╁睍鍒板綋鍓嶆璇嗗埆鑷姩搴旂敤閾捐矾锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js` 褰撳墠鍦ㄥ綋鍓嶆璇嗗埆鎴愬姛鍚庯紝榛樿绔嬪嵆澶嶇敤鐜版湁鏁村崱濉叆鑳藉姏
  - 鑻ユ渶缁堢粨鏋滃彧鍓?`#um / #hmm / #ah / #eh` 涓庢爣鐐癸紝鑷姩濉叆浼氱洿鎺ヨ蛋 `Invalid + <Meaningless> + 绌烘櫘閫氳瘽椤烘粦` 棰勮
  - 鑷姩濉叆澶辫触鏃讹紝璇嗗埆缁撴灉浠嶄繚鐣欏湪瀛楁缁撴灉鍗″拰 `AI淇℃伅` 涓紝鐢ㄦ埛鍙户缁墜鍔ㄥ～鍏?- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鏂板 `璇嗗埆瀹屾垚鍚庤嚜鍔ㄥ～鍏 寮€鍏筹細
  - `extension/shared/constants.js`銆乣extension/shared/storage.js`銆乣extension/options/options.js` 褰撳墠琛ラ綈 `aiRecommendAutoFillEnabled` 榛樿鍊间笌褰掍竴鍖栵紝榛樿寮€鍚?  - `extension/options/options.html` 鍦?CVPC 鍩虹璁剧疆鍖烘柊澧為粯璁ゅ紑鍏?  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js` 鍦ㄧ紪杈戦〉 `褰撳墠娈佃瘑鍒玚 鍖烘柊澧為〉鍐呮寔涔呭寲 checkbox锛屽彲鍗虫椂鍒囨崲
- 鏈疆鍚屾鏇存柊锛?  - `extension/shared/constants.js`
  - `extension/shared/storage.js`
  - `extension/shared/storage.data-baker-cvpc.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/options/options.html`
  - `extension/options/options.js`
  - `extension/options/options-data-baker-cvpc-ai-ui.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/shared/constants.js`
  - `node --check extension/shared/storage.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `node --check extension/options/options.js`
  - `node --test extension/shared/storage.data-baker-cvpc.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `node --test extension/options/options-data-baker-cvpc-ai-ui.test.js`

## 2026-06-11锛圖ataBaker CVPC 鏌冲窞璇濆師濮嬭繑鍥炲鍒躲€佷汉姘戝竵浼扮畻涓庡垎闃舵 Token 鏃ュ織锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠琛ラ綈 3 椤规敹鍙ｏ細
  - 鍓嶇 `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js` 褰撳墠涓?`AI 杩斿洖鍘熷鍐呭` 澧炲姞 `澶嶅埗鍘熷杩斿洖` 鎸夐挳锛涘鍒舵枃鏈浐瀹氬墠缂€涓?`AI杩斿洖鍘熷鍐呭涓猴細`
  - `AI淇℃伅` 褰撳墠鍦?`鍚煶璇嗗埆 / 鏂囨湰淇` 涓ら樁娈垫柊澧?`杈撳叆鍗曚环 / 杈撳嚭鍗曚环 / 棰勪及浜烘皯甯乣锛屽苟棰濆灞曠ず `鎬婚浼颁汉姘戝竵`
  - 鍚庣褰撳墠涓?`listen / refine` 涓ら樁娈佃ˉ榻愮嫭绔嬫垚鏈及绠楋紝骞跺湪澶辫触鎬佷繚鐣欏彲鐢ㄩ樁娈垫垚鏈?- 鍏变韩浠锋牸閰嶇疆褰撳墠姝ｅ紡钀藉湴锛?  - 鏂板 `config/aliyun-bailian-model-pricing.json`
  - 鏂板 `platform-resources/backend/ai/model-pricing.js`
  - 褰撳墠浠锋牸鍙ｅ緞鍥哄畾涓?`涓浗鍐呭湴 / 鍗庡寳2锛堝寳浜級`
  - 褰撳墠鍙綍鍏?`qwen3.5-omni-plus / qwen3.5-omni-flash / qwen3.5-plus / qwen3.5-flash` 4 涓ā鍨嬶紱鍏朵綑妯″瀷缁熶竴杩斿洖 `娌℃湁鏁版嵁婧恅
  - 浠锋牸鏉ユ簮褰撳墠鍥哄畾璁板綍涓猴細
    - `https://help.aliyun.com/zh/model-studio/model-pricing`
    - `https://bailian.console.aliyun.com/cn-beijing?tab=model#/model-market/all`
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 鐨?AI 璇锋眰璁板綍褰撳墠缁х画淇濈暀姹囨€诲垪 `杈撳叆Token / 杈撳嚭Token / 鎬籘oken`锛屽苟鏂板锛?  - `listenPromptTokens / listenCompletionTokens / listenTotalTokens`
  - `refinePromptTokens / refineCompletionTokens / refineTotalTokens`
  - `listenEstimatedCostCny / refineEstimatedCostCny / totalEstimatedCostCny`
  - `listenPricingStatus / refinePricingStatus`
  - `listenInputPrice / listenOutputPrice / refineInputPrice / refineOutputPrice`
- 鏈疆鍚屾鏇存柊锛?  - `config/aliyun-bailian-model-pricing.json`
  - `platform-resources/backend/ai/model-pricing.js`
  - `platform-resources/backend/ai/model-pricing.test.js`
  - `platform-resources/backend/ai/model-catalog.js`
  - `platform-resources/backend/ai-call-log/index.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-call-log.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-call-log.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/shared/constants.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `docs/platforms-index.md`
  - `README.md`
- 鏈疆楠岃瘉锛?  - `node --test platform-resources/backend/ai/model-pricing.test.js`
  - `node --test platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `node --test platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-call-log.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`

## 2026-06-11锛圖ataBaker CVPC 鏌冲窞璇濆崟鐙姘旇瘝 Invalid/Meaningless 棰勮涓庢爣绛剧┖鏍间慨澶嶏級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠琛ヤ笂涓€灞傗€滃崟鐙姘旇瘝钀?Invalid鈥濆簲鐢ㄩ璁撅細
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js` 褰撳墠浼氳瘑鍒€滄渶缁堝缓璁彧鍓?`#um / #hmm / #ah / #eh` 杩欑被鍗曠嫭璇皵璇嶆爣绛句笌鏍囩偣鈥濈殑缁撴灉
  - 鐢ㄦ埛鐐瑰嚮褰撳墠娈靛畾鍚戝～鍏ャ€佹暣鍗″～鍏ワ紝鎴栨壒閲忓啓鍥炲懡涓繖绫荤粨鏋滄椂锛岃繍琛屾椂浼氱粺涓€鏀瑰啓涓?`Invalid + <Meaningless> + 绌烘櫘閫氳瘽椤烘粦`
  - 璇ラ璁句笉浼氭敼 AI 鍘熷杩斿洖 JSON锛屽彧鍦ㄩ〉闈㈠簲鐢ㄥ眰鎶?`鏍囨敞鏂囨湰` 鍐欐垚缁撴瀯鍖?`<Meaningless>`銆佹妸 `鏅€氳瘽椤烘粦` 娓呯┖锛屽苟鍚屾鍒囧埌 `Invalid`
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠琛ラ綈鏍囩鐩搁偦绌烘牸瑁佸壀锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js` 褰撳墠鍦ㄧ粨鏋勫寲鏍囩鍐欏叆鍓嶄細瑁佹帀鏍囩鍓嶅悗鐨勫浣欏崐瑙掔┖鏍?  - 鐩爣鏄伩鍏?`#ah 浠栧張...` 杩欑被 chip 鍚庢畫鐣欑┖鐧芥鏂囷紝淇濇寔椤甸潰灞曠ず涓?`modelvalue` 涓€鑷?- 鏈疆鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`

## 2026-06-11锛圖ataBaker CVPC 鏌冲窞璇濊繎闊崇籂閿欎笌璇箟淇锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠琛ラ綈鈥滃惉闊宠繎闊冲€欓€?+ 鏂囨湰璇箟淇鈥濋摼璺細
  - 鍚庣 `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js` 褰撳墠鎶婁袱闃舵濂戠害鎵╂垚 `listen -> candidatePhrases`銆乣refine -> candidateAlternatives`
  - `listen` 褰撳墠闄ゅ師濮嬫煶宸炶瘽鍚煶澶栵紝杩樹細杩斿洖鏈€澶?`3` 鏉¤繎闊冲€欓€夛紝渚涗笅涓€闃舵缁撳悎鍙ユ剰鍒ゆ柇
  - `refine` 褰撳墠浼氱粨鍚堥〉闈笂涓嬫枃銆丣SON 涓昏瘝琛ㄥ拰鍙傝€?CSV 鐨?prompt-only 閲婁箟/璇婚煶鍋氫繚瀹堢籂姝ｏ紱鑻ヤ粛鏈夋涔夛紝杩斿洖 `candidateAlternatives` 骞跺己鍒?`needHumanReview=true`
- 鍓嶇 `AI淇℃伅` 褰撳墠琛ラ綈 `杩戦煶鍊欓€夊弬鑰僠锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js` 褰撳墠鍦ㄧ嫭绔?AI 鍖哄睍绀?`杩戦煶鍊欓€夊弬鑰僠锛屼絾瀛楁缁撴灉鍗′粛鍙繚鐣欎袱寮犳渶缁堢粨鏋滃崱锛屼笉棰濆澧炲姞澶氬€欓€夊～鍏ユ寜閽?  - `鏅€氳瘽椤烘粦` 浠嶅彧鏄剧ず鏈€缁堟暣鐞嗙粨鏋滐紱杩戦煶澶囬€夌粺涓€鐣欏湪 AI 淇℃伅鍖轰緵浜哄伐鍒ゆ柇
- 鏈疆鍚屾鏇存柊锛?  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-rules.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `log.md`

## 2026-06-11锛圖ataBaker CVPC 鏌冲窞璇濇爣绛捐仈鍔ㄨˉ寮猴細璇皵璇嶄繚鐣欍€佺瑧澹板綊涓€鍖栥€佹爣绛惧～鍏ュ彲瑙嗚嚜鎰堬級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠琛ラ綈涓€杞爣绛捐仈鍔ㄧ己鍙ｏ細
  - 鍚庣 `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js` 褰撳墠鏂板楂樼疆淇℃枃鏈綊涓€鍖栵細鐙珛 `鍛?/ 璇?/ 娆?-> #eh`銆佺嫭绔?`鍟?-> #ah`銆佺嫭绔?`鍡?-> #um`銆侀噸澶嶇瑧澹?`鍛靛懙 / 鍝堝搱 / 鍢垮樋 / 鍢诲樆` 涓€绫讳富璇磋瘽浜洪潪璇箟澹伴煶 -> `<SPK/>`
  - `#hmm` 涓?`<NPS/>` 褰撳墠缁х画鍙帴鍙楁ā鍨嬫樉寮忚緭鍑猴紝涓嶄粠绾枃鏈嚜鍔ㄧ寽娴?  - `鏅€氳瘽椤烘粦` 褰撳墠浼氫繚鐣欎笌 `#eh / #ah / #um / #hmm` 瀵瑰簲鐨勭函鏂囨湰璇皵璇嶏紝浣嗕笉浼氫繚鐣?`<SPK/> / <NPS/>` 鎴栫瑧澹版枃鏈?- 褰撳墠娈垫爣绛惧～鍏ラ摼璺綋鍓嶈ˉ涓婁竴灞傚彲瑙嗚嚜鎰堬細
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js` 缁х画浠?`.textarea_class[modelvalue]` 涓虹湡婧?  - 褰撳墠娈垫妸甯︽爣绛剧粨鏋滃～鍏?`鏍囨敞鏂囨湰` 鍚庯紝浼氬湪鏈夐檺娆℃暟鐭欢鏃跺唴澶嶆牳 `.ProseMirror` 鍙 DOM锛涜嫢椤甸潰涓嬩竴娆?tiptap 閲嶇粯鎶?chip 涓存椂娓呯┖锛屼細鎸?`modelvalue` 鑷姩鎭㈠鏄剧ず
- 鏈疆鍚屾鏇存柊锛?  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-rules.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `log.md`

## 2026-06-11锛圖ataBaker CVPC 鏌冲窞璇?Qwen 椋庢帶閿欒鎻愮ず鏀跺彛锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鎶?`providerCode=data_inspection_failed` 杩欑被 Qwen 杈撳嚭瀹℃煡閿欒鏀跺彛鎴愭洿鏄庣‘鐨勭敤鎴锋彁绀猴細
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js` 褰撳墠浼氭妸鍘熷厛绗肩粺鐨?`Qwen SSE 杩斿洖閿欒銆俙 缈昏瘧涓?`Qwen 杈撳嚭瑙﹀彂鍐呭椋庢帶锛堝唴瀹瑰鏌ユ嫤鎴級锛岃浜哄伐澶嶆牳鎴栭噸璇曘€俙
  - 杩欐牱鍙充晶鐘舵€併€佹壒閲忓け璐ユ竻鍗曞拰鍓嶇澶辫触鎬侀兘浼氱洿鎺ヨ鏄庢槸鍐呭椋庢帶锛屼笉鍐嶈鍒ゆ垚鏅€氱綉缁滄垨 SSE 鏁呴殰
- 鏈疆鍚屾鏇存柊锛?  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --check platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`
  - `node --test platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`

## 2026-06-11锛圖ataBaker CVPC 鏌冲窞璇?AI 淇℃伅涔辩爜涓?fetch 澶辫触鎻愮ず淇锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠淇 `AI淇℃伅` 鍐呬竴澶勬爣棰樹贡鐮侊細
  - `ui-panel.js` 涓鍐欐垚涔辩爜瀛楃涓茬殑 `鏅€氳瘽椤烘粦鍙傝€僠 宸叉仮澶嶄负姝ｅ父涓枃
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鎶婃祻瑙堝櫒鍘熷 `Failed to fetch` 鏀跺彛涓烘洿鍙墽琛岀殑 AI 鍚庣鎻愮ず锛?  - `ai-recommendation.js` 鍦?`POST /ai/recommend` 灏氭湭鎷垮埌浠讳綍 HTTP 鍝嶅簲銆佹祻瑙堝櫒 `fetch()` 灏辩洿鎺ュけ璐ユ椂锛屼細缁熶竴鎶涘嚭 `杩炴帴 AI 鍚庣澶辫触锛岃妫€鏌?options 棣栭〉鍚庣鎺ュ彛鍦板潃銆佸悗绔湇鍔＄姸鎬佹垨褰撳墠缃戠粶鍚庨噸璇昤
  - 褰撳墠闊抽婧愪笅杞藉湪娴忚鍣ㄧ綉缁滃眰鐩存帴澶辫触鏃讹紝涔熶細缁熶竴鏀规垚 `褰撳墠闊抽璁块棶澶辫触锛屽彲鑳芥槸椤甸潰 session 宸茶繃鏈熸垨褰撳墠缃戠粶涓嶅彲鐢紱璇峰埛鏂伴〉闈㈠悗閲嶈瘯`
  - `segmentation-controller.js` 鍦ㄨ姹傚垎娈靛缓璁悗绔椂鑻ユ祻瑙堝櫒 `fetch()` 鐩村け璐ワ紝涔熶細缁熶竴鏀规垚 `杩炴帴鍒嗘寤鸿鍚庣澶辫触锛岃妫€鏌?options 棣栭〉鍚庣鎺ュ彛鍦板潃銆佸悗绔湇鍔＄姸鎬佹垨褰撳墠缃戠粶鍚庨噸璇昤
  - 鍚屾椂淇濈暀 `rawResponse.fetchError` 渚?`AI淇℃伅 -> AI 杩斿洖鍘熷鍐呭` 缁х画鏌ョ湅搴曞眰娴忚鍣ㄩ敊璇?- 鏈疆鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/segmentation-controller.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/segmentation-controller.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/segmentation-controller.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/segmentation-controller.test.js`

## 2026-06-11锛圖ataBaker CVPC 鏌冲窞璇濋煶棰?session 杩囨湡鎻愮ず涓庡埛鏂版寜閽級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鎶娾€滃師濮嬮煶棰戜笅杞藉け璐ワ紝鏃犳硶鎴彇褰撳墠娈碘€濊繖绫诲墠绔彁绀烘敹鍙ｄ负鏇磋创杩戝疄闄呭師鍥犵殑鏂囨锛?  - `ai-recommendation.js` 鍦ㄥ綋鍓嶉煶棰戠鍚嶅湴鍧€杩斿洖闈?`2xx` 鏃讹紝缁熶竴鎻愮ず `褰撳墠闊抽璁块棶宸插け鏁堬紝閫氬父鏄〉闈?session 宸茶繃鏈燂紱璇峰埛鏂伴〉闈㈠悗閲嶈瘯銆俙
  - `content.js` 褰撳墠浼氳瘑鍒繖绫诲け璐ワ紝骞跺湪鍙充晶鐘舵€佸尯闄勫甫 `鍒锋柊椤甸潰` 鍔ㄤ綔
  - `ui-panel.js` 鐨勭姸鎬佸尯褰撳墠鏀寔鍚屼竴琛屾覆鏌撳彲閫夋搷浣滄寜閽紝鐢ㄦ埛鍙洿鎺ョ偣鍑诲埛鏂板綋鍓嶇紪杈戦〉锛岄噸鏂拌幏鍙栧甫 session 鐨勯煶棰戣闂湴鍧€
- 鏈疆鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`

## 2026-06-11锛圖ataBaker CVPC 鏌冲窞璇濆け璐ユ€佸厹搴曟枃鏈笌鏍囩蹇嵎閿級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠琛ラ綈涓€杞け璐ユ€佸彲澶嶅埗鍏滃簳锛?  - 鍚庣 `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js` 鍦?`listen/refine` 鍛戒腑 `妯″瀷杈撳嚭 JSON 瑙ｆ瀽澶辫触` 鏃讹紝鑻ュ師濮嬭繑鍥炰粛鏈夊彲璇绘枃鏈紝浼氫繚瀹堣ˉ榻?`audioMandarinText / refinedDialectText / refinedDialectTokens / refinedMandarinText / dialectText / mandarinText`
  - `AI淇℃伅` 鍥哄畾椤哄簭褰撳墠琛ラ綈 `鏅€氳瘽椤烘粦鍙傝€僠锛屽け璐ユ€佷粛涓嶄吉瑁呮垚鎴愬姛锛屼絾浼氫繚鐣欏彲鐩存帴澶嶅埗鐨勬煶宸炶瘽/鏅€氳瘽鍙傝€冿紝骞跺己鍒?`needHumanReview=true`
  - `buildRecommendErrorBody()` 褰撳墠缁熶竴閫忓嚭鑴辨晱鍚庣殑 `rawResponse / debugRawJson / usage / models / timing` 涓庡厹搴曟枃鏈瓧娈碉紝鍓嶇澶辫触鎬佸彲鐩存帴灞曠ず
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠棰濆琛ヤ笂 9 涓〉闈㈡爣绛炬寜閽揩鎹烽敭锛?  - `extension/options/options.js` 褰撳墠涓?`dataBakerCvpcShortcutActions` 鏂板 `labelSpk / labelNps / labelUm / labelHmm / labelAh / labelEh / labelUnintelligible / labelMeaningless / labelSilence`
  - `content.js` 鏂板鍏叡鏍囩鍔ㄤ綔鏄犲皠锛宍data-api.js` 鏂板 `applyCommonLabel()`锛涘姩浣滃疄鐜扮粺涓€涓虹湡瀹炵偣鍑婚〉闈?`common_label_show` 鎸夐挳
  - disabled 鏍囩鎸夐挳褰撳墠鐩存帴澶辫触锛屼笉缁曡繃骞冲彴闄愬埗锛屼篃涓嶇洿鎺ュ悜鏂囨湰瀛楁纭啓鏍囩
- 鏈疆鍚屾鏇存柊锛?  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/shortcuts.test.js`
  - `extension/options/options.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --check platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `node --check extension/options/options.js`
  - `node --test platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/shortcuts.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`

## 2026-06-10锛圖ataBaker CVPC 鏌冲窞璇濇爣绛捐仈鍔ㄤ笌缁撴瀯鍖栧啓鍥烇級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠瀹屾垚涓€杞爣绛捐仈鍔ㄦ敹鍙ｏ細
  - 鍚庣 `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js` 褰撳墠鎶婃ā鍨嬭緭鍑轰粠鈥滃彲璇诲唴鑱旀爣绛惧瓧绗︿覆鈥濈粺涓€褰掍竴鍖栦负缁撴瀯鍖?token锛屽苟缁х画淇濈暀鍏煎瀛楃涓插瓧娈?  - 褰撳墠鍙仈鍔?6 涓湁鏁堟爣绛撅細`#um / #hmm / #ah / #eh / <SPK/> / <NPS/>`
  - `鏍囨敞鏂囨湰` 褰撳墠浣滀负鍞竴甯︽爣绛惧瓧娈碉紱`鏅€氳瘽椤烘粦` 濮嬬粓淇濇寔绾枃鏈紝涓嶅啓浠讳綍鏍囩
  - `ai/recommend` 鎴愬姛鍝嶅簲褰撳墠鏂板 `audioDialectTokens / refinedDialectTokens`锛涘け璐ュ搷搴斿湪宸叉湁鍚煶缁撴灉鏃朵篃浼氳ˉ `audioDialectTokens`
  - 鑻ヨ瘑鍒粨鏋滈噷鍑虹幇闈炴硶鏍囩锛屾垨鍛戒腑 `鏍囩偣 + 鏍囩 + 鏍囩偣`锛屽悗绔綋鍓嶄細鑷姩褰掍竴鍖栧苟琛?`notes`锛屽悓鏃舵妸 `needHumanReview` 缃负 `true`
- 鍓嶇 `extension/sites/data-baker-cvpc/liuzhou-helper/` 褰撳墠鍚屾鏀逛负缁撴瀯鍖栨爣绛惧啓鍏ワ細
  - `data-api.js` 褰撳墠璇诲彇鏌冲窞璇濆瓧娈垫椂浼樺厛瑙ｆ瀽 `.textarea_class[modelvalue]`锛岄伩鍏嶆妸鏍囩鍏抽棴鎸夐挳 `脳` 璇杩涙鏂?  - 褰撳墠娈靛～鍏ャ€佸瓧娈靛崱瀹氬悜濉叆鍜屾壒閲?`save_increment` 鍐欏洖锛屽綋鍓嶇粺涓€鐢熸垚骞冲彴 `text/single` 娣峰悎鏁扮粍
  - `AI淇℃伅` 涓庡瓧娈电粨鏋滃崱褰撳墠浼樺厛鎸?chip 娓叉煋 `audioDialectTokens / refinedDialectTokens`
  - 鎵归噺鎴愬姛娈电紦瀛樺綋鍓嶄細鍚屾鎼哄甫 `dialectTokens`锛屼笉鍐嶅彧浼犵函瀛楃涓?- 鏈疆鍚屾鏇存柊锛?  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-rules.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --check platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `node --test platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`

## 2026-06-10锛圖ataBaker CVPC 鏌冲窞璇濆垎娈靛墠鍚庤ˉ鍋挎敼涓哄彲閰嶇疆锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鎶婂垎娈靛缓璁噷鐨勨€滃墠鍚庤ˉ鍋库€濅粠鍥哄畾 `0.1s` 鏀规垚鍙厤缃」锛?  - 榛樿鍊兼敼涓?`0.2s`
  - 鍙皟鑼冨洿 `0 ~ 1.5s`
  - options `鍩虹璁剧疆` 褰撳墠鏂板 `鍓嶅悗琛ュ伩鏃堕暱`
  - 鍓嶇璇锋眰浼氭妸璇ュ€兼寜 `rules.contextPaddingMs` 浼犵粰鍚庣
  - 鍚庣鍒嗘瑙勫垯銆乣segment/health` 榛樿鍊煎拰 UI 瑙勫垯鎽樿褰撳墠鍚屾璺熼殢璇ラ厤缃?- 鏈疆鍚屾鏇存柊锛?  - `extension/shared/constants.js`
  - `extension/shared/storage.js`
  - `extension/shared/storage.data-baker-cvpc.test.js`
  - `extension/options/options.html`
  - `extension/options/options.js`
  - `extension/options/options-data-baker-cvpc-ai-ui.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/segmentation-controller.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/segmentation-controller.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/segment-service.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/segment-service.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --test extension/shared/storage.data-baker-cvpc.test.js`
  - `node --test extension/options/options-data-baker-cvpc-ai-ui.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/segmentation-controller.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `node --test platform-resources/data-baker-cvpc/liuzhou-helper/backend/segment-service.test.js`

## 2026-06-11锛圖ataBaker CVPC 鏌冲窞璇?unique_id 鍐茬獊鎻愮ず鏀瑰啓锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鎶婂钩鍙?`save_increment` 杩斿洖 `unique_id閲嶅` 鏃剁殑鎻愮ず鏀瑰緱鏇村噯纭細
  - 鏃ф枃妗堝彧璇粹€滃垎娈靛缓璁凡淇濈暀鈥濓紝瀹规槗琚瑙ｆ垚鈥滅┖闊抽鈥濇垨鈥滄病鏈夎瘑鍒埌鍐呭鈥?  - 鏂版枃妗堟槑纭彁绀鸿繖閫氬父琛ㄧず鈥滃钩鍙板綋鍓嶅垎娈电姸鎬佷笌鏈鐩村啓淇濆瓨浣撳啿绐佲€濓紝骞跺缓璁厛鍒锋柊椤甸潰锛屽啀閲嶆柊鐢熸垚鍒嗘寤鸿鎴栦汉宸ュ鐞?- 鏈疆鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`

## 2026-06-10锛圖ataBaker CVPC 鏌冲窞璇?unique_id閲嶅 淇銆佽嚜鍔ㄥ簲鐢ㄥ紑鍏充笌鍙充晶椤哄簭璋冩暣锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠缁х画浼樺寲涓棿 AI 鍖烘枃妗堜笌淇℃伅灞曠ず锛?  - 涓棿涓诲尯鏍囬褰撳墠鏀逛负 `鏌冲窞璇?AI 璇嗗埆鍔╂墜`
  - 鍥哄畾鎸?`褰撳墠娈佃瘑鍒?/ 鎵归噺璇嗗埆 / 鍒嗘寤鸿 / AI淇℃伅` 4 涓垎鍖哄睍绀?  - `褰撳墠娈?AI 鎺ㄨ崘 / 鐢熸垚鐢绘寤鸿 / 搴旂敤褰撳墠寤鸿 / 褰撳墠娈?AI 闄勫姞淇℃伅` 绛夋棫鍙ｅ緞褰撳墠缁熶竴鏀跺彛鍒?`褰撳墠娈佃瘑鍒?/ 鐢熸垚鍒嗘寤鸿 / 搴旂敤鍒嗘寤鸿 / AI淇℃伅`
  - `AI淇℃伅` 褰撳墠榛樿鎶樺彔浣嗗缁堜繚鐣欙紱鍐呴儴鍥哄畾椤哄簭鏀逛负 `鍚煶璇嗗埆 / 鏂囨湰淇 / 闊抽鍚嚭鐨勬煶宸炶瘽鏂囨湰 / 鐗规畩鏍囩 / 闇€浜哄伐澶嶆牳 / 澶囨敞 / AI 杩斿洖鍘熷鍐呭`
  - 鍘?`Token 鐢ㄩ噺` 褰撳墠鏀规垚涓ゆ潯鍥哄畾闃舵淇℃伅锛歚鍚煶璇嗗埆`銆乣鏂囨湰淇`锛屾瘡鏉″彧鏄剧ず `妯″瀷 / 杈撳叆 / 杈撳嚭`锛屼笉鍐嶅睍绀?`鎬昏緭鍏?/ 鎬昏緭鍑?/ 鎬昏`
  - 褰撳墠娈佃瘑鍒垚鍔熴€佹棫缁撴灉澶辨晥銆佸垎娈靛缓璁敓鎴?澶辫触绛夌姸鎬佹彁绀哄綋鍓嶅悓姝ュ垏鍒版柊鐨勨€滆瘑鍒?/ 鍒嗘寤鸿鈥濆彛寰?  - `AI 杩斿洖鍘熷鍐呭` 褰撳墠琛ュ洖鎴愬姛鎬佸洖閫€锛氭病鏈変笓鐢?`debug/raw` 瀛楁鏃讹紝浼氱洿鎺ュ睍绀哄綋鍓嶇粨鏋滃璞＄殑瀹夊叏 JSON锛岄伩鍏嶅尯鍧楁爣棰樺瓨鍦ㄤ絾鍐呭涓虹┖
- 鏈疆鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `log.md`

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鎶?`搴旂敤褰撳墠寤鸿` 鐨勭洿鍐欎繚瀛橀摼璺啀鏀跺彛涓€杞細
  - 鏂版彃鍏ユ `unique_id` 褰撳墠鏀逛负 `crypto.getRandomValues + timestamp` 鐢熸垚
  - 鐩村啓鍓嶄細瀵规湰娆?`insert/update` 涓?`web_snapshot` 鍚勮嚜鍋氬幓閲嶉妫€
  - 濡傛灉鏈湴鏋勯€犲嚭鐨勪繚瀛樹綋閲屽嚭鐜伴噸澶?`unique_id`锛屼細鐩存帴鍋滄鑷姩搴旂敤骞朵繚鐣欏缓璁?  - 濡傛灉骞冲彴浠嶈繑鍥?`unique_id閲嶅`锛屽綋鍓嶄笉浼氬洖閫€ DOM 鐢绘锛屼細淇濈暀 preview 渚涗汉宸ュ鐞?- 涓棿 `AI 鍖篳 褰撳墠鏂板椤靛唴寮€鍏?`鐢熸垚鍚庤嚜鍔ㄥ簲鐢ㄥ綋鍓嶅缓璁甡锛岄粯璁ゅ紑鍚細
  - 鍙湁鐢ㄦ埛鎵嬪姩鐐瑰嚮 `鐢熸垚鐢绘寤鸿` 鍚庢墠浼氳Е鍙?  - 鑷姩搴旂敤鎴愬姛鍚庢部鐢ㄧ幇鏈夊埛鏂伴€昏緫
  - 鑷姩搴旂敤澶辫触鏃朵細淇濈暀褰撳墠 preview锛屼笉鑷姩鍒锋柊
- 鍙充晶鎸傝浇椤哄簭褰撳墠鍐嶈ˉ涓€灞傜ǔ瀹氬寲锛?  - 褰?`鏌冲窞璇濊剼鏈?Beta` 涓?`AI 鍖篳 鎵€鍦ㄥ瓧娈靛垎缁勯兘钀藉湪鍙充晶 `.label_title_border2` 鍐呮椂锛屽綋鍓嶅浐瀹氭妸 `Beta` 鍗℃帓鍦?`AI 鍖篳 涓婃柟
- 鏈疆钀界洏鑼冨洿锛?  - 閰嶇疆涓庤缃細`extension/shared/constants.js`銆乣extension/shared/storage.js`銆乣extension/options/options.html`銆乣extension/options/options.js`
  - 琛ュ厖鏍￠獙锛歚extension/shared/storage.data-baker-cvpc.test.js`銆乣extension/options/options-data-baker-cvpc-ai-ui.test.js`銆乣extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - 鏂囨。鍚屾锛歚extension/sites/data-baker-cvpc/liuzhou-helper/README.md`銆乣platform-resources/data-baker-cvpc/liuzhou-helper/README.md`銆乣docs/platforms-index.md`銆乣README.md`銆乣log.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/shared/constants.js`
  - `node --check extension/shared/storage.js`
  - `node --check extension/options/options.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `node --test extension/shared/storage.data-baker-cvpc.test.js`
  - `node --test extension/options/options-data-baker-cvpc-ai-ui.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`

## 2026-06-10锛圖ataBaker CVPC 鏌冲窞璇濋檮鍔犱俊鎭尯澶辫触鎬佷繚鐣欙級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠淇 `褰撳墠娈?AI 闄勫姞淇℃伅` 鍦ㄦ帹鑽愬け璐ユ椂鏁存琚竻绌虹殑闂锛?  - 闄勫姞淇℃伅鍖哄綋鍓嶉粯璁ゆ姌鍙犱絾濮嬬粓淇濈暀缁撴瀯
  - 鍥哄畾灞曠ず `闊抽鍚嚭鐨勬煶宸炶瘽鏂囨湰 / Token 鐢ㄩ噺 / 鐗规畩鏍囩 / 闇€浜哄伐澶嶆牳 / 澶囨敞 / AI 杩斿洖鍘熷鍐呭`
  - 瀛楁缂哄け鏃朵繚鎸佺┖鐧斤紝涓嶅啀鍥犱负鏌愰」缂哄€兼妸鏁存闄勫姞淇℃伅娓呯┖
- 鍚屾 `ai/recommend` 澶辫触鍝嶅簲浣擄細
  - 褰撳墠琛ラ綈 `rawResponse / debugRawJson / usage / models / timing / specialTags / needHumanReview / notes / audioDialectText`
  - 鍓嶇鍦ㄥ嚭鐜扳€滄ā鍨嬭緭鍑?JSON 瑙ｆ瀽澶辫触锛屽彲鏌ョ湅鍘熷 AI 杩斿洖鈥濇椂锛屽綋鍓嶅彲鐩存帴鍦ㄩ檮鍔犱俊鎭尯鏌ョ湅鑴辨晱鍚庣殑鍘熷杩斿洖
- 鏈疆鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `log.md`

## 2026-06-10锛圖ataBaker CVPC 鏌冲窞璇濇壒閲忓啓鍥炶鍒や簩娆?hotfix锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠缁х画鏀跺彛鎵归噺鍐欏洖璇垽锛?  - `鎵归噺璇嗗埆鐘舵€乣 褰撳墠鐩存帴鏄剧ず鍥哄畾骞跺彂 `5`
  - 鏈€缁堟枃鏈啓鍥炲墠锛屼笉鍐嶈姹?latest `annotation/annos` 鐨勫叏閲?`unique_id` 鍒楄〃涓庡惎鍔ㄥ揩鐓у畬鍏ㄤ竴鑷?  - 褰撳墠鏀逛负鍙鈥滄湰娆℃垚鍔熸鈥濆仛 latest rows 瀵归綈锛?    - 浼樺厛鎸夋垚鍔熸 `uniqueId`
    - 瀵逛笉涓婃椂鍥為€€鎸夐攣瀹氱殑 `selectionKey(start/end)` 杩戜技鍖归厤
  - 鍙鏈鎴愬姛娈甸兘鑳界ǔ瀹氬榻?latest rows锛屽氨鍏佽缁х画鏋勯€?`save_increment`
- 鏈疆鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - 璇存槑锛氭湰杞拡瀵规€у洖褰掑凡瑕嗙洊鎵归噺鍐欏洖涓庣姸鎬佸尯锛沗ui-panel.test.js`銆乣content.test.js` 浠嶆湁涓庢湰娆℃敼鍔ㄦ棤鍏崇殑鏃㈡湁澶辫触椤癸紝鏈湪鏈疆涓€骞跺鐞?
## 2026-06-10锛圖ataBaker CVPC 鏌冲窞璇濇壒閲忓啓鍥炶鍒や笌鎸夐挳鏍峰紡 hotfix锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠琛ヤ竴杞壒閲?v1 鐑慨锛?  - `鎵归噺璇嗗埆骞跺～鍏 鎸夐挳褰撳墠澶嶇敤 `褰撳墠娈?AI 鎺ㄨ崘` 鍚屾姗欒壊 accent 鏍峰紡
  - 鎵归噺鍐欏洖鍓嶄笉鍐嶉噸澶嶉噸鎶撴暣濂楃紪杈戝櫒涓婁笅鏂囷紱褰撳墠鍙牎楠?live `selectedEntryName`
  - 褰撳墠鏂囦欢鍚嶈瘑鍒細閬垮紑宸︿晶 `闊抽鍒楄〃` 鍐呯殑 `.mp3` 鏂囨湰锛屽噺灏戣鍒ゅ埌鍒楄〃椤瑰悗瑙﹀彂鈥滃綋鍓嶉〉闈㈠垎娈电姸鎬佸凡鍙樺寲鈥?- Network 鍙ｅ緞鍚屾婢勬竻锛?  - 鏃х増鎵归噺杩囩▼涓湅鍒扮殑澶氭潯鐩稿悓 `GET /httpapi/annotation/annos` 灞炰簬鐘舵€佽鍙栵紝涓嶆槸澶氭 `save_increment`
  - 鏍瑰洜鏄棫鐗堝娆¤皟鐢?`getEditorContext()`锛岃€岃鏂规硶鍐呴儴鏈韩涔熶細璇诲彇涓€娆℃渶鏂?`annotation/annos`
  - 褰撳墠鎵归噺閾捐矾宸叉敼涓哄鐢ㄥ惎鍔ㄦ椂閿佸畾鐨?context锛屽彧淇濈暀蹇呰鐨勬渶鏂?`annotation/annos` 鏍￠獙
- 鏈疆鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `docs/platforms-index.md`
  - `README.md`
  - `log.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `node --test extension/shared/concurrent-ai-request-stream.test.js`

## 2026-06-10锛圖ataBaker CVPC 鏌冲窞璇濇壒閲忚瘑鍒苟鑷姩濉叆 v1锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鏂板鈥滄壒閲忚瘑鍒苟鑷姩濉叆鈥濅富閾捐矾锛?  - 鍏ュ彛鎸傚埌涓棿 AI 鍖猴紝鑼冨洿杈撳叆鐣欑┖琛ㄧず褰撳墠闊抽鍏ㄩ儴娈?  - 鍥哄畾鏀寔 `2-4`銆乣2,3,5`銆乣2-4,7`锛屽悓鏃跺吋瀹?`~` 闂尯闂?  - 鍚姩鏃堕攣瀹氬綋鍓?`entry + audioUrl + annotation/annos` 蹇収锛屽彧澶勭悊褰撳墠闊抽
  - 鍓嶇鍥哄畾骞跺彂 `5`銆佸浐瀹氶敊宄?`50ms`锛屽厑璁?AI 缁撴灉涔卞簭杩斿洖
  - `鍋滄鎵归噺` 鍙樆姝㈡柊璇锋眰缁х画鍙戣捣锛屽凡鍦ㄩ€旇姹傚厑璁告敹灏?- 淇濆瓨閾捐矾褰撳墠鍚屾琛ラ綈鏂囨湰鐗?`save_increment` 鍐欏洖锛?  - `data-api.js` 褰撳墠鏂板 `getBatchSegments()` 鍜?`applyBatchTextRecommendations()`
  - 淇濆瓨鍓嶄細鍐嶆鎶撳彇鏈€鏂?`annotation/annos`
  - 鍙洿鏂版垚鍔熸鐨?`鏍囨敞鏂囨湰 / 鏅€氳瘽椤烘粦`
  - `insert / delete` 鍥哄畾涓虹┖锛宍web_snapshot` 浠嶅甫鍏ㄩ噺 instance rows + entry row
  - 浠绘剰 `entry` 鍙樺寲銆佹鏁板彉鍖栥€乣unique_id` 瀵逛笉涓婃垨缂哄皯閴存潈蹇収閮戒細 fail closed
- 闊抽瑁佸壀閾捐矾褰撳墠琛ユ垚鎵归噺鍙嬪ソ妯″紡锛?  - `ai-recommendation.js` 褰撳墠鏂板鍏变韩闊抽婧愪笌鏄惧紡娈垫帴鍙?  - 鍚屼竴闊抽鎵归噺杩囩▼涓彧涓嬭浇 / 瑙ｇ爜涓€娆★紝鍐嶆寜鍚勬 `startMs / endMs` 瑁佸壀 WAV
- 涓棿 AI 鍖哄綋鍓嶆柊澧炴壒閲?UI锛?  - 鑼冨洿杈撳叆妗?  - `鎵归噺璇嗗埆骞跺～鍏
  - `鍋滄鎵归噺`
  - `鎬绘暟 / 宸插彂璧?/ 杩涜涓?/ 宸叉垚鍔?/ 宸插け璐?/ 褰撳墠娈?/ 澶辫触娓呭崟`
- 鏈疆鍚屾鏇存柊锛?  - `extension/manifest.json`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `docs/platforms-index.md`
  - `README.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.test.js extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js extension/shared/concurrent-ai-request-stream.test.js`

## 2026-06-10锛圖ataBaker CVPC 鏌冲窞璇濃€滃簲鐢ㄥ綋鍓嶅缓璁€濅紭鍏堢洿鍐欏钩鍙颁繚瀛樻帴鍙ｏ級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鎶?`搴旂敤褰撳墠寤鸿` 鏀跺彛涓衡€滆姹傜洿鍐欎紭鍏堬紝澧為噺 DOM 鍥為€€鍏滃簳鈥濓細
  - `page-world/audio-observer.js` 褰撳墠鏂板 `annotation/*` 鏈€灏忛壌鏉冨ご妗ユ帴锛屽彧淇濈暀 `authorization / baker-terminal / baker-lang`
  - `data-api.js` 褰撳墠浼氬厛甯︽ˉ鎺ラ壌鏉冨ご閲嶆柊璇诲彇鏈€鏂?`annotation/annos`
  - 鐒跺悗鎸?preview 鏋勯€?`POST /httpapi/annotation/save_increment` 鎵€闇€鐨?`update / insert / web_snapshot`
  - 鐩村啓鎴愬姛鍚庯紝鏈寤鸿宸茬洿鎺ヨ繘鍏ュ钩鍙颁繚瀛橀摼璺紝鏃犻渶鍐嶇偣骞冲彴 `淇濆瓨`
- 鏈疆 hotfix 鍐嶈ˉ涓€澶勬祻瑙堝櫒鍏煎锛?  - `data-api.js` 褰撳墠浼氬厛鎶婅繍琛屾椂 `fetch` 缁戝畾鍥為〉闈?`window` 涓婁笅鏂?  - 淇鐐瑰嚮 `搴旂敤褰撳墠寤鸿` 鏃跺伓鍙戠殑 `Failed to execute 'fetch' on 'Window': Illegal invocation`
  - 褰撳墠浣犲湪 Network 閲岀湅鍒扮殑涓ゆ `GET /httpapi/annotation/annos` 灞炰簬棰勬湡锛?    - 绗?1 娆＄敤浜庡埛鏂板綋鍓嶇紪杈戝櫒涓婁笅鏂囦笌鐜版湁娈?    - 绗?2 娆＄敤浜庡湪鐪熸鍙戦€?`save_increment` 鍓嶈鍙栨渶鏂板垎娈垫暟鎹苟鏋勯€犱繚瀛樹綋
- 鍥為€€绛栫暐褰撳墠鏀剁揣涓猴細
  - 鍙湁澧為噺琛ュ垏 preview 鍦ㄧ洿鍐欏け璐ユ椂锛屾墠鍥為€€鍚屾簮 `xaudio` DOM 鐢绘
  - 鏁撮煶棰戦瑙堝綋鍓嶄笉浼氬湪鐩村啓澶辫触鍚庡啋闄╅噸鐢绘暣椤垫尝褰紝缁х画 fail closed
- 鎴愬姛鍚庣殑椤甸潰鏀跺彛褰撳墠鍐嶈ˉ涓€椤癸細
  - `搴旂敤褰撳墠寤鸿` 鎴愬姛鍚庝細鑷姩鍒锋柊褰撳墠缂栬緫椤?  - 杩欐牱鏃犺鏈璧扮殑鏄钩鍙?`save_increment` 鐩村啓锛岃繕鏄閲?DOM 鐢绘鍥為€€锛岄兘鑳界珛鍗冲洖鍒版渶鏂伴〉闈㈢姸鎬?- UI 涓庢枃妗ｅ彛寰勫悓姝ユ洿鏂帮細
  - 褰撳墠鐘舵€佹枃妗堟敼涓烘寜瀹為檯搴旂敤缁撴灉鎻愮ず鈥滃凡閫氳繃骞冲彴淇濆瓨鎺ュ彛搴旂敤褰撳墠寤鸿鈥濇垨淇濈暀 DOM 搴旂敤鍚庣殑浜哄伐淇濆瓨鎻愮ず
  - 鏁撮煶棰戦瑙堣鏄庡綋鍓嶆槑纭负鈥滃厛灏濊瘯鐩村啓淇濆瓨鎺ュ彛锛屽け璐ヤ笉鍥為€€椤甸潰鍐呯敾娈碘€?- 鏈疆鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/page-world/audio-observer.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/page-world/audio-observer.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/backend/README.md`
  - `README.md`
  - `docs/platforms-index.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/page-world/audio-observer.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/page-world/audio-observer.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`

## 2026-06-10锛圖ataBaker CVPC 鏌冲窞璇濈敾娈靛垏鎹负鍚庣 Python 鏁撮煶棰戦瑙堬級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鎶?`鐢熸垚鐢绘寤鸿` 涓婚摼璺粠鈥滃墠绔湰鍦伴潤闊虫娴嬧€濆垏鍒扳€滃悗绔洿鎺ユ暣闊抽鍒嗘瀽鈥濓細
  - 鍓嶇璇锋眰浣撳綋鍓嶅彧鍙戦€?`audioUrl` 涓庨潤闊抽槇鍊艰鍒?  - `segment/preview` 褰撳墠鍦ㄥ悗绔洿鎺ヤ笅杞?mp3锛屽苟璋冪敤 Python `miniaudio` 瑙ｇ爜
  - 鍚庣鍥哄畾鎸?`30ms` 绐楀彛銆佽交閲忓钩婊戙€乣<=0.18s` 鐭皷宄版ˉ鎺ャ€乣闈欓煶 >= 0.4s`銆佸墠鍚庤ˉ `0.1s` 鐢熸垚鏁存潯闊抽 `proposedSegments`
- 鍓嶇 `segmentation-controller` 褰撳墠绉婚櫎浜嗘湰鍦?`AudioContext` 闈欓煶鍒嗘瀽锛?  - 涓嶅啀涓婁紶 `silentRanges`
  - 涓嶅啀渚濊禆娴忚鍣ㄦ湰鍦伴煶棰戣В鐮佽兘鍔?  - preview 褰撳墠浼氱洿鎺ュ洖鏄惧悗绔繑鍥炵殑 `analysisMeta`
- UI 褰撳墠鍚屾鍒囨崲鍒板悗绔彛寰勶細
  - 鏁撮煶棰戦瑙堟爣棰樻敼涓衡€滃悗绔暣闊抽閲嶅垏棰勮鈥?  - 璇婃柇鏂囨鏀逛负鈥滃悗绔潤闊虫娴嬧€?  - 鏃?sourceSegments 鏃讹紝浼氱洿鎺ユ樉绀衡€滃綋鍓嶆ā寮忥細鍚庣鏁撮煶棰戝垎娈碘€?- `搴旂敤褰撳墠寤鸿` 褰撳墠缁х画 fail closed锛?  - 鍚庣鏁撮煶棰戦瑙堝浐瀹?`applyAllowed=false`
  - 褰撳墠涓嶈嚜鍔ㄩ噸鐢绘暣椤垫尝褰紝鍙緵浜哄伐鍙傝€?- 鍏变韩 Python 渚濊禆褰撳墠琛ュ厖锛?  - `platform-resources/backend/ai/python/requirements.txt` 鏂板 `miniaudio`

## 2026-06-10锛圖ataBaker CVPC 鏌冲窞璇濈敾娈电┖缁撴灉鏈湴鍏滃簳棰勮锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鎶婄敾娈甸瑙堥摼璺ˉ鎴愨€滀袱娈靛紡鏈湴鍏滃簳鈥濓細
  - 鍏堟寜鍘熻鍒欒姹?`existing-segments-incremental`
  - 濡傛灉鏈湴闈欓煶妫€娴嬪凡鍛戒腑鍊欓€夐潤闊炽€佷絾澧為噺琛ュ垏浠嶄负绌猴紝鍐嶈嚜鍔ㄨ拷鍔?`whole-audio-rebuild-preview`
  - 绗簩娆＄粨鏋滃綋鍓嶅彧浣滀负鏁存潯闊抽閲嶅垏棰勮锛屼笉鐩存帴鍙備笌椤甸潰鑷姩鐢绘
- `segment/preview` 褰撳墠琛ラ綈涓ょ scope 涓庢洿鏄庣‘鐨勮繑鍥?meta锛?  - `segmentScope = existing-segments-incremental | whole-audio-rebuild-preview`
  - `meta.previewMode = incremental | whole-audio-fallback`
  - `meta.applyAllowed`
  - `meta.emptyReason = no-silence | no-internal-hit | insufficient-split`
- 鍓嶇 AI 鍖哄綋鍓嶆柊澧?fallback 涓撳睘灞曠ず锛?  - 鍥哄畾鎻愮ず鈥滃綋鍓嶅閲忚ˉ鍒囨湭鍛戒腑锛屼互涓嬩负鏁存潯闊抽閲嶅垏棰勮鈥?  - 鍥哄畾鎻愮ず鈥滆缁撴灉浠呬緵棰勮锛屾殏涓嶆敮鎸佷竴閿簲鐢ㄢ€?  - 鍚屾椂灞曠ず鍘熺幇鏈夋鏁伴噺銆乫allback 寤鸿娈垫暟閲忎笌鏈湴闈欓煶妫€娴嬫憳瑕?- `搴旂敤褰撳墠寤鸿` 褰撳墠鏂板鍙淇濇姢锛?  - 浠讳綍 `applyAllowed=false` 鐨勯瑙堥兘浼氱洿鎺ユ嫆缁濆簲鐢?  - 鏁存潯闊抽 fallback 棰勮涓嶄細璇Е鍙戞暣椤垫尝褰㈤噸鐢?- 鏈疆鍚屾鏇存柊锛?  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/segment-service.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/segment-service.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/segmentation-controller.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/segmentation-controller.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `README.md`
  - `docs/platforms-index.md`

## 2026-06-10锛圖ataBaker CVPC 鏌冲窞璇濈敾娈垫湰鍦伴潤闊虫娴嬫姉鍣寮猴級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠浼樺寲浜嗘祻瑙堝櫒绔?`鐢熸垚鐢绘寤鸿` 鐨勬湰鍦伴潤闊虫娴嬶細
  - 浠嶄繚鎸?`30ms` 绐楀彛銆乣闈欓煶 >=0.4s`銆侀粯璁?`-27 dB`
  - 闈欓煶鍒嗘瀽褰撳墠鏀逛负澶氬０閬撹兘閲忔眹鎬伙紝涓嶅啀鍙湅鍗曞０閬?  - 鏂板杞婚噺骞虫粦锛屽苟鑷姩妗ユ帴 `<=0.18s` 鐨勭煭灏栧嘲鎵撴柇锛岄伩鍏嶈繎闈欓煶琚灛鎬佸櫔澹板垏纰?  - 闈欓煶鍊欓€夎竟鐣屽綋鍓嶄細鍥炶ˉ鍘熷闈欓煶甯э紝閬垮厤骞虫粦鍚庢妸鍒氬ソ `0.4s` 鐨勯潤闊崇缉娌?- 鐢绘寤鸿绌虹姸鎬佸綋鍓嶈ˉ鍏呬簡鏈湴璇婃柇鎻愮ず锛?  - 鏈湴鏈鍑烘弧瓒虫潯浠剁殑杩炵画闈欓煶
  - 宸叉鍑哄€欓€夐潤闊筹紝浣嗘湭鍛戒腑鐜版湁娈靛唴閮ㄦ垨鎷嗗垎鍚庝粛涓嶈冻 2 娈?- 鏈疆鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/segmentation-controller.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/segmentation-controller.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `README.md`
  - `docs/platforms-index.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/segmentation-controller.js`
  - `node --check extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/segmentation-controller.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`

## 2026-06-10锛圖ataBaker CVPC 鏌冲窞璇?listen Prompt 绮剧畝涓虹函鍚煶锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鎶?`褰撳墠娈?AI 鎺ㄨ崘` 鐨?`listen` 闃舵鏀跺彛涓虹函鍚煶锛?  - 鍚庣榛樿 prompt 褰撳墠鍙姹傝緭鍑?`audioDialectText / specialTags / needHumanReview / notes`
  - 榛樿涓嶅啀娉ㄥ叆 `椤圭洰瑙勫垯鎽樿`
  - 榛樿涓嶅啀娉ㄥ叆 `segment.startMs / endMs / durationMs`
  - 榛樿涓嶅啀娉ㄥ叆椤甸潰瀛楁涓婁笅鏂囧拰 `selectedEntry`
- 褰撳墠鏂板鎸佷箙閰嶇疆 `aiRecommendListenIncludeLexiconReference`锛?  - options `AI 璁剧疆 -> 鍚煶` 鏂板 `闄勫甫璇嶈〃鍙傝€冿紙鍚煶杈呭姪锛塦
  - 榛樿鍊煎浐瀹氫负 `false`
  - 鍙湁鏄惧紡寮€鍚悗锛宍listen` 璇锋眰鎵嶄細闄勫甫璇嶈〃鍙傝€冪墖娈?- API 濂戠害鍚屾鏇存柊锛?  - `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/defaults`
  - `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/health`
  - `POST /api/data-baker-cvpc/liuzhou-helper/ai/recommend`
  - 褰撳墠閮藉凡绾冲叆 `defaults.stages.listen.includeLexiconReference` / `aiStages.listen.includeLexiconReference`
- 鏈疆鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `extension/options/options.js`
  - `extension/shared/constants.js`
  - `extension/shared/storage.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`
- 鏈疆楠岃瘉锛?  - `node --test platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.test.js`
  - `node --test extension/shared/storage.data-baker-cvpc.test.js`
  - `node --test extension/options/options-data-baker-cvpc-ai-ui.test.js`

## 2026-06-10锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈ˉ榻愮敾娈靛缓璁柊瑙勫垯涓庨〉闈㈠唴搴旂敤锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠瀹屾垚涓ら」鏀跺彛锛?  - `鐢熸垚鐢绘寤鸿` 鏀规垚鈥滄祻瑙堝櫒绔潤闊虫娴?+ 鍚庣澧為噺琛ュ垏棰勮鈥濓細
    - 鍓嶇鍥哄畾鎸?`30ms` 绐楀彛鍋?RMS -> dB
    - 杩炵画 `0.4s` 浣庝簬闃堝€艰涓洪潤闊?    - 榛樿闃堝€兼敼涓?`-27 dB`锛屽苟鏂板 options `鍩虹璁剧疆 -> 闈欓煶闃堝€糮锛涢粯璁ゅ崟浣?`dB`锛屽悓鏃舵敮鎸?`% / Val` 鎹㈢畻鏄剧ず涓庝繚瀛?    - 鍚庣鍙鈥滅幇鏈夋鍐呴儴鍛戒腑鐨勯潤闊斥€濈敓鎴?`changes + proposedSegments`锛屽浐瀹氬墠鍚庤ˉ `0.1s`
  - `搴旂敤褰撳墠寤鸿` 褰撳墠宸茶兘杩涘叆鍚屾簮 `xaudio` iframe锛屾寜 live region / handle / 鍘熺敓 `寮€鍚媶鍒哷 浜や簰鎶婂缓璁鐢诲洖褰撳墠娉㈠舰鐘舵€?- 褰撳墠搴旂敤杈圭晫锛?  - 鍙啓椤甸潰褰撳墠娉㈠舰鐘舵€?  - 涓嶇洿杩?`save_increment`
  - 涓嶈嚜鍔ㄧ偣鍑诲钩鍙?`淇濆瓨`
  - 搴旂敤瀹屾垚鍚庝粛闇€浜哄伐澶嶆牳骞舵墜鍔ㄤ繚瀛?- 褰撳墠棰勮澶辨晥淇濇姢鍚屾琛ラ綈锛?  - 褰撳墠闊抽鍒囨崲
  - 褰撳墠娈甸€夋嫨鍙樺寲
  - 鍐嶆鐢熸垚鏂板缓璁?  - live region 鏁伴噺鎴栬竟鐣屼笌鏃?preview 涓嶅啀涓€鑷?- 鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/backend/README.md`
  - `README.md`
  - `docs/platforms-index.md`

## 2026-06-09锛堢郴缁熺鐞嗙粺涓€鍒囨崲涓夊鍚庣鍦板潃锛?
- 鎵╁睍鍓嶇褰撳墠鎶婅繍琛屾椂鍚庣鍦板潃缁熶竴鏀跺彛鍒?`settings.meta.backendBaseUrls`锛?  - `server`
  - `local`
  - `beta`
- 绯荤粺绠＄悊 `鍚庣璁剧疆` 褰撳墠鏀逛负涓夊鏍瑰湴鍧€杈撳叆 + 褰撳墠妯″紡鍒囨崲锛?  - `server/local` 濮嬬粓鏄剧ず
  - `beta` 鍦板潃涓庢ā寮忕户缁彈 beta 瑙ｉ攣鎺у埗
  - 淇濆瓨鍚庡綋鍓嶉〉鎽樿銆佺鐞嗛〉璇锋眰涓庡叕寮€涓嬭浇涓績鍏ュ彛閮戒細绔嬪嵆璺熼殢褰撳墠妯″紡鍒锋柊
- 鍏变韩甯搁噺涓庡瓨鍌ㄥ眰褰撳墠鏂板缁熶竴 resolver锛?  - `getBackendBaseUrlsFromSettings`
  - `getBackendBaseUrlByMode`
  - `getBackendBaseUrlFromSettings`
  - `buildBackendUrl`
  - `buildDownloadUrl`
- 杩愯鏃跺綋鍓嶇Щ闄?Aishell 鏃х殑鈥滄湰鏈哄け璐ュ悗鑷姩鍥為€€鏈嶅姟鍣ㄢ€濋€昏緫锛涙墍鏈夎剼鏈姹傛敼涓哄彧璧板綋鍓嶆ā寮忓搴旀牴鍦板潃锛屽け璐ユ椂鐩存帴鎶ュ綋鍓嶆ā寮忓け璐ャ€?- `extension/manifest.json` 褰撳墠鏀惧 `host_permissions` 鍒伴€氱敤 `http://*/*` 涓?`https://*/*`锛岀敤浜庢敮鎸佷换鎰?IP / 鍩熷悕浣滀负杩愯鏃跺彲閰嶇疆鍚庣銆?
## 2026-06-09锛堜笟鍔¤瘝琛ㄥ垏鎹负 JSON 涓昏瘝琛ㄥ崗浣滄ā寮忥級

- 椤圭洰绾ц鍒欏綋鍓嶆柊澧炩€滀笟鍔¤瘝琛ㄦ不鐞嗚鍒欌€濓細
  - 褰撳墠绾冲叆缁熶竴娌荤悊鐨?5 浠戒笟鍔¤瘝琛ㄤ富鏍煎紡鍥哄畾涓?`JSON`
  - `CSV / XLSX` 鍙繚鐣欎负鍙傝€冩簮銆佸師濮嬫潵婧愭垨瀵煎叆鏉ユ簮
  - 澶勭悊鈥滃瓧璇嶈〃 / 璇嶈〃 / lexicon鈥濅换鍔℃椂锛岄粯璁ゅ厛杈撳嚭浜ょ粰澶栭儴 AI 鐨勮瘝琛ㄥ鐞?Prompt
  - Codex 榛樿鍙礋璐ｈ瘝琛?schema銆佹牎楠屻€佷唬鐮佹帴鍏ャ€佹祴璇曚笌鏂囨。鍚屾锛屼笉鐩存帴缁存姢璇嶆潯鍐呭
- 鏂板缁熶竴鏂囨。锛歚docs/workflow/lexicon-json-workflow.md`
  - 鍥哄畾浜嗚瘝琛?JSON 椤跺眰瀛楁銆乪ntry 瀛楁銆佹竻娲楃害鏉熷拰 Prompt 妯℃澘
- 鏂板缁熶竴鏍￠獙鍣細`platform-resources/backend/business-lexicon.js`
  - 璐熻矗涓氬姟璇嶈〃 JSON 鐨勮鍙栥€佸瓧娈垫牎楠屻€佸綊涓€鍖栧拰閿欒鐘舵€佽緭鍑?- 杩愯鏃朵唬鐮佸綋鍓嶅凡鎺ュ叆 JSON 涓昏瘝琛ㄨ矾寰勶細
  - `platform-resources/data-baker/round-one-quality/backend/reference/minnan-lexicon.json`
  - `platform-resources/aishell-tech/minnan-helper/backend/reference/minnan-lexicon.json`
  - `platform-resources/magic-data/hakka-helper/backend/lexicon/hakka-lexicon.json`
  - `platform-resources/magic-data/minnan-helper/backend/lexicon/minnan-lexicon.json`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-lexicon.json`
- 褰撳墠鍒囨崲绛栫暐锛?  - JSON 缂哄け鎴栭潪娉曟椂锛岃繍琛屾椂鏄庣‘杩斿洖 `missing / invalid / parse_error` 涔嬬被鐘舵€?  - 涓嶅啀闈欓粯鎶婂弬鑰冩簮 CSV 褰撲綔涓氬姟涓昏鍙栨簮
  - 鍙傝€冩簮 CSV 浠嶄繚鐣欑粰浜哄伐鏁寸悊銆佸鍏ュ拰澶栭儴 AI 澶勭悊
- 鏈疆琛ュ厖鏀跺彛锛?  - 璇嶈〃澶勭悊 Prompt 鏀规垚鈥滃崟浠借瘝琛ㄩ€愪釜浜ょ粰缃戦〉绔?AI鈥濆彛寰勶紝涓嶅啀鍋囪涓€娆″鐞嗘暣浠撹瘝琛?  - 濡傛灉涓氬姟璇嶈〃 JSON 缂哄け浣嗘湰鍦板弬鑰?CSV 浠嶅瓨鍦紝杩愯鏃剁户缁寜鏃犺瘝琛ㄦā寮忔甯歌繑鍥烇紱鍓嶇鏀逛负鍦ㄩ〉闈㈠彸涓嬭寮瑰嚭涓€娆♀€滄病鏈夊瓧璇嶅搴旇〃鈥濇彁绀猴紝鍋滅暀绾?1 绉掑悗鑷姩娑堝け
  - 濡傛灉鏈湴杩炲弬鑰?CSV 涔熶笉瀛樺湪锛屽垯涓嶉澶栬鍛?- 鏈疆鍚屾鏇存柊锛?  - `AGENTS.md`
  - `README.md`
  - `docs/README.md`
  - `docs/platforms-index.md`
  - 鍚勫钩鍙拌瘝琛ㄧ浉鍏?README 鍙ｅ緞
- 鏈疆楠岃瘉锛?  - 鏂板 `platform-resources/backend/business-lexicon.test.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js`

## 2026-06-09锛堝悗绔笅杞戒腑蹇冩敮鎸?ASC_DOWNLOAD_BASE_URL锛?
- 缁熶竴鍚庣 `admin-download-center` 涓?`admin-dashboard` 褰撳墠鏂板 `ASC_DOWNLOAD_BASE_URL` 鏀寔锛?  - `GET /api/admin/download-center/releases` 鐜板湪浼氫紭鍏堟寜璇ョ幆澧冨彉閲忔帹瀵?`crx-latest.json` 涓?`/downloads/` 鐩綍鍦板潃銆?  - 绯荤粺绠＄悊鎬昏涓殑 `downloads.scriptCenterUrl` 涔熸敼涓轰紭鍏堝洖鏄捐鐜鍙橀噺銆?- 璇ヨ兘鍔涚敤浜庘€滃悓涓€浠戒唬鐮併€佸濂椾笅杞藉叆鍙ｂ€濆満鏅紝渚嬪鐩存帴鐢ㄦ湇鍔″櫒 IP 鏆撮湶 `/downloads/` 鏃讹紝涓嶅啀闇€瑕佹妸鍚庣杩斿洖鐨勪笅杞?URL 鍥哄畾鍐欐鍒颁富鍩熷悕銆?
## 2026-06-09锛圓I 璇锋眰璁板綍 beta 鍙岄噸闅愯棌銆佹棩鏈熺暀绌哄鍑哄叏閮ㄣ€侀檮鍔犱俊鎭睍绀?token锛?
- `AI 璇锋眰璁板綍` 褰撳墠鍐嶈ˉ涓夐」鏀跺彛锛?  - options 鍓嶇鐜板湪浼氬啀娆℃寜鏁版嵁闆?`visibility=beta` 鍋氭湰鍦拌繃婊わ紱鍗充娇鍚庣璇繑鍥?beta 鏁版嵁闆嗭紝鏈В閿?beta 鐨勫墠绔篃涓嶄細娓叉煋鍑烘潵
  - 寮€濮?/ 缁撴潫鏃ユ湡榛樿鏀逛负鐣欑┖锛屼笉鍐嶈嚜鍔ㄥ洖濉渶灏?鏈€澶ф棩鏈燂紱鐣欑┖灏辫〃绀哄鍑鸿鑴氭湰褰撳墠鍏ㄩ儴鏃ユ湡鑼冨洿
  - `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 鐨?`褰撳墠娈?AI 闄勫姞淇℃伅` 褰撳墠鏂板 token 灞曠ず锛屽寘鍚€昏緭鍏?/ 鎬昏緭鍑?/ 鎬?token锛屼互鍙?`listen / refine` 鍒嗛樁娈?token
- `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js` 褰撳墠琛ラ綈鎴愬姛鍝嶅簲閲岀殑 `usage`锛岃鍓嶇闄勫姞淇℃伅鍙洿鎺ヨ鍙?- 鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/backend/README.md`

## 2026-06-09锛圓I 璇锋眰璁板綍琛?token 姹囨€诲苟闅愯棌鏈В閿?beta 鏁版嵁闆嗭級

- `AI 璇锋眰璁板綍` 瀵煎嚭閾捐矾褰撳墠琛ヤ袱椤规敹鍙ｏ細
  - 鍏变韩鏃ュ織鑴辨晱灞傜幇鍦ㄤ繚鐣?usage 涓殑 `promptTokens / completionTokens / totalTokens` 绛夎璐瑰瓧娈碉紝涓嶅啀鎶婂畠浠鍒ゆ垚鏁忔劅 token 鎵撴垚 `<redacted>`
  - 鍏变韩 CSV 瀵煎嚭鍒楃幇鍦ㄦ敮鎸佽仛鍚堝闃舵 usage锛涘儚 `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 鐨?`listen + refine` 涓ら樁娈?token 浼氳嚜鍔ㄦ眹鎬诲埌 `杈撳叆Token / 杈撳嚭Token / 鎬籘oken`
- `AI 璇锋眰璁板綍鑴氭湰绫诲瀷` 褰撳墠澧炲姞 beta 鍙鎬ц繃婊わ細
  - `DataBaker CVPC 鏌冲窞璇濆姪鎵?AI 璋冪敤璁板綍` 鏍囪涓?beta 鏁版嵁闆?  - `GET /api/admin/ai-call-log/options` 榛樿涓嶈繑鍥炶椤?  - 鍙湁 options 鍓嶇鍦?beta 宸茶В閿佺姸鎬佷笅鏄惧紡鎼哄甫 `includeBeta=1` 鏃讹紝绯荤粺绠＄悊閲屾墠浼氭樉绀鸿鏁版嵁闆?- 鍚屾鏇存柊锛?  - `platform-resources/backend/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`

## 2026-06-09锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈ˉ鍏呭瓧娈靛～鍏ュ揩鎹烽敭骞舵敹绱ф帶鍒跺彴瑙傚療锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠琛ヤ袱涓彲褰曞埗蹇嵎閿姩浣滐紝榛樿閿綅浠嶄负绌猴細
  - `濉叆鏍囨敞鏂囨湰`
  - `濉叆鏅€氳瘽椤烘粦`
- 杩愯鏃?`content.js` 褰撳墠鎶婅繖涓や釜鍔ㄤ綔鍒嗗埆鏀跺彛鍒帮細
  - `refinedDialectText -> 鏍囨敞鏂囨湰`
  - `refinedMandarinText -> 鏅€氳瘽椤烘粦`
- `page-world/audio-observer.js` 褰撳墠鏀剁揣 console 瑙傚療杈圭晫锛?  - 椤跺眰 `/app/editor/asr/` 涓嶅啀鍖呰 `console.log/info/debug`
  - 鍚屾簮 `xaudio` iframe 浠嶄繚鐣?console 闊抽 URL 鎹曡幏
  - 杩欐牱鍙互閬垮厤椤甸潰鑷韩璇稿鈥滀笂浼犲凡鍙栨秷鈥濃€滆杈撳叆 5 澶勭悊涓?..鈥濅箣绫绘櫘閫氭棩蹇楁妸鎵╁睍鑴氭湰鍫嗘爤甯﹀嚭鏉?- 鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`

## 2026-06-09锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈帴鍏?AI 鏃ュ織涓庡弻鏂囨湰鏀跺彛锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠瀹屾垚涓€杞渶灏忔敹鍙ｏ細
  - 椤靛唴瑙傚療妗?`page-world/audio-observer.js` 褰撳墠鏂板 `GET /httpapi/user/meta` 鐩戝惉锛屽彧杞彂鑴辨晱鍚庣殑 `name / user_id`锛沗data-api.js` 浼氫紭鍏堟秷璐规ˉ鎺ュ揩鐓э紝鏈懡涓椂鍐嶅悓婧愮洿杩?`user/meta`锛屽苟鎶?`platformUserName / platformUserId / platformUserMetaSource` 娉ㄥ叆缂栬緫鍣ㄤ笂涓嬫枃銆?  - 鍓嶇 `ai-recommendation.js` 褰撳墠瀵归綈鍏变韩 `ai-usage-meta` 璇箟锛氳姹傚墠蹇呴』鏍￠獙 options 棣栭〉 `AI 璋冪敤浣跨敤浜篳锛屽苟鎶?`aiUsageOperatorName / platformUserName / platformUserId` 涓€璧峰彂缁欑幇鏈?`POST /api/data-baker-cvpc/liuzhou-helper/ai/recommend`銆?  - `ui-panel.js` 褰撳墠鏀逛负鍙湪瀛楁鍖烘樉绀轰袱寮犳渶缁堢粨鏋滃崱锛?    - `淇鍚庣殑鏌冲窞璇濇枃鏈琡 -> `濉叆鏍囨敞鏂囨湰`
    - `鏁寸悊鍚庣殑鏅€氳瘽鏂囨湰` -> `濉叆鏅€氳瘽椤烘粦`
  - 鍘熷鍚煶缁撴灉褰撳墠缁熶竴绉诲叆榛樿鎶樺彔鐨?`褰撳墠娈?AI 闄勫姞淇℃伅`锛屾爣棰樺浐瀹氫负 `闊抽鍚嚭鐨勬煶宸炶瘽鏂囨湰`锛沗鐗规畩鏍囩 / 闇€浜哄伐澶嶆牳 / 澶囨敞 / AI 杩斿洖鍘熷鍐呭` 淇濇寔涓嶅彉銆?- 鍚庣 `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js` 褰撳墠淇濈暀 `listen / refine` 涓ら樁娈靛懡鍚嶏紝浣嗚涔夋敼涓猴細
  - `listen` 鍙緭鍑哄師濮?`audioDialectText`
  - `refine` 鍏堝熀浜?`liuzhou-pronunciation-reference.csv` 鐨?`鏌冲窞瀛楄浆鍐欑敤瀛?-> 閲婁箟` 鍋氭渶闀垮尮閰嶆櫘閫氳瘽鑽夌锛屽啀涓€娆℃€ц緭鍑?`refinedDialectText + refinedMandarinText`
  - 鎴愬姛鍝嶅簲褰撳墠鏂板 `refinedMandarinText`锛沗mandarinText` 鎸囧悜瀹冿紱`audioMandarinText` 涓存椂鍥炲～涓?`refinedMandarinText` 鍏煎鏃ц皟鐢ㄧ偣
- 褰撳墠 AI 璋冪敤宸叉帴鍏ュ叡浜?CSV 璁板綍涓庣郴缁熺鐞嗗鍑猴細
  - 鏂板 `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-call-log.js`
  - `platform-resources/backend/ai-call-log-download/routes.js` 褰撳墠鏂板鏁版嵁闆?`data-baker-cvpc-liuzhou-helper-ai`
  - 瀵煎嚭鍒楁柊澧?`projectId / taskId / processId / dataId / jobId / fileName / entryIndex / selectionKey / segmentStartMs / segmentEndMs / listenModel / refineModel`
- 鍚屾鏇存柊锛?  - `README.md`
  - `docs/platforms-index.md`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`

## 2026-06-09锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈簩娆＄晫闈紭鍖栵級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠缁х画浼樺寲琛ㄥ崟鍖哄眰绾т笌瑙嗚锛?  - `鏌冲窞璇濊剼鏈?AI 鍖篳 褰撳墠浼樺厛鎸傚埌瀛楁鐖跺鍣?`div[data-v-fd55b986]`锛屼綔涓轰笌鍚勪釜 `padding-left: 10px` 瀛楁鍧楀悓绾х殑鐙珛鍖哄潡锛屼笉鍐嶄綔涓哄瓧娈靛唴閮ㄥ瓙鑺傜偣銆?  - 鍙充晶 `鍏ㄥ眬鏍囨敞` 闊抽鎽樿褰撳墠鏀逛负閫愯鏄剧ず `鏂囦欢 / 鏉ユ簮 / 褰撳墠绗?N 娈?/ 褰撳墠娈垫椂闂碻锛屼笉鍐嶄娇鐢ㄥ垎鍙锋嫾鎺ラ暱鍙ャ€?  - 涓夊紶瀛楁鍐呯粨鏋滃崱褰撳墠鍦ㄦ棤鎺ㄨ崘缁撴灉鏃朵笉鏄剧ず浠讳綍鍗犱綅鏂囨锛涙湁缁撴灉鏃舵敼鎴愨€滄枃鏈乏銆佹寜閽彸鈥濈殑绱у噾甯冨眬銆?  - 鏍峰紡褰撳墠缁熶竴鏀逛负绯荤粺钃濅富璋冿細鏍囬銆侀摼鎺ャ€侀噸鐐瑰€笺€佽竟妗嗗拰鎸夐挳 hover 閮藉悜钃濊壊鏀跺彛锛屼笉鍐嶄繚鐣欐槑鏄剧殑鐏扮櫧寮辨彁绀烘劅銆?  - 鏈疆缁х画琛?UI 缁嗚妭锛歚鏈～鍐欒ˉ Valid / 搴旂敤褰撳墠寤鸿` 涓や釜娆℃寜閽綋鍓嶆敼鎴愭鑹插己璋冿紝瀛楁鍐?AI 缁撴灉鍗¤繘涓€姝ュ己鍖栬摑鑹插崱鐗囨牱寮忥紱`褰撳墠娈?AI 闄勫姞淇℃伅` 褰撳墠榛樿鎶樺彔锛屽苟鏂板 `AI 杩斿洖鍘熷鍐呭` 鐨勫畬鏁?JSON 灞曠ず銆?  - 鍚庣画璺熻繘琛ヤ簡鎸夐挳鍙鎬ч棶棰橈細`褰撳墠娈?AI 鎺ㄨ崘 / 鐢熸垚鐢绘寤鸿` 褰撳墠涔熸敼鎴愪笌 `鏈～鍐欒ˉ Valid` 鐩稿悓鐨勬鑹叉寜閽牱寮忥紝閬垮厤钃濊壊涓绘寜閽湪椤甸潰閲岀户缁彂鐧姐€?  - 鍚庣画璺熻繘琛ヤ簡鎸夐挳鍙鎬ч棶棰橈細涓婅堪涓や釜娆℃寜閽綋鍓嶈繘涓€姝ユ敼鎴愭鑹插疄搴?background锛岄伩鍏嶅彧鏀硅竟妗嗗拰鏂囧瓧鑹蹭粛鐒朵笉澶熼啋鐩€?
## 2026-06-09锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈晫闈㈤噸鎺掑埌瀛楁鍐呯粨鏋滃崱锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠杩涗竴姝ユ敹鍙ｉ〉闈㈢粨鏋勶細
  - 鍙充晶 `鍏ㄥ眬鏍囨敞` 杩炵画淇℃伅鍖虹户缁彧淇濈暀鐘舵€佸拰闊抽鎽樿锛屼絾鎽樿鏂囨鏂板鈥滃綋鍓嶇 N 娈碘€濄€?  - `鏄惁鏈夋晥锛圴alid or Not锛塦 涓嬫柟褰撳墠鏀逛负鐙珛鍚岀骇 `AI 鍖篳锛岄泦涓壙杞?`褰撳墠娈?AI 鎺ㄨ崘 / 鏈～鍐欒ˉ Valid / 鐢熸垚鐢绘寤鸿 / 搴旂敤褰撳墠寤鸿`銆佺敾娈靛缓璁粨鏋滀互鍙?`鐗规畩鏍囩 / 闇€浜哄伐澶嶆牳 / 澶囨敞`銆?  - 涓夊紶 AI 缁撴灉鍗′笉鍐嶆寕鍦ㄧ粺涓€缁撴灉鍖猴紝褰撳墠鏀逛负鎸夊瓧娈靛綊浣嶏細
    - `闊抽鐨勬煶宸炶瘽鏂囨湰`銆乣淇鍚庣殑鏌冲窞璇濇枃鏈琡 鍥炲埌 `鏍囨敞鏂囨湰` 瀛楁鍧楀唴
    - `闊抽鐨勬櫘閫氳瘽鏂囨湰` 鍥炲埌 `鏅€氳瘽椤烘粦` 瀛楁鍧楀唴
- `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js` 褰撳墠鏂板绋冲畾鐨?`currentSegmentNumber` 涓婁笅鏂囧瓧娈碉紝浼樺厛鎸夊乏渚у凡閫夋缂栧彿鎺ㄥ褰撳墠娈靛彿锛屼緵鍙充晶鎽樿鍖虹洿鎺ユ秷璐广€?- `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js` 褰撳墠鍚屾閲嶆帓鎸傝浇灞傜骇涓庡瓧娈靛唴缁撴灉鍗℃覆鏌撻€昏緫锛屽苟琛ュ搴斿崟娴嬨€?
## 2026-06-09锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈Щ闄?Fun-ASR 涓?Clip-Cache锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠娈佃瘑鍒摼璺綋鍓嶇粺涓€鏀跺彛涓?`audioDataUrl`锛?  - 鍓嶇 `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.js` 姣忔鐐瑰嚮 `褰撳墠娈?AI 鎺ㄨ崘` 閮戒細閲嶆柊瑁佸壀褰撳墠娈碉紝鐢熸垚 `16k` 鍗曞０閬?WAV锛屽苟鐩存帴鎶?Base64 `audioDataUrl` 鍙戠粰 `ai/recommend`銆?  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js` 涓庡叡浜父閲忓綋鍓嶅垹闄や簡 `clip-cache/upload` 鐨勮繍琛屾椂閰嶇疆鍜岄仐鐣欏紩鐢ㄣ€?  - 鍚庣 `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js` 缁х画鍏煎 `audioDataUrl` 涓?`audioUrl` 涓ょ杈撳叆锛屼絾鏌冲窞璇濆綋鍓嶆榛樿鍙蛋 Base64锛涙暣闊抽鍦烘櫙鎵嶄繚鐣欏叕缃?`audioUrl` 鍏煎銆?- CVPC 鏌冲窞璇濆綋鍓嶇Щ闄ょ殑鏃ч摼璺細
  - 鍚煶妯″瀷褰撳墠鍙繚鐣?`qwen3.5-omni-plus / qwen3.5-omni-flash`锛屼笉鍐嶆彁渚?`fun-asr`銆?  - CVPC 涓撶敤 `clip-cache` 璺敱銆佹湇鍔°€佹祴璇曚笌 README 鍙ｅ緞褰撳墠鍏ㄩ儴鍒犻櫎锛屼笉鍐嶄繚鐣?legacy / 璋冭瘯鍏ュ彛銆?  - options 椤点€佸叡浜瓨鍌ㄥ綊涓€鍜屽悗绔?defaults/health 褰撳墠閮藉凡鍚屾绉婚櫎 `fun-asr`銆?- 鍚屾鏇存柊锛?  - `extension/options/options.js`
  - `extension/shared/storage.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.test.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `docs/platforms-index.md`

## 2026-06-09锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈垹闄?clip URL 鍙揪鎬ф帰娴嬶級

- 淇 `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠娈?AI 鎺ㄨ崘鍦?clip 宸蹭笂浼犱絾鎺ㄨ崘鎺ュ彛浠嶆姤 `clip-audio-unavailable` 鐨勪竴绫昏鍒わ細
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js` 褰撳墠鍒犻櫎浜嗗澶栦复鏃堕煶棰?URL 鐨?`HEAD` / 鍙揪鎬ф帰娴嬨€?  - `ai/recommend` 褰撳墠鏀逛负鍙粠 `audioUrl` 瑙ｆ瀽 `clipId`锛屽啀鐩存帴璇诲彇鍚庣鏈湴 clip-cache 鏂囦欢鍒ゆ柇鏄惁瀛樺湪銆?  - 濡傛灉 `audioUrl` 涓嶆槸鏈剼鏈?clip-cache 鏂囦欢鍦板潃锛屽綋鍓嶄細鐩存帴杩斿洖 `invalid-clip-audio-url`锛涘鏋滄湰鍦版枃浠朵笉瀛樺湪鎴栧凡琚竻鐞嗭紝鍒欒繑鍥炴樉寮?`clip-audio-unavailable`銆?- 鍚屾鏇存柊锛?  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`

## 2026-06-09锛堢粺涓€鍚庣 README 琛ラ綈 PM2 鍚姩鍛戒护骞跺榻愭湇鍔″悕锛?
- 鏍?`README.md` 涓?`platform-resources/backend/README.md` 褰撳墠琛ュ厖浜嗙粺涓€鍚庣鐨?PM2 棣栨鍚姩鍛戒护锛?  - `pm2 start platform-resources/backend/server.js --name annotation-script-center --cwd /var/www/annotation-script-center`
- 鍚屾琛ュ厖浜嗏€滃垹闄ゅ悗閲嶅缓 PM2 鏈嶅姟鈥濈殑绀轰緥鍛戒护锛岄伩鍏嶅彧鏈?`restart` 娌℃湁 `start` 鐨勫彛寰勭己澶便€?- 鏂囨。涓殑缁熶竴鍚庣 PM2 鏈嶅姟鍚嶅綋鍓嶆槑纭敹鍙ｄ负 `annotation-script-center`锛岀敤浜庡拰鏈嶅姟鍣ㄥ疄闄呰繘绋嬪悕淇濇寔涓€鑷淬€?
## 2026-06-09锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈寜鏂扮増涓夋 AI 缁撴瀯鏀跺彛鍥炰腑闂村尯鍩燂級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鍩轰簬鏂扮増涓夋 AI 鎺ㄨ崘缁撴瀯瀹屾垚浜屾甯冨眬鏀跺彛锛?  - 鍙充晶 `鍏ㄥ眬鏍囨敞` 褰撳墠鍙繚鐣欑揣鍑戠姸鎬佸尯銆佸綋鍓嶉煶棰戞憳瑕佸拰鎻愮ず璇存槑锛屼笉鍐嶅睍绀轰笁缁撴灉 AI 鎺ㄨ崘鍗°€佺敾娈靛缓璁粨鏋滃拰鍔ㄤ綔鎸夐挳銆?  - 鍙充晶鎸傝浇鐐瑰綋鍓嶄紭鍏堟彃鍏?`鍏ㄥ眬鏍囨敞` 鐨?`.label_title_border2` 鍐呭娴侊紝涓嶅啀浣滀负澶栧眰澶栨寕鍧楄拷鍔犮€?  - 涓棿 `鏅€氳瘽椤烘粦` 涓嬫柟褰撳墠鏀规垚缁熶竴 AI 宸ヤ綔鍖猴紝闆嗕腑鎵胯浇锛?    - `褰撳墠娈?AI 鎺ㄨ崘`
    - `鏈～鍐欒ˉ Valid`
    - `鐢熸垚鐢绘寤鸿`
    - `搴旂敤褰撳墠寤鸿`
    - 褰撳墠鐢绘寤鸿缁撴灉
    - `闊抽鐨勬煶宸炶瘽鏂囨湰 / 闊抽鐨勬櫘閫氳瘽鏂囨湰 / 淇鍚庣殑鏌冲窞璇濇枃鏈琡 涓夊紶缁撴灉鍗?- `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js` 褰撳墠鍚屾瀹屾垚鍘熺敓鍖栨牱寮忔敹鍙ｏ細
  - 鍘绘帀鏃ф鑹插姪鎵嬩富棰橈紝缁熶竴鏀逛负鎺ヨ繎 CVPC 鍘熺敓 `Element UI` 鐨勮摑鐏版寜閽€佺櫧搴曞崱鐗囧拰娴呯伆鍒嗛殧绾裤€?  - `璁句负 Valid / 璁句负 Invalid` 褰撳墠涓嶅啀浣滀负闈㈡澘鎸夐挳娓叉煋锛岀户缁彧渚濊禆椤甸潰鍘熺敓鍗曢€変笌鏃㈡湁蹇嵎閿€?  - 娉㈠舰鍖?`.bottom-right` 褰撳墠涓嶅啀鎵胯浇鏌冲窞璇濊剼鏈嚜瀹氫箟鎸夐挳銆?
## 2026-06-09锛圖ataBaker CVPC 涓存椂闊抽鏀逛负姣忔閲嶄紶骞剁缉鐭负 10 鍒嗛挓 TTL锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠璋冩暣涓存椂闊抽绛栫暐锛?  - 鍓嶇涓嶅啀澶嶇敤椤靛唴 clip-cache URL锛涙瘡娆＄偣鍑?`褰撳墠娈?AI 鎺ㄨ崘` 閮戒細閲嶆柊瑁佸壀褰撳墠娈靛苟閲嶆柊涓婁紶涓存椂闊抽銆?  - 鍚庣涓存椂闊抽榛樿淇濈暀鏃堕棿浠?`1` 灏忔椂鏀逛负 `10` 鍒嗛挓銆?  - 涓婁紶鎴愬姛鍚庡綋鍓嶄細璁板綍杩囨湡鏃堕棿锛屽苟鍦ㄨ繘绋嬪唴娉ㄥ唽瀹氭椂鍒犻櫎锛涗笂浼犮€佽鍙栧拰鏈嶅姟鍚姩鏃朵篃缁х画椤烘墜娓呯悊杩囨湡鏂囦欢銆?- 鍚屾鏇存柊锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/clip-cache-service.js`
  - 瀵瑰簲娴嬭瘯涓?README 鍙ｅ緞

## 2026-06-09锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈帴鍏ヤ袱闃舵 AI 璁剧疆涓庝笁缁撴灉鍗★級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠瀹屾垚鏂颁竴杞竷灞€涓庨摼璺敹鍙ｏ細
  - 鍙充晶 `鍏ㄥ眬鏍囨敞` 鍗″綋鍓嶄綔涓哄敮涓€鍔╂墜鎸傝浇鐐癸紝鍥哄畾灞曠ず鐘舵€併€佸綋鍓嶉煶棰?褰撳墠娈垫憳瑕併€佹寜闇€鍑虹幇鐨勭敾娈靛缓璁€佷笁缁撴灉 AI 鎺ㄨ崘鍗″拰鍔ㄤ綔鎸夐挳銆?  - 娉㈠舰鍖?`.bottom-right` 褰撳墠鍙墠缃?`鐢熸垚鐢绘寤鸿`銆乣搴旂敤褰撳墠寤鸿`锛涗笉鍐嶆妸鍏朵粬鏌冲窞璇?AI 鎸夐挳鎸傚埌娉㈠舰鍖恒€?  - 鏃х殑鍗曚竴 `濉叆褰撳墠鎺ㄨ崘` 鎸夐挳宸茬Щ闄わ紝鏀逛负涓夊紶缁撴灉鍗″垎鍒畾鍚戝～鍏ワ細
    - `闊抽鐨勬煶宸炶瘽鏂囨湰` -> `鏍囨敞鏂囨湰`
    - `闊抽鐨勬櫘閫氳瘽鏂囨湰` -> `鏅€氳瘽椤烘粦`
    - `淇鍚庣殑鏌冲窞璇濇枃鏈琡 -> `鏍囨敞鏂囨湰`
- options 褰撳墠鏂板 CVPC 涓撳睘 `AI 璁剧疆` 闈㈡澘锛?  - 鍏变韩鍙充晶 `AI 璁剧疆` 鍖哄凡绾冲叆 `dataBakerCvpcLiuzhouAssistant`銆?  - 鍙繚鐣?`鍩虹璁剧疆 / 鍚煶 / 鏂囨湰淇` 涓夊潡锛涗笉鎻愪緵 compare-family銆侀噰绾抽槇鍊兼垨鍓嶇骞跺彂瀛楁銆?  - 鍚煶妯″瀷鏀寔 `qwen3.5-omni-plus / qwen3.5-omni-flash / fun-asr`锛涙枃鏈慨姝ｆā鍨嬫敮鎸?`qwen3.5-plus / qwen3.5-flash`銆?- 褰撳墠娈?AI 鎺ㄨ崘閾捐矾褰撳墠鍗囩骇涓?staged contract锛?  - 鍓嶇缁х画涓ユ牸鎸?`.xaudio_time` 鐨?`寮€濮?/ 缁撴潫` 瑁佸壀褰撳墠娈碉紝鍙笂浼?clip-cache 涓存椂鐗囨 URL锛屼笉閫€鍥炴暣闊抽銆?  - 璇锋眰浣撳綋鍓嶅彂閫?`aiStages.listen / aiStages.refine`銆?  - 杩斿洖浣撳綋鍓嶆柊澧?`audioDialectText / audioMandarinText / refinedDialectText`锛屽苟缁х画鍏煎 `dialectText / mandarinText` 鏃у埆鍚嶃€?- 鍚庣 `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js` 褰撳墠鏀逛负涓ら樁娈?pipeline锛?  - `listen`锛氶粯璁よ蛋 Omni 鍚煶锛岀洿鎺ヨ緭鍑?`audioDialectText + audioMandarinText`
  - `fun-asr`锛氬厛鎷?`heardText`锛屽啀璧颁竴娆℃枃鏈ˉ鎺ヨˉ瓒冲弻杈撳嚭锛屼繚鎸佸墠绔?UI 鍜屽绾︿笉闄嶇骇
  - `refine`锛氱粨鍚堟櫘閫氳瘽鏂囨湰銆佽瘝琛ㄥ懡涓墖娈典笌椤甸潰涓婁笅鏂囷紝鍙慨姝ｆ煶宸炶瘽鏂囨湰锛岃緭鍑?`refinedDialectText`
- 鏂板/鏇存柊楠岃瘉锛?  - `extension/shared/storage.data-baker-cvpc.test.js`
  - `extension/options/options-shared-asr-ai-panel.test.js`
  - `extension/options/options-data-baker-cvpc-ai-ui.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`

## 2026-06-09锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈敹鍙ｅ彸渚т俊鎭尯骞堕泦涓?AI 鍖猴級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠缁х画鏀跺彛椤甸潰甯冨眬锛?  - 鍙充晶 `鏌冲窞璇濊剼鏈?Beta` 涓嶅啀浣滀负鐙珛澶у潡鍗＄墖灞曠ず锛涘綋鍓嶆敼涓虹揣璺?`鏄惁鏈夋晥锛圴alid or Not锛塦 涓嬫柟鐨勮繛缁揣鍑戜俊鎭尯銆?  - 鍙充晶褰撳墠鍙繚鐣欑姸鎬併€佸綋鍓嶉煶棰戞憳瑕佸拰鎻愮ず璇存槑锛屼笉鍐嶆壙杞?AI 鎺ㄨ崘缁撴灉涓庣敾娈靛缓璁粨鏋溿€?  - 涓棿 `鏅€氳瘽椤烘粦` 涓嬫柟褰撳墠鍗囩骇涓虹粺涓€ AI 鍖猴紝闆嗕腑鎵胯浇锛?    - `褰撳墠娈?AI 鎺ㄨ崘`
    - `濉叆褰撳墠鎺ㄨ崘`
    - `鐢熸垚鐢绘寤鸿`
    - `搴旂敤褰撳墠寤鸿`
    - 褰撳墠鐢绘寤鸿缁撴灉
    - 褰撳墠娈?AI 鎺ㄨ崘缁撴灉
- `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js` 褰撳墠瀹屾垚鎸傝浇閲嶇粍锛?  - 淇濈暀 `鏈～鍐欒ˉ Valid` 鍦ㄦ湁鏁堟€у崟閫夊尯鍙充晶銆?  - 绉婚櫎娉㈠舰鍖?`.bottom-right` 鐨勬煶宸炶瘽 AI 鎸夐挳鎸傝浇锛屼笉鍐嶄笌骞冲彴鍘熺敓娉㈠舰鎺т欢娣锋帓銆?  - 鏂板涓棿 AI 鍖哄鍣紝缁熶竴鎵胯浇鍚庣画 AI 鍔ㄤ綔鎵╁睍浣嶄笌缁撴灉灞曠ず浣嶃€?- 鍥炲綊楠岃瘉琛ュ厖锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js` 褰撳墠鏂板涓棿 AI 鍖虹粨鏋滄覆鏌撹鐩栵紝骞剁‘璁ゆ尝褰㈠尯涓嶅啀鍑虹幇鏌冲窞璇?AI 鎸夐挳銆?
## 2026-06-08锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈皟鏁村師鐢熷瓧娈垫寜閽寕杞戒笌鎵归噺琛?Valid锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠杩涗竴姝ユ敹鍙ｅ彸渚у師鐢熻〃鍗曟寕杞斤細
  - 鍔╂墜鍗″唴涓嶅啀淇濈暀鍐椾綑鐨?`璁句负 Valid`銆乣璁句负 Invalid`銆乣褰撳墠娈?AI 鎺ㄨ崘`銆乣濉叆褰撳墠鎺ㄨ崘` 鎸夐挳銆?  - `鏈～鍐欒ˉ Valid` 褰撳墠鏀规寕鍒?`鏄惁鏈夋晥锛圴alid or Not锛塦 鍗曢€夊尯鍙充晶銆?  - `褰撳墠娈?AI 鎺ㄨ崘`銆乣濉叆褰撳墠鎺ㄨ崘` 褰撳墠鏀规寕鍒?`鏅€氳瘽椤烘粦` 杈撳叆鍖轰笅鏂广€?  - 娉㈠舰鍖?`.bottom-right` 缁х画鍙壙杞?`鐢熸垚鐢绘寤鸿`銆乣搴旂敤褰撳墠寤鸿`銆?- `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js` 褰撳墠琛ラ綈涓夌被鍐欏叆淇濇姢锛?  - 褰撳墠娈?`Valid / Invalid` 鍒囨崲鍓嶅厛璇诲綋鍓嶅崟閫夌姸鎬侊紱宸叉槸鐩爣鍊兼椂杩斿洖 no-op锛屼笉鍐嶉噸澶嶇偣鍑伙紝閬垮厤浜屾鐐瑰嚮鎶婂凡閫夌姸鎬佸彇娑堛€?  - `濉叆褰撳墠鎺ㄨ崘` 褰撳墠鏀逛负鍏煎椤甸潰 `contenteditable .ProseMirror`锛屽彲鐩存帴鍐欏叆 `鏍囨敞鏂囨湰` 涓?`鏅€氳瘽椤烘粦`銆?  - `鏈～鍐欒ˉ Valid` 褰撳墠鏀逛负鍏堣姹?`annotation/annos`锛屽彧缁熻骞惰ˉ鍐欏綋鍓?`entry_index` 涓嬬己澶辨湁鏁堟€х殑娈碉紱宸插～ `Valid / Invalid` 鍏ㄩ儴璺宠繃銆?- 鎵归噺琛ュ啓褰撳墠鎸夊乏渚х紪鍙烽『搴忔墽琛岋細
  - 鍏堟牎楠屽乏渚ф缂栧彿鏁伴噺涓?`annotation/annos` 鐨?`instance` 鏁伴噺涓€鑷淬€?  - `missing=0` 鏃跺彧鎻愮ず `Valid / Invalid / 鏈～鍐檂 缁熻锛屼笉鎵ц鐐瑰嚮銆?  - `missing>0` 鏃堕€愭潯閫変腑鐩爣娈碉紝鍐嶈皟鐢ㄥ綋鍓嶆 `Valid` 鍒囨崲锛涙鍒囨崲澶辫触鎴栧啓鍏ュけ璐ョ珛鍗冲仠姝㈠苟杩斿洖澶辫触缂栧彿涓庡凡琛ュ啓鏁伴噺銆?- 鏂板/鏇存柊楠岃瘉锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`

## 2026-06-08锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈敼涓哄彸渚у崱鍐呭姪鎵嬩笌褰撳墠娈佃鍓瘑鍒級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠瀹屾垚涓ょ被椤甸潰甯冨眬璋冩暣锛?  - 鍙栨秷鏃ф偓娴姪鎵嬪拰椤堕儴 `.page-top .top-right` 鍔╂墜宸ュ叿鏉°€?  - 鍔╂墜鍖烘敼涓哄祵鍏ュ彸渚?`鍏ㄥ眬鏍囨敞` 鍗＄墖锛屼繚鐣欏師鐢?`Valid / Invalid` 鍦ㄤ笂鏂癸紱涓嬫柟鍥哄畾鏄剧ず鐘舵€併€佸綋鍓嶉煶棰?褰撳墠娈垫憳瑕併€丄I 鎺ㄨ崘缁撴灉鍜屽姩浣滄寜閽€?  - `鐢熸垚鐢绘寤鸿`銆乣搴旂敤褰撳墠寤鸿` 褰撳墠浠呭墠缃寕鍒版尝褰㈠尯 `.bottom-right`锛屼笉鏀瑰钩鍙板師鐢?`寮€鍚媶鍒?/ 鍚堝苟娈佃惤 / 娉㈠舰璋冭妭 / 鍊嶇巼` 鎺т欢銆?- `褰撳墠娈?AI 鎺ㄨ崘` 褰撳墠涓ユ牸鎸夊綋鍓嶆尝褰㈤€変腑娈靛伐浣滐細
  - `data-api.js` 鏂板 `.xaudio_time` 瀹炴椂瑙ｆ瀽锛岃緭鍑?`selectedRange` 涓?`selectionKey`銆?  - 宸︿晶鏉＄洰鎴栨尝褰㈤€変腑娈靛彉鍖栨椂锛屼細娓呯┖鏃ф帹鑽愶紝閬垮厤鎶婁笂涓€娈电粨鏋滃～鍒版柊娈点€?  - 濡傛灉娌℃湁璇诲埌鍙俊鐨?`寮€濮?/ 缁撴潫`锛屽墠绔洿鎺ラ樆鏂紝涓嶅啀閫€鍥炴暣娈甸煶棰戞垨绗竴娈点€?- 鏂板 clip-cache 涓存椂闊抽缂撳瓨閾捐矾锛?  - 娴忚鍣ㄧ鍏堜笅杞藉綋鍓嶇鍚嶉煶棰戯紝鍙鍓綋鍓嶆锛岃浆鎴?`16k` 鍗曞０閬?WAV锛屽啀涓婁紶鍚庣銆?  - 鍚庣鏂板 `clip-cache/health`銆乣clip-cache/upload`銆乣clip-cache/files/:clipId.wav`銆?  - 涓存椂鏂囦欢榛樿淇濈暀 `1` 灏忔椂锛屾枃浠跺悕浠呬娇鐢ㄤ笉閫忔槑 `clipId`锛岃繍琛岀洰褰曚负 `platform-resources/data-baker-cvpc/liuzhou-helper/data/runtime/clip-cache/`锛屽凡鍔犲叆 `.gitignore`銆?- 鏂板/鏇存柊楠岃瘉锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.test.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/clip-cache-service.test.js`

## 2026-06-08锛堢郴缁熺鐞嗛」鐩暟鎹笅杞借ˉ榻愨€滃叏閮ㄢ€濅緵搴斿晢閫夐」锛?
- 淇绯荤粺绠＄悊 `鏁版嵁瀵煎嚭 -> 椤圭洰鏁版嵁涓嬭浇` 鍦ㄥ崟渚涘簲鍟嗘垨鎯崇洿鎺ヤ笅鎬昏〃鏃剁殑渚涘簲鍟嗛€夋嫨缂哄彛锛?  - 鍓嶇褰撳墠鏂板 `extension/options/options-project-download-supplier.js`锛岀粺涓€璐熻矗渚涘簲鍟嗕笅鎷夌殑 `鍏ㄩ儴` 閫夐」涓庢牎楠岃鍒欍€?  - 鍗曚緵搴斿晢鏁版嵁闆嗙幇鍦ㄤ篃浼氭樉绀轰緵搴斿晢涓嬫媺锛屽苟榛樿鎻愪緵 `鍏ㄩ儴`锛岄伩鍏嶁€滃彧鏈変竴涓緵搴斿晢浣嗘棤娉曠洿鎺ヤ笅杞芥€昏〃鈥濈殑鎯呭喌銆?  - 澶氫緵搴斿晢鏁版嵁闆嗛€夋嫨 `鍏ㄩ儴` 鏃讹紝褰撳墠涔熷厑璁哥洿鎺ヤ笅杞芥€昏〃锛屼笉鍐嶅彧鑳戒簩閫変竴涓嬭浇鏌愪釜渚涘簲鍟嗐€?- 鍚庣 `platform-resources/backend/project-data-download/routes.js` 褰撳墠鏀寔鏄惧紡 `supplier="__all__"`锛?  - `request` 闃舵鎶婂畠璇嗗埆涓衡€滄€昏〃涓嬭浇鎰忓浘鈥濓紝涓嶅啀璇垽鎴愮己灏戜緵搴斿晢銆?  - `file` 闃舵鍚屾牱鎸夋€昏〃澶勭悊锛屼粛淇濇寔鍏蜂綋渚涘簲鍟嗙瓫閫変笅杞戒笉鍙樸€?- 鏂板鍥炲綊楠岃瘉锛?  - `extension/options/options-project-download-supplier.test.js`
  - `platform-resources/backend/project-data-download/__tests__/request-auth.test.js`

## 2026-06-08锛圓I 閰嶇疆鏀跺彛涓庡簾寮?Provider 娓呯悊锛?
- 缁熶竴 AI 閰嶇疆鍙ｅ緞锛?  - `config/env/ai.env.example` 鏀跺彛涓烘渶灏忕敓浜фā鏉匡紝鍙繚鐣?`DASHSCOPE_API_KEY`銆佸彲閫?`DASHSCOPE_BASE_URL`锛屼互鍙婃敞閲婂紡 `ASC_AI_JOB_*` 瑕嗙洊绀轰緥銆?  - 鏄庣‘ `config/env/ai.env`銆乣config/env/ai.local.env` 涓哄拷鐣ユ枃浠讹紝鐪熷疄鐢熶骇鍐呭搴斿彧淇濈暀瀵嗛挜鍜屽皯閲忛潪榛樿瑕嗙洊椤广€?- 鍏变韩 job 閰嶇疆鎺ㄨ崘鍐欐硶缁熶竴鏀逛负 `ASC_AI_JOB_TIMEOUT_MS / ASC_AI_JOB_TTL_MS / ASC_AI_JOB_MAX_SIZE / ASC_AI_JOB_POLL_INTERVAL_MS`锛?  - `platform-resources/backend/ai/config.js` 琛ラ綈涓庡叡浜?runtime 涓€鑷寸殑浼樺厛绾э紝鎸?`ASC_* -> DATABAKER_* -> 浠ｇ爜榛樿鍊糮 璇诲彇銆?  - `DATABAKER_AI_JOB_*` 浠呬繚鐣欏巻鍙插吋瀹?fallback锛屼笉鍐嶄綔涓烘ā鏉垮拰鏂囨。棣栭€夊彛寰勩€?- 娓呯悊搴熷純 provider 娈嬬暀锛?  - 鍒犻櫎 `config/env/ai.env.example` 涓笉鍐嶇淮鎶ょ殑棰濆 provider 鍙橀噺鍧椼€?  - 鍒犻櫎 `extension/shared/constants.js` 涓湭浣跨敤鐨勬棫 `AI_MODEL_OPTIONS` 甯搁噺涓庡鍑猴紝閬垮厤缁х画鏆撮湶鍘嗗彶妯″瀷閫夐」銆?- 鍚屾鏇存柊鏍?`README.md`銆佺粺涓€鍚庣 README銆佹爣璐濇槗閲?README / backend README 涓?`log.md`锛岀粺涓€涓衡€滀唬鐮侀粯璁ゅ€间紭鍏堚€濈殑缁存姢璇存槑銆?
## 2026-06-08锛圠abelX 蹇垽缁熻鎭㈠鍐茬獊璺宠繃锛?
- 鎭㈠ `Alibaba LabelX / ASR 蹇垽缁熻涓婁紶` 鐨勨€滃啿绐佽烦杩団€濅綋楠岋紝浣嗕笉鍥為€€鍚庣鍙岄敭涓ユ牸鍐欏叆瑙勫垯锛?  - label existing 浠嶅彧鏈?`鐢ㄦ埛鍚?+ subTaskId` 鍙岄敭绮剧‘鍛戒腑鏃舵墠绠?`complete=true`銆?  - 濡傛灉 existing 宸茶瘑鍒负鈥滃悓鐢ㄦ埛鍚嶄笉鍚?subTaskId鈥濇垨鈥滃悓 subTaskId 涓嶅悓鐢ㄦ埛鍚嶁€濓紝鍓嶇褰撳墠鐩存帴璁颁负鈥滃啿绐佽烦杩団€濓紝涓嶅啀缁х画鎷夎鎯呫€佷笂浼犲苟鎶ュ悗绔け璐ャ€?- 鍓嶇缁熻鎽樿褰撳墠鏂板 `skippedConflictCount`锛?  - 瀹屾垚鎬佹枃妗堜細灞曠ず鈥滃啿绐佽烦杩?N鈥濄€?  - 褰?`payloadCount=0` 涓斿彧鏈夊啿绐佽烦杩囨椂锛屼笉鍐嶆彁绀衡€滃凡鍏ㄩ儴瀹屾暣锛屾棤闇€涓婁紶鈥濓紝鑰屾槸鏄庣‘鎻愮ず鈥滃瓨鍦ㄥ啿绐佽烦杩囷紝鏈笂浼犫€濄€?- 鈥滆ˉ浼犲苟瑕嗙洊褰撳墠浜哄憳鈥濊竟鐣屼繚鎸佹敹绱э細
  - 浠嶅彧閽堝 `skippedCompleteCount > 0` 鐨勫畬鏁磋烦杩囧垎鍖呮樉绀烘寜閽€?  - `conflict-skip` 涓嶅弬涓?force replace锛岄伩鍏嶆妸鍗曢敭鍐茬獊閲嶆柊閫佸洖鍚庣澶辫触銆?- 鏂板鍓嶇绾嚱鏁板洖褰掓祴璇曪細
  - `extension/sites/alibaba-labelx/asr-judgement/asr-judgement-server.test.js`
  - 瑕嗙洊 `complete-skip / conflict-skip / fetch-detail` 涓夌被 existing 鍒嗘祦涓?force replace 渚嬪瑙勫垯銆?
## 2026-06-08锛堢郴缁熶华琛ㄧ洏琛ラ綈 AI 浠诲姟姹犲崰鐢ㄥ苟淇 job store 婊¤浇鍥炴敹锛?
- 淇鈥滅郴缁熺鐞?/ 浠〃鐩?/ 妯″瀷姹犲崰鐢ㄢ€濅笌鐪熷疄 `503` 鍘熷洜鑴辫妭鐨勯棶棰橈細
  - 涔嬪墠浠〃鐩樺彧灞曠ず provider 妯″瀷姹?`active/pending/999`锛屼絾 `ai-job-store-full` 瀹為檯鏉ヨ嚜鍏变韩 AI 浠诲姟姹狅紝瀵艰嚧椤甸潰鐪嬭捣鏉ュ緢绌恒€佽姹傚嵈宸茬粡琚悗绔嫆缁濄€?  - 鐜板湪浠〃鐩樹細鍦ㄦā鍨嬫睜鍗＄墖鍓嶉澶栧睍绀?`AI 浠诲姟姹燻 鍗＄墖锛屽苟鏄庣‘鎻愮ず `ai-job-store-full` 瀵瑰簲鐨勬槸浠诲姟姹犳弧杞姐€?- 鍏变韩 AI job store 褰撳墠琛ラ綈瀹归噺蹇収瀛楁锛?  - `capacity`
  - `usedCount`
  - `availableCount`
  - `isFull`
  - `utilizationPercent`
- 鍏变韩 AI job store 鐨勬弧杞界瓥鐣ュ綋鍓嶅凡璋冩暣锛?  - 杩囧幓鍙竻鐞?`expired` job锛?0 鍒嗛挓 TTL 鍐呭鏋滄垚鍔?/ 澶辫触 job 绉疮鍒颁笂闄愶紝鍗充娇妯″瀷姹犲苟涓嶅繖锛屼篃浼氭寔缁繑鍥?`ai-job-store-full`銆?  - 鐜板湪杈惧埌涓婇檺鏃讹紝浼氫紭鍏堝洖鏀舵渶鏃╃殑缁堟€?job锛坄succeeded / failed / expired`锛夛紱鍙湁杩愯涓拰寰呭惎鍔ㄤ换鍔℃湰韬凡缁忔妸姹犳墦婊℃椂锛屾墠缁х画鎷掔粷鏂颁换鍔°€?- 鍥炲綊楠岃瘉宸茶ˉ锛?  - `platform-resources/backend/ai-framework/runtime/ai-job-store.test.js`
  - `platform-resources/backend/admin-dashboard/overview.test.js`

## 2026-06-08锛圠abelX 蹇垽缁熻鍙岄敭妲戒綅鏍￠獙淇锛?
- 淇 `Alibaba LabelX / ASR 蹇垽缁熻涓婁紶` 鍦ㄥ巻鍙茶剰鏁版嵁鍦烘櫙涓嬪鏄撻暱鍑衡€滃悓鍚嶉噸澶嶅崰妲解€濆拰鈥渆xisting 璇垽宸蹭笂浼犫€濈殑闂锛?  - 鏍囨敞妲戒綅褰撳墠鏀规垚涓ユ牸 `鐢ㄦ埛鍚?+ subTaskId` 鍙岄敭璇箟銆?  - 鍙湁鍙岄敭鍚屾椂鍛戒腑鍚屼竴鏍囨敞妲戒綅鏃讹紝鎵嶅厑璁稿鐢ㄥ師妲戒綅鎴栬 existing 鍒ゆ垚 `complete=true`銆?  - 鍚岀敤鎴峰悕涓嶅悓 `subTaskId`銆佹垨鍚?`subTaskId` 涓嶅悓鐢ㄦ埛鍚嶏紝鐜板湪閮戒細鏄庣‘鎷掔粷锛屼笉鍐嶈嚜鍔ㄥ苟妲姐€?- 鍓嶇 / 鍚庣鍚屾鏀剁揣锛?  - `extension/sites/alibaba-labelx/asr-judgement/asr-judgement-server.js` 褰撳墠瑕佹眰鏍囨敞 payload 鐨?`roleRecord.userName` 蹇呭～銆?  - existing 璇锋眰缁勮浼氬 label 鏄惧紡閫忎紶 `userName`銆?  - `platform-resources/backend/project-data-download/labelx-existing-core.js` 涓庡揩鍒?`data/adapter.js` 褰撳墠鎸夊弻閿簿纭懡涓垽瀹氭爣娉ㄦ槸鍚﹀凡瀹屾暣涓婁紶銆?- 鏂拌鍒欐槑纭笉鍏煎鍘嗗彶鑴忔暟鎹細
  - 鍚敤鍓嶉渶瑕佷汉宸ュ浠藉苟娓呯┖鏈嶅姟鍣ㄧ幇鏈夊揩鍒ょ粺璁℃暟鎹€?  - 涔嬪悗鍐嶈鍏ㄥ憳閲嶆柊鍏ㄩ噺涓婁紶涓€娆°€?  - 杩欒疆涓嶆柊澧炲悗绔€滄竻绌虹粺璁♀€濇帴鍙ｏ紝缁х画鎸変汉宸ヨ繍缁村鐞嗐€?
## 2026-06-08锛圡agic Data 鍙屽姪鎵嬩慨澶?Job 鎴愬姛鎬佺粨鏋滃鍖呬竴灞傚鑷寸殑闈㈡澘璇垽锛?
- 淇 `Magic Data / 瀹㈠璇濆姪鎵媊 鐨勨€淎I 璐ㄦ褰撳墠鏉♀€濈粨鏋滄覆鏌撳紓甯革細
  - 鐜拌薄锛氬悗绔凡杩斿洖 `reviewConclusion=pass` 涓庢湁鏁?`summary`锛屼絾鍙充晶缁撴灉鍖轰粛鏄剧ず鈥滄棤娉曞垽鏂?/ 鎽樿 -鈥濄€?  - 鏍瑰洜锛歚review-current/jobs/:jobId` 鎴愬姛鎬佽繑鍥炵殑 `data` 鏄暣鍧楁垚鍔熷搷搴斾綋锛屽墠绔?Job client 鐩存帴鎶婅繖灞傚璞′紶缁欓潰鏉匡紝瀵艰嚧闈㈡澘璇诲彇 `reviewConclusion/overall.summary` 鏃跺懡涓┖鍊笺€?  - 淇锛歚extension/sites/magic-data/shared/ai-review-client.js` 鍦?Job 杞鎴愬姛鍒嗘敮浼樺厛瑙ｅ寘 `jobBody.data.data`锛屾病鏈夌浜屽眰鏃跺啀鍥為€€ `jobBody.data`銆?- 鍚屾鍏煎 `Magic Data / 闂藉崡璇姪鎵媊锛?  - `extension/sites/magic-data/minnan-helper/ai-review-client.js` 浣跨敤鍚屾牱鐨勮В鍖呴€昏緫锛岄伩鍏嶅弻鍔╂墜鍦ㄥ悓绫?Job 閾捐矾涓婂啀娆″嚭鐜扮粨鏋滄覆鏌撳紓甯搞€?- 鏂板鍥炲綊楠岃瘉锛?  - `extension/sites/magic-data/shared/ai-review-client.test.js` 瑕嗙洊鈥淛ob succeeded + data.success + data.data鈥濈粨鏋勶紝纭繚鍓嶇鏈€缁堟嬁鍒扮湡姝ｇ殑璐ㄦ缁撴灉瀵硅薄銆?
## 2026-06-08锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈煶棰戝湴鍧€闈㈡澘鎶樺彔浼樺寲锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 鐨勬偓娴獥褰撳墠浼樺寲鈥滃綋鍓嶉煶棰戝湴鍧€鈥濆睍绀猴細
  - 榛樿鍙睍绀哄綋鍓嶉煶棰戞枃浠躲€乁RL 鏉ユ簮鍜屸€滄墦寮€褰撳墠闊抽 URL鈥濋摼鎺ャ€?  - 瀹屾暣绛惧悕鍦板潃鏀惧叆鎶樺彔璇︽儏锛岄粯璁や笉灞曞紑銆?- `page-world/audio-observer.js` 褰撳墠涓嶅啀鍖呰 `console.warn`锛岄伩鍏嶅钩鍙伴樋閲屼簯 STS warning 鐨勫爢鏍堣褰掑埌鎵╁睍鑴氭湰锛涢煶棰?URL 鎹曡幏缁х画鐩戝惉 `console.log/info/debug`銆?
## 2026-06-08锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈ˉ鑾?iframe 闊抽 URL锛?
- 閫氳繃鐪熷疄 Edge 椤甸潰缁х画鎺掓煡纭锛歚gAudioUrl / audio_url` 鍑虹幇鍦ㄥ悓婧?`/app/xaudio/label/` iframe 涓紝椤跺眰椤靛唴瑙傚療鍣ㄦ棤娉曠洿鎺ユ崟鑾疯 iframe 鐨勬帶鍒跺彴闊抽 URL銆?- `extension/manifest.json` 褰撳墠鎶?CVPC 椤靛唴闊抽瑙傚療妗ユ敼涓?`all_frames: true`锛屽彧鎵╁睍 `MAIN` world observer锛屼笉鎶婂畬鏁磋繍琛屾椂鑴氭湰鎵╁埌 iframe銆?- `page-world/audio-observer.js` 褰撳墠鍦ㄦ湭鎷垮埌 meta entries 鐨?iframe 涓崟鑾峰埌 `databaker/data/` 闊抽 URL 鏃讹紝浼氭妸鍊欓€?URL 鍙戠粰椤跺眰椤甸潰锛涢《灞?`data-api.js` 鍐嶇粨鍚堟ˉ鎺?`annotation/meta` 鐨勫綋鍓嶆潯鐩仛鍖归厤銆?- 鍚屾簮 frame 娑堟伅浠嶅彧鎺ュ彈绉佹湁 `source/type` 鍗忚锛涢煶棰?URL 鍙湪椤甸潰杩愯鏃跺唴瀛樹腑浼犻€掞紝涓嶅啓鍏?storage銆佹枃妗ｆ垨鏃ュ織銆?
## 2026-06-08锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈慨澶?meta 401 鍚庨煶棰戝湴鍧€涓嶆樉绀猴級

- 閫氳繃鐪熷疄 Edge 椤甸潰鎺掓煡纭锛氶〉闈㈣嚜韬兘鎷垮埌 `gAudioUrl / audio_url`锛屼絾鎵╁睍闅旂涓栫晫鑷彂 `annotation/meta` 璇锋眰浼氬洜缂哄皯骞冲彴杩愯鏃堕壌鏉冭繑鍥?`401`锛屽鑷存偓娴獥鏄剧ず鈥滆鍙栧綋鍓嶉煶棰戝湴鍧€澶辫触鈥濄€?- `page-world/audio-observer.js` 褰撳墠鏂板杩愯鏃?meta 蹇収妗ワ細
  - 澶嶇敤椤甸潰鐪熷疄 `annotation/meta` 鍝嶅簲锛屼笉瑕佹眰鎵╁睍閲嶆柊鎼哄甫 Bearer 璇锋眰銆?  - 鍚屾鍏煎骞冲彴鍝嶅簲 `code: 200`銆?  - 妗ユ帴鏁版嵁鍙湪椤甸潰杩愯鏃跺唴瀛樹紶閫掞紝涓嶅啓鍏?storage锛屼笉鍐欏叆鏃ュ織銆?- `data-api.js` 褰撳墠鍦ㄨ嚜韬?`annotation/meta` 璇锋眰澶辫触鏃讹紝浼氬洖閫€浣跨敤椤靛唴妗ヤ紶鍏ョ殑 meta锛屽啀鍖归厤椤甸潰鎹曡幏鍒扮殑褰撳墠闊抽绛惧悕 URL銆?
## 2026-06-08锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈偓娴獥灞曠ず褰撳墠闊抽鍦板潃锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 鐨勨€滄煶宸炶瘽鑴氭湰 Beta鈥濇偓娴獥褰撳墠鏂板鈥滃綋鍓嶉煶棰戝湴鍧€鈥濆尯鍩燂細
  - 灞曠ず褰撳墠鏂囦欢鍚嶃€侀煶棰?URL 鏉ユ簮鍜岃繍琛屾椂鎷垮埌鐨勫綋鍓嶉煶棰戝湴鍧€銆?  - 浠呭湪椤甸潰杩愯鏃跺睍绀猴紝涓嶅啓鍏?storage銆佹枃妗ｆ垨鏃ュ織銆?- 椤靛唴闊抽瑙傚療妗ュ綋鍓嶈ˉ鍏呮秷璐归〉闈㈠垵濮嬪寲闃舵鐨勬帶鍒跺彴闊抽 URL 鎵撳嵃锛?  - 缁х画缁撳悎 `annotation/meta` 鐨勭浉瀵硅矾寰勫拰鏂囦欢鍚嶅缓绔嬫槧灏勩€?  - 濡傛灉闊抽 URL 鍏堜簬 `annotation/meta` 鍑虹幇锛屼細鏆傚瓨鍦ㄩ〉闈㈠唴瀛橈紝寰?meta 鍒拌揪鍚庡啀寤虹珛褰撳墠鏉＄洰鏄犲皠銆?- `content.js` 褰撳墠鍦ㄦ偓娴獥鎸傝浇鍚庝細涓诲姩鍒锋柊褰撳墠闊抽涓婁笅鏂囷紝椤甸潰鍒锋柊鍚庢棤闇€鍏堟挱鏀句竴娆″嵆鍙紭鍏堟樉绀哄凡鎹曡幏鍒扮殑闊抽 URL锛涘鏋滀粛鏈嬁鍒帮紝浼氬湪闈㈡澘閲屾樉绀哄彲鎵ц鎻愮ず銆?
## 2026-06-08锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈慨澶嶆棭鏈熸寕杞界┖鎸囬拡锛?
- 淇 `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 鍦ㄧ紪杈戦〉楠ㄦ灦灏氭湭鍑嗗濂芥椂鍋跺彂鐨勫墠绔姤閿欙細
  - 鎶ラ敊锛歚Cannot read properties of null (reading 'appendChild')`
  - 浣嶇疆锛歚extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
- 鏍瑰洜锛?  - content script 杈冩棭鎵ц鏃讹紝`document.body` 鎴栭《閮ㄥ伐鍏锋爮瀹夸富鍙兘浠嶆湭灏辩华
  - `ui-panel.js` 鐩存帴瀵圭┖瀹夸富鎵ц `appendChild(...)`锛屽鑷存寕杞介樁娈垫姏閿?- 淇鏂瑰紡锛?  - `mount()` 鍦?`body` 鏈氨缁椂鐩存帴璺宠繃鏈疆鎸傝浇骞惰繑鍥?  - 宸ュ叿鏍?fallback 瀹夸富鍦?`body` 缂哄け鏃朵笉鍐嶅己琛屽垱寤?  - 绛夊悗缁疆璇㈠啀娆℃墽琛?`mount()` 鏃跺啀瀹屾垚姝ｅ父鎸傝浇
- 鏂板鍥炲綊楠岃瘉锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js` 瑕嗙洊 `document.body` 鏈氨缁満鏅?
## 2026-06-08锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈彁绀哄睆钄芥媶鎴愬弻寮€鍏筹級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 鐨勬彁绀哄睆钄借兘鍔涘綋鍓嶄粠鍗曞紑鍏虫媶鎴愪袱涓嫭绔嬪熀纭€璁剧疆锛屼笖榛樿閮藉紑鍚細
  - `灞忚斀鈥滀笉鑳芥墦寮€鏂扮殑Tab椤碘€濇彁绀篳
  - `灞忚斀鈥滅郴缁熻繘鍏ユ殏鍋滅姸鎬佲€濇彁绀篳
- 瀛樺偍瀛楁褰撳墠鏀逛负锛?  - `blockNewTabEditingTips`
  - `blockPauseStateTips`
- 鍚戝悗鍏煎锛?  - 鏃ч厤缃噷鐨?`blockEditingTabTips` 浼氳嚜鍔ㄨ縼绉绘垚涓や釜鏂板瓧娈靛悓鍊?  - 鑰佺敤鎴峰鏋滀箣鍓嶅叧闂繃鏃у崟寮€鍏筹紝鍗囩骇鍚庝袱涓柊寮€鍏充細涓€璧蜂繚鎸佸叧闂?- `editing-tab-tip-guard.js` 褰撳墠鎸夊紑鍏冲垎鍒喅瀹氭槸鍚︽嫤鎴搴斿浐瀹氭枃妗堬紝涓嶆墿澶у埌鍏朵粬 `.tips` 鎻愮ず銆?
## 2026-06-08锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈ˉ鍏呮殏鍋滅姸鎬佹彁绀哄睆钄斤級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 鐨勬棦鏈夊熀纭€璁剧疆寮€鍏?`灞忚斀鈥滀笉鑳芥墦寮€鏂扮殑Tab椤碘€濇彁绀篳 褰撳墠宸叉墿澶у埌鍚屾椂灞忚斀涓ょ被鍥哄畾楂樺眰鎻愮ず锛?  - `鎮ㄦ鍦ㄧ紪杈戣浣滀笟,涓嶈兘鎵撳紑鏂扮殑Tab椤礰
  - `绯荤粺杩涘叆鏆傚仠鐘舵€乣
- `extension/sites/data-baker-cvpc/liuzhou-helper/editing-tab-tip-guard.js` 褰撳墠缁х画淇濇寔绮剧‘鏂囨鍖归厤锛?  - 浠嶅彧瑙傚療 `/app/editor/asr/` 椤甸潰鍐呮柊澧炵殑 `.tips` 鑺傜偣
  - 涓嶆墿澶у埌鍏朵粬鎻愮ず銆佷笉鏀规寜閽€昏緫銆佷笉纰板钩鍙颁繚瀛?鎻愪氦/鍒囨潯閾捐矾
- 鍥炲綊楠岃瘉琛ュ厖锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/editing-tab-tip-guard.test.js` 鏂板鏆傚仠鐘舵€佸脊绐楄鐩?
## 2026-06-08锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈煶棰?URL 鑾峰彇鎺ラ€氾級

- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鏂板椤靛唴闊抽瑙傚療妗ワ細
  - `extension/sites/data-baker-cvpc/liuzhou-helper/page-world/audio-observer.js`
  - 閫氳繃 `MAIN` world 鎹曡幏 `annotation/meta` 鐨勭浉瀵归煶棰戣矾寰勪笌椤甸潰鐪熷疄闊抽璇锋眰鐨勭鍚?URL 鏄犲皠銆?  - 瑙傚療缁撴灉鍙繚瀛樺湪椤甸潰杩愯鏃跺唴瀛橈紝骞堕€氳繃绉佹湁 `window.postMessage` 鍗忚浼犵粰闅旂涓栫晫锛屼笉鍐欏叆 storage锛屼笉鍐欏叆鏃ュ織銆?- `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js` 褰撳墠鎸変互涓嬮『搴忚В鏋愬綋鍓嶉煶棰?URL锛?  - 椤靛唴瑙傚療鍣ㄦ槧灏?  - `annotation/meta` 閲岀殑瀹屾暣 URL 瀛楁
  - 椤跺眰 DOM audio
  - Performance resource
  - 鍚屾簮 iframe audio
- `content.js` 褰撳墠鍦ㄩ煶棰?URL 缂哄け鏃朵細鎻愬墠鎻愮ず鐢ㄦ埛鍏堢偣鍑诲綋鍓嶉煶棰戞垨鎾斁涓€娆″悗閲嶈瘯锛涚幇鏈?AI 鎺ㄨ崘鍜岀敾娈靛缓璁姹傜粨鏋勪繚鎸佷笉鍙樸€?- 鏂板鍥炲綊楠岃瘉锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/page-world/audio-observer.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`

## 2026-06-08锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈揩鎹烽敭鍏煎鐑慨锛?
- 淇 `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 涓儴鍒嗗巻鍙插揩鎹烽敭鏃犳硶瑙﹀彂鐨勯棶棰橈細
  - 鐜拌薄锛氭寜閽偣鍑烩€滆涓?Invalid鈥濃€滄湭濉啓琛?Valid鈥濆彲姝ｅ父鎵ц锛屼絾宸蹭繚瀛樼殑蹇嵎閿笉瑙﹀彂銆?  - 鏍瑰洜锛氭棫閰嶇疆閲屽瓨鍦?`Shift + 鏁板瓧` 椋庢牸鐨勫揩鎹烽敭锛岃繍琛屾椂鍙寜 `event.key` 绮剧‘鍖归厤鏃讹紝浼氳娴忚鍣ㄥ疄闄呮姏鍑虹殑绗﹀彿閿€兼墦鏂€?- `extension/sites/data-baker-cvpc/liuzhou-helper/shortcuts.js` 褰撳墠宸茶ˉ鍏煎锛?  - 鍦ㄤ繚鐣欏師鏈?`event.key` 鍖归厤鐨勫熀纭€涓婏紝棰濆鎸?`event.code` 鎺ㄥ鏁板瓧閿?/ 涓婚敭鍖哄瓧姣嶉敭 / Space 鐨勫€欓€夊€笺€?  - 鏃х増 `Alt + Shift + 2/3` 杩欑被鍘嗗彶缁勫悎鐜板湪鍙户缁懡涓?`invalid` 涓?`fillAllValid` 绛夊姩浣溿€?- 鏂板鍥炲綊楠岃瘉锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/shortcuts.test.js` 鏂板 legacy shifted digit 瑕嗙洊銆?
## 2026-06-08锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈睆钄?Tab 闄愬埗鎻愮ず锛?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠鏂板鍩虹璁剧疆寮€鍏筹細
  - `灞忚斀鈥滀笉鑳芥墦寮€鏂扮殑Tab椤碘€濇彁绀篳
  - 榛樿寮€鍚?  - 瀛樺偍瀛楁锛歚platforms.dataBakerCvpc.scripts.liuzhouAssistant.blockEditingTabTips`
- 杩愯鏃舵柊澧?`extension/sites/data-baker-cvpc/liuzhou-helper/editing-tab-tip-guard.js`锛?  - 杩涘叆 `/app/editor/asr/` 鍚庡厛鎵弿涓€娆￠〉闈?  - 鍐嶉€氳繃 `MutationObserver` 鐩戝惉鏂板鑺傜偣
  - 鍙Щ闄ゆ枃妗堝寘鍚?`鎮ㄦ鍦ㄧ紪杈戣浣滀笟,涓嶈兘鎵撳紑鏂扮殑Tab椤礰 鐨勬彁绀烘ā鍧?  - 涓嶆墿澶у埌鍏朵粬 `.tips` 鎻愮ず锛屼篃涓嶆敼骞冲彴淇濆瓨/鎻愪氦/鍒囨潯閫昏緫
- options / storage / manifest 鍚屾鏇存柊锛?  - `extension/options/options.html`
  - `extension/options/options.js`
  - `extension/shared/constants.js`
  - `extension/shared/storage.js`
  - `extension/manifest.json`
- 鏂板楠岃瘉瑕嗙洊锛?  - `extension/shared/storage.data-baker-cvpc.test.js`
  - `extension/options/options-shortcut-panel-structure.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/editing-tab-tip-guard.test.js`

## 2026-06-05锛堝叏骞冲彴蹇嵎閿粯璁ょ疆绌轰笌缁勪欢鍖栨敹鍙ｏ級

- options 渚у揩鎹烽敭闈㈡澘褰撳墠宸茬粺涓€鏀跺彛鍒?`extension/options/options-shared-shortcut-panel.js`锛?  - Alibaba LabelX 杞啓
  - Alibaba LabelX 蹇垽
  - DataBaker 涓€妫€
  - DataBaker CVPC 鏌冲窞璇濊剼鏈?  - Aishell Tech 闂藉崡璇姪鎵?  - Magic Data 瀹㈠璇濆姪鎵?  - Magic Data 闂藉崡璇姪鎵?  - Abaka Task21 鍔╂墜
- 榛樿蹇嵎閿綋鍓嶇粺涓€鏀逛负绌猴細
  - CVPC 涓嶅啀淇濈暀鍥哄畾 `Alt + Shift + 1~7` 榛樿缁勫悎
  - Abaka Task21 涓嶅啀淇濈暀 `1~7` 涓?`Alt+1~4` 榛樿缁勫悎
- options 鏂囨涓庝氦浜掑悓姝ヨ皟鏁达細
  - CVPC 蹇嵎閿尯鏀逛负涓庡叾浠栬剼鏈竴鑷寸殑鍙綍鍒舵ā鏉?  - Abaka 鈥滄仮澶嶉粯璁ゅ揩鎹烽敭鈥濇敼涓衡€滄竻绌哄揩鎹烽敭鈥?- 杩愯鏃堕粯璁ゅ洖閫€鍚屾鏀跺彛锛?  - `extension/sites/data-baker-cvpc/liuzhou-helper/shortcuts.js` 涓嶅啀鍐呯疆鍥哄畾榛樿閿綅
  - 鍙湁鐢ㄦ埛鍦?options 涓樉寮忎繚瀛樼殑蹇嵎閿紝杩愯鏃舵墠浼氬搷搴?- 椤圭洰瑙勫垯鍚屾鏇存柊锛?  - `AGENTS.md`
  - 鏍?`README.md`
  - `extension/README.md`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `extension/sites/abaka-ai/task-page/README.md`

## 2026-06-05锛圖ataBaker CVPC 鏌冲窞璇濊剼鏈?Beta 鎺ュ叆锛?
- 璺熻繘浼樺寲锛?  - options 渚ф柊澧?`extension/options/options-shared-shortcut-panel.js`锛屾妸鑴氭湰璇︽儏椤靛揩鎹烽敭鍖虹粺涓€鏀跺彛涓哄叡浜粍浠躲€?  - 杞啓銆佸揩鍒ゃ€佹爣璐濇槗閲囥€丄ishell銆丮agic Data銆丄baka 鐨勫揩鎹烽敭琛屾覆鏌撳凡鏀规垚澶嶇敤鍏变韩缁勪欢锛屼繚鐣欏悇鑷崏绋垮拰褰曞埗鐘舵€侀€昏緫銆?  - CVPC 鏌冲窞璇濊剼鏈殑鍥哄畾蹇嵎閿凡鎺ュ洖鍏变韩缁勪欢鍙妯″紡锛屼笉鍐嶅湪 `options.html` 鎵嬪啓 `field-card` 鍒楄〃銆?  - `AGENTS.md`銆乣README.md`銆乣extension/README.md` 宸茶ˉ鈥滃揩鎹烽敭闈㈡澘蹇呴』澶嶇敤缁熶竴缁勪欢鈥濈殑纭鍒欍€?
- 璺熻繘浼樺寲锛?  - CVPC 鏌冲窞璇濊剼鏈殑鍥哄畾蹇嵎閿凡浠庘€滃熀纭€璁剧疆鈥濇媶鍒扮嫭绔嬧€滃揩鎹烽敭鈥濋潰鏉匡紝鍜屽叾浠栬剼鏈繚鎸佸悓涓€缁撴瀯銆?  - 杩愯鏃舵搷浣滄寜閽凡浠庣函鎮诞闈㈡澘鏀逛负浼樺厛鎸傚埌 `editor/asr` 椤堕儴 `.page-top .top-right` 宸ュ叿鏍忓尯鍩熴€?  - 鎮诞闈㈡澘褰撳墠鍙繚鐣欑姸鎬併€佺敾娈靛缓璁拰 AI 鎺ㄨ崘缁撴灉灞曠ず锛涢《閮ㄧ己澶辨椂鎵嶉€€鍥炲彸涓婅娴姩鎸夐挳瀹瑰櫒銆?
- `DataBaker CVPC / 鏌冲窞璇濊剼鏈琡 褰撳墠宸叉帴鍏?beta 骞冲彴涓庤剼鏈厓鏁版嵁锛?  - 鏂板 `dataBakerCvpc` 骞冲彴鍜?`dataBakerCvpcLiuzhouAssistant` 鑴氭湰銆?  - `extension/manifest.json` 宸茶ˉ `https://cvpc.data-baker.com/*` host permission 涓?content script 娉ㄥ叆銆?  - 寤剁画鐜版湁 beta 鍙鎬т綋绯伙細public 鍖呬笌鏈В閿?beta 鍖呴兘涓嶆樉绀鸿骞冲彴鍜岃剼鏈€?- 鎵╁睍杩愯鏃跺綋鍓嶆柊澧烇細
  - `extension/sites/data-baker-cvpc/liuzhou-helper/`
  - 褰撳墠鍙湪 `/app/editor/asr/` 鐢熸晥锛屾彁渚涘綋鍓嶉煶棰戠敾娈靛缓璁€佸綋鍓嶆 AI 鎺ㄨ崘銆佸綋鍓嶆瀹為獙鎬у～鍏ャ€佸綋鍓嶆 `Valid / Invalid` 蹇嵎鍏ュ彛銆?  - 鍥哄畾杈圭晫锛氫笉鑷姩淇濆瓨銆佷笉鑷姩鎻愪氦銆佷笉鑷姩鍒囦笅涓€鏉°€佷笉璺ㄥ綋鍓嶉煶棰戣嚜鍔ㄩ亶鍘嗐€?- 鐙珛鍚庣褰撳墠鏂板锛?  - `GET /api/data-baker-cvpc/liuzhou-helper/segment/health`
  - `POST /api/data-baker-cvpc/liuzhou-helper/segment/preview`
  - `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/health`
  - `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/defaults`
  - `POST /api/data-baker-cvpc/liuzhou-helper/ai/recommend`
- 瑙勫垯璧勪骇褰撳墠宸插叆搴擄細
  - `platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-rules.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-pronunciation-reference.csv`
- settings/options 褰撳墠宸茶ˉ锛?  - `extension/shared/storage.js` 鏂板 CVPC 骞冲彴褰掍竴涓庡惎鍋滃悓姝ャ€?  - `extension/options/options.html`銆乣extension/options/options.js` 鏂板 CVPC 鏌冲窞璇濊鎯呴潰鏉夸笌淇濆瓨鍏ュ彛銆?- 褰撳墠浠嶆槑纭繚鐣欑殑闃诲锛?  - 鐪熷疄 `segment create/update` payload
  - 淇濆瓨閾捐矾
  - 椤甸潰瀛楁绋冲畾鍐欏叆濂戠害
  - 鏈娴嬪埌瀹夊叏鍐欏叆妗ユ椂锛岀敾娈靛簲鐢ㄤ粛鍙繑鍥炴彁绀猴紝涓嶇洿鎺ョ敾娈?
## 2026-06-05锛圓ishell 涓夋澘鍧楃浜岃疆浼樺寲锛?
- `甯屽皵璐濆３ / 闂藉崡璇姪鎵媊 褰撳墠鍦ㄢ€滀笁鏉垮潡鈥濆熀纭€涓婄户缁紭鍖栨墽琛岀瓥鐣ワ細
  - `杞崲` 鏀逛负鈥滆鍒欎紭鍏?+ 姝т箟鏃?AI 鍏滃簳鈥濄€?  - `鍚煶`銆乣姣旇緝` 淇濇寔鐙珛璇锋眰锛涘垏鍒?Omni 姣旇緝鏃朵粛鍗曠嫭鎵ц绗笁娈佃姹傘€?- 璇嶈〃杞崲褰撳墠涓嶅啀鎶?`minnan-lexicon.csv` 鍘熷鏂囨湰鍧楁暣娈靛缁欒浆鎹㈡ā鍨嬶細
  - 鍚庣杩愯鏃朵細鍏堟妸 CSV 鎶曞奖鎴愮粨鏋勫寲鏄犲皠銆?  - 瑙勫垯鏇挎崲鍙寜 `瀵瑰簲鍗庤 -> 寤鸿鐢ㄥ瓧` 鍋氭渶闀垮尮閰嶃€?  - 鍙湁鍛戒腑澶氬€欓€夋垨鍒囧垎鍐茬獊鏃讹紝鎵嶄細鎶?`ruleConvertedText + ambiguousSegments` 鍙戠粰杞崲妯″瀷鍏滃簳銆?- Aishell pipeline 褰撳墠缁х画鎸変笁娈电嫭绔嬫椂搴忔墽琛岋細
  - `杞崲` 涓?`鍚煶` 骞惰
  - `姣旇緝` 绛夊緟鍓嶄袱娈靛畬鎴愬悗鍗曠嫭杩愯
- options / 璇婃柇 / 鏂囨。鍚屾鏇存柊锛?  - 鍚煶鍗′笌姣旇緝鍗″綋鍓嶆仮澶嶄负鈥滀笁娈电嫭绔嬭姹傗€濆彛寰勩€?  - 杞崲鍗″綋鍓嶄細鏄庣‘鎻愮ず鈥滄ā鍨嬪彧鍦ㄨ瘝琛ㄦ涔夋椂鍙備笌鍏滃簳鈥濄€?  - 璇婃柇鍖哄綋鍓嶆仮澶嶆樉绀?`杞崲+鍚煶骞惰 / Omni 姣旇緝`銆?
## 2026-06-05锛圓ishell 鐪熶笁鏉垮潡閲嶆瀯锛?
- `甯屽皵璐濆３ / 闂藉崡璇姪鎵媊 宸插彇娑堟棫 `妯″瀷鏂规 + 璇嗗埆绛栫暐` 鍙ｅ緞锛屽墠鍚庣缁熶竴鏀规垚鐙珛鐨?`杞崲 / 鍚煶 / 姣旇緝` 涓夋澘鍧楋細
  - `杞崲` 涓?`鍚煶` 骞惰鎵ц銆?  - `姣旇緝` 蹇呴』绛夊緟鍓嶄袱娈甸兘瀹屾垚鍚庡啀杩愯銆?- Aishell options / storage / runtime 褰撳墠宸插垏鍒版柊瀛楁锛?  - `aiRecommendConvert*`
  - `aiRecommendListen*`
  - `aiRecommendCompareFamily`
  - `aiRecommendCompareModel`
  - `aiRecommendCompareQwenPrompt`
  - `aiRecommendCompareOmniPrompt`
  - `aiRecommendCompare*`
- 鍓嶇褰撳墠鍙彂 `aiStages` 璇锋眰浣擄細
  - `convert = { model, prompt, params }`
  - `listen = { model, prompt, params }`
  - `compare = { family, model, prompt, params, adoptionThreshold }`
- Aishell backend 褰撳墠宸叉敼鎴愪笁闃舵鐙珛 defaults / health锛?  - 杩斿洖 `stages.convert / listen / compare`
  - 涓嶅啀璁╁墠绔緷璧?`modelModeOptions / recognitionStrategyOptions / promptProfiles`
- Aishell pipeline 褰撳墠宸叉敼鎴愶細
  - `杞崲鏂囨湰 convertedText`
  - `鍚煶鏂囨湰 heardText`
  - `鎺ㄨ崘鏂囨湰 recommendedText`
  - Qwen 姣旇緝鍙仛鏂囨湰鍒ゆ柇锛汷mni 姣旇緝浼氬湪姣旇緝闃舵鍐嶆鍚煶
- 缁撴灉涓庤瘖鏂瓧娈靛悓姝ユ洿鏂帮細
  - 缁撴灉鍖轰富瀛楁鏀逛负 `convertedText`
  - `meta.models` 鏂板 `convertModel / listenModel / compareModelFamily / compareModel`
  - `meta.timing` 鏂板 `convertDurationMs`
  - `meta.usage` 鏂板 `convert`
- Aishell 璇嶈〃褰撳墠涓嶅啀瑕佹眰涓?DataBaker `byte-for-byte` 涓€鑷达紱鏈疆瀵?`minnan-lexicon.csv` 鍋氫簡灏忚寖鍥撮珮纭畾鎬ф牸寮忔竻鐞嗐€?
## 2026-06-05锛圓ishell 鍊欓€?Prompt 寮哄寲涓?Omni/Fun-ASR 鍒嗘祦锛?
- `甯屽皵璐濆３ / 闂藉崡璇姪鎵媊 鐨?`audio_first_reference` 褰撳墠缁х画淇濇寔鈥滀笁鏂囨湰瀵圭収鈥濓紝浣嗛摼璺凡鎸夊惉闊虫ā鍨嬫槑纭垎娴侊細
  - 鍊欓€夎浆鍐欓樁娈靛浐瀹氬厛璺戯紝缁х画浣跨敤鐙珛鍊欓€夎浆鍐欐ā鍨嬨€?  - `listenModel=Omni`锛氳蛋鈥滃€欓€夎浆鍐欐ā鍨?-> Omni 鍚煶骞跺悓姝ュ垽鏂樊寮傗€濓紝涓嶅啀璋冪敤宸紓姣旇緝妯″瀷銆?  - `listenModel=fun-asr`锛氳蛋鈥滃€欓€夎浆鍐欐ā鍨?-> Fun-ASR -> 宸紓姣旇緝妯″瀷鈥濅笁娈甸摼璺€?- Aishell 鍊欓€夎浆鍐?Prompt 褰撳墠宸插己鍖栦负鈥滈椊鍗楄瘽 + 璇 + 璇嶈〃闄勪欢鈥濆彛寰勶細
  - 榛樿 `candidatePrompt` 鐜板湪鏄庣‘瑕佹眰鎶婁换鍔＄悊瑙ｄ负闂藉崡璇?闂藉崡璇€欓€夎浆鍐欍€?  - 鍊欓€夐樁娈典細鍚屾椂闄勫甫 `璇嶈〃鐩稿叧璇嶆潯` 涓?`璇嶈〃鍘熷CSV闄勪欢` 缁欐ā鍨嬶紝涓嶅啀鍙粰绠€鍖栬瘝琛ㄤ笂涓嬫枃銆?- Aishell options / runtime 褰撳墠宸茶ˉ榻?Omni/Fun-ASR 鑱斿姩锛?  - 鍚煶妯″瀷涓?Omni 鏃讹紝闅愯棌 `宸紓姣旇緝妯″瀷`銆?  - 鍚屼竴涓?`comparePrompt` 瀛樺偍閿湪 Omni 璺緞涓嬩細鏄剧ず涓?`Omni鍒ゆ柇 Prompt锛堝彲閫夛級`銆?  - 鍒囧洖 Fun-ASR 鏃讹紝鎭㈠ `宸紓姣旇緝妯″瀷` 涓?`宸紓姣旇緝 Prompt锛堝彲閫夛級`锛涢殣钘忔湡闂村凡淇濆瓨鐨?compare model / prompt 涓嶄涪澶便€?- 鍓嶇 Aishell runtime 褰撳墠浼氬湪 Omni 鍚煶璺緞涓嬬渷鐣ヨ姹備綋椤跺眰 `compareModel`锛屼絾缁х画淇濈暀 `comparePrompt` 浣滀负 Omni 鍒ゆ柇 Prompt 鍙戝線鍚庣銆?- 鍥炲綊楠岃瘉鏂板瑕嗙洊锛?  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js` 瑕嗙洊鍊欓€?Prompt 闄勪欢銆乣two_stage + Omni` 璺宠繃 compare 妯″瀷銆乣comparePrompt` 澶嶇敤涓?Omni 鍒ゆ柇 Prompt銆?  - `extension/sites/aishell-tech/minnan-helper/batch-pipeline.test.js` 瑕嗙洊 Omni 璺緞璇锋眰浣撲笉鍐嶆惡甯﹂《灞?`compareModel`銆?  - `extension/options/options-aishell-tech-ui.test.js` 瑕嗙洊 options 婧愮爜鍖呭惈 `Omni鍒ゆ柇 Prompt锛堝彲閫夛級`銆丱mni 闅愯棌姣旇緝妯″瀷涓庤仈鍔ㄦ彁绀烘枃妗堛€?
## 2026-06-05锛圓ishell 鍊欓€夎浆鍐欐仮澶嶄负 AI 骞跺紑鏀剧嫭绔嬮厤缃級

- `甯屽皵璐濆３ / 闂藉崡璇姪鎵媊 鐨?`璇嶈〃杞啓鏂囨湰` 褰撳墠宸蹭粠鈥滅函浠ｇ爜鍊欓€夎浆鍐欌€濇仮澶嶄负鈥滅嫭绔嬪€欓€夎浆鍐欐ā鍨嬬敓鎴愨€濓細
  - 鍒犻櫎 `platform-resources/aishell-tech/minnan-helper/backend/lexicon-candidate.js`
  - 鍒犻櫎 `platform-resources/aishell-tech/minnan-helper/backend/reference/minnan-lexicon-rules.json`
  - 鍊欓€夐樁娈垫敼涓哄厛鐢辨枃鏈ā鍨嬬粨鍚?`pageText + minnan-lexicon.csv` 涓婁笅鏂囩敓鎴?`lexiconCandidateText`
- Aishell 鍚庣褰撳墠閲嶆柊鏆撮湶鍊欓€夐樁娈甸厤缃細
  - `defaults / health / promptProfiles` 鐜板湪鏂板 `candidateModelOptions / candidateModel / candidatePrompt`
  - compare 闃舵缁х画浣跨敤 `heardText + lexiconCandidateText + pageText`
  - `candidateDurationMs` 鎭㈠琛ㄧず鍊欓€夋ā鍨嬭皟鐢ㄨ€楁椂
- Aishell options / runtime 褰撳墠宸茶ˉ榻愬€欓€夐樁娈电嫭绔嬮厤缃細
  - 鏂板 `璇嶈〃杞啓妯″瀷`
  - 鏂板 `璇嶈〃杞啓 Prompt锛堝彲閫夛級`
  - 璇锋眰浣撲細鎶?`candidateModel / candidatePrompt` 鍙戝線鍚庣
- 宸紓姣旇緝閾捐矾褰撳墠缁х画淇濈暀锛?  - `two_stage` 涓嬫寜鈥滃€欓€夎浆鍐欐ā鍨?-> 鍚煶妯″瀷 -> 宸紓姣旇緝妯″瀷鈥濇墽琛?  - `omni_single` 涓嬩篃浼氬厛鐢熸垚鍊欓€夋枃鏈紝鍐嶇敱 Omni 鍦ㄥ崟娆″惉闊充腑鍒ゆ柇宸紓椤硅淇濈暀鍝竴渚?- 鍥炲綊楠岃瘉琛ュ己锛?  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js` 鏀逛负瑕嗙洊鈥滃€欓€夐樁娈电嫭绔嬭皟妯″瀷銆乧ompare 鑱氱劍 differenceSegments銆佷綆缃俊淇濈暀 heardText銆侀珮缃俊鍏佽娣峰悎閲囩撼鍊欓€夆€?  - `extension/shared/storage.aishell-tech.test.js`銆乣extension/sites/aishell-tech/minnan-helper/batch-pipeline.test.js`銆乣extension/options/options-shared-asr-ai-panel.test.js` 鍚屾瑕嗙洊鍊欓€夋ā鍨嬩笌鍊欓€?Prompt 閰嶇疆

## 2026-06-05锛圓ishell 涓夋枃鏈鐓ф柟妗堟敹鍙ｄ笌缁撴灉灞曠ず澧炲己锛?
- `甯屽皵璐濆３ / 闂藉崡璇姪鎵媊 褰撳墠宸蹭笉鍐嶄繚鐣欐棫鐨?`mandarin_to_dialect` 涓?`direct_dialect` 涓ゅ璇嗗埆鏂规銆?- Aishell 鍓嶅悗绔€乷ptions銆乻torage 涓?runtime 褰撳墠缁熶竴鍙繚鐣?`audio_first_reference`锛?  - 榛樿缁勫悎鏀跺彛涓?`two_stage + audio_first_reference + qwen3.5-omni-flash + qwen3.5-plus`
  - 鏃ч厤缃噷濡傛灉浠嶄繚瀛樻棫绛栫暐鍊硷紝杩愯鏃朵細缁熶竴褰掍竴鍒?`audio_first_reference`
  - options 椤典笉鍐嶆樉绀?Aishell 鐨?`璇嗗埆绛栫暐` 涓嬫媺锛沗璇嶈〃鍊欓€夋牎姝ｉ槇鍊糮 缁х画淇濈暀
- `甯屽皵璐濆３闂藉崡璇帹鑽恅 褰撳墠缁撴灉鍗″寮猴細
  - 鏂板 `鍘熷鏂囨湰`
  - 鏂板 `璇嶈〃杞啓鏂囨湰`锛堝€欓€夎浆鍐欐ā鍨嬬粨鍚?`pageText + minnan-lexicon.csv` 涓婁笅鏂囩敓鎴愮殑闂藉崡璇€欓€夛級
  - 鏂板 `鍚煶鏂囨湰 vs 璇嶈〃杞啓鏂囨湰` 宸紓楂樹寒灞曠ず
  - 鍘?`璇嶈〃鍊欓€夋枃鏈琡 浠庤瘖鏂尯绉婚櫎锛岄伩鍏嶅拰涓荤粨鏋滃尯閲嶅
- 鍥炲綊楠岃瘉琛ュ己锛?  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js` 鏇存柊涓哄彧鏍￠獙 `audio_first_reference`
  - `extension/shared/storage.aishell-tech.test.js` 鏇存柊涓哄彧鏍￠獙 Aishell 褰掍竴鍒?`audio_first_reference`
  - `extension/options/options-shared-asr-ai-panel.test.js` 鏇存柊涓?Aishell 涓嶅啀鏄剧ず璇嗗埆绛栫暐瀛楁

## 2026-06-05锛圓ishell 闊抽浼樺厛鍊欓€夋牎姝ｅ崌绾э級

- `甯屽皵璐濆３ / 闂藉崡璇姪鎵媊 鐨?`audio_first_reference` 绛栫暐褰撳墠宸插崌绾т负鈥滀笁鏂囨湰瀵圭収鈥濓細
  - `pageText`
  - `lexiconCandidateText`锛氱敱鍊欓€夎浆鍐欐ā鍨嬬粨鍚?`pageText` 涓?`minnan-lexicon.csv` 涓婁笅鏂囩敓鎴愮殑鏍囧噯闂藉崡璇€欓€夋枃鏈?  - `heardText`
- 鍚庣 `pipeline.js` 鐜板凡鏂板鍊欓€夋牎姝ｄ笂涓嬫枃锛?  - 鍊欓€夋枃鏈綋鍓嶆敼涓虹敱鐙珛鍊欓€夐樁娈垫ā鍨嬬敓鎴愶紝鍐嶆妸 `heardText + lexiconCandidateText + pageText` 浜ょ粰宸紓姣旇緝妯″瀷
  - 鏈€缁?`lexicon.rewriteMode` 浠嶅浐瀹氫负 `off`锛屼笉浼氶噸鏂板紑鍚己鍒惰瘝琛ㄦ敼鍐?  - 褰?`correctionConfidence < audioFirstReferenceCorrectionThreshold` 鏃讹紝浼氫紭鍏堜繚鐣?`heardText` 骞舵爣璁?`needHumanReview=true`
- Aishell options / storage / runtime 鏂板 `璇嶈〃鍊欓€夋牎姝ｉ槇鍊糮锛?  - 瀛樺偍瀛楁锛歚aiRecommendAudioFirstReferenceCorrectionThreshold`
  - 璇锋眰瀛楁锛歚aiOptions.audioFirstReferenceCorrectionThreshold`
  - 榛樿鍊硷細`0.75`
  - 鍒囧埌闈?`audio_first_reference` 鏃跺彧闅愯棌锛屼笉鍒犻櫎宸蹭繚瀛樺€?- 褰撳墠璇嗗埆缁撴灉璇婃柇鍖烘柊澧烇細
  - `璇嶈〃鍊欓€夋枃鏈琡
  - `鏍℃闃堝€糮
  - `鏍℃缃俊搴
  - 璇︾粏 `candidateDecisions` 缁х画鐣欏湪鍘熷 JSON / 鍚庣璇婃柇閲?- 鍥炲綊楠岃瘉琛ュ己锛?  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js` 鏂板鍊欓€夋枃鏈敓鎴愩€佷綆缃俊鍥為€€鍜岄珮缃俊閲囩敤鍊欓€夊啓娉曡鐩?  - `extension/shared/storage.aishell-tech.test.js` 鏂板闃堝€奸粯璁ゅ€间笌鑷畾涔夊€间繚鐪熻鐩?  - `extension/sites/aishell-tech/minnan-helper/batch-pipeline.test.js` 鏂板鍓嶇鎶?`audioFirstReferenceCorrectionThreshold` 鍙戠粰鍚庣鐨勮鐩?
## 2026-06-05锛圓ishell 闊抽浼樺厛璇嗗埆绛栫暐锛?
- `甯屽皵璐濆３ / 闂藉崡璇姪鎵媊 鏂板绗笁绉嶈瘑鍒瓥鐣?`audio_first_reference`锛屽墠绔樉绀哄悕鍥哄畾涓?`闊抽浼樺厛锛屾枃鏈弬鑰僠銆?- 鍚庣褰撳墠宸茶ˉ榻愮涓夌绛栫暐鐨?defaults / health / 璇锋眰褰掍竴 / Prompt profile锛?  - 鍚煶闃舵鎸夊疄闄呭彂闊宠緭鍑猴紝鍏佽鏅€氳瘽璇嶅拰闂藉崡璇瘝娣峰悎瀛樺湪銆?  - 姣旇緝闃舵鎶?`pageText` 鍜岄椊鍗楄瀛楄瘝琛ㄦ敹鍙ｄ负鈥滆蒋鍙傝€冣€濓紝涓嶅啀涓诲鏀瑰啓銆?  - 闊抽閲屾病鏈夎鍑虹殑璇嶄笉琛ュ洖锛涢煶棰戜笉娓呮椂缁х画閫氳繃 `needHumanReview=true` 鏍囪銆?- `platform-resources/aishell-tech/minnan-helper/backend/pipeline.js` 褰撳墠宸叉寜绛栫暐鏀跺彛璇嶈〃鍚庡鐞嗭細
  - `audio_first_reference` 浠嶄細鏋勫缓 lexicon context 缁欐ā鍨嬪弬鑰冦€?  - 浣?`lexicon.rewriteMode` 鐜板浐瀹氫负 `off`锛屼笉浼氬啀璧板悗绔?`aggressive` 寮哄埗璇嶈〃鏀瑰啓銆?- 鍓嶇涓庨厤缃悓姝ヨˉ榻愶細
  - `extension/shared/constants.js`銆乣extension/shared/storage.js`銆乣extension/options/options.js`銆乣extension/sites/aishell-tech/minnan-helper/content.js` 鐜伴兘鎺ュ彈 `audio_first_reference`銆?  - options 椤?`璇嗗埆绛栫暐` 涓嬫媺鏂板 `闊抽浼樺厛锛屾枃鏈弬鑰僠銆?  - Aishell `姣旇緝妯″瀷` 鏂囨浼氭寜璇ョ瓥鐣ユ樉绀轰负 `姣旇緝/鍙傝€冩ā鍨媊銆?- 鍥炲綊楠岃瘉琛ュ己锛?  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js` 鐜拌鐩栫涓夌绛栫暐銆乸romptProfiles 涓?`lexicon.rewriteMode=off`銆?  - `extension/shared/storage.aishell-tech.test.js` 鐜拌鐩?`audio_first_reference` 瀛樺偍淇濈湡銆?  - `extension/sites/aishell-tech/minnan-helper/batch-pipeline.test.js` 鐜拌鐩栧墠绔?runtime 浼氭妸 `recognitionStrategy=audio_first_reference` 鍙戠粰鍚庣銆?
## 2026-06-05锛堝墠绔苟鍙戣涔夌粺涓€涓鸿姹傜獥鍙ｇ亴婊★級

- 鏂板 `extension/shared/concurrent-ai-request-stream.js`锛屾妸鍏变韩鍓嶇骞跺彂璇箟缁熶竴涓猴細
  - 鍥哄畾 `50ms` 閿欏嘲鍙戣捣銆?  - 鍚姩鍚庡厛鎶婂墠绔姹傜獥鍙ｇ亴婊″埌褰撳墠骞跺彂涓婇檺銆?  - 鏌愭潯 AI 涓€鏃﹁繑鍥烇紝灏辩珛鍗抽噴鏀?1 涓墠绔姹傛Ы浣嶅苟琛ュ彂涓嬩竴鏉°€?  - AI 缁撴灉鎸夊畬鎴愰『搴忚繘鍏ョ紦鍐插尯锛涢〉闈㈠～鍏?/ 淇濆瓨缁х画鎸夊悇鑴氭湰鑷繁鐨勫畨鍏ㄩ摼璺覆琛屾墽琛屻€?- `extension/sites/aishell-tech/minnan-helper/content.js` 褰撳墠宸叉敼鎴愨€淎I 璇锋眰娴佹按绾?+ 淇濆瓨娴佹按绾库€濊В鑰︼細
  - 鍋滄鍚庝笉鍐嶅彂璧锋柊鐨?AI 璇锋眰锛涘綋鍓嶄繚瀛樻楠ゆ敹灏惧悗缁撴潫鏈疆銆?  - 鎵归噺鐘舵€佽ˉ鍏?`鍓嶇骞跺彂 / 鍙戦€侀棿闅?/ 宸插彂璇锋眰 / AI澶勭悊涓?/ AI宸茶繑鍥?/ 寰呬繚瀛橀槦鍒梎銆?- `extension/sites/data-baker/round-one-quality/content.js` 鐨勮繛缁～鍏ョ幇鏀逛负澶嶇敤鍚屼竴鍏变韩骞跺彂娴侊紝涓嶆敼瀵瑰浜у搧琛屼负锛屽彧鏀跺彛鍐呴儴骞跺彂璇箟銆?- 绯荤粺浠〃鐩樻ā鍨嬫睜褰撳墠浼樺厛灞曠ず `鎬诲崰鐢?= activeCount + pendingCount`锛屽苟鍥哄畾鍖哄垎锛?  - `姝ｅ湪璋冪敤涓婃父`
  - `绛夊緟鍙戣捣`
  - `姹犲閲廯
  - `鍓╀綑鍙帴鏀禶
- 鏂板 / 鏇存柊楠岃瘉锛?  - `extension/shared/concurrent-ai-request-stream.test.js`
  - `extension/sites/aishell-tech/minnan-helper/batch-pipeline.test.js`
  - `platform-resources/backend/admin-dashboard/overview.test.js`

## 2026-06-05锛圖ataBaker CVPC 棣栬疆璧勬枡鍒濆鍖栵級

- 鏂板骞冲彴璧勬枡鐩綍 `platform-resources/data-baker-cvpc/`锛屼綔涓哄叏鏂板钩鍙板垵濮嬪寲鍏ュ彛锛涘綋鍓嶆湭鍒涘缓 `extension/sites/data-baker-cvpc/`锛屼篃鏈帴鍏ヤ笓灞炲悗绔€?- 棣栬疆缃戠粶璧勬枡宸茶ˉ榻愶細
  - `network/01-login-and-boot.md`
  - `network/02-post-login-shell-home.md`
  - `network/03-home-to-editor-route.md`
  - `network/04-editor-asr-init.md`
  - `network/pending-capture.md`
  - `network/next-session-handoff.md`
- 棣栬疆椤甸潰缁撴瀯璧勬枡宸茶ˉ榻愶細
  - `page-structure/01-login-and-shell.md`
  - `page-structure/02-post-login-home.md`
  - `page-structure/03-home-to-editor-route.md`
  - `page-structure/04-editor-asr.md`
  - `page-structure/pending-capture.md`
- 棣栬疆鑼冨洿鍥哄畾涓猴細
  - `#/login` 璺敱琛屼负
  - `#/home`
  - `#/my-job`
  - `#/my-job/:projectId/callout`
  - `#/my-job/:projectId/callout/:taskProcessId/:taskId/job?...`
  - `/app/editor/asr/?...`
- 鏂囨。缁熶竴寮曞叆 4 涓爣璁帮細
  - `routeKey`
  - `riskLevel`
  - `selectorConfidence`
  - `requestClass`
- 褰撳墠瀹夊叏杈圭晫锛?  - 鍙繚鐣欒劚鏁忕粨鏋勬憳瑕侊紝涓嶆彁浜?HAR銆佸師濮嬪嚟璇併€佸畬鏁寸鍚?URL銆佺湡瀹炶浆鍐欏唴瀹?  - `棰嗗彇 / 淇濆瓨 / 鎸傝捣 / 鎻愪氦 / 淇敼` 绛夊姩浣滅户缁寜 `write-action` 澶勭悊锛屾湰杞湭瑙﹀彂
- 鍚屾鏇存柊锛?  - `docs/platforms-index.md`
  - `README.md`

## 2026-06-05锛堥椊鍗楄鍔╂墜 AI 璁剧疆甯冨眬缁熶竴涓庡苟鍙戦粯璁ゅ€兼敹鍙ｏ級

- DataBaker 涓?Aishell 涓や釜闂藉崡璇姪鎵嬬殑 `AI 杩炵画濉叆骞跺彂鏁伴噺` 榛樿鍊煎凡缁熶竴鏀跺彛涓?`5`銆?  - Omni锛氳寖鍥?`1~25`
  - Fun-ASR锛氳寖鍥?`1~50`
- `extension/options/options.html` 涓?`extension/options/options.js` 褰撳墠宸插幓鎺?DataBaker 鏃х殑鈥滃乏渚у熀纭€璁剧疆鍏堟覆鏌擄紝鍐嶆惉杩愯繘 AI 闈㈡澘鈥濈殑鍏煎鍐欐硶銆?- 鏂板 `extension/options/options-shared-asr-ai-panel.js`锛?  - 缁熶竴鎻忚堪 DataBaker / Aishell / Magic Data 鍏变韩 `AI 璁剧疆` 鐨勫瓧娈甸『搴忎笌鏄剧ず瑙勫垯銆?  - DataBaker 涓?Aishell 鐨?`AI 杩炵画濉叆骞跺彂鏁伴噺` 鐜板湪鐢卞叡浜?AI 闈㈡澘鐩存帴娓叉煋銆?  - Aishell 鐨勫苟鍙戝瓧娈靛凡浠庡乏渚?`鍩虹璁剧疆` 绉诲埌鍙充晶 `AI 璁剧疆`锛屼笌 DataBaker 浣跨敤鍚屼竴鍥哄畾椤哄簭銆?- `extension/shared/constants.js`銆乣extension/shared/storage.js`銆乣extension/options/options.js`銆乣extension/sites/data-baker/round-one-quality/content.js`銆乣extension/sites/aishell-tech/minnan-helper/content.js` 鐜板湪缁熶竴鎶婇粯璁ゅ€笺€佺┖鍊煎洖閫€鍊煎拰闈炴硶鍊煎綊涓€鍊兼敹鍙ｄ负 `5`銆?- `platform-resources/backend/ai/config.js` 涓?`platform-resources/data-baker/round-one-quality/backend/ai-service.js` 鐨勫苟鍙戣鍒欒瘖鏂枃妗堝凡鍚屾涓烘柊榛樿鍊硷紝閬垮厤 health/defaults 涓庡墠绔樉绀哄垎鍙夈€?- 鏂囨。鍚屾鏇存柊锛?  - `README.md`
  - `extension/sites/data-baker/round-one-quality/README.md`
  - `extension/sites/aishell-tech/minnan-helper/README.md`
  - `platform-resources/data-baker/round-one-quality/README.md`
  - `platform-resources/data-baker/round-one-quality/backend/README.md`
  - `platform-resources/aishell-tech/minnan-helper/README.md`
  - `platform-resources/backend/README.md`
  - `platform-resources/backend/ai/README.md`

## 2026-06-05锛圓ishell Tech 鎵归噺璇嗗埆鎸夐挳鎷嗗垎锛?
- 鏇存柊 `extension/sites/aishell-tech/minnan-helper/ui-panel.js`锛?  - 鍘熷崟涓?`AI鎵归噺璇嗗埆` 鎸夐挳鎷嗘垚 `鍏ㄩ儴AI鎵归噺璇嗗埆`銆乣鏈畬鎴愮殑AI鎵归噺璇嗗埆` 鍜?`鍋滄鎵归噺` 涓変釜鍘熺敓宸ュ叿鍖烘寜閽€?  - 鍗曟潯璇嗗埆鎴栦换涓€鎵归噺杩愯鏃讹紝涓や釜鎵归噺鎸夐挳浼氱粺涓€绂佺敤锛涘彧鏈夋壒閲忚繍琛屼腑鎵嶅惎鐢?`鍋滄鎵归噺`銆?- 鏇存柊 `extension/sites/aishell-tech/minnan-helper/content.js`锛?  - 鎵归噺鎵ц閾捐矾鏀跺彛鎴愬甫 `mode=all|pending` 鐨勫鐢ㄥ叆鍙ｃ€?  - 椤甸潰鍙屾寜閽垎鍒搴斺€滄暣鍖呭叏閲忛噸璺戔€濆拰鈥滃彧澶勭悊鏈畬鎴愭潯鐩€濄€?  - 鐜版湁蹇嵎閿?`autoFillQualifiedItem` 淇濇寔涓嶅彉锛岀户缁搴斺€滄湭瀹屾垚鐨凙I鎵归噺璇嗗埆鈥濄€?  - 杩愯涓枃妗堟敼鎴愬弻鍏ュ彛鍙ｅ緞锛岀┖缁撴灉銆佸畬鎴愬拰鍋滄鎻愮ず浼氭槑纭尯鍒嗏€滃叏閮ㄢ€濅笌鈥滄湭瀹屾垚鈥濄€?- 鏇存柊 `extension/sites/aishell-tech/minnan-helper/data-api.js`锛?  - `getBatchTasksForPackage()` 涓?`createBatchTasksFromPackageItems()` 鏂板 `mode` 閫夐」銆?  - `pending` 妯″紡缁х画璺宠繃 `dataStatus === 2`锛沗all` 妯″紡鏀逛负淇濈暀鏁村寘鎵€鏈夋潯鐩€?- 鏂囨。鍚屾锛?  - `extension/sites/aishell-tech/minnan-helper/README.md`
  - `platform-resources/aishell-tech/minnan-helper/README.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/sites/aishell-tech/minnan-helper/ui-panel.js`
  - `node --check extension/sites/aishell-tech/minnan-helper/content.js`
  - `node --check extension/sites/aishell-tech/minnan-helper/data-api.js`
  - 鍐呰仈 Node 鏂█锛氶獙璇?`createBatchTasksFromPackageItems(..., { mode: 'all' })` 浼氫繚鐣欏凡瀹屾垚鏉＄洰锛岃€?`mode: 'pending'` 浠嶄細杩囨护宸插畬鎴愭潯鐩€?
## 2026-06-05锛圓ishell Tech 闂藉崡璇爣鍑嗗榻愬埌 DataBaker 涓€妫€璐ㄦ锛?
- 瀵归綈 `Aishell Tech / minnan-helper` 鐨勯椊鍗楄鏍囧噯锛?  - `platform-resources/aishell-tech/minnan-helper/backend/reference/minnan-lexicon.csv` 鐜板凡鐩存帴鍚屾涓?`platform-resources/data-baker/round-one-quality/backend/reference/minnan-lexicon.csv` 鐨勫悓鐗堝唴瀹广€?  - 鍚庣榛樿璇嗗埆绛栫暐鏀逛负 `mandarin_to_dialect`銆?  - 鍚庣榛樿姣旇緝妯″瀷鏀逛负鍏变韩/DataBaker 榛樿鍊?`qwen3.5-plus`銆?- 淇 `platform-resources/aishell-tech/minnan-helper/backend/ai-service.js`锛?  - `GET /api/aishell-tech/minnan-helper/ai/recommend/defaults` 褰撳墠榛樿杩斿洖 `two_stage + mandarin_to_dialect + qwen3.5-omni-flash + qwen3.5-plus`銆?  - 淇 `promptProfiles` 鏄犲皠閿欒锛宍mandarin_to_dialect` 涓?`direct_dialect` 鐜板湪鍚勮嚜杩斿洖鑷繁鐨勯粯璁?Prompt銆?  - 榛樿 Prompt 褰撳墠琛ラ綈 DataBaker 涓€妫€璐ㄦ绾︽潫锛氭櫘閫氫腑鏂囩粺涓€绠€浣擄紝鍛戒腑璇嶈〃寤鸿鐢ㄥ瓧鏃跺繀椤讳繚鐣欙紝涓嶅啀鎶婃柟瑷€寤鸿鐢ㄥ瓧鏀瑰洖鏅€氳瘽鍚屼箟璇嶃€?- 鍚屾鏀跺彛鍓嶇榛樿鍊间笌鏃ч粯璁よ縼绉伙細
  - `extension/shared/constants.js`
  - `extension/shared/storage.js`
  - `extension/sites/aishell-tech/minnan-helper/content.js`
  - 绌洪厤缃笌杩愯鏃跺厹搴曢粯璁ゅ€肩粺涓€鏀逛负 `mandarin_to_dialect + qwen3.5-plus`銆?  - 浠呭綋娴忚鍣ㄩ噷浠嶆槸鏃у嚭鍘傞粯璁ょ粍鍚?`two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash` 鏃讹紝鎵嶈嚜鍔ㄨ縼绉诲埌鏂版爣鍑嗭紱鑷畾涔夐厤缃繚鎸佷笉鍔ㄣ€?  - Aishell 鍏煎闀滃儚瀛楁 `recognitionStrategy / recognitionMode / pipelineMode / compareModel` 涔熶細鍚屾鍒板綋鍓嶅綊涓€缁撴灉锛岄伩鍏?options銆乻torage 涓庤繍琛屾椂娣疯窇銆?- 鏂囨。鍚屾鏇存柊锛?  - `README.md`
  - `docs/platforms-index.md`
  - `platform-resources/aishell-tech/README.md`
  - `platform-resources/aishell-tech/minnan-helper/README.md`
  - `platform-resources/aishell-tech/minnan-helper/backend/README.md`
  - `extension/sites/aishell-tech/minnan-helper/README.md`
  - 缁熶竴鏀逛负锛欰ishell 榛樿鏍囧噯瀵归綈 DataBaker 涓€妫€璐ㄦ锛岄粯璁ら摼璺负 `POST /jobs` + 杞锛宍POST /recommend` 鍙繚鐣欏吋瀹?/ 璋冭瘯鐢ㄩ€斻€?- 鏂板鍥炲綊娴嬭瘯锛?  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js`
  - `extension/shared/storage.aishell-tech.test.js`
- 鏈疆楠岃瘉锛?  - `node --test platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js extension/shared/storage.aishell-tech.test.js`

## 2026-06-05锛堜慨澶?CRX 鎵撳寘鑴氭湰閿欒瀵煎叆锛?
- 淇 `node scripts/package-crx-release.js --notes "CRX enterprise release"` 鍚姩鍗虫姤锛?  - `[crx-release] buildEmptyLocalBuildMetaContent is not a function`
- 鏍瑰洜锛?  - `scripts/package-crx-release.js` 浠嶄粠 `package-crx-build-profile.js` 璇诲彇 `buildEmptyLocalBuildMetaContent`
  - 璇ュ嚱鏁板疄闄呭凡杩佺Щ鍒?`scripts/build-meta-local.js`
- 褰撳墠宸叉敼涓轰粠 `build-meta-local.js` 鍗曠嫭瀵煎叆绌?stub 鐢熸垚鍑芥暟锛屾仮澶嶆寮忓寘 / beta 鍖呮墦鍖呮祦绋嬨€?- 鏂板鍥炲綊娴嬭瘯锛?  - `scripts/package-crx-release-source.test.js`
- README 褰撳墠鍚屾琛ュ厖锛?  - 鏈湴 beta 鍙ｄ护鍏ュ彛鍏堟墽琛?`node scripts/sync-local-build-meta.js`
  - 姝ｅ紡鎵撳寘鍛戒护缁х画浣跨敤 `node scripts/package-crx-release.js --notes "CRX enterprise release"`

## 2026-06-04锛堟湰鍦?beta 鍙ｄ护鏀逛负浠?config 鍚屾锛宑onfig 鏂囨。缁熶竴鏀跺彛锛?
- 淇鏈湴寮€鍙戣€呮ā寮忕洿鍔犺浇 `extension/` 鏃剁偣鍑婚殣钘忓叆鍙ｆ彁绀衡€滃綋鍓?beta 鍖呮湭閰嶇疆鍙ｄ护锛屾棤娉曡В閿佲€濈殑闂銆?- 褰撳墠鏂板锛?  - `scripts/build-meta-local.js`
  - `scripts/sync-local-build-meta.js`
  - `extension/shared/build-meta.local.js` 鏈湴瑕嗙洊鏈哄埗锛堟枃浠舵湰韬凡鍔犲叆 `.gitignore`锛?- `options/options.html` 涓?`popup/popup.html` 褰撳墠浼氬湪 `build-meta.js` 鍚庣户缁姞杞?`build-meta.local.js`銆?- `background/service-worker.js` 褰撳墠涔熶細灏濊瘯鎸夊彲閫夋枃浠舵柟寮忓姞杞芥湰鍦?override锛涙枃浠剁己澶辨椂鑷姩蹇界暐銆?- `scripts/package-crx-release.js` 褰撳墠浼氬湪涓存椂鎵撳寘鐩綍涓妸 `build-meta.local.js` 瑕嗙洊鎴愬畨鍏?stub锛岄伩鍏嶆妸鏈湴绉佹湁 beta 鍙ｄ护 hash 甯﹁繘姝ｅ紡鍖呮垨 beta ZIP銆?- `config` 鏂囨。褰撳墠缁熶竴鏀跺彛鍒帮細
  - `config/README.md`
  - 涓嶅啀淇濈暀 `config/release/README.md` 涓?`config/secrets/README.md`
- 鏈疆楠岃瘉锛?  - `node --test scripts/build-meta-local.test.js extension/options/options-beta-unlock.test.js`
  - `node --check scripts/build-meta-local.js`
  - `node --check scripts/sync-local-build-meta.js`
  - `node --check scripts/package-crx-release.js`
  - `node --check extension/background/service-worker.js`
  - `node scripts/sync-local-build-meta.js`

## 2026-06-04锛堟湰鍦扮洿鍔犺浇榛樿 beta 閫氶亾锛屼絾榛樿闅愯棌 beta 鍐呭锛?
- 淇涓婁竴杞敊璇疄鐜帮細`beta` 閫氶亾涓嶅啀榛樿鍏ㄦ樉銆?- `extension/shared/build-meta.js` 褰撳墠榛樿鏀逛负锛?  - `releaseChannel=beta`
  - `betaFeaturesVisibleByDefault=false`
  - 榛樿 beta 鍚庣鍦板潃鍥哄畾涓?`http://47.109.197.170:3333`
- `extension/` 婧愮爜鐩綍鍦?Chrome / Edge 寮€鍙戣€呮ā寮忕洿鎺ュ姞杞芥椂锛屽綋鍓嶉粯璁や粛灞炰簬 beta 閫氶亾锛屼絾 beta 骞冲彴銆乥eta 鑴氭湰涓?`Beta 鏈嶅姟鍣╜ 榛樿闅愯棌锛屽彧鏈夎Е鍙戦殣钘忓叆鍙ｅ苟杈撳叆姝ｇ‘鍙ｄ护鍚庢墠鏄剧ず銆?- 姝ｅ紡鎵撳寘鍙ｅ緞淇濇寔涓嶅彉锛?  - `public` 缁х画鍙睍绀哄叕寮€骞冲彴涓庡叕寮€鑴氭湰
  - `beta` 缁х画鎵撴垚鍗曚竴 `annotation-script-center-beta.zip`
  - beta ZIP 浼氳嚜鍔ㄥ啓鍏?`betaFeaturesVisibleByDefault=false`
- `extension/options/options.js` 褰撳墠鎭㈠涓洪殣钘忚В閿佸彛寰勶細
  - 杩炵画鐐瑰嚮宸︿笂瑙掑搧鐗屽浘鐗?`7` 娆″悗鎵嶈Е鍙?beta 鍙ｄ护杈撳叆
  - 椤甸潰渚ф爮涓嶅啀涓诲姩鏄剧ず beta 瑙ｉ攣鎻愮ず鏂囨
- 鏈疆楠岃瘉锛?  - `node --test extension/shared/build-meta.test.js`
  - `node --test extension/shared/constants.release.test.js`
  - `node --test scripts/package-crx-build-profile.test.js`
  - `node --check extension/shared/build-meta.js`
  - `node --check extension/shared/constants.js`
  - `node --check scripts/package-crx-build-profile.js`
  - `node --check extension/options/options.js`

## 2026-06-04锛圕RX 鎵撳寘鍛戒护鏀跺彛涓哄崟琛屽弻浜х墿锛?
- `scripts/package-crx-release.js` 褰撳墠榛樿涓嶅啀鍙墦鍗曢€氶亾锛?  - 鏈樉寮忎紶 `--channel` 鏃讹紝浼氬湪涓€娆℃墽琛屼腑鍚屾椂鐢熸垚姝ｅ紡鍖呬笌 beta 鍖?  - 姝ｅ紡鍖呯户缁骇鍑?`CRX + ZIP + update.xml + crx-latest.json`
  - beta 鍖呯户缁骇鍑哄崟涓€ `annotation-script-center-beta.zip`
- 鎵撳寘榛樿鍊煎凡鏀跺彛鍒?`config`锛?  - 鏂板 `config/package-crx-release.json`
  - 鏂板 `config/release/README.md`
  - 鏈湴绉佹湁 `config/secrets/package-crx-release.local.json` 鐢ㄤ簬淇濆瓨 `betaUnlockPasswordSha256`
  - 榛樿 beta 鍚庣鍦板潃鍥哄畾涓?`http://47.109.197.170:3333`
- `.gitignore` 褰撳墠宸插厑璁?`dist/annotation-script-center-beta.zip` 鍙備笌 Git 璺熻釜锛屽苟蹇界暐鏈湴绉佹湁 `config/secrets/package-crx-release.local.json`
- beta 鎵撳寘鍙傛暟褰撳墠鏀寔鐩存帴璧板懡浠よ锛岄伩鍏嶅厛鍐欏琛岀幆澧冨彉閲忥細
  - `--betaUnlockPasswordSha256`
  - `--betaBackendBaseUrl`
- 浠嶄繚鐣欐寜闇€鍗曠嫭鎵撳寘锛?  - `--channel public`
  - `--channel beta`
- 鏈疆楠岃瘉锛?  - `node --test scripts/package-crx-build-profile.test.js`
  - `node --check scripts/package-crx-build-profile.js`
  - `node --check scripts/package-crx-release.js`

## 2026-06-04锛坆eta 鏋勫缓銆侀殣钘忚В閿佷笌 Lightwheel 鍙鎬ф敹鍙ｏ級

- 鎵╁睍鏂板鍏变韩鏋勫缓鍏冧俊鎭細
  - `extension/shared/build-meta.js`
  - `public / beta` 鍙戣閫氶亾
  - beta 瑙ｉ攣鍙ｄ护 hash 涓庨粯璁?beta 鍚庣鍦板潃娉ㄥ叆鑳藉姏
- `extension/shared/constants.js` 涓?`extension/shared/storage.js` 褰撳墠宸茶ˉ榻愶細
  - `releaseChannel`
  - `betaUnlocked / betaUnlockedAt / betaBackendBaseUrl`
  - `Beta 鏈嶅姟鍣╜ 鍚庣妯″紡
  - `Lightwheel` 浣滀负 beta 骞冲彴鐨勭粺涓€鍙鎬у垽鏂?- options 褰撳墠宸叉帴鍏?beta 闅愯棌瑙ｉ攣锛?  - 杩炵画鐐瑰嚮宸︿笂瑙掑搧鐗屽浘鐗?`7` 娆″悗鍙緭鍏?beta 鍙ｄ护
  - 瑙ｉ攣鎴愬姛鍚庢妸鐘舵€佷繚瀛樺埌鏈湴缂撳瓨
  - 褰撳墠椤甸潰鐩存帴澧為噺鏄剧ず beta 骞冲彴銆乥eta 鑴氭湰涓?`Beta 鏈嶅姟鍣╜
  - 閫€鍑?beta 妯″紡鏃朵細娓呯┖瑙ｉ攣鎬侊紝骞舵妸褰撳墠鍏ㄥ眬鍚庣妯″紡浠?`beta` 鍥為€€鍒版寮忔湇鍔″櫒
- popup 褰撳墠宸蹭慨姝?`Lightwheel` 鍛戒腑鍙ｅ緞锛?  - 姝ｅ紡鍖呬笉鏄剧ず
  - beta 鍖呮湭瑙ｉ攣涓嶆樉绀?  - beta 鍖呭凡瑙ｉ攣浣?`Lightwheel` 琚鐢ㄦ椂涔熶笉鏄剧ず
- 鎵撳寘鑴氭湰褰撳墠宸叉敮鎸佸弻鏋勫缓锛?  - `public`锛氱户缁骇鍑?`annotation-script-center-v<version>.crx`銆乣ZIP`銆乣update.xml`銆乣crx-latest.json`
  - `beta`锛氫骇鍑哄崟涓€ `annotation-script-center-beta.zip`
  - beta 鏋勫缓浼氬啓鍏?`version_name=beta`锛屽苟閫氳繃涓存椂鏋勫缓鐩綍娉ㄥ叆 build meta锛沺ublic 鏋勫缓浼氳繃婊?`Lightwheel` host 鏉冮檺
- 鏈疆楠岃瘉锛?  - `node --test extension/shared/constants.release.test.js scripts/package-crx-build-profile.test.js`
  - `node --test extension/options/options-workbench-state.test.js platform-resources/backend/admin-download-center/releases.test.js`
  - `node --check extension/shared/constants.js`
  - `node --check extension/shared/storage.js`
  - `node --check extension/options/options.js`
  - `node --check extension/popup/popup.js`
  - `node --check extension/background/service-worker.js`
  - `node --check scripts/package-crx-release.js`
  - `node -`锛堣В鏋?`extension/manifest.json` 骞剁‘璁ゆ墍鏈変緷璧?`shared/constants.js` 鐨?content script 閮藉厛鍔犺浇 `shared/build-meta.js`锛?
## 2026-06-04锛坆eta 鏋勫缓涓庨殣钘忚В閿佹柟妗堣璁★級

- 鏂板 `docs/superpowers/specs/2026-06-04-beta-build-and-hidden-unlock-design.md`锛岀敤浜庢敹鍙?`v0.4.0` 鐨勬寮忓寘 / beta 鍖呮柟妗堛€?- 鏈疆璁捐鍥哄畾浠ヤ笅杈圭晫锛?  - 姝ｅ紡鍖呬笌 beta 鍖呭叡鐢ㄤ富浠ｇ爜锛屼笉闀挎湡鍒嗗弶
  - `鑴氭湰涓嬭浇涓績` 鍙睍绀烘寮忓寘锛宐eta 鍖呭彧閫氳繃鈥滄煡鐪嬪閮ㄧ洰褰曗€濊幏鍙?  - beta 鍖呴粯璁ょ晫闈笌姝ｅ紡鐗堜竴鑷达紝鍙湁鈥滈殣钘忎氦浜?+ 鍙ｄ护鈥濊В閿佸悗鎵嶅閲忔樉绀?beta 骞冲彴銆乥eta 鑴氭湰涓?`Beta 鏈嶅姟鍣╜
  - popup / 鍙充笂瑙掑懡涓彁绀轰笉鑳藉彧鐪?URL锛屽繀椤诲鐢ㄧ粺涓€鍙鎬х姸鎬侊紱beta 骞冲彴琚鐢ㄥ悗涔熶笉寰楃户缁樉绀哄懡涓?- 褰撳墠浠?`Lightwheel` 浣滀负 beta 骞冲彴绀轰緥锛屾槑纭簡鍔熻兘闈㈡澘銆佽剼鏈鎯呫€佸懡涓娴嬩笌绯荤粺绠＄悊鐨勭粺涓€杩囨护鍙ｅ緞銆?
## 2026-06-04锛圠abelX 灞€閮ㄨ鐩栧鍑?+ 绯荤粺浠〃鐩樻枃浠舵棩蹇楋級

- Alibaba LabelX ASR 杞啓 / ASR 蹇垽鐨?`forceReplaceByBatchId` 璇箟鏀逛负鈥滃眬閮ㄨ鐩栧綋鍓嶄汉鍛樷€濓細
  - 鍚庣缁х画浠?`鍒嗗寘ID` 褰掑苟 CSV 琛岋紝浣嗕笉鍐嶆寜 `replaceBatchIds` 鍒犳暣琛岄噸寤?  - 杞啓鍙鐩栧綋鍓?`label / audit` 瑙掕壊鍒楋紝蹇垽鍙鐩栧懡涓殑鏍囨敞鍛樻Ы浣嶆垨瀹℃牳鍒?  - 绌哄瓧娈典笉鍐嶆妸鏃у€兼竻绌猴紝閬垮厤鎸変汉鍒嗘壒瀵煎嚭鏃舵妸鍚屽垎鍖呭叾浠栧垪瑕嗙洊鎺?- 棣栭〉鎵嬪姩琛ヤ紶鍏ュ彛缁熶竴鏀瑰悕涓衡€滆ˉ浼犲苟瑕嗙洊褰撳墠浜哄憳鈥濓細
  - 浠呭湪棣栭〉鎵嬪姩涓婁紶涓旀湰杞?`skippedCompleteCount > 0` 鏃舵樉绀?  - 璇︽儏椤电户缁笉鎻愪緵璇ュ叆鍙?  - 涓婁紶鎻愮ず鏂囨鍚屾鏀规垚灞€閮ㄨ鐩栬涔夛紝涓嶅啀鏄剧ず鈥滃垹闄ゆ棫琛屸€?- 绯荤粺绠＄悊 `?view=admin&tab=overview` 閲嶆柊鎵╂垚涓夊潡锛?  - 妯″瀷姹犲崰鐢?  - 鏈€杩?`24` 灏忔椂鏃ュ織缁熻姒傚喌
  - 鏈€杩戣繍琛屾棩蹇楋紙榛樿杩?`20` 鏉★級
- 鍚庣杩愯鏃ュ織鏀逛负鏂囦欢鎸佷箙鍖栵細
  - `platform-resources/backend/runtime-log-store.js` 缁х画淇濈暀鍐呭瓨鏈€杩戦」锛屽悓鏃舵妸鍚庡彴鎿嶄綔 / 杩愮淮浜嬩欢鎸夊ぉ鍐欏叆 `platform-resources/backend/admin-dashboard/runtime-data/runtime-YYYY-MM-DD.jsonl`
  - 鏂囦欢榛樿淇濈暀 `7` 澶╋紱PM2 閲嶅惎鍚庝粛鍙鍙栬繎 `7` 澶╁簲鐢ㄦ棩蹇楋紝浣嗕笉浼氱洿鎺ヨ鍙?PM2 stdout/stderr
  - 浠〃鐩樿嚜鍔ㄥ埛鏂版垚鍔熶簨浠朵笉钀芥寔涔呮棩蹇楋紝閬垮厤琚?`60` 绉掕疆璇㈠埛婊?- 鏈疆楠岃瘉锛?  - `node --test platform-resources/alibaba-labelx/asr-transcription/backend/payload-merge.test.js platform-resources/alibaba-labelx/asr-judgement/backend/payload-merge.test.js platform-resources/backend/runtime-log-store.test.js platform-resources/backend/admin-dashboard/overview.test.js platform-resources/backend/admin-dashboard/runtime-logs.test.js`

## 2026-06-03锛堝姛鑳介潰鏉挎嫋鎷戒氦浜掔粏淇級

- `extension/options/` 缁х画鍙皟鏁村姛鑳介潰鏉垮墠绔氦浜掞紝涓嶆敼鍚庣鎺ュ彛鍜岃剼鏈缃?schema銆?- 鍔熻兘闈㈡澘缂栬緫椤哄簭褰撳墠鍘绘帀浜嗙嫭绔嬫嫋鍔ㄦ墜鏌勶細
  - 杩涘叆缂栬緫妯″紡鍚庯紝鍙洿鎺ユ寜浣忔暣涓钩鍙板尯鍧楀紑濮嬫嫋鍔?  - 骞冲彴鍐呮寜閽笌鍏ュ彛鏍囩鍦ㄧ紪杈戞€佷笅鑷姩閫€涓轰笉鍙偣鍑伙紝閬垮厤璇Е
- 骞冲彴鎺掑簭鐨勮窡鎵嬫诞灞傛敼鎴愮洿鎺ヤ娇鐢ㄧ湡瀹炲钩鍙板崱鐗囷細
  - 鎷栧姩鏃惰兘鐪嬪埌褰撳墠骞冲彴鏉垮潡璺熼殢榧犳爣绉诲姩
  - 鍘熶綅缃户缁繚鐣欏崰浣嶅潡
  - 鍦ㄧ洰鏍囧尯鍩熷仠鐣欑害 `0.2s` 鍚庯紝鍛ㄥ洿骞冲彴鍧楄嚜鍔ㄨ浣?- 鏂囨。宸插悓姝ユ洿鏂颁负鈥滄暣鍧楁嫋鍔?+ 鐪熷疄鍗＄墖璺熸墜鈥濈殑鍙ｅ緞銆?
## 2026-06-02锛堝姛鑳介潰鏉夸笁鍒楄剼鏈崱涓庤鎯呴〉鍙岃建宸ヤ綔鍙扮簿淇級

- `extension/options/` 缁х画鏀跺彛鍔熻兘闈㈡澘涓庤剼鏈鎯呴〉鍓嶇缁撴瀯锛屼笉鏀瑰悗绔帴鍙ｄ笌鑴氭湰璁剧疆 schema銆?- 鍔熻兘闈㈡澘骞冲彴鍖哄潡缁х画淇濈暀鈥滃乏渚у钩鍙版憳瑕?+ 鍙充晶鑴氭湰鍖衡€濓紝浣嗗彸渚ц剼鏈尯褰撳墠宸叉敼鎴愮湡姝ｇ殑娴佸紡鑴氭湰鍗″竷灞€锛?  - 瀹藉睆姣忚鏈€澶?`3` 涓剼鏈崱
  - 涓睆鍥炶惤涓?`2` 鍒?  - 绐勫睆鍥炶惤涓?`1` 鍒?  - 姣忓紶鑴氭湰鍗＄户缁繚鐣欌€滀笂灞傛搷浣?+ 涓嬪眰椤圭洰澶囨敞鈥濓紝鍏朵腑 `椤圭洰澶囨敞` 鏀规垚鏇存煍鍜岀殑搴曟爮寮忚鏄庢澘鍧?- 璇︽儏椤靛綋鍓嶄粠鍏变韩绛夐珮 grid 鏀规垚鈥滀袱鏉＄嫭绔嬬旱杞ㄢ€濓細
  - 宸﹁建鎵胯浇 `鍩虹璁剧疆` 涓庝笅鏂?`蹇嵎閿甡
  - 鍙宠建鎵胯浇 `AI 璁剧疆`
  - 鍙充晶 AI 闈㈡澘鎸夎嚜韬唴瀹硅嚜鐒跺楂橈紝涓嶅啀涓轰簡閫傞厤宸︿晶鑰岃鎷夋垚闀跨櫧鏉?  - 鍙墿涓€涓澘鍧楁椂缁х画淇濇寔宸﹀崐瀹?- 骞冲彴鎺掑簭浜や簰浠庡師鐢?`drag/drop` 鍗囩骇涓鸿嚜瀹氫箟鎷栨嫿锛?  - 缂栬緫妯″紡涓嬫嫋鍔ㄦ暣涓钩鍙板尯鍧楁椂锛屽崱鐗囦細璺熼殢榧犳爣绉诲姩
  - 鍘熶綅缃繚鐣欏崰浣嶅潡
  - 杩涘叆鐩爣鍖哄煙鍋滅暀绾?`0.2s` 鍚庯紝鍛ㄥ洿骞冲彴鍖哄潡鑷姩璁╀綅骞跺甫绾靛悜婊戠Щ鍔ㄧ敾
  - 涓磋繎椤甸潰涓婁笅杈圭紭鏃惰嚜鍔ㄦ粴鍔紝鏉炬墜鍚庣户缁妸鎺掑簭淇濆瓨鍒?`settings.meta.publicCenterPlatformOrder`
- 鏈疆楠岃瘉锛?  - `node --check extension/options/options.js`
  - `node --check extension/options/options-workbench-state.js`
  - `node --check extension/shared/storage.js`
  - `node --test extension/options/options-workbench-state.test.js extension/options/options-route-state.test.js`

## 2026-06-02锛堝姛鑳介潰鏉挎帓搴忕紪杈戜笌璇︽儏椤靛眰鍙犲伐浣滃彴绮句慨锛?
- `extension/options/` 缁х画鏀跺彛鍏紑椤典笌璇︽儏椤碉細
  - 宸︿晶瀵艰埅銆佸綋鍓嶈鍥惧拰鍏紑椤?hero 鏂囨缁熶竴浠?`鍏紑鑴氭湰涓績` 鏀逛负 `鍔熻兘闈㈡澘`
  - 鑻辨枃 kicker 浠?`PUBLIC SCRIPT CENTER` 鏀逛负 `FUNCTION PANEL`
- 鍔熻兘闈㈡澘鏂板骞冲彴鎺掑簭缂栬緫鑳藉姏锛?  - 椤堕儴鏂板 `缂栬緫椤哄簭 / 瀹屾垚缂栬緫`
  - 榛樿娴忚鎬佷笉鍙嫋鍔?  - 缂栬緫鎬佷笅浠呭厑璁告嫋鍔ㄦ暣涓钩鍙板尯鍧椾笂涓嬮噸鎺?  - 閫氳繃 `settings.meta.publicCenterPlatformOrder` 鎸佷箙鍖栨湰鏈?UI 椤哄簭
  - 鎷栧姩鏃朵负鐩搁偦骞冲彴鍖哄潡鎻愪緵涓婁笅婊戠Щ涓庡惛闄勬寚绀猴紝`prefers-reduced-motion` 涓嬭嚜鍔ㄩ檷绾?- 骞冲彴鍏ュ彛灞曠ず涓庤烦杞綋鍓嶄紭鍏堣蛋鏄惧紡瀛楁锛?  - `鏍囪礉鏄撻噰` -> `datafactory.data-baker.com/v2`
  - `Abaka AI` -> `abao.fortidyndns.com:30473`
- 鍔熻兘闈㈡澘骞冲彴鍖哄潡褰撳墠鏀跺彛涓轰笁灞傜粨鏋勶細
  - 椤跺眰骞冲彴韬唤鍖?  - 涓眰鑴氭湰鎿嶄綔鍖?  - 搴曞眰鏁磋娴呰摑鈥滈」鐩娉ㄢ€?- 鑴氭湰璇︽儏椤佃繘涓€姝ユ敼鎴愬眰鍙犲伐浣滃彴锛?  - 鍚仠鍖虹户缁暣瀹界疆椤?  - `鍩虹璁剧疆` 浣滀负宸︿晶涓昏建
  - `AI 璁剧疆` 浣滀负鍙充晶楂樻爮
  - `蹇嵎閿甡 浣滀负鍩虹璁剧疆涓嬫柟鐙珛闀垮甫
  - 缂哄け鏌愬潡鏃跺叾浣欐澘鍧楄嚜鍔ㄥ墠绉伙紱鍙墿鍗曞潡鏃朵繚鎸佸乏鍗婂
- 鏈疆楠岃瘉锛?  - `node --check extension/options/options-workbench-state.js`
  - `node --check extension/options/options.js`
  - `node --check extension/shared/constants.js`
  - `node --check extension/shared/storage.js`
  - `node --test extension/options/options-workbench-state.test.js extension/options/options-route-state.test.js`
  - 鐪熷疄鎵╁睍椤甸潤鎬佸鏌ワ細
    - `?view=center`
    - `?view=script&script=transcription`
    - `?view=script&script=lightwheelViewPanel`

## 2026-06-02锛堝叕寮€涓績鑴氭湰鍗′袱灞傚寲涓庤鎯呴〉涓夋澘鍧楅噸鎺掞級

- 缁х画鏀跺彛 `extension/options/` 鐨勫叕寮€鑴氭湰涓績涓庤剼鏈鎯呴〉锛?  - 姣忎釜鑴氭湰鍗℃敼鎴愨€滀笂灞傚乏鍙充俊鎭?+ 涓嬪眰鏁磋椤圭洰澶囨敞鈥濈殑涓ゅ眰缁撴瀯銆?  - `椤圭洰澶囨敞` 缁熶竴鏀规垚娴呰摑涓€ф暣琛屾澘鍧楋紝涓嶅啀濉炲湪宸﹀彸涓诲竷灞€涓€?  - 骞冲彴鍩熷悕鍏ュ彛涓嶅啀鍙寜 `matches` 鎺ㄥ锛涘綋鍓嶄紭鍏堣鍙栧钩鍙版樉寮?`displayHost / entryUrl`锛屽苟鍦ㄦ柊鏍囩椤垫墦寮€銆?- 鐢ㄦ埛鍙鍚嶇О涓庡叆鍙ｅ湴鍧€缁熶竴锛?  - `闃块噷ASR璇煶杞啓` -> `鏅€氳瘽璇煶杞啓`
  - `闃块噷ASR璇煶鍒ゅ埆` -> `鏅€氳瘽璇煶鍒ゅ埆`
  - `Abaka AI` 鍏ュ彛鏄剧ず涓庤烦杞粺涓€涓?`abao.fortidyndns.com:30473`
  - `鏍囪礉鏄撻噰` 鍏ュ彛鏄剧ず涓庤烦杞粺涓€涓?`datafactory.data-baker.com/v2`
- 鑴氭湰璇︽儏椤靛綋鍓嶆敼鎴愪笁鏉垮潡宸ヤ綔鍙帮細
  - 鍚仠鍖虹户缁暣瀹界疆椤?  - 鍚仠鍖轰笅鏂瑰浐瀹氭寜 `鍩虹璁剧疆 -> AI 璁剧疆 -> 蹇嵎閿甡 椤哄簭杩涘叆涓ゅ垪缃戞牸
  - 鍏变韩 AI 閰嶇疆缁х画澶嶇敤 `detail-shared-asr-ai-panel`
  - Task21 鐨?AI 璋冭瘯鍖轰粠鍩虹璁剧疆涓媶鍑猴紝鏀规垚鐙珛 `AI 璁剧疆` 鏉垮潡
  - 杞啓銆佸垽鍒€佹爣璐濇槗閲囥€丮agic Data銆丄ishell銆丄baka 鐨勫揩鎹烽敭鍖哄凡浠庡熀纭€璁剧疆涓媶鍑猴紝鍙樻垚鐙珛蹇嵎閿澘鍧?- 鏍峰紡鍚屾鏀跺彛锛?  - 缁熶竴涓夌被璇︽儏闈㈡澘鐨勯棿璺濄€佸唴杈硅窛銆佽緭鍏ユ/涓嬫媺妗?textarea 灏哄涓庤竟妗嗛鏍?  - 蹇嵎閿潰鏉挎敼涓烘洿娓呮櫚鐨勫垪琛ㄥ紡鍗＄墖甯冨眬锛屽噺灏戣繛缁櫧鏉垮爢鍙犳劅
- 鏈疆楠岃瘉锛?  - `node --check extension/options/options.js`
  - `node --check extension/options/options-route-state.js`
  - `node --check extension/shared/constants.js`

## 2026-06-02锛堝叕寮€涓嬭浇椤电嫭绔嬩笌璇︽儏椤靛乏鍙冲伐浣滃彴鏀跺彛锛?
- options 宸︿晶瀵艰埅鏂板鍏紑 `鑴氭湰涓嬭浇涓績`锛?  - 鏂拌矾鐢?`?view=downloads`
  - 鍏紑鍙繘鍏ワ紝涓嶈姹傜郴缁熺鐞嗗瘑鐮?  - 鏃?`?view=admin&tab=downloads` 褰撳墠鑷姩鍥炶惤鍒?`?view=admin&tab=exports`
- 涓や釜鍙充笂瑙掆€滆剼鏈笅杞戒腑蹇冣€濇寜閽Щ闄わ紱鍏紑涓嬭浇鑳藉姏涓嶅啀鎸傚湪 hero 鍙充笂瑙掋€?- 绯荤粺绠＄悊椤电浠?`涓嬭浇涓績` 鏀逛负 `鏁版嵁瀵煎嚭`锛?  - 鍙繚鐣欓」鐩暟鎹笅杞?  - 鍙繚鐣?AI 璇锋眰璁板綍瀵煎嚭
  - 鎵╁睍鐗堟湰涓嬭浇瀹屽叏绉诲嚭鍚庡彴
- 鍏紑鑴氭湰涓績骞冲彴鍗＄户缁敹鍙ｏ細
  - 鍒犻櫎鈥滃綋鍓嶅钩鍙拌剼鏈粺涓€鏀跺彛鍒板姛鑳介潰鏉?..鈥濊鏄庢€ф鏂?  - 鍒犻櫎鑴氭湰鍗″簳閮ㄢ€滃尮閰嶅叆鍙?/ 鍏ュ彛鈥濆厓淇℃伅
  - 鑴氭湰澶囨敞鍖烘敼涓哄崟鍧?`椤圭洰澶囨敞`
  - `script.note + script.description` 鍚屾椂瀛樺湪鏃跺悎骞舵垚涓€娈电畝瑕佸姛鑳借鏄?- 鑴氭湰璇︽儏椤甸噸鎺掍负鐪熸鐨勫伐浣滃彴甯冨眬锛?  - 鍚仠鎿嶄綔鍗曠嫭缃《涓烘暣瀹藉崱鐗?  - 涓嬫柟鍥哄畾涓衡€滃乏渚у熀纭€璁剧疆 / 鍙充晶 AI 璁剧疆鈥?  - 娌℃湁 AI 璁剧疆鐨勮剼鏈嚜鍔ㄩ殣钘忓彸鏍忥紝鍩虹璁剧疆鍗犳弧鏁磋
- 鎵╁睍鐗堟湰鍒楄〃鎺ュ彛 `GET /api/admin/download-center/releases` 褰撳墠鏀逛负鍏紑鍙锛屼緵鍏紑涓嬭浇椤电洿鎺ヨ鍙栥€?- 鏈疆楠岃瘉锛?  - `node --check extension/options/options.js`
  - `node --check extension/options/options-route-state.js`
  - `node --check platform-resources/backend/admin-download-center/routes.js`
  - `node --check platform-resources/backend/admin-download-center/releases.js`
  - `node --test extension/options/options-route-state.test.js`
  - `node --test platform-resources/backend/admin-download-center/releases.test.js`

## 2026-06-02锛堝叕寮€鑴氭湰涓績鍏ュ彛涓庝笅杞戒腑蹇冪増鏈€夋嫨浼樺寲锛?
- 鍏紑鑴氭湰涓績骞冲彴鎽樿涓殑鍩熷悕鏍囩鏀逛负鍙偣鍑诲叆鍙ｏ細
  - 鎸夊钩鍙?`matches` 鐨勭涓€涓?URL 妯″紡鎺ㄥ鏍瑰煙鍚?  - 淇濈暀鍗忚涓庣鍙?  - 鐐瑰嚮鍚庡湪鏂版爣绛鹃〉鎵撳紑锛屼笉鎵撴柇褰撳墠 options 宸ヤ綔鍙?- 鍏紑鑴氭湰涓績鑴氭湰鍗′腑閮ㄦ枃妗堝尯鏀规垚鈥滈」鐩娉?/ 褰撳墠鍔熻兘鈥濊鍥撅細
  - 浼樺厛鏄剧ず `script.note`
  - `note + description` 鍚屾椂瀛樺湪鏃舵媶鎴愨€滀袱娈靛紡澶囨敞鈥?  - 鍙湁 `description` 鏃惰嚜鍔ㄥ洖閫€涓哄崟娈佃鏄?- 绯荤粺绠＄悊鈥滀笅杞戒腑蹇冣€濇柊澧炴墿灞曠増鏈笅杞介潰鏉匡細
  - 榛樿绐佸嚭鏈€鏂扮増 CRX
  - 鍘嗗彶鐗堟湰鏀逛负涓嬫媺妗嗛€夋嫨
  - 褰撳墠閫変腑鐗堟湰鎸夊瓨鍦ㄦ€у睍绀?`CRX` 涓讳笅杞芥寜閽拰鍙€?`ZIP` 娆′笅杞芥寜閽?  - 闈㈡澘淇濈暀鈥滄墦寮€澶栭儴鐩綍鈥濅綔涓哄厹搴曞叆鍙?- 缁熶竴鍚庣鏂板 `GET /api/admin/download-center/releases`锛?  - 鑱氬悎 `annotation-script-center-crx-latest.json`
  - 瑙ｆ瀽杩滅 `/downloads/` 鐩綍椤典腑鐨勫巻鍙?`annotation-script-center-v*.crx/.zip`
  - 鐩綍绱㈠紩鎶撳彇澶辫触鏃跺洖閫€涓衡€滀粎杩斿洖鏈€鏂扮増鈥?- 鏈疆楠岃瘉锛?  - `node --check extension/options/options.js`
  - `node --check platform-resources/backend/admin-download-center/releases.js`
  - `node --check platform-resources/backend/admin-download-center/routes.js`
  - `node --check platform-resources/backend/registry.js`
  - `node --check platform-resources/backend/app.js`
  - `node --test platform-resources/backend/admin-download-center/releases.test.js platform-resources/backend/admin-dashboard/overview.test.js extension/options/options-route-state.test.js`

## 2026-06-02锛堟ā鍨嬫睜鍗犵敤鏀逛负涓枃鐘舵€佸崱锛屽苟鍒囨崲涓?999 鎬诲閲忚涔夛級

- 绯荤粺绠＄悊浠〃鐩樼户缁彧淇濈暀鈥滄ā鍨嬫睜鍗犵敤鈥濓紝浣嗗墠绔笉鍐嶆樉绀?`娲昏穬 x / y 路 鎺掗槦 z` 鎶€鏈枃妗堛€?- 妯″瀷姹犲睍绀虹幇鏀逛负涓枃鐘舵€佸崱锛?  - `姝ｅ湪澶勭悊`
  - `绛夊緟澶勭悊`
  - `姹犲閲廯
  - `鍓╀綑鍙帴鏀禶
  - 杈呭姪鐘舵€佺粺涓€涓?`褰撳墠鍗犵敤 / 褰撳墠绌洪棽 / 鍚庣姹犲凡婊
- 鍚庣 `model:*` 鍏变韩妯″瀷姹犺涔夋敼涓猴細
  - 鍗曚釜妯″瀷姹犳€诲閲忛粯璁?`999`
  - 鎬诲閲?= `activeCount + pendingCount`
  - 杈惧埌 `999` 鍚庣珛鍗宠繑鍥?`provider-queue-full`
  - 璇锋眰缁х画鎸?FIFO 椤哄簭鎺掗槦锛屽苟淇濇寔 `50ms` 涓€娆″彂鍑烘満浼?- 鏂板/鏇存柊娴嬭瘯锛?  - provider queue 榛樿妯″瀷姹犲閲忔柇瑷€鏀逛负 `999`
  - 琛ュ厖鈥滅 1000 涓姹傛嫆缁濃€濆拰鈥淔IFO + 50ms 鍙戣捣椤哄簭鈥濇祴璇?  - 棰濆鎵ц 65 绉掑悗绔瓨娲婚獙璇侊紝纭涓嶆槸鍙惎鍔ㄦ垚鍔?
## 2026-06-02锛堢郴缁熶华琛ㄧ洏鏀剁缉涓烘ā鍨嬫睜鍗犵敤锛?
- 闂鑳屾櫙锛?  - 鐢ㄦ埛鍙嶉绯荤粺绠＄悊浠〃鐩樻寔缁┖鐧斤紝骞朵笂浼犱簡鏈嶅姟鍣ㄦ帶鍒跺彴鏃ュ織銆?  - 鏃ュ織鏄剧ず鍚庣鍦ㄥ惎鍔ㄥ悗绾?1 鍒嗛挓鍐呭嚭鐜?`JavaScript heap out of memory` 骞惰 PM2 鍙嶅鎷夎捣銆?- 鏈鏀跺彛锛?  - 鍓嶇 `?view=admin&tab=overview` 鍙繚鐣欌€滄ā鍨嬫睜鍗犵敤鈥濆崱鐗囷紝绉婚櫎澶辫触鎽樿銆佽秼鍔裤€佽皟鐢ㄦ帓琛屻€佽剼鏈憳瑕佷笌杩愯鏃ュ織灞曠ず銆?  - 鍓嶇浠〃鐩樺彧璇锋眰 `GET /api/admin/dashboard/overview`锛屼笉鍐嶉澶栬姹傝繍琛屾棩蹇楁帴鍙ｃ€?  - 鍚庣 `admin-dashboard/overview` 鏀规垚杞婚噺杩斿洖锛氬彧淇濈暀妯″瀷姹?queue 蹇収銆佸悗绔姸鎬佸拰涓嬭浇涓績鎽樿锛屼笉鍐嶈仛鍚?AI 璋冪敤缁熻銆?- 楠岃瘉锛?  - 杩愯 `node --test platform-resources/backend/admin-dashboard/overview.test.js` 閫氳繃銆?  - 棰濆鎵ц涓存椂 60 绉?soak 娴嬭瘯涓?65 绉掑悗绔瓨娲绘祴璇曪紝纭鑱氬悎鍑芥暟涓庡悗绔繘绋嬮兘鑳界ǔ瀹氳繍琛岃秴杩?1 鍒嗛挓锛涢獙璇佸悗宸插垹闄や复鏃舵祴璇曟枃浠躲€?
## 2026-06-02锛堢郴缁熶华琛ㄧ洏鎺ュ叆鍚庣鑱氬悎涓庤繍琛屾棩蹇楋級

- 缁х画瀹屽杽 `extension/options/` 鐨勭郴缁熺鐞嗕华琛ㄧ洏锛?  - 灏嗗師鏉ョ殑鈥滆繍琛岀粺璁♀€濆苟鍏?`?view=admin&tab=overview`锛屼笉鍐嶄繚鐣欑嫭绔嬮〉绛?  - 浠〃鐩樼粺涓€灞曠ず妯″瀷姹犲崰鐢ㄣ€佸け璐ユ憳瑕併€佽繎 14 澶╄秼鍔裤€佽皟鐢ㄤ汉鎺掕銆佽剼鏈粺璁″拰鏈€杩戣繍琛屾棩蹇?  - 椤堕儴鈥滃埛鏂版暟鎹€濈户缁繚鐣欙紝鍚屾椂鏂板姣?`60` 绉掕嚜鍔ㄥ埛鏂颁竴娆＄殑鍓嶇杞
  - 鏃?`?view=admin&tab=stats` 閾炬帴鍥為€€鍒?`overview`
- 鍚庣鏂板绯荤粺绠＄悊杩愯鏃ュ織鑳藉姏锛?  - 鏂板 `platform-resources/backend/runtime-log-store.js` 浣滀负杞婚噺鍐呭瓨鏃ュ織缂撳啿
  - 鏂板 `GET /api/admin/dashboard/runtime-logs`
  - 绠＄悊鍛樼櫥褰曘€佷华琛ㄧ洏鍒锋柊銆侀」鐩暟鎹笅杞姐€丄I 璋冪敤鏃ュ織瀵煎嚭鍜屽悗绔惎鍔ㄩ兘浼氬啓鍏ヨ繍琛屾棩蹇?- 鏍规嵁绾夸笂鏃ュ織杩藉姞鐑慨锛?  - 鍙戠幇 `GET /api/admin/dashboard/overview` 鍦ㄩ珮鏃ュ織閲忕幆澧冧笅浼氳Е鍙?Node `heap out of memory`
  - 鏍瑰洜鏄华琛ㄧ洏鍒锋柊鏃跺澶氫釜鑴氭湰鎵ц鍏ㄩ噺 `all-time summarize`
  - 褰撳墠鏀逛负鍙仛鍚堚€滀粖鏃?+ 鏈€杩?14 澶┾€濈獥鍙ｏ紝閬垮厤 PM2 鍥犲唴瀛樻孩鍑哄弽澶嶉噸鍚?- 鍚屾鏇存柊锛?  - `README.md`
  - `extension/README.md`
  - `platform-resources/backend/README.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/options/options.js`
  - `node --check extension/options/options-route-state.js`
  - `node --check platform-resources/backend/admin-dashboard/routes.js`
  - `node --check platform-resources/backend/runtime-log-store.js`
  - `node --check platform-resources/backend/project-data-download/routes.js`
  - `node --check platform-resources/backend/ai-call-log-download/routes.js`
  - `node --test platform-resources/backend/admin-dashboard/overview.test.js platform-resources/backend/admin-dashboard/runtime-logs.test.js platform-resources/backend/runtime-log-store.test.js extension/options/options-route-state.test.js`

## 2026-06-01锛圤ptions 浜屾鏀跺彛锛氭樉寮忎繚瀛?+ 鍙屾爮璇︽儏椤碉級

- 鎸夋渶鏂?0.4.0 鏀跺彛鏂规缁х画浼樺寲 `extension/options/`锛?  - 绯荤粺绠＄悊椤?hero 鍙充笂瑙掍富鎸夐挳缁熶竴鏀逛负鈥滆剼鏈笅杞戒腑蹇冣€濓紝涓嶅啀鍦?admin 璺敱鏄剧ず鈥滆繑鍥炲叕寮€涓績鈥濄€?  - `?view=admin&tab=backend` 涓诲唴瀹瑰尯鏀逛负鍙繚鐣欌€滃悗绔帴鍙ｅ湴鍧€鈥濓紱鍒囨崲鏈嶅姟鍣?/ 鏈満鍚庣偣鍑绘寜閽墠鍐欏叆鏈湴缂撳瓨銆?  - 宸︿晶鍥哄畾渚ф爮鏂板 `AI 璋冪敤浣跨敤浜篳 缂栬緫鍗★細杈撳叆濮撳悕鍚庣偣鍑绘寜閽墠淇濆瓨鍒版湰鍦扮紦瀛橈紱杩愯姒傚喌缁х画淇濈暀鍙鎽樿銆?  - 鑴氭湰璇︽儏椤电粺涓€鏀规垚宸﹀彸鍙屾爮锛氬乏渚т繚鐣欒剼鏈笟鍔¤缃€佸惎鍋滃拰蹇嵎閿紝鍙充晶浼樺厛鎵胯浇 `ASR 璇煶 AI 璁剧疆`锛涙病鏈?AI 鍙傛暟鐨勫钩鍙版墠鏄剧ず缁熶竴璇存槑鍗°€?  - 鍙栨秷 ASR / AI 璁剧疆鐨勨€滆繛缁偣鍑绘爣棰?10 娆¤В閿佲€濇棫浜や簰锛涘揩鍒ゃ€佽浆鍐欍€佹爣璐濇槗閲囥€丮agic Data銆丄ishell 鐨?AI 鍙傛暟褰撳墠榛樿鐩存帴灞曠ず銆?  - Task21 鍔╂墜鐨?AI 璋冭瘯璁剧疆褰撳墠涔熼粯璁ゅ父鏄撅紝涓嶅啀閫氳繃鏍囬鐐瑰嚮瑙ｉ攣銆?- 鍚屾鏇存柊锛?  - `README.md`
  - `extension/README.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/options/options.js`
  - `chrome-extension://.../options/options.html?view=admin&tab=backend`
  - `chrome-extension://.../options/options.html?view=script&script=judgement`
  - `chrome-extension://.../options/options.html?view=script&script=dataBakerRoundOneQuality`

## 2026-06-01锛圤ptions 缁嗚妭瑙嗚鏀跺彛锛?
- 鎸夋渶鏂颁汉宸ュ弽棣堢户缁敹鍙?`extension/options/` 鐨勭粏鑺傝〃鐜帮細
  - 宸︿笂瑙掑搧鐗屾柟鍧椾笉鍐嶆樉绀?`ASC` 鏂囧瓧锛屾敼涓哄鐢?`extension/assets/brand/asc-logo.svg`
  - 宸︿晶渚ф爮绉婚櫎鈥滈〉闈㈣竟鐣屸€濊鏄庡崱锛屽搧鐗屽尯鐗堟湰鏂囨缁熶竴鏀规垚 `娴忚鍣ㄦ墿灞?v<version>`
  - 鍏紑鑴氭湰涓績鍙充笂瑙掍富鎸夐挳浠庘€滅郴缁熺鐞嗏€濇敼涓虹洿鎺ユ墦寮€鈥滆剼鏈笅杞戒腑蹇冣€濆閾?  - 骞冲彴鎽樿涓嶅啀鏄剧ず鈥滅敓鏁?x / y鈥濓紝鏀逛负鏄剧ず鈥滃綋鍓嶅惎鐢?/ 榛樿鍚敤鈥濊剼鏈悕
  - 鍗曚釜鑴氭湰鍗′笉鍐嶆樉绀洪噸澶?URL pill锛屽尮閰嶅叆鍙ｇ粺涓€鏀规垚鈥滈粯璁ゅ钩鍙板湴鍧€鈥?  - 绯荤粺绠＄悊椤电Щ闄?hero 涓嬫柟閲嶅鐨勭嫭绔?banner锛屾妸鍒锋柊 / 杩斿洖 / 閫€鍑哄姩浣滃苟鍏ュ悗鍙板唴瀹瑰伐鍏锋潯
- 鍚屾鏇存柊锛?  - `README.md`
  - `extension/README.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/options/options.js`

## 2026-06-01锛圤ptions 瀹藉害鑷€傚簲淇锛?
- 淇 `extension/options/options.css` 鐨勯〉闈㈠搴︾瓥鐣ワ細
  - 鍘绘帀 `.page` 鐨勫浐瀹?`max-width` 闄愬埗锛屾敼涓哄崰婊″綋鍓嶆祻瑙堝櫒绐楀彛瀹藉害
  - `workspace-shell` 鏀逛负鍥哄畾鍙渚ф爮 + 鑷€傚簲涓诲唴瀹瑰尯
  - 骞冲彴鎽樿鍒楀拰鑴氭湰鍗＄綉鏍兼敼涓烘洿鏌旀€х殑 `minmax(...)` 瀹藉害
  - 澶у睆涓嬩富鍐呭鍖轰笉鍐嶇缉鍦ㄤ腑闂达紝灏忓睆鏂偣琛屼负淇濇寔涓嶅彉
- 鍚屾鏇存柊锛?  - `README.md`
  - `extension/README.md`
- 鏈疆楠岃瘉锛?  - `node --check extension/options/options.js`
  - 鐪熷疄鎵╁睍椤?`?view=center` 涓?`?view=admin&tab=overview` 闈欐€佹墦寮€妫€鏌?
## 2026-06-01锛圤ptions 娴呰壊杩愯惀鍚庡彴鑹叉澘鏍℃锛?
- 鏍规嵁鏈€鏂拌瑙夊弬鑰冿紝灏?`extension/options/options.css` 鐨勫伐浣滃彴瑕嗙洊灞備粠娣辫摑娓愬彉浠〃鐩樿壊鏉垮垏鎹负娴呰壊杩愯惀鍚庡彴鑹叉澘锛?  - 椤甸潰搴曡壊鏀逛负娴呯伆钃?+ 寰急鏆栬壊楂樺厜
  - 宸︿晶瀵艰埅鏀逛负鐧藉簳鍗＄墖銆佹祬钃濋€変腑鎬佷笌杞昏竟妗?  - 鍏紑涓績 hero銆佸钩鍙版憳瑕併€佽剼鏈崱銆佽鎯呭ご閮ㄣ€佺郴缁熺鐞?banner 鍏ㄩ儴鏀跺彛涓虹櫧搴?娴呰摑楂樹寒鏂规
  - 淇濈暀鐜版湁甯冨眬銆佽矾鐢卞拰鍔熻兘锛屼笉鏀瑰悗绔帴鍙ｃ€佷笉鏀硅剼鏈鎯呭瓧娈电粨鏋?- 鍚屾鏇存柊鏂囨。鍙ｅ緞锛?  - `README.md`
  - `extension/README.md`
- 鏈疆楠岃瘉缁х画瑕嗙洊锛?  - `node --check extension/options/options.js`
  - 鐪熷疄鎵╁睍椤?`?view=center` 涓?`?view=admin&tab=overview` 闈欐€佸揩鐓у鏌?
## 2026-05-31锛?.4.0 Options 宸ヤ綔鍙拌瑙夐噸鍋氾級

- 鎸夆€滈鐗堣瑙夋柟鍚戔€濈殑宸ヤ綔鍙板彛寰勯噸鍋?`extension/options/`锛?  - 澶栧眰鏀逛负宸︿晶鍥哄畾瀵艰埅 + 鍙充晶宸ヤ綔鍙板唴瀹瑰尯
  - 鍏紑鑴氭湰涓績涓昏瑙夋敼涓烘繁鑹蹭华琛ㄧ洏椋庢牸锛屼笉鍐嶄繚鐣欐棫棣栭〉鐨勮交閲忎俊鎭崱瑙傛劅
  - 骞冲彴鍖哄潡鏀规垚鈥滃钩鍙版憳瑕佷晶鏍?+ 鑴氭湰鍔熻兘鍗＄煩闃碘€濈粨鏋勶紝鑴氭湰鍗″彧淇濈暀鍚仠銆佽鎯呭拰鐩爣璺敱绛夋牳蹇冧俊鎭?  - 绯荤粺绠＄悊椤电户缁壙杞?`浠〃鐩?/ 鍚庣璁剧疆 / 涓嬭浇涓績 / 杩愯缁熻`锛屽苟涓庢柊鐨勫伐浣滃彴澹冲眰缁熶竴
- 褰撳墠宸插皢 `extension/manifest.json` 鐗堟湰浠?`0.3.7` 鎻愬崌鍒?`0.4.0`锛岀敤浜庢壙鎺ユ湰杞?options 瑙嗚涓庝俊鎭灦鏋勫崌绾с€?- 鍚屾鏇存柊鐗堟湰涓庤鍒欏彛寰勶細
  - `README.md`
  - `extension/README.md`
  - `docs/rules/project-collaboration-rules.md`
  - `AGENTS.md`
- 鏈疆楠岃瘉缁х画瑕嗙洊锛?  - `node --check extension/options/options.js`
  - `node --check extension/options/options-route-state.js`
  - `node --test platform-resources/backend/admin-auth.test.js platform-resources/backend/admin-dashboard/overview.test.js platform-resources/backend/project-data-download/__tests__/request-auth.test.js platform-resources/backend/ai-call-log-download/request-auth.test.js extension/options/options-route-state.test.js`
- 鐪熷疄 Chrome / Edge 鐨勬墿灞?UI 楠屾敹浠嶉渶鎵嬪伐瀹屾垚锛涘綋鍓嶈嚜鍔ㄥ寲娴忚鍣ㄦ帴鍏ヨ兘鍔涗粛涓嶈冻浠ョ洿鎺ユ浛浠ｆ墿灞曠湡鏈洪獙鏀躲€?
## 2026-05-31锛?.3.8 Options 鍚庡彴閲嶆瀯棣栫増锛?
- options 鍏ュ彛褰撳墠淇濈暀 `extension/options/options.html` 鍗曢〉锛屼絾姝ｅ紡鍒囨崲涓?query 璺敱锛?  - `?view=center`
  - `?view=script&script=<scriptId>`
  - `?view=admin&tab=overview|backend|downloads|stats`
- 鍓嶇瀹屾垚鈥滃叕寮€鑴氭湰涓績 + 鍙椾繚鎶ょ郴缁熺鐞嗏€濅袱灞傜粨鏋勯鐗堥噸鏋勶細
  - 鍏紑鑴氭湰涓績鍙繚鐣欏钩鍙板崱銆佽剼鏈姸鎬併€佸惎鍋滃叆鍙ｄ笌鑴氭湰璇︽儏鍏ュ彛銆?  - 鍘熼椤电殑鍚庣璁剧疆銆侀」鐩暟鎹笅杞姐€丄I 璇锋眰璁板綍瀵煎嚭鍏ㄩ儴杩佸叆绯荤粺绠＄悊椤点€?  - 绯荤粺绠＄悊椤靛浐瀹?4 涓〉绛撅細`浠〃鐩?/ 鍚庣璁剧疆 / 涓嬭浇涓績 / 杩愯缁熻`銆?  - 鏂板 `extension/options/options.css`锛屾妸鍘?`options.html` 鍐呰仈澶ф牱寮忓鎻愶紝骞剁粺涓€鍏紑涓績銆佽剼鏈鎯呴〉鍜屽悗鍙板伐浣滃彴瑙嗚澹冲眰銆?  - 鏂板 `extension/options/options-route-state.js`锛岄泦涓鐞?options 璺敱瑙ｆ瀽涓?href 鏋勯€犮€?- 绯荤粺绠＄悊椤靛綋鍓嶆帴鍏ュ瘑鐮侀棬绂佷笌浼氳瘽鎭㈠锛?  - 椤甸潰鍐呬紭鍏堜娇鐢?`sessionStorage`
  - 鍕鹃€夆€滆浣忔湰娆℃祻瑙堝櫒浼氳瘽鈥濇椂棰濆闀滃儚鍒?`chrome.storage.session`
  - 浼氳瘽澶辨晥鍚庤嚜鍔ㄩ€€鍥炲瘑鐮侀棬绂?- 缁熶竴鍚庣鏂板绯荤粺绠＄悊鎺ュ彛涓庨壌鏉?helper锛?  - `POST /api/admin/session/unlock`
  - `GET /api/admin/dashboard/overview`
  - `platform-resources/backend/admin-auth.js` 缁熶竴澶勭悊瀵嗙爜 hash 鏍￠獙銆丅earer token 璇诲彇鍜屼細璇?token 鏍￠獙
- 浠〃鐩樺綋鍓嶈仛鍚堝唴瀹癸細
  - 缁熶竴妯″瀷姹?/ provider queue 鍗犵敤
  - 鑴氭湰绾?AI 璋冪敤姹囨€?  - 浠婃棩澶辫触閿欒鐮佹憳瑕?  - 涓嬭浇涓績蹇嵎鎽樿
- `POST /api/admin/project-data-download/request` 涓?`POST /api/admin/ai-call-log/request` 褰撳墠宸叉敮鎸佸弻閴存潈锛?  - 鏃фā寮忥細body `password`
  - 鏂版ā寮忥細`Authorization: Bearer <admin-session-token>`
- 鏂板娴嬭瘯锛?  - `platform-resources/backend/admin-auth.test.js`
  - `platform-resources/backend/admin-dashboard/overview.test.js`
  - `platform-resources/backend/project-data-download/__tests__/request-auth.test.js`
  - `platform-resources/backend/ai-call-log-download/request-auth.test.js`
  - `extension/options/options-route-state.test.js`
- 鏈疆楠岃瘉锛?  - `node --check extension/options/options.js`
  - `node --check extension/options/options-route-state.js`
  - `node --check platform-resources/backend/admin-auth.js`
  - `node --check platform-resources/backend/admin-session/routes.js`
  - `node --check platform-resources/backend/admin-dashboard/overview.js`
  - `node --check platform-resources/backend/admin-dashboard/routes.js`
  - `node --check platform-resources/backend/project-data-download/routes.js`
  - `node --check platform-resources/backend/ai-call-log-download/routes.js`
  - `node --test platform-resources/backend/admin-auth.test.js platform-resources/backend/admin-dashboard/overview.test.js platform-resources/backend/project-data-download/__tests__/request-auth.test.js platform-resources/backend/ai-call-log-download/request-auth.test.js extension/options/options-route-state.test.js`
- 鐪熷疄娴忚鍣ㄨ嚜鍔ㄥ寲闈欐€侀獙鏀舵湭瀹屾垚锛氭湰鏈?Edge 杩滅▼璋冭瘯绔彛褰撳墠杩斿洖 `403 Forbidden`锛孭laywright 鏃犳硶鎺ュ叆锛涙墿灞曠殑鏈€缁?UI/闂ㄧ/瀵煎嚭娴佺▼浠嶉渶鍦ㄧ湡瀹?Chrome / Edge 涓姞杞?unpacked extension 鍚庢墜宸ラ獙鏀躲€?
## 2026-05-31锛堝彂甯冿細v0.3.7锛?
- 纭 `extension/manifest.json` 褰撳墠鐗堟湰涓?`0.3.7`锛屾湰杞笉鍐嶆彁鍗囧埌 `0.3.8`銆?- 灏?`0.3.7` 浣滀负褰撳墠闃舵鏈€缁堢増鏈敹灏撅紝鍚庣画鏂扮殑寮€鍙?/ 淇 / 浼樺寲杩涘叆 `0.3.8` 鍛ㄦ湡銆?- 鏈疆鎸夊彂甯冨彛寰勭敓鎴?CRX 鍙戝竷浜х墿锛?  - `dist/annotation-script-center-v0.3.7.crx`
  - `dist/annotation-script-center-v0.3.7.zip`
  - `dist/annotation-script-center-update.xml`
  - `dist/annotation-script-center-crx-latest.json`
- 鏈疆杩藉姞 Git tag锛?  - `v0.3.7`
- 鍚庣画鐗堟湰瀹屾垚鏃讹紝缁熶竴淇濈暀鈥滄彁浜?main + 鐢熸垚鍙戝竷浜х墿 + 鎵撶増鏈?tag + 鎺ㄩ€?tag鈥濈殑鍙戝竷娴佺▼锛岀敤浜庣ǔ瀹氫笅杞藉拰鐗堟湰鍥炴函銆?
## 2026-05-28锛堢粺涓€ AI 璇锋眰璁板綍鏌ョ湅鍏ュ彛锛?
- 缁熶竴鍚庣鏂板 `platform-resources/backend/ai-call-log-download/`锛屾彁渚涳細
  - `GET /api/admin/ai-call-log/options`
  - `POST /api/admin/ai-call-log/request`
  - `GET /api/admin/ai-call-log/file?token=...`
  - `HEAD /api/admin/ai-call-log/file?token=...`
- 缁熶竴瀵煎嚭鑼冨洿褰撳墠瑕嗙洊锛?  - DataBaker 涓€妫€ AI
  - Aishell Tech 闂藉崡璇姪鎵?AI
  - Magic Data 瀹㈠璇?/ 闂藉崡璇姪鎵?AI
  - LabelX 蹇垽 / 杞啓 AI
  - Abaka Task21 AI
- options 棣栭〉闅愯棌楂樼骇鍖烘柊澧炩€淎I 璇锋眰璁板綍鈥濋潰鏉匡紝浜や簰鏂瑰紡涓庘€滈」鐩暟鎹笅杞解€濅竴鑷达細
  - 杩炵画鐐瑰嚮鈥滃悗绔帴鍙ｅ湴鍧€鈥濇爣棰?10 娆″悗鏄剧ず
  - 濉啓鑾峰彇浜哄鍚?  - 閫夋嫨鑴氭湰绫诲瀷
  - 鍙€夊～鍐欏紑濮嬫棩鏈?/ 缁撴潫鏃ユ湡锛涚暀绌哄垯瀵煎嚭褰撳墠鑴氭湰鍏ㄩ儴璁板綍
  - 杈撳叆涓嬭浇瀵嗙爜鍚庡鍑?CSV
- `platform-resources/backend/project-data-download/jwt.js` 褰撳墠宸叉墿灞曚负鍙鐢?token 宸ュ叿锛屾敮鎸佷笉鍚岄敊璇爜鍓嶇紑銆?- `GET /api/admin/ai-call-log/options` 褰撳墠鍙繑鍥炶剼鏈?`id/label`锛屼笉鎻愬墠鏆撮湶鏃ュ織瀛樺湪鎬с€佹枃浠舵暟鍜屾棩鏈熻寖鍥淬€?- AI 璇锋眰璁板綍涓嬭浇瀹¤鐩綍褰撳墠钀藉湪 `platform-resources/backend/audit-data/ai-call-log-download/`锛屽苟宸插姞鍏?`.gitignore`銆?- 椤烘墜淇 `platform-resources/magic-data/minnan-helper/backend/ai-call-log.js` 瀵?`ai-service.js` 鐨勫惊鐜緷璧栵紝閬垮厤缁熶竴瀵煎嚭鍏ュ彛鍔犺浇鏃跺埛 warning銆?
## 2026-05-28锛堢粺涓€ AI jobs 榛樿閾捐矾涓庢ā鍨嬫睜琛ラ綈锛?
- DataBaker 绉佹湁 `backend/ai-job-store.js` 宸叉敼鎴愬叕鍏?`platform-resources/backend/ai-framework/runtime/ai-job-store.js` 鐨勯€傞厤灞傦紝涓嶅啀鐙珛缁存姢涓€濂?job store 閫昏緫銆?- 鍚庣鏂板 `platform-resources/backend/ai-framework/runtime/ai-runtime-meta.js`锛岀粺涓€缁?health/defaults 鏆撮湶锛?  - 榛樿璇锋眰妯″紡锛歚POST /jobs` + 杞 `GET /jobs/:jobId`
  - 鍏叡 job store 蹇収
  - 鎸夊叿浣撴ā鍨嬪悕鍏变韩姹犵殑榛樿绛栫暐
- DataBaker 榛樿鍓嶇閿欏嘲浠?`30ms` 璋冩暣涓?`50ms`锛岀‘淇濋粯璁?1 绉掑唴鍙戝嚭鐨勫缓浠诲姟璇锋眰涓嶈秴杩?`20` 娆°€?- Aishell銆丮agic Data銆丩abelX銆丄baka 鐨?health/defaults 涔熷凡琛ラ綈 jobs / runtime 鍏冧俊鎭紝鏂逛究鍓嶇鍜岃繍缁寸‘璁ゅ綋鍓嶉粯璁ら摼璺槸鍚﹀凡鍒囧埌 jobs銆?
## 2026-05-28锛堝叏閲?AI 鑴氭湰鎺ュ叆璋冪敤鏃ュ織涓庣粺璁★級

- 鏂板鍏变韩鏃ュ織鏍稿績锛?  - `platform-resources/backend/ai-call-log/schema.js`
  - `platform-resources/backend/ai-call-log/sanitizer.js`
  - `platform-resources/backend/ai-call-log/csv-writer.js`
  - `platform-resources/backend/ai-call-log/index.js`
- `platform-resources/backend/ai-framework/core/create-ai-route.js` 褰撳墠宸茬粺涓€琛ヤ笂锛?  - `aiUsageOperatorName` 鍚庣蹇呭～鏍￠獙
  - 鎴愬姛 / 澶辫触榛樿鍐欏叡浜?AI 璋冪敤鏃ュ織
- 浠ヤ笅 AI 鑴氭湰褰撳墠閮藉凡榛樿鍐欒剼鏈骇 CSV锛屽苟琛ラ綈缁熻鎺ュ彛锛?  - DataBaker锛歚/api/data-baker/round-one-quality/ai/recommend/logs/summary`
  - Aishell Tech锛歚/api/aishell-tech/minnan-helper/ai/recommend/logs/summary`
  - Magic Data 瀹㈠璇濓細`/api/magic-data/hakka-helper/ai/review-current/logs/summary`
  - Magic Data 瀹㈠璇?legacy锛歚/api/magic-data/annotator/ai/review-current/logs/summary`
  - Magic Data 闂藉崡璇細`/api/magic-data/minnan-helper/ai/review-current/logs/summary`
  - LabelX 蹇垽锛歚/api/alibaba-labelx/asr-judgement/ai/suggest/logs/summary`
  - LabelX 杞啓锛歚/api/alibaba-labelx/asr-transcription/ai/suggest-current/logs/summary`
  - Abaka Task21锛歚/api/abaka-ai/task21/ai/analyze/logs/summary`
- 鍚勮剼鏈棩蹇楃洰褰曪細
  - DataBaker锛歚platform-resources/data-baker/round-one-quality/backend/logs/`
  - Aishell Tech锛歚platform-resources/aishell-tech/minnan-helper/data/runtime/`
  - Magic Data 瀹㈠璇濓細`platform-resources/magic-data/hakka-helper/backend/logs/`
  - Magic Data 闂藉崡璇細`platform-resources/magic-data/minnan-helper/backend/logs/`
  - LabelX 蹇垽锛歚platform-resources/alibaba-labelx/asr-judgement/backend/logs/`
  - LabelX 杞啓锛歚platform-resources/alibaba-labelx/asr-transcription/backend/logs/`
  - Abaka Task21锛歚platform-resources/abaka-ai/task21/backend/logs/`

## 2026-05-28锛圓ishell Tech 榛樿閰嶇疆鏀逛负閫熷害浼樺厛缁勫悎锛?
- 灏嗗笇灏旇礉澹?/ Aishell Tech 闂藉崡璇姪鎵嬮粯璁ら厤缃粺涓€鏀逛负锛?  - `two_stage`
  - `direct_dialect`
  - `qwen3.5-omni-flash`
  - `qwen3.5-flash`
- 瑕嗙洊鑼冨洿锛?  - 鍓嶇鍏变韩榛樿閰嶇疆锛歚extension/shared/constants.js`
  - Aishell 杩愯鏃?fallback 榛樿鍊硷細`extension/sites/aishell-tech/minnan-helper/content.js`
  - Aishell 鍚庣 `defaults/health` 涓庤姹傚綊涓€榛樿鍊硷細`platform-resources/aishell-tech/minnan-helper/backend/config.js`銆乣platform-resources/aishell-tech/minnan-helper/backend/ai-service.js`
- 鐩殑锛?  - 褰撳墠鍙ｅ緞鍋忛€熷害浼樺厛锛屽噺灏戦粯璁よ惤鍒?`mandarin_to_dialect + qwen3.5-plus` 鐨勮緝鎱㈢粍鍚堛€?
## 2026-05-28锛圓ishell Tech 鍓嶇鏄剧ず鍚嶅垏鎹负鈥滃笇灏旇礉澹斥€濓紝骞舵敹鍙?AI 閿欒灞曠ず锛?
- 浠呰皟鏁村墠绔敤鎴峰彲瑙佹枃妗堬紝涓嶆敼鍐呴儴骞冲彴 ID銆佹枃浠跺す鍚嶃€佹帴鍙ｈ矾寰勩€佸悗绔敞鍐屽悕鎴?URL锛?  - `extension/shared/constants.js`
  - `extension/popup/popup.js`
  - `extension/options/options.html`
  - `extension/options/options.js`
  - `extension/sites/aishell-tech/minnan-helper/ui-panel.js`
- Aishell 鍓嶇鏂板鍏变韩閿欒灞曠ず妯″潡锛?  - 鏂板 `extension/shared/ai-error-display.js`
  - 褰撳墠鍏堟帴鍏?`extension/sites/aishell-tech/minnan-helper/diagnostics.js` 涓?`ui-panel.js`
- 褰撳墠閿欒灞曠ず鍙ｅ緞锛?  - 绯荤粺/缃戠粶绫婚敊璇細涓嶅啀鎶?`health/defaults/queue` 绛夊ぇ瀵硅薄鏁村寘濉炵粰鐢ㄦ埛锛涙敼涓轰腑鏂囨憳瑕?+ 绮剧畝 JSON锛屼繚鐣欐帴鍙ｅ湴鍧€銆乭ealth 鐘舵€併€佸師濮嬪紓甯稿拰鎺掓煡寤鸿銆?  - AI/涓婃父妯″瀷绫婚敊璇細缁х画瀹屾暣淇濈暀鍚庣鍘熷杩斿洖锛屽悓鏃跺鍔犫€滈敊璇В璇?/ 鍙兘鍘熷洜鈥濄€?  - `429 + limit_burst_rate` 缁熶竴瑙ｉ噴涓衡€滀笂娓告ā鍨嬮檺娴?/ 璇锋眰澧為暱杩囧揩鈥濄€?  - 鍙湁 `400 + Arrearage` 鎵嶈В閲婁负鈥滆处鍙锋瑺璐规垨浣欓涓嶈冻鈥濓紱鍏朵粬 `400` 涓嶅啀璇垽涓轰綑棰濋棶棰樸€?
## 2026-05-28锛圓I 榛樿瓒呮椂缁熶竴鏀剁揣鍒?60 绉掞紝骞舵竻鐞?AI 娴嬭瘯鏂囦欢鍙ｅ緞锛?
- 鎸夐」鐩柊鍙ｅ緞锛屽皢浠撳簱鍐?AI / 妯″瀷榛樿瓒呮椂浠?`120000ms` 缁熶竴鏀剁揣鍒?`60000ms`锛?  - 鍓嶇榛樿閰嶇疆銆乷ptions銆乻torage 鍜屽悇骞冲彴 AI client fallback 鍏ㄩ儴鏀逛负 `60000ms`
  - 鍚庣鍏叡 AI config銆丄ishell 鐙珛閾捐矾銆丏ataBaker銆丮agic Data銆丄baka銆丩abelX 鐨勯粯璁?AI timeout 涓庤秴鏃舵姤閿欐枃妗堢粺涓€鏀逛负 `60s`
  - 鍘嗗彶鍏煎 DataBaker AI job timeout 榛樿鍊煎悓姝ユ敼涓?`60000ms`
- 鍚屾鏇存柊褰撳墠鐢熸晥鏂囨。锛?  - `AGENTS.md`
  - 鏍?`README.md`
  - `config/env/ai.env.example`
  - 鍚勫钩鍙?AI 鐩稿叧 README
- `AGENTS.md` 鏂板瑙勫垯锛?  - AI / 妯″瀷鐩稿叧 `*.test.js` 榛樿瑙嗕负涓存椂楠岃瘉鏂囦欢锛岄獙璇佸畬鎴愬悗鍒犻櫎锛屼笉浣滀负闀挎湡浠撳簱璧勪骇淇濈暀锛岄櫎闈炲綋鍓?Prompt 鏄庣‘淇濈暀銆?- 鏈疆宸插湪楠岃瘉鍚庡垹闄や竴鎵?AI 鐩稿叧 `*.test.js`锛?  - Aishell 鍓嶅悗绔复鏃舵祴璇?  - AI framework / provider 涓存椂娴嬭瘯
  - Abaka / LabelX / DataBaker / Magic Data 鐨?AI adapter 涓存椂娴嬭瘯

## 2026-05-28锛圓ishell Tech recommend 璺敱淇 request.close 璇垽鏂繛锛?
- 淇 `platform-resources/aishell-tech/minnan-helper/backend/ai-routes.js`锛?  - 鐢熷懡鍛ㄦ湡鍙栨秷鐩戝惉涓嶅啀鎶?`request.close` 褰撴垚瀹㈡埛绔柇寮€銆?  - 鍙繚鐣?`request.aborted` 鍜?`response.close` 浣滀负鐪熷疄鏂繛淇″彿銆?- 鑳屾櫙锛?  - `request.close` 鍦ㄨ姹備綋姝ｅ父璇诲畬鍚庝篃鍙兘瑙﹀彂锛屼細鎶婁粛鍦ㄦ墽琛屼腑鐨?recommend 璇锋眰璇垽涓哄凡鏂紑銆?  - 璇垽鍚庡悗绔彲鑳界洿鎺ユ斁寮冭繑鍥?JSON锛屽墠绔氨浼氬彧鐪嬪埌 `TypeError: Failed to fetch`锛屽嵆浣?`health` 浠嶇劧鍙揪銆?- 鏂板娴嬭瘯 `Aishell ai-routes should not treat request close after body end as client disconnect`锛岃鐩栤€滆姹備綋姝ｅ父缁撴潫鍚庤Е鍙?close锛岃矾鐢变粛搴旂户缁繑鍥炴垚鍔熷搷搴斺€濄€?
## 2026-05-28锛圓ishell Tech 鍚屾瓒呮椂鍙ｅ緞缁熶竴鍥?120 绉掞級

- 鏍规嵁褰撳墠椤圭洰缁熶竴瑙勫垯锛孉ishell 涓嶅啀鍗曠嫭缁存寔 60 绉掑悓姝ヨ秴鏃躲€?- 鏇存柊锛?  - `platform-resources/aishell-tech/minnan-helper/backend/config.js`
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-routes.js`
  - `platform-resources/aishell-tech/minnan-helper/backend/pipeline.js`
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.js`
- 褰撳墠 Aishell health/defaults 涓庡悗绔繍琛屾椂缁熶竴鍥?`120000ms`銆?- 鍚屾鏇存柊锛?  - `platform-resources/aishell-tech/README.md`
  - `platform-resources/aishell-tech/minnan-helper/README.md`
  - `platform-resources/aishell-tech/minnan-helper/backend/README.md`

## 2026-05-28锛堝叏椤圭洰鍥哄畾鍏抽棴 thinking锛屽苟鎷嗗嚭 Aishell 鐙珛 DashScope Omni 瀹㈡埛绔級

- 缁熶竴鍏抽棴鍏ㄤ粨搴?AI thinking锛?  - `platform-resources/backend/ai/providers/qwen-openai-compatible.js`
  - `platform-resources/data-baker/round-one-quality/backend/ai-client-qwen-legacy.js`
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-client-qwen.js`
  - `platform-resources/alibaba-labelx/asr-judgement/backend/ai-client-qwen.js`
  - `platform-resources/magic-data/hakka-helper/backend/ai-client-qwen.js`
  - `platform-resources/magic-data/minnan-helper/backend/ai-client-qwen.js`
  - `platform-resources/abaka-ai/task21/backend/ai-client.js`
  - `platform-resources/abaka-ai/task21/backend/ai-analyze-request.js`
  - 浠ヤ笂閾捐矾鐜板湪閮藉己鍒?`enable_thinking=false`锛屼笉鍐嶅厑璁搁€氳繃鍓嶇閰嶇疆鎴栨棫鐜鍙橀噺閲嶆柊寮€鍚€?- Aishell Tech 琛ュ厖鐙珛 Omni 瀹㈡埛绔細
  - 鏂板 `platform-resources/aishell-tech/minnan-helper/backend/dashscope-omni-client.js`锛岀洿鎺ユ寜 DashScope compatible-mode 鏋勯€?`input_audio` 娴佸紡璇锋眰銆?  - `pipeline.js` 鏀逛负浼樺厛浣跨敤杩欎釜鐙珛瀹㈡埛绔鐞?Aishell Omni 鍚煶/鍗曟ā鍨嬮摼璺紝涓嶅啀璁╄骞冲彴缁х画璺熷叡浜?DataBaker Omni 鍙ｅ緞鑰﹀悎銆?- options 鍙ｅ緞鍚屾鏀跺彛锛?  - `extension/options/options.js` 涓?`extension/options/options.html` 鐜板湪浼氭妸 Aishell銆丏ataBaker銆丮agic Data銆丄baka銆佸揩鍒ゃ€佽浆鍐欑殑 thinking 寮€鍏崇粺涓€鏄剧ず涓哄彧璇诲叧闂€?  - 淇濆瓨閰嶇疆鏃朵篃浼氬己鍒跺啓鍥?`false`锛岄伩鍏嶇敤鎴峰嬀閫夊悗浜х敓鈥滃凡寮€鍚€濈殑閿欒銆?- Aishell 鍓嶇璇锋眰灞傚悓姝ュ浐瀹氬叧闂細
  - `extension/sites/aishell-tech/minnan-helper/content.js`
  - `extension/sites/aishell-tech/minnan-helper/ai-recommendation.js`
  - 涓ゅ閮戒細鏄惧紡鍙戦€?`enableThinking=false`锛屽嵆浣挎棫璁剧疆閲屼繚瀛樿繃 `true` 涔熶笉浼氬啀閫忎紶銆?- 琛ュ厖娴嬭瘯锛?  - `platform-resources/aishell-tech/minnan-helper/backend/dashscope-omni-client.test.js`
  - `platform-resources/backend/ai/providers/qwen-openai-compatible.test.js`
  - `platform-resources/abaka-ai/task21/backend/ai-analyze-request.test.js`
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js`
  - `platform-resources/aishell-tech/minnan-helper/backend/pipeline.test.js`
  - `extension/sites/aishell-tech/minnan-helper/ai-recommendation.test.js`

## 2026-05-28锛圓ishell Tech 鍚庣鍚屾鎺ㄨ崘閾惧畬鍏ㄧ嫭绔嬪寲锛?
- 閲嶆瀯 `platform-resources/aishell-tech/minnan-helper/backend/`锛?  - 鏂板 `config.js / errors.js / cache.js / queue.js / pipeline.js`锛屾妸 Aishell 鎺ㄨ崘閾炬媶鎴愮嫭绔嬮厤缃€侀敊璇€佺紦瀛樸€侀槦鍒楀拰娴佹按绾挎ā鍧椼€?  - `ai-service.js` 涓嶅啀鎶?Aishell 璇锋眰杞垚 DataBaker recommend payload锛屼篃涓嶅啀鐩存帴璋冪敤 DataBaker `recommend()`锛涙敼涓鸿緭鍑?Aishell 鑷繁鐨勮姹傚綊涓€銆侀粯璁?Prompt銆乭ealth/defaults 涓?`success + data + meta / success=false + error + meta` 濂戠害銆?  - `ai-routes.js` 鏀规垚 Aishell 鑷繁鐨勫悓姝ヨ矾鐢辨墽琛岄摼锛氬鎴风鏂紑銆佸悓姝ヨ秴鏃跺拰鎵嬪姩 abort 缁熶竴閫忎紶鍒颁笂娓?provider锛涘彧鏈夊搷搴旂湡姝ｆ垚鍔熷啓鍥炲悗鎵嶅厑璁稿啓鎴愬姛缂撳瓨鍜屾垚鍔熸棩蹇椼€?  - `pipeline.js` 褰撳墠鍙鐢ㄥ叕鍏?provider HTTP 宸ュ叿锛屼笉鍐嶅鐢?DataBaker recommend orchestration锛汚ishell 闃熷垪缁勫浐瀹氫负 `aishell_qwen_omni / aishell_fun_asr / aishell_text_compare`銆?  - 鐜鍙橀噺榛樿浼樺厛璇诲彇 `AISHELL_AI_*`锛岀涓€闃舵浠嶅厑璁稿彧璇诲洖閫€鏃х殑 `DATABAKER_AI_*`銆?- 鏇存柊 `platform-resources/aishell-tech/minnan-helper/data/ai-call-log.js`锛?  - CSV 鏂板鍙栨秷鎬併€侀樁娈点€佸惉闊宠€楁椂銆佹瘮杈冭€楁椂銆佹帓闃熺瓑寰呫€侀噸璇曟鏁般€佺紦瀛樺懡涓拰娴佹按绾挎ā寮忓瓧娈点€?  - 鏃ュ織璇诲彇鏂板绾?`meta`锛屽悓鏃跺吋瀹规棫鐨?`result.usage / result.timing / result.models` 瀛楁銆?- 鏇存柊鍓嶇 Aishell recommend 娑堣垂灞傦細
  - `extension/sites/aishell-tech/minnan-helper/ai-recommendation.js` 鏀逛负浼樺厛娑堣垂 `success/data/meta/error`锛屽苟鍚戜笂鍏煎鏃у睍绀哄瓧娈点€?  - `extension/sites/aishell-tech/minnan-helper/diagnostics.js` 鏀逛负缁熶竴浠?`meta` 灞曠ず鎺掗槦绛夊緟銆佺紦瀛樺懡涓拰闃舵淇℃伅銆?- 鏇存柊 `platform-resources/aishell-tech/minnan-helper/ai/adapter.js`锛?  - 瀵归綈 Aishell 鏂拌姹傚綊涓€涓庡搷搴斿绾︼紝鍘绘帀 DataBaker recommend 涓氬姟灞傝€﹀悎銆?- 鏂板/鏇存柊娴嬭瘯锛?  - `platform-resources/aishell-tech/minnan-helper/backend/pipeline.test.js`
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-routes.test.js`
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js`
  - `platform-resources/aishell-tech/minnan-helper/ai/adapter.test.js`
  - `extension/sites/aishell-tech/minnan-helper/ai-recommendation.test.js`
  - `extension/sites/aishell-tech/minnan-helper/diagnostics.test.js`
- 鍚屾鏇存柊 README锛?  - `README.md`
  - `docs/platforms-index.md`
  - `extension/sites/aishell-tech/minnan-helper/README.md`
  - `platform-resources/aishell-tech/README.md`
  - `platform-resources/aishell-tech/minnan-helper/README.md`
  - `platform-resources/aishell-tech/minnan-helper/backend/README.md`

## 2026-05-28锛圓ishell Tech AI 璇锋眰缃戠粶璇婃柇涓庢湰鏈哄洖閫€澧炲己锛?
- 鏇存柊 `extension/sites/aishell-tech/minnan-helper/ai-recommendation.js`锛?  - 鏂板 Node 鍙祴瀵煎嚭锛岃ˉ榻愬墠绔姹傚眰娴嬭瘯鍏ュ彛銆?  - 褰撳墠鍚庣妯″紡涓衡€滄湰鏈猴紙127.0.0.1:3333锛夆€濅笖娴忚鍣ㄥ眰璇锋眰澶辫触鏃讹紝浼氳嚜鍔ㄥ洖閫€涓€娆?`script.xiangtianzhen.store` 鏈嶅姟鍣ㄦ帴鍙ｏ紱鍙奖鍝嶅綋鍓嶈姹傦紝涓嶆敼鍐欑敤鎴?settings銆?  - 鑻ユ湰鏈哄拰鏈嶅姟鍣ㄩ兘鏃犳硶杩為€氾紝鍓嶇涓嶅啀鍙樉绀虹缁熺殑鈥滃悗绔繛鎺ヤ腑鏂€濓紝鑰屾槸鎶?`backendMode / endpoint / fallbackEndpoint / originalErrorName / originalErrorMessage / online` 鍐欏叆鍘熷璇婃柇 JSON銆?  - 棰濆璇嗗埆 `Extension context invalidated`锛屾敼涓烘槑纭彁绀衡€滄墿灞曚笂涓嬫枃宸插け鏁堬紝璇峰埛鏂板綋鍓嶄笟鍔￠〉闈㈠悗閲嶈瘯銆傗€濓紝閬垮厤缁х画璇垽鎴愭櫘閫氱綉缁滈敊璇€?  - 鎴愬姛璇锋眰浼氭妸鏈瀹為檯浣跨敤鐨勫悗绔ā寮忋€乪ndpoint 浠ュ強鏄惁鍙戠敓鑷姩鍥為€€鍐欏叆 `result.debug.client*` 瀛楁锛屼究浜庡墠绔悗缁睍绀烘垨鎺掓煡銆?- 鏇存柊 `extension/sites/aishell-tech/minnan-helper/diagnostics.js` 涓庢祴璇曪細
  - 鈥滃綋鍓嶈瘑鍒粨鏋?/ 鏌ョ湅璇︽儏鈥濇柊澧炲睍绀哄悗绔ā寮忋€佸悗绔湴鍧€銆佹槸鍚﹁嚜鍔ㄥ洖閫€銆?- 鏂板 `extension/sites/aishell-tech/minnan-helper/ai-recommendation.test.js`锛?  - 瑕嗙洊鈥滄湰鏈哄け璐ュ悗鑷姩鍥為€€鏈嶅姟鍣ㄦ垚鍔熲€濄€?  - 瑕嗙洊鈥滄湰鏈轰笌鏈嶅姟鍣ㄩ兘澶辫触鏃惰繑鍥炶缁嗙綉缁滆瘖鏂€濄€?  - 瑕嗙洊鈥滄墿灞曚笂涓嬫枃澶辨晥鏃剁粰鍑轰笓闂ㄦ彁绀衡€濄€?- 缁х画澧炲己 `extension/sites/aishell-tech/minnan-helper/ai-recommendation.js`锛?  - 褰撶湡瀹?`POST /recommend` 鐩存帴 `Failed to fetch` 鏃讹紝鍓嶇浼氳嚜鍔ㄥ啀鎺㈡祴涓€娆?`/recommend/health`銆?  - 濡傛灉 health 鎴愬姛锛屼細鏄庣‘鎻愮ず鈥滄湇鍔″櫒鍏ュ彛鍙揪锛屼絾鐪熷疄鎺ㄨ崘璇锋眰鍦ㄧ綉缁滃眰琚腑鏂€濓紝骞舵妸 `healthCheck` 缁撴灉鍐欏叆鍘熷璇婃柇 JSON锛屽府鍔╁尯鍒嗏€滃叆鍙ｆ寕浜嗏€濊繕鏄€滅湡瀹炶姹傞摼璺閲嶇疆/涓柇鈥濄€?- 鏇存柊 `extension/sites/aishell-tech/minnan-helper/README.md` 涓?`platform-resources/aishell-tech/minnan-helper/README.md`锛?  - 琛ュ厖 Aishell 褰撳墠璇锋眰灞傜殑鏈満鍥為€€绛栫暐銆?  - 琛ュ厖娴忚鍣ㄥ眰缃戠粶澶辫触/鎵╁睍涓婁笅鏂囧け鏁堟椂鐨勫師濮嬭瘖鏂俊鎭彛寰勩€?  - 琛ュ厖 network fail 鍚庤嚜鍔ㄨˉ鎺?health 鐨勫彛寰勩€?
## 2026-05-28锛圓ishell Tech 鍗曠嫭钀藉湴骞冲彴 AI 璋冪敤 CSV锛?
- 鏂板 `platform-resources/aishell-tech/minnan-helper/data/ai-call-log.js` 涓庢祴璇曪細
  - 鍏堜笉鎺ョ粺涓€鏃ュ織鏍稿績锛屽崟鐙负 Aishell 鐢熸垚骞冲彴涓撳睘 AI 璋冪敤 CSV 鍓湰銆?  - 榛樿钀界洏鍒?`platform-resources/aishell-tech/minnan-helper/data/runtime/ai-calls-YYYY-MM-DD.csv`銆?  - 璁板綍褰撳墠闃舵鏈€灏忓叕鍏变俊鎭細璇锋眰 ID銆佹垚鍔熺姸鎬併€佽€楁椂銆佽緭鍏?杈撳嚭 token銆佹€?token 鍏滃簳銆丄I 璋冪敤浣跨敤浜恒€佸钩鍙拌处鍙枫€丄ishell 浠诲姟/鍒嗗寘/鏉＄洰 ID銆佹ā鍨嬩俊鎭紝浠ュ強鑴辨晱鍚庣殑鍘熷杩斿洖/閿欒 JSON銆?- 鏇存柊 `platform-resources/aishell-tech/minnan-helper/backend/ai-routes.js`锛?  - Aishell recommend 鎴愬姛鍜屽け璐ラ兘浼氳拷鍔犺繖浠藉钩鍙颁笓灞?CSV銆?  - 褰撳墠浠嶄繚鐣?DataBaker 鍘熸湁鎺ㄨ崘閾撅紝涓嶅厛鍔ㄥ叡浜棩蹇楀悎骞跺眰銆?- 鏇存柊 `.gitignore` 涓?`platform-resources/aishell-tech/minnan-helper/data/README.md`锛?  - `data/runtime/` 杩愯鏂囦欢涓嶆彁浜?Git銆?
## 2026-05-28锛圓ishell Tech AI 璇锋眰琛ラ綈骞冲彴璐﹀彿鎻愬彇锛?
- 鏇存柊 `extension/sites/aishell-tech/minnan-helper/data-api.js`锛?  - 鏂板澶村儚鍖哄钩鍙拌处鍙锋彁鍙栭€昏緫锛屼紭鍏堣鍙?`.avatar-dropdown .user-name .hidden-xs-only`銆?  - `ASmnbz001銆愭爣娉ㄤ汉鍛樸€慲 杩欑被鏄剧ず鏂囨湰鐜板湪浼氬厛褰掍竴鎴愮函璐﹀彿 `ASmnbz001`銆?  - 褰撳墠鏉′笌鎵归噺鏉＄洰瀵硅薄閮戒細榛樿甯︿笂 `platformUserName`锛宍platformUserId` 褰撳墠淇濈暀绌哄瓧绗︿覆銆?- 鏇存柊 `platform-resources/aishell-tech/minnan-helper/backend/ai-service.js`锛?  - recommend 璇锋眰寮€濮嬩繚鐣?`aiUsageOperatorName / platformUserName / platformUserId`銆?  - 杩?3 涓瓧娈典細缁х画閫忎紶鍒?Aishell -> DataBaker recommend payload銆?  - 鑻ュ墠绔湭鍗曠嫭鎻愪緵 `annotatorName`锛屽悗绔細鎶?`platformUserName` 浣滀负 DataBaker 鎺ㄨ崘閾剧殑 `annotatorName` fallback锛屼究浜庢部鐢ㄧ幇鏈夋棩蹇楅摼璺€?- 琛ラ綈娴嬭瘯锛?  - `extension/sites/aishell-tech/minnan-helper/data-api.test.js` 鏂板骞冲彴璐﹀彿瑙ｆ瀽涓?DOM 鎻愬彇鐢ㄤ緥銆?  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js` 鏂板 AI 璋冪敤鍏冩暟鎹€忎紶涓?`annotatorName` fallback 鏂█銆?
## 2026-05-28锛圓ishell Tech 鎵归噺鍒囨潯璇垽鐑慨锛?
- 淇 Aishell 鎵归噺璇嗗埆閲屸€滃乏渚у凡鍒囧埌鐩爣鏉★紝浣嗗彸渚т粛琚鍒ゆ垚鏈垏鎹⑩€濈殑闂锛?  - 鐪熼〉澶嶆祴鍙戠幇 `.fileName-line` 鐨勭涓€涓?`span` 鍙湁 `646:` 杩欑被缂栧彿锛屽畬鏁存枃浠跺悕鍦ㄥ悓涓€琛屽灞傝妭鐐归噷锛屼笖鍙充晶宸ュ叿鎸夐挳涔熷叡鐢ㄨ琛屻€?  - `extension/sites/aishell-tech/minnan-helper/data-api.js` 涓嶅啀鍙鍙?`.fileName-line span`锛屾敼涓轰紭鍏堜粠鏁磋鏂囨湰涓彁鍙?`缂栧彿: 鏂囦欢鍚?wav`锛屽啀鐢ㄤ簬鍙充晶琛ㄥ崟瀵归綈鍒ゆ柇銆?  - 杩欐牱鍗充娇骞冲彴鎶婄紪鍙枫€佹枃浠跺悕銆乣AI鎵归噺璇嗗埆 / 鍋滄鎵归噺` 绛夋寜閽贩鎺掑湪涓€琛岄噷锛屼篃涓嶄細鍐嶆妸姝ｇ‘鍒囨潯璇垽鎴愨€滃彸渚ц〃鍗曟湭瀹屾垚鍒囨崲鈥濄€?- 琛ラ綈娴嬭瘯锛?  - `extension/sites/aishell-tech/minnan-helper/data-api.test.js` 鏂板鐪熷疄缁撴瀯鍥炲綊鐢ㄤ緥锛岃鐩栤€滈涓?span 鍙湁缂栧彿銆佹暣琛屾墠鏈夊畬鏁存枃浠跺悕鈥濈殑鍦烘櫙銆?
## 2026-05-28锛圓ishell Tech 鎵归噺澶辫触璇︽儏涓?AI 璇婃柇澧炲己锛?
- 鏂板 `extension/sites/aishell-tech/minnan-helper/diagnostics.js`锛?  - 鎶藉嚭 Aishell 褰撳墠璇嗗埆缁撴灉涓庢壒閲忓け璐ラ」鐨勮瘖鏂憳瑕侀€昏緫銆?  - 缁熶竴鐢熸垚璇嗗埆绛栫暐銆佹ā鍨嬮€夋嫨銆丄I鑰楁椂銆佸墠绔苟鍙戙€乼oken銆丗unASR provider銆乺equestId銆乨ebugId 绛夊睍绀哄瓧娈点€?  - 缁熶竴鐢熸垚鎵归噺澶辫触椤圭殑 `stage / stageLabel / detailRows / rawJson` 缁撴瀯銆?- 鏇存柊 `extension/sites/aishell-tech/minnan-helper/content.js`锛?  - 鎵归噺澶辫触娓呭崟涓嶅啀鍙繚鐣?`displayName + message`銆?  - 鐜板湪浼氬尯鍒?`ai_request / select_task / save_current` 涓夌被澶辫触闃舵銆?  - AI 璇锋眰澶辫触浼樺厛鎸傚悗绔師濮嬭繑鍥烇紱鍒囨潯/淇濆瓨澶辫触鍒欎繚鐣欏搴旈摼璺笂涓嬫枃涓?AI debug 淇℃伅銆?- 鏇存柊 `extension/sites/aishell-tech/minnan-helper/ui-panel.js`锛?  - 鈥滃綋鍓嶈瘑鍒粨鏋溾€濆尯鏂板 AI 璇婃柇淇℃伅灞曠ず銆?  - 鎵归噺澶辫触娓呭崟姣忔潯鏂板 `鏌ョ湅璇︽儏` 涓?`鏌ョ湅鍘熷JSON` 鎸夐挳銆?  - `鏌ョ湅璇︽儏` 灞曞紑澶辫触闃舵銆侀敊璇憳瑕併€丄I鑰楁椂銆佹ā鍨嬨€佸苟鍙戙€乼oken 绛夊瓧娈点€?  - `鏌ョ湅鍘熷JSON` 灞曞紑璇ユ潯瀹屾暣澶辫触涓婁笅鏂囷紝渚夸簬浜哄伐瀹氫綅闂銆?- 鏇存柊 `extension/manifest.json`锛?  - Aishell content script 娉ㄥ叆搴忓垪鏂板 `sites/aishell-tech/minnan-helper/diagnostics.js`銆?- 琛ラ綈娴嬭瘯锛?  - 鏂板 `extension/sites/aishell-tech/minnan-helper/diagnostics.test.js`锛岃鐩栧綋鍓嶇粨鏋滆瘖鏂笌鎵归噺澶辫触椤硅鎯呯粨鏋勩€?
## 2026-05-28锛圓ishell Tech AI璇嗗埆鎸夐挳涓嶅彲鐐瑰嚮鐑慨锛?
- 淇 `AI璇嗗埆` 娉ㄥ叆鎸夐挳鍦ㄩ〉闈笂鍙浣嗕笉鑳界偣鍑荤殑闂锛?  - 鏍瑰洜鏄寜閽洿鎺ョ户鎵夸簡鍘熺敓鈥滀繚瀛樷€濇寜閽殑瀹屾暣 class锛屽涓绘寜閽笂鐨?`is-disabled` 绛夌鐢ㄦ€佹牱寮忎細涓€璧峰甫杩囨潵锛屽鑷存柊鎸夐挳琚?Element UI 鐨勭鐢ㄨ鍒欐嫤鎴偣鍑汇€?  - `extension/sites/aishell-tech/minnan-helper/ui-panel.js` 鏂板鎸夐挳 class 娓呮礂涓庣鐢ㄦ€佸悓姝ラ€昏緫锛屾敞鍏ユ椂涓诲姩绉婚櫎 `is-disabled`锛屽苟鏄惧紡鎭㈠ `pointer-events`銆?  - 鍚屾椂缁?`AI璇嗗埆 / AI鎵归噺璇嗗埆 / 鍋滄鎵归噺` 鐨勭偣鍑讳簨浠惰ˉ鍏?`stopPropagation()`锛岄檷浣庡涓婚〉绾т簨浠跺共鎵般€?- 鏂囨。鍚屾锛?  - 鏄庣‘ Aishell 鍚庣画榛樿娌跨敤鈥滃祵鍏ュ紡鎺ㄨ崘鍗＄墖 + 鍘熺敓鎸夐挳娉ㄥ叆鈥濊繖涓€鍓嶇褰㈡€併€?
## 2026-05-28锛圓ishell Tech 闂藉崡璇姪鎵嬩繚瀛橀摼淇锛?
- 淇 Aishell 闂藉崡璇姪鎵嬧€滃～鍏ュ苟淇濆瓨鈥濋摼璺細
  - 鏍瑰洜鏄唴瀹硅剼鏈～鍏ュ悗鐩存帴 `POST /api/mark/SaveShortMark`锛屾病鏈夎Е鍙戝钩鍙板師鐢熲€滀繚瀛樷€濇寜閽紝瀵艰嚧骞冲彴鍓嶇鑷韩鐨勪繚瀛樿仈鍔ㄤ笌鎴愬姛鎻愮ず鍙ｅ緞鍙兘琚粫寮€銆?  - `extension/sites/aishell-tech/minnan-helper/data-api.js` 鏀逛负鐐瑰嚮椤甸潰鐪熷疄鈥滀繚瀛樷€濇寜閽紝鍐嶇瓑寰呴〉闈?`淇濆瓨鎴愬姛!` 鎻愮ず銆佸垪琛ㄦ潯鐩畬鎴愭€侊紝蹇呰鏃跺洖閫€妫€鏌?`getShortMark / packageItemList`銆?  - 淇濈暀鎵归噺妯″紡鐨勨€淎I 骞跺彂璇锋眰 + 椤甸潰涓茶淇濆瓨鈥濇€绘祦绋嬶紝浣嗘瘡鏉′繚瀛樼粺涓€璧板涓婚〉闈㈢湡瀹炲姩浣溿€?- 娴嬭瘯涓庢枃妗ｏ細
  - `extension/sites/aishell-tech/minnan-helper/data-api.test.js` 鏂板鈥滃繀椤荤偣鍑荤湡瀹炰繚瀛樻寜閽笖涓嶈兘鐩存帴 POST SaveShortMark鈥濈敤渚嬨€?  - 鍚屾鏇存柊 `extension/sites/aishell-tech/minnan-helper/README.md` 涓?`platform-resources/aishell-tech/minnan-helper/README.md` 鐨勪繚瀛橀摼璇存槑銆?
## 2026-05-28锛圓ishell Tech Prompt 绠€浣撶害鏉熶笌鎵归噺绐楀彛琛ヤ綅锛?
- 鏇存柊 `platform-resources/aishell-tech/minnan-helper/backend/ai-service.js` 榛樿 Prompt锛?  - `mandarin_to_dialect` 姣旇緝 Prompt 鏄庣‘瑕佹眰 `recommendedText` 鍙兘杈撳嚭绠€浣撲腑鏂囷紝涓嶅厑璁哥箒浣撳瓧銆?  - `direct_dialect` 鍚煶/姣旇緝 Prompt 鍚屾瑕佹眰 `heardText / recommendedText` 浣跨敤绠€浣撲腑鏂囷紝涓嶅厑璁哥箒浣撳瓧銆?  - 鏈疆涓嶅湪鍓嶇鍋氫簩娆＄箒绠€绾犳锛岀害鏉熷畬鍏ㄨ惤鍦?Prompt銆?- 鏇存柊 Aishell 鍓嶇鎵归噺璇嗗埆绐楀彛锛?  - 鏂板 `extension/sites/aishell-tech/minnan-helper/batch-window.js`锛屾妸鎵归噺璇锋眰绐楀彛鏀规垚鈥滃厛鍙戞弧骞跺彂锛屾秷璐逛竴鏉″悗鍐嶈ˉ鍙戜竴鏉♀€濈殑婊氬姩琛ヤ綅妯″瀷銆?  - `extension/sites/aishell-tech/minnan-helper/content.js` 鏀逛负鍩轰簬璇ョ獥鍙ｈ皟搴?AI 璇锋眰锛屼繚鎸佲€滆皝鍏堣繑鍥炶皝鍏堜繚瀛樷€濓紝浣嗗悗缁ˉ鍙戞椂鏈烘敼涓衡€滀笂涓€鏉′繚瀛樺畬鎴愬悗鈥濄€?  - `extension/sites/aishell-tech/minnan-helper/data-api.js` 鏂板 Aishell 鍥哄畾 OSS 鏍瑰湴鍧€鍥為€€锛沗task/detail.project.dataRoot` 缂哄け鏃讹紝浠嶅彲鐢?`https://bpp-collect.oss-cn-hangzhou.aliyuncs.com + item.url` 缁勮闊抽鍦板潃銆?- 2026-05-28 鍚岃疆杩藉姞锛?  - Aishell 鎵归噺浠诲姟婧愭敼涓衡€滃綋鍓嶅垎鍖呬粠绗?1 鏉″埌鏈€鍚?1 鏉♀€濇暣鍖呮壂鎻忥紝涓嶅啀浠庡綋鍓嶉€変腑鏉″紑濮嬨€?  - 杩囨护鍙ｅ緞鏀剁揣涓哄彧璺宠繃 `dataStatus === 2` 鐨勫凡瀹屾垚鏉＄洰锛沗dataStatus=0/1` 閮界户缁弬涓庢湰杞壒閲忋€?  - `extension/sites/aishell-tech/minnan-helper/data-api.test.js` 鏂板鏁村寘鎵弿涓庣姸鎬佽繃婊ゆ柇瑷€銆?- 娴嬭瘯涓庤祫婧愶細
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js` 鏂板榛樿 Prompt 绠€浣撶害鏉熸柇瑷€銆?  - `extension/sites/aishell-tech/minnan-helper/batch-window.test.js` 鏂板婊氬姩骞跺彂绐楀彛琛ヤ綅娴嬭瘯銆?  - `extension/sites/aishell-tech/minnan-helper/data-api.test.js` 鏂板榛樿 OSS 鏍瑰湴鍧€鍥為€€鏂█銆?  - `extension/manifest.json` 琛ュ厖鍔犺浇 `sites/aishell-tech/minnan-helper/batch-window.js`銆?
## 2026-05-28锛圓ishell Tech 宓屽叆寮忛潰鏉夸笌鍘熺敓鎸夐挳娉ㄥ叆锛?
- 鍚堝苟 Aishell Tech 闂藉崡璇姪鎵嬬晫闈㈤噸鏋勶細
  - `extension/sites/aishell-tech/minnan-helper/ui-panel.js` 浠庡浐瀹氭偓娴獥鏀逛负宓屽叆寮忓崱鐗囷紝浼樺厛鎸傚湪 `.mark-area form.el-form` 涓嬫柟銆?  - 闈㈡澘涓诲尯鍙繚鐣?`AI鎺ㄨ崘鏂囨湰` 灞曠ず銆佺姸鎬佹彁绀哄拰璇︾粏淇℃伅鎶樺彔锛涜缁嗙粨鏋滀笌鎵归噺鐘舵€佹敹杩涙姌鍙犲尯銆?  - `AI璇嗗埆` 鎸夐挳鏀逛负娉ㄥ叆鍒伴〉闈㈠師鐢熲€滀繚瀛樷€濇寜閽彸渚э紱`AI鎵归噺璇嗗埆 / 鍋滄鎵归噺` 鏀逛负娉ㄥ叆鍒伴〉闈㈠師鐢熷伐鍏锋寜閽尯鍩熴€?  - 褰撴帹鑽愭枃鏈笌椤甸潰鍙傝€冩枃鏈竴鑷存椂锛屼富灞曠ず鍖烘敼涓烘彁绀?`鏃犻渶淇敼`锛屼絾浠嶄繚鐣欑湡瀹炴帹鑽愭枃鏈緵濉叆骞朵繚瀛樸€?- 閿欒閫忎紶澧炲己锛?  - `extension/sites/aishell-tech/minnan-helper/ai-recommendation.js` 鐨勫鎴风閿欒瀵硅薄琛ュ厖 `rawResponse`銆?  - `extension/sites/aishell-tech/minnan-helper/content.js` 涓?`ui-panel.js` 鏀寔鍦ㄨ瘑鍒姤閿欐椂灞曞紑鏄剧ず鑴辨晱鍚庣殑鍚庣鍘熷杩斿洖 JSON銆?- 鍚屾鏇存柊 Aishell 杩愯鏃?README锛屾槑纭綋鍓嶆槸鈥滃祵鍏ュ紡鍗＄墖 + 鍘熺敓鎸夐挳娉ㄥ叆鈥濆彛寰勩€?
## 2026-05-28锛圓ishell Tech 鎵归噺鍒囨潯瀵归綈涓庡揩鎹烽敭鎺ュ叆锛?
- 淇 Aishell 鎵归噺璇嗗埆閲屸€淎I 宸茶繑鍥烇紝浣嗛〉闈㈡病鏈夊垏鍒板搴旀潯鐩氨鐩存帴濉叆淇濆瓨鈥濈殑闂锛?  - `extension/sites/aishell-tech/minnan-helper/data-api.js` 涓嶅啀鍙寜宸︿晶 DOM 绱㈠紩鍒囨潯銆?  - 鏂板鎸?`number + fileName 鍚庣紑` 鍖归厤宸︿晶 `.list-item` 鐨勫畾浣嶉€昏緫锛屽吋瀹归〉闈㈤噷 `...59666546823.wav` 杩欑被鎴柇鏂囦欢鍚嶃€?  - 鏂板 `selectTask()` 涓?`getItemByTask()`锛屾壒閲忓洖濉墠浼氶噸鏂版寜鏉＄洰鏍囪瘑瀹氫綅锛屽苟绛夊緟鍙充晶琛ㄥ崟涓庣洰鏍囨潯鐪熸瀵归綈銆?- 琛ラ綈 Aishell 蹇嵎閿帴鍏ワ細
  - `extension/manifest.json` 閲嶆柊琛ュ叆 `sites/aishell-tech/minnan-helper/shortcuts.js` 娉ㄥ叆銆?  - `extension/sites/aishell-tech/minnan-helper/content.js` 寮€濮嬪疄渚嬪寲 Aishell shortcuts runtime銆?  - `extension/sites/aishell-tech/minnan-helper/ui-panel.js` 瀵瑰鏆撮湶澶嶅埗鍚煶鏂囨湰銆佸鍒舵帹鑽愭枃鏈€佸～鍏ュ苟淇濆瓨褰撳墠鏉°€佸拷鐣ョ粨鏋滃姩浣滐紝渚涘揩鎹烽敭璋冪敤銆?  - `extension/options/options.html` 涓?`extension/options/options.js` 鏂板 Aishell 鐙珛蹇嵎閿綍鍒堕潰鏉裤€佽崏绋挎€佷笌淇濆瓨閫昏緫銆?
## 2026-05-28锛圓I 璋冪敤鏃ュ織鍏ㄥ眬浣跨敤浜鸿缃涓€鍧楋級

- 鏂板 `extension/shared/ai-usage-meta.js` 璁剧疆琛ヤ竵鑳藉姏锛?  - 鏂板 `createAiUsageOperatorSettingsPatch()`锛岀粺涓€鎶婂叏灞€浣跨敤浜哄啓鍏?`settings.meta.aiUsageOperatorName`銆?- 鏇存柊 `extension/shared/constants.js` 涓?`extension/shared/storage.js`锛?  - 榛樿璁剧疆涓?fallback 榛樿璁剧疆閮借ˉ榻?`meta.aiUsageOperatorName` 绌哄瓧绗︿覆鍒濆鍊笺€?- 鏇存柊 `extension/options/options.html` 涓?`extension/options/options.js`锛?  - options 棣栭〉鈥滃悗绔帴鍙ｅ湴鍧€鈥濆崱鐗囨柊澧炲叏灞€ `AI 璋冪敤浣跨敤浜篳 杈撳叆椤广€?  - 杈撳叆鍊煎湪 blur 鏃舵寔涔呬繚瀛樺埌 `settings.meta.aiUsageOperatorName`锛屽啀娆¤繘鍏ラ椤典細鑷姩鍥炴樉銆?  - 甯姪鏂囨鏄庣‘锛氭墍鏈?AI 璇锋眰鍏辩敤锛屾湭濉啓鏃朵笉鍏佽璋冪敤 AI銆?- 鏇存柊 `extension/manifest.json`锛?  - 鎵€鏈?AI 鐩稿叧鍐呭鑴氭湰娉ㄥ叆搴忓垪缁熶竴琛ュ叆 `shared/ai-usage-meta.js`锛屼负鍚庣画鍚勫钩鍙拌姹傛敞鍏ョ粺涓€鍏冩暟鎹仛鍑嗗銆?- 鏇存柊娴嬭瘯锛?  - `extension/shared/ai-usage-meta.test.js` 鏂板 `createAiUsageOperatorSettingsPatch` 濂戠害楠岃瘉銆?
## 2026-05-28锛圓ishell Tech 鏈€灏忔偓娴獥閲嶆瀯锛?
- 鐢ㄦ埛澶嶇幇纭锛?  - `detail -> 鏌ョ湅 -> mark` 鏃舵棫鐗?Aishell 杩愯鏃剁粡甯镐笉鍑虹幇闈㈡澘銆?  - 鎵嬪姩鍒锋柊鍚庢湁鏃舵墠鍑虹幇鎸夐挳锛屼絾鍚敤鑴氭湰鏃跺埛鏂拌繕浼氬鑷撮〉闈㈢櫧灞忋€?  - 绂佺敤 Aishell 鑴氭湰鍚庨〉闈㈡仮澶嶆甯搞€?- 鏈疆涓嶅啀缁х画鍙犲姞琛ユ敞鍏ョ儹淇紝鐩存帴鎶?Aishell 鍓嶇鏀舵暃涓烘渶灏忕ǔ瀹氱増锛?  - `extension/manifest.json` 鍒犻櫎 Aishell 鐨?`page-world/network-observer.js`銆乣shortcuts.js`銆乣shared/ai-usage-meta.js` 娉ㄥ叆锛屽苟绉婚櫎 `scripting` / `webNavigation` 鏉冮檺銆?  - `extension/background/service-worker.js` 鍒犻櫎 Aishell 鐨?`registerContentScripts / executeScript / webNavigation / tabs.onUpdated` 鍔ㄦ€佽ˉ娉ㄥ叆閫昏緫銆?  - `extension/sites/aishell-tech/minnan-helper/ui-panel.js` 閲嶅啓涓虹函鎮诞绐楋紝鍙繚鐣?`璇嗗埆` 涓?`鎵归噺璇嗗埆` 涓や釜鎸夐挳锛屼笉鍐嶅線鍘熼〉闈笟鍔″尯鎻掑叆琛屽唴鎸夐挳銆?  - `extension/sites/aishell-tech/minnan-helper/content.js` 閲嶅啓涓烘渶灏忚繍琛屾椂锛氬彧鍋氳矾鐢辫瘑鍒€佸崟鏉¤瘑鍒€侀『搴忔壒閲忚瘑鍒笌鎮诞绐楃姸鎬佹洿鏂般€?  - `extension/sites/aishell-tech/minnan-helper/data-api.js` 鏀逛负鐩存帴浠庨〉闈?`localStorage/sessionStorage` 鎵弿 JWT锛屽苟鐩存帴璇锋眰 `markapi.aishelltech.com` 鐨?`task/detail` 涓?`packageItemList`锛屼笉鍐嶄緷璧栦富涓栫晫鎶撳寘缂撳瓨銆?- 褰撳墠杈圭晫閲嶆柊鏀剁揣锛?  - 鍙獙璇佹偓娴獥鍙鎬т笌璇嗗埆閾捐矾銆?  - 涓嶈嚜鍔ㄥ～鍏ワ紝涓嶈嚜鍔ㄤ繚瀛橈紝涓嶈嚜鍔ㄦ彁浜わ紝涓嶈法鍒嗗寘銆?
## 2026-05-28锛圓I 璋冪敤鏃ュ織瀹炵幇璁″垝锛?
- 鏂板瀹炵幇璁″垝锛?  - `docs/superpowers/plans/2026-05-28-ai-call-logging-implementation.md`
- 鍥哄畾瀹炵幇椤哄簭锛?  - 鍓嶇鍏变韩 `ai-usage-meta` 鍔╂墜
  - options 棣栭〉鍏ㄥ眬 `AI 璋冪敤浣跨敤浜篳
  - 鍚勫钩鍙板墠绔?AI 璇锋眰缁熶竴鎷︽埅涓?request meta 娉ㄥ叆
  - `platform-resources/backend/ai-call-log/` 鍏变韩鏃ュ織鏍稿績
  - `ai-framework` 璺敱灞傜粺涓€鏍￠獙涓庢棩蹇楅挬瀛?  - DataBaker / Aishell / Magic Data / LabelX / Task21 鍒嗗潡鎺ュ叆
- 鍥哄畾瀹炵幇鍙ｅ緞锛?  - 鏃ュ織鎸夎剼鏈洰褰曟寜澶╁啓 CSV
  - 鍏叡鍒楁渶灏忓寲锛屼笉鍐嶅鐢?DataBaker 鏃уぇ瀹借〃
  - `promptTokens / completionTokens` 涓轰富锛宍totalTokens` 浠呭厹搴?  - 榛樿淇濈暀鑴辨晱鍚庣殑 `rawResponseJson / rawErrorJson`
  - 椤圭洰榛樿涓嶄娇鐢?mock锛屾棩蹇楀疄鐜颁笉鍥寸粫 mock 灞曞紑

## 2026-05-28锛圓I 璋冪敤鏃ュ織缁熶竴璁板綍璁捐鏂囨。锛?
- 鏂板璁捐鏂囨。锛?  - `docs/superpowers/specs/2026-05-28-ai-call-logging-design.md`
- 鍥哄畾鏈疆 AI 璋冪敤鏃ュ織鏂规锛?  - 鍚勮剼鏈洰褰曠嫭绔嬩繚瀛樸€佹寜澶╁垏鍒?CSV
  - 鍏叡瀛楁鏈€灏忓寲锛岃剼鏈瓧娈垫墿灞曞寲
  - `AI 璋冪敤浣跨敤浜篳 浣滀负鍓嶇鍏ㄥ眬鍏叡蹇呭～瀛楁
  - `promptTokens / completionTokens` 涓轰富锛宍totalTokens` 浠呬綔鍏滃簳
  - 榛樿淇濈暀鑴辨晱鍚庣殑鍘熷杩斿洖 JSON锛屼笉鍐嶆妸涓氬姟缁撴灉缁熶竴鎷嗗垪
  - 椤圭洰榛樿涓嶄娇鐢?mock锛屾棩蹇楄璁′笉鍥寸粫 mock 鏋勫缓

## 2026-05-28锛圖ataBaker data 鐩綍缁х画鏀跺彛 CSV 涓?merge 閫昏緫锛?
- 鏂板 `platform-resources/data-baker/round-one-quality/data/scripts/csv.js`锛?  - 鎶藉嚭 legacy 琛ㄥご褰掍竴銆丆SV 瑙ｆ瀽銆佽鏁扮粺璁″拰 UTF-8 BOM 鍐欏嚭銆?- 鏂板 `platform-resources/data-baker/round-one-quality/data/scripts/merge.js`锛?  - 鎶藉嚭 CSV 鍞竴閿绠椼€丆SV merge 缁熻鍜?rawRecords merge銆?- 鏂板娴嬭瘯锛?  - `platform-resources/data-baker/round-one-quality/data/scripts/csv.test.js`
  - `platform-resources/data-baker/round-one-quality/data/scripts/merge.test.js`
- 鏇存柊 `platform-resources/data-baker/round-one-quality/backend/export-store.js`锛?  - 涓嶅啀鍐呰仈缁存姢 CSV parse/stringify銆佽〃澶村綊涓€鍜?merge 缁嗚妭銆?  - 褰撳墠涓昏淇濈暀鏃?latest 璇诲彇涓庡鍑烘€讳綋缂栨帓锛汣SV helper銆乵erge helper 涓?persist helper 宸蹭笅娌夊埌 `data/scripts/*.js`銆?  - 椤烘墜淇 history 鏂囦欢鍚嶇敓鎴愶紝閬垮厤 `persistHistory=1` 鏃舵妸 ISO 鏃堕棿閲岀殑 `:` 鍐欒繘鏂囦欢鍚嶏紝瀵艰嚧 Windows 涓嬫棤娉曡惤鐩樸€?
## 2026-05-28锛圖ataBaker data 鐩綍缁х画鏀跺彛鎸佷箙鍖栧啓鍏ラ€昏緫锛?
- 鏂板 `platform-resources/data-baker/round-one-quality/data/scripts/persist.js`锛?  - 鎶藉嚭 latest.csv / latest-raw.json / latest.json 鍐欏叆
  - 鎶藉嚭 history CSV / raw.json 鍐欏叆
  - 鎶藉嚭 upload events JSONL 杩藉姞
  - 鎶藉嚭 latest meta 涓?upload event payload 缁勮
- 鏂板娴嬭瘯锛?  - `platform-resources/data-baker/round-one-quality/data/scripts/persist.test.js`
- 鏇存柊 `platform-resources/data-baker/round-one-quality/backend/export-store.js`锛?  - `ensureDataDir` 鏀逛负澶嶇敤 `data/scripts/persist.js`
  - latest/history/events 鐨勫疄闄呭啓鍏ュ拰 meta/event payload 缁勮鏀逛负澶嶇敤 `data/scripts/persist.js`
  - `export-store.js` 褰撳墠涓昏淇濈暀 CSV / raw merge銆佹棫 latest 璇诲彇鍜屾€讳綋缂栨帓

## 2026-05-28锛圖ataBaker data 鐩綍缁х画鏀跺彛 upload 涓?history 渚э級

- 鏂板 `platform-resources/data-baker/round-one-quality/data/scripts/upload.js`锛?  - 鎶藉嚭 `export/upload` 鐨?payload 褰掍竴銆佸ぇ灏忔牎楠屽拰 `rawJson -> rawRecords` legacy alias 鍏煎銆?- 鏇存柊 `platform-resources/data-baker/round-one-quality/data/scripts/fetch.js`锛?  - 鏂板 `latest.json` 璇诲彇銆?  - history 鍒楄〃琛ュ厖瀵瑰簲 `*.raw.json` 鏄惁瀛樺湪銆?  - 鏂板 `upload-events.jsonl` 鏈€杩戜簨浠惰鍙栥€?- 鏇存柊 `platform-resources/data-baker/round-one-quality/backend/export-routes.js`锛?  - `upload` 鏀逛负澶嶇敤 `data/scripts/upload.js`
  - `config` 琛ュ厖 latest meta銆乭istory 鏁伴噺鍜屾渶杩?upload events 鎽樿
  - `list` 杩斿洖鐨?history CSV 椤硅ˉ鍏?`rawJsonExists/rawJsonName`
- 鏂板娴嬭瘯锛?  - `platform-resources/data-baker/round-one-quality/data/scripts/upload.test.js`
  - `platform-resources/data-baker/round-one-quality/data/scripts/fetch.test.js` 鏂板 upload/history 鍦烘櫙
- 鏂板鏁版嵁璧勪骇锛?  - `data/assets/mappings/upload-payload.md`
  - `data/assets/samples/upload-payload-sample.json`
  - `data/assets/samples/latest-meta-sample.json`
  - `data/assets/samples/upload-events-sample.jsonl`

## 2026-05-28锛圖ataBaker data 鐩綍缁х画鏀跺彛涓嬭浇鑴氭湰涓庢牱渚嬶級

- 鏂板 `platform-resources/data-baker/round-one-quality/data/field-mappings.js`锛?  - 鎶藉嚭 DataBaker 瀵煎嚭 canonical CSV 鍒椼€乴egacy 琛ㄥご alias 鍜屽敮涓€閿瓧娈电粍銆?- 鏂板 `platform-resources/data-baker/round-one-quality/data/scripts/download.js`锛?  - 鎶藉嚭 DataBaker `latest.csv` 涓嬭浇 target 缁勮閫昏緫銆?- 鏂板 `platform-resources/data-baker/round-one-quality/data/scripts/fetch.js`锛?  - 鎶藉嚭 latest 蹇収瀛樺湪鎬ц鍙栧拰 history CSV 鍒楄〃璇诲彇閫昏緫銆?- 鏂板娴嬭瘯锛?  - `platform-resources/data-baker/round-one-quality/data/field-mappings.test.js`
  - `platform-resources/data-baker/round-one-quality/data/scripts/download.test.js`
  - `platform-resources/data-baker/round-one-quality/data/scripts/fetch.test.js`
- 鏂板鏁版嵁璧勪骇鐩綍锛?  - `data/assets/mappings/export-columns.md`
  - `data/assets/samples/latest-sample.csv`
  - `data/assets/samples/latest-raw-sample.json`
  - `data/runtime/.gitkeep`
- 鏇存柊 `platform-resources/data-baker/round-one-quality/backend/export-store.js`锛?  - 鏀逛负澶嶇敤 `data/field-mappings.js` 涓殑 alias 鍜屽敮涓€閿瓧娈电粍銆?- 鏇存柊 `platform-resources/data-baker/round-one-quality/backend/export-routes.js`锛?  - `download` 鏀逛负澶嶇敤 `data/scripts/download.js`
  - `list` 鏀逛负澶嶇敤 `data/scripts/fetch.js`
  - `config` 琛ュ厖 latest 蹇収瀛樺湪鎬у瓧娈?
## 2026-05-28锛圖ataBaker 瀵煎嚭涓嬭浇閾捐矾鎺ュ叆鍏变韩 core锛?
- 鏂板 `platform-resources/backend/project-data-download/csv-file-download-core.js`锛?  - 鎶藉嚭閫氱敤 CSV 鏂囦欢涓嬭浇 core锛岀粺涓€澶勭悊鏂囦欢瀛樺湪鎬ф鏌ャ€佷笅杞芥枃浠跺悕鍜?`GET/HEAD` 涓嬭浇鍝嶅簲澶淬€?- 鏂板 `platform-resources/data-baker/round-one-quality/data/adapter.js`锛?  - 鏀跺彛 DataBaker 涓嬭浇杞ㄩ亾鍏冩暟鎹€乣latest.csv` 璺緞瑙ｆ瀽鍜屽叡浜笅杞借建閬撴暟鎹泦瀹氫箟銆?- 鏇存柊 `platform-resources/data-baker/round-one-quality/backend/export-store.js`锛?  - 鎶藉嚭 `resolveExportStorePaths`锛岀粺涓€ `export-data` 璺緞鍙ｅ緞锛屼緵 data adapter 鍜屾棫瀵煎嚭 store 鍏卞悓澶嶇敤銆?- 鏇存柊 `platform-resources/data-baker/round-one-quality/backend/export-routes.js`锛?  - `GET/HEAD /api/data-baker/round-one-quality/export/download` 鏀逛负閫氳繃鍏变韩 CSV 鏂囦欢涓嬭浇 core 椹卞姩銆?  - 澶栭儴 API path 淇濇寔涓嶅彉锛涗笂浼犮€丆SV 鍚堝苟銆乣latest-raw.json`銆乭istory/events 閫昏緫浠嶄繚鐣欏湪 DataBaker 鑷繁鐨勫悗绔疄鐜伴噷銆?- 鏇存柊 DataBaker README銆佺粺涓€鍚庣 README銆佸钩鍙扮储寮曚笌 `platform-resources/README.md`锛?  - 鏄庣‘ DataBaker 涓嬭浇閾捐矾宸插紑濮嬫帴鍏ヤ笌 LabelX 鍚屼竴鏉?`project-data-download` 澶嶇敤杞ㄩ亾銆?
## 2026-05-28锛圓libaba LabelX 蹇垽涓嬭浇閾捐矾鎺ュ叆鍏变韩 core 绗簩鍧楋級

- 鏂板 `platform-resources/alibaba-labelx/asr-judgement/data/adapter.js`锛?  - 鏀跺彛蹇垽涓嬭浇 / existing 鐨勮剼鏈骇宸紓銆?- 鏂板 `platform-resources/alibaba-labelx/asr-judgement/data/adapter.test.js`锛?  - 鍥哄畾 3 涓爣娉ㄦЫ浣嶃€佸鏍告Ы浣嶄笌 `complete` 鍒ゅ畾琛屼负銆?- 鏇存柊 `platform-resources/alibaba-labelx/asr-judgement/backend/routes.js`锛?  - `download / suppliers / existing` 鏀逛负閫氳繃鍏变韩 LabelX 涓嬭浇 core 椹卞姩銆?  - 澶栭儴 API path 淇濇寔涓嶅彉銆?- 鏇存柊蹇垽 README銆佸悗绔?README銆丩abelX 骞冲彴 README銆佸钩鍙扮储寮曘€乣platform-resources/README.md` 涓庣粺涓€鍚庣 README锛?  - 鏄庣‘ LabelX 杞啓涓庡揩鍒ょ殑涓嬭浇閾捐矾閮藉凡寮€濮嬪鐢ㄥ叡浜?core銆?
## 2026-05-28锛圓libaba LabelX 杞啓涓嬭浇閾捐矾鎺ュ叆鍏变韩 core 绗竴鍧楋級

- 鏂板 `platform-resources/backend/project-data-download/labelx-download-core.js`锛?  - 鎶藉嚭 LabelX 杞啓/蹇垽鍏辩敤鐨勪笅杞芥枃浠跺悕銆佸搷搴斿ご銆佷緵搴斿晢杩囨护鍜?`GET/HEAD /download` 涓绘祦绋嬨€?- 鏂板 `platform-resources/backend/project-data-download/labelx-existing-core.js`锛?  - 鎶藉嚭 LabelX 杞啓/蹇垽鍏辩敤鐨?`existing` 鍒嗗寘鍒嗙粍涓庡搷搴旂粍瑁呮祦绋嬨€?- 鏂板娴嬭瘯锛?  - `platform-resources/backend/project-data-download/__tests__/labelx-download-core.test.js`
  - `platform-resources/backend/project-data-download/__tests__/labelx-existing-core.test.js`
- 鏂板 `platform-resources/alibaba-labelx/asr-transcription/data/adapter.js`锛?  - 鏀跺彛杞啓涓嬭浇 / existing 鐨勮剼鏈骇宸紓銆?- 鏂板 `platform-resources/alibaba-labelx/asr-transcription/data/adapter.test.js`锛?  - 鍥哄畾鎸夎鑹查€?row銆乣complete` 鍒ゅ畾鍜屽厓鏁版嵁瀵煎嚭琛屼负銆?- 鏇存柊 `platform-resources/alibaba-labelx/asr-transcription/backend/routes.js`锛?  - `download / suppliers / existing` 鏀逛负閫氳繃鍏变韩 LabelX 涓嬭浇 core 椹卞姩銆?  - 澶栭儴 API path 淇濇寔涓嶅彉銆?- 鏇存柊杞啓 README銆佸悗绔?README銆佺粺涓€鍚庣 README锛?  - 鏄庣‘褰撳墠鍙粺涓€鍐呴儴涓嬭浇瀹炵幇锛屼笉鏀瑰澶栦笅杞藉叆鍙ｃ€?
## 2026-05-28锛圓ishell Tech 鍙鎬т笌 defaults 鍥為€€淇锛?
- 鏇存柊 `extension/sites/aishell-tech/minnan-helper/ui-panel.js`锛?  - 闈㈡澘涓嶅啀鎻掑湪 `.mark-area` 澶栭儴搴曢儴锛屾敼涓烘寕鍦ㄦ爣娉ㄨ〃鍗曞彲瑙佸尯鍐呫€佽〃鍗曞墠鏂癸紝閬垮厤鎸夐挳钀藉埌椤甸潰鏈€涓嬫柟鐪嬩笉瑙併€?- 鏇存柊 `extension/options/options.js`锛?  - 琛ラ綈 Aishell 澶嶇敤 DataBaker 妯″瀷涓嬫媺鐨勯€夐」鏋勫缓鍑芥暟锛屼慨澶嶅惉闊虫ā鍨嬨€佹瘮杈冩ā鍨嬨€佸崟妯″瀷涓嬫媺涓虹┖鐨勯棶棰樸€?  - Aishell defaults 璇诲彇澶辫触鏃讹紝鍏堝洖閫€鍒?DataBaker defaults 鎺ュ彛锛涜嫢浠嶅け璐ワ紝鍐嶅洖閫€鍒版湰鍦?DataBaker Prompt 涓庢ā鍨嬮粯璁ゅ€笺€?  - 鏈湴 fallback 榛樿鍊兼敼涓虹洿鎺ュ甫鍑?DataBaker 鍚屾 `listenPrompt` / `comparePrompt`锛岀‘淇?options 椤甸潰鑳界湅鍒板悓娆?Prompt 鍩虹嚎銆?
## 2026-05-28锛圓ishell Tech 闂藉崡璇姪鎵嬬嫭绔嬪叏閲忔帴鍏ワ級

- 鏂板 `extension/sites/aishell-tech/minnan-helper/` 杩愯鏃朵唬鐮侊細
  - 閫氳繃 page-world 瑙傚療灞傜紦瀛?`task/detail`銆乣packageItemList`銆乣markDetail`銆乣getShortMark`銆乣SaveShortMark`锛屼笉鐩存帴澶勭悊骞冲彴 JWT銆?  - `/mytask/mark` 鏂板褰撳墠鏉?AI 鎺ㄨ崘銆佸鍒躲€佸～鍏ュ拰鎵归噺涓茶鐪熷疄淇濆瓨闈㈡澘銆?  - 鎵归噺妯″紡鍥哄畾涓衡€滃苟鍙戦鍙?AI 缁撴灉 + 涓茶濉叆骞剁偣鍑婚〉闈㈢湡瀹炰繚瀛樻寜閽€濓紝鍙鐞嗗綋鍓嶅垎鍖呫€佷粠褰撳墠閫変腑鏉″紑濮嬨€佽烦杩囧凡瀹屾垚鏉＄洰銆?- 鏂板 `platform-resources/aishell-tech/minnan-helper/` 鑴氭湰绾х洰褰曪細
  - `ai/adapter.js`銆乣backend/ai-service.js`銆乣backend/ai-routes.js`銆乣backend/index.js`銆?  - 鏂板鐙珛鎺ュ彛 `GET /api/aishell-tech/minnan-helper/ai/recommend/health`銆乣GET /defaults`銆乣POST /recommend`銆?  - 榛樿 Prompt銆佹ā鍨嬬櫧鍚嶅崟銆佸苟鍙戝綊涓€涓庢帹鑽愭墽琛岄摼鍙傝€?DataBaker round-one-quality锛屼絾淇濇寔 Aishell 鐙珛鑴氭湰 ID銆佺嫭绔嬭瘝琛ㄧ洰褰曞拰鐙珛鍝嶅簲鍖呰銆?- 鏇存柊鎵╁睍渚ф帴鍏ワ細
  - `extension/manifest.json` 澧炲姞 `mark.aishelltech.com` / `markapi.aishelltech.com` 鏉冮檺涓庡唴瀹硅剼鏈敞鍏ャ€?  - `extension/shared/constants.js`銆乣extension/shared/storage.js`銆乣extension/options/options.js`銆乣extension/options/options.html`銆乣extension/popup/popup.js` 鏂板 Aishell 骞冲彴銆佽剼鏈€佽鎯呴〉閰嶇疆涓庡綋鍓嶉〉璇嗗埆銆?- 鏇存柊鏂囨。锛?  - `platform-resources/aishell-tech/README.md` 浠庘€滄寮忔帴鍏ュ噯澶囨€佲€濇敼涓衡€滅嫭绔嬭剼鏈凡鎺ュ叆鈥濄€?  - 琛ラ綈 `extension/sites/aishell-tech/minnan-helper/README.md`銆乣platform-resources/aishell-tech/minnan-helper/README.md`銆乣platform-resources/backend/README.md`銆佹牴 `README.md`銆乣docs/platforms-index.md` 鐨勫悓姝ヨ鏄庛€?
## 2026-05-28锛圓libaba LabelX 蹇垽鎺ュ叆 AI framework 妗ユ帴灞傦級

- 鏂板 `platform-resources/alibaba-labelx/asr-judgement/ai/adapter.js`锛?  - 鎶婂揩鍒?`suggest` 璇锋眰鏄犲皠鍒扮粺涓€ `ai-framework` 杈撳叆濂戠害銆?  - 淇濈暀鏃ф垚鍔?澶辫触鍝嶅簲缁撴瀯锛岄伩鍏嶅墠绔悓姝ユ敼濂戠害銆?- 鏂板 `platform-resources/alibaba-labelx/asr-judgement/ai/adapter.test.js`锛?  - 鍥哄畾 `normalizeInput`銆乴egacy success body銆乴egacy error body 涓変釜妗ユ帴琛屼负銆?- 鏂板鐩綍璇存槑锛?  - `platform-resources/alibaba-labelx/asr-judgement/ai/assets/README.md`
  - `platform-resources/alibaba-labelx/asr-judgement/data/README.md`
- 鏂板 `platform-resources/alibaba-labelx/asr-judgement/backend/ai-suggest-request.js`锛?  - 鎶藉嚭蹇垽 AI 璇锋眰褰掍竴銆丄I 鍙傛暟娓呮礂鍜岃劚鏁忛敊璇緟鍔╁嚱鏁帮紝渚?adapter 涓庝笟鍔″眰鍏辩敤銆?- 鏇存柊 `platform-resources/alibaba-labelx/asr-judgement/backend/ai-routes.js`锛?  - `POST /api/alibaba-labelx/asr-judgement/ai/suggest` 鏀逛负閫氳繃缁熶竴 `ai-framework` route factory 椹卞姩銆?  - 瀵瑰缁х画淇濇寔 `success + data` 涓庡師閿欒缁撴瀯鍏煎銆?  - `health/defaults` 淇濇寔鍘熸湁杩斿洖璇箟锛屾湰杞厛鍋氭ˉ鎺ュ紡杩佺Щ銆?- 鏇存柊蹇垽 README 涓庡悗绔?README锛?  - 鏄庣‘褰撳墠鍙縼绉?AI 鎺ㄨ崘涓婚摼璺€?  - 缁熻涓婁紶銆乪xisting 妫€鏌ャ€丆SV 鍚堝苟銆佷笅杞戒笌 suppliers 閫昏緫浠嶄繚鐣欏湪 `backend/`銆?
## 2026-05-28锛圓libaba LabelX 杞啓鎺ュ叆 AI framework 妗ユ帴灞傦級

- 鏂板 `platform-resources/alibaba-labelx/asr-transcription/ai/adapter.js`锛?  - 鎶婅浆鍐?`suggest-current` 璇锋眰鏄犲皠鍒扮粺涓€ `ai-framework` 杈撳叆濂戠害銆?  - 淇濈暀鏃ф垚鍔?澶辫触鍝嶅簲缁撴瀯锛岄伩鍏嶅墠绔悓姝ユ敼濂戠害銆?- 鏂板 `platform-resources/alibaba-labelx/asr-transcription/ai/adapter.test.js`锛?  - 鍥哄畾 `normalizeInput`銆乴egacy success body銆乴egacy error body 涓変釜妗ユ帴琛屼负銆?- 鏂板鐩綍璇存槑锛?  - `platform-resources/alibaba-labelx/asr-transcription/ai/assets/README.md`
  - `platform-resources/alibaba-labelx/asr-transcription/data/README.md`
- 鏂板 `platform-resources/alibaba-labelx/asr-transcription/backend/ai-suggest-request.js`锛?  - 鎶藉嚭杞啓 AI 璇锋眰褰掍竴銆丄I 鍙傛暟娓呮礂鍜岃劚鏁忛敊璇緟鍔╁嚱鏁帮紝渚?adapter 涓庝笟鍔″眰鍏辩敤銆?- 鏇存柊 `platform-resources/alibaba-labelx/asr-transcription/backend/ai-routes.js`锛?  - `POST /api/alibaba-labelx/asr-transcription/ai/suggest-current` 鏀逛负閫氳繃缁熶竴 `ai-framework` route factory 椹卞姩銆?  - 瀵瑰缁х画淇濇寔 `success + data` 涓庡師閿欒缁撴瀯鍏煎銆?  - `health/defaults` 淇濇寔鍘熷疄鐜帮紝鏈疆鍏堝仛妗ユ帴寮忚縼绉汇€?- 鏇存柊杞啓 README 涓庡悗绔?README锛?  - 鏄庣‘褰撳墠鍙縼绉?AI 鎺ㄨ崘涓婚摼璺€?  - 缁熻涓婁紶銆丆SV 鍚堝苟銆佷笅杞戒笌 suppliers 閫昏緫浠嶄繚鐣欏湪 `backend/`銆?
## 2026-05-28锛圓baka AI Task21 鎺ュ叆 AI framework 妗ユ帴灞傦級

- 鏂板 `platform-resources/abaka-ai/task21/ai/adapter.js`锛?  - 鎶?Task21 `analyze` 璇锋眰鏄犲皠鍒扮粺涓€ `ai-framework` 杈撳叆濂戠害銆?  - 淇濈暀鏃ф垚鍔?澶辫触鍝嶅簲缁撴瀯锛岄伩鍏嶅墠绔悓姝ユ敼濂戠害銆?- 鏂板 `platform-resources/abaka-ai/task21/ai/adapter.test.js`锛?  - 鍥哄畾 `normalizeInput`銆乴egacy success body銆乴egacy error body 涓変釜妗ユ帴琛屼负銆?- 鏂板鐩綍璇存槑锛?  - `platform-resources/abaka-ai/task21/ai/assets/README.md`
  - `platform-resources/abaka-ai/task21/data/README.md`
- 鏂板 `platform-resources/abaka-ai/task21/backend/ai-analyze-request.js`锛?  - 鎶藉嚭 analyze 璇锋眰褰掍竴鍜岃繍琛屾椂妯″瀷閫夐」瑙ｆ瀽锛屼緵 adapter 涓?Task21 涓氬姟灞傚叡鐢ㄣ€?- 鏇存柊 `platform-resources/abaka-ai/task21/backend/ai-routes.js`锛?  - `POST /api/abaka-ai/task21/ai/analyze` 鏀逛负閫氳繃缁熶竴 `ai-framework` route factory 椹卞姩銆?  - 瀵瑰缁х画淇濇寔 Task21 鏃ф垚鍔?澶辫触鍝嶅簲缁撴瀯銆?  - `health/defaults` 淇濇寔鍘熷疄鐜帮紝鏈疆鍏堝仛妗ユ帴寮忚縼绉汇€?- 鏇存柊 Task21 README 涓庡悗绔?README锛?  - 鏄庣‘褰撳墠鍙縼绉?analyze 涓婚摼璺€?  - 鍥哄畾 `ai/assets/` 涓?`data/` 鐩綍杈圭晫锛屽悗缁啀閫愭杩佺Щ prompt / rules / schema / defaults / 缁熻涓嬭浇閫昏緫銆?
## 2026-05-28锛圡agic Data 瀹㈠璇濆姪鎵嬫帴鍏?AI framework 妗ユ帴灞傦級

- 鏂板 `platform-resources/magic-data/hakka-helper/ai/adapter.js`锛?  - 鎶婂瀹惰瘽鍔╂墜 `review-current` 璇锋眰鏄犲皠涓虹粺涓€ `ai-framework` 杈撳叆濂戠害銆?  - 淇濈暀鏃ф垚鍔?澶辫触杩斿洖缁撴瀯锛屽苟缁х画鍏煎 legacy `annotator` 璺緞銆?- 鏂板 `platform-resources/magic-data/hakka-helper/ai/adapter.test.js`锛?  - 鍥哄畾 `normalizeInput`銆乴egacy success body銆乴egacy error body 涓変釜妗ユ帴琛屼负銆?- 鏂板鐩綍璇存槑锛?  - `platform-resources/magic-data/hakka-helper/ai/assets/README.md`
  - `platform-resources/magic-data/hakka-helper/data/README.md`
- 鏂板 `platform-resources/magic-data/hakka-helper/backend/ai-review-request.js`锛?  - 鎶藉嚭璇锋眰褰掍竴 helper锛屼緵 adapter 涓庢棫涓氬姟灞傚叡鐢紝閬垮厤閲嶅缁存姢瀹㈠璇濊姹傛槧灏勮鍒欍€?- 鏇存柊 `platform-resources/magic-data/hakka-helper/backend/ai-routes.js`锛?  - `POST /api/magic-data/hakka-helper/ai/review-current` 鏀逛负閫氳繃缁熶竴 `ai-framework` route factory 椹卞姩銆?  - legacy `/api/magic-data/annotator/ai/review-current` 缁х画淇濈暀锛屽苟澶嶇敤鍚屼竴鏉?framework 妗ユ帴閾捐矾銆?  - `health/defaults` 淇濇寔鍘熷疄鐜帮紝鏈疆鍏堝仛妗ユ帴寮忚縼绉汇€?- 鍏变韩妗ユ帴淇锛?  - 淇 `platform-resources/magic-data/minnan-helper/backend/ai-routes.js` 涓?route factory 鐨?`routeContext` 杞彂鏂瑰紡锛岄伩鍏嶇湡瀹?POST 璇锋眰涓婁笅鏂囦紶閫掗敊璇€?
## 2026-05-28锛圡agic Data 闂藉崡璇姪鎵嬫帴鍏?AI framework 妗ユ帴灞傦級

- 鏂板 `platform-resources/magic-data/minnan-helper/ai/adapter.js`锛?  - 鎶婇椊鍗楄鍔╂墜 `review-current` 璇锋眰鏄犲皠涓虹粺涓€ `ai-framework` 杈撳叆濂戠害銆?  - 淇濈暀鏃ф垚鍔?澶辫触杩斿洖缁撴瀯锛岄伩鍏嶅墠绔悓姝ユ敼濂戠害銆?- 鏂板 `platform-resources/magic-data/minnan-helper/ai/adapter.test.js`锛?  - 鍥哄畾 `normalizeInput`銆乴egacy success body銆乴egacy error body 涓変釜妗ユ帴琛屼负銆?- 鏂板鐩綍璇存槑锛?  - `platform-resources/magic-data/minnan-helper/ai/assets/README.md`
  - `platform-resources/magic-data/minnan-helper/data/README.md`
- 鏇存柊 `platform-resources/magic-data/minnan-helper/backend/ai-routes.js`锛?  - `POST /api/magic-data/minnan-helper/ai/review-current` 鏀逛负閫氳繃缁熶竴 `ai-framework` route factory 椹卞姩銆?  - 缁х画澶嶇敤鍘?`ai-service.js` 鐨?`reviewCurrent`銆乭ealth/defaults銆侀槦鍒椼€佺紦瀛樸€佽瘝琛ㄤ笌 provider 閫昏緫銆?  - 瀵瑰鍝嶅簲缁撴瀯淇濇寔 `success + data + cache + backend` 涓庡師閿欒缁撴瀯鍏煎銆?- 鏇存柊闂藉崡璇姪鎵?README 涓庡悗绔?README锛?  - 鏄庣‘褰撳墠鏄ˉ鎺ュ紡杩佺Щ锛宍health/defaults` 浠嶄繚鐣欐棫瀹炵幇銆?  - 鍥哄畾 `ai/` 涓?`data/` 鐩綍杈圭晫锛屽悗缁啀閫愭鎶?prompt / schema / lexicon 杩佸叆 `ai/assets/`銆?
## 2026-05-28锛圓ishell Tech 姝ｅ紡鎺ュ叆鍑嗗鎬佸悓姝ワ級

- 鏇存柊 `platform-resources/aishell-tech/README.md`锛?  - 灏嗙姸鎬佷粠鈥滃彧璇绘帰娴嬧€濇敹鍙ｄ负鈥滄寮忔帴鍏ュ噯澶団€濄€?  - 鏄庣‘棣栭樁娈垫帴鍏ヨ寖鍥存槸 `鎴戠殑浠诲姟 -> 浠诲姟璇︽儏 -> 鏁版嵁鏍囨敞`銆?  - 鏄庣‘褰撳墠棣栭樁娈典笉闇€瑕佷笓灞炲悗绔紝鍙厛鍋氳繍琛屾椂浠ｇ爜鎺ュ叆銆?  - 鏄庣‘鍚庣画寰呰ˉ椤癸細缁勭粐绠＄悊璇︾粏 DOM銆佽川妫€/楠屾敹瑙掕壊瑙嗗浘銆佸脊绐椼€侀暱鏍囨敞涓庤川妫€/楠屾敹鍐欐搷浣溿€?- 鏇存柊 `platform-resources/aishell-tech/network/README.md` 涓?`page-structure/README.md`锛?  - 缁熶竴鍙ｅ緞涓衡€滄牳蹇冮摼璺祫鏂欏凡瓒冲鏀拺棣栭樁娈佃繍琛屾椂浠ｇ爜寮€宸モ€濄€?  - `05-organization.md` 鏀逛负鈥滃垵鐗堝崰浣嶅畬鎴愶紝璇︾粏 DOM 寰呰ˉ鈥濓紝涓嶅啀涓庢枃浠跺疄闄呭瓨鍦ㄧ姸鎬佸啿绐併€?- 鏇存柊 `platform-resources/aishell-tech/network/pending-capture.md` 涓?`page-structure/pending-capture.md`锛?  - 淇缂栧彿娣蜂贡锛屾寜棣栭樁娈甸樆濉炲害閲嶆柊鎺掑簭銆?- 鏇存柊 `AGENTS.md`銆佹牴 `README.md`銆乣docs/platforms-index.md`銆乣platform-resources/README.md`锛?  - 鎶?Aishell Tech 鐨勪粨搴撶骇鐘舵€佺粺涓€鏀逛负鈥滄寮忔帴鍏ュ噯澶囨€佲€濄€?  - 鏄庣‘褰撳墠浠嶆棤 `extension/sites/aishell-tech/` 杩愯鏃朵唬鐮佷笌涓撳睘鍚庣娉ㄥ唽銆?
## 2026-05-28锛圖ataBaker adapter 鎺ュ叆 AI framework锛?
- 鏂板 `platform-resources/data-baker/round-one-quality/ai/adapter.js`锛?  - 浣滀负棣栦釜鑴氭湰绾?adapter锛屾妸 DataBaker recommend 璇锋眰鏄犲皠鍒扮粺涓€ framework 杈撳叆濂戠害銆?  - 淇濈暀鏃?recommend 鎴愬姛/澶辫触鍝嶅簲缁撴瀯锛岄伩鍏嶅墠绔悓姝ユ敼濂戠害銆?- 鏂板 `platform-resources/data-baker/round-one-quality/ai/adapter.test.js`锛?  - 鍥哄畾 `normalizeInput`銆佹棫 success body銆佹棫 error body 涓変釜妗ユ帴琛屼负銆?- 鏂板鐩綍璇存槑锛?  - `platform-resources/data-baker/round-one-quality/ai/assets/README.md`
  - `platform-resources/data-baker/round-one-quality/data/README.md`
- 鏇存柊 `platform-resources/data-baker/round-one-quality/backend/ai-routes.js`锛?  - recommend 鍏ュ彛鏀圭敱缁熶竴 `ai-framework` route factory 椹卞姩銆?  - 缁х画澶嶇敤鍘?`ai-service.js`銆乣ai-legacy-omni-service.js`銆乨edupe 涓?jobs 閫昏緫銆?  - `health/defaults/jobs` 褰撳墠淇濇寔鍘熷疄鐜帮紝鍏堝仛妗ユ帴寮忚縼绉伙紝涓嶄竴娆℃€ф帹鍊掍笟鍔″眰銆?- 鏇存柊 `platform-resources/backend/ai-framework/README.md`锛?  - 鏄庣‘ route factory 鐜板凡鏀寔 `createSuccessBody / createErrorBody`锛屼究浜庢棫椤圭洰閫愪釜杩佺Щ銆?
## 2026-05-28锛坆ackend AI framework 楠ㄦ灦锛?
- 鏂板 `platform-resources/backend/ai-framework/` 绗竴鐗堥鏋讹細
  - `contracts/normalized-request.js`
  - `contracts/normalized-response.js`
  - `core/create-ai-route.js`
  - `loaders/project-assets.js`
  - `runtime/execute-project-pipeline.js`
  - `registry/project-ai-registry.js`
  - `index.js`
  - `README.md`
- 鏂板 `platform-resources/backend/ai-framework/__tests__/ai-framework.test.js`锛?  - 鍏堢敤 Node 鍐呯疆娴嬭瘯鍥哄畾 request/response 濂戠害銆佽祫浜у姞杞姐€乸ipeline 缂栨帓銆乺egistry 鍜?route factory 鐨勬渶灏忚涓恒€?  - 鍏堥獙璇佺己妯″潡鏃舵祴璇曞け璐ワ紝鍐嶈ˉ楠ㄦ灦瀹炵幇锛屼繚鎸佽繖涓€鍧楀彲鍥炲綊銆?- 鏇存柊 `platform-resources/backend/README.md`锛?  - 鎶?`ai-framework/` 绾冲叆缁熶竴鍚庣鑱岃矗璇存槑銆?  - 鏄庣‘褰撳墠鍙槸楠ㄦ灦闃舵锛屾棫椤圭洰璺敱灏氭湭鍒囨崲锛屽悗缁寜杩佺Щ璁″垝閫愬潡鎺ュ叆銆?
## 2026-05-28锛坧latform-resources AI 妗嗘灦杩佺Щ鍩虹嚎锛?
- 鏂板 `docs/architecture/2026-05-28-platform-resources-ai-framework-design.md`锛?  - 鍥哄畾缁熶竴 AI 妗嗘灦鐩爣锛歚platform-resources/backend/ai-framework/ + 椤圭洰 adapter + prompt/schema/lexicon 璧勪骇鐩綍`銆?  - 鍥哄畾鑴氭湰绾ф柊鐩綍鍙ｅ緞锛歚ai/` 涓?`data/` 鍚岀骇锛宍network/`銆乣page-structure/` 缁х画淇濈暀涓洪暱鏈熷钩鍙拌祫鏂欍€?  - 鏄庣‘ Aishell Tech 褰撳墠浠嶆槸璧勬枡鍒濆鍖栧钩鍙帮紝涓嶈繘鍏ユ湰杞?AI 鍚庣杩佺Щ涓荤嚎銆?- 鏂板 `docs/architecture/2026-05-28-platform-resources-ai-framework-migration-plan.md`锛?  - 鎸夆€滄枃妗ｅ熀绾?-> 妗嗘灦楠ㄦ灦 -> DataBaker -> Magic Data -> Abaka -> LabelX -> data 鐩綍褰掍竴鈥濇媶鎴愬彲閫愬潡鎻愪氦鐨勮縼绉婚『搴忋€?  - 姣忓潡瑕佹眰鍏堥獙璇侊紝鍐嶆彁浜わ紝渚夸簬鍥為€€鐗堟湰銆?- 鏇存柊 `AGENTS.md`銆佹牴 `README.md`銆乣docs/README.md`銆乣platform-resources/README.md`锛?  - 鎶婁袱浠借縼绉绘枃妗ｆ帴鍏ュ崗浣滃叆鍙ｏ紝闄嶄綆鍚庣画鍗忎綔鑰呯户缁敼 `platform-resources` 鏃剁殑鐞嗚В鍋忓樊銆?
## 2026-05-27锛圓ishell Tech 鍗忎綔鏂囨。鍚屾锛?
- 鍩轰簬鍚堝苟鎻愪氦 `089bdb8`锛坄鍚堝苟 PR #2: Aishell Tech 骞冲彴璧勬枡鍒濆鍖朻锛夎ˉ榻愰」鐩骇鍗忎綔鏂囨。銆?- 鏇存柊 `AGENTS.md`锛?  - 鏂板 Aishell Tech 骞冲彴璇诲彇鍏ュ彛锛屾槑纭綋鍓嶄负鈥滃钩鍙拌祫鏂欏垵濮嬪寲 / 鍙鎺㈡祴鎬佲€濄€?  - 琛ュ厖渚嬪瑙勫垯锛氭湭鎺ュ叆杩愯鏃朵唬鐮佺殑骞冲彴涓嶈浼€?`extension/sites/<platform>/` 鐩綍锛屽簲鍏堝悓姝?`platform-resources/<platform>/README.md`銆乣docs/platforms-index.md`銆佹牴 `README.md` 涓?`log.md`銆?- 鏇存柊鏍?`README.md`锛?  - 灏?Aishell Tech 绾冲叆褰撳墠閲嶇偣骞冲彴鍙ｅ緞銆?  - 鏄庣‘褰撳墠浠呮湁 `platform-resources/aishell-tech/` 璧勬枡銆佸皻鏃犺繍琛屾椂浠ｇ爜鍜屼笓灞炲悗绔敞鍐屻€?  - 澧炶ˉ Aishell Tech 鏂囨。鍏ュ彛銆?- 鏇存柊 `platform-resources/README.md`锛?  - 鏂板 Aishell Tech 骞冲彴鎬昏銆?  - 鏄庣‘鈥滃钩鍙拌祫鏂欏垵濮嬪寲闃舵鈥濆彲涓存椂浠呬繚鐣?`README.md + network/ + page-structure/`锛屼笉鎻愬墠浼€?`backend/` 鎴?`<script-id>/` 鐩綍銆?- 鏇存柊 `docs/platforms-index.md`锛?  - 淇宸插垹闄?`platform-resources/aishell-tech/network/06-sensitive-operations.md` 鐨勯敊璇紩鐢ㄣ€?  - 鏀逛负寮曠敤 Aishell Tech 鏍?README 鐨勫畨鍏ㄨ竟鐣岀珷鑺傦紝骞惰ˉ鍏呪€滄垜鐨勫洟闃?page-structure 寰呰ˉ閲団€濈殑褰撳墠鐘舵€併€?- 鏇存柊 `platform-resources/aishell-tech/README.md` 涓?`platform-resources/aishell-tech/network/README.md`锛?  - 瀵归綈瀹為檯閲囬泦鐘舵€侊紝鏄庣‘ `page-structure/05-organization.md` 浠嶅緟琛ラ噰銆?  - 璇存槑鏁忔劅鍐欐搷浣滆竟鐣屽凡鏀跺彛鍒板钩鍙版牴 README锛屼笉鍐嶅崟鐙淮鎶?`06-sensitive-operations.md`銆?
## 2026-05-27锛圓ishell Tech 骞冲彴璧勬枡鍒濆鍖栵級

- 鏂板缓 `platform-resources/aishell-tech/` 鐩綍锛屽畬鎴愬钩鍙板彧璇绘帰娴嬮樁娈垫枃妗ｃ€?
- 骞冲彴淇℃伅锛欰ishell Tech 鏁版嵁澶勭悊宸ヤ綔骞冲彴锛屽煙鍚?`mark.aishelltech.com`锛屾妧鏈爤 Vue 2 + Element UI + Wavesurfer.js銆?
- 璧勬枡鍒嗕负涓ゅぇ缁村害锛?
  - **network/**锛堢綉缁滆姹傞噰闆嗭級锛? 涓〉闈?API 璇锋眰/鍝嶅簲缁撴瀯銆俙01-index` 璁板綍棣栭〉 3 涓?XHR 璇锋眰锛岄噸鐐硅褰曠嫭瀹?API `/api/Statistics/GetIndexStatistics` 瀹屾暣鍝嶅簲锛坄total` 姹囨€荤粺璁°€乣latest30days` 杩?30 澶╄秼鍔裤€乣users` 鎺掕銆乣citys` 棰勭暀锛夛紱`02-mytask-index` ~ `06-sensitive-operations` 宸插畬鎴愶紱`pending-capture` 鎸佺画鏇存柊銆?
  - **page-structure/**锛堥〉闈?DOM 缁撴瀯閲囬泦锛夛細5 涓〉闈?DOM 鏍戝拰 CSS 閫夋嫨鍣ㄣ€俙01-index` 瀹屾暣甯冨眬锛? 琛?el-row锛氬畬鎴愭鍐靛崱鐗?+ 4 涓?x-vue-echarts 鍥捐〃 + 8 鍒楄繘琛屼腑浠诲姟琛ㄦ牸 + 椤佃剼锛夛紝鍥捐〃缁熶竴閰嶈壊 鏍囨敞 `#5470c6`/閲囬泦 `#91cc75`/璐ㄦ `#fac858`锛汻EADME 琛ュ厖鍏ㄥ眬澹冲眰 DOM 鏍戯紙Logo 鍖恒€佹按骞宠彍鍗?3 椤广€佺敤鎴蜂笅鎷夈€佸 Tab 鏍囩椤?id/aria-controls 瑙勫垯锛夛紱`02-mytask-index` ~ `04-mytask-mark` 宸插畬鎴愶紱`05-organization` 寰呰ˉ閲囥€?
- 鏍稿績鏍囨敞閾捐矾锛堜换鍔″垪琛?鈫?浠诲姟璇︽儏 鈫?鏁版嵁鏍囨敞锛夌殑 network 鍜?page-structure 鍧囧凡瀹屾暣閲囬泦锛涢椤甸噰闆嗗畬鎴愩€?
- 鎬昏 18 涓枃浠躲€? 涓瓙鐩綍銆?

## 2026-05-27锛圡agic Data 瀹㈠璇濆姪鎵嬶細AI 缁撴灉绻佷綋瀛楃儹淇級

- 褰撳墠鐗堟湰缁х画淇濇寔 `0.3.7`锛屾湰杞笉鍐嶈嚜鍔ㄦ彁鍗囩増鏈彿銆?
- 淇闂锛歁agic Data ANNOTATOR 鐨勫瀹惰瘽鍔╂墜 AI 缁撴灉鍖恒€佽鍐呭缓璁笌鍚煶鐩稿叧鏂囨湰鍋跺彂鍑虹幇绻佷綋瀛楁垨绻佺畝娣峰悎銆?
- 鏍瑰洜锛?
  - 瀹㈠璇濆姪鎵嬪師 prompt 瀵?蹇呴』杈撳嚭绠€浣?鐨勭害鏉熶笉澶熺‖锛屾ā鍨嬩粛鍙兘杩斿洖 `鑱借瑳/閫欏€?鍖栧绔惰辰/杓斿皫` 涓€绫绘櫘閫氱箒浣撳瓧銆?
  - 鍥犳妯″瀷涓€鏃﹁繑鍥?`鑱借瑳/閫欏€?鍖栧绔惰辰/杓斿皫` 涓€绫绘櫘閫氱箒浣撳瓧锛屽墠绔細鐩存帴灞曠ず骞跺～鍏ラ〉闈€?
- Prompt 淇锛?
  - `platform-resources/magic-data/hakka-helper/backend/ai-prompts.js` 寮哄寲 listen / compare / omni / recognition-convert 鍥涙潯閾捐矾鐨勬枃鏈害鏉熴€?
  - 鏄庣‘瑕佹眰鎵€鏈夋櫘閫氫腑鏂囧瓧娈靛繀椤昏緭鍑虹畝浣擄紝绂佹杈撳嚭鏅€氱箒浣撳瓧锛涘彧鏈夊懡涓瀹惰瘽璇嶈〃缁熶竴鐢ㄥ瓧鏃舵墠淇濈暀瀵瑰簲鍐欐硶銆?
  - `RULE_VERSION` 鍗囩骇涓?`magic-data-hakka-helper-ai-review-v2-prompt-simplified-only`锛岄伩鍏嶆棫缂撳瓨缁х画鍛戒腑鏃?prompt 杈撳嚭銆?
- 鏈湴鏀跺彛鍥為€€锛?
  - 绉婚櫎 `platform-resources/magic-data/hakka-helper/backend/ai-routes.js` 涓湰鍦板搷搴旂箒杞畝閫昏緫銆?
  - 绉婚櫎 `platform-resources/magic-data/hakka-helper/backend/ai-lexicon.js` 涓湰鍦扮箒杞畝鍑芥暟銆?
  - 鍒犻櫎 `platform-resources/magic-data/hakka-helper/backend/ai-text-normalization.test.js`銆?
- 鏂囨。鍚屾锛?
  - 鏇存柊鏍?README銆佹墿灞?README銆丮agic Data 骞冲彴/瀹㈠璇濆姪鎵?README銆佸钩鍙扮储寮曘€?
  - 鏇存柊 `AGENTS.md` 涓?`docs/rules/project-collaboration-rules.md`锛氶粯璁や繚鎸?`0.3.7`锛屽彧鏈夌敤鎴锋槑纭姹傚畬鎴愬綋鍓嶇増鏈?鎵撳寘/鍙戝竷鏃舵墠鎻愬崌鐗堟湰銆?

## 2026-05-26锛坴0.3.6 鏀跺熬锛歁agic Data 鍙屽姪鎵嬭鍒欎笌鏂囨。鍚屾锛?

- 淇濇寔鐗堟湰 `0.3.6`锛屾湰杞湭鍗囩増鏈€佹湭鐢熸垚 CRX銆佹湭鎵?tag锛堥潪 `ASC_RELEASE`锛夈€?
- 椤圭洰绾ц鍒欎笌鏂囨。鏀跺熬锛?
  - `AGENTS.md` 澧炶ˉ Magic Data 闀挎湡鐭鍒欙細鍙屽姪鎵嬩簰鏂ャ€乣妯″瀷鏂规 + 璇嗗埆绛栫暐`銆乣asrmarkCheck` 瀹℃牳椤垫敮鎸併€佸畨鍏ㄨ竟鐣屼笌骞跺彂鍙ｅ緞銆?
  - `README.md`銆乣extension/README.md`銆乣docs/platforms-index.md`銆乣docs/rules/project-collaboration-rules.md` 鍚屾 `v0.3.6` 鏀跺彛璇存槑銆?
  - Magic Data 鍓嶅悗绔?README 鍚屾"鍙栨秷 AI 璐ㄦ妯″紡 UI銆佽瘑鍒瓥鐣ヤ紭鍏堢骇銆佸鏍搁〉濉叆杈圭晫"銆?
- Playwright-Edge 澶嶆祴琛ュ叏锛?
  - 鏂板/閲嶅啓 `platform-resources/magic-data/page-structure/16-playwright-edge-magic-data-recognition-strategy-save-2026-05-26.md`銆?
  - 宸插疄娴?Hakka 涓?Minnan 鍦?options 涓粠 `mandarin_to_dialect` 鍒囧洖 `direct_dialect` 鍚庝笉鍐嶅洖婊氥€?
  - 宸查獙璇?storage 鍙岃矾寰勪竴鑷达細`platforms.magicData.scripts.*` 涓?`scriptCenter.projects.*` 鍚屾鍐欏叆 `aiReviewRecognitionStrategy` 涓?legacy 娲剧敓瀛楁銆?
- 瀹夊叏涓庢暟鎹竻鐞嗭細
  - 娓呯悊鏈湴 `.playwright-mcp/` 璋冭瘯鏃ュ織鐩綍锛岄伩鍏嶈鎻愪氦浼氳瘽鏃ュ織銆?
  - 鏈疆鏈彁浜?token/cookie/authorization/瀹屾暣绛惧悕 URL/璇勬祴鍘熷鏁版嵁鏂囦欢銆?

## 2026-05-26锛圡agic Data AI 闈㈡澘涓庡鏍搁〉濉叆鐑慨锛?

- 淇濇寔鐗堟湰 `0.3.6`锛屾湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?
- `extension/options/options.js`锛?
  - Magic Data 鍙屽姪鎵?AI 闈㈡澘绉婚櫎 `AI 璐ㄦ妯″紡` 瀛楁锛岀粺涓€鎸?`妯″瀷鏂规 + 璇嗗埆绛栫暐` 閰嶇疆銆?
  - 淇璇嗗埆绛栫暐淇濆瓨鍥炴粴锛歚aiReviewRecognitionStrategy` 鏄惧紡瀛楁浼樺厛锛岄伩鍏嶈 legacy `recognition_convert` 瑕嗙洊銆?
  - 姣旇緝妯″瀷涓嬫媺鑱斿姩淇濇寔锛屼繚瀛樺悗鍥炴樉涓嶅啀涓㈠け銆?
- `extension/shared/storage.js`锛?
  - `resolveMagicDataModeAndStrategy` 鏄惧紡瀛楁浼樺厛瑙勫垯鍔犲己锛屼粎鍦ㄦ棤鏈夋晥鏂板瓧娈垫椂鎵嶉噰鐢?legacy 鎺ㄥ銆?
- `extension/sites/magic-data/hakka-helper/assistant-panel.js`锛?
  - 瀹℃牳椤碉紙`#/asrmarkCheck`锛夋枃鏈彲缂栬緫鏃讹紝琛屽唴寤鸿鏀寔 `濉叆鏈`銆?
  - `鍏ㄩ儴濉叆AI鎺ㄨ崘` 鍦ㄥ鏍搁〉浠呭～鏂囨湰椤癸紝涓嶅～璇磋瘽浜猴紝涓嶈嚜鍔ㄤ繚瀛?鎻愪氦锛屼笉鑷姩鐐瑰嚮鍚堟牸/涓嶅悎鏍笺€?
- 鏂囨。鍚屾锛?
  - 鏇存柊 Magic Data 鍙屽姪鎵?README 涓庡钩鍙扮储寮曞彛寰勩€?
  - 鏇存柊 `14-playwright-edge-magic-data-ai-options-save-2026-05-26.md`銆?
  - 鏂板 `15-playwright-edge-hakka-check-page-fill-2026-05-26.md`锛堣褰?MCP 鐧诲綍鎬侀樆濉炰笌浜哄伐澶嶆祴鐭╅樀锛夈€?
  - 宸茶ˉ鍏呮湰杞?`playwright-edge` MCP 鎺㈡祴缁撴灉锛氬鏍搁〉 URL 浼氳瘽涓噸瀹氬悜鍒?`#/login`锛宱ptions 椤甸潰鍙揪浣嗗畬鏁磋В閿佹€侀渶浜哄伐澶嶆祴銆?

## 2026-05-26锛圡agic Data AI 闈㈡澘锛氫繚瀛樺悗琚鐩栫儹淇級

- 淇濇寔鐗堟湰 `0.3.6`锛屾湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?
- 淇闂锛歁agic Data 瀹㈠璇?闂藉崡璇姪鎵嬪湪 options 淇濆瓨鍚庯紝妯″瀷鏂规鍙兘琚洖鍐欎负鍗曟ā鍨嬨€佽瘑鍒瓥鐣ュ彲鑳借鍥炲啓涓鸿瘑鍒浆鎹€佹瘮杈冩ā鍨嬪垏鎹㈠悗鍙兘涓㈠け銆?
- `extension/shared/storage.js`锛?
  - `resolveMagicDataModeAndStrategy` 澧炲姞"鏄惧紡瀛楁浼樺厛"鍒ゅ畾銆?
  - 褰撳凡淇濆瓨 `aiReviewModelMode` / `aiReviewRecognitionStrategy` 鏃讹紝涓嶅啀琚?legacy `recognition_convert` 杩佺Щ閫昏緫鍙嶅悜瑕嗙洊銆?
- `extension/options/options.js`锛?
  - 鏂板 `updateMagicDataCompareModelFields`锛岃ˉ榻?`magic-data-ai-compare-model-select` 鐨?change 鑱斿姩銆?
  - 淇濇寔 Magic Data 鍙屽姪鎵嬫寜褰撳墠 `scriptId` 鏇存柊鑽夌閰嶇疆涓庡瓧娈垫樉绀猴紝閬垮厤 Hakka/Minnan 涓茬敤 defaults銆?
- 鏂囨。鍚屾锛?
  - 鏇存柊鍙屽姪鎵?README 涓庡钩鍙伴〉闈㈢粨鏋勭储寮曘€?
  - 鏂板 `platform-resources/magic-data/page-structure/14-playwright-edge-magic-data-ai-options-save-2026-05-26.md`锛堟湰杞寜鐢ㄦ埛瑕佹眰鏈仛鐪熷疄娴忚鍣ㄨ皟璇曪紝璁板綍澶嶆牳鐭╅樀涓庝唬鐮佷慨澶嶇偣锛夈€?

## 2026-05-26锛圡agic Data 瀹㈠璇濆姪鎵嬶細瀹℃牳椤?asrmarkCheck 鏀寔鐑慨锛?

- 淇濇寔鐗堟湰 `0.3.6`锛屾湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?
- 淇闂锛氬瀹惰瘽鍔╂墜鍦?`#/asrmarkCheck` 瀹℃牳椤典細鍙嶅鍥炲埌"鏈帴鍏?鎻愮ず锛屽苟娓呯┖宸插睍绀虹殑 AI 缁撴灉銆?
- `extension/sites/magic-data/hakka-helper/content.js`锛?
  - 瀹℃牳椤典粠闃绘柇鍒嗘敮鏀逛负姝ｅ紡鎺ュ叆鍒嗘敮锛宍asrmark` 涓?`asrmarkCheck` 鍏辩敤鎸傝浇/閲囬泦/娓叉煋涓婚摼璺€?
  - 璺敱绋冲畾閿敼涓?`pageType + taskItemId + samplingRecordId`锛屼粎鍒囨潯鏃舵竻绌虹粨鏋滐紝閬垮厤 MutationObserver 鍒锋柊瀵艰嚧缁撴灉闂幇鍚庢秷澶便€?
  - 瀹℃牳椤典笌鏍囨敞椤甸兘璧扮粺涓€闈㈡澘鍒锋柊涓?settings 娉ㄥ叆銆?
- `extension/sites/magic-data/hakka-helper/assistant-panel.js`锛?
  - 绉婚櫎瀹℃牳椤?鏈帴鍏?娓呯┖琛屼负锛屾敼涓?宸叉帴鍏?AI 璐ㄦ"鎻愮ず銆?
  - 瀹℃牳椤甸粯璁ら殣钘忓～鍏ヨ兘鍔涳紙琛屽唴濉叆鎸夐挳涓?鍏ㄩ儴濉叆AI鎺ㄨ崘"锛夛紝淇濈暀璐ㄦ涓庡彧璇诲缓璁睍绀恒€?
  - 鍒锋柊閲囬泦鏃跺悜 `refreshCurrentItem` 閫忎紶 `pageType/samplingRecordId`銆?
- `extension/sites/magic-data/shared/data-collector.js`锛?
  - snapshot 鏂板 `pageType`锛屽苟鍦ㄥ埛鏂伴摼璺繚鐣?`samplingRecordId/pageType` 涓婁笅鏂囥€?
- 鏂囨。鍚屾锛?
  - 鏇存柊瀹㈠璇濆姪鎵嬪墠鍚庣 README銆丮agic Data 骞冲彴 README銆侀〉闈㈢粨鏋勭储寮曘€丯etwork 绱㈠紩銆?
  - 鏂板 `platform-resources/magic-data/page-structure/13-playwright-edge-hakka-check-page-2026-05-26.md`锛堟寜鐢ㄦ埛瑕佹眰鏈疆鏈仛鐪熷疄娴忚鍣ㄨ皟璇曪紝璁板綍浠ｇ爜淇涓庝汉宸ュ娴嬫竻鍗曪級銆?

## 2026-05-26锛圡agic Data 瀹㈠璇濆姪鎵嬶細AI 閰嶇疆淇濆瓨閾捐矾鐑慨锛?

- 淇濇寔鐗堟湰 `0.3.6`锛屾湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?
- 淇 `Options -> Magic Data ANNOTATOR -> 瀹㈠璇濆姪鎵媊 涓?`璇嗗埆绛栫暐`銆乣姣旇緝妯″瀷` 鍒囨崲鍚庡埛鏂颁涪澶辩殑闂銆?
- `extension/options/options.js` 鍏抽敭淇锛?
  - 灏?Magic Data pipeline 瀛楁鑱斿姩鍑芥暟鏀逛负鎸?`scriptId` 閫氱敤澶勭悊锛岄伩鍏?Hakka 璇蛋 Minnan 纭紪鐮?defaults銆?
  - `renderAsrVoiceAiSettingsSection` 涓?Magic Data Hakka 涓?Minnan 缁熶竴缁戝畾 `妯″瀷鏂规/璇嗗埆绛栫暐/鍚煶妯″瀷/鍗曟ā鍨媊 change 浜嬩欢锛屼笉鍐嶈 Hakka 钀藉叆鏃?`bindJudgementModelSelect` 鍒嗘敮銆?
  - `saveMagicDataSettings` 鏀逛负鏄惧紡淇濆瓨妯″瀷瀛楁锛屼笉鍐嶅洜"绛変簬榛樿鍊?鍐欑┖瀛楃涓诧細
    - `aiReviewModelMode/aiReviewRecognitionStrategy/aiReviewRecognitionMode`
    - `aiReviewListenModel/aiReviewCompareModel/aiReviewSingleModel`
    - legacy `listenModel/reviewModel`
  - thinking 淇濆瓨淇濇寔甯冨皵鏄惧紡鍊硷紝骞跺悓姝?`aiReviewEnableThinking` 涓?`enableThinking`銆?
- 鍏煎鎬ц鏄庯細
  - 瀹㈠璇濋粯璁ら厤缃粛涓?`two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash`锛坱hinking 榛樿鍏抽棴锛夈€?
  - 闂藉崡璇繚瀛橀摼璺悓姝ュ彈鐩婏紝鏈洖閫€鍏剁幇鏈夐厤缃兘鍔涖€?

## 2026-05-26锛圡agic Data 瀹㈠璇濆姪鎵嬶細鍚庣杈撳嚭缁撴瀯瀵归綈淇锛?

- 淇濇寔鐗堟湰 `0.3.6`锛屾湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?
- 淇闂锛氬瀹惰瘽鍔╂墜鍚庣杩斿洖瀛楁涓嶅畬鏁达紝瀵艰嚧鏂扮増鍓嶇闈㈡澘澶ч噺鏄剧ず"寰呭鏍?鎴栫┖鍊笺€?
- 鍚庣淇锛?
  - `platform-resources/magic-data/hakka-helper/backend/ai-routes.js` 杩斿洖缁撴瀯琛ラ綈锛?
    - `service/scriptId/component`
    - `speakerCheck`
    - `dialectTextCheck`
    - `mandarinTextCheck`
    - `overall`
    - `recommendations`
    - `rawAiDebug/rawModelText/rawJson`锛堣劚鏁忥級
  - `platform-resources/magic-data/hakka-helper/backend/ai-response-schema.js` 澧炲姞 tri-state 褰掍竴涓?fallback锛屾ā鍨嬪瓧娈电己澶辨椂鎸夊钩鍙版枃鏈?鍚煶鏂囨湰鍏滃簳锛岄伩鍏嶅墠绔叏绌恒€?
  - `platform-resources/magic-data/hakka-helper/backend/ai-prompts.js` 寮哄寲 compare/omni/璇嗗埆杞崲 Prompt锛岃姹傝緭鍑哄畬鏁翠笁椤硅川妫€ JSON 缁撴瀯銆?
- 瀹㈠璇濋粯璁ら厤缃户缁繚鎸佽瘎娴嬬粨璁猴細
  - `two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash`
  - `enable_thinking=false`
- 鍏煎鎬э細
  - 淇濈暀 `/api/magic-data/hakka-helper/ai/*` 鏂拌矾寰勶紱
  - 淇濈暀 `/api/magic-data/annotator/ai/*` legacy 璺緞銆?
- 鏂囨。鍚屾锛?
  - 鏇存柊瀹㈠璇濆姪鎵嬪墠鍚庣 README銆丮agic Data 骞冲彴 README銆佸钩鍙扮储寮曚笌缁熶竴鍚庣 README锛?
  - 鏂板璁板綍 `platform-resources/magic-data/page-structure/14-playwright-edge-hakka-backend-align-2026-05-24.md`锛堟寜鐢ㄦ埛瑕佹眰锛屾湰杞湭鎵ц鐪熷疄娴忚鍣ㄥ娴嬶紝浠呰褰曞悗绔榻愪笌浜哄伐澶嶆牳娓呭崟锛夈€?

## 2026-05-26锛圡agic Data 瀹㈠璇濆姪鎵嬶細鏂扮増闈㈡澘鍓嶇瀵归綈淇锛?

- 淇濇寔鐗堟湰 `0.3.6`锛屾湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?
- 淇鏍瑰洜锛氬瀹惰瘽 `content.js` 浠嶆寕杞芥棫 `shared/assistant-panel-core.js` 鍏ㄥ眬锛坄__ASREdgeMagicDataAnnotatorInlinePanel`锛夛紝瀵艰嚧鏄剧ず鏃ф寜閽笌鏃х粨鏋滅粨鏋勩€?
- 瀹㈠璇濆墠绔摼璺垏鎹负鏂扮増锛?
  - 鏂板 `extension/sites/magic-data/hakka-helper/assistant-panel.js`锛堝熀浜庨椊鍗楄鏂扮増鍙傛暟鍖栦负瀹㈠璇濇枃妗堜笌鍛藉悕绌洪棿锛夈€?
  - 鏂板 `extension/sites/magic-data/hakka-helper/shortcuts-runtime.js`锛堝瀹惰瘽鏂扮増蹇嵎閿繍琛屾椂锛夈€?
  - `extension/sites/magic-data/hakka-helper/content.js` 鏀逛负浣跨敤锛?
    - `__ASREdgeMagicDataHakkaInlinePanel`
    - `__ASREdgeMagicDataHakkaShortcuts`
  - `extension/manifest.json` 璋冩暣 Magic Data ISOLATED 娉ㄥ叆椤哄簭锛岀‘淇濆瀹惰瘽鏂扮増妯″潡鍦ㄥ瀹惰瘽 content 涔嬪墠鍔犺浇銆?
- 瀹㈠璇濇柊鐗堥潰鏉胯兘鍔涗笌闂藉崡璇榻愶細
  - 琛屽唴寤鸿锛堟纭?寤鸿鏂囨湰+濉叆鏈锛?
  - 璇磋瘽浜哄缓璁紙鎬у埆/骞撮緞锛?
  - 鎬荤粨璁?+ 涓変釜鐙珛鎶樺彔璇︽儏
  - `鍏ㄩ儴濉叆AI鎺ㄨ崘`
  - `鏄剧ず AI 鍘熷杈撳嚭`
  - 涓嶅啀鏄剧ず鏃ф寜閽細`濉叆绗竴琛宍銆乣濉叆绗簩琛宍銆乣蹇界暐缁撴灉`
- 榛樿妯″瀷鍙ｅ緞淇濇寔璇勬祴缁撹锛?
  - `two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash`
  - `enable_thinking=false`
- 鏂囨。鍚屾锛?
  - 鏇存柊 Magic Data 鍓嶅悗绔?README 涓庣储寮曪紱
  - 鏂板 `platform-resources/magic-data/page-structure/13-playwright-edge-hakka-panel-align-2026-05-24.md`锛堟寜鐢ㄦ埛瑕佹眰鏈疆鏈仛鐪熷疄娴忚鍣ㄥ娴嬶紝浠呰褰曢摼璺笌寰呬汉宸ュ鏍告竻鍗曪級銆?

## 2026-05-26锛圡agic Data 瀹㈠璇濆姪鎵嬶細璇勬祴榛樿閰嶇疆钀藉湴锛?

- 淇濇寔鐗堟湰 `0.3.6`锛屾湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?
- 钀藉湴瀹㈠璇濆姪鎵嬮粯璁?AI 閰嶇疆锛?0 鏉¤瘎娴嬬粨璁猴級锛?
  - `modelMode=two_stage`
  - `recognitionStrategy=direct_dialect`
  - `listenModel=qwen3.5-omni-flash`
  - `compareModel=qwen3.5-flash`
  - `enable_thinking=false`
- 鍓嶇閰嶇疆鍚屾锛?
  - `extension/shared/constants.js`銆乣extension/sites/magic-data/hakka-helper/content.js`銆乣extension/sites/magic-data/shared/assistant-panel-core.js` 榛樿姣旇緝妯″瀷鏀逛负 `qwen3.5-flash`锛屽苟琛ラ綈 `modelMode/recognitionStrategy` 鍏煎瀛楁銆?
  - `extension/options/options.js` 鏇存柊瀹㈠璇濋粯璁ゅ厹搴曘€佸悗绔粯璁ゆ彁绀烘枃妗堬紝骞舵寜鑴氭湰鍖哄垎瀹㈠璇?闂藉崡璇粯璁ゆ瘮杈冩ā鍨嬨€?
- 鍚庣鎺ュ彛鍚屾锛?
  - `platform-resources/magic-data/hakka-helper/backend/ai-routes.js` 鍏煎鏂拌姹傚瓧娈?`modelMode/recognitionStrategy/compareModel/singleModel`锛屽苟鍦?`defaults/health` 杩斿洖妯″瀷鏂规涓庤瘑鍒瓥鐣ラ€夐」銆佽瘎娴嬫憳瑕佸瓧娈点€?
  - 缁х画淇濈暀 legacy `/api/magic-data/annotator/ai/*` 鍏煎璺緞銆?
- 鏂囨。鏇存柊锛?
  - 瀹㈠璇濆墠鍚庣 README銆丮agic Data 骞冲彴 README銆乣docs/platforms-index.md` 宸茶ˉ鍏呰瘎娴嬬粨璁轰笌榛樿閰嶇疆鍙ｅ緞銆?

## 2026-05-25锛圡agic Data 鍙屽姪鎵嬮厤缃噸鏋勶細妯″瀷鏂规/璇嗗埆绛栫暐鎷嗗垎锛?

- 淇濇寔鐗堟湰 `0.3.6`锛屾湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?
- `extension/options/options.js`锛?
  - 闂藉崡璇笌瀹㈠璇濆姪鎵嬮厤缃粺涓€涓哄弻缁村害锛歚modelMode(two_stage/omni_single)` + `recognitionStrategy(direct_dialect/mandarin_to_dialect)`銆?
  - legacy `aiReviewRecognitionMode=recognition_convert` 淇濈暀鍏煎鏄犲皠锛屼笉鍐嶄綔涓哄墠绔悓绾фā鍨嬫柟妗堝睍绀恒€?
  - Magic Data 蹇嵎閿姩浣滈泦鍚堝悓姝ヤ负鏂板彛寰勶細鏂板 `鍏ㄩ儴濉叆AI鎺ㄨ崘`銆乣鏄剧ず AI 鍘熷杈撳嚭`銆佷笁鍧楄鎯呮姌鍙犲垏鎹€佸埛鏂伴噰闆嗐€侀噸缃珮搴︼紱甯歌鍒楄〃绉婚櫎"濉叆绗竴琛?濉叆绗簩琛?銆?
- `extension/sites/magic-data/minnan-helper/content.js`锛?
  - 璇锋眰浣撴柊澧炲苟閫忎紶 `modelMode`銆乣recognitionStrategy`锛屽悓鏃朵繚鐣?legacy `recognitionMode/pipelineMode`銆?
- `platform-resources/magic-data/minnan-helper/backend/ai-service.js`锛?
  - 琛ラ綈 `modelMode` 涓?`recognitionStrategy` 褰掍竴鍖栦笌 defaults/health 鍥炰紶銆?
  - `mandarin_to_dialect` 绛栫暐缁х画杈撳嚭 `recognizedMandarinText`銆乣convertedDialectText`銆乣lexiconMatches`銆乣conversionWarnings`锛堣劚鏁忥級銆?
- 鏂囨。鏇存柊锛?
  - 鏇存柊 Magic Data 鍓嶅悗绔?README銆佸钩鍙扮储寮曚笌椤甸潰缁撴瀯绱㈠紩鍙ｅ緞锛岀粺涓€浣跨敤"妯″瀷鏂规 + 璇嗗埆绛栫暐"鎻忚堪銆?
  - 鏂板 `platform-resources/magic-data/page-structure/12-playwright-edge-dual-helper-mode-shortcuts-2026-05-24.md`銆?
- MCP 澶嶆祴鐘舵€侊細
  - 宸插皾璇曚娇鐢?`playwright-edge`锛屼絾鏈満 Edge 杩滅▼璋冭瘯绔彛鏈繛閫氾紙`ws://localhost:9222/devtools/browser`锛夛紝鏈疆鏃犳硶瀹屾垚浜や簰澶嶆祴锛屼粎璁板綍闃诲涓庡緟琛ユ楠ゃ€?

## 2026-05-25锛圡agic Data 闂藉崡璇姪鎵嬪寮猴細璇嗗埆杞崲妯″紡 + 宸紓瀵规瘮锛?

- 淇濇寔鐗堟湰 `0.3.6`锛屾湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?
- 鍓嶇閰嶇疆澧炲己锛?
  - `extension/shared/constants.js` 涓?`extension/options/options.js` 鏂板闂藉崡璇?`recognition_convert` 妯″紡閫夐」锛堣瘑鍒浆鎹細鍏堝惉鎴愭櫘閫氳瘽锛屽啀鎸夎瘝琛ㄨ浆闂藉崡璇級銆?
  - 闂藉崡璇姪鎵嬫ā寮忓綊涓€鏀寔 `two_stage / omni_single / recognition_convert`锛屽苟淇濇寔 DataBaker 閫昏緫涓嶅彉銆?
- 鍚庣閾捐矾澧炲己锛坄platform-resources/magic-data/minnan-helper/backend/`锛夛細
  - `ai-service.js` 鏂板 `recognition_convert` pipeline锛氳瘑鍒櫘閫氳瘽 -> 璇嶈〃杞崲闂藉崡璇?-> 涓夐」棰勬祴璐ㄦ銆?
  - `ai-prompts.js` 鏂板璇嗗埆杞崲涓撶敤 Prompt锛坙isten/compare锛夈€?
  - defaults/health 涓庢ā寮忔灇涓炬柊澧?`recognition_convert`锛屽苟杩斿洖瀵瑰簲榛樿 Prompt 妯℃澘銆?
  - 鍘熷杈撳嚭鏂板璇嗗埆杞崲涓棿浜х墿锛堣劚鏁忥級锛歚recognizedMandarinText`銆乣convertedDialectText`銆乣lexiconMatches`銆乣conversionWarnings`銆?
- 闂藉崡璇潰鏉垮樊寮傚姣旓細
  - `assistant-panel.js` 鏂板瀛楃绾ц交閲?diff锛圠CS锛夛紝鏀寔琛屽唴寤鸿鍜屽彸渚ц鎯呭樊寮傚睍绀恒€?
  - 琛屽唴寤鸿淇濇寔"姝ｇ‘/寤鸿鏂囨湰+濉叆鏈"鏋佺畝瑙勫垯锛涘彸渚ц鎯呮柊澧?宸紓瀵规瘮"琛屻€?
- 鏂囨。鍚屾锛?
  - 鏇存柊闂藉崡璇姪鎵嬪墠鍚庣 README 涓庡钩鍙扮储寮曞彛寰勶紝鏄庣‘鏂板 `recognition_convert`銆佸樊寮傚姣斾笌"鏃犲苟鍙戦厤缃?瑙勫垯銆?
  - 鏂板澶嶆祴璁板綍锛歚platform-resources/magic-data/page-structure/11-playwright-edge-recognition-convert-diff-2026-05-24.md`銆?

## 2026-05-24锛圡agic Data 闂藉崡璇姪鎵嬬儹淇細浜や簰绋冲畾鎬т慨澶嶏級

- 淇濇寔鐗堟湰 `0.3.6`锛屾湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?
- `extension/sites/magic-data/minnan-helper/assistant-panel.js`锛?
  - 琛屽唴寤鸿涓庤璇濅汉寤鸿鏀逛负鎸?task 骞傜瓑鏇存柊锛屽噺灏?`remove + recreate`锛屼慨澶?hover 闂儊涓诲洜銆?
  - 璇磋瘽浜?AI寤鸿锛氭纭?涓嶅啀鏄剧ず `濉叆鎬у埆/濉叆骞撮緞` 鎸夐挳锛涗粎闇€淇敼鏃舵樉绀哄～鍏ユ寜閽€?
  - 涓変釜璇︽儏鎶樺彔鍧楃姸鎬佹寜 `taskItemId + section` 璁板繂锛屼慨澶嶇偣鍑诲睍寮€鍚庤鍒锋柊娴佺▼鑷姩鏀跺洖銆?
  - 鎸夐挳甯冨眬鍥哄畾涓轰袱鎺掞細涓婃帓涓绘搷浣滐紙`AI璐ㄦ褰撳墠鏉銆乣鍏ㄩ儴濉叆AI鎺ㄨ崘`锛夛紝涓嬫帓杈呭姪鎿嶄綔锛堝埛鏂?閲嶇疆/澶嶅埗鎽樿/鏄剧ず鍘熷杈撳嚭锛夈€?
- `extension/sites/magic-data/minnan-helper/content.js`锛歁utationObserver 杩囨护鎵╁睍鑷湁 UI 鍙樻洿锛岄伩鍏嶈嚜瑙﹀彂鍒锋柊瀵艰嚧鎶栧姩銆?
- 鏂板澶嶆祴璁板綍锛歚platform-resources/magic-data/page-structure/10-playwright-edge-fix-retest-2026-05-24.md`锛圥laywright-Edge 浜や簰澶嶆祴锛岀‘璁ゆ姌鍙犱繚鎸佷笌寤鸿鑺傜偣绋冲畾鎬э級銆?

## 2026-05-24锛圡agic Data 闂藉崡璇姪鎵嬪彧璇绘帓鏌ワ細DevTools MCP锛?

- 浠诲姟鎸?`ASC_READONLY` 鎵ц锛氭湭淇敼涓氬姟浠ｇ爜銆佹湭鎻愪氦銆佹湭 push銆佹湭鐢熸垚 CRX銆?
- 閫氳繃 DevTools MCP 鍙妫€鏌?`#/asrmark`锛?
  - 宸茬‘璁よ璇濅汉灞炴€хǔ瀹氶€夋嫨鍣紙`鎬у埆/骞撮緞` 鐨?`.el-form-item` 涓?checked radio 閫夋嫨鍣級銆?
  - 宸茬‘璁ゆ枃鏈绋冲畾閫夋嫨鍣紙`.region-item` / `.speak-item` / `.edit.region-edit[data-index]`锛夈€?
  - 褰撳墠椤垫湭妫€娴嬪埌浠讳綍 `data-asc-*` 鎵╁睍鑺傜偣锛岀粨璁轰负闂藉崡璇姪鎵嬭繍琛屾椂鏈寕杞斤紝鑰岄潪瀛楁閫夋嫨鍣ㄦ湰韬け鏁堛€?
- 鏂板鍙傝€冩枃妗ｏ細
  - `platform-resources/magic-data/page-structure/08-devtools-readonly-check-2026-05-24.md`
- 鍚屾鏇存柊 `platform-resources/magic-data/page-structure/README.md` 绱㈠紩銆?

## 2026-05-23锛圡agic Data 闂藉崡璇姪鎵嬬儹淇細绮剧畝寤鸿灞曠ず涓庣嫭绔嬫姌鍙狅級

- 淇濇寔鐗堟湰 `0.3.6`锛屾湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?
- `assistant-panel.js` 鍙栨秷宸︿晶鐙珛澶х┖妗嗛€昏緫锛屼笉鍐嶅垱寤?side info root锛涜璇濅汉寤鸿鏀逛负鐩存帴鎻掑叆骞冲彴 `speaker-attributes` 鐨?`鎬у埆/骞撮緞` 琛ㄥ崟椤广€?
- 琛屽唴鏂囨湰寤鸿鏀逛负鏋佺畝锛?
  - 姝ｇ‘浠呮樉绀?`姝ｇ‘`锛?
  - 闇€鏀逛粎鏄剧ず寤鸿鏂囨湰 + `濉叆鏈`锛堟棤"AI寤鸿"鏍囬銆佹棤鍘熷洜/缃俊搴︼級銆?
- 鍙充晶缁撴灉鍖虹粨鏋勬敼涓猴細鎬荤粨璁虹疆椤?+ 涓変釜鐙珛鎶樺彔鍧楋紙`璇磋瘽浜哄睘鎬銆乣闂藉崡璇唴瀹筦銆乣鏅€氳瘽鏂囨湰`锛夛紝榛樿鍏ㄩ儴鎶樺彔銆?
- 鍙充晶鎸夐挳绉婚櫎 `蹇界暐缁撴灉`锛屾柊澧?`鍏ㄩ儴濉叆AI鎺ㄨ崘`锛涗粎鍦?AI 鏈夊彲淇敼椤规椂鏄剧ず骞跺彲鐐瑰嚮锛屾墽琛屾椂鍙～闇€鏀归」锛堟€у埆/骞撮緞/涓よ鏂囨湰锛夛紝涓嶈嚜鍔ㄤ繚瀛樸€佷笉鑷姩鎻愪氦銆?
- 鍚屾鏇存柊闂藉崡璇姪鎵嬩笌 Magic Data 骞冲彴鏂囨。銆侀〉闈㈢粨鏋勬枃妗ｅ彛寰勩€?

## 2026-05-23锛圡agic Data 闂藉崡璇姪鎵嬬儹淇細琛屽唴寤鸿绮剧畝涓庢姌鍙犵粨鏋滐級

- 淇濇寔鐗堟湰 `0.3.6`锛屾湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?
- `assistant-panel.js` 淇宸︿晶鍩虹淇℃伅鎸傝浇锛氫紭鍏堟彃鍏?`.speaker-attributes` 鍚庢柟骞朵繚鎸佸湪鍚屼竴 `.grid-content`锛屾壘涓嶅埌鏃舵寜 `grid`/闈㈡澘閫愮骇 fallback锛屽苟杈撳嚭 `side info mounted` 璋冭瘯鏃ュ織銆?
- 宸︿晶鍩虹淇℃伅鍗′笉鍐嶅嚭鐜?绌虹櫧澶ф"闂锛屾柊澧?绛夊緟閲囬泦..."鍗犱綅锛涙憳瑕佷粛涓嶆樉绀洪璁￠噾棰濄€?
- 琛屽唴鏂囨湰寤鸿鏀逛负鏋佺畝妯″紡锛?
  - 姝ｇ‘浠呮樉绀?`AI寤鸿锛氭纭甡
  - 闇€鏀规樉绀?`AI寤鸿锛?寤鸿鏂囨湰>` + `濉叆鏈`
- 鏂板璇磋瘽浜哄睘鎬?AI 寤鸿锛堟€у埆/骞撮緞锛夛細
  - 姝ｇ‘鍙樉绀?姝ｇ‘"
  - 闇€鏀规樉绀哄缓璁€煎苟鎻愪緵 `濉叆鎬у埆/濉叆骞撮緞`锛堝彧鐐圭湡瀹?radio锛屼笉鑷姩淇濆瓨/鎻愪氦锛夈€?
- 鍙充晶缁撴灉鍖烘敼涓?鎬荤粨璁虹疆椤?+ 璇︾粏缁撴灉榛樿鎶樺彔"锛屽苟淇濈暀鍘熷杈撳嚭寮圭獥涓庡鍒惰兘鍔涳紙鑴辨晱锛夈€?
- 鍚屾鏇存柊 Magic Data 骞冲彴璧勬枡鏂囨。涓庨〉闈㈢粨鏋勬枃妗ｃ€?

## 2026-05-23锛圡agic Data 闂藉崡璇姪鎵嬬儹淇細甯冨眬涓庤鍐呮帹鑽愪紭鍖栵級

- 淇濇寔鐗堟湰 `0.3.6`锛屾湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?
- `extension/sites/magic-data/minnan-helper/assistant-panel.js` 璋冩暣涓?宸︿晶鍩虹淇℃伅 + 鍙充晶 AI 闈㈡澘"锛?
  - 鍩虹淇℃伅鏀逛负鎸傝浇鍦ㄩ〉闈㈠乏渚?璇磋瘽浜哄睘鎬?涓嬫柟鐙珛瀹瑰櫒銆?
  - 鍙充晶闈㈡澘涓嶅啀灞曠ず鍩虹淇℃伅涓?濉叆绗竴琛?濉叆绗簩琛?鎸夐挳銆?
  - 褰撳墠鏉℃憳瑕佺Щ闄?棰勮閲戦"鏄剧ず銆?
- 鏂板"鏄剧ず AI 鍘熷杈撳嚭"鎸夐挳涓庡脊绐楋紝鏀寔澶嶅埗锛涘睍绀鸿劚鏁忓悗鐨?`rawAiDebug/rawModelText/rawJson` 涓?`normalizedResult`銆?
- 鏂板琛屽唴鎺ㄨ崘鍧楋細鍦?`.region-item .speak-item` 瀵瑰簲鏂囨湰琛屼笅鏂瑰睍绀?AI 寤鸿鍜?濉叆鏈"鎸夐挳锛屽～鍏ュ悗浠呭啓鏂囨湰骞惰Е鍙戣緭鍏ヤ簨浠讹紝涓嶈嚜鍔ㄤ繚瀛?鎻愪氦銆?
- `platform-resources/magic-data/minnan-helper/backend/ai-service.js` 杩斿洖鑴辨晱 raw 璋冭瘯瀛楁锛屼緵鍓嶇鍘熷杈撳嚭寮圭獥灞曠ず銆?
- 鍚屾鏇存柊 Magic Data 鐩稿叧 README 涓庨〉闈㈢粨鏋勬枃妗ｏ紝鏄庣‘ `.region-item/.speak-item/.edit.region-edit[data-index|alt]` 閫夋嫨鍣ㄥ彛寰勩€?

## 2026-05-23锛圡agic Data 闂藉崡璇姪鎵嬬儹淇細涓夐」棰勬祴璐ㄦ + 璇磋瘽浜洪噰闆嗕慨澶?+ 宸﹀彸鍒嗗尯锛?

- 淇濇寔鐗堟湰鍙ｅ緞 `0.3.6`锛屾湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?
- `extension/sites/magic-data/shared/data-collector.js` 淇 `annotateDetailInfo` 宓屽缁撴瀯瑙ｆ瀽锛氭敼涓轰紭鍏堣鍙?`payload.data.data`锛屾敮鎸?`base_speak + mark_info[].speak_people` 鏄犲皠璇磋瘽浜哄睘鎬с€?
- 璇磋瘽浜?DOM fallback 鏀逛负浠呰鍙栧凡閫?radio锛坄.el-radio.is-checked` / `aria-checked=true`锛夛紝绉婚櫎"鏂囨湰鍖呭惈鐢?濂?骞撮緞娈?璇垽閫昏緫銆?
- `platform-resources/magic-data/minnan-helper/backend` 璋冩暣闂藉崡璇姪鎵嬭川妫€璇箟涓?涓夐」棰勬祴璐ㄦ"锛屾柊澧?鍏煎 `speakerCheck`銆乣dialectTextCheck`銆乣mandarinTextCheck`銆乣overall` 杈撳嚭锛屽苟淇濇寔 `recommendations/audioCheck/textRuleCheck` 涓?legacy 瀛楁鍏煎銆?
- `extension/sites/magic-data/minnan-helper/assistant-panel.js` 鏀逛负宸﹀彸鍒嗗尯甯冨眬锛氬乏渚у熀纭€淇℃伅锛堟憳瑕?璇磋瘽浜?骞冲彴鏂囨湰锛夛紝鍙充晶 AI 涓夐」璐ㄦ涓庢搷浣滃尯锛圓I璐ㄦ銆佸鍒躲€佸～鍏ャ€佸拷鐣ワ級锛岀户缁繚鎸?涓嶈嚜鍔ㄤ繚瀛樸€佷笉鑷姩鎻愪氦"銆?
- 鍚屾鏇存柊 Magic Data 骞冲彴璧勬枡鏂囨。锛坣etwork/page-structure/minnan-helper README锛夈€?

## 2026-05-23锛圡agic Data 鐑慨锛氬悓骞冲彴鑴氭湰浜掓枼鍚敤 + 鐗堟湰鍙ｅ緞鍥為€€鍒?v0.3.6锛?

- 淇 Magic Data ANNOTATOR 鍚屽钩鍙拌剼鏈簰鏂ヨ鍒欙細鍚屼竴鏃跺埢鍙厑璁?`瀹㈠璇濆姪鎵媊 涓?`闂藉崡璇姪鎵媊 鍏朵腑涓€涓浜庡惎鐢ㄧ姸鎬侊紱鍚敤涓€涓椂鑷姩鍏抽棴鍙︿竴涓€?
- `extension/shared/storage.js` 鏂板 Magic Data 浜掓枼褰掍竴涓庢棫鏁版嵁鑷剤锛氬巻鍙叉湰鍦拌缃嫢涓や釜鍔╂墜鍚屾椂 enabled锛岃鍙栧悗鑷姩褰掍竴涓哄崟涓€ active 鑴氭湰锛堥粯璁や繚鐣欏瀹惰瘽鍔╂墜锛夈€?
- `extension/options/options.js` 鍚仠閾捐矾鏀逛负鍚屽钩鍙颁簰鏂ワ紝鑴氭湰鍗＄墖鐘舵€佸彧鏄剧ず涓€涓?宸插惎鐢?锛涘叧闂綋鍓嶈剼鏈椂涓嶈嚜鍔ㄥ惎鐢ㄥ彟涓€涓€?
- `extension/sites/magic-data/hakka-helper/content.js` 涓?`minnan-helper/content.js` 鍦?disabled 鎴栭潪 activeScriptId 鏃朵細鍋滄鎸傝浇闈㈡澘骞跺仠姝㈣繍琛屾椂銆?
- 鍥為€€鐗堟湰鍙ｅ緞锛歚extension/manifest.json` 鍥為€€鍒?`0.3.6`锛屽苟鍚屾 `README.md`銆乣extension/README.md`銆佺浉鍏宠鍒欐枃妗ｄ笌鏈棩蹇楋紱鏈疆涓嶅彂鐗堛€佷笉鐢熸垚 CRX銆佷笉鎵?tag銆?

## 2026-05-22锛圡agic Data 闂藉崡璇姪鎵嬪姛鑳藉紑鍙戯細v0.3.7锛屽悗缁凡鍥為€€锛?

- `extension/manifest.json` 褰撴椂鐗堟湰鏇惧崌绾у埌 `0.3.7`锛涜鐗堟湰鍙峰凡鍦?2026-05-23 鐑慨涓寜鐢ㄦ埛瑕佹眰鍥為€€鍒?`0.3.6`銆?
- 闂藉崡璇姪鎵嬪墠绔涓哄榻愬瀹惰瘽鍔╂墜锛氫粛鍙湪 `#/asrmark` 鐢ㄦ埛涓诲姩瑙﹀彂 AI锛屼笉鑷姩淇濆瓨/鎻愪氦锛涘苟淇涓庡瀹惰瘽鍔╂墜骞惰鍚敤鏃剁殑缁撴灉鍖?DOM 鍛藉悕绌洪棿浜掔浉瑕嗙洊椋庨櫓銆?
- options 涓椊鍗楄鍔╂墜 AI 璁剧疆鏀逛负 DataBaker 椋庢牸锛氭敮鎸?`two_stage / omni_single`銆乣fun-asr`/Qwen Omni 鍚煶妯″瀷銆乧ompare 妯″瀷銆佸崟妯″瀷銆乼hinking銆丳rompt/鍙傛暟 override锛屽苟淇濈暀鏃у瓧娈靛吋瀹广€?
- 闂藉崡璇姪鎵嬪悗绔矾鐢遍噸鏋勪负钖勮矾鐢憋細`ai-routes.js` 鏀逛负璋冪敤 `ai-service.js`锛宍defaults/health` 杩斿洖 DataBaker 椋庢牸璇嗗埆妯″紡涓庢ā鍨嬮€夐」锛涙敮鎸?`two_stage + fun-asr`銆乣two_stage + Qwen Omni`銆乣omni_single + Qwen Omni`銆?
- 鏂板 Magic Data 闂藉崡璇姪鎵嬬幆澧冨彉閲忓崰浣嶏紙`MAGIC_DATA_MINNAN_AI_*`锛夊埌 `config/env/ai.env.example`锛屽苟鍚屾鏇存柊 README/docs 鍙ｅ緞锛涙湰杞湭鐢熸垚 CRX銆佹湭鎵?tag銆?

## 2026-05-22锛坧latform-resources 鍏ㄥ钩鍙扮洰褰曠粺涓€娌荤悊锛歷0.3.6锛?

- 鏈疆淇濇寔 `extension/manifest.json` 涓?`0.3.6`锛屾湭閲嶅鎻愬崌鐗堟湰鍙枫€?
- `platform-resources` 骞冲彴璧勬枡鐩綍缁熶竴鏀跺彛锛氬钩鍙版牴绾х粺涓€涓?`README.md + backend/ + network/ + page-structure/ + <script-id>/`銆?
- Alibaba LabelX銆丏ataBaker銆丄baka AI 鐨勬暎钀?`network.md / page-structure.md / actions.md / i18n.md` 宸茶縼绉诲埌瀵瑰簲鏍囧噯鐩綍锛涜剼鏈骇璧勬枡鍚屾杩佺Щ鍒?`network/` 涓?`page-structure/`銆?
- DataBaker 璇嶈〃杩佺Щ鍒?`platform-resources/data-baker/round-one-quality/backend/reference/minnan-lexicon.csv`锛屽苟鍚屾淇鍚庣璇诲彇璺緞涓庣浉鍏虫枃妗ｅ彛寰勩€?
- Alibaba LabelX 骞冲彴鍏辩敤宸ュ叿 `asr-project-kind.js`銆乣supplier-utils.js` 鏀跺彛鍒?`platform-resources/alibaba-labelx/backend/`锛屽苟鍚屾淇蹇垽/杞啓鍚庣 require 璺緞銆?
- Abaka AI Task21 Prompt 璧勬枡杩佺Щ鍒?`platform-resources/abaka-ai/task21/backend/ai/`锛岃剼鏈笌骞冲彴鏂囨。璺緞鍚屾鏇存柊銆?
- 淇濈暀 Magic Data 鏃?`annotator` API 鍏煎鑳藉姏锛涙湰杞湭鏀?AI 涓氬姟閾捐矾銆佹湭鏀规ā鍨嬮粯璁ゅ€笺€佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?

## 2026-05-22锛圡agic Data 骞冲彴璧勬枡鐩綍娌荤悊涓庤鍒欐矇娣€锛歷0.3.6锛?

- 鏈疆淇濇寔 `extension/manifest.json` 涓?`0.3.6`锛屾湭閲嶅鎻愬崌鐗堟湰鍙枫€?
- Magic Data 骞冲彴璧勬枡鐩綍鏀跺彛涓?`backend/`銆乣network/`銆乣page-structure/` + 鍔╂墜瀛愮洰褰曪紱骞冲彴鍏辩敤椤甸潰缁撴瀯涓?Network 缁熶竴杩佺Щ鍒版牴绾х洰褰曠淮鎶ゃ€?
- 瀹㈠璇?闂藉崡璇瘝琛ㄨ縼绉诲埌鍚勮嚜 `backend/lexicon/`锛屽苟鍚屾淇鍚庣璇嶈〃璇诲彇涓庤浆鎹㈣剼鏈粯璁よ矾寰勩€?
- 鍒犻櫎鏃ц祫鏂欑洰褰曚笌鏁ｈ惤绱㈠紩锛氱Щ闄?`platform-resources/magic-data/annotator/`銆乣shared/`銆佹牴绾?`network.md`銆佹牴绾?`page-structure.md`锛屼繚鐣欐棫 `/api/magic-data/annotator/ai/*` 鎺ュ彛鍏煎鑳藉姏銆?
- 鍔╂墜鐩綍鎸夐暱鏈熻鍒欐敹鏁涗负 `README.md + backend/ + network/ + page-structure/`锛屽叾涓棤涓撳睘宸紓鐩綍鐢?`.gitkeep` 淇濈暀銆?
- 鍚屾鏇存柊 `AGENTS.md` 涓?`docs/rules/project-collaboration-rules.md` 鐨勫钩鍙拌祫鏂欑洰褰曢暱鏈熻鍒欙紝骞舵洿鏂?Magic Data 鐩稿叧 README / 绱㈠紩鏂囨。鍙ｅ緞銆?

## 2026-05-21锛堟柊澧為椊鍗楄鍔╂墜骞堕噸鏋?Magic Data 缁撴瀯锛歷0.3.6锛?

- 淇濇寔 `extension/manifest.json` 鐗堟湰涓?`0.3.6`锛堟湰杞湭鎻愬崌鐗堟湰鍙凤級銆?
- Magic Data ANNOTATOR 鍓嶇鐩綍鐢卞崟 `annotator/` 鎷嗗垎涓?`shared/` + `hakka-helper/` + `minnan-helper/`锛屽苟鏂板闂藉崡璇姪鎵嬭剼鏈叆鍙ｃ€?
- options / popup 鏀寔鍚屽钩鍙板弻鍔╂墜鐙珛鍚仠涓庤瘑鍒紝鍚庣鍦板潃浠嶇粺涓€璧?options 棣栭〉锛屼笉鏂板鑴氭湰璇︽儏鐙珛鍚庣鍦板潃銆?
- 鍚庣鏂板 `hakka-helper` 涓?`minnan-helper` 璺敱锛涗繚鐣?`annotator` 鏃ф帴鍙ｅ吋瀹硅浆鍙戯紝閬垮厤鍘嗗彶閰嶇疆鏂摼銆?
- 琛ラ綈骞冲彴涓庤剼鏈枃妗ｏ紙README/docs/env 绀轰緥锛夛紝骞舵槑纭?AI 浠呰緟鍔╋紝涓嶈嚜鍔ㄤ繚瀛?鎻愪氦/瀹℃牳/棰嗗彇/娴佽浆銆?

## 2026-05-21锛堣剼鏈樉绀哄悕绉拌皟鏁达細v0.3.6锛?

- `extension/manifest.json` patch 鐗堟湰鎻愬崌鍒?`0.3.6`銆?
- Magic Data 鑴氭湰鐢ㄦ埛鍙鍚嶇О缁熶竴涓?`瀹㈠璇濆姪鎵媊锛堢粨鏋滃尯鏂囨缁熶竴涓?瀹㈠璇濆姪鎵嬬粨鏋?锛夈€?
- DataBaker 鑴氭湰鐢ㄦ埛鍙鍚嶇О缁熶竴涓?`闂藉崡璇姪鎵媊锛堟帹鑽愭枃鏈尯鏂囨缁熶竴涓?闂藉崡璇姪鎵嬫帹鑽愭枃鏈?锛夈€?
- 鍚屾 popup銆乷ptions 鑴氭湰鍗°€侀〉闈㈠唴闈㈡澘鏍囬銆侀」鐩暟鎹笅杞芥爣绛惧拰褰撳墠 README/docs 鍙ｅ緞銆?
- 鏈疆涓嶆敼 AI 閾捐矾銆佷笉鏀规ā鍨嬨€佷笉鏀?Prompt銆佷笉鐢熸垚 CRX銆佷笉鎵?tag銆?

## 2026-05-21锛堥」鐩崗浣滆鍒欏悓姝ワ級

- 鍚屾椤圭洰绾ч暱鏈熷崗浣滆鍒欏埌浠撳簱鏂囨。銆?
- Codex Prompt 榛樿鏀逛负鐢熸垚 Markdown 鏂囦欢涓嬭浇锛屼笉鍐嶉粯璁ゅ湪鑱婂ぉ娑堟伅涓洿鎺ヨ创瀹屾暣 Prompt銆?
- 鏂板璧勬枡琛ュ厖鎻愰啋瑙勫垯锛氭埅鍥俱€佹枃浠躲€佹棩蹇椼€丯etwork銆丆onsole銆佸師濮?JSON銆侀煶棰戞牱渚嬬瓑璧勬枡闇€鍏堟彁閱掔敤鎴蜂笂浼犲苟鑴辨晱銆?
- 鏂板閲嶅浠ｇ爜澶嶇敤瑙勫垯锛氬悓涓€妯″潡閲嶅閫昏緫瓒呰繃 2 娆′紭鍏堟娊鍙栥€?
- 鏂板鏍峰紡瑙勫垯锛氫紭鍏?CSS 鍙橀噺鍖栵紱鏈?SCSS 鏋勫缓閾炬椂浼樺厛 SCSS 涓庡祵濂楃粨鏋勩€?
- 鏂板 Git 瑙勫垯锛歝ommit message 浣跨敤涓枃銆?
- 鏂板鐗堟湰瑙勫垯锛氫竴涓紑鍙?/ 淇 / 浼樺寲瀵硅瘽榛樿瀵瑰簲涓€涓?patch 灏忕増鏈紱鍚屼竴瀵硅瘽涓嶉噸澶嶆彁鍗囩増鏈€?

## 2026-05-21锛堟寮忓彂甯冿細v0.3.5锛?

- 鍙戝竷鐗堟湰鎻愬崌鍒?`0.3.5`锛屾寮忓彂甯冧骇鐗╀互 CRX 涓変欢濂椾负鍑嗭細
  - `dist/annotation-script-center-v0.3.5.crx`
  - `dist/annotation-script-center-update.xml`
  - `dist/annotation-script-center-crx-latest.json`
- 鏈増鏈牳蹇冨彉鍖栬仛鐒﹁繎鏈?DataBaker 鑳藉姏鏀跺彛锛?
  - `AI杩炵画濉叆鍚堟牸椤筦 鎵归噺鍏ュ彛銆佸墠绔苟鍙戝垎鏋愪笌椤哄簭濉叆
  - Fun-ASR REST 榛樿閾捐矾涓庨敊璇垎绫诲寮?
  - Omni legacy fast path 鎭㈠涓?`limit_burst_rate` 鐪熷疄閫忓嚭
  - 鎵归噺澶辫触"鏌ョ湅鍘熷AI杩斿洖"涓庤劚鏁?debug JSON
  - 鎸夋ā鍨嬪姩鎬佸綊涓€鐨勫苟鍙戣鍒欙紙Omni `15 / 1~25`锛孎un-ASR `25 / 1~50`锛?
  - 鎵归噺鎮诞绐楁柊澧?AI 閾捐矾銆丄I 妯″瀷銆佸苟鍙戣鍒欍€佹墽琛岃€楁椂绛夌姸鎬佸睍绀?
- 鏈鍙戝竷涓嶅寘鍚晱鎰熶俊鎭紝涓嶈褰曞畬鏁撮煶棰?URL銆佺鍚?URL銆乧ookie銆乼oken銆乤uthorization 鎴?API Key銆?

## 2026-05-21锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛氭壒閲忔偓娴獥鏄剧ず AI 閰嶇疆涓庢墽琛岃€楁椂锛?

- DataBaker "AI杩炵画濉叆鍚堟牸椤?椤堕儴鎮诞绐楁柊澧炴樉绀猴細
  - `褰撳墠AI閾捐矾`
  - `褰撳墠AI妯″瀷`
  - `骞跺彂瑙勫垯`
  - `鎵ц鑰楁椂`
- 鎮诞绐椾細鎸夊綋鍓嶈瘑鍒ā寮忓拰妯″瀷灞曠ず AI 閰嶇疆锛?
  - `two_stage + fun-asr`锛歚Fun-ASR + 姣旇緝妯″瀷`锛屾ā鍨嬫樉绀?`fun-asr + compareModel`
  - `two_stage + Omni`锛歚Omni 鍚煶 + 姣旇緝妯″瀷`锛屾ā鍨嬫樉绀?`listenModel + compareModel`
  - `omni_single`锛歚Omni 鍗曟ā鍨媊锛屾ā鍨嬫樉绀哄綋鍓?`singleModel`
- 骞跺彂瑙勫垯灞曠ず鍚屾褰撳墠妯″瀷鍙ｅ緞锛?
  - Omni锛氶粯璁?`15`锛岃寖鍥?`1~25`
  - Fun-ASR锛氶粯璁?`25`锛岃寖鍥?`1~50`
- 鎵ц鑰楁椂浠庣偣鍑?AI杩炵画濉叆鍚堟牸椤?寮€濮嬭鏃讹紝杩愯涓瘡绉掑埛鏂帮紱浠诲姟瀹屾垚銆佸仠姝€佸紓甯哥粨鏉熸垨 runtime stop 鍚庝細娓呯悊璁℃椂鍣紝骞朵繚鐣欐渶缁堣€楁椂銆?
- 鏈疆鍙寮哄墠绔姸鎬佸睍绀猴紝涓嶆敼 AI 璋冪敤閾捐矾銆佷笉鏀瑰苟鍙戠瓥鐣ャ€佷笉鏀瑰悗绔ā鍨嬮€昏緫銆?

## 2026-05-21锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛氬苟鍙戞寜妯″瀷褰掍竴 + Fun-ASR 閿欒鍒嗙被澧炲己锛?

- DataBaker Options 涓殑"AI杩炵画濉叆鍚堟牸椤瑰苟鍙戞暟閲?宸茬Щ鍏?ASR 璇煶 AI 璁剧疆"鍖哄煙锛屼笉鍐嶇暀鍦ㄦ櫘閫氭壒閲?鑷姩鍖栬缃尯閲嶅鏄剧ず銆?
- 骞跺彂瑙勫垯鏀逛负鎸夊綋鍓嶈瘑鍒ā寮忓拰妯″瀷鍔ㄦ€佸綊涓€锛?
  - Omni锛氶粯璁?`15`锛岃寖鍥?`1~25`
  - Fun-ASR锛氶粯璁?`25`锛岃寖鍥?`1~50`
- 鍓嶇鍒囨崲璇嗗埆妯″紡銆佸惉闊虫ā鍨嬨€丄I 妯″瀷鏃讹紝骞跺彂杈撳叆妗嗕細绔嬪嵆鍒锋柊 `min/max/default`锛涜嫢褰撳墠鍊艰秴鑼冨洿浼氬綋鍦哄己鍒朵慨姝ｃ€?
- `storage`銆丏ataBaker content runtime 鍜岀粺涓€鍚庣 `normalizeRecommendRequest()` 鐜板湪閮戒細鍐嶆褰掍竴骞跺彂鍊硷紱璇锋眰浣撲細闄勫甫 `frontConcurrency / batchConcurrency / concurrencyModelType` 璇婃柇瀛楁锛屼絾涓嶄細杩涘叆妯″瀷 Prompt銆?
- 椤堕儴鎮诞绐椾腑鐨?`鍓嶇骞跺彂` 鐜板湪鏄剧ず瀹為檯褰掍竴鍚庣殑鍊硷紱鍚庣 runtime / call log 涔熶細璁板綍 `frontConcurrencyOriginal / frontConcurrencyNormalized / concurrencyModelType`銆?
- Fun-ASR REST 閿欒璇婃柇澧炲己锛?
  - `401/403`锛氬尯鍒嗛壌鏉?鏉冮檺閿欒
  - `InvalidFile.DownloadFailed / DownloadFailed / audio url cannot be downloaded`锛氬尯鍒嗗钩鍙伴煶棰?URL 涓嶅彲璁块棶
  - invalid model锛氬尯鍒嗘ā鍨嬪悕閿欒
  - `429`锛氬尯鍒嗕笂娓搁檺娴?
  - task failed锛氬尯鍒嗕换鍔″け璐?
  - `transcription_url` 涓嬭浇澶辫触锛氬尯鍒嗙粨鏋滀笅杞藉け璐?
- 鍓嶇澶辫触鏂囨涓嶅啀鍙樉绀?涓婃父妯″瀷鎺ュ彛杩斿洖閿欒"锛涘け璐ュ垪琛ㄧ户缁繚鐣?鏌ョ湅鍘熷AI杩斿洖"鎸夐挳銆?
- Fun-ASR debug store 鐜板湪淇濈暀鑴辨晱鍚庣殑 `provider / stage / model / providerStatus / providerCode / taskId / taskStatus / responseBody / rawText` 鎽樿锛涗笉鍖呭惈瀹屾暣 `audioUrl`銆佺鍚?URL銆乧ookie銆乼oken銆乤uthorization銆丄PI Key銆?
- 鏂板 / 鍏煎璋冭瘯瀛樺偍鐜鍙橀噺锛?
  - `DATABAKER_AI_DEBUG_STORE_TTL_MS=1800000`
  - `DATABAKER_AI_DEBUG_STORE_MAX_SIZE=1000`
- 鏈疆涓嶆敼 Fun-ASR REST 涓婚摼璺€佷笉鎭㈠寮傛 job 榛樿閾捐矾銆佷笉鏀?Qwen 鐩村苟鍙戦粯璁ょ瓥鐣ャ€佷笉鏀?manifest銆?

## 2026-05-21锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛歈wen Omni 榛樿鐩村苟鍙戜笌鐪熷疄闄愭祦閫忓嚭锛?

- DataBaker Omni legacy 蹇€熻矾寰勯粯璁や笉鍐嶅 Qwen 涓婃父鍋氬悗绔钩婊戝彂閫侊紱鍓嶇骞跺彂澶氬皯锛屽氨鎸夎骞跺彂鐩存帴鍙戦€佸灏戞潯 `recommend` 璇锋眰锛宍30ms` 閿欏嘲淇濇寔涓嶅彉銆?
- 鏂板鐜鍙橀噺榛樿鍊硷細
  - `DATABAKER_AI_QWEN_SMOOTH_ENABLED=0`
  - `DATABAKER_AI_QWEN_BURST_RETRY_MAX=0`
  - `DATABAKER_AI_QWEN_BURST_RETRY_BASE_MS=1200`
- 鍙湁鏄惧紡璁剧疆 `DATABAKER_AI_QWEN_SMOOTH_ENABLED=1` 鏃讹紝Omni legacy 鎵嶄細閲嶆柊杩涘叆 `qwen_omni` / `text_compare` provider queue 骞虫粦锛涘彧鏈夋墜鍔ㄦ妸 `DATABAKER_AI_QWEN_BURST_RETRY_MAX` 璋冨ぇ鏃讹紝鎵嶄細瀵?`limit_burst_rate` 鍋氶€€閬块噸璇曘€?
- `qwen-openai-compatible.js` 涓?DataBaker `ai-client-qwen-legacy.js` 缁х画璇嗗埆 SSE `data: {"error": ...}`锛涜嫢 `error.code=limit_burst_rate`锛岀幇鍦ㄧ粺涓€杩斿洖锛?
  - `code=qwen-burst-rate-limited`
  - `providerCode=limit_burst_rate`
  - `providerStatus=429`
  - `message=Qwen 璇锋眰绐佸闄愭祦锛屾帴鍙ｈ繑鍥炶姹傚闀胯繃蹇€俙
- 鍓嶇澶辫触鏂囨鍚屾鏀逛负"Qwen 璇锋眰绐佸闄愭祦锛屾帴鍙ｈ繑鍥炶姹傚闀胯繃蹇紝鍙檷浣庡苟鍙戞垨绋嶅悗閲嶈瘯銆?锛沗qwen-empty-response` 浠呬繚鐣欑粰鐪熸娌℃湁 `error` 涓旀病鏈夋枃鏈殑鍦烘櫙銆?
- DataBaker Omni 妯″瀷閫夐」琛ラ綈鍒帮細
  - `qwen3.5-omni-plus`
  - `qwen3.5-omni-flash`
  - `qwen3.5-omni-flash-2026-03-15`
  - `qwen3-omni-flash`
  - `qwen3-omni-flash-2025-12-01`
  - `qwen3-omni-flash-2025-09-15`
- Fun-ASR REST provider銆佸紓姝?job 榛樿閾捐矾銆乸rovider queue 鍏跺畠閫氱敤鑳藉姏銆佹湰鍦?Python fallback 鍧囨湭鏀瑰姩銆?

## 2026-05-21锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛欰I 宸ュ叿鍗℃寕杞芥湭灏辩华鏀逛负寤惰繜閲嶈瘯锛?

- 淇 DataBaker `roundOneCollect` 椤甸潰鍙充晶 `DataBaker AI 鎺ㄨ崘鏂囨湰` 宸ュ叿鍗″湪 DOM 灏氭湭娓叉煋瀹屾垚鏃惰緭鍑?`AI panel mount target not found` 鎵╁睍鎶ラ敊鐨勯棶棰樸€?
- `extension/sites/data-baker/round-one-quality/ui-panel.js` 鐨?`ensureMounted()` 鐜板湪鎵句笉鍒版寕杞界偣鏃剁洿鎺ヨ繑鍥?`null`锛屼笉鍐?`throw`銆佷笉鍐?`console.error`銆佷笉鍐?`console.warn` 鍒峰睆锛涙渶澶氬彧鎵撳嵃涓€娆?`console.debug`锛歚[DataBaker][round-one-quality] AI panel mount target not ready, will retry.`銆?
- `findMountTarget()` 鐜板湪浼樺厛瀹氫綅"鏈彞璇濇枃鏈?鏂囨湰妗?琛ㄥ崟鍖哄煙锛屽啀鍥為€€鍒伴煶棰戞尝褰㈠彸渚у唴瀹瑰鍣ㄣ€乣.waver-page`銆乣.right`銆乣.app-main/.main-container` 鍐呭彲瑙佷富鍐呭瀹瑰櫒锛涜烦杩囦笉鍙鑺傜偣銆佸凡鑴辩鏂囨。鑺傜偣锛屼笉浼氭寕鍒?`body` 鎴栧乏渚у垪琛ㄣ€?
- `extension/sites/data-baker/round-one-quality/content.js` 鏂板 `300ms` 杞婚噺闄愭閲嶈瘯锛屽苟缁х画渚濊禆鏃㈡湁 `MutationObserver` 閲嶈瘯鎸傝浇锛涢〉闈㈠垏棰樸€佸埛鏂板垪琛ㄣ€佸钩鍙伴噸缁樺垹闄?root 鍚庯紝鍚庣画 `refresh` 浠嶄細鑷姩閲嶆寕杞姐€?
- `clearResult()` 缁х画鍙竻缁撴灉鍖猴紝涓嶅垹闄ゆ牴鑺傜偣锛涘彧鏈?runtime 鍋滄銆佺寮€椤甸潰銆佽剼鏈鐢ㄦ椂 `remove()` 鎵嶄細娓呮帀宸ュ叿鍗°€?
- 宸︿晶 `filter-screen` 鐨?`AI杩炵画濉叆鍚堟牸椤筦 鎸夐挳涓庡彸渚у伐鍏峰崱淇濇寔鐙珛锛涘綋宸︿晶瀹瑰櫒鏆傛椂鏈氨缁椂锛屽彸渚у伐鍏峰崱鍙厛鏄剧ず锛屽悗缁乏渚у鍣ㄦ仮澶嶅悗浼氫紭鍏堝洖鍒?`filter-screen`锛岄伩鍏嶉噸澶嶆彃鍏ュ涓寜閽€?
- 鎵╁睍閲嶈浇鍚庝粛寤鸿鍒锋柊 DataBaker 涓氬姟椤甸潰锛岄伩鍏嶆棫 content script 娈嬬暀瀵艰嚧 `Extension context invalidated` 鎴栨棫鎸傝浇閫昏緫缁х画椹荤暀銆?

## 2026-05-21锛堢増鏈彿鏇存柊锛?.3.4锛?

- `extension/manifest.json` 鐗堟湰鏇存柊鍒?`0.3.4`銆?
- 鏈浠呮洿鏂扮増鏈彿涓庢枃妗ｅ彛寰勩€?
- 鏈敓鎴?CRX銆佹湭鎵?tag銆佹湭鎵ц姝ｅ紡鍙戝竷銆?
- 鍚庣画濡傞渶姝ｅ紡鍙戝竷 `v0.3.4`锛屽簲鎵ц `ASC_RELEASE` 鐢熸垚 CRX 涓変欢濂楀苟鎺ㄩ€?main/tag銆?

## 2026-05-21锛圓baka AI Task21鍔╂墜瀹屾垚鎬佹枃妗ｆ敹鍙ｏ級

- Task21鍔╂墜杩涘叆瀹屾垚鎬佹枃妗ｅ彛寰勶細瀛楁鏃?AI 鍒嗘瀽 + 鎵嬪姩"濉啓 AI 绛旀"鍐欏叆娴佺▼缁熶竴鍒板钩鍙版枃妗ｃ€?
- same_font / image_b_texts_removed / other_changes / overall 鍥涚被鍒嗘瀽璇存槑涓庤繍琛屾椂杈圭晫宸茬粺涓€銆?
- 鏄庣‘ Monaco锛坄data-uri + getModels + setValue`锛変笌 Naive UI textarea 鍐欏叆绛栫暐锛屽己璋冧粎鐢ㄦ埛鐐瑰嚮濉啓鎸夐挳鎵嶅啓鍏ャ€?
- image_b_texts_removed 瑙勫垯缁熶竴涓?T/B/R/D 澶氶噸闆嗭細`D == T => true`銆乣D` 涓虹┖ => `null`銆佸叾浣?`specify`銆?
- same_font 瑙勫垯鏄庣‘鏀寔 `error`锛屽苟绾︽潫 `false/unsure/error` 鏃跺悗缁瓧娈?`not_applicable`銆?
- other_changes 瑙勫垯缁熶竴涓哄彧姣旇緝 `image_b_removed` 涓?`image_b`銆?
- `/task-v2/data-item` 椤堕儴缁熻鍏ュ彛宸叉寕杞斤紙缁熻褰撳墠鍒楄〃/涓嬭浇缁熻CSV锛夛紱褰撳墠浠撳簱灏氭湭钀藉湴缁熻鍚庣涓庣嫭绔?runtime锛屾枃妗ｇ粺涓€涓哄叆鍙ｅ崰浣嶅彛寰勩€?
- AI 涓嶈嚜鍔ㄤ繚瀛樸€佷笉鑷姩鎻愪氦銆佷笉鑷姩閫佸锛涗粎鐐瑰嚮"濉啓 AI 绛旀"鎵嶅啓鍏ュ瓧娈点€?
- 鏈疆浠呮枃妗ｆ敹灏撅紝涓嶅彂鐗堛€佷笉鐢熸垚 CRX銆?

## 2026-05-21锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛歈wen burst rate SSE 璇姤淇锛?

- 淇 `qwen3.5-omni-flash / qwen3.5-omni-plus` 鎵归噺澶辫触鏃舵妸 SSE `data: {"error":{"code":"limit_burst_rate"...}}` 璇垽鎴?`Qwen 鎺ュ彛鏈繑鍥炴湁鏁堟枃鏈琡 鐨勯棶棰樸€?
- 閫氱敤 `qwen-openai-compatible.js` 涓?DataBaker `ai-client-qwen-legacy.js` 鐜板湪浼氬厛璇嗗埆 SSE `error` 瀵硅薄锛屽啀鍐冲畾鏄惁灞炰簬鐪熸绌哄搷搴斻€?
- `limit_burst_rate / throttling / rate_limit / limit_requests / TooManyRequests` 鐜板湪缁熶竴鎸変笂娓搁檺娴佸垎绫伙紱DataBaker 鍓嶇澶辫触鏂囨鏀逛负"Qwen 璇锋眰绐佸闄愭祦锛屽悗绔凡閲嶈瘯浠嶅け璐ャ€傝闄嶄綆鍓嶇骞跺彂鎴栧澶у彂閫侀棿闅斿悗閲嶈瘯銆?
- Omni legacy 蹇€熻矾寰勭殑 `requestListen` / `requestCompare` 鐜板湪閮借繘鍏ュ悗绔?provider queue锛氬惉闊宠蛋 `qwen_omni`锛宑ompare 璧?`text_compare`锛屽墠绔粛淇濇寔 `30ms` 鍙戝埌鍚庣锛屼絾涓婃父璇锋眰浼氳骞虫粦銆?
- 鏂板鐜鍙橀噺锛?
  - `DATABAKER_AI_QWEN_BURST_RETRY_MAX=3`
  - `DATABAKER_AI_QWEN_BURST_RETRY_BASE_MS=1200`
- `qwen-burst-rate-limited` 澶辫触浼氱户缁敓鎴?`debugId`锛屽苟淇濈暀"鏌ョ湅鍘熷AI杩斿洖"鑳藉姏锛沝ebug 涓兘鐪嬪埌鑴辨晱鍚庣殑 `providerCode=limit_burst_rate`銆乣rawSseText`銆乣stage`銆乣model` 绛変俊鎭€?

## 2026-05-21锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛氭煡鐪嬪師濮?AI 杩斿洖寮圭獥鎭㈠鍙锛?

- 淇 DataBaker 鎵归噺澶辫触鍒楄〃涓?鏌ョ湅鍘熷AI杩斿洖"鎸夐挳鐐瑰嚮鍚庢棤鏄庢樉鍙嶉鐨勯棶棰樸€?
- 鏍瑰洜鏄け璐ユ寜閽湪鎵归噺杩愯鏈熼棿浼氳 `batchAutofillRunning` 鐩存帴绂佺敤锛屽鑷寸敤鎴风湅鍒版寜閽絾鏃犳硶鐐瑰嚮锛涘悓鏃跺脊绐楃粨鏋勬牱寮忎笉瀹屾暣锛屼笉鍒╀簬纭鏄惁宸叉墦寮€銆?
- 鐜板湪"鏌ョ湅鍘熷AI杩斿洖"鎸夐挳涓嶅啀闅忔壒閲忚繍琛屾€佺鐢紱鐐瑰嚮浼氶樆姝㈠啋娉″苟鎵撳紑鏂囨湰鎮诞绐椼€?
- 鏂板 / 瀹屾暣鍚敤 debug modal 缁撴瀯涓庢牱寮忥細
  - 鏍囬锛歚鍘熷 AI 杩斿洖`
  - textarea锛氬睍绀烘牸寮忓寲鍚庣殑鑴辨晱 JSON
  - 鎸夐挳锛歚澶嶅埗` / `鍏抽棴`
  - 鏀寔鐐瑰嚮閬僵鍏抽棴
- `loadFailureDebugJson` 鐨勫弸濂介敊璇枃妗堢粺涓€涓?褰撳墠澶辫触椤规病鏈夊彲鏌ョ湅鐨勫師濮婣I杩斿洖銆?銆?
- 鏈疆涓嶆敼妯″瀷閾捐矾銆佷笉鏀?Omni legacy fast path銆佷笉鏀?Fun-ASR REST provider銆?

## 2026-05-21锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛氭壒閲忓け璐ユ敮鎸佹煡鐪嬪師濮?AI 杩斿洖锛?

- DataBaker 鎵归噺澶辫触鍒楄〃鏂板"鏌ョ湅鍘熷AI杩斿洖"鎸夐挳锛岀粺涓€鏇夸唬鏃х殑"澶嶅埗鍘熷JSON"鍏ュ彛銆?
- 鍚屾 `POST /api/data-baker/round-one-quality/ai/recommend` 澶辫触鏃讹紝濡傛灉灞炰簬 `qwen-empty-response`銆乣model-json-parse-failed`銆乣provider-http-error` 绛夊彲瑙傛祴閿欒锛屼細杩斿洖 `hasRawAiDebug=true` 鍜?`debugId`銆?
- 鍚庣鏂板 `ai-debug-store.js`锛屽湪鍐呭瓨涓殏瀛樻渶杩戜竴娈垫椂闂寸殑鑴辨晱鍘熷 AI debug锛岄粯璁?TTL 30 鍒嗛挓銆佹渶澶?1000 鏉★紝涓嶈惤鐩樸€?
- 鏂板鎺ュ彛锛歚GET /api/data-baker/round-one-quality/ai/recommend/debug/:debugId`锛屽墠绔偣鍑诲け璐ラ」鎸夐挳鍚庡彲鏌ョ湅骞跺鍒跺搴旂殑鑴辨晱 debug JSON銆?
- `qwen-openai-compatible.js` 涓?`ai-client-qwen-legacy.js` 鐜板湪浼氬湪绌哄搷搴斻€丠TTP 閿欒鏃堕檮甯?`debugRawAiResponse`锛屽苟鍦ㄦ壒閲忓け璐ユ椂閫忎紶鍒板墠绔€?
- `ai-service.js` 涓?`ai-legacy-omni-service.js` 浼氬湪 JSON 瑙ｆ瀽澶辫触鎴?provider 閿欒鏃剁粺涓€鐢熸垚 `debugId`锛屽苟鎶?`debugId` 鍐欏叆璋冪敤鏃ュ織鎽樿銆?
- debug 鍐呭浼氳劚鏁忓苟鎴柇锛屼笉鍖呭惈瀹屾暣闊抽 URL銆佺鍚?URL銆乧ookie銆乼oken銆乤uthorization銆丄PI Key銆?

## 2026-05-21锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛氭仮澶嶅彸渚?AI 鎺ㄨ崘宸ュ叿鍗★級

- 淇 `roundOneCollect` 椤甸潰鍙充晶 `DataBaker AI 鎺ㄨ崘鏂囨湰` 宸ュ叿鍗″洜鎸傝浇鐩爣杩囩獎鑰屾湭鏄剧ず鐨勯棶棰樸€?
- `findMountTarget` 鐜板湪浼樺厛瀹氫綅 `.waver-page .text-box`锛屽苟鍏煎 `.waver-page`銆乣.right` 绛夌ǔ瀹氬鍣紱鎵惧埌鏂囨湰妗嗘椂浼氭寕杞藉埌"鏈彞璇濇枃鏈?涓嬫柟銆?
- 鍙充晶宸ュ叿鍗℃仮澶嶅悗缁х画淇濈暀鏍囬鍙充晶 `AI 鎺ㄨ崘鏂囨湰` 鎸夐挳锛屼互鍙婄粨鏋滃尯鍩熺殑 `澶嶅埗鎺ㄨ崘鏂囨湰 / 濉叆鎺ㄨ崘鏂囨湰 / 蹇界暐` 涓変釜鍔ㄤ綔銆?
- 宸︿晶 `filter-screen` 鐨?`AI杩炵画濉叆鍚堟牸椤筦 鎸夐挳缁х画淇濈暀锛屼笖涓庡彸渚у伐鍏峰崱鐨勬寕杞介€昏緫瀹屽叏鐙珛銆?
- 鎵╁睍閲嶈浇鍚庝粛闇€鍒锋柊 DataBaker 涓氬姟椤甸潰锛岄伩鍏嶆棫 content script 娈嬬暀褰卞搷娴嬭瘯銆?

## 2026-05-21锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛氭仮澶嶇洿鎺?recommend 璇锋眰骞剁粺涓€ 120s 瓒呮椂锛?

- DataBaker "AI骞跺彂鍒嗘瀽骞惰繛缁～鍏ュ悎鏍奸」"榛樿涓嶅啀閫氳繃寮傛 job 鎺ユ敹 AI 缁撴灉锛岃€屾槸鐩存帴鎵归噺璋冪敤 `POST /api/data-baker/round-one-quality/ai/recommend`銆?
- 褰撳墠椤垫湁 N 鏉″悎鏍奸」鏃讹紝浼氫负 N 鏉′换鍔¤皟搴﹀搴旇姹傦紱鍓嶇榛樿鎸?`30ms` 閿欏嘲鍙戣捣锛屽苟缁х画鐢?AI杩炵画濉叆鍚堟牸椤瑰苟鍙戞暟閲?鎺у埗鏈€澶ф椿璺冭姹傛暟锛岄粯璁?`20`锛岃寖鍥?`1~50`銆?
- 鍚庣 provider queue / RPM 闄愭祦銆丗un-ASR REST銆丵wen compare銆丣SON 瑙ｆ瀽澶辫触澶嶅埗鍘熷 JSON 鑳藉姏缁х画淇濈暀銆?
- 椤圭洰绾ч粯璁ゆ椂闂磋鍒欐敼涓猴細TTS 鑷姩娓呴櫎淇濇寔 `60000ms`锛孉I / 妯″瀷璇锋眰榛樿瓒呮椂鎭㈠涓?`120000ms`锛涜秴杩?2 鍒嗛挓浠嶆棤娉曡繑鍥炴椂锛岄粯璁よ涓洪摼璺笉閫傚悎褰撳墠椤圭洰銆?
- `DATABAKER_AI_ASYNC_JOBS_ENABLED` 涓庡巻鍙插吋瀹?`DATABAKER_AI_FUN_ASR_ASYNC_JOBS_ENABLED` 榛樿鍧囦负 `0`锛沯obs 鎺ュ彛浠呬繚鐣欎负鍘嗗彶鍏煎 / 璋冭瘯鐢ㄩ€斻€?
- 鑻ュ巻鍙插吋瀹?job 閾捐矾浠嶈璋冪敤锛宩ob 瓒呮椂鏂囨鏀逛负"褰撳墠浠诲姟瓒呰繃120s锛岃閲嶆柊璇锋眰銆?銆?

# 鏍囨敞鑴氭湰涓績淇敼鏃ュ織

## 2026-05-21锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛氭仮澶?Omni legacy 蹇€熻矾寰勫苟淇 debug 鍑芥暟锛?

- 淇鍓嶇 `loadFailureDebugJson is not defined`锛歚content.js` 宸茶ˉ瀹夊叏鍏滃簳鍑芥暟锛屽け璐ュ垪琛ㄧ户缁繚鐣?澶嶅埗鍘熷JSON"鎸夐挳锛涙病鏈?debug 鏁版嵁鏃舵彁绀?褰撳墠澶辫触椤规病鏈夊彲澶嶅埗鐨勫師濮?JSON銆?銆?
- `qwen3.5-omni-flash` / `qwen3.5-omni-plus` 榛樿鎭㈠璧?Omni legacy 蹇€熻矾寰勶紝鍙傝€冩彁浜?`9677e4cea98de222b70f89c9e0af1d89971dc471`銆?
- 鏂板 DataBaker 涓撶敤 `ai-client-qwen-legacy.js` 涓?`ai-legacy-omni-service.js`锛屽彧鏈嶅姟 Omni 蹇€熻矾寰勶紝涓嶅奖鍝嶇粺涓€ AI 鍩哄骇涓庡叾浠栧钩鍙般€?
- `two_stage + fun-asr` 浠嶈蛋褰撳墠 Node REST provider锛涗笉鎭㈠ Python 涓婚摼璺紝涓嶆仮澶?async job 榛樿閾捐矾锛屼笉鍋?SSE / batch file_urls銆?
- `health/defaults` 鏂板 `omniLegacyFastPath` 涓?`omniLegacyCommit`锛岀敤浜庣‘璁ゅ綋鍓嶆槸鍚﹀惎鐢?legacy 蹇€熻矾寰勩€?

## 2026-05-21锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛氬紓姝?job 涓婇檺 600銆?0s 寮哄埗鍙栨秷銆丣SON debug 澶嶅埗锛?

- DataBaker `two_stage + fun-asr` 鐨勫紓姝?job store 榛樿涓婇檺鏀逛负 `600`锛岀粺涓€ provider queue 榛樿涓婇檺涔熷悓姝ユ敼涓?`600`銆?
- 褰?job store 鎴?provider queue 杈惧埌涓婇檺鏃讹紝鍚庣缁熶竴杩斿洖"鍚庣 AI 浠诲姟闃熷垪宸叉弧锛岃绋嶅悗閲嶈瘯銆?锛岀户缁繚鐣欏師鏈夊苟鍙戜笌 RPM 淇濇姢銆?
- 鏂板 `DATABAKER_AI_JOB_TIMEOUT_MS=120000`锛氬巻鍙插吋瀹瑰紓姝?job 瓒呰繃 120 绉掍細琚己鍒舵爣璁颁负 failed锛屽苟鍥哄畾鎻愮ず"褰撳墠浠诲姟瓒呰繃120s锛岃閲嶆柊璇锋眰銆?銆?
- 瓒呮椂 job 浼氳Е鍙?`AbortController` 鍙栨秷鎴栭€昏緫涓㈠純杩熷埌缁撴灉锛涜繜鍒扮粨鏋滀笉浼氳鐩?failed 鐘舵€侊紝涓嶄細杩涘叆 completedQueue锛屼篃涓嶄細缁х画濉叆椤甸潰銆?
- provider queue銆丗un-ASR REST 鍜?Qwen OpenAI-compatible 閾捐矾琛ュ厖 `signal` 閫忎紶涓?pending/running abort 鏀寔銆?
- DataBaker 妯″瀷 JSON 瑙ｆ瀽澶辫触鏃讹紝閿欒瀵硅薄浼氫繚瀛樿劚鏁忓悗鐨?`debugRawJson`锛屽苟鏂板璋冭瘯鎺ュ彛锛?
  - `GET /api/data-baker/round-one-quality/ai/recommend/jobs/:jobId/debug`
- 鍓嶇澶辫触鍒楄〃鏂板"澶嶅埗鍘熷JSON"鎸夐挳锛氫粎鍦?JSON 瑙ｆ瀽澶辫触鏃跺嚭鐜帮紝鐐瑰嚮鍚庝紭鍏堝鍒惰劚鏁?debug JSON锛屽壀璐存澘涓嶅彲鐢ㄦ椂闄嶇骇涓?textarea 鎵嬪姩澶嶅埗銆?
- 鑴辨晱瑕佹眰锛歞ebug JSON 涓嶅寘鍚畬鏁?audioUrl銆佺鍚?URL銆乧ookie銆乼oken銆丄PI Key銆?

## 2026-05-21锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛氬紓姝?job TTL 鏀逛负 1 鍒嗛挓锛?

- DataBaker `two_stage + fun-asr` 鎵归噺杩炵画濉叆鏇剧煭鏆傚皾璇曡繃灏嗗紓姝?job 榛樿 TTL 璋冩暣涓?1 鍒嗛挓锛堟棫鍙ｅ緞锛岀幇宸插簾寮冿級銆?
- 鐩稿叧 `ai-job-store.js` 浠ｇ爜榛樿鍊煎綋鏃朵篃鍚屾鏀规垚浜?1 鍒嗛挓鍙ｅ緞锛涙湰杞凡鎭㈠涓?120 绉?AI 瓒呮椂 + 鍚屾 recommend 涓婚摼璺€?
- 鐩稿叧 env 绀轰緥涓庤鏄庢枃妗ｅ綋鏃朵篃鍚屾鏀规垚浜?1 鍒嗛挓鍙ｅ緞锛涙湰杞凡缁熶竴鎭㈠涓?`120000ms` AI 榛樿瓒呮椂銆?
- 鏈疆涓嶆敼 job 鏈€澶ф暟閲忋€佷笉鏀硅疆璇㈤棿闅斻€佷笉鏀?Fun-ASR REST / compare 閾捐矾銆?

## 2026-05-21锛堢粺涓€榛樿鏃堕棿瑙勫垯锛歍TS 鑷姩娓呴櫎 60000ms锛孉I 榛樿瓒呮椂 1 鍒嗛挓鏃у彛寰勶級

- 鏍硅鍒欐洿鏂帮細
  - `AGENTS.md` 褰撴椂鏂板椤圭洰绾ч粯璁ゆ椂闂磋鍒欙細TTS 鑷姩娓呴櫎榛樿 `60000ms`锛孉I / 妯″瀷璇锋眰榛樿瓒呮椂鏇剧煭鏆傝皟鏁翠负 1 鍒嗛挓锛堢幇宸叉仮澶嶄负 `120000ms`锛夈€?
  - 瑙勫垯鏄庣‘锛氭柊澧炲钩鍙般€佽剼鏈€丄I provider銆乷ptions 榛樿鍊笺€佸悗绔?env fallback 涓?README 绀轰緥榛樿娌跨敤璇ュ€硷紱闈?AI 涓婁紶銆佷笅杞姐€佺粺璁′笌鏅€氬悗绔帴鍙ｈ秴鏃朵笉鍙楀奖鍝嶃€?
- DataBaker 骞冲彴锛?
  - 褰撳墠浠撳簱涓疄闄呭瓨鍦ㄧ殑鑷姩娓呴櫎鏃堕棿瀛楁瀹氫綅涓洪《閮ㄧ粺璁℃偓娴獥 `autoHideMs`銆?
  - `autoHideMs` 榛樿浠?`30000ms` 璋冩暣涓?`60000ms`銆?
  - `aiRecommendRequestTimeoutMs` 鐩稿叧榛樿鍊笺€佸墠绔?fallback銆佸悗绔?env fallback 褰撴椂鏇剧粺涓€鏀逛负 1 鍒嗛挓锛堟棫鍙ｅ緞锛岀幇宸叉仮澶嶄负 `120000ms`锛夈€?
- 鍏朵粬 AI 骞冲彴榛樿瓒呮椂褰撴椂涔熸浘缁熶竴涓?1 鍒嗛挓鏃у彛寰勶細
  - Alibaba LabelX ASR 杞啓 AI
  - Alibaba LabelX ASR 蹇垽 AI
  - Magic Data AI 璐ㄦ
  - Abaka AI Task21 AI 鍒嗘瀽
- 淇濇寔涓嶅彉锛?
  - DataBaker AI 寮傛 job TTL `120000`锛? 鍒嗛挓锛?
  - 闈?AI 缁熻涓婁紶瓒呮椂 `20000`
  - queue/cache/job/poll 绛夐潪妯″瀷璇锋眰鏃堕暱
  - 鐢ㄦ埛宸叉墜鍔ㄤ繚瀛樼殑闈為粯璁よ秴鏃跺€肩户缁繚鐣欙紝涓嶅己鍒惰鐩?

## 2026-05-21锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛欶un-ASR 鎵归噺杩炵画濉叆鏀逛负鍚庣寮傛 job锛?

- 淇 DataBaker 鍦?`two_stage + fun-asr` 鎵归噺"AI杩炵画濉叆鍚堟牸椤?鏃跺墠绔ぇ閲?`Failed to fetch` 鐨勯棶棰樸€?
- 鏍瑰洜纭锛?
  - 涓嶆槸 Fun-ASR 璇嗗埆澶辫触銆?
  - 鍚庣鏃ュ織宸叉樉绀?Fun-ASR REST submit/poll 鐢氳嚦 compare 闃舵鎴愬姛銆?
  - 鐪熸闂鏄祻瑙堝櫒鍚屾绛夊緟 `POST /ai/recommend` 鏃堕棿杩囬暱锛氳姹傝鍚屾椂绛夊緟鍚庣闃熷垪銆丗un-ASR submit銆丗un-ASR poll銆乧ompare 鍜岃繑鍥烇紝`queueWaitMs` 鍙揪 30 绉掍互涓婏紝瀹规槗琚祻瑙堝櫒銆佷唬鐞嗘垨缃戝叧涓柇銆?
- 鏂板 DataBaker AI 寮傛 job 鍐呭瓨瀛樺偍锛?
  - `platform-resources/data-baker/round-one-quality/backend/ai-job-store.js`
  - 鏂板鎺ュ彛锛?
    - `POST /api/data-baker/round-one-quality/ai/recommend`锛堥粯璁わ級
- `POST /api/data-baker/round-one-quality/ai/recommend/jobs`锛堝巻鍙插吋瀹癸級
- `GET /api/data-baker/round-one-quality/ai/recommend/jobs/:jobId`锛堝巻鍙插吋瀹癸級
  - job 鍙繚瀛樺湪褰撳墠 Node 杩涚▼鍐呭瓨锛屼笉钀界洏锛涘悗绔噸鍚悗涓㈠け鏄厑璁歌涓恒€?
  - job TTL 榛樿 `120000`锛? 鍒嗛挓锛夛紝鏈€澶?job 鏁伴粯璁?`1000`銆?
- `ai-routes.js` 淇濈暀鍚屾 `POST /ai/recommend`锛屽悓鏃舵敮鎸佸紓姝?jobs锛?
  - 鍒涘缓 job 鎺ュ彛蹇€熻繑鍥?`jobId`
  - 鍚庡彴缁х画鎵ц鐜版湁 `ai-service.recommend(...)`
  - 鍓嶇杞 job 鐘舵€佸苟鍦?`succeeded` 鍚庢嬁鍒颁笌鍚屾 recommend 鐩稿悓缁撴瀯鐨?`data`
- 鍓嶇鎵归噺杩炵画濉叆绛栫暐璋冩暣锛?
  - 鍗曟潯"AI 鎺ㄨ崘鏂囨湰"鎸夐挳浠嶇户缁蛋鍚屾 recommend
  - 浠呭綋 `recognitionMode=two_stage` 涓?`listenModel=fun-asr` 鏃讹紝鎵归噺杩炵画濉叆浼樺厛璧板紓姝?job
  - 鍏朵粬妯″紡锛圦wen Omni 鍙屾ā鍨嬨€丱mni 鍗曟ā鍨嬶級缁х画璧板師鍚屾 recommend
  - 浠嶄繚鎸?璋佸厛瀹屾垚璋佽繘鍏ュ～鍏ラ槦鍒?鐨勪綋楠岋紝涓嶇瓑寰呮墍鏈変换鍔＄粨鏉?
- 椤堕儴鎮诞绐楁柊澧炲悗绔?job 缁熻锛?
  - `鍚庣浠诲姟宸叉彁浜
  - `鍚庣浠诲姟杩愯涓璥
  - `鍚庣浠诲姟鎴愬姛`
  - `鍚庣浠诲姟澶辫触`
- 鑻ョ綉缁滃眰鍑虹幇 `Failed to fetch`锛屽墠绔弸濂芥彁绀烘敼涓猴細
  - `鍚庣杩炴帴涓柇鎴栦唬鐞嗚秴鏃讹紱Fun-ASR 鎵归噺宸叉敼涓哄紓姝ヤ换鍔★紝璇峰埛鏂板悗閲嶈瘯锛屾垨妫€鏌ュ悗绔棩蹇椼€俙
- `health/defaults` 鏂板 jobs 鎽樿锛?
  - `enabled`
  - `ttlMs`
  - `maxSize`
  - `pollIntervalMs`
  - `activeCount`
  - `pendingCount`
  - `runningCount`
  - `succeededCount`
  - `failedCount`
- 缁熶竴鍚庣 router 鏂板 `:jobId` 褰㈠紡鐨勮矾寰勫弬鏁板尮閰嶏紝鐢ㄤ簬 DataBaker jobs 鐘舵€佹煡璇€?
- 鏈疆涓嶅洖閫€ Python锛屼笉鍚敤 `file_urls` batch锛屼笉瀹炵幇 SSE锛汧un-ASR 涓婚摼璺粛鏄?Node REST 鍗曟潯璋冪敤 + provider queue 鎺у埗骞跺彂銆?

## 2026-05-20锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛欶un-ASR 榛樿鏀逛负 Node REST 鍗曟潯璋冪敤锛?

- DataBaker `fun-asr` 涓婚摼璺粠 Python SDK 瀛愯繘绋嬮粯璁ゆ柟妗堝垏鎹负 Node REST 鍗曟潯璋冪敤锛?
  - 鏂板 `platform-resources/backend/ai/providers/funasr-rest.js`
  - 鏂板 `platform-resources/backend/ai/providers/funasr.js`
  - 榛樿 `DATABAKER_AI_FUN_ASR_PROVIDER=rest`
  - `DATABAKER_AI_FUN_ASR_PROVIDER_FALLBACK` 榛樿绌猴紝涓嶅啀闈欓粯閫€鍥?Python
- Fun-ASR REST 閲囩敤瀹樻柟寮傛浠诲姟妯″紡锛?
  - 鎻愪氦浠诲姟锛歚POST /api/v1/services/audio/asr/transcription`
  - 鏌ヨ浠诲姟锛歚POST /api/v1/tasks/{task_id}`
  - 褰撳墠鍙疄鐜板崟鏉?REST 璋冪敤锛屼笉鍚敤 `file_urls` batch
- DataBaker `ai-service.js` 鐜板湪鍙皟鐢ㄧ粺涓€ `requestFunAsrRecognition(...)` 鍏ュ彛锛屼笉鍐嶇洿鎺ヤ緷璧?`funasr-python.js`銆?
- `health/defaults/runtime` 鏂板 Fun-ASR provider 鐩稿叧瀛楁锛?
  - `funAsrProvider`
  - `funAsrRestConfigured`
  - `funAsrPythonConfigured`
  - `funAsrApiBase`锛堜粎 host 鎽樿锛?
- Python 浠ｇ爜涓?requirements 缁х画淇濈暀锛?
  - `platform-resources/backend/ai/python/funasr_client.py`
  - `platform-resources/backend/ai/python/requirements.txt`
  浠呭湪鏄惧紡璁剧疆 `provider=python` 鎴?`fallback=python` 鏃跺惎鐢ㄣ€?
- Fun-ASR provider 闃熷垪榛樿骞跺彂鍩虹嚎鏀逛负 `2`锛岀户缁敱 `DATABAKER_AI_FUN_ASR_CONCURRENCY` 瑕嗙洊锛汻PM 闄愭祦涓?queue 淇濇姢淇濇寔涓嶅彉銆?
- 鏂囨。涓?env 绀轰緥宸插悓姝ユ洿鏂帮細
  - Fun-ASR 榛樿 provider = REST
  - Python 鍙綔 fallback / 璋冭瘯
  - 淇敼 env 鍚庨渶瑕侀噸鍚粺涓€ Node 鍚庣
  - 鑻ユ樉寮忓垏鍥?Python锛屽啀鎸夋牴 README 瀹夎 `.venv` 渚濊禆

## 2026-05-20锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛欶un-ASR 杩炵画濉叆骞跺彂璇婃柇澧炲己锛?

- DataBaker "AI杩炵画濉叆鍚堟牸椤?鏂板杩愯鏃惰瘖鏂細
  - 鍓嶇鎮诞绐楀鍔?`鍓嶇骞跺彂`銆乣宸插彂璧稟I璇锋眰`銆乣鍓嶇娲昏穬AI璇锋眰`銆乣AI宸茶繑鍥瀈銆乣寰呭～闃熷垪`
  - 鍓嶇 console 澧炲姞 `[DataBaker][batch] start` 涓?`[DataBaker][batch] launch ai request`
- 缁熶竴 provider 闃熷垪鏂板璇婃柇鏃ュ織锛?
  - `[AIQueue] start`
  - `[AIQueue] finish`
  - `health.queue.groups.*` 鏄庣‘淇濈暀 `pendingCount / activeCount / maxConcurrent / rpm / intervalMs / stats`
- Fun-ASR Python wrapper 鏂板瀛愯繘绋嬭瘖鏂細
  - `[FunASR] spawn start`
  - `[FunASR] spawn finish`
  - 鏃ュ織鍙緭鍑?requestId銆佹ā鍨嬨€佹椂闀裤€乺awStatus锛屼笉杈撳嚭瀹屾暣 `audioUrl`
- DataBaker `fun_asr_compare` 鍝嶅簲鏂板 `runtime.stageTiming`锛?
  - `listenQueuedAt / listenStartedAt / listenFinishedAt`
  - `compareQueuedAt / compareStartedAt / compareFinishedAt`
- 鏂板 `platform-resources/backend/ai/smoke-test-provider-queue.js`锛?
  - `fun_asr` 骞跺彂 `5` + 5 涓?`1000ms` mock 浠诲姟锛屾€昏€楁椂绾?`1.1s`
  - `fun_asr` 骞跺彂 `1` 鏃讹紝鎬昏€楁椂绾?`5.1s`
  - 璇佹槑褰撳墠缁熶竴 provider queue 宸叉敮鎸佸悓缁勫苟鍙戯紝涓嶆槸 Fun-ASR Python 瀛愯繘绋嬪ぉ鐒朵覆琛?
- 鏄庣‘鍙ｅ緞锛?
  - Fun-ASR 涓嶆敮鎸?thinking锛屼笉缁?`funasr_client.py` 浼?`enable_thinking`
  - thinking 鍙奖鍝?Qwen Omni / compare 闃舵
  - 濡傛灉鎵归噺鐪嬭捣鏉ュ儚涓茶锛屼紭鍏堝厛鐪嬪墠绔苟鍙戝€煎拰 `health.queue.groups.fun_asr.activeCount`

## 2026-05-20锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛氳瘑鍒ā寮忔仮澶嶄负鍗曞弻妯″瀷鑱斿姩锛?

- DataBaker ASR 璇煶 AI 璁剧疆椤垫仮澶嶆樉绀?璇嗗埆妯″紡"锛?
  - `two_stage`锛氭樉绀?鍚煶妯″瀷 + 姣旇緝妯″瀷"
  - `omni_single`锛氬彧鏄剧ず"AI 妯″瀷"
- 鍗曟ā鍨?`AI 妯″瀷` 鍙厑璁?`qwen3.5-omni-plus`銆乣qwen3.5-omni-flash`锛岄粯璁?`qwen3.5-omni-flash`锛涗笉浼氳皟鐢?compare锛屼篃涓嶄細浣跨敤 `fun-asr`銆?
- 鍙屾ā鍨嬬户缁樉绀猴細
  - 鍚煶妯″瀷锛歚fun-asr`銆乣qwen3.5-omni-plus`銆乣qwen3.5-omni-flash`
  - 姣旇緝妯″瀷锛歚qwen3.6-plus`銆乣qwen3.5-plus`銆乣qwen3.6-flash`銆乣qwen3.5-flash`
- 鍓嶇鍒囨崲璇嗗埆妯″紡鏃朵細绔嬪嵆鍒锋柊瀛楁鏄鹃殣锛屼笉闇€瑕佸厛淇濆瓨锛涗粠 `fun-asr` 鍙屾ā鍨嬪垏鍒板崟妯″瀷鏃讹紝浼氭妸鍗曟ā鍨嬮粯璁ゆ樉绀轰负 `qwen3.5-omni-flash`銆?
- 鍓嶇鏂板骞舵寔涔呭寲 `aiRecommendSingleModel`锛屽苟鍏煎鏃ч厤缃縼绉伙細
  - `fun_asr_compare` => `two_stage + fun-asr`
  - `qwen_omni_compare` => `two_stage + qwen3.5-omni-flash`
  - `listen_only` => `omni_single + qwen3.5-omni-flash`
- 鍚庣涓嶅啀淇′换璇锋眰浣撻噷鐨勬棫 `pipelineMode` 鐩存帴鍐冲畾閾捐矾锛岃€屾槸鎸?`recognitionMode + listenModel/singleModel` 閲嶆柊鎺ㄥ锛?
  - `two_stage + fun-asr` => `fun_asr_compare`
  - `two_stage + qwen omni` => `qwen_omni_compare`
  - `omni_single + qwen omni` => `omni_single`
- DataBaker 鍗曟ā鍨嬮摼璺凡鎭㈠锛氫娇鐢?`buildOmniSinglePrompt` 鍗曟 Qwen Omni 璇锋眰瀹屾垚鍚煶 + 鎺ㄨ崘鏂囨湰锛屼笉璋冪敤 compare銆?
- `health/defaults` 鐜板湪杩斿洖锛?
  - `recognitionModeOptions / pipelineModeOptions`
  - `singleModelOptions`
  - `listenModelOptions`
  - `compareModelOptions`
  - `derivedPipelineMode`

## 2026-05-20锛堟爣璐濇槗閲囦竴妫€璐ㄦ锛氭敹鏁?ai-service銆乺eference 鐩綍鏀瑰悕銆丗un-ASR 闃熷垪骞跺彂锛?

- DataBaker 鍚庣 AI 涓氬姟灞備粠澶氭枃浠舵暎钀芥敼涓洪泦涓敹鏁涳細
  - 鏂板 `platform-resources/data-baker/round-one-quality/backend/ai-service.js`
  - `ai-routes.js` 鏀硅杽锛屽彧璐熻矗 `health/defaults/recommend` 璺敱娉ㄥ唽銆佽姹備綋璇诲彇涓庡搷搴旇繑鍥?
  - `ai-service.js` 闆嗕腑绠＄悊璇锋眰褰掍竴鍖栥€侀摼璺帹瀵笺€乸rompt銆乻chema 瑙ｆ瀽銆佽瘝琛ㄣ€佹枃鏈綊涓€鍖栥€佹垚鏈及绠椼€佽皟鐢ㄦ棩蹇椼€佺紦瀛樸€侀槦鍒楄皟搴﹀拰鎺ㄨ崘缁撴灉缁勮
- 鍒犻櫎 DataBaker 鐩綍鍐呮棫鏁ｆ枃浠讹細
  - `ai-prompts.js`
  - `ai-response-schema.js`
  - `ai-cost.js`
  - `ai-call-log.js`
  - `ai-lexicon.js`
  - `ai-text-normalizer.js`
- 鍒犻櫎 DataBaker 鐩綍鍐呮棫閫氱敤钖勫皝瑁咃細
  - `ai-client-qwen.js`
  - `ai-client-funasr.js`
  - `ai-provider-queue.js`
  - `ai-result-cache.js`
  褰撳墠 `ai-service.js` 鐩存帴寮曠敤 `platform-resources/backend/ai/` 缁熶竴鍩哄骇锛屼笉鍐嶄繚鐣欎腑闂磋烦杞眰銆?
- DataBaker 鍙傝€冭祫鏂欑洰褰曚粠 `platform-resources/data-baker/round-one-quality/ai/` 鏀瑰悕涓?`platform-resources/data-baker/round-one-quality/reference/`銆?
  - `minnan-lexicon.csv` 宸茶縼绉诲埌 `reference/minnan-lexicon.csv`
  - 鏂囨。缁熶竴鏀规垚"鍙傝€冭祫鏂?鎴?璇嶈〃鍙傝€冭祫鏂?锛屼笉鍐嶆妸涓氬姟璇嶈〃鐩綍鍙垚 `ai/`
- 缁熶竴 provider 闃熷垪浠?鍗?group 涓茶 processing"鏀逛负"鎸?group 闄愭祦 + 鏈€澶у苟鍙?锛?
  - `DATABAKER_AI_QWEN_OMNI_CONCURRENCY=3`
  - `DATABAKER_AI_FUN_ASR_CONCURRENCY=5`
  - `DATABAKER_AI_TEXT_CONCURRENCY=5`
  - 闃熷垪浠嶄繚鐣?RPM 闄愭祦銆侀槦鍒楅暱搴﹂檺鍒躲€?29 鎸囨暟閫€閬夸笌 jitter
  - `queueMeta` 琛ュ厖 `activeCount` / `maxConcurrent`
- Fun-ASR 骞跺彂闂瀹氫綅缁撹锛?
  - 闂涓诲洜涓嶆槸 thinking锛岃€屾槸鏃?`provider-queue.js` 瀵?`fun_asr` group 鏁翠綋涓茶鍖?
  - 淇鍚庡厑璁稿涓?Fun-ASR Python 瀛愯繘绋嬪悓鏃?in-flight锛屼絾浠嶅彈 RPM 鍜?`maxConcurrent` 鎺у埗
- thinking 鍙ｅ緞琛ュ厖锛?
  - Fun-ASR 娌℃湁 thinking 姒傚康
  - 涓嶅悜 `platform-resources/backend/ai/python/funasr_client.py` 浼?`enable_thinking`
  - thinking 鍙奖鍝?Qwen Omni 鍚煶闃舵鍜?compare 闃舵
- 鏂囨。鍚屾鏇存柊锛?
  - DataBaker backend 褰撳墠鍙繚鐣?`ai-routes.js + ai-service.js` 浣滀负涓氬姟灞?
  - 璇嶈〃鍙傝€冭祫鏂欒矾寰勬洿鏂颁负 `reference/minnan-lexicon.csv`
  - Fun-ASR 骞跺彂鐜鍙橀噺鍜?`2 鏍?2G` 璋冧紭寤鸿宸插啓鍏?README 鍜?`config/env/ai.env.example`

## 2026-05-20锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛欶un-ASR Python stdout 寮哄埗 UTF-8锛?

- 淇 DataBaker 鍦ㄩ€夋嫨 `fun-asr` 浣滀负鍚煶妯″瀷鏃讹紝"AI 鍚煶鏂囨湰"鍑虹幇 `锟絗 / 榛戣彵褰贡鐮佺殑闂銆?
- 鏍瑰洜纭锛?
  - Python 绔?`funasr_client.py` 鍘熷厛閫氳繃 `json.dumps(..., ensure_ascii=False) + sys.stdout.write(...)` 杈撳嚭 JSON锛學indows 涓?stdout 鍙兘璧?GBK/CP936銆?
  - Node 绔?`funasr-python.js` 鍘熷厛鐩存帴 `String(chunk || "")` 鎷兼帴 stdout/stderr锛屾寜 UTF-8 瑙ｇ爜 Buffer 鏃朵細鎶婇潪 UTF-8 瀛楄妭鏇挎崲鎴?`锟絗銆?
- 鏈疆淇锛?
  - `funasr_client.py` 鏀逛负閫氳繃 `sys.stdout.buffer.write(text.encode("utf-8"))` 杈撳嚭 UTF-8 JSON銆?
  - Node 瀛愯繘绋嬬幆澧冩樉寮忚拷鍔狅細
    - `PYTHONIOENCODING=utf-8`
    - `PYTHONUTF8=1`
  - Node 绔敼涓哄厛鏀堕泦 `Buffer`锛屽湪 `close` 鏃剁粺涓€ UTF-8 瑙ｇ爜 stdout/stderr銆?
  - Python 绔媺鍙?`transcription_url` 缁撴灉鏂囦欢鏃舵敼涓哄厛璇?raw bytes锛屽啀浼樺厛灏濊瘯 `utf-8-sig / utf-8`锛屽繀瑕佹椂鐢?`gb18030` 鍏滃簳瑙ｆ瀽 JSON銆?
  - 鏂板涔辩爜淇濇姢锛氬鏋?`heardText` 涓嚭鐜版槑鏄惧ぇ閲?`锟絗锛岀洿鎺ヨ繑鍥?`fun-asr-mojibake-text`锛屼笉鍐嶆妸涔辩爜缁х画浼犵粰 compare 妯″瀷鎴栫紦瀛樸€?
- `RULE_VERSION` 鍗囩骇涓?`data-baker-round-one-quality-ai-v4-utf8-funasr-fix`锛岀敤浜庤鏃т贡鐮佺粨鏋滃け鏁堛€?
- 鏂囨。鍚屾璇存槑锛?
  - Fun-ASR 閫氳繃 Python 瀛愯繘绋嬭皟鐢紝Windows 涓嬪繀椤荤ǔ瀹氫娇鐢?UTF-8銆?
  - 淇閮ㄧ讲鍚庨渶瑕侀噸鍚?`node platform-resources/backend/server.js`锛岄伩鍏嶆棫鍐呭瓨缂撳瓨缁х画鏄剧ず涔辩爜銆?
  - `qwen3.5-omni-plus` / `qwen3.5-omni-flash` 涓嶇粡杩?Python 瀛愯繘绋嬶紝鍥犳涓嶅彈璇ョ紪鐮侀棶棰樺奖鍝嶃€?

## 2026-05-20锛堟爣璐濇槗閲囦竴妫€璐ㄦ锛氬墠绔敼涓哄惉闊虫ā鍨?+ 姣旇緝妯″瀷锛屽悗绔寜鍚煶妯″瀷鑷姩閫夐摼璺級

- DataBaker ASR 璇煶 AI 璁剧疆椤靛彇娑堢敤鎴峰彲瑙?AI 妯″紡"锛屽彧淇濈暀涓や釜鏍稿績閰嶇疆锛?
  - 鍚煶妯″瀷锛歚fun-asr`銆乣qwen3.5-omni-plus`銆乣qwen3.5-omni-flash`
  - 姣旇緝妯″瀷锛歚qwen3.6-plus`銆乣qwen3.5-plus`銆乣qwen3.6-flash`銆乣qwen3.5-flash`
- 鍓嶇涓嶅啀璁╃敤鎴锋墜鍔ㄩ€夋嫨 `pipelineMode`锛涜繍琛屾椂缁熶竴鐢?`listenModel` 鎺ㄥ鍐呴儴閾捐矾锛?
  - `fun-asr` => `fun_asr_compare`
  - `qwen3.5-omni-plus` / `qwen3.5-omni-flash` => `qwen_omni_compare`
- options 椤甸潰鍒囨崲鍚煶妯″瀷鏃朵細鍗虫椂鍒锋柊璇存槑锛?
  - 閫夋嫨 `fun-asr` 鏃舵樉绀?Python SDK / `.venv` 鎻愮ず
  - 閫夋嫨 Qwen Omni 鍚煶妯″瀷鏃堕殣钘?Python 鎻愮ず
- 鍚庣鎭㈠骞跺浐瀹氫负"鍚煶闃舵 + 姣旇緝闃舵"鐨勪袱娈靛紡缂栨帓锛?
  - `fun-asr`锛氱粺涓€ AI 鍩哄骇 `providers/funasr-python.js` 璋?Python SDK 鎷垮埌 `heardText`锛屽啀璋冪敤 compare 妯″瀷鐢熸垚 `recommendedText`
  - `qwen3.5-omni-plus` / `qwen3.5-omni-flash`锛氱粺涓€ AI 鍩哄骇 `requestOmniInputAudio` 鍏堝仛鍚煶锛屽啀璋冪敤 compare 妯″瀷鐢熸垚 `recommendedText`
- `health/defaults` 鏂板 `listenModelOptions` 鍜?`compareModelOptions`锛沗supportedPipelineModes` 浠呬繚鐣欎负鍚庣鍏煎涓庢帓鏌ヤ俊鎭紝涓嶅啀浣滀负鍓嶇涓婚厤缃€?
- 鏂囨。鍙ｅ緞鍚屾鏇存柊锛?
  - 涓嶅啀瀵圭敤鎴锋毚闇?Omni 鍗曟ā鍨?/ Fun-ASR + 姣旇緝妯″瀷"妯″紡閫夋嫨
  - Fun-ASR 浠呭湪閫夋嫨 `fun-asr` 浣滀负鍚煶妯″瀷鏃朵緷璧?Python 铏氭嫙鐜
  - Qwen Omni 鍚煶妯″瀷涓嶄緷璧?Python 鐜

## 2026-05-20锛堢粺涓€鍚庣 Fun-ASR Python 鏂囦欢涓庝緷璧栨枃浠跺綊妗ｏ級

- Fun-ASR Python 杩愯鐜缁х画缁熶竴鏀舵暃鍒?`platform-resources/backend/`锛?
  - 铏氭嫙鐜锛歚platform-resources/backend/.venv/`
  - Python 鏂囦欢锛歚platform-resources/backend/funasr_client.py`
  - 渚濊禆鏂囦欢锛歚platform-resources/backend/requirements.txt`
- 鏃ф枃浠跺凡杩佺Щ锛屼笉鍐嶄綔涓哄綋鍓嶅彛寰勪娇鐢細
  - `platform-resources/data-baker/round-one-quality/backend/funasr_client.py`
  - `platform-resources/data-baker/round-one-quality/backend/requirements-funasr.txt`
- `ai-client-funasr.js` 鏀逛负璋冭捣 `platform-resources/backend/funasr_client.py`锛岀己澶辩幆澧冩彁绀轰篃鏀逛负鍦?`platform-resources/backend` 鐩綍涓垱寤?`.venv` 骞跺畨瑁?`requirements.txt`銆?
- 鏍?`README.md` 鐨勫懡浠ゅ悓姝ユ敼涓哄湪 `platform-resources/backend` 鐩綍涓墽琛岋細
  - `py -3 -m venv .venv`
  - `pip install -r requirements.txt`
  - `node server.js`
- 鏂囨。缁熶竴寮鸿皟锛?
  - Python 鍙槸 Node 鍚庣鍐呴儴杈呭姪杩涚▼
  - 涓嶅崟鐙惎鍔?Python 鏈嶅姟
  - 浠庨」鐩牴鐩綍涔熶粛鍙繍琛?`node platform-resources/backend/server.js`

## 2026-05-20锛堢粺涓€鍚庣 Fun-ASR 铏氭嫙鐜璇存槑绠€鍖栵級

- 鏍?`README.md` 鐨?Fun-ASR Python 鐜閮ㄧ讲娈靛凡绠€鍖栦负"鍑嗗缁熶竴 `.venv` + 缁х画鐢?Node 鍚姩缁熶竴鍚庣"鐨勬渶灏忎富娴佺▼銆?
- 涓绘祦绋嬪彧淇濈暀锛?
  - 鍒涘缓 `platform-resources/backend/.venv`
  - 瀹夎 `requirements-funasr.txt`
  - 杩愯 `node platform-resources/backend/server.js`
- `py_compile` 宸茬Щ鍒?鍙€夐獙璇?锛屼笉鍐嶆斁鍦ㄩ儴缃蹭富娴佺▼涓紝閬垮厤璇В涓哄繀椤婚澶栭儴缃叉垨鍚姩 Python 鏈嶅姟銆?
- 鏂囨。缁熶竴寮鸿皟锛?
  - Python 涓嶄綔涓虹嫭绔嬫湇鍔″惎鍔?
  - PM2 / systemd 鍙鐞?Node 鍚庣杩涚▼
  - 鍙湁 `fun_asr_compare` 渚濊禆 Python 铏氭嫙鐜
  - 榛樿 `omni_single` 涓嶄緷璧?Python 铏氭嫙鐜
- `platform-resources/backend/README.md`銆乣platform-resources/data-baker/round-one-quality/backend/README.md`銆乣platform-resources/data-baker/round-one-quality/README.md` 鏀舵暃涓虹煭鎻愮ず锛屼笉鍐嶉噸澶嶅畬鏁撮儴缃插懡浠ゃ€?

## 2026-05-20锛堢粺涓€鍚庣 Python 铏氭嫙鐜鍙ｅ緞淇锛?

- 缁熶竴 Python 铏氭嫙鐜鐩綍浠庢棫涓撶敤鐩綍杩佺Щ涓?`platform-resources/backend/.venv`銆?
- DataBaker `ai-client-funasr.js` 榛樿 Python 鏌ユ壘璺緞鍚屾鏀逛负锛?
  - Windows锛歚platform-resources/backend/.venv/Scripts/python.exe`
  - Linux/macOS锛歚platform-resources/backend/.venv/bin/python`
- Fun-ASR 缂哄け鐜鎻愮ず鍚屾鏀逛负瑕佹眰鍦?`platform-resources/backend/.venv` 鍒涘缓缁熶竴 Python 铏氭嫙鐜骞跺畨瑁?`requirements-funasr.txt`銆?
- 鏄庣‘缁熶竴鍚庣鏍囧噯鍚姩鍏ュ彛浠嶇劧鏄細
  - `node platform-resources/backend/server.js`
- 鏄庣‘ Python 鍙槸 Node 缁熶竴鍚庣鍐呴儴閫氳繃 `child_process` 璋冪敤鐨勮緟鍔╄繘绋嬶紝涓嶆槸鐙珛鍚庣鏈嶅姟锛屼笉闇€瑕佸崟鐙惎鍔?Python銆?
- DataBaker Fun-ASR 鐨?`requirements-funasr.txt` 浠嶄繚鐣欏湪妯″潡鐩綍锛屼絾瀹夎鐩爣鏀逛负缁熶竴 `.venv`銆?
- 鏂囨。鍚屾鏀舵暃锛?
  - 鏍?`README.md` 鏀逛负鍞竴璇︾粏閮ㄧ讲鍏ュ彛
  - `platform-resources/backend/README.md` 涓?DataBaker README 鏀逛负缁熶竴 `.venv` 鍙ｅ緞
  - `docs/platforms-index.md` 涓?`platform-resources/README.md` 琛ュ厖缁熶竴鍚姩/缁熶竴铏氭嫙鐜璇存槑
- `.gitignore` 鏂板蹇界暐 `platform-resources/backend/.venv/`锛屽苟淇濈暀鏃т笓鐢ㄧ洰褰曞拷鐣ラ」鍏煎鍘嗗彶閬楃暀鐩綍銆?

## 2026-05-20锛圱ask21鍔╂墜锛歩mage_b_texts_removed 鏀逛负澶氶噸闆嗙簿纭尮閰嶏級

- Task21 鍚庣 Prompt 鐗堟湰鍗囩骇涓?`abaka-task21-ai-v5-removed-text-multiset`銆?
- `image_b_texts_removed` 瑙勫垯杩涗竴姝ユ敹绱т负澶氶噸闆嗗垽鏂細
  - `T` = target removal text multiset
  - `B` = image_b 鍙鏂囨湰瀹炰緥澶氶噸闆?
  - `R` = image_b_removed 浠嶅彲璇绘枃鏈疄渚嬪閲嶉泦
  - `D = B - R`
- 鏂拌鍒欐槑纭細
  - `D == T` 鏃跺繀椤婚€夋嫨 `true`
  - `D` 涓虹┖鏃跺繀椤婚€夋嫨 `null`
  - `D` 闈炵┖涓?`D != T` 鏃跺繀椤婚€夋嫨 `specify`
- Prompt 鏂板骞跺己鍖栫殑璇垽绾︽潫锛?
  - 涓嶅緱鍥犱负"鏈夋枃鏈鍒?灏变竴寰?`specify`
  - 涓嶅緱鍥犱负"鐩爣鏂囨湰鍏ㄥ垹"灏变竴寰?`true`
  - `image_b_removed` 涓粛淇濈暀鐨勬枃鏈笉寰楀啓杩涘垹闄ゅ垪琛?
  - `Logo Variation` 涓嫢 `Logo` 淇濈暀銆佸彧鍒?`Variation`锛屽繀椤诲啓 `1 instance of Variation`
  - `MODERN<br>ABODE` 蹇呴』淇濈暀 `<br>`锛屼笉鑳芥敼鍐欐垚绌烘牸
  - 宸︿晶璇存槑/绾㈡鍙兘甯姪璇嗗埆 `T`锛屼笉鑳借鐩?`B/R/D` 鐨勫浘鐗囦簨瀹?
- 瑙嗚闃舵 Prompt 鏂板澶氶噸闆嗕笌閮ㄥ垎鍒犻櫎瑙傚療瑕佹眰锛?
  - `target_removal_text_candidates`
  - `image_b_visible_text_instances`
  - `image_b_removed_visible_text_instances`
  - `deleted_text_candidates`
  - `extra_deleted_text_candidates`
  - `partially_deleted_target_candidates`
- `ai-routes` 杈撳叆褰掍竴鍖栬皟鏁达細
  - `targetRemovalTextHints` 涓嶅啀鍘婚噸锛屼繚鐣欓噸澶嶉」锛屾敮鎸佹寜澶氶噸闆嗕紶鍏ョ洰鏍囨彁绀?
  - `normalizeRemovedLines` 缁х画淇濈暀 `all instances of xxx / 1 instance of xxx / N instances of xxx`
  - 缁х画鑷姩淇 `intance/intances` 涓庡崟澶嶆暟閿欒
- `data-collector` 鐨?`targetRemovalTextHints` 閲囬泦涓嶅啀鍘婚噸锛岄伩鍏嶄涪澶辩洰鏍囨枃鏈噸澶嶅疄渚嬩俊鎭€?
- 鏂囨。鍚屾鏇存柊锛?
  - `extension/sites/abaka-ai/task-page/README.md`
  - `platform-resources/abaka-ai/task21/README.md`
  - `platform-resources/abaka-ai/task21/page-structure.md`
  - `platform-resources/abaka-ai/README.md`
  - `platform-resources/README.md`
- 鏈疆涓嶄慨鏀?`manifest.json`锛屼笉鐢熸垚 CRX锛屼笉鏂板渚濊禆锛屼笉鑷姩淇濆瓨/鎻愪氦/閫佸銆?

## 2026-05-20锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛欰I 妯″紡鍒囨崲鍗虫椂鏄剧ず + Fun-ASR 閮ㄧ讲鏂囨。琛ラ綈锛?

- 淇 DataBaker ASR 璇煶 AI 璁剧疆椤碉細鍒囨崲 `AI 妯″紡` 鍚庯紝妯″瀷鍖哄煙浼氱珛鍗虫寜褰撳墠 select 鍊兼樉绀烘垨闅愯棌锛屼笉闇€瑕佸厛淇濆瓨銆?
- 鏈 change 浜嬩欢鍙洿鏂板綋鍓?options 椤甸潰 UI锛屼笉浼氭彁鍓嶅啓鍏?`chrome.storage`銆?
- `omni_single` 涓嬩細绔嬪嵆闅愯棌锛?
  - Fun-ASR 妯″瀷
  - Fun-ASR Python SDK 鎻愮ず
  - 姣旇緝妯″瀷
  - 鎵€鏈夋ā鍨嬭嚜瀹氫箟杈撳叆
- `fun_asr_compare` 涓嬩細绔嬪嵆鏄剧ず锛?
  - 鍥哄畾 `fun-asr` 妯″瀷
  - Fun-ASR Python SDK 鎻愮ず
  - 鍥涢€変竴姣旇緝妯″瀷涓嬫媺
  - 浠嶇户缁殣钘忔墍鏈夋ā鍨嬭嚜瀹氫箟杈撳叆
- DataBaker 鏂板椤甸潰鎬佽緟鍔╁嚱鏁帮紝鍒囨崲鏃朵紭鍏堣鍙栧綋鍓嶈〃鍗?select 鍊硷紝涓嶅洖璇绘棫 `settings/chrome.storage`銆?
- 琛ラ綈 Fun-ASR Python 鐜閮ㄧ讲鏂囨。锛?
  - Windows 鏈湴鍒涘缓铏氭嫙鐜
  - Linux 鏈嶅姟鍣ㄥ垱寤鸿櫄鎷熺幆澧?
  - `DATABAKER_FUNASR_PYTHON_BIN` 涓庣浉鍏崇幆澧冨彉閲?
  - 瀹夎渚濊禆鍚庨噸鍚粺涓€鍚庣
  - `health/defaults` 楠岃瘉姝ラ
  - `403` 甯歌鍘熷洜涓庝复鏃跺垏鍥?`omni_single` 鐨勬柟妗?

## 2026-05-20锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛欶un-ASR 閮ㄧ讲鍏ュ彛涓婄Щ鍒版牴 README锛?

- DataBaker Fun-ASR Python 铏氭嫙鐜榛樿璺緞鏀逛负缁熶竴鍚庣鐩綍锛屽綊鍒?`platform-resources/backend` 绠＄悊銆?
- `ai-client-funasr.js` 榛樿鏌ユ壘璺緞鍚屾鏀逛负锛?
  - Windows锛歚platform-resources/backend/.venv/Scripts/python.exe`
  - Linux/macOS锛歚platform-resources/backend/.venv/bin/python`
- 鏈樉寮忚缃?`DATABAKER_FUNASR_PYTHON_BIN` 涓旈粯璁よ矾寰勭己澶辨椂锛岄敊璇彁绀烘敼涓鸿姹傚湪缁熶竴 `.venv` 涓垱寤鸿櫄鎷熺幆澧冨苟瀹夎 `requirements-funasr.txt`銆?
- 鏍圭洰褰?`README.md` 鏂板椤圭洰绾?Fun-ASR Python 鐜閮ㄧ讲"瀹屾暣娴佺▼锛屽寘鍚細
  - 閫傜敤鍦烘櫙
  - Windows 鏈湴鍛戒护
  - Linux 鏈嶅姟鍣ㄥ懡浠?
  - 鐜鍙橀噺绀轰緥
  - 鍚庣閲嶅惎鏂瑰紡
  - `health/defaults` 楠岃瘉姝ラ
  - Fun-ASR `403` 甯歌鍘熷洜涓庝复鏃跺垏鍥?`omni_single` 鐨勫缓璁?
- `platform-resources/backend/README.md`銆乣platform-resources/data-baker/round-one-quality/backend/README.md`銆乣platform-resources/data-baker/round-one-quality/README.md` 涓庢墿灞曚晶 README 鏀舵暃涓虹煭鎻愮ず锛屼笉鍐嶉噸澶嶆暣濂楁湇鍔″櫒閮ㄧ讲闀挎祦绋嬨€?
- `.gitignore` 鏂板缁熶竴 Python 铏氭嫙鐜蹇界暐椤癸紱鏃ц矾寰勫拷鐣ラ」淇濈暀锛屽吋瀹规湰鍦板巻鍙查仐鐣欒櫄鎷熺幆澧冦€?

## 2026-05-20锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛欴ataBaker AI 妯″紡璁剧疆椤垫ā鍨嬫樉绀烘敹鏁涳級

- 淇 鏍囪礉鏄撻噰涓€妫€璐ㄦ ASR 璇煶 AI 璁剧疆椤垫ā鍨嬪睍绀洪€昏緫锛屼娇鍏朵笌瀹為檯鍚庣妯″紡涓ユ牸涓€鑷淬€?
- `omni_single` 鐜板湪鏄缃〉榛樿妯″紡锛涘垏鎹㈠埌璇ユā寮忔椂锛屽彧鏄剧ず AI 妯″紡閫夋嫨妗嗕笌閫氱敤 AI 鍙傛暟锛屼笉鍐嶆樉绀猴細
  - Fun-ASR 妯″瀷
  - Fun-ASR 妯″瀷鑷畾涔?
  - 姣旇緝妯″瀷
  - 姣旇緝妯″瀷鑷畾涔?
  - Fun-ASR Python SDK 鎻愮ず
- `fun_asr_compare` 妯″紡涓嬶細
  - Fun-ASR 妯″瀷鍥哄畾涓?`fun-asr`
  - 涓嶅厑璁歌嚜瀹氫箟 Fun-ASR 妯″瀷
  - 姣旇緝妯″瀷鍙厑璁?`qwen3.6-plus`銆乣qwen3.5-plus`銆乣qwen3.6-flash`銆乣qwen3.5-flash`
  - 榛樿姣旇緝妯″瀷涓?`qwen3.5-plus`
  - 鏃ч厤缃嫢钀藉湪涓婅堪 4 涓箣澶栵紝浼氳嚜鍔ㄨ縼绉讳负 `qwen3.5-plus`
- 淇 DataBaker 璁剧疆椤靛巻鍙叉畫鐣欑殑 `[object Object]` 椋庨櫓锛?
  - 甯搁噺灞傛柊澧?DataBaker 涓撶敤姣旇緝妯″瀷閫夐」鏁扮粍
  - options / storage / content 瀵瑰璞″€笺€佺┖鍊笺€乣[object Object]`銆侀潪娉曟棫鍊肩粺涓€鍋氬畨鍏ㄥ綊涓€
- DataBaker 淇濆瓨閫昏緫鏀舵暃锛?
  - `omni_single` 淇濆瓨鏃朵笉鍐嶅啓鍏ユ棤鎰忎箟鐨?compare model override
  - `fun_asr_compare` 淇濆瓨鏃?`listenModel` 鍥哄畾涓?`fun-asr`
  - `fun_asr_compare` 淇濆瓨鏃?`compareModel` 鍙厑璁稿洓閫変竴
- DataBaker 杩愯鏃惰姹備綋鍚屾鏀舵暃锛?
  - `omni_single` 涓嶅啀鎶?compare model 浣滀负瀹為檯璋冪敤渚濇嵁
  - `fun_asr_compare` 杩愯鏃跺浐瀹?`listenModel=fun-asr`

## 2026-05-20锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛氭仮澶?Omni 榛樿骞舵敼鐢?Python Fun-ASR 瀹㈡埛绔級

- 鏍囪礉鏄撻噰涓€妫€璐ㄦ AI 榛樿妯″紡鎭㈠涓?`omni_single`锛屽墠绔?options 涓庡悗绔?defaults 缁熶竴鏀逛负榛樿灞曠ず `Omni 鍗曟ā鍨嬶紙榛樿锛塦銆?
- 淇 ASR 璇煶 AI 璁剧疆涓殑"鍚煶妯″瀷"涓嬫媺鏄剧ず `[object Object]`锛?
  - options 渚фā鍨嬮€夐」娓叉煋鏀逛负鍚屾椂鍏煎瀛楃涓叉暟缁勫拰 `{ value, label }` 瀵硅薄鏁扮粍銆?
  - DataBaker 妯″紡鍒囨崲鏃舵敼涓烘寜 `omni_single / fun_asr_compare` 鍒嗗埆灞曠ず瀵瑰簲妯″瀷瀛楁銆?
- DataBaker 鍓嶇妯″紡鍙繚鐣欙細
  - `omni_single`锛氶粯璁わ紝璋冪敤 `ai-client-qwen.js`
  - `fun_asr_compare`锛氳皟鐢?Python Fun-ASR 瀹㈡埛绔紝鍐嶈皟鐢?compare 妯″瀷
- Fun-ASR 涓嶅啀鐢?Node 鎵嬪啓 REST 鐩存帴璋冪敤锛?
  - 鏂板 `platform-resources/data-baker/round-one-quality/backend/funasr_client.py`
  - 鏂板 `platform-resources/data-baker/round-one-quality/backend/requirements-funasr.txt`
  - `ai-client-funasr.js` 鏀逛负 Node wrapper锛岄€氳繃 `child_process` 璋冪敤 Python SDK 鑴氭湰
  - Python 鑴氭湰鍙粠鐜鍙橀噺璇诲彇 `DASHSCOPE_API_KEY`锛屼笉鎶?API Key 鏆撮湶鍒板懡浠よ鍙傛暟
- Fun-ASR Python 铏氭嫙鐜鏀逛负缁熶竴澶嶇敤鍚庣 `.venv`锛屽苟蹇界暐 `__pycache__` 绛夎繍琛屼骇鐗╋紝涓嶆彁浜?Git銆?
- 鍚庣閾捐矾鏄庣‘鍒嗙锛?
  - `pipelineMode=omni_single`锛氬彧璧?`requestOmniSingle`
  - `pipelineMode=fun_asr_compare`锛氬彧璧?`requestFunAsrRecognition -> requestCompare`
  - 鍘嗗彶 `two_stage / qwen_omni_two_stage / listen_only` 鍙吋瀹硅縼绉讳负 `omni_single`锛屼笉鍐嶄繚鐣欐棫鎵ц閫昏緫
- Fun-ASR 鍙嬪ソ閿欒澧炲己锛?
  - Python 鐜缂哄け鏃惰繑鍥炵粺涓€ `.venv` 缂哄け鎻愮ず锛岃姹傚厛瀹夎 `requirements-funasr.txt`
  - `403` 鏃舵彁绀哄彲鑳芥槸 DashScope 鏉冮檺/鍦板煙銆丄PI Key 鏉冮檺鎴栧钩鍙?`audioUrl` 瀵规湇鍔＄涓嶅彲璁块棶锛屽苟寤鸿鍏堝垏鍥?`omni_single`
  - `fun-asr` 妯″瀷鍚嶉敊璇椂鏄庣‘鎻愮ず蹇呴』浣跨敤灏忓啓 `fun-asr`
- 缁熶竴鍚庣 `health/defaults` 琛ュ厖 `funAsrPythonConfigured`锛屼究浜庡墠绔拰浜哄伐鎺掓煡 Python 鐜鏄惁灏辩华銆?
- 鍚屾鏇存柊锛?
  - `extension/sites/data-baker/round-one-quality/README.md`
  - `platform-resources/data-baker/round-one-quality/README.md`
  - `platform-resources/data-baker/round-one-quality/backend/README.md`
  - `platform-resources/backend/README.md`
  - `config/env/ai.env.example`
  - `.gitignore`

## 2026-05-20锛堟爣璐濇槗閲囦竴妫€璐ㄦ锛欰I 妯″紡鏀舵暃涓?Fun-ASR + Omni 鍗曟ā鍨嬶級

- 鏍囪礉鏄撻噰涓€妫€璐ㄦ AI 鎺ㄨ崘鏋舵瀯鏀舵暃涓轰粎淇濈暀涓ょ妯″紡锛?
  - `fun_asr_compare`锛氶粯璁ゆ壒閲忔ā寮忥紝鍏堣蛋 Fun-ASR 褰曢煶鏂囦欢璇嗗埆锛屽啀璧?compare 鏂囨湰妯″瀷銆?
  - `omni_single`锛氶珮璐ㄩ噺鍏滃簳妯″紡锛屽崟娆?Qwen Omni 璇锋眰鍚屾椂瀹屾垚鍚煶銆佹瘮瀵逛笌鎺ㄨ崘銆?
- 鍒犻櫎鏃ц繍琛屽彛寰勶細
  - `qwen_omni_two_stage`
  - `two_stage`
  - `listen_only`
- 鍘嗗彶鐜鍙橀噺鎴栧墠绔棫閰嶇疆鑻ヤ粛浼犱互涓婃棫鍊硷紝鍚庣鍙仛鍏煎杩佺Щ鍒?`omni_single`锛屽苟鍦?`health/defaults` 涓庢棩蹇椾腑缁欏嚭 deprecated 鎻愮ず锛涗笉鍐嶄繚鐣欐棫鎵ц鍒嗘敮銆?
- 鏂板 Fun-ASR 涓撶敤瀹㈡埛绔細鎸夐樋閲屼簯鐧剧偧褰曢煶鏂囦欢璇嗗埆寮傛浠诲姟鎻愪氦/杞/缁撴灉鑾峰彇閾捐矾瀹炵幇锛屼笉鍐嶆妸 Fun-ASR 褰撴垚 OpenAI-compatible chat 妯″瀷璋冪敤銆?
- 鏂板 Omni 鍗曟ā鍨嬮摼璺細`omni_single` 鍙彂璧蜂竴娆?Qwen Omni `input_audio` 璇锋眰锛屼笉鍐嶉澶栬皟鐢?compare 妯″瀷銆?
- 鏂板 provider/model group 绾х粺涓€鍚庣闄愭祦闃熷垪锛?
  - `qwen_omni` 榛樿 `45 RPM`
  - `fun_asr` 榛樿 `500 RPM`
  - `text_compare` 榛樿 `500 RPM`
  - 闃熷垪鏀寔鏈€澶ч暱搴︿繚鎶ゃ€乣429` 鎸囨暟閫€閬?+ jitter 閲嶈瘯銆乭ealth/defaults 闃熷垪蹇収銆?
- 鏂板鎺ㄨ崘缁撴灉鍐呭瓨 TTL 缂撳瓨锛?
  - key 浣跨敤 sha256
  - 涓嶄繚瀛樺畬鏁?`audioUrl`
  - 榛樿 TTL `12 灏忔椂`
  - health/defaults 鍙煡鐪?cache hit/miss 鎽樿
- 鏍囪礉鏄撻噰鍓嶇閰嶇疆璋冩暣锛?
  - options 涓?AI 妯″紡鍙樉绀?`fun_asr_compare` 涓?`omni_single`
  - 榛樿妯″紡鏀逛负 `fun_asr_compare`
  - AI 杩炵画濉叆榛樿骞跺彂浠?`50` 涓嬭皟鍒?`5`
  - 骞跺彂鏈€澶у€煎缓璁笅璋冨埌 `10`
  - 椤堕儴鎮诞绐椾笌閿欒鎻愮ず鏂板"AI 鎺掗槦 / 闄愭祦閲嶈瘯 / AI 鍒嗘瀽澶辫触"绛夊弸濂界姸鎬?
- 鍚庣涓庢枃妗ｇ粺涓€寮鸿皟锛?
  - `429` 鏍瑰洜鏄笂娓告ā鍨嬫垨璐﹀彿缁村害闄愭祦锛屼笉鏄?`2 鏍?2G` 鏈嶅姟鍣ㄧ畻鍔涢棶棰?
  - 澶氫釜 RAM 鐢ㄦ埛鎴?API Key 鑻ュ綊灞炰簬鍚屼竴闃块噷浜戜富璐﹀彿锛屼篃鍙兘鍏变韩闄愭祦棰濆害
  - Fun-ASR 鐪熷疄鍙敤鎬т粛鍙栧喅浜庢ā鍨嬫湇鍔℃槸鍚﹁兘璁块棶骞冲彴 `audioUrl`
  - 娴忚鍣ㄤ笉鐩磋繛 DashScope锛屾墍鏈変笂娓歌姹傜粺涓€璧板悗绔?
- 鏇存柊鏂囨。涓庨厤缃細
  - `extension/sites/data-baker/round-one-quality/README.md`
  - `platform-resources/data-baker/round-one-quality/README.md`
  - `platform-resources/data-baker/round-one-quality/network.md`
  - `platform-resources/data-baker/round-one-quality/backend/README.md`
  - `platform-resources/backend/README.md`
  - `platform-resources/README.md`
  - `config/env/ai.env.example`

## 2026-05-19锛圱ask21鍔╂墜锛歩mage_b_texts_removed 鏀逛负 T/B/R/D 宸紓鍒ゆ柇锛?

- Task21 鍚庣 Prompt 鐗堟湰鍗囩骇涓?`abaka-task21-ai-v4-image-b-removed-diff`銆?
- `image_b_texts_removed` 瑙勫垯浠?绠€鍗曟壘娑堝け鏂囨湰"鍗囩骇涓哄洓闆嗗悎鍒ゆ柇锛?
  - `T` = target removal texts锛岀洰鏍囧垹闄ゆ枃鏈寖鍥达紝鍙綔杈呭姪
  - `B` = image_b 涓彲璇绘枃鏈疄渚?
  - `R` = image_b_removed 涓粛鍙鏂囨湰瀹炰緥
  - `D = B - R`
- 鏂拌鍒欐槑纭細
  - 鍒犻櫎鍙湅 `image_b` 涓?`image_b_removed`
  - `image_a` 涓嶅弬涓?`image_b_texts_removed` 鍒犻櫎鍒ゆ柇锛屽彧鐢ㄤ簬 `same_font`
  - `true` 鍙湪"鍙湁鐩爣鏂囨湰瀹屾暣鍒犻櫎涓旀棤棰濆澶氬垹"鏃舵垚绔?
  - `specify` 鐢ㄤ簬鐩爣鏂囨湰閮ㄥ垎鍒犻櫎銆侀澶栧鍒犻櫎鎴栭渶瑕佸垪鍑哄叿浣撳垹闄ら」
  - `null` 鐢ㄤ簬 `D` 涓虹┖
- Prompt 寮哄寲浜嗗瀹炰緥涓庢瘮杈冨彛寰勶細
  - case-insensitive
  - 鏅€氱┖鏍?鏅€氬瓧璺濆樊寮傚彲蹇界暐
  - line breaks / `<br>` 鏈夋剰涔夛紝涓嶈兘涓庢棤鎹㈣鏂囨湰鍚堝苟
  - `all instances of xxx / 1 instance of xxx / N instances of xxx` 涓哄敮涓€鍚堟硶鏍囧噯绛旀鏍煎紡
- 瑙嗚闃舵 Prompt 寮哄寲锛?
  - 蹇呴』瑙傚療 `target_removal_text_candidates`
  - `image_b_visible_text_instances`
  - `image_b_removed_visible_text_instances`
  - `deleted_text_candidates`
  - `extra_deleted_text_candidates`
  - 骞跺湪鎻愮ず涓姹傚敖閲忎綋鐜?`text/normalized_text/location/count/deleted_count/is_target_text/confidence`
- `ai-routes` 褰掍竴鍖栧寮猴細
  - `normalizeRemovedLines` 淇濈暀 `all instances of xxx`
  - 鑷姩淇 `intance/intances`
  - 鑷姩淇 `1 instances -> 1 instance`
  - 鑷姩淇 `2 instance -> 2 instances`
  - `choice=specify` 浣嗘棤鍚堟硶 lines 鏃惰嚜鍔ㄩ檷绾?`null`
- 鍓嶇 Task21 闈㈡澘淇濇寔鏍囧噯绛旀鍘熸牱灞曠ず涓庡鍒讹紝涓嶆敼鍐?`all instances of xxx`銆?
- 璋冭瘯淇℃伅鏂板 warnings 鎽樿锛屽悗绔嫾鍐欎慨姝ｄ細鍑虹幇鍦ㄦ姌鍙犺皟璇曚俊鎭腑锛屼笉浼氬杩涗富绛旀銆?
- `data-collector` 鏂板 `targetRemovalTextHints`锛屽綋鍓嶄粎瀹夊叏鎻愬彇椤甸潰宸叉湁 `image_b_texts_removed` 鏂囨湰浣滀负杈呭姪锛屼笉閲囬泦鏁忔劅 URL銆?
- 鏂囨。鍚屾鏇存柊锛?
  - `extension/sites/abaka-ai/task-page/README.md`
  - `platform-resources/abaka-ai/task21/README.md`
  - `platform-resources/abaka-ai/task21/page-structure.md`
  - `platform-resources/abaka-ai/README.md`
  - `platform-resources/README.md`
- 鏈疆涓嶄慨鏀?`manifest.json`锛屼笉鐢熸垚 CRX锛屼笉鏂板渚濊禆锛屼笉鑷姩淇濆瓨/鎻愪氦/閫佸銆?

## 2026-05-19锛圱ask21鍔╂墜鐑慨锛歁onaco data-uri 鍐欏叆涓庤繍琛屾椂鐗堟湰鏍囪瘑锛?

- 淇 Task21鍔╂墜鍦?`image_b_texts_removed=specify` 鍦烘櫙涓嬩粛鎻愮ず"宸查€夋嫨 specify锛屼絾鏈壘鍒拌緭鍏ユ"鐨勯棶棰樸€?
- 鏍瑰洜鎷嗗垎涓轰袱灞傦細
  - 鏃у畾浣嶇瓥鐣ヤ粛鍋忓悜"鎼滅储鏍?+ 鍏ㄥ眬鍊欓€?锛屾病鏈夊厛鍦ㄥ綋鍓?`.l-item` 鍐呯簿纭攣瀹?`image_b_texts_removed` 鐨?`custom-md-editor / Monaco`銆?
  - 鐢ㄦ埛椤甸潰浠嶅嚭鐜?`2500ms` 鎻愮ず锛岃鏄庢祻瑙堝櫒鍙兘浠嶅湪杩愯鏃х増 content script锛岀己灏戝彲瑙傛祴鐨勮繍琛屾椂鐗堟湰鏍囪瘑銆?
- `dom-actions` 鐑慨锛?
  - 鏂板 `findTask21FieldItemByTitle(fieldName)`锛氫紭鍏堥亶鍘?`.l-item`锛屽湪姣忎釜鍧楀唴绮剧‘鍖归厤 `.l-title-text`銆?
  - `image_b_texts_removed` 鐨勬煡鎵捐寖鍥存敼涓?褰撳墠 `.l-item` 鍐呯殑 `.custom-md-editor/.monaco-container/.monaco-editor/textarea.inputarea/.view-lines`"锛屼笉鍐嶈法瀛楁鎵惧叏灞€ Monaco銆?
  - `other_changes` 缁х画浣跨敤 Naive UI textarea锛坄textarea.n-input__textarea-el`锛夛紝涔熸敹绱у埌褰撳墠 `.l-item` 鍐呫€?
  - `isMonacoTextareaCandidate` 涓嶅啀鍥犱负 Monaco textarea 楂樺害灏忋€佽瑙夐殣钘忕瓑缁撴瀯鐗瑰緛璇垽銆?
  - `waitForFieldTextInput` 瀵?`image_b_texts_removed` 鏀逛负 `5000ms`銆乣80ms` 杞锛屽苟杩斿洖 `fieldItemFound/titleFound/customMdEditorFound/monacoContainerFound/monacoEditorFound/monacoDataUri/monacoTextareaFound/viewLinesFound/viewLinesPreview/candidateCount` 璇婃柇銆?
  - Monaco 鍐欏叆椤哄簭鏀逛负锛?
    - 浼樺厛 `.monaco-editor[data-uri]` -> `window.monaco.editor.getModels()` -> `model.setValue(text)`
    - 鍐嶅皾璇?editor instance 鍖归厤鍐欏叆
    - 鍐嶅皾璇?`execCommand("insertText")` + input 浜嬩欢閾?
    - 鏈€鍚庢墠璧?textarea fallback锛沠allback 鍙繑鍥?闇€浜哄伐纭"锛屼笉浼€犳ā鍨嬪凡鍚屾
  - 鏂板 Console 璋冭瘯鍏ュ彛锛?
    - `window.__ASCEdgeAbakaAiDomActions.debugFindFieldTextInput(fieldName)`
    - `window.__ASCEdgeAbakaAiDomActions.debugFillFieldText(fieldName, text)`
- `ai-panel` 鐑慨锛?
  - 鏂板 `TASK21_ASSISTANT_RUNTIME_VERSION = task21-assistant-fill-v2-20260519`
  - `image_b_texts_removed/other_changes` 鐨?`specify` 绛夊緟缁熶竴鏀逛负甯搁噺 `FIELD_INPUT_WAIT_MS=5000`
  - 璋冭瘯淇℃伅杩藉姞 `runtimeVersion` / `domActionsVersion`
  - 闈㈡澘鍓爣棰樺拰缁撴灉 meta 鏄剧ず杩愯鏃剁増鏈紝渚夸簬鍒ゆ柇褰撳墠椤甸潰鏄惁宸插姞杞芥柊鑴氭湰
  - `image_b_texts_removed` 鑻ュ凡鎵惧埌 Monaco 瀹瑰櫒浣嗘ā鍨嬪啓鍏ュけ璐ワ紝鎻愮ず鏀逛负"宸叉壘鍒?Monaco 缂栬緫鍣紝浣嗗啓鍏ユā鍨嬪け璐ワ細..."
- `content.js` 鍚姩鏃惰緭鍑猴細
  - `[ASC][Abaka AI] Task21 assistant runtime version: task21-assistant-fill-v2-20260519`
- 鏂囨。鍚屾鏇存柊锛?
  - `extension/sites/abaka-ai/task-page/README.md`
  - `platform-resources/abaka-ai/task21/README.md`
  - `platform-resources/abaka-ai/task21/page-structure.md`
- 鏈疆涓嶄慨鏀?`manifest.json`锛屼笉鐢熸垚 CRX锛屼笉鏂板渚濊禆锛屼笉鑷姩淇濆瓨/鎻愪氦/閫佸銆?

## 2026-05-19锛圱ask21鍔╂墜锛歅rompt 瑙勫垯鍗囩骇涓庣粨鏋滃綊涓€鍖栧寮猴級

- Task21 鍚庣 Prompt 鐗堟湰鍗囩骇涓?`abaka-task21-ai-v3-annotation-rules`锛屾寜鐢ㄦ埛 Word 瑙勫垯閲嶅啓娴佺▼銆乻ame_font銆乮mage_b_texts_removed銆乷ther_changes銆佺壒娈婂満鏅笌杈撳嚭鏍煎紡绾︽潫銆?
- same_font 鏂板 `error` 閫夐」锛屽苟绾︽潫 `same_font=false/unsure/error` 鏃跺悗缁瓧娈电粺涓€ `not_applicable`锛宍workflow.skip_later_fields=true`銆?
- 绉婚櫎鏃ц鍒欎腑"绂佹 all instances of xxx"鐨勯檺鍒讹紱`image_b_texts_removed` 褰掍竴鍖栫幇鏀寔锛?
  - `all instances of xxx`
  - `N instance of xxx`
  - `N instances of xxx`
- `normalizeRemovedLines` 缁х画鎷掔粷 bullet/缂栧彿/瑙ｉ噴琛岋紝淇濈暀鍙ュ熬娓呯悊涓庡崟澶嶆暟鑷姩淇锛堝 `1 instances` -> `1 instance`锛夈€?
- 寮哄寲 `other_changes` 鍙ｅ緞锛氬彧姣旇緝 `image_b_removed` 涓?`image_b`锛岀敤浜庢壙杞芥浛鎹㈣涓恒€佸浘鏂囬敊浣嶃€佸浘妗?甯冨眬/鐢昏川绛夐潪绾垹瀛楀彉鍖栥€?
- 鍓嶇 Task21 闈㈡澘鍏煎鏇存柊锛?
  - same_font 缁撴灉涓庡～鍐欐敮鎸?`error`銆?
  - image_b_texts_removed 鐨?`all instances of xxx` 灞曠ず涓庡鍒朵繚鎸佸師鏍枫€?
  - overall 濉啓鍦?same_font=error 鏃朵笌 false/unsure 涓€鏍峰仠姝㈠悗缁瓧娈靛～鍐欍€?
- 鏈涓嶆柊澧炴ā鍨嬪悕锛屼繚鎸?`qwen3.6-plus` 鍙ｅ緞锛涙湭鑳借仈缃戞牳瀵瑰畼鏂规枃妗ｃ€?

## 2026-05-19锛圱ask21鍔╂墜鐑慨锛歁onaco/Naive 杈撳叆鍖哄畾浣嶄笌瑙嗚妯″瀷榛樿鍙ｅ緞锛?

- 淇 Task21鍔╂墜"濉啓 AI 绛旀"鍦?`image_b_texts_removed=specify` 涓?`other_changes=specify` 涓嬩粛鎻愮ず鎵句笉鍒拌緭鍏ユ鐨勯棶棰樸€?
- 鏍瑰洜鏄緭鍏ュ尯瀹氫綅浠嶅亸鍚?radio 瀹瑰櫒锛屾湭绋冲畾瑕嗙洊瀛楁瀹屾暣瀹瑰櫒涓庡垎绂绘覆鏌撶殑杈撳叆鍖猴紙`custom-md-editor/monaco-editor` 涓?`n-input__textarea-el`锛夈€?
- `dom-actions` 鐑慨锛?
  - 寮哄寲瀛楁鏍囬瀹氫綅锛氫紭鍏?`.l-title-text`锛屽苟杩囨护 AI 闈㈡澘鑺傜偣锛岄檷浣庡悓鍚嶆枃鏈鍛戒腑銆?
  - 鏂板瀛楁鎼滅储鏍逛笌鑼冨洿鎺у埗锛氫紭鍏堝畬鏁村瓧娈靛潡骞跺湪鏍囬鍚庢湁闄愬尯鍩熸煡鎵撅紝閬垮厤涓插～鐩搁偦瀛楁銆?
  - `findFieldTextInput` 琛ラ綈浼樺厛绾э細Naive UI textarea -> Monaco inputarea -> 閫氱敤 textarea/input/contenteditable銆?
  - `waitForFieldTextInput` 榛樿绛夊緟鎻愬崌鍒?`4000ms`锛岃秴鏃惰繑鍥炵粨鏋勫寲璇婃柇锛堟爣棰?瀹瑰櫒/custom-md/monaco/inputarea/naive/candidateCount锛夈€?
  - Monaco 鍐欏叆鏀逛负澶氱瓥鐣ワ細Monaco API -> `execCommand` 杈撳叆 -> `textarea` fallback锛坒allback 缁欏嚭浜哄伐纭鎻愮ず锛夈€?
- `ai-panel` 鐑慨锛?
  - `specify` 娴佺▼鏀逛负鍏堢瓑寰呰緭鍏ユ锛坄4000ms`锛夊啀鍐欏叆銆?
  - 澶辫触鎻愮ず鎼哄甫璇婃柇缁嗚妭锛屼笉鍐嶅彧鏄剧ず绗肩粺"鏈壘鍒拌緭鍏ユ"銆?
  - 瀵?fallback 璀﹀憡鍦ㄩ潰鏉跨姸鎬佷腑鏄剧ず"闇€瑕佷汉宸ョ‘璁?銆?
- 瑙嗚妯″瀷榛樿鍙ｅ緞琛ュ己锛?
  - 鍓嶅悗绔笌瀛樺偍渚х户缁娇鐢?`qwen3.6-plus` 浣滀负榛樿瑙嗚妯″瀷銆?
  - `qwen3.6plus`銆乣qwen-vl-*-latest` 绛夊巻鍙插啓娉曠粺涓€鍋氬綊涓€锛堝惈澶у皬鍐欏吋瀹癸級鍚庡啀钀介厤缃€?
  - storage 渚фā鍨嬪綊涓€鏂板鍊欓€夋牎楠岋紝闈炴硶鍊煎洖閫€鍒板厑璁稿垪琛ㄩ粯璁ゅ€硷紙瑙嗚榛樿 `qwen3.6-plus`锛夈€?
- 瀹夊叏杈圭晫淇濇寔涓嶅彉锛氫粎鐢ㄦ埛鐐瑰嚮"濉啓 AI 绛旀"鎵嶅啓鍏ワ紱涓嶈嚜鍔ㄤ繚瀛樸€佷笉鑷姩鎻愪氦銆佷笉鑷姩閫佸銆佷笉鐐?checkbox銆?

## 2026-05-19锛圱ask21鍔╂墜锛歴pecify 杈撳叆鍖哄啓鍏ュ吋瀹逛慨澶嶏級

- 淇 Task21鍔╂墜"濉啓 AI 绛旀"鍦?`image_b_texts_removed` / `other_changes` 鍦烘櫙涓嬫棤娉曞啓鍏ョ殑闂銆?
- 鏍瑰洜鏄棫閫昏緫鍙湪 radio 瀹瑰櫒鍐呮壘杈撳叆妗嗭紝鏈鐩栧瓧娈靛畬鏁?`.l-item`銆乣.l-label`銆丮onaco/custom-md-editor 涓?Naive UI textarea 鐨勭湡瀹炵粨鏋勩€?
- `dom-actions` 澧炲己锛?
  - 鏂板瀹屾暣瀛楁瀹瑰櫒瀹氫綅涓庢爣绛惧鍣ㄦ敹闆嗭紙`l-title-text -> l-item -> l-label`锛夈€?
  - `findFieldTextInput` 鏂板澶氶€夋嫨鍣ㄤ紭鍏堢骇锛歚n-input__textarea-el`銆丮onaco `textarea.inputarea`銆佹櫘閫?textarea/input/contenteditable銆?
  - 鏀寔 `waitForFieldTextInput(fieldName, timeoutMs)`锛岀敤浜?radio 鍒囨崲鍚庣瓑寰呰緭鍏ュ尯娓叉煋銆?
  - `setTextValue` 澧炲己 Naive UI textarea 浜嬩欢閾撅紙`input/change/compositionend`锛変笌 Monaco 澶氱瓥鐣ュ啓鍏ワ紙Monaco API / execCommand / fallback锛夈€?
- `ai-panel` 澧炲己锛?
  - `specify` 閫夋嫨鍚庡厛绛夊緟杈撳叆妗嗭紙榛樿 2500ms锛夊啀濉€笺€?
  - 澶辫触鎻愮ず缁嗗寲涓?宸查€夋嫨 specify锛屼絾 2500ms 鍐呮湭鎵惧埌杈撳叆妗?鎴?鏂囨湰鍐欏叆澶辫触锛歺xx"銆?
- 瀹夊叏杈圭晫涓嶅彉锛欰I 浠呰緟鍔╋紝鍙湁鐢ㄦ埛鐐瑰嚮"濉啓 AI 绛旀"鎵嶅啓鍏ワ紱涓嶈嚜鍔ㄤ繚瀛樸€佷笉鑷姩鎻愪氦銆佷笉鑷姩閫佸銆佷笉鐐?checkbox銆?

## 2026-05-19锛圖ataBaker 涓€妫€瀵煎嚭涓婁紶鏀逛负绱鍚堝苟锛?

- 淇鏍囪礉鏄撻噰涓€妫€瀵煎嚭涓婁紶瑕嗙洊 `latest.csv` 鐨勯棶棰橈細鍚庣鏀逛负"璇诲彇宸叉湁 latest.csv + 鏈 CSV 鎸夊敮涓€閿悎骞跺悗鍥炲啓"銆?
- 鍞竴閿彛寰勫浐瀹氫负"鏂囨湰缂栧彿"浼樺厛涓旈粯璁わ紱浠呭綋鏂囨湰缂栧彿涓虹┖鏃舵墠浣跨敤鍏滃簳閿紙`鏂囦欢鍚?娈电紪鍙穈銆乣鏂囦欢鍚峘銆乣閲囬泦浜?鎵嬫満鍙?娈电紪鍙穈銆佺ǔ瀹?JSON锛夈€?
- 鏄庣‘ `taskId/taskIds` 浠呯敤浜庡厓淇℃伅銆佹棩蹇楀拰鎺掓煡锛屼笉鍙備笌鍞竴閿垽鏂紱涓嶄細鍥犱负浠诲姟ID涓嶅悓鑰屼繚鐣欑浉鍚屾枃鏈紪鍙风殑閲嶅琛屻€?
- 鏂板鏍囧噯 CSV 瑙ｆ瀽涓庡啓鍑猴紙鏀寔 UTF-8 BOM銆侀€楀彿銆佸弻寮曞彿銆佹崲琛岃浆涔夛級锛屽苟鍦ㄥ啓鍑烘椂褰掍竴鍖栨棫鍒楀悕 `鏈夋晥鏃堕暱(绉?` / `鏈夋晥鍚堟牸鏃堕暱` 涓?`鏈夋晥鏃堕暱`銆?
- `latest-raw.json` 鏀逛负鎸夋枃鏈紪鍙风瓑浠峰瓧娈典紭鍏堝悎骞讹紱rawRecords 鍚堝苟澶辫触涓嶄細闃绘柇 CSV 鍚堝苟锛屼細杩涘叆 warnings銆?
- 涓婁紶鍝嶅簲鏂板鍚堝苟缁熻锛歚incomingRowCount/existingRowCount/addedRowCount/updatedRowCount/unchangedRowCount/rowCount/taskIds`锛屽苟淇濈暀涓嬭浇鎺ュ彛涓嶅彉锛?
  - `GET/HEAD /api/data-baker/round-one-quality/export/download`
- `DATABAKER_ROUND_ONE_EXPORT_HISTORY=1` 鏃剁户缁繚瀛樻瘡娆?鍘熷涓婁紶 CSV + 鍘熷 rawRecords 鍘嗗彶鏂囦欢"锛屼笉淇濆瓨绱蹇収銆?

## 2026-05-18锛圱ask21鍔╂墜锛歎I 鏀舵暃銆佹墜鍔ㄥ～鍐欎笌瑙勫垯鍙ｅ緞淇锛?

- 灏?Abaka Task21 鑴氭湰鐢ㄦ埛鍙鍚嶇О缁熶竴涓?`Task21鍔╂墜`锛堣剼鏈簱鏍囩銆佺煭鏍囩銆佺姸鎬佹爣绛句笌璇存槑鏂囨鍚屾锛夈€?
- Options 鐨?Task21鍔╂墜璇︽儏椤垫柊澧?AI 璁剧疆闅愯棌鏈哄埗锛?
  - 榛樿闅愯棌 `analysisMode/visionModel/ocr/reasoning/single/thinking/timeout` 绛?AI 璋冭瘯瀛楁銆?
  - 鍦ㄨ鎯呴〉鏍囬杩炵画鐐瑰嚮 10 娆″悗鏄剧ず锛堜粎褰撳墠椤甸潰浼氳瘽鐢熸晥锛夈€?
  - 鏈В閿佹椂淇濆瓨涓嶄細閲嶇疆闅愯棌 AI 閰嶇疆锛屽凡瑙ｉ攣鏃舵墠璇诲彇骞朵繚瀛?AI 瀛楁鍊笺€?
- Task21 AI 鎮诞绐楅噸鏋勪负"缁撴灉浼樺厛"涓昏鍥撅細
  - 涓昏鍥句粎灞曠ず鎺ㄨ崘閫夋嫨銆佹爣鍑嗙瓟妗堛€佺悊鐢便€乣濉啓 AI 绛旀` 鎸夐挳銆?
  - 璋冭瘯淇℃伅涓庡師濮?JSON 鏀逛负鎶樺彔闅愯棌銆?
  - 鏂板鎷栧姩銆佸楂樿皟鏁淬€侀噸缃綅缃紱甯冨眬淇濆瓨鍦?`asc-abaka-task21-ai-panel-layout-v1`銆?
- 鏂板"濉啓 AI 绛旀"鎵ц閾捐矾锛堜粛淇濇寔鎵嬪姩瑙﹀彂锛夛細
  - 浠呭湪鐢ㄦ埛鐐瑰嚮鎸夐挳鏃跺啓鍏ラ〉闈㈠瓧娈点€?
  - 閫氳繃 `dom-actions` 鏂板 `fillFieldText/setTextValue` 鏀寔 textarea銆乼ext input銆乧ontenteditable銆?
  - 鍐欏叆鏃舵鏌?disabled/readOnly/aria-disabled锛屼娇鐢ㄥ師鐢?setter + `input/change` 浜嬩欢銆?
  - 涓嶈嚜鍔ㄤ繚瀛樸€佷笉鑷姩鎻愪氦銆佷笉鑷姩閫佸銆佷笉鐐瑰嚮 checkbox銆?
- 鍚庣 Task21 瑙勫垯涓庡綊涓€鍖栧姞寮猴細
  - `image_b_texts_removed` 寮哄埗鎸?`image_b` vs `image_b_removed` 鍙ｅ緞锛宍specify` 鏍囧噯绛旀浠呭厑璁?`N instance(s) of xxx`锛涢潪娉曡杩涘叆 warnings 骞惰繃婊ゃ€?
  - `other_changes` 寮哄埗鎸?`image_b_removed` vs `image_b` 鍙ｅ緞锛宍specify` 杈撳嚭鑻辨枃鐭彞銆?
  - 杈撳嚭鏂板 `choice` 瀛楁骞朵繚鎸佹棫 `value/value_type` 鍏煎銆?
- 妯″瀷榛樿鍊间繚鎸?`qwen3.6-plus`锛屽苟鍏煎璇～ `qwen3.6plus -> qwen3.6-plus`锛堝墠绔?鍚庣/瀛樺偍褰掍竴锛夈€?
- 鏈鏈兘鑱旂綉鏍稿瀹樻柟鏂囨。锛屼繚鐣欓」鐩綋鍓?`qwen3.6-plus` 鍙ｅ緞銆?

## 2026-05-18锛圠abelX ASR 涓嬭浇涓枃鏂囦欢鍚嶅搷搴斿ご寮傚父淇锛?

- 淇 LabelX 蹇垽涓庤浆鍐?`statistics/download?supplier=<渚涘簲鍟?` 鍦ㄤ腑鏂囦緵搴斿晢鏂囦欢鍚嶅満鏅笅瑙﹀彂 `Invalid character in header content ["Content-Disposition"]` 鐨勯棶棰樸€?
- 鍘熷洜鏄?`Content-Disposition` 鐨?`filename` 鍙傛暟鐩存帴浣跨敤浜嗕腑鏂囨枃浠跺悕锛孨ode HTTP Header 鏍￠獙浼氭嫆缁濋潪 ASCII 瀛楃銆?
- 淇鍚庝笅杞藉搷搴斿ご鏀逛负锛?
  - `filename` 浣跨敤 ASCII fallback 鏂囦欢鍚嶏紙鍘婚櫎 CR/LF銆佸弻寮曞彿銆佽矾寰勯潪娉曞瓧绗︿笌闈?ASCII锛夈€?
  - `filename*` 浣跨敤 RFC 5987 褰㈠紡 `UTF-8'' + encodeURIComponent(涓枃鏂囦欢鍚?`锛屼繚鐣欎腑鏂囦緵搴斿晢灞曠ず鍚嶃€?
- 淇濇寔鏃㈡湁閫昏緫涓嶅彉锛歴upplier 杩囨护瑙勫垯銆?04 涓嶅洖閫€鎬昏〃銆乣HEAD` 鏃?body銆乣Content-Length` 涓庡疄闄呭唴瀹逛竴鑷淬€?

## 2026-05-18锛圠abelX ASR 涓嬭浇 supplier 杩囨护涓庢椂闂存枃浠跺悕淇锛?

- 淇 `alibaba-labelx/asr-judgement` 涓?`alibaba-labelx/asr-transcription` 鐨?`statistics/download?supplier=<渚涘簲鍟?` 澶辨晥闂锛氫笉鍐嶅鐢ㄦ牴绾ф€昏〃鏂囦欢璺緞鍥炰紶锛岃€屾槸浠?`store.loadRows()` 鍐呭瓨鏁版嵁鎸変緵搴斿晢褰掍竴瑙勫垯杩囨护鍚庡姩鎬佺敓鎴?CSV 鍝嶅簲銆?
- 杩囨护瑙勫垯瀵归綈 `platform-resources/alibaba-labelx/supplier-utils.js`锛氭敮鎸佷腑鏂囦緵搴斿晢鍚嶏紙濡傛捣澶┿€佸笇灏旇礉澹炽€佹鐕婏級銆乻afeSupplier 浠ュ強鍙綊涓€鍚嶇О鍖归厤銆?
- 褰?`supplier` 闈炵┖浣嗘棤鍖归厤鏁版嵁鏃讹紝涓嬭浇鎺ュ彛鏀逛负杩斿洖 `404` JSON锛堜笉鍥為€€涓嬭浇鎬昏〃锛夈€?
- 涓哄揩鍒や笌杞啓涓嬭浇鎺ュ彛鏂板鏃堕棿鏂囦欢鍚嶏紙Asia/Shanghai锛宍YYYYMMDD-HHmm`锛夛紝骞跺悓鏃惰緭鍑?`filename` 涓?`filename*=UTF-8''`锛?
  - 鎬昏〃锛歚asr-judgement-statistics-merged-YYYYMMDD-HHmm.csv`銆乣asr-transcription-statistics-merged-YYYYMMDD-HHmm.csv`
  - 渚涘簲鍟嗭細`asr-judgement-<safeSupplier>-statistics-YYYYMMDD-HHmm.csv`銆乣asr-transcription-<safeSupplier>-statistics-YYYYMMDD-HHmm.csv`
- `HEAD /download` 渚涘簲鍟嗘ā寮忎笌鎬昏〃妯″紡閮戒繚鎸佹棤 body锛屼笖 `Content-Length` 涓庡搴?`GET` 涓€鑷淬€?
- 鏈疆鏈仮澶?`statistics-data/suppliers/<渚涘簲鍟?/statistics-merged.csv` 鍐欑洏锛屼笉鏂板渚濊禆锛屼笉鏀瑰墠绔墿灞曢€昏緫銆?

## 2026-05-18锛堝彂甯?v0.3.3锛?

- 鎻愬崌 `extension/manifest.json` 鐗堟湰鍒?`0.3.3`銆?
- 鍙戝竷 CRX 涓変欢濂楋細
  - `dist/annotation-script-center-v0.3.3.crx`
  - `dist/annotation-script-center-update.xml`
  - `dist/annotation-script-center-crx-latest.json`
- DataBaker 涓€妫€璐ㄦ鏂板/瀹屽杽 AI 杩炵画濉叆鍚堟牸椤癸細
  - 榛樿 `50` 骞跺彂璇锋眰 AI 鎺ㄨ崘銆?
  - AI 缁撴灉鎸夎繑鍥為『搴忚繘鍏ラ槦鍒楀苟涓茶濉叆銆?
  - 椤堕儴缁熻鎮诞绐楁樉绀鸿繘搴︺€佸け璐ヨ褰曞拰閲嶈瘯濉叆鍏ュ彛銆?
  - 涓嶈嚜鍔ㄤ繚瀛樸€佷笉鑷姩鎻愪氦銆佷笉鐐瑰嚮 checkbox銆?
- Abaka AI Task21 澧炲己蹇嵎閿笌 AI 鍒嗘瀽璋冭瘯鑳藉姏銆?
- LabelX / DataBaker CSV 缁熶竴"鏈夋晥鏃堕暱"瀛楁銆?
- 琛ュ厖椤圭洰绾ц嚜鍔ㄥ寲瀹夊叏瑙勫垯銆?
- 鏈疆鏈彁浜よ繍琛屾暟鎹€佸瘑閽ャ€乼oken銆乧ookie銆丆RX 绉侀挜銆?

## 2026-05-18锛圤ptions 棣栭〉鍝佺墝鍥炬敼涓鸿儗鏅級

- 灏?Options 棣栭〉 `options-hero.svg` 浠庣嫭绔嬫í骞呰皟鏁翠负 hero 鏉垮潡鑳屾櫙瑙嗚銆?
- 淇濈暀鎵╁睍鍥炬爣銆乸opup logo銆乷ptions 鍝佺墝璧勬簮璺緞銆?
- 鍒犻櫎鏈湴涓存椂璧勬簮鐩綍 `_incoming_visual_assets`锛屼笉浣滀负姝ｅ紡璧勬簮鎻愪氦銆?
- 鏈慨鏀瑰钩鍙?content script銆佸悗绔帴鍙ｃ€佷笟鍔￠€昏緫銆?
- 鏈彁鍗囩増鏈紝鏈敓鎴?CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-18锛堟墿灞曞搧鐗屽浘鏍囦笌棣栭〉妯箙锛?

- 鏂板鎵╁睍鍥炬爣璧勬簮锛屽苟鍦?`extension/manifest.json` 鐨?`icons` 涓?`action.default_icon` 涓惎鐢ㄣ€?
- popup 鏍囬鍖哄姞鍏ュ搧鐗?logo锛坄asc-logo.svg`锛夈€?
- options 棣栭〉 hero 鍖哄姞鍏ュ搧鐗屾í骞咃紙`options-hero.svg`锛夈€?
- 鏈慨鏀瑰钩鍙?content script銆佸悗绔帴鍙ｃ€佷笟鍔￠€昏緫銆?
- 鏈彁鍗囩増鏈紝鏈敓鎴?CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-18锛圖ataBaker锛欰I 杩斿洖椤哄簭濉叆涓庨《閮ㄧ粺璁℃偓娴獥锛?

- AI杩炵画濉叆鍚堟牸椤规敼涓烘寜 AI 杩斿洖椤哄簭娑堣垂缁撴灉闃熷垪骞朵覆琛屽～鍏ワ紝涓嶅啀鎸夊乏渚у垪琛ㄩ『搴忛樆濉炵瓑寰呫€?
- 榛樿骞跺彂鏁颁繚鎸?`50`锛屽綋鍓嶉〉鍚堟牸椤瑰厛骞跺彂璇锋眰锛岃繑鍥炵粨鏋滆繘鍏ョ紦鍐查槦鍒椼€?
- 鏂板椤堕儴缁熻鎮诞绐楋細杩愯涓睍绀?AI 杩斿洖銆佸緟濉槦鍒椼€佸～鍏ユ垚鍔?澶辫触/璺宠繃绛夌粺璁°€?
- 缁撴潫鍚庢偓娴獥淇濈暀绾?30 绉掞紱澶辫触鍒楄〃灞曠ず濉叆澶辫触鏉＄洰銆?
- 鏂板"閲嶆柊濉啓澶辫触鍐呭"鎸夐挳锛氫粎澶嶇敤宸叉湁鎺ㄨ崘鏂囨湰閲嶈瘯濉叆澶辫触椤癸紝涓嶉噸鏂拌姹?AI銆?
- 淇濇寔杈圭晫锛氫笉鑷姩淇濆瓨銆佷笉鑷姩鎻愪氦銆佷笉鐐瑰嚮 checkbox銆?
- 鏈柊澧炲悗绔帴鍙ｏ紝鏈彁鍗囩増鏈紝鏈敓鎴愬彂甯冧骇鐗┿€?

## 2026-05-18锛圖ataBaker锛氬苟鍙?AI 杩斿洖鍗崇紦鍐插苟椤哄簭濉叆锛?

- AI杩炵画濉叆鍚堟牸椤规敼涓虹敓浜ц€?娑堣垂鑰呰皟搴︼細骞跺彂 AI 璇锋眰浣滀负鐢熶骇鑰咃紝杩斿洖缁撴灉鍏堣繘鍏ョ紦鍐插尯锛涢〉闈㈠～鍏ヤ綔涓烘秷璐硅€呮寜鍒楄〃椤哄簭涓茶鎵ц銆?
- 褰撳墠椤靛悎鏍奸」榛樿骞跺彂鏁拌皟鏁翠负 `50`锛屼粛鍙湪 Options 璋冩暣涓?`1-50`銆?
- 濉叆娴佺▼涓嶅啀绛夊緟鍏ㄩ儴 AI 璇锋眰瀹屾垚锛屽彧瑕佸綋鍓嶉『搴忔墍闇€缁撴灉杩斿洖灏辩珛鍗冲紑濮嬪～鍏ワ紱鍚庤繑鍥炵粨鏋滅户缁暀鍦ㄧ紦鍐插尯绛夊緟椤哄簭娑堣垂銆?
- 杩愯涓啀娆＄偣鍑绘寜閽垨鎸?`Alt+Q` 鍙仠姝細涓嶅啀鍚姩鏂拌姹傦紝宸插彂璧疯姹傝嚜鐒剁粨鏉燂紝褰撳墠鏉″畬鎴愬悗鍋滄鍚庣画濉叆銆?
- 淇濇寔瀹夊叏杈圭晫锛氫笉璺ㄩ〉銆佷笉鑷姩淇濆瓨銆佷笉鑷姩鎻愪氦銆佷笉鐐瑰嚮 checkbox銆佷笉澶勭悊涓嶅悎鏍?鏈川妫€銆?
- 鏈柊澧炲悗绔帴鍙ｏ紝鏈彁鍗囩増鏈紝鏈敓鎴愬彂甯冧骇鐗┿€?

## 2026-05-18锛圖ataBaker锛氬悎鏍奸」骞跺彂 AI 鍒嗘瀽鍚庨『搴忓～鍏ワ級

- "AI杩炵画濉叆鍚堟牸椤?鏀逛负鍏堝苟鍙戝垎鏋愬綋鍓嶉〉鍏ㄩ儴璐ㄦ鍚堟牸椤癸紝鍐嶆寜椤哄簭鍒囨崲骞跺～鍏ャ€?
- 鏂板骞跺彂鏁伴厤缃?`aiQualifiedAutofillConcurrency`锛岄粯璁?`5`锛岃寖鍥?`1-50`銆?
- 澧炲姞 `aiQualifiedAutofillWaitAllBeforeFill`锛堥粯璁?`true`锛夛紝鍏堢瓑寰呭叏閮?AI 鍒嗘瀽杩斿洖鍐嶈繘鍏ュ～鍏ラ樁娈点€?
- `Alt+Q` 缁х画浣滀负鍚姩/鍋滄锛涜繍琛屼腑鍐嶆瑙﹀彂浼氳姹傚仠姝€?
- 涓嶈法椤点€佷笉鑷姩淇濆瓨銆佷笉鑷姩鎻愪氦銆佷笉鐐瑰嚮 checkbox銆?
- 鏈柊澧炲悗绔帴鍙ｏ紝鏈彁鍗囩増鏈紝鏈敓鎴愬彂甯冧骇鐗┿€?

## 2026-05-18锛圖ataBaker锛氳繛缁?AI 濉叆璐ㄦ鍚堟牸椤癸級

- 灏?AI濉叆鍚堟牸椤?鍗囩骇涓?AI杩炵画濉叆鍚堟牸椤?銆?
- 褰撳墠椤靛唴鑷姩绛涢€?`statusName=璐ㄦ鍚堟牸` / DOM"涓€妫€鍚堟牸"鏁版嵁锛岄€愭潯鍒囨崲銆丄I 鎺ㄨ崘骞跺～鍏ャ€?
- `Alt+Q` 鏀寔鍚姩/鍋滄杩炵画澶勭悊锛涜繍琛屼腑鍐嶆瑙﹀彂浼氳姹傚仠姝紙褰撳墠鏉＄粨鏉熷悗涓嶅啀缁х画涓嬩竴鏉★級銆?
- 淇濇寔涓嶈法椤点€佷笉鑷姩淇濆瓨銆佷笉鑷姩鎻愪氦銆佷笉鐐瑰嚮 checkbox锛宍璐ㄦ涓嶅悎鏍糮 / `鏈川妫€` / 鐘舵€佹湭鐭ュ潎璺宠繃銆?
- 鏈柊澧炲悗绔帴鍙ｏ紝鏈彁鍗囩増鏈紝鏈敓鎴愬彂甯冧骇鐗┿€?

## 2026-05-18锛圖ataBaker锛欰I濉叆鍚堟牸椤规寕杞藉埌绛涢€夋爮骞跺姞蹇嵎閿級

- 灏?AI濉叆鍚堟牸椤?鎸夐挳鎸傝浇鍒板乏渚у垪琛ㄤ笂鏂?`filter-screen` 鍖哄煙銆?鎵归噺鍒ゅ畾"鍙充晶銆?
- 鏂板 `Alt+Q` 蹇嵎閿Е鍙?AI濉叆鍚堟牸椤广€?
- 淇濇寔鍙鐞?`statusName=璐ㄦ鍚堟牸`锛屼笉鑷姩淇濆瓨銆佷笉鑷姩鎻愪氦銆佷笉鐐瑰嚮 checkbox銆?
- 鏈柊澧炲悗绔帴鍙ｏ紝鏈彁鍗囩増鏈紝鏈敓鎴愬彂甯冧骇鐗┿€?

## 2026-05-18锛圓baka AI锛氳ˉ榻?Task 椤甸潰鍙閲囬泦澹宠祫鏂欑洰褰曪級

- 鏂板 `platform-resources/abaka-ai/task-page/README.md`锛岃ˉ榻愬彧璇婚噰闆嗗３璧勬枡鐩綍锛堥噰闆嗙洰鏍囥€丆onsole 瀵煎嚭鏂规硶銆佽劚鏁忚竟鐣屻€佸悗缁帴鍙ｆā鏉匡級銆?
- 鍚屾鏇存柊 `docs/platforms-index.md` 涓?`platform-resources/README.md` 绱㈠紩锛岀‘淇?Abaka AI Task 椤甸潰鍙閲囬泦璧勬枡鍙鐩存帴瀵艰埅銆?
- 鏈疆浠呮枃妗ｈˉ榻愶紝涓嶆柊澧炰笟鍔¤嚜鍔ㄥ寲鑳藉姏锛涙湭鎻愬崌鐗堟湰锛屾湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-18锛圖ataBaker锛欰I濉叆鍚堟牸椤逛綅缃笌鍒锋柊淇锛?

- 淇 `toPositiveNumber` 鏈畾涔夊鑷?AI濉叆鍚堟牸椤瑰け璐ョ殑闂銆?
- 灏?AI濉叆鍚堟牸椤规寜閽Щ鍔ㄥ埌椤堕儴浠诲姟淇℃伅鏍?鎶芥鍏佽閿欒鏁伴噺"鍙充晶鍖哄煙锛堝畾浣嶅け璐ユ椂鍥為€€鍒伴潰鏉垮唴锛夈€?
- 鐐瑰嚮鍚庡厛鍒锋柊褰撳墠椤?`queryCollectStatementByCondtion` 鏁版嵁锛屽啀绛涢€?`statusName=璐ㄦ鍚堟牸`銆?
- 姣忔鍙鐞嗗綋鍓嶉〉涓嬩竴鏉″悎鏍奸」锛屼笉鑷姩淇濆瓨銆佷笉鑷姩鎻愪氦銆?
- 鏈‖缂栫爜 token/cookie锛屾湭鏂板鍚庣鎺ュ彛锛屾湭鎻愬崌鐗堟湰锛屾湭鐢熸垚鍙戝竷浜х墿銆?

## 2026-05-18锛圖ataBaker锛欰I 鑷姩濉叆璐ㄦ鍚堟牸椤癸級

- 鏂板"AI濉叆鍚堟牸椤?鎸夐挳銆?
- 鐐瑰嚮鍚庡埛鏂板綋鍓嶉〉 `queryCollectStatementByCondtion` 鏁版嵁锛屽彧绛涢€?`statusName=璐ㄦ鍚堟牸`銆?
- 鑷姩閫変腑鍚堟牸鏉★紝璋冪敤鐜版湁 AI 鎺ㄨ崘骞跺～鍏ユ帹鑽愭枃鏈€?
- `璐ㄦ涓嶅悎鏍糮銆乣鏈川妫€` 涓嶅垎鏋愩€?
- 姣忔鍙鐞嗗綋鍓嶉〉涓嬩竴鏉″悎鏍奸」锛屼笉鑷姩淇濆瓨銆佷笉鑷姩鎻愪氦銆佷笉鎵归噺娴佽浆銆?
- 璇锋眰浣跨敤椤甸潰鐧诲綍鎬?`credentials: include`锛屼笉纭紪鐮?token/cookie銆?
- 鏈柊澧炲悗绔帴鍙ｏ紝鏈彁鍗囩増鏈紝鏈敓鎴愬彂甯冧骇鐗┿€?

## 2026-05-18锛圠abelX锛氭捣澶╀緵搴斿晢涓庡垽鏂?杞啓鍘嗗彶 CSV 鍒嗙被淇锛?

- 鏂板娴峰ぉ渚涘簲鍟嗚瘑鍒紝璐濆３浠诲姟鍚嶇粺涓€褰掍竴鍒板笇灏旇礉澹筹紱`supplier=H` 涓斾换鍔″悕鍚捣澶╄涔夋椂褰掍竴涓烘捣澶┿€?
- 鏂板 `platform-resources/alibaba-labelx/asr-project-kind.js`锛岄」鐩被鍨嬭瘑鍒紭鍏堢骇涓猴細`payload.project` / `payload.rawKeys.labelModel` > `taskName` > CSV schema > 棰樻暟鍏滃簳锛坄400` 浠呭巻鍙插厹搴曪級銆?
- 杞啓涓庡揩鍒ゅ悗绔兘澧炲姞楂樼疆淇￠槻涓茶〃鏍￠獙锛氬垽鏂暟鎹嫆缁濆啓鍏ヨ浆鍐欒〃锛岃浆鍐欐暟鎹嫆缁濆啓鍏ュ垽鏂〃锛屽苟閫氳繃 `rejectedItems` 杩斿洖鍘熷洜銆?
- 鏂板 `platform-resources/alibaba-labelx/backend/legacy-csv-repair.js`锛屽彲灏嗚鍏ヨ浆鍐欒〃鐨勫垽鏂暟鎹縼绉诲埌鍒ゆ柇琛ㄥ苟淇渚涘簲鍟嗭紝鏀寔 `--dry-run`銆乣--write`銆乣--backup`銆?
- 杩愯 CSV 淇浠呮湰鍦?鏈嶅姟鍣ㄦ墽琛岋紝涓嶆彁浜?`statistics-data/`锛涙湰杞湭鎻愬崌鐗堟湰锛屾湭鐢熸垚鍙戝竷浜х墿銆?

## 2026-05-18锛堝钩鍙?API 娓呭崟涓庢湁鏁堟椂闀垮瓧娈电粺涓€锛?

- `platform-resources/README.md` 鏂板"缁熶竴鍚庣 API 娓呭崟"锛屾寜妯″潡鍒楀嚭 method銆乸ath銆佹湰鍦?鏈嶅姟鍣?URL銆佷笅杞?URL 鍜岃繍琛屾暟鎹洰褰曘€?
- LabelX 蹇垽銆丩abelX 杞啓 CSV 琛ㄥご浠?`鏈夋晥鏃堕暱(绉?` 缁熶竴涓?`鏈夋晥鏃堕暱`锛屽苟鍏煎鏃ц〃澶磋鍙栥€?
- DataBaker 瀵煎嚭琛ㄥご浠?`鏈夋晥鍚堟牸鏃堕暱` 缁熶竴涓?`鏈夋晥鏃堕暱`锛屾暟鎹潵婧愪粛涓?`effectivePassTotalTime`銆?
- 鏈湴杩愯 CSV 鍙仛涓€娆℃€ц〃澶磋縼绉伙紝浣?`statistics-data/`銆乣export-data/`銆乣audit-data/` 涓嶆彁浜?Git銆?
- 鏈疆鏈敼涓氬姟璁＄畻閫昏緫銆佹湭鎻愬崌鐗堟湰銆佹湭鐢熸垚鍙戝竷浜х墿銆?

## 2026-05-18锛圕SV锛氱粺涓€鏈夋晥鏃堕暱瀛楁锛?

- LabelX 蹇垽涓庤浆鍐?CSV 琛ㄥご浠?`鏈夋晥鏃堕暱(绉?` 缁熶竴涓?`鏈夋晥鏃堕暱`銆?
- LabelX 鍚庣璇诲彇鍘嗗彶 CSV 鏃跺吋瀹规棫琛ㄥご锛歚鏈夋晥鏃堕暱(绉?` 浼氬綊涓€涓?`鏈夋晥鏃堕暱`銆?
- DataBaker 涓€妫€瀵煎嚭琛ㄥご浠?`鏈夋晥鍚堟牸鏃堕暱` 缁熶竴涓?`鏈夋晥鏃堕暱`锛屾暟鎹潵婧愪粛涓?`effectivePassTotalTime`銆?
- 鏈湴杩愯 CSV 鍙仛涓€娆￠琛岃〃澶磋縼绉伙紱`statistics-data/` 涓?`export-data/` 灞炰簬杩愯鏁版嵁鐩綍锛屼笉鎻愪氦 Git銆?
- 鏈疆鏈慨鏀逛笟鍔¤绠楅€昏緫銆佹湭鎻愬崌鐗堟湰銆佹湭鐢熸垚鍙戝竷浜х墿銆?

## 2026-05-18锛圖ataBaker锛欰I 杈撳嚭绠€浣撳寲鍚庡鐞嗭級

- 鍦?prompt 瑙勫垯涔嬪鏂板鍚庣缁撴灉褰掍竴鍖栵細`heardText` 涓?`recommendedText` 鐨勬櫘閫氱箒浣撳瓧浼氳浆涓虹畝浣撱€?
- 鏂板鍚庡鐞嗗伐鍏凤紝鍏堜繚鎶?`minnan-lexicon.csv` 涓?`BASE_ENTRIES` 鍛戒腑鐨勫缓璁敤瀛楋紝鍐嶅仛鏅€氱畝绻佽浆鎹紝鏈€鍚庢仮澶嶈瘝琛ㄥ缓璁敤瀛椼€?
- `pageText` 椤甸潰鍘熷鍊欓€夋枃鏈繚鎸佷笉鍙橈紝浠呬綔涓烘瘮杈冩潵婧愶紝涓嶅弬涓庡悗澶勭悊鏀瑰啓銆?
- 鏈疆鏈敼妯″瀷閰嶇疆銆佹湭鏂板鎺ュ彛銆佹湭鎻愬崌鐗堟湰銆佹湭鐢熸垚鍙戝竷浜х墿銆?

## 2026-05-18锛圓baka AI锛氫慨姝ｇ櫨鐐艰瑙夋ā鍨嬪悕绉帮級

- 鏍规嵁闃块噷浜戣瑙夌悊瑙ｆ枃妗ｏ紙`help.aliyun.com/zh/model-studio/vision`锛変笌鐢ㄦ埛鎴浘淇 Task21 AI 妯″瀷閰嶇疆銆?
- 榛樿妯″瀷缁熶竴鏀逛负 `qwen3.6-plus`锛?
  - 瑙嗚闃舵锛歚qwen3.6-plus`
  - 鎺ㄧ悊闃舵锛歚qwen3.6-plus`
  - 鍗曟ā鍨嬶細`qwen3.6-plus`
- 淇濈暀鍊欓€夛細`qwen3.6-flash`銆乣qwen3-vl-plus`銆乣qwen3-vl-flash`銆乣qwen3.5-plus`銆乣qwen3.5-flash`銆乣qwen-vl-max`銆乣qwen-vl-plus`銆?
- 绉婚櫎鏃у悕榛樿浣跨敤锛歚qwen-vl-max-latest`銆乣qwen-vl-ocr-latest`銆乣qvq-plus-latest`銆?
- OCR 涓撶敤妯″瀷榛樿鍏抽棴锛坄aiOcrEnabled=false`锛宍aiOcrModel` 涓虹┖锛夛紝寰呮枃瀛楁彁鍙栨枃妗ｈ繘涓€姝ョ‘璁ゅ悗鍐嶅惎鐢ㄣ€?
- 淇濈暀 `two_stage` 榛樿鏂规涓?`single_model` 鍙€夋柟妗堬紱AI 浠嶄粎杈撳嚭寤鸿锛屼笉鑷姩鍐欏叆/淇濆瓨/鎻愪氦銆?
- 鏈疆鏈繚瀛?API Key銆佹湭鎻愬崌鐗堟湰銆佹湭鐢熸垚鍙戝竷浜х墿銆?

## 2026-05-17锛圧EADME锛氳ˉ鍏呮湇鍔″櫒閲嶅惎閰嶇疆锛?

- 鏍圭洰褰?`README.md` 琛ュ厖"鏈嶅姟鍣ㄩ儴缃蹭笌閲嶅惎"绔犺妭锛堥儴缃茬洰褰曘€丳M2 杩涚▼鍚嶃€佷唬鐮佹洿鏂伴噸鍚€佺幆澧冨彉閲忛噸鍚€佺姸鎬?鏃ュ織鏌ョ湅锛夈€?
- 鏄庣‘缁熶竴鍚庣鐜鍙橀噺鍔犺浇椤哄簭涓庣郴缁熺幆澧冨彉閲忎紭鍏堢骇銆?
- 澧炲姞瀹夊叏杈圭晫鎻愮ず锛氫笉鎻愪氦鐪熷疄 env銆丄PI Key銆乧ookie/token/authorization銆丣WT secret銆丆RX 绉侀挜銆?
- 鏈疆浠呮枃妗ｄ慨鏀癸紝鏈慨鏀硅繍琛屾椂浠ｇ爜銆佹湭鎻愬崌鐗堟湰銆佹湭鐢熸垚鍙戝竷浜х墿銆?

## 2026-05-17锛圖ataBaker锛欰I 鎺ㄨ崘鏂囨湰绠€浣撳寲瑙勫垯锛?

- 鏍囪礉鏄撻噰涓€妫€璐ㄦ AI 鍚煶涓庢瘮杈?prompt 鏂板"鏅€氫腑鏂囩箒浣撹浆绠€浣?瑙勫垯锛坄heardText`銆乣recommendedText`锛夈€?
- 闂藉崡鏂硅█璇嶈〃 `platform-resources/data-baker/round-one-quality/ai/minnan-lexicon.csv` 鐨勫缓璁敤瀛楁槑纭帓闄ゅ湪鏅€氱畝绻佽浆鎹箣澶栵紝鍛戒腑璇嶈〃鏃朵繚鎸佸缓璁敤瀛椼€?
- 璇嶈〃寤鸿鐢ㄥ瓧浼樺厛绾ч珮浜庢櫘閫氱畝绻佽浆鎹紝閬垮厤鎶婃柟瑷€寤鸿瀛楀舰鏀瑰洖鏅€氳瘽鍚屼箟璇嶃€?
- 鏈疆浠呰皟鏁?prompt 涓庢枃妗ｏ紝涓嶄慨鏀规ā鍨嬮厤缃€佷笉鏂板鍚庣鎺ュ彛銆佷笉鐢熸垚鍙戝竷浜х墿銆?

## 2026-05-18锛圓baka AI锛氭ā鍨嬪悕涓庣櫨鐐兼枃妗ｅ榻愪慨姝ｏ級

- `docs/external-docs-aliyun-bailian.md` 鏂板骞跺浐瀹?4 涓瑙?OCR瀹樻柟鍏ュ彛锛?
  - 瑙嗚鐞嗚В `url=3026912`
  - 鍥惧儚涓庤棰戠悊瑙?`url=2845871`
  - 鏂囧瓧鎻愬彇 `url=2860683`
  - 瑙嗚鎺ㄧ悊 `url=2877996`
- Abaka Task21 AI 璋冭瘯閰嶇疆瀵归綈瀹樻柟妯″瀷鍙ｅ緞骞惰ˉ OCR 鍙€夐樁娈碉細
  - 榛樿 `two_stage`
  - 榛樿瑙嗚妯″瀷锛歚qwen3-vl-plus`
  - 榛樿 OCR锛歚aiOcrEnabled=false`锛宍aiOcrModel=qwen-vl-ocr-latest`
  - 榛樿鎺ㄧ悊妯″瀷锛歚qvq-plus-latest`
  - 榛樿鍗曟ā鍨嬶細`qwen3-vl-plus`
- Options銆孉baka AI Task21 蹇嵎閿笌 AI 鍒嗘瀽銆嶆柊澧?OCR 寮€鍏充笌 OCR 妯″瀷閫夋嫨锛屽苟淇濇寔 thinking 榛樿鍏抽棴銆?
- 鍓嶅悗绔?analyze 璇锋眰鏂板 `ocrEnabled/ocrModel`锛屽苟杩斿洖闃舵鍖栬皟璇曚俊鎭紙`stages.vision/ocr/reasoning/single`锛夈€?
- 鍚庣璋冪敤绛栫暐淇锛?
  - 鎸夋ā鍨嬭兘鍔涘尯鍒?thinking 鍙傛暟鏄惁閫傜敤锛?
  - thinking 鏀寔妯″瀷鏄惧紡浼?`enable_thinking=true/false`锛?
  - OCR 妯″瀷鎸夎兘鍔涗笉浼?thinking锛岃皟璇曚俊鎭爣璁?`notApplicable`锛?
  - 鍝嶅簲鍖呭惈 `callMode`銆侀樁娈?thinking 鐘舵€佷笌 usage銆?
- AI 浠嶄粎杈撳嚭寤鸿锛屼笉鑷姩鍐欏叆/淇濆瓨/鎻愪氦锛涙湰杞湭鎻愬崌鐗堟湰锛屾湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-18锛圓baka AI锛歍ask21 鍙屾ā鍨?AI Pipeline 澧炲己锛?

- Abaka AI Task21 AI 鍒嗘瀽鏂板鍙屾柟妗堬細
  - `two_stage`锛堥粯璁わ級锛氳瑙夋ā鍨嬫彁鍙栦簨瀹?+ 鎺ㄧ悊妯″瀷瑙勫垯鍒ゆ柇銆?
  - `single_model`锛堜繚鐣欙級锛氬崟妯″瀷鐩存帴杈撳嚭鏈€缁堝缓璁€?
- Options銆孉baka AI Task21 蹇嵎閿笌 AI 鍒嗘瀽銆嶇殑 AI 璋冭瘯鏉垮潡鏂板锛?
  - 鍒嗘瀽鏂规閫夋嫨锛坄two_stage/single_model`锛?
  - 瑙嗚妯″瀷銆佹帹鐞嗘ā鍨嬨€佸崟妯″瀷閫夋嫨
  - 鎬濊€冨紑鍏筹紙榛樿鍏抽棴锛変笌璇锋眰瓒呮椂锛堥粯璁?120000ms锛?
- 閰嶇疆杩佺Щ涓庡吋瀹癸細
  - 鏂板 `aiAnalysisMode/aiVisionModel/aiReasoningModel/aiSingleModel`
  - 鏃?`aiDebugModel` 鑷姩杩佺Щ涓?`aiSingleModel` fallback锛屼笉瑕嗙洊鐢ㄦ埛宸叉湁鏂板瓧娈点€?
- 鍓嶇 `ai-client` 璇锋眰鏄惧紡鎼哄甫锛?
  - `analysisMode/visionModel/reasoningModel/singleModel/enableThinking/timeoutMs`
- 鍚庣 Task21 AI 璺敱涓庡鎴风鏀逛负鏀寔鍙岄樁娈垫墽琛岋紝骞惰繑鍥炲垎闃舵璋冭瘯淇℃伅锛?
  - `stages.vision/reasoning/single` 鐨勬ā鍨嬨€佽€楁椂銆乽sage
  - `analysisMode`銆乣thinking`銆乣usage.total`
- thinking 瀹夊叏绛栫暐锛?
  - 榛樿鏄惧紡鍙戦€?`enable_thinking=false`
  - 鐢ㄦ埛寮€鍚墠浼?`true`
  - 榛樿涓嶉潤榛樼Щ闄ゅ弬鏁帮紱浠呭綋 `ABAKA_TASK21_AI_ALLOW_THINKING_PARAM_FALLBACK=true` 鏃舵墠鍏佽 fallback銆?
- 鍚屾鏇存柊 Abaka Task21 AI Prompt/README銆佸悗绔?README銆佺粺涓€鍚庣 README 涓?`config/env/ai.env.example`銆?
- 鏈疆鏈繚瀛?API Key銆佹湭鑷姩鍐欏叆/淇濆瓨/鎻愪氦銆佹湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-18锛圓baka AI锛歍ask21 AI 璋冭瘯閰嶇疆澧炲己锛?

- Abaka AI Task21 Options 璇︽儏椤垫柊澧?AI 璋冭瘯"瀛愭澘鍧楋細妯″瀷閫夋嫨銆佹€濊€冨紑鍏炽€佽姹傝秴鏃朵笌 mock 鎻愮ず銆?
- 鏂板榛樿閰嶇疆骞跺吋瀹规棫閰嶇疆琛ラ綈锛?
  - `aiDebugModel=qwen-vl-max-latest`
  - `aiEnableThinking=false`
  - `aiRequestTimeoutMs=120000`
- 鍓嶇 `ai-client` 璇锋眰 `/api/abaka-ai/task21/ai/analyze` 鏃讹紝鏄惧紡鎼哄甫 `model`銆乣enableThinking`銆乣timeoutMs`锛堝寘鍚?`enableThinking=false`锛夈€?
- 鍚庣鏂板杩愯鏃跺弬鏁拌В鏋愪笌鐧藉悕鍗曟帶鍒讹細
  - `model` 浠呭湪鍏佽瑕嗙洊涓斿懡涓櫧鍚嶅崟鏃剁敓鏁堬紱
  - `timeoutMs` 闄愬埗 `1000~300000`锛?
  - 榛樿鏄惧紡浼?`enable_thinking=false`锛屼粎鍦ㄧ敤鎴峰惎鐢ㄦ椂浼?`true`銆?
- `defaults/health/analyze` 杩斿洖琛ュ厖 thinking 璋冭瘯淇℃伅锛堝弬鏁板悕銆佸弬鏁颁綅缃€佽姹傛潵婧愶級銆?
- 鍚屾鏇存柊 Abaka Task21 AI 鏂囨。銆佸悗绔鏄庡拰 `ai.env.example`銆?
- 鏈疆鏈繚瀛?API Key锛屾湭鎻愬崌鐗堟湰锛屾湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-17锛圤ptions锛氶椤佃剼鏈笅杞戒腑蹇冨叆鍙ｏ級

- 灏?Options 棣栭〉鍙充笂瑙?鑴氭湰涓績"鍏ュ彛鏀逛负"鑴氭湰涓嬭浇涓績"銆?
- 鐐瑰嚮鍚庢墦寮€ `https://script.xiangtianzhen.store/downloads/`銆?
- 鏈疆鏈慨鏀硅繍琛屾椂浠ｇ爜銆佹湭鎻愬崌鐗堟湰銆佹湭鐢熸垚鍙戝竷浜х墿銆?

## 2026-05-18锛圓baka AI锛歍ask21 鍐呰仈 AI 鍒嗘瀽 UI 閲嶆瀯锛?

- Abaka AI Task21 AI UI 浠庡彸涓嬭鍏ㄥ眬鍥哄畾闈㈡澘鏀逛负瀛楁鍐呰仈褰㈡€侊細
  - `same_font` 鏍囬鍙充晶鎸傝浇 `AI鍒嗘瀽`銆乣鏁翠綋鍒嗘瀽`
  - `image_b_texts_removed` 鏍囬鍙充晶鎸傝浇 `AI鍒嗘瀽`
  - `other_changes` 鏍囬鍙充晶鎸傝浇 `AI鍒嗘瀽`
- 缁撴灉灞曠ず鏀逛负瀛楁閿氱偣鎮诞绐楋紙鍙叧闂€佸彲灞曞紑"鍘熷 JSON锛堣劚鏁忥級"锛夛紝涓嶅啀浣跨敤鍏ㄥ眬鍙充笅瑙掓寜閽綉鏍笺€?
- 鏂板 AI 鍒嗘瀽蹇嵎閿紙榛樿锛夛細
  - `Alt+1` same_font
  - `Alt+2` image_b_texts_removed
  - `Alt+3` other_changes
  - `Alt+4` overall
- 鏁版嵁閲囬泦绛栫暐璋冩暣涓猴細
  - 浼樺厛 `POST /api/v2/item/get-item-info`锛堝悓婧愪細璇濄€乣credentials: include`锛?
  - 鍥為€€ `.content-title span` + `.content-image-view img` DOM 閲囬泦
  - 鍥剧墖瀛楁鍥哄畾 `image_a/image_b/image_b_removed`锛岃皟璇曡緭鍑轰粎淇濈暀 `mime/width/height/bytes/sourceKind`銆?
- 琛ュ厖 Task21 涓撻」缃戠粶鏂囨。锛?
  - `platform-resources/abaka-ai/task21/network/05-items-view-init.md`
  - `platform-resources/abaka-ai/task21/network/06-items-label-init.md`
- 鏈疆缁х画淇濇寔瀹夊叏杈圭晫锛?
  - 涓嶇‖缂栫爜鎴栨寔涔呭寲 token/cookie/authorization/access-token/trace-id
  - 涓嶅睍绀哄畬鏁村浘鐗?URL銆佸畬鏁?dataUrl/base64
  - 涓嶈嚜鍔ㄥ啓鍏ャ€佷笉鑷姩淇濆瓨銆佷笉鑷姩鎻愪氦銆佷笉鑷姩閫佸銆?
- 鏈彁鍗?`extension/manifest.json` 鐗堟湰锛屾湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-17锛圓baka AI锛歍ask21 AI 杈呭姪鍒嗘瀽璋冭瘯鐗堬級

- 鏂板 Abaka AI Task21 AI 闈㈡澘锛堣皟璇曠増锛夛紝鍓嶇鏂板锛?
  - `pricing.js`锛堝崟鏉′环鏍间及绠楋級
  - `data-collector.js`锛堥〉闈㈠浘鐗?鏂囨湰/褰撳墠瀛楁鍊奸噰闆嗭級
  - `ai-client.js`锛堢粺涓€鍚庣璇锋眰锛?
  - `ai-panel.js`锛堝洓鎸夐挳鍒嗘瀽闈㈡澘涓庤皟璇曡緭鍑猴級
- AI 闈㈡澘鎸夐挳锛?
  - 鍒嗘瀽 `same_font`
  - 鍒嗘瀽 `image_b_texts_removed`
  - 鍒嗘瀽 `other_changes`
  - 鏁翠綋鍒嗘瀽锛堟寜 Task21 娴佺▼锛?
- 璋冭瘯杈撳嚭琛ュ厖锛歚requestId`銆佹ā鍨嬪悕銆佽€楁椂銆乼oken usage銆佸浘鐗囨暟閲忎笌瀛楁銆佸浘鐗囩粺璁°€佷环鏍间及绠椼€佽劚鏁忓師濮?JSON銆?
- 鏂板鍚庣妯″潡锛歚platform-resources/abaka-ai/task21/backend/`锛屾敞鍐屾帴鍙ｏ細
  - `GET /api/abaka-ai/task21/ai/health`
  - `GET /api/abaka-ai/task21/ai/defaults`
  - `POST /api/abaka-ai/task21/ai/analyze`
- 鏂板 Prompt 涓庤鍒欐矇娣€锛歚platform-resources/abaka-ai/task21/ai/README.md`銆乣platform-resources/abaka-ai/task21/ai/prompt.md`銆?
- 浠锋牸瑙勫垯宸叉寜"闆ㄦ淮Task21鍗曚环.xlsx"鍥哄寲鍒颁唬鐮佷笌鏂囨。锛屼笉渚濊禆杩愯鏃朵笂浼犳枃浠躲€?
- 瀹夊叏杈圭晫淇濇寔锛?
  - AI 浠呭缓璁紝涓嶈嚜鍔ㄥ啓鍏ャ€佷笉鑷姩淇濆瓨銆佷笉鑷姩鎻愪氦銆佷笉鑷姩閫佸銆?
  - 涓嶈褰曞畬鏁村浘鐗?URL / dataUrl / token / cookie / authorization 绛夋晱鎰熶俊鎭€?
- 鏈慨鏀瑰悗绔互澶栦笟鍔″钩鍙伴€昏緫锛屾湭鎻愬崌 `manifest.version`锛屾湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-17锛圓baka AI锛氫慨澶?Task21 specify 鑱斿姩閲嶅鐐瑰嚮鍙栨秷锛?

- 淇 Abaka AI Task21 蹇嵎閿仈鍔ㄩ噸澶嶇偣鍑诲鑷?`specify` 琚彇娑堢殑闂銆?
- `same_font=true` 涓?`same_font=same underlying font+artistic effect` 閮戒細纭繚涓や釜娲剧敓瀛楁涓?`specify`銆?
- `image_b_texts_removed=specify` 涓?`other_changes=specify` 鏀逛负骞傜瓑閫夋嫨锛氬凡閫変腑鏃朵笉閲嶅鐐瑰嚮锛屼笉浼氳鍙栨秷銆?
- `4/5` 蹇嵎閿悓鏍锋敼涓哄箓绛?ensure 琛屼负锛岄噸澶嶈Е鍙戜笉浼氬彇娑堝凡閫変腑鐘舵€併€?
- 鏈慨鏀规彁浜?棰嗗彇/鏀惧純/璺宠繃/閫佸閫昏緫锛屾湭鎻愬崌鐗堟湰锛屾湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-16锛圓baka AI锛歍ask21 same_font 蹇嵎閿緟鍔╃涓€鐗堬級

- 鏂板 Abaka AI Task21 ISOLATED content runtime锛歚content.js`銆乣shortcuts.js`銆乣dom-actions.js`銆乣toast.js`锛屽苟淇濈暀 MAIN world `network-structure-observer.js`銆?
- `extension/manifest.json` 鏂板 Abaka AI ISOLATED content script 娉ㄥ叆锛坄shared/constants.js`銆乣shared/storage.js` + Task21 runtime 鑴氭湰锛夈€?
- 鏂板 Task21 蹇嵎閿姩浣滀笌榛樿閿綅锛?
  - `1`锛歚same_font=true`
  - `2`锛歚same_font=false`
  - `3`锛歚same_font=same underlying font+artistic effect`
  - `4`锛歚image_b_texts_removed=specify`
  - `5`锛歚other_changes=specify`
- `same_font=true` 鑱斿姩榛樿寮€鍚細鑷姩閫夋嫨 `image_b_texts_removed=specify` 涓?`other_changes=specify`锛堝彲鍦?options 鍏抽棴锛夈€?
- options 鏂板 Abaka AI Task21 蹇嵎閿厤缃尯锛氳仈鍔ㄥ紑鍏炽€佸揩鎹烽敭褰曞埗/娓呴櫎銆佹仮澶嶉粯璁ゃ€佷繚瀛樸€?
- 蹇嵎閿彧鍦?`/items` 涓斿瓨鍦?`same_font` 瀛楁鏃剁敓鏁堬紱鐒︾偣鍦ㄨ緭鍏ユ/textarea/editor 鏃跺拷鐣ャ€?
- 鎵€鏈夊姩浣滀粎瑙﹀彂椤甸潰鐪熷疄 DOM 鐐瑰嚮锛屼笉鐩存帴璋冪敤淇濆瓨銆佹彁浜ゃ€侀鍙栥€佹斁寮冦€佽烦杩囥€侀€佸鎺ュ彛锛涘钩鍙版槸鍚﹁嚜鍔ㄤ繚瀛樼敱椤甸潰鑷韩鏈哄埗鍐冲畾銆?
- 鍚屾鏇存柊 Abaka AI 鐩稿叧 README銆佸钩鍙扮储寮曞拰鍔ㄤ綔杈圭晫鏂囨。銆?
- 鏈彁鍗?`extension/manifest.json` 鐗堟湰锛屾湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-16锛圓baka AI锛氭寜 LabelX 蹇垽椋庢牸鏀跺彛 Task 椤甸潰缃戠粶鐩綍锛?

- 灏?`platform-resources/abaka-ai/network/common/` 涓殑鐘舵€?Tab銆丼kipped / Dropped銆佹仮澶嶃€侀€佸鎴愬姛鍜屽唴瀹″彧璇绘枃妗ｅ悎骞惰繘 `platform-resources/abaka-ai/network/task-page/`銆?
- `network/task-page/` 璋冩暣涓虹被浼?LabelX 蹇垽 `network/` 鐨勫崟灞傜紪鍙锋枃妗ｇ洰褰曪紝鏂板瀹屾暣绱㈠紩銆佹潵婧愰〉闈€佹搷浣滄楠ゃ€佸垵濮嬪寲搴忓垪銆佺姸鎬佸彉鏇撮摼璺拰鑴辨晱瑙勫垯銆?
- 鏇存柊 Abaka AI 鏍圭洰褰曘€佸姩浣滆竟鐣屽拰骞冲彴璧勬簮绱㈠紩涓殑鏃?`common/` 璺緞銆?
- 鏈噸鏂伴噰闆嗭紝鏈彁浜ゅ師濮?HAR/JSON/鎴浘/CSV/瀹屾暣鍝嶅簲鎴栨晱鎰熸暟鎹€?
- 鏈慨鏀硅繍琛屾椂浠ｇ爜锛屾湭鎻愬崌鐗堟湰锛屾湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-16锛圓baka AI锛氶噸鎺掑叕鍏辫祫鏂欎笌浠诲姟椤圭洰鐩綍锛?

- 鎸?LabelX 璧勬枡缁勭粐鏂瑰紡閲嶆帓 Abaka AI 骞冲彴鏂囨。锛氭牴鐩綍缁存姢鍏叡 Task 椤甸潰缁撴瀯銆佸姩浣滆竟鐣屻€佸璇█鍜屽叕鍏?Network銆?
- 灏?Task 椤甸潰鍏叡璇锋眰涓婄Щ鍒?`platform-resources/abaka-ai/network/`锛屽尯鍒?`task-page/` 鍏叡璇锋眰涓?`common/` 鍏叡鐘舵€佹祦杞€?
- 鏂板 `platform-resources/abaka-ai/task21/`锛屼粎淇濈暀 Task21 same_font銆佹淳鐢熷瓧娈靛拰涓撻」淇濆瓨缁撴瀯銆?
- 鏂板 `platform-resources/abaka-ai/task17/`锛岃褰?Task17 鍏叡缁撴瀯瀵规瘮鍜岄鍙栧鏍哥┖姹犲け璐ュ搷搴斻€?
- 鏇存柊骞冲彴绱㈠紩銆佹墿灞?README 鍜屽钩鍙拌祫婧愭€昏涓殑 Abaka AI 璺緞銆?
- 鏈噸鏂伴噰闆嗭紝鏈彁浜ゅ師濮?HAR/JSON/鎴浘/CSV/瀹屾暣鍝嶅簲鎴栨晱鎰熸暟鎹€?
- 鏈慨鏀硅繍琛屾椂浠ｇ爜锛屾湭鎻愬崌鐗堟湰锛屾湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-16锛圓baka AI锛氳ˉ閲囧墿浣欏姩浣滅綉缁滅己鍙ｏ級

- 浣跨敤 DevTools MCP 鍦ㄦ爣娉ㄦ潈闄愪笅琛ラ噰 `Label / 鏍囨敞` 鍖哄煙銆乣other_changes` textarea 鏆傚瓨銆佽瑷€鍒囨崲鍜岃法椤甸€夋嫨璇锋眰缁撴瀯銆?
- 纭 `Label / 鏍囨敞` 鏄鑹插尯鍩熻€岄潪鐘舵€?Tab 涓撳睘 endpoint锛沗other_changes` 鑷敱鏂囨湰鏆傚瓨澶嶇敤 `/api/v2/label/save-labels`銆?
- 纭璇█鍒囨崲鏈瀵熷埌鐙珛鍋忓ソ淇濆瓨鎺ュ彛锛涘垏鍥炰腑鏂囨椂浠呮崟鑾峰父瑙?`/api/message/list`銆?
- 浠呰瀵熻法椤靛叏閫夌殑閫夋嫨鎬併€佸垪琛ㄥ埛鏂板拰甯ф暟缁熻璇锋眰锛屾湭鎵ц鎵归噺閫佸銆佹壒閲忔仮澶嶃€佹壒閲忛鍙栫瓑鍗遍櫓鍔ㄤ綔銆?
- 鍦?Task17 鍐呭椤佃ˉ娴?`棰嗗彇瀹℃牳` 绌烘睜澶辫触鍝嶅簲锛岃繑鍥?鏃犳潯鐩彲棰?锛涘嚭鐜伴獙璇佺粍浠跺悗鏈户缁搷浣溿€?
- 鏈彁浜ゅ師濮?HAR/JSON/鎴浘/CSV/瀹屾暣鍝嶅簲鎴栨晱鎰熸暟鎹€?
- 鏈慨鏀硅繍琛屾椂浠ｇ爜锛屾湭鎻愬崌鐗堟湰锛屾湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-16锛圓baka AI锛氳ˉ鍏呴鍙栦笌涓枃鍔ㄤ綔鏂囨锛?

- 浣跨敤 DevTools MCP 浜屾娴嬭瘯 Task21 `Claim Label` / `Claim Review`锛屽潎浠嶆垚鍔熼鍙?1 鏉℃祴璇曟暟鎹紝鏈Е鍙戠┖姹犲搷搴斻€?
- 鍒囨崲鍒扮畝浣撲腑鏂囩幆澧冿紝琛ラ綈 Data 椤?`鏌ョ湅`銆乣棰嗗彇鏍囨敞`銆乣棰嗗彇瀹℃牳`銆佺姸鎬?Tab 鍜屾爣娉ㄩ〉 `鏆傚瓨`銆乣鏀惧純`銆乣璺宠繃`銆乣閫佸` 绛夊姩浣滄枃妗堛€?
- 琛ュ厖 Dropped 鎭㈠鍚庣殑鐩爣鐘舵€侊細鎭㈠鍚庤繘鍏?Todo / 寰呭姙椤广€?
- 鎸夌敤鎴疯姹備笉璁板綍缁熻鍒嗘瀽銆佸伐浣滄祦銆佹垚鍛橀厤缃笁椤点€?
- 鏈彁浜ゅ師濮?HAR/JSON/鎴浘/CSV/瀹屾暣鍝嶅簲鎴栨晱鎰熸暟鎹€?
- 鏈慨鏀硅繍琛屾椂浠ｇ爜锛屾湭鎻愬崌鐗堟湰锛屾湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-16锛圓baka AI锛氳ˉ閲?Skipped / Dropped 鎭㈠涓庢爣娉ㄩ€佸閾捐矾锛?

- 浣跨敤 DevTools MCP 琛ラ噰 Task 椤甸潰鍏叡鐘舵€?Tab銆丼kipped / Dropped 鍒楄〃鍜屾仮澶嶉摼璺€?
- 鏍囨敞鏉冮檺涓嬪崟鏉℃祴璇曢€佸鎴愬姛閾捐矾锛岀‘璁?`save-labels -> submit-item` 鍜?Data 椤?`Labeled / Pending Review` 鐘舵€佸彉鍖栥€?
- 鏍囨敞鍐呭鏉冮檺涓嬪彧瑙傚療鍒楄〃銆佺姸鎬?Tab 鍜?`View` 鏌ョ湅椤靛垵濮嬪寲锛屾湭鎻愪氦銆佹湭閫氳繃銆佹湭椹冲洖銆佹湭瑙﹀彂瀹℃牳瀹屾垚绫诲姩浣溿€?
- 鏂板 `platform-resources/abaka-ai/task-page/network/common/` 缃戠粶鏂囨。鐩綍锛屽尯鍒嗗叕鍏?Task 椤甸潰鑳藉姏涓?Task21 `same_font` 涓撳睘鑳藉姏銆?
- 鏈彁浜ゅ師濮?HAR/JSON/鎴浘/CSV/瀹屾暣鍝嶅簲鎴栨晱鎰熸暟鎹€?
- 鏈慨鏀硅繍琛屾椂浠ｇ爜锛屾湭鎻愬崌鐗堟湰锛屾湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-16锛圓baka AI锛氳ˉ榻?Task21 鍔ㄤ綔缃戠粶璇锋眰锛?

- 鎸?LabelX 蹇垽 `network/` 鐩綍椋庢牸鎷嗗垎 Abaka AI Task21 缃戠粶璇锋眰锛屾柊澧炵紪鍙锋枃妗ｅ拰寰呰ˉ/鎺ョ画璇存槑銆?
- 浣跨敤 DevTools MCP 娴嬭瘯骞惰ˉ閲囬鍙栨爣娉ㄣ€侀鍙栧鏍搞€佸崟閫?澶氶€夋潯鐩€乻ame_font 鏆傚瓨淇濆瓨銆佹斁寮冦€佽烦杩囥€侀€佸鍓嶇鏍￠獙鍜岃祫婧愬姞杞介摼璺€?
- 姣忎釜鍔ㄤ綔鐙珛鏂囨。璁板綍 request/response 缁撴瀯鎽樿銆佸悗缁摼璺€侀〉闈㈠弽棣堝拰椋庨櫓杈圭晫銆?
- 鏈彁浜ゅ師濮?HAR/JSON/鎴浘/CSV/瀹屾暣鍝嶅簲鎴栨晱鎰熸暟鎹€?
- 鏈慨鏀硅繍琛屾椂浠ｇ爜锛屾湭鎻愬崌鐗堟湰锛屾湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-16锛圓baka AI锛氭寜 LabelX 椋庢牸閲嶆瀯骞冲彴璧勬枡锛?

- 鎷嗗垎 Abaka AI README 涓殑椤甸潰缁撴瀯銆丯etwork銆佸姩浣滈闄┿€佸璇█鍐呭锛孯EADME 鏀跺彛涓鸿祫鏂欏叆鍙ｅ拰褰撳墠鐘舵€併€?
- 鏂板/鏇存柊 `platform-resources/abaka-ai/README.md`銆乣platform-resources/abaka-ai/network.md`銆乣platform-resources/abaka-ai/task-page/network.md`銆乣platform-resources/abaka-ai/task-page/page-structure.md`銆乣platform-resources/abaka-ai/task-page/actions.md`銆乣platform-resources/abaka-ai/task-page/i18n.md`銆?
- `extension/sites/abaka-ai/task-page/README.md` 鏀跺彛涓鸿繍琛屾椂鍏ュ彛銆佹敞鍏ヨ寖鍥村拰 Console 閲囬泦鏂规硶銆?
- 鏈噸鏂伴噰闆嗭紝鏈彁浜ゅ師濮?HAR/JSON/鎴浘/CSV/瀹屾暣鍝嶅簲鎴栨晱鎰熸暟鎹€?
- 鏈慨鏀硅繍琛屾椂浠ｇ爜锛屾湭鎻愬崌鐗堟湰锛屾湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-16锛圓baka AI锛氭繁鍖?Task21 椤甸潰涓?Network 缁撴瀯閲囬泦锛?

- 浣跨敤 Google Chrome DevTools MCP 娣卞害閲囬泦 Abaka AI Task21 椤甸潰缁撴瀯鍜?Network 缁撴瀯銆?
- 瑕嗙洊 Task21 鍏ㄩ儴鏁版嵁椤点€佹壒娆￠〉銆佹爣娉?鍐呭瑙掕壊鍒囨崲銆佸崟鏉￠€夋嫨銆佹煡鐪嬮〉銆佹爣娉ㄩ〉銆乻ame_font 涓绘爣娉ㄥ尯銆佸彸渚ф潯鐩垪琛ㄣ€佽瑷€鍒囨崲涓?Task17 瀵规瘮椤点€?
- 璁板綍 same_font 鍗曢€夈€佹淳鐢熷瓧娈点€佽祫婧愬尯銆佸浘鐗囨煡鐪嬪櫒銆侀攣瀹?鏆傚仠鐘舵€併€佹殏瀛?鏀惧純/璺宠繃/閫佸绛夋寜閽粨鏋勶紱鍦ㄦ祴璇曡处鍙峰崟鏉¤寖鍥村唴瑙﹀彂 same_font 閫夋嫨銆佽嚜鍔ㄤ繚瀛樺拰鏀惧純鎺ュ彛銆?
- 琛ュ厖 `/items` 宸ヤ綔椤垫帴鍙ｆ棌锛氭潯鐩巻鍙层€佹煡鐪嬫潈闄愩€佹搷浣滄潈闄愩€佸伐浣滅姸鎬併€佹爣娉ㄦ暟鎹€侀棶棰樻暟鎹€佹爣娉ㄨ褰曘€丄I 妫€鏌ャ€佹棤鏁堝抚銆佹娊甯ф暟鎹€佸彸渚ф潯鐩垪琛ㄣ€佽嚜鍔ㄤ繚瀛樺拰鏀惧純鎺ュ彛銆?
- 琛ュ厖涓枃涓?English 鏂囨鏄犲皠锛屾槑纭悗缁畾浣嶅簲浼樺厛浣跨敤 route/query keys銆佽〃澶寸粨鏋勩€乺ole/aria/data-col-key 鍜屽弻璇枃妗堝厹搴曪紝涓嶈兘鍙緷璧栦腑鏂囨枃鏈€?
- Task17 浠呬綔涓哄叕鍏辩粨鏋勫姣旓紝璁板綍鍒楄〃銆乣/items` 鏌ョ湅椤点€佸叕鍏辨帴鍙ｆā寮忎笌 Task21 宸紓锛涙湭瀵?Task17 鍋氶鍙栥€侀€佸銆佹斁寮冦€佽烦杩囩瓑鐘舵€佸彉鏇淬€?
- 鏂囨。浠呰褰曡劚鏁忕粨鏋勶紱鏈彁浜ょ湡瀹?JSON/HAR/鎴浘/CSV/鍘熷鎺ュ彛鍝嶅簲锛屾湭璁板綍 cookie銆乼oken銆乤uthorization銆佸瘑鐮併€佺鍚嶆垨瀹屾暣璧勬簮 URL銆?
- 鏈疆鏈疄鐜拌嚜鍔ㄥ寲鍔熻兘锛屾湭淇敼杩愯鏃朵唬鐮侊紝鏈彁鍗囩増鏈紝鏈敓鎴?CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-16锛圓baka AI锛氳ˉ鍏?Task21 椤甸潰涓?Network 缁撴瀯鏂囨。锛?

- 浣跨敤 Google Chrome DevTools MCP 閲囬泦骞舵暣鐞?Abaka AI Task21 椤甸潰缁撴瀯銆?
- 琛ュ厖浠诲姟鍒楄〃椤?`/data-task/v2`銆乀ask21 璇︽儏椤?`/task-v2/data-item?taskId={taskId}`銆佹壒娆¤鍥?`/task-v2/data-item?taskId={taskId}&vm=batch&batchId={batchId}` 鐨?DOM 鍖哄煙銆佽〃鏍煎瓧娈点€佺瓫閫夋帶浠跺拰閫夋嫨鍣ㄥ€欓€夈€?
- 琛ュ厖鐧诲綍鍚庣敤鎴?鏉冮檺銆佷换鍔″垪琛ㄣ€乀ask21 璇︽儏銆乄orkflow銆佹壒娆″垪琛ㄣ€佺瓫閫夊垪琛ㄣ€乀odo 鏉＄洰鍒楄〃绛?Network 缁撴瀯鎽樿銆?
- 鏄庣‘ `Claim Label`銆佷繚瀛樸€佹彁浜ゃ€侀鍙栥€佹祦杞€佽烦杩囥€佽法椤甸€夋嫨绛夊嵄闄╂搷浣滆竟鐣岋紱鏈疆鏈富鍔ㄨЕ鍙戙€?
- 鏈彁浜ょ湡瀹為噰闆?JSON/HAR/鎴浘/CSV/鍘熷鎺ュ彛鍝嶅簲锛屾湭璁板綍 cookie銆乼oken銆乤uthorization銆佸瘑鐮佹垨瀹屾暣璧勬簮 URL銆?
- 鏈疆浠呮洿鏂?Abaka AI 鏂囨。鍜屽钩鍙扮储寮曪紝涓嶅疄鐜拌嚜鍔ㄥ寲鍔熻兘锛屼笉淇敼杩愯鏃朵唬鐮侊紝涓嶆彁鍗?`extension/manifest.json` 鐗堟湰锛屼笉鐢熸垚 CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-16锛圓baka AI锛氭柊澧?Task 椤甸潰缁撴瀯鍙閲囬泦澹筹級

- 鏂板 Abaka AI 骞冲彴涓庤剼鏈櫥璁帮細
  - 骞冲彴锛歚abakaAi`锛坔ost: `abao.fortidyndns.com`锛?
  - 鑴氭湰锛歚abakaAiTaskPageCapture`
  - 鐘舵€侊細鍙閲囬泦闃舵锛堜粎 DOM/Network 缁撴瀯閲囬泦锛屼笉鍋氳嚜鍔ㄩ鍙?淇濆瓨/鎻愪氦/娴佽浆锛夈€?
- `extension/manifest.json` 鏂板锛?
  - `host_permissions`: `http://abao.fortidyndns.com:30473/*`
  - MAIN world content script锛歚sites/abaka-ai/task-page/page-world/network-structure-observer.js`
- 鏂板 MAIN world 瑙傚療鍣細
  - 鍚屾椂琚姩 hook `fetch` 涓?`XMLHttpRequest`
  - 浠呰褰曡劚鏁忕粨鏋勶紝涓嶈褰曟晱鎰熷師濮嬪€?
  - Console 瀵煎嚭鍏ュ彛锛歚window.__ASCAbakaAiCapture.snapshot()` / `download()`銆?
- 鏂囨。鍚屾锛?
  - 鏂板 `extension/sites/abaka-ai/task-page/README.md`
  - 鏂板 `platform-resources/abaka-ai/task-page/README.md`
  - 鏇存柊 `docs/platforms-index.md`銆乣README.md`銆乣extension/README.md`銆乣platform-resources/README.md`銆?
- 鏈疆涓嶆彁鍗?`extension/manifest.json` 鐗堟湰鍙凤紝涓嶅彂甯冿紝涓嶇敓鎴?CRX/ZIP/update.xml/crx-latest.json銆?

## 2026-05-15锛?.3.2 鐑慨锛氬揩鍒?AI 瑙勫垯鎸?0422 瑙勮寖閲嶅啓骞惰ˉ鍏呴敊渚?few-shot锛?

- 淇濇寔 `extension/manifest.json` 鐗堟湰 `0.3.2` 涓嶅彉锛屾湰杞睘浜庡綋鍓嶆祴璇曠増鏈?AI 瑙勫垯淇銆?
- 蹇垽姣旇緝瑙勫垯鐗堟湰鍗囩骇涓?`asr-judgement-rules-20260422`锛堝悗绔?`RULE_VERSION` 鍚屾鏇存柊锛夈€?
- 蹇垽 AI 姣旇緝瑙勫垯閲嶅啓涓?P0/P1/P2 鍐崇瓥鏍戯細
  - 鍏堝垎灞傚垽瀹氫袱鏉″€欓€夛紱
  - 涓€鏉?P0/P1銆佸彟涓€鏉′粎 P2 鎴栨棤閿欐椂蹇呴』閫夋洿浼樻潯锛?
  - 涓ゆ潯閮藉瓨鍦ㄥ奖鍝嶇悊瑙ｇ殑 P0/P1 鎵嶅厑璁?`both_bad`锛?
  - `uncertain_or_similar` 浠呯敤浜庝袱鏉￠兘鍚堟牸涓旀棤鏄庢樉浼樺姡銆?
- 寮哄寲瑙勫垯浼樺厛绾э細瀹炴剰璇嶃€佷笓鏈夊悕璇嶃€佸姩浣滆瘝銆佸惁瀹氳瘝楂樹簬鏍囩偣鍜屾牸寮忥紱`heardText` 浠呬綔杈呭姪锛屼笉鏇夸唬鍊欓€夋瘮杈冦€?
- 鍦?compare 瑙勫垯妯℃澘涓ˉ鍏?6 涓敊渚?few-shot锛?
  1) 鍏卞悓鏍稿績婕忓瓧 -> `both_bad`
  2) 閲嶅娆℃暟鎺ヨ繎搴?-> 閫夋洿鎺ヨ繎鑰?
  3) 涓ゆ潯鍔ㄤ綔瀹炶瘝閮介敊 -> `both_bad`
  4) 瀹炴剰璇嶄紭鍏堜簬鏍煎紡 -> 閫夋牳蹇冭瘝姝ｇ‘鑰?
  5) 棰嗗煙璇嶈鍒囪姘旇瘝 -> 閫夌湡瀹為鍩熻瘝
  6) 鏍稿績璇箟鐩稿弽 -> 閫夎涔夋纭€?

## 2026-05-15锛堝彂甯冭剼鏈寮猴細鏂板姣忕増鏈?ZIP 浜х墿锛?

- `scripts/package-crx-release.js` 鏂板姣忕増鏈?ZIP 鐢熸垚锛歚dist/annotation-script-center-v<version>.zip`銆?
- ZIP 榛樿鎵撳寘 `extension/` 鐩綍鍐呭锛屽苟澧炲姞鏍￠獙锛氭枃浠跺瓨鍦ㄣ€侀潪绌恒€佸寘鍚?`manifest.json`銆?
- ZIP 鍐呭淇濇姢鏍￠獙锛氱姝㈠懡涓?`config/`銆乣platform-resources/`銆乣docs/`銆乣dist/`銆乣.git/`銆乣node_modules/`銆乣config/secrets/`銆乣.env*`銆佽繍琛屾暟鎹洰褰曠瓑璺緞銆?
- 鍙戝竷鑴氭湰杈撳嚭鏃ュ織璋冩暣涓轰袱缁勶細
  - 褰撳墠鎵嬪伐鍒嗗彂鏂囦欢锛歚CRX + ZIP`
  - 浼佷笟鑷姩鏇存柊棰勭暀鏂囦欢锛歚update.xml + crx-latest.json`
- `crx-latest.json` 澧炲姞 ZIP 鍏冩暟鎹瓧娈碉細
  - `zip_filename`
  - `zip_download_url`
  - `zip_sha256`
  - `zip_size_bytes`
- 鏂囨。鍚屾锛?
  - `README.md`
  - `extension/README.md`
  - `docs/unfinished/crx-enterprise-managed-install.md`
  - `AGENTS.md`
- 鏈疆涓嶄慨鏀硅繍琛屾椂浠ｇ爜锛屼笉鎻愬崌 `manifest.version`銆?

## 2026-05-15锛?.3.2 鏂囨。鏁寸悊锛欰GENTS 鐦﹁韩涓庡钩鍙扮储寮曪級

- 鏂板 `docs/platforms-index.md`锛岄泦涓淮鎶ゅ钩鍙颁笌鑴氭湰鏂囨。鍏ュ彛锛屼笉鍦?AGENTS 鍫嗗钩鍙扮粏鑺傘€?
- 鏇存柊 `docs/README.md`锛氭柊澧?`docs/platforms/` 鍒嗙被涓庡叧閿叆鍙ｃ€?
- `AGENTS.md` 绮剧畝涓洪」鐩骇瑙勫垯锛堝伐浣滄祦銆佹殫鍙枫€佺洰褰曡竟鐣屻€佸畨鍏ㄣ€侀獙璇併€佸彂甯冦€佹枃妗ｈ鍒欙級锛屽垹闄ゅ叿浣撳钩鍙伴暱鍙ｅ緞锛屾敼涓?鍏堢湅骞冲彴绱㈠紩鍐嶇湅瀵瑰簲 README/璧勬枡"銆?
- 鏇存柊 `README.md` 涓?`extension/README.md` 鏂囨。鍏ュ彛锛屽姞鍏?`docs/platforms-index.md`銆?
- 鏈疆浠呮枃妗ｆ暣鐞嗭紝涓嶄慨鏀硅繍琛屾椂浠ｇ爜锛屼笉鍙樻洿 `manifest.version`銆?

## 2026-05-15锛?.3.2 鏂囨。鏁寸悊锛氭寚浠や笌 docs 鍒嗗眰褰掓。锛?

- docs 鐩綍瀹屾垚鍒嗗眰閲嶆瀯锛歚architecture/`銆乣workflow/`銆乣external-docs/`銆乣rules/`銆乣archive/`銆乣unfinished/`锛宒ocs 鏍瑰眰浠呬繚鐣欏鑸?`docs/README.md`銆?
- 鏂板 `docs/workflow/codex-prompt-style.md`锛屽浐瀹?Codex Prompt 杈撳嚭鏍煎紡锛堝灞傚崟涓€ text 浠ｇ爜鍧椼€佺姝㈠唴閮ㄥ祵濂椾笁鍙嶅紩鍙凤級銆?
- 鏂板 `docs/external-docs-aliyun-bailian.md`锛岄泦涓矇娣€闃块噷浜戠櫨鐐煎畼鏂规枃妗ｅ叆鍙ｄ笌鏌ラ槄瑙勫垯銆?
- 鏍?`README.md` 鐦﹁韩涓洪」鐩瑙?+ 杩愯鍏ュ彛 + 鏂囨。瀵艰埅锛屽巻鍙茬粏鑺傜粺涓€鏀跺彛鍒?`log.md` 涓?`docs/archive/`銆?
- 鏇存柊 `AGENTS.md`锛氳ˉ鍏?Prompt 杈撳嚭鎽樿銆佺櫨鐐兼枃妗ｆ煡闃呰鍒欍€乨ocs 鍒嗙被瑙勫垯涓?shared 閫氱敤妯″潡瀹氫綅銆?
- 鏇存柊 `extension/README.md`銆乣platform-resources/backend/README.md` 鐨勬枃妗ｅ叆鍙ｄ笌鐧剧偧鏍稿鍙ｅ緞銆?
- 鏂板蹇垽浜哄伐瑙勮寖鏁寸悊鐗堬細`platform-resources/alibaba-labelx/asr-judgement/ai/asr-judgement-official-rules.md`锛圥0/P1/P2銆佷紭鍏堢骇銆乥oth_bad/uncertain 闄愬埗銆侀敊渚嬫憳瑕侊級銆?
- 鏈疆浠呮枃妗ｆ暣鐞嗭紝涓嶄慨鏀硅繍琛屾椂浠ｇ爜锛宍manifest.version` 淇濇寔涓嶅彉銆?

## 2026-05-15锛?.3.2 鐑慨锛氳ˉ榻愯浆鍐欐彁浜ゅ揩鎹烽敭璁剧疆椤癸級

- 淇杞啓 options 蹇嵎閿垪琛ㄧ己椤癸細琛ラ綈 `shortcutSubmitTask`锛堟彁浜や换鍔★級涓?`shortcutSubmitTaskAndFinish`锛堟彁浜や换鍔″苟缁撴潫锛夋樉绀轰笌淇濆瓨銆?
- 琛ラ綈杞啓鏈湴褰掍竴鍖栭粯璁ゅ瓧娈碉細`shortcutSubmitTask: null`銆乣shortcutSubmitTaskAndFinish: null`锛岄粯璁や笉鍗犵敤閿綅銆?
- 杞啓杩愯鏃朵粛澶嶇敤 `extension/sites/alibaba-labelx/shared/submit-actions.js` 鎵ц鎻愪氦鍔ㄤ綔锛涗笉鏂板宸ュ叿鏍忔寜閽紝涓嶈嚜鍔ㄧ‘璁や簩娆″脊绐椼€?
- `manifest.version` 淇濇寔 `0.3.2`銆?

## 2026-05-15锛?.3.2 鐑慨锛氭彁浜ゅ揩鎹烽敭鎶戒负 LabelX 蹇垽/杞啓閫氱敤鑳藉姏锛?

- 鏂板閫氱敤妯″潡 `extension/sites/alibaba-labelx/shared/submit-actions.js`锛岀粺涓€灏佽"鎻愪氦浠诲姟 / 鎻愪氦浠诲姟骞剁粨鏉?DOM 鏌ユ壘涓庣偣鍑婚€昏緫锛堜粎鐐瑰嚮椤甸潰绯荤粺鎸夐挳锛屼笉鐩存帴璇锋眰骞冲彴 API锛屼笉鑷姩纭浜屾寮圭獥锛夈€?
- 蹇垽 `judgement-actions.js` 鍒犻櫎鏈湴閲嶅鎻愪氦鎸夐挳鏌ユ壘浠ｇ爜锛屾敼涓鸿杽灏佽璋冪敤 shared submit-actions銆?
- 杞啓鎺ュ叆鎻愪氦蹇嵎閿姩浣滐細`shortcutSubmitTask`銆乣shortcutSubmitTaskAndFinish`锛屽苟鍦?`shortcut-bus.js` / `content.js` 鏀寔瑙﹀彂 shared submit-actions銆?
- 蹇垽涓庤浆鍐欐彁浜ょ被蹇嵎閿厤缃嫭绔嬩繚瀛橈紝榛樿鍧囨湭缁戝畾锛涢《閮ㄥ伐鍏锋爮涓よ竟鍧囨湭鏂板鎻愪氦鎸夐挳銆?
- `manifest.version` 淇濇寔 `0.3.2`銆?

## 2026-05-15锛?.3.2 鐑慨锛氭竻鐞嗗揩鍒?AI 椤堕儴鎸夐挳骞舵柊澧炴彁浜ゅ揩鎹烽敭锛?

- 淇濇寔 `extension/manifest.json` 鐗堟湰 `0.3.2` 涓嶅彉锛屾湰杞睘浜庡綋鍓嶆祴璇曠増鏈皬淇€?
- 蹇垽椤堕儴宸ュ叿鏍?AI 鍒嗙粍鏀跺彛锛氫粎淇濈暀 `AI 鍒嗘瀽褰撳墠棰榒 涓?`澶嶅埗涓ゆ潯 ASR 鏂囨湰`锛岀Щ闄ら《閮?`AI 閲囩敤/AI 閲嶈瘯/AI 蹇界暐` 涓変釜閲嶅鎸夐挳銆?
- AI 闈㈡澘鍐?閲囩敤寤鸿 / 閲嶆柊鍒嗘瀽 / 蹇界暐"鎸夐挳鍜屽搴斿揩鎹烽敭鑳藉姏淇濇寔涓嶅彉銆?
- 蹇垽鏂板涓や釜蹇嵎閿姩浣滐紙榛樿鏈粦瀹氾級锛?
  - `submitTask`锛堟彁浜や换鍔★級
  - `submitTaskAndFinish`锛堟彁浜や换鍔″苟缁撴潫锛?
- 鎻愪氦绫诲揩鎹烽敭瀹炵幇鏂瑰紡涓虹偣鍑婚〉闈㈢湡瀹炵郴缁熸寜閽紙`button/.ant-btn/[role=button]`锛夛紝涓嶇洿鎺ヨ皟鐢ㄥ钩鍙版帴鍙ｏ紱鑻ュ嚭鐜颁簩娆＄‘璁ゅ脊绐楅渶浜哄伐纭銆?
- 鎵句笉鍒扮洰鏍囨寜閽椂杩斿洖娓呮櫚澶辫触鎻愮ず锛歚鏈壘鍒?鎻愪氦浠诲姟"鎸夐挳` 鎴?`鏈壘鍒?鎻愪氦浠诲姟骞剁粨鏉?鎸夐挳`銆?

## 2026-05-15锛?.3.2锛氫慨澶?LabelX 榛樿鍊嶉€熶笌鍒囬鑷姩鎾斁锛屾柊澧為€氱敤闊抽鏍稿績锛?

- 淇濇寔 `extension/manifest.json` 鐗堟湰 `0.3.2` 涓嶅彉锛屾湰杞睘浜庡綋鍓嶆祴璇曠増鏈姛鑳戒慨澶嶄笌妯″潡鏁寸悊銆?
- 鏂板閫氱敤妯″潡锛歚extension/sites/alibaba-labelx/shared/audio-controller-core.js`锛岀粺涓€鎵胯浇 LabelX 蹇垽/杞啓鐨勯煶棰戝熀纭€鑳藉姏锛?
  - 榛樿鍊嶉€熶笌榛樿闊抽噺搴旂敤
  - 鍊嶉€熸杩涗笌鍓嶈繘/鍚庨€€姝ラ暱
  - 鑷姩鎾斁褰撳墠棰?
  - 鍒囬鏃跺仠鏃ф挱鏂?
  - 鍗曢煶棰戜簰鏂ユ挱鏀?
- 蹇垽涓庤浆鍐?`audio-controller.js` 鏀逛负钖勫皝瑁咃紝缁х画淇濈暀鍘熸湁 `globalThis` 鎺ュ彛鍚嶏紝`content.js` 渚ф敼鍔ㄦ渶灏忋€?
- 淇"榛樿鍊嶉€熷彧鏄剧ず涓嶇敓鏁?锛氶煶棰戝簲鐢ㄩ粯璁ゅ€兼椂鍚屾椂鍐欏叆 `playbackRate/defaultPlaybackRate`锛屽苟鍔犲叆鐭欢杩熸牎楠屽洖鍐欙紝閬垮厤骞冲彴缁勪欢鎶婂€嶉€熷洖婊氬埌 `1x`銆?
- 淇"鍒囬鏃ч煶棰戠户缁挱鏀?锛氶€変腑棰樺崱鍙樺寲鏃剁珛鍗虫殏鍋滄棫闊抽锛屽啀瀵规柊棰橀煶棰戝簲鐢ㄩ粯璁ゅ€煎苟鑷姩鎾斁锛堝紑鍚嚜鍔ㄦ挱鏀炬椂锛夈€?
- 榛樿鍊艰皟鏁达細
  - 蹇垽榛樿鍊嶉€熸敼涓?`2x`銆?
  - 杞啓榛樿鍊嶉€熸敼涓?`1.5x`锛屽苟缁熶竴榛樿姝ヨ繘涓?`0.25`銆佸墠杩?鍚庨€€姝ラ暱涓?`0.5`銆?
- 鏂囨。鍚屾琛ュ厖锛歴hared 闊抽妯″潡褰掑睘銆佸揩鍒?杞啓榛樿鍊嶉€熶笌鍒囬鎾斁瑙勫垯銆乣400` 鏉?pageSize 涓哄揩鍒や笓灞炶竟鐣屻€?

## 2026-05-15锛?.3.2 鐑慨锛氫慨澶嶅揩鍒?AI Web Search 鍙橀噺鏈畾涔夛級

- 淇濇寔 `extension/manifest.json` 鐗堟湰 `0.3.2` 涓嶅彉锛屾湰杞睘浜庡綋鍓嶆祴璇曠増鏈?hotfix銆?
- 淇 `platform-resources/alibaba-labelx/asr-judgement/backend/ai-client-qwen.js` 涓?`requestCompare` 鐨?`webSearchEnabled` 鍙橀噺鏈畾涔夐棶棰橈紝閬垮厤 compare 闃舵鎶涘嚭 `webSearchEnabled is not defined`銆?
- `requestCompare` 澧炲姞 Web Search 寮€鍏宠В鏋愬厹搴曢摼璺細`options.webSearchEnabled -> options.aiOptions.webSearchEnabled -> input.aiOptions.webSearchEnabled -> 鍚庣榛樿閰嶇疆`銆?
- `sanitizeAiOptions` 琛ュ厖 `webSearchEnabled` 鍏煎璇诲彇锛堜粎鐢ㄤ簬鏄惁鍚敤鑱旂綉鎼滅储鎺у埗锛屼笉鐩存帴閫忎紶涓烘ā鍨嬪弬鏁板瓧娈碉級銆?
- 缁存寔鍘熸湁杈圭晫锛歭isten 闃舵浠嶄笉鍚敤 Web Search锛沜ompare 闃舵鎸夐厤缃惎鐢紝涓嶆敮鎸佹椂浠呯Щ闄よ仈缃戝弬鏁伴噸璇曚竴娆°€?

## 2026-05-14锛?.3.2锛氬寮哄揩鍒?AI 鎼滅储杈呭姪涓庡揩鎹烽敭锛?

- 淇濇寔 `extension/manifest.json` 鐗堟湰 `0.3.2` 涓嶅彉锛屾湰杞睘浜庡綋鍓嶆祴璇曠増鏈姛鑳藉寮恒€?
- 蹇垽 AI 寤鸿鏂板 4 涓姩浣滃苟鎺ュ叆蹇嵎閿郴缁燂紙鎸夐挳涓庡揩鎹烽敭澶嶇敤鍚屼竴鍔ㄤ綔閫昏緫锛夛細
  - `applyAiSuggestion`锛欰I 閲囩敤寤鸿
  - `retryAiSuggestion`锛欰I 閲嶆柊鍒嗘瀽
  - `ignoreAiSuggestion`锛欰I 蹇界暐寤鸿
  - `copyAsrTextPair`锛氬鍒朵袱鏉?ASR 鏂囨湰
- 鏂板"澶嶅埗涓ゆ潯 ASR 鏂囨湰"缁熶竴鏍煎紡锛?
  - `asr_text1:<绗竴鏉℃枃鏈?;`
  - `asr_text2:<绗簩鏉℃枃鏈?`
- 蹇垽 AI 鏉冮噸瑙勫垯璋冩暣涓猴細`asrText1/asrText2` 涓轰富鍒ゆ柇瀵硅薄锛宍heardText`銆乣contextText`銆乄eb Search 浠呬綔娑堟杈呭姪銆?
- 蹇垽 compare 闃舵鎺ュ叆 Web Search 寮€鍏筹細
  - 鍓嶇鏂板 `aiSuggestionWebSearchEnabled`锛堥粯璁ゅ紑鍚級銆?
  - 鍚庣浠呭湪 compare 闃舵鍚敤 Web Search锛屼笉鍦?listen 闃舵鍚敤銆?
  - 鑻ヤ笂娓歌繑鍥炴悳绱㈠弬鏁颁笉鏀寔锛屽悗绔Щ闄ゆ悳绱㈠弬鏁伴噸璇曚竴娆″苟杩斿洖 fallback 鐘舵€併€?
- 蹇垽鍝嶅簲鏂板 `webSearch` 鐘舵€佸璞★紙`enabled/used/fallbackUsed/fallbackReason`锛夛紝骞舵敮鎸?`evidence.webSearchHint`銆?
- 鏂囨。鍚屾锛歚AGENTS.md`銆乣extension/sites/alibaba-labelx/asr-judgement/README.md`銆乣platform-resources/backend/README.md`銆乣config/env/ai.env.example`銆?

## 2026-05-13锛?.3.2锛氱粺涓€ ASR AI thinking 鏄惧紡浼犲弬璇箟锛?

- 淇濇寔 `extension/manifest.json` 鐗堟湰 `0.3.2` 涓嶅彉锛屾湰杞睘浜?AI 鍙傛暟璇箟鐑慨銆?
- 缁熶竴鍥涗釜 ASR AI 鍚庣瀹㈡埛绔殑 thinking 琛屼负锛?
  - 鍏抽棴鏃舵樉寮忎紶 `enable_thinking=false`銆?
  - 寮€鍚椂鏄惧紡浼?`enable_thinking=true`銆?
  - 鑻ヤ笂娓歌繑鍥炲弬鏁颁笉鏀寔/鍙傛暟鏃犳晥锛屼粎绉婚櫎璇ュ弬鏁伴噸璇曚竴娆★紙`thinkingFallbackMode=remove`锛夛紝涓嶅仛鏃犻檺閲嶈瘯銆?
- 淇蹇垽閾捐矾锛歚asr-judgement` 鍏抽棴 thinking 鏃舵鍓嶅彲鑳界渷鐣ュ弬鏁帮紝鐜版敼涓烘樉寮忓彂閫?`false`銆?
- 淇鏍囪礉鏄撻噰閾捐矾锛氬紑鍚?thinking 鏃舵鍓嶅彲鑳界渷鐣ュ弬鏁帮紝鐜版敼涓烘樉寮忓彂閫?`true`锛涘苟缁熶竴杩斿洖 `enableThinking/thinkingFallbackUsed/thinkingFallbackMode`銆?
- 琛ラ綈 defaults 鍙ｅ緞锛氭爣璐濇槗閲?defaults 鐨?`enableThinking` 鐜板湪璺熼殢鍚庣鐜榛樿鍊硷紝涓嶅啀鍥哄畾 `false`銆?
- 鏂囨。鍚屾锛?
  - `extension/README.md`
  - `extension/sites/alibaba-labelx/asr-judgement/README.md`
  - `extension/sites/alibaba-labelx/asr-transcription/README.md`
  - `extension/sites/data-baker/round-one-quality/README.md`
  - `extension/sites/magic-data/annotator/README.md`
  - `platform-resources/backend/README.md`
  - `AGENTS.md`

## 2026-05-13锛?.3.2锛氬畬鍠?ASR 璇煶 AI 璁剧疆 defaults/override 鍙ｅ緞锛?

- 淇濇寔 `extension/manifest.json` 鐗堟湰 `0.3.2` 涓嶅彉锛屾湰杞睘浜庡綋鍓嶆祴璇曠増鏈缃儴浠跺畬鍠勪笌鍚庣 defaults 瀵归綈銆?
- 閫氱敤"ASR 璇煶 AI 璁剧疆"閮ㄤ欢鏇存柊锛?
  - 鍒犻櫎闈㈡澘鍐?瀹夊叏杈圭晫"灞曠ず鍖猴紙浠呯Щ闄?UI锛屽畨鍏ㄨ鍒欎粛淇濈暀鍦ㄤ唬鐮佷笌鏂囨。锛夈€?
  - 鍒犻櫎鍓嶇 `response_format` 閰嶇疆鍏ュ彛锛涚粨鏋勫寲杈撳嚭鐢卞悗绔浐瀹氭帶鍒躲€?
  - 瑙ｉ攣鍚庢寜鑴氭湰璇锋眰鍚庣 `defaults` 鎺ュ彛锛岄潰鏉块粯璁ゆ樉绀哄悗绔綋鍓嶆ā鍨嬨€丳rompt 涓庣敓鎴愬弬鏁般€?
  - Prompt/鍙傛暟鏀逛负 override 璇箟锛氫笌榛樿涓€鑷存垨娓呯┖鏃朵笉淇濆瓨 override锛岃姹傛椂鐢卞悗绔粯璁ょ敓鏁堛€?
- 鍚庣鏂板/琛ラ綈 defaults 鎺ュ彛骞惰繑鍥?`defaults + supportedParams`锛?
  - `/api/alibaba-labelx/asr-judgement/ai/defaults`
  - `/api/alibaba-labelx/asr-transcription/ai/defaults`
  - `/api/data-baker/round-one-quality/ai/recommend/defaults`
  - `/api/magic-data/annotator/ai/defaults`
- 鍥涗釜 ASR 绫昏剼鏈粺涓€鎺ュ叆瀹屾暣璁剧疆閮ㄤ欢鏍峰紡锛堝揩鍒ゃ€佽浆鍐欍€佹爣璐濇槗閲囥€丮agic Data锛夛紝淇濇寔鑴氭湰绾ч厤缃簰涓嶄覆鐢ㄣ€?
- Magic Data 蹇嵎閿缃户缁父鏄撅紝涓嶅彈 AI 闅愯棌闈㈡澘褰卞搷銆?

## 2026-05-13锛?.3.2锛氶噸鏋勯€氱敤 ASR 璇煶 AI 闅愯棌璁剧疆閮ㄤ欢锛?

- 淇濇寔 `extension/manifest.json` 鐗堟湰 `0.3.2` 涓嶅彉锛屾湰杞睘浜庡綋鍓嶆祴璇曠増鏈?options 缁撴瀯閲嶆瀯涓庢枃妗ｅ悓姝ャ€?
- options 鏂板閫氱敤闅愯棌閮ㄤ欢锛歚ASR 璇煶 AI 璁剧疆`銆?
  - 缁熶竴鎸傝浇鍦ㄨ剼鏈鎯呴〉鏍囬鍖轰笅鏂广€佹櫘閫氳缃尯涔嬪墠銆?
  - 榛樿闅愯棌锛涘湪瀵瑰簲鑴氭湰璇︽儏椤垫爣棰樿繛缁偣鍑?10 娆★紙3 绉掔獥鍙ｏ級鍚庢樉绀恒€?
  - 瑙ｉ攣鐘舵€佷粎褰撳墠 options 椤甸潰浼氳瘽鏈夋晥锛屽埛鏂板悗鎭㈠闅愯棌銆?
- 宸叉帴鍏ヨ剼鏈細
  - 闃块噷 ASR 璇煶鍒ゅ埆锛坖udgement锛?
  - 闃块噷 ASR 璇煶杞啓锛坱ranscription锛?
  - 鏍囪礉鏄撻噰涓€妫€璐ㄦ锛坉ataBakerRoundOneQuality锛?
  - Magic Data ANNOTATOR锛坢agicDataAnnotatorAiReview锛?
- 灞曠ず鏀跺彛锛?
  - 蹇垽銆佹爣璐濇槗閲囥€丮agic Data 鐨?AI 妯″瀷/寮€鍏?瓒呮椂绛変笉鍐嶆暎钀藉湪鏅€氳缃尯锛岀粺涓€杩佸叆闅愯棌 AI 璁剧疆閮ㄤ欢銆?
  - 蹇垽鏅€氬尯浠呬繚鐣?AI 鍗婅嚜鍔ㄥ弬鑰冨缓璁负榛樿鑳藉姏銆佷粎鎵嬪姩瑙﹀彂"鐨勮鏄庛€?
  - Magic Data 蹇嵎閿缃敼涓哄父鏄撅紝涓嶅啀榛樿鎶樺彔锛屼篃涓嶅彈 AI 闅愯棌鏈哄埗褰卞搷銆?
- 閰嶇疆闅旂锛?
  - 閫氱敤 UI 閮ㄤ欢澶嶇敤锛屼絾鎸夎剼鏈嫭绔嬭鍙?淇濆瓨鍘熸湁瀛樺偍璺緞锛屼笉鍋氬叏灞€ AI 閰嶇疆澶嶇敤銆?
  - 蹇垽缁х画寮哄埗 `aiSuggestionEnabled=true`锛涙爣璐濇槗閲?Magic Data 浠嶅彲鍦ㄩ殣钘?AI 璁剧疆涓皟鏁村叾 AI 寮€鍏炽€?
- 鏂囨。鍚屾锛?
  - `extension/README.md`
  - `extension/sites/alibaba-labelx/asr-judgement/README.md`
  - `extension/sites/alibaba-labelx/asr-transcription/README.md`
  - `extension/sites/data-baker/round-one-quality/README.md`
  - `extension/sites/magic-data/annotator/README.md`
  - `AGENTS.md`

## 2026-05-13锛?.3.2锛氭暣鐞嗗揩鍒よ剼鏈骇 AI 楂樼骇璁剧疆骞跺己鍒跺惎鐢ㄥ崐鑷姩寤鸿锛?

- 淇濇寔 `extension/manifest.json` 鐗堟湰 `0.3.2` 涓嶅彉锛屾湰杞睘浜庡綋鍓嶆祴璇曠増鏈厤缃敹鍙ｅ寮恒€?
- 蹇垽 AI 鍗婅嚜鍔ㄥ缓璁敼涓洪粯璁ゅ己鍒惰兘鍔涳細
  - options 蹇垽璇︽儏椤电Щ闄?鍚敤 AI 寤鸿"寮€鍏筹紝浠呬繚鐣?鎵嬪姩瑙﹀彂銆佹墜鍔ㄩ噰鐢?鐨勮鏄庛€?
  - `shared/storage.js` normalize 闃舵寮哄埗 `aiSuggestionEnabled=true`锛堝吋瀹规棫瀛樺偍鐨?`false` 鍊硷級銆?
  - 蹇垽杩愯鏃朵笉鍐嶅洜涓?`aiSuggestionEnabled=false` 鎷掔粷璇锋眰銆?
- 蹇垽璇︽儏椤垫柊澧為殣钘忓叆鍙ｏ細
  - 鍦?闃块噷ASR璇煶鍒ゅ埆"鏍囬杩炵画鐐瑰嚮 10 娆★紙3 绉掔獥鍙ｏ級鍚庢樉绀?`AI 楂樼骇璁剧疆锛堥樋閲孉SR璇煶鍒ゅ埆锛塦銆?
  - 瑙ｉ攣鐘舵€佸彧鍦ㄥ綋鍓?options 椤甸潰浼氳瘽鏈夋晥锛屽埛鏂板悗鎭㈠闅愯棌銆?
- 鏂板蹇垽鑴氭湰绾?AI 楂樼骇瀛楁锛堢嫭绔嬩繚瀛樺湪蹇垽 `asrConfig`锛夛細
  - `aiSuggestionListenPrompt` / `aiSuggestionComparePrompt`
  - `aiSuggestionTemperature` / `aiSuggestionTopP`
  - `aiSuggestionMaxTokens` / `aiSuggestionMaxCompletionTokens`
  - `aiSuggestionPresencePenalty` / `aiSuggestionFrequencyPenalty`
  - `aiSuggestionSeed` / `aiSuggestionResponseFormat` / `aiSuggestionStopSequences`
  - `aiSuggestionEnableThinking`锛堜繚鐣欙級
- 鍓嶅悗绔弬鏁扮櫧鍚嶅崟鍚屾锛?
  - 鍓嶇鎸?`JUDGEMENT_AI_ADVANCED_PARAM_DEFINITIONS` 鍐冲畾鏄剧ず涓庢彁浜わ紱涓嶆敮鎸佸弬鏁颁笉鏄剧ず銆?
  - 鍚庣 `ai-routes.js` + `ai-client-qwen.js` 鍙屽眰杩囨护锛屼粎鍏佽鐧藉悕鍗曞瓧娈佃繘鍏ユā鍨嬭姹備綋锛涗笉鏀寔瀛楁蹇界暐锛屼笉閫忎紶銆?
  - `response_format=text` 鏃朵笉鍙戦€?`json_object`锛沗stop` 鏈€澶?8 鏉°€佹瘡鏉℃渶澶?80 瀛楋紱鏁板€煎弬鏁版寜鑼冨洿褰掍竴鍖栥€?
- 蹇垽璇锋眰浣撴柊澧炶剼鏈骇 `aiOptions`锛屽苟缁х画淇濈暀 `listenModel/compareModel/includeContext` 绛変富瀛楁锛岀‘淇濆吋瀹瑰綋鍓嶉摼璺€?
- `ai-prompt.js` 鏀寔 `listenPrompt/comparePrompt` 瑕嗙洊锛屼絾鍚庣浼氳拷鍔犲畨鍏ㄨ竟鐣岋紙鍙緭鍑?JSON銆佸浐瀹?answer 鏋氫妇銆佺姝㈡晱鎰熶俊鎭級銆?
- 鏂囨。鍚屾锛?
  - `extension/sites/alibaba-labelx/asr-judgement/README.md`
  - `platform-resources/backend/README.md`
  - `AGENTS.md`

## 2026-05-13锛?.3.2 鐑慨锛氭敹鍙ｅ揩鍒?AI 绛旀鏋氫妇涓庢牸寮忓樊寮傚垽瀹氾級

- 淇濇寔 `extension/manifest.json` 鐗堟湰 `0.3.2` 涓嶅彉锛屾湰杞睘浜庡綋鍓嶆祴璇曠増鏈皬淇€?
- 蹇垽鍚庣鍝嶅簲 schema 鏀跺彛锛?
  - `answer` 浠嶅彧鍏佽 `first_better/second_better/both_bad/uncertain_or_similar/other_dialect_or_language`銆?
  - `answerText` 鏀逛负鍚庣鍥哄畾鏄犲皠浜旈€変竴锛屼笉鍐嶅厑璁告ā鍨嬭繑鍥炴枃妗堣鐩栵細
    - `first_better -> 绗竴涓洿濂絗
    - `second_better -> 绗簩涓洿濂絗
    - `both_bad -> 閮戒笉濂絗
    - `uncertain_or_similar -> 涓嶇‘瀹氭垨宸笉澶歚
    - `other_dialect_or_language -> 鍏朵粬鏂硅█鎴栬绉峘
- 蹇垽 compare 瑙勫垯澧炲己锛氬綋涓ゆ潯 ASR 涓讳綋璇箟涓€鑷翠絾瀛樺湪鏍囩偣/绌烘牸/鏁板瓧/鏃ユ湡鏍煎紡宸紓鏃讹紝鑻ュ叾涓竴鏉℃槑鏄炬洿瑙勮寖锛屽繀椤婚€夋嫨瀵瑰簲鍊欓€夛紱涓嶈兘鎶?浠呮爣鐐逛笉鍚?涓€寰嬪垽涓?涓嶇‘瀹氭垨宸笉澶?銆?
- `compare-prompt-template.md` 鏂板鏍煎紡浼樺姡鍒ゅ畾瑙勫垯鍜?鏈虹エ鐤戦棶鍙?绀轰緥锛屽己璋冪ず渚嬭緭鍑轰粎鍖呭惈 `answer` 绛夌粨鏋勫寲瀛楁锛屼笉浣跨敤 `answerText`銆?
- `AGENTS.md` 涓庡揩鍒?README 鍚屾绋冲畾鍙ｅ緞锛氬缓璁瓟妗堜簲閫変竴鍥哄畾鏄犲皠锛岃В閲婃€ф枃瀛楀彧鏀?`reasonSummary`銆?

## 2026-05-13锛?.3.2锛氬揩鍒?AI 鍗囩骇鍙屾ā鍨嬪惉闊?姣旇緝涓庝笂鏂囧紑鍏筹級

- 淇濇寔 `extension/manifest.json` 鐗堟湰 `0.3.2` 涓嶅彉锛屾湰杞睘浜庡綋鍓嶆祴璇曠増鏈寮轰笌璐ㄩ噺淇銆?
- 蹇垽 AI 鍚庣浠庡崟妯″瀷鍗囩骇涓哄弻闃舵 pipeline锛?
  - 绗竴闃舵 `listen`锛氬惉闊虫ā鍨嬶紙榛樿 `qwen3.5-omni-flash`锛夊彧杈撳嚭鍚煶缁撴灉涓庨煶棰戞湁鏁堟€с€?
  - 绗簩闃舵 `compare`锛氭瘮杈冩ā鍨嬶紙榛樿 `qwen3.5-plus`锛夌粨鍚?`heardText + asrText1/asrText2 + 鍙€変笂鏂嘸 杈撳嚭"鍝釜鏇翠紭"寤鸿銆?
- 蹇垽 Qwen 瀹㈡埛绔柊澧炲弻妯″瀷鑳藉姏涓庨厤缃細
  - `ASR_JUDGEMENT_AI_LISTEN_MODEL`
  - `ASR_JUDGEMENT_AI_COMPARE_MODEL`
  - `ASR_JUDGEMENT_AI_TIMEOUT_MS`
  - `ASR_JUDGEMENT_AI_ENABLE_THINKING`
  - `ASR_JUDGEMENT_AI_ALLOW_CLIENT_MODEL_OVERRIDE`
  - 淇濈暀 `ASR_JUDGEMENT_AI_MODEL` 浣滀负 compare fallback 鍏煎瀛楁銆?
- 蹇垽鍚庣鏃ュ織琛ラ綈涓哄垎闃舵鑴辨晱鏃ュ織锛歚suggest start`銆乣listen start/success`銆乣compare start/success`銆乣suggest success/suggest failed`銆?
- 蹇垽鍓嶇 AI 鍗＄墖鍗囩骇锛?
  - 鐐瑰嚮鍚庣珛鍗虫樉绀?姝ｅ湪鍒嗘瀽褰撳墠棰?.."銆?
  - 鎴愬姛鏄剧ず鍚煶鏂囨湰銆佸缓璁瓟妗堛€佺疆淇″害銆侀闄╃瓑绾с€佸弻妯″瀷銆佽€楁椂銆乺equestId銆?
  - 澶辫触鏄剧ず閿欒鍗″拰閲嶈瘯鎸夐挳锛屼笉鍐嶉潤榛樸€?
  - 鏂板褰撳墠棰?浣跨敤涓婃枃鐞嗚В"寮€鍏筹紙榛樿鏈変笂鏂囨椂寮€鍚級锛屽紑鍏充粎杩愯鎬佺敓鏁堬紝鍒囨崲鍚庨渶"閲嶆柊鍒嗘瀽"鐢熸晥銆?
- options 蹇垽璁剧疆鏂板 AI 瀛楁锛?
  - 鍚煶妯″瀷锛堜笅鎷?+ 鑷畾涔夛級
  - 姣旇緝妯″瀷锛堜笅鎷?+ 鑷畾涔夛級
  - 鍚敤鎬濊€冨紑鍏?
  - 璇锋眰瓒呮椂锛堜繚鐣欙級
- 鏂囨。涓庤鍒欏悓姝ワ細
  - `extension/sites/alibaba-labelx/asr-judgement/README.md` 鏇存柊涓哄弻妯″瀷鍙ｅ緞鍜屼笂鏂囧紑鍏宠鏄庛€?
  - `platform-resources/backend/README.md`銆乣config/env/ai.env.example` 澧炶ˉ蹇垽鍙屾ā鍨嬬幆澧冨彉閲忋€?
  - `AGENTS.md` 娌夋穩"蹇垽 AI 鍙屾ā鍨?+ 涓婃枃浠呮秷姝?+ 褰撳墠棰樿繍琛屾€佸紑鍏?瑙勫垯銆?

## 2026-05-12锛?.3.2 鐑慨锛氬揩鍒?AI 鐪熷疄閾捐矾鏃犺繑鍥炴彁绀猴級

- 淇濇寔 `extension/manifest.json` 鐗堟湰 `0.3.2` 涓嶅彉锛屾湰杞负褰撳墠娴嬭瘯鐗堟湰 hotfix銆?
- 淇蹇垽 Qwen 闊抽杈撳叆鏍煎紡锛歚platform-resources/alibaba-labelx/asr-judgement/backend/ai-client-qwen.js` 浠?`audio_url` 鍒囨崲涓?`input_audio.data + input_audio.format`锛宍format` 鎸夐煶棰戝悗缂€鎺ㄦ柇锛坵av/mp3/aac/m4a/amr/3gp/3gpp锛岄粯璁?wav锛夈€?
- 澧炲己蹇垽鍚庣娴佸紡璇诲彇锛氭柊澧?`readStreamCompletion`锛岀粺涓€杩斿洖 `text/usage/firstChunkAtMs/chunkCount`锛屽苟鍏煎 SSE `data:`銆侀潪 stream 鍝嶅簲銆乣delta.content` 涓?`message.content` 鐨?string/array 褰㈡€併€?
- 淇 `enable_thinking` 鍏煎锛氬厛鎸夐厤缃彂閫?`enable_thinking`锛岃嫢涓婃父杩斿洖鍙傛暟涓嶆敮鎸?鏃犳晥锛岃嚜鍔ㄧЩ闄よ鍙傛暟閲嶈瘯涓€娆★紙闈炴棤闄愰噸璇曪級銆?
- 琛ラ綈鍚庣闃舵鏃ュ織锛堣劚鏁忥級锛歚suggest start`銆乣provider request start`銆乣provider response`銆乣provider stream complete`銆乣suggest success`銆乣suggest failed`銆?
- 琛ラ綈鍚庣閿欒鍥炰紶锛氱粺涓€杩斿洖 `code/message/requestId`锛屽苟鎸夋儏鍐佃繑鍥?`providerStatus/summary`锛岃鐩?`timeout/provider-http-error/empty-provider-response/invalid-model-json/invalid-model-schema/internal-error`銆?
- 鍓嶇 `judgement-ai-suggestion.js` 澧炲姞鐘舵€佸弽棣堬細鐐瑰嚮鍗虫覆鏌?姝ｅ湪鍒嗘瀽褰撳墠棰?.."鍗＄墖锛涙垚鍔熸浛鎹㈠缓璁崱锛涘け璐ユ垨瓒呮椂鏇挎崲閿欒鍗★紙閲嶈瘯/蹇界暐锛夛紝骞?toast 鏄剧ず澶辫触鍘熷洜銆?
- 鍓嶇澧炲姞鍚岄闃插苟鍙戯細褰撳墠棰樺垎鏋愪腑閲嶅瑙﹀彂浼氭彁绀?褰撳墠棰?AI 鍒嗘瀽涓紝璇风◢鍊?锛屼笉骞跺彂鍙戠浜屼釜璇锋眰銆?
- `content.js` 澧炲姞鍙戣捣鍗虫彁绀猴細宸ュ叿鏍忔寜閽垨蹇嵎閿Е鍙?AI 鏃剁珛鍗虫彁绀?AI 鍒嗘瀽宸插紑濮嬶紝璇风瓑寰呯粨鏋溿€?銆?
- 鏈疆鏄庣‘鐪熷疄楠屾敹瑕佹眰锛歚GET /api/alibaba-labelx/asr-judgement/ai/health` 闇€纭 `mockEnabled=false`锛屼笉寰椾互 mock 缁撴灉浠ｆ浛鐪熷疄 Qwen 璋冪敤楠岃瘉銆?

## 2026-05-12锛?.3.2 鐑慨锛氬揩鍒ゅ樊寮傝鍥惧吋瀹规柊鐗堝唴瀹瑰尯锛?

- 淇濇寔 `extension/manifest.json` 鐗堟湰 `0.3.2` 涓嶅彉锛屾湰杞负褰撳墠娴嬭瘯鐗堟湰灏忎慨銆?
- 淇 `judgement-asr-diff-view.js` 鐨?ASR 鍐呭鍧楄瘑鍒細涓嶅啀浠呬緷璧栨爣棰?`涓や釜ASR鏂囨湰`锛屾柊澧炲吋瀹?`online_rec` / `online_recognition` / `asr` / `asr_text`锛屽苟鏈€缁堜互 `asr_text1/asr_text2` 鍙В鏋愪綔涓哄垽瀹氥€?
- 鏄庣‘蹇界暐鏂扮増鍐呭鍖轰腑鐨?`涓婃枃`銆乣闊抽鍦板潃`銆乣wav_id`锛堜互鍙?`闊抽`銆乣闊抽鏂囦欢`锛夊潡锛岄伩鍏嶈鎶婇暱涓婁笅鏂囧綋浣?ASR 鏂囨湰銆?
- 宸紓瑙嗗浘缁х画浠呴殣钘忕湡姝?ASR 鏂囨湰鍧楃殑鍘熷 `.dt-text-wrapper`锛屼笉闅愯棌 `涓婃枃` 鍐呭鍧椼€?
- 鍚屾淇渚濊禆鍚岀被瀹氫綅閫昏緫鐨勬ā鍧楋細
  - `judgement-compact-card.js`
  - `judgement-thunder-question.js`
  - `judgement-ai-suggestion.js`
  浠ヤ笂妯″潡鍧囨敼涓哄吋瀹?`online_rec` 骞朵互 `asr_text1/asr_text2` 瑙ｆ瀽鎴愬姛涓哄噯銆?
- 鏂囨。鍚屾锛?
  - `extension/sites/alibaba-labelx/asr-judgement/README.md` 琛ュ厖鏂扮増缁撴瀯鍏煎瑙勫垯銆?
  - `platform-resources/alibaba-labelx/asr-judgement/page-structure/asr-judgement-detail/page-meta.md` 琛ュ厖"涓婃枃 + online_rec + wav_id"缁撴瀯涓庨€夋嫨鍣ㄥ缓璁€?

## 2026-05-12锛?.3.2锛氶樋閲岃浆鍐欏綋鍓嶉 AI 鎺ㄨ崘绗竴鐗堬級

- 鐗堟湰鍗囩骇锛歚extension/manifest.json` 浠?`0.3.1` 鎻愬崌鍒?`0.3.2`锛堟柊澧炵敤鎴峰彲瑙佸姛鑳斤級銆?
- 鍓嶇鏂板杞啓 AI 妯″潡锛?
  - `extension/sites/alibaba-labelx/asr-transcription/ai-suggestion-client.js`
  - `extension/sites/alibaba-labelx/asr-transcription/ai-suggestion-collector.js`
  - `extension/sites/alibaba-labelx/asr-transcription/ai-suggestion-panel.js`
- 杞啓宸ュ叿鏍忔柊澧?AI鎺ㄨ崘 / 濉叆AI"鍔ㄤ綔锛屼笖浠呬綔鐢ㄤ簬褰撳墠棰橈紱濉叆鍚庡彧鍐欏綋鍓?textarea 骞惰Е鍙?`input/change`锛屼笉鑷姩淇濆瓨/鎻愪氦/娴佽浆銆?
- 杞啓蹇嵎閿柊澧烇細
  - `shortcutAiSuggest`
  - `shortcutApplyAiSuggestion`
- 鍚庣鏂板杞啓 AI 鎺ュ彛锛?
  - `GET /api/alibaba-labelx/asr-transcription/ai/suggest-current/health`
  - `POST /api/alibaba-labelx/asr-transcription/ai/suggest-current`
- 鍚庣鏂板杞啓 AI 鏂囦欢锛?
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-routes.js`
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-client-qwen.js`
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-prompts.js`
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-response-schema.js`
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-call-log.js`
  - `platform-resources/alibaba-labelx/asr-transcription/ai-rules.md`
- Qwen 璋冪敤鍙ｅ緞锛氶粯璁?`qwen3.5-omni-flash`锛堝惉闊筹級+ `qwen3.5-plus`锛堟枃鏈瘮杈冿級锛涙敮鎸?`response_format: { type: \"json_object\" }`锛屽苟鍦?`enable_thinking` 涓嶆敮鎸佹椂鎸?绉婚櫎/鍏抽棴鍙傛暟閲嶈瘯"鍏滃簳銆?
- 闄嶇骇绛栫暐锛氶煶棰戜笉鍙敤鎴栨ā鍨嬫棤娉曡闂煶棰戞椂锛屽厑璁稿洖閫€鍒扮函鏂囨湰姣旇緝锛岃繑鍥炲彲璇婚敊璇?椋庨櫓鎻愮ず锛屼笉闃绘柇椤甸潰鎵嬪伐鎿嶄綔銆?
- 瀹夊叏涓庤劚鏁忥細API Key 浠呭悗绔鍙栵紱鏃ュ織浠呰褰?requestId/hostname/妯″瀷/鑰楁椂/缁撴灉锛屼笉璁板綍瀹屾暣闊抽 URL銆乧ookie銆乼oken銆乤uthorization銆丄PI Key銆?
- 鏂囨。鍚屾锛?
  - `AGENTS.md` 澧炲姞"杞啓鍏佽褰撳墠棰?AI 鎺ㄨ崘锛堜汉宸ョ‘璁ゅ～鍏ワ級"瑙勫垯銆?
  - `extension/sites/alibaba-labelx/asr-transcription/README.md` 澧炲姞 AI 鎺ㄨ崘鑳藉姏銆佹帴鍙ｄ笌瀹炴祴娓呭崟銆?
  - `platform-resources/backend/README.md`銆乣platform-resources/alibaba-labelx/asr-transcription/backend/README.md` 澧炲姞 AI 鎺ュ彛涓庣幆澧冨彉閲忋€?
  - `config/env/ai.env.example` 澧炲姞 `ASR_TRANSCRIPTION_AI_*` 鍗犱綅鍙橀噺銆?

## 2026-05-12锛堝崗浣滆鍒欐敹鍙ｏ細榛樿 main 鍗曞伐浣滃尯锛?

- `AGENTS.md` Git 宸ヤ綔娴佹敼涓?榛樿 `main` 鍗曞伐浣滃尯寮€鍙?锛氶粯璁や笉寤哄垎鏀€佷笉寤虹嫭绔?worktree銆佷笉寤?PR銆?
- 鏂板榛樿鏆楀彿浣撶郴锛歚ASC_MAIN_TASK`銆乣ASC_MAIN_HOTFIX`銆乣ASC_RELEASE`銆乣ASC_BRANCH_TASK`銆乣ASC_READONLY`銆乣ASC_ABORT_IF_DIRTY`銆?
- `ASC_NEW_BRANCH` / `ASC_CONTINUE_BRANCH` / `ASC_RELEASE_MERGE` 淇濈暀涓哄巻鍙插吋瀹硅瘑鍒紝鏄庣‘"涓嶅啀浣滀负榛樿娴佺▼"銆?
- `AGENTS.md` 骞惰寮€鍙戝彛寰勮皟鏁翠负"浠呭湪鐢ㄦ埛鏄庣‘瑕佹眰鏃跺惎鐢ㄥ垎鏀?+ worktree"锛屽苟瑕佹眰澹版槑鐩綍銆佺櫧鍚嶅崟銆佺姝㈣寖鍥淬€乸ush 鐩爣銆?
- `AGENTS.md` Prompt 蹇呭瀛楁鏇存柊锛氳ˉ鍏呭綋鍓嶅伐浣滅洰褰曘€佸綋鍓嶅垎鏀€佹槸鍚﹀厑璁稿垱寤哄垎鏀€佹槸鍚﹀厑璁哥洿鎺ユ敼 main銆佹槸鍚﹀厑璁哥敓鎴?CRX銆佹枃浠剁櫧鍚嶅崟涓?push 鐩爣鍒嗘敮銆?
- `AGENTS.md` 鏂板 Magic Data 绋冲畾鍙ｅ緞锛堣剼鏈?鍚庣璺緞銆侀〉闈㈡寕杞戒綅缃€佽鍒欎紭鍏堣川妫€銆佹敹鐩婁及绠楀拰瀹夊叏杈圭晫锛夈€?
- `README.md` 缁存姢瑙勫垯鏈€灏忓悓姝ワ細榛樿涓嶅垱寤虹嫭绔?worktree锛屼粎鍦ㄧ敤鎴锋槑纭姹傛椂浣跨敤鍒嗘敮/worktree/PR 娴佺▼銆?

## 2026-05-12锛堟竻鐞嗘棫鍒嗘敮涓庢棫 worktree锛?

- 宸茬‘璁?`feature/magic-data-ai-review-debug` 瀹屾暣鍚堝苟鍒?`main` 鍚庡啀鎵ц娓呯悊銆?
- 宸插垹闄ゆ棫 worktree锛歚C:\Projects\annotation-script-center-magic-data-ai-review`锛堥€氳繃 `git worktree remove`锛夈€?
- 宸插垹闄ゆ湰鍦板垎鏀細`feature/magic-data-ai-review-debug`銆?
- 宸插垹闄よ繙绔垎鏀細`origin/feature/magic-data-ai-review-debug`銆?
- 鍗忎綔鍙ｅ緞淇濇寔锛氶粯璁?`main` 鍗曞伐浣滃尯寮€鍙戯紱鍒嗘敮/worktree 浠呭湪鐢ㄦ埛鏄庣‘瑕佹眰鏃跺惎鐢ㄣ€?

## 2026-05-12锛?.3.1 鍙戝竷鍚堝苟锛歁agic Data AI 璐ㄦ鍔╂墜锛?

- 鍙戝竷鍚堝苟锛歚main` 鍚堝苟 `feature/magic-data-ai-review-debug`锛屽紩鍏?Magic Data ANNOTATOR 鍓嶅悗绔兘鍔涖€?
- 鐗堟湰鍗囩骇锛歚extension/manifest.json` 浠?`0.3.0` 鎻愬崌鍒?`0.3.1`銆?
- 鍓嶇鎺ュ叆锛氭柊澧?`extension/sites/magic-data/annotator/`锛堥〉闈㈣瘑鍒€佹帴鍙ｄ紭鍏堥噰闆嗐€侀〉闈㈠唴璐ㄦ鍗＄墖銆佸揩鎹烽敭鎵ц涓庣劍鐐规仮澶嶃€佹ā鍨嬪弬鏁伴€忎紶锛夈€?
- 椤甸潰褰㈡€侊細`#/asrmark` 鍦ㄥ彸渚?鍙ュ瓙鍒楄〃"涓嬫柟鍥哄畾鏄剧ず `Magic Data AI 璐ㄦ缁撴灉` 鍗＄墖锛屼笉鍐嶄娇鐢ㄥ彸涓嬭鎮诞鍏ュ彛銆?
- 浜や簰澧炲己锛氳川妫€鍗＄墖鏀寔鎵嬪姩鎷栨嫿楂樺害涓庢寔涔呭寲锛屾敮鎸侀噸缃粯璁ら珮搴︼紱AI 缁撴灉浠呭湪鍗＄墖鍐呴儴鏇存柊锛屼笉鏂板寮圭獥澶ч潰鏉裤€?
- options/popup锛氭柊澧?Magic Data 骞冲彴鍗＄墖涓庤剼鏈缃叆鍙ｏ紝鏀寔鍚煶妯″瀷銆佽川妫€妯″瀷锛堜笅鎷?+ 鑷畾涔夛級銆佸惎鐢ㄦ€濊€冦€佸揩鎹烽敭閰嶇疆锛沺opup 鍙瘑鍒?Magic Data 椤甸潰鍛戒腑鐘舵€併€?
- 鍚庣鎺ュ叆锛氭柊澧?`platform-resources/magic-data/annotator/backend/`锛屽苟閫氳繃 `platform-resources/backend/registry.js` 娉ㄥ唽銆?
- Magic Data 鎺ュ彛锛歚GET /api/magic-data/annotator/ai/review-current/health`銆乣POST /api/magic-data/annotator/ai/review-current`銆?
- 瀹夊叏杈圭晫锛氫繚鎸?鍙緟鍔┿€佷笉鑷姩淇濆瓨/鎻愪氦/瀹℃牳/棰嗗彇"锛涙棩蹇椾笌鍝嶅簲缁х画鑴辨晱锛屼笉璁板綍瀹屾暣绛惧悕闊抽 URL銆乼oken銆乧ookie銆乤uthorization銆丄PI Key銆?
- 鍙戝竷浜х墿锛氭寜 CRX 璺緞鐢熸垚 `0.3.1` 涓変欢濂楋紙CRX / update.xml / crx-latest.json锛夛紝涓嶄娇鐢?zip 浣滀负姝ｅ紡鍙戝竷璺緞銆?

## 2026-05-11

- AGENTS 鍗忎綔瑙勫垯澧炲己锛氭柊澧?骞惰鍔熻兘寮€鍙戜笌鍔ㄦ€佺増鏈彿瑙勫垯"锛屾槑纭苟琛屼换鍔￠粯璁や娇鐢ㄧ嫭绔嬪垎鏀紙`feature/<鍔熻兘鍚?`銆乣fix/<淇鍚?`锛変笌鐙珛 `worktree`锛岀姝㈠ Agent 鍚屾椂鏀瑰悓涓€ `main` 宸ヤ綔鍖恒€?
- AGENTS 鍙戝竷瑙勫垯澧炲己锛氬苟琛屽姛鑳藉垎鏀笉鎻愬墠鏀?`manifest.version`銆佷笉鐢熸垚姝ｅ紡 CRX 涓変欢濂楋紱缁熶竴鍦ㄥ悎骞?`main` 鐨勫彂甯冮樁娈垫彁鍗?patch銆佺敓鎴?CRX 涓変欢濂楀苟鎵?tag锛堝 `v0.3.1`锛夈€?
- AGENTS Prompt/楠屾敹瑙勫垯澧炲己锛氬苟琛屽紑鍙?Prompt 蹇呴』鍖呭惈鍒嗘敮/宸ヤ綔鐩綍/鐧藉悕鍗?绂佹鑼冨洿/push 鐩爣鍒嗘敮锛涘苟琛岄獙鏀跺厛鏌ュ姛鑳藉垎鏀紝鍙戝竷鍚堝苟闃舵鍐嶆煡 `main`銆佺増鏈€丆RX 涓変欢濂楀拰 tag銆?

- README 鏀跺熬淇锛氶《閮?褰撳墠閲嶇偣"鏀逛负 `0.3.0` 绋冲畾楠屾敹瀹屾垚鍙ｅ緞锛屼笉鍐嶄繚鐣?绗簩杞嚜鍔ㄦ洿鏂版柟妗堜粎鍋氭枃妗ｈ璁?鐨勬棫鎻忚堪銆?
- README 绔犺妭璋冩暣锛氬皢"绗簩杞柟妗堬紙浠呮枃妗ｏ紝涓嶅湪鏈疆瀹炵幇锛?鏀逛负"CRX 鍙戝竷涓庤嚜鍔ㄥ畨瑁呯姸鎬?锛屾槑纭?CRX 涓変欢濂?+ ops_monitor 绛栫暐鍐欏叆宸插畬鎴愶紝浼佷笟鎵樼鑷姩瀹夎鏆傛寕璧蜂笖涓嶉樆濉?0.3.0"銆?

- 鏂板鏈畬鎴愭ā鍧楁枃妗ｏ細`docs/unfinished/crx-enterprise-managed-install.md`锛屾槑纭褰?鏅€氶潪浼佷笟鎵樼 Windows 璁惧浼氭嫤鎴嚜鎵樼 CRX force_installed 鑷姩瀹夎"鐨勭幇瀹為樆濉炵偣銆?
- 鏂囨。鍚屾锛歚README.md` 鏂板"CRX 浼佷笟鑷姩瀹夎璇存槑"骞堕摼鎺ユ湭瀹屾垚妯″潡鏂囨。锛沗AGENTS.md` 鏂板瑙勫垯"璇ユā鍧椾笉浣滀负 0.3.0 闃诲椤癸紝鎭㈠鍓嶅繀椤诲厛璇绘湭瀹屾垚妯″潡鏂囨。"銆?
- 褰撳墠 `0.3.0` 瀹屾垚鏍囧噯鏄庣‘涓猴細CRX 涓変欢濂楀彂甯冭兘鍔?+ 绛栫暐鍐欏叆鑳藉姏锛涗紒涓氭墭绠¤嚜鍔ㄥ畨瑁呮殏鎸傝捣锛屼笉闃诲 0.3.0 鍙戝竷銆?

- 鍙戝竷浜х墿杩借釜瑙勫垯璋冩暣锛歚.gitignore` 鍙栨秷鍏ㄥ眬 `*.crx` 蹇界暐锛屾敼涓?`dist` 鐧藉悕鍗曡拷韪?CRX 涓変欢濂楋紙`annotation-script-center-v*.crx`銆乣annotation-script-center-update.xml`銆乣annotation-script-center-crx-latest.json`锛夛紝鐢ㄤ簬鍚庣画涓婁紶 `https://script.xiangtianzhen.store/downloads/`銆?
- 瀹夊叏瑙勫垯淇濇寔涓嶅彉锛氱户缁拷鐣?`config/secrets/*.pem|*.key|*.p12` 涓庣鏈?env 鏂囦欢锛岀閽ヤ笉寰楁彁浜ゃ€?
- 鏂囨。鍚屾鏇存柊锛歚README.md`銆乣extension/README.md`銆乣AGENTS.md` 宸叉敼涓?3.0 璧峰厑璁歌拷韪苟鎻愪氦 CRX 涓変欢濂楋紱鍏朵粬 dist 涓存椂浜х墿榛樿涓嶆彁浜?鍙ｅ緞銆?

- CRX 浼佷笟鍙戝竷鑳藉姏锛氭柊澧?`scripts/package-crx-release.js`锛屽彲鍩轰簬 `extension/manifest.json` 鐗堟湰鍜屽浐瀹氱閽?`config/secrets/annotation-script-center.pem` 鐢熸垚 `dist/annotation-script-center-v<version>.crx`銆乣dist/annotation-script-center-update.xml`銆乣dist/annotation-script-center-crx-latest.json`銆?
- CRX 鑴氭湰鏀寔娴忚鍣ㄨ矾寰勪紭鍏堢骇锛歚ASC_CHROME_EXE` > Chrome/Edge 甯歌瀹夎璺緞鑷姩鎺㈡祴锛涙敮鎸?`ASC_DOWNLOAD_BASE_URL` 瑕嗙洊涓嬭浇鍓嶇紑锛屾敮鎸?`--notes` 鍐欏叆鍙戝竷璇存槑銆?
- CRX 鑴氭湰澧炲姞鍙戝竷鍚庤嚜妫€锛氭牎楠?`crx-latest.json` 蹇呭～瀛楁銆乣sha256` 64 浣?hex锛屼互鍙?`update.xml` 鐨?`appid/version/codebase` 涓€鑷存€э紱骞惰緭鍑洪渶瑕佷笂浼犲埌 `downloads` 鐨勪笁涓枃浠惰矾寰勩€?
- `extension/manifest.json` 鏂板骞朵繚鐣?`update_url`锛歚https://script.xiangtianzhen.store/downloads/annotation-script-center-update.xml`銆?
- 娓呯悊 zip 鍙戝竷璺嚎锛氬垹闄?`scripts/generate-release-manifest.js`銆佸垹闄?`dist/annotation-script-center-latest.json`锛屾枃妗ｄ笉鍐嶆妸 zip 浣滀负姝ｅ紡鏇存柊鏂瑰紡銆?
- `.gitignore` 淇濈暀 `config/secrets/*.pem|*.key|*.p12` 蹇界暐瑙勫垯锛沗config/secrets/README.md` 缁х画璇存槑绉侀挜闀挎湡淇濈瑕佹眰锛堜笉鎻愪氦鐪熷疄绉侀挜锛夈€?
- 鏂囨。鍚屾锛歚README.md`銆乣extension/README.md`銆乣AGENTS.md` 鏀舵暃涓?3.0 姝ｅ紡鍙戝竷榛樿 CRX 涓変欢濂楋紱zip 浠呬綔涓哄巻鍙查仐鐣欒鏄庯紝涓嶄綔涓烘寮忓彂甯冨拰鑷姩鏇存柊璺緞銆?

- 0.3.0 閰嶇疆浣撻獙浼樺寲锛氱粺涓€椤圭洰鏁版嵁涓嬭浇绉佹湁閰嶇疆鏂囦欢妯℃澘锛屾柊澧?`config/env/backend.env.example`锛屾彁渚?`ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256` 涓?`ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET` 绀轰緥鍗犱綅銆?
- 鍚庣鐜鍔犺浇椤哄簭鍗囩骇锛歚platform-resources/backend/env-loader.js` 榛樿鏀逛负浼樺厛璇诲彇 `config/env/backend.env`銆乣config/env/backend.local.env`锛屽苟淇濇寔 `ai.env` / `ai.local.env` / `.env.local` / `ASC_ENV_FILE` 鍏煎銆?
- `.gitignore` 琛ュ厖蹇界暐 `config/env/backend.env`銆乣config/env/backend.local.env`锛屽苟鍏佽鎻愪氦妯℃澘 `config/env/backend.env.example`銆?
- 鏂囨。鍚屾锛氭洿鏂?`README.md` 涓?`platform-resources/backend/README.md` 鐨勯」鐩暟鎹笅杞介厤缃暀绋嬶紝琛ュ厖鍒涘缓 backend.env銆佺敓鎴愬瘑鐮?hash銆佺敓鎴愰殢鏈?JWT secret銆丩inux/PM2 閲嶅惎涓?`project-data-download-auth-not-configured` 鎺掓煡銆?
- `config/env/ai.env.example` 澧炲姞鎻愮ず娉ㄩ噴锛氶」鐩暟鎹笅杞介厤缃簲鏀惧湪 `backend.env`锛孉I 閰嶇疆缁х画鏀惧湪 `ai.env`銆?

## 2026-05-10

- 0.3.0 娴嬭瘯鐗?BUG 淇锛氫慨澶?`extension/background/service-worker.js` 鐨?`importScripts` 璺緞锛屾敼涓?MV3 service worker 鍙姞杞界殑鏍圭浉瀵硅矾寰?`shared/constants.js`銆乣shared/storage.js`锛岄伩鍏嶆墿灞曞悗鍙版姤 `Failed to execute 'importScripts' ... constants.js failed to load`銆?
- 0.3.0 闅愯棌鍏ュ彛閫昏緫淇锛歰ptions 棣栭〉涓嶅啀"鐐瑰嚮 1 娆℃樉绀哄垏鎹?锛屾敼涓鸿繛缁偣鍑?鍚庣鎺ュ彛鍦板潃"鏂囨 10 娆″悗锛屽悓鏃舵樉绀?鏈嶅姟鍣?鏈満"鍒囨崲鎸夐挳涓?椤圭洰鏁版嵁涓嬭浇"闈㈡澘銆?
- 0.3.0 榛樿鍚庣妯″紡淇锛歰ptions 鍒濆鍖栭樁娈靛皢 `meta.backendEndpointMode` 褰掍竴鍒?`server`锛岀‘淇濋殣钘忓叆鍙ｆ湭瑙ｉ攣鏃堕粯璁や粛涓烘湇鍔″櫒鍙ｅ緞銆?
- 鏂囨。琛ュ厖锛氬湪 `README.md` 涓?`platform-resources/backend/README.md` 鏂板"椤圭洰鏁版嵁涓嬭浇瀵嗙爜閰嶇疆鏁欑▼"锛岃鐩?PowerShell 鐢熸垚 SHA256銆乄indows 涓存椂/鎸佷箙鍖栥€丩inux/PM2銆乣project-data-download-auth-not-configured` 鎺掓煡鍜屽畨鍏ㄦ敞鎰忎簨椤广€?

- 鎵╁睍鐗堟湰鍗囩骇锛歚extension/manifest.json` 浠?`0.2.11` 鍗囩骇鍒?`0.3.0`锛岀敤浜庝氦浠?椤圭洰鏁版嵁涓嬭浇閴存潈涓庝緵搴斿晢绛涢€変笅杞?绗竴杞兘鍔涖€?
- options 棣栭〉鏀归€狅細
  - "鍚庣鎺ュ彛鍦板潃"榛樿浠呮樉绀烘枃妗堬紝鐐瑰嚮涓€娆℃枃妗堝悗鎵嶆樉绀?鏈嶅姟鍣?/ 鏈満"鍒囨崲鎸夐挳锛?
  - 杩炵画鐐瑰嚮鍚屼竴鏂囨 10 娆″悗锛岃В閿侀殣钘忛潰鏉?椤圭洰鏁版嵁涓嬭浇"锛?
  - 鏂板鑾峰彇浜哄鍚嶃€佹暟鎹被鍨嬨€佷緵搴斿晢鏉′欢娓叉煋銆佸鍑烘寜閽拰鐘舵€佹彁绀猴紱
  - 鑾峰彇浜哄鍚嶅彲淇濆瓨锛屼笅杞藉瘑鐮佷粎鍦ㄨ姹備綋浣跨敤锛屼笉淇濆瓨鍒?storage銆?
- 缁熶竴鍚庣鏂板鑱氬悎涓嬭浇妯″潡锛歚platform-resources/backend/project-data-download/`
  - 鏂板鎺ュ彛锛歚/api/admin/project-data-download/options`銆乣/request`銆乣/file`锛圙ET/HEAD锛夛紱
  - 浣跨敤鐜鍙橀噺 SHA256 瀵嗙爜鏍￠獙 + 鍐呯疆 `crypto` HMAC 鐭湡 token锛?20 绉掞級锛?
  - 涓夌被鏁版嵁闆嗙粺涓€涓嬭浇锛欰SR 蹇垽缁熻銆丄SR 杞啓缁熻銆佹爣璐濇槗閲囧鍑?latest锛?
  - 澶氫緵搴斿晢 CSV 寮哄埗鍏堥€変緵搴斿晢锛屾湇鍔＄绛涢€夊悗杈撳嚭 UTF-8 with BOM锛?
  - 涓嬭浇娴佺▼鏂板瀹¤鏃ュ織锛圛P銆佽幏鍙栦汉銆佹暟鎹被鍨嬨€佷緵搴斿晢銆佺姸鎬併€佹椂闂淬€乁A 绛夛級锛屼笉璁板綍 password/token 鍏ㄦ枃/cookie/authorization銆?
- 鍚庣鎺ュ叆涓庤鑼冿細
  - `platform-resources/backend/registry.js` 娉ㄥ唽 `project-data-download`锛?
  - `platform-resources/backend/server.js` 鍚姩鏃ュ織鏂板涓夋潯椤圭洰鏁版嵁涓嬭浇鎺ュ彛鎻愮ず锛?
  - `.gitignore` 鏂板 `platform-resources/backend/project-data-download/audit-data/`锛岄伩鍏嶆彁浜よ繍琛屽璁℃暟鎹€?
- 鏂囨。鍚屾锛?
  - 鏇存柊 `README.md`銆乣extension/README.md`銆乣platform-resources/backend/README.md`銆乣platform-resources/data-baker/round-one-quality/README.md`锛?
  - 绗簩杞?鑷姩鏇存柊鎵╁睍"浠呮矇娣€鏂规锛氭槑纭噰鐢?`XiangTianzhen/ops_monitor` 鏈湴 exe 璺嚎锛屾湰杞笉瀹炵幇璺ㄤ粨浠ｇ爜銆?

- 鏂囨。鍚屾锛氬叏浠?README 涓?`AGENTS.md` 绋冲畾瑙勫垯瀵归綈銆傞噸鐐逛慨姝ｈ浆鍐?蹇垽 backend README 涓?supplier 蹇呬紶涓嬭浇"鍜?suppliers 鐩綍涓诲啓鍏?鏃у彛寰勶紝缁熶竴涓烘牴绾ф€昏〃 `statistics-data/statistics-merged.csv` 涓诲瓨鍌ㄣ€乣/statistics/download` 榛樿鎬昏〃涓嬭浇銆?
- 鏂囨。鍚屾锛氫慨姝?README 涓棫"jitter 10 鍒嗛挓"涓庡苟鍙戜笂闄?`500` 鍙ｅ緞锛岀粺涓€涓哄畾鏃朵笂浼犲墠闅忔満寤惰繜 `0~300` 绉掞紙`100ms` 姝ヨ繘锛屾墜鍔ㄤ笂浼犱笉寤惰繜锛変笌鍔ㄦ€佸苟鍙戜笂闄?`999`銆?
- 鏈疆浠呬慨鏀?Markdown 鏂囨。锛圧EADME/log锛夛紝鏈慨鏀?JS/manifest锛屾湭鍗囩骇鐗堟湰锛屾湭鎵撳寘 dist銆?

- 鏂囨。娌荤悊锛氭洿鏂?`AGENTS.md` 鍗忎綔鍏ュ彛锛岃ˉ榻?`0.2.11` 绋冲畾缁熻瑙勫垯娌夋穩锛岃鐩?DevTools/Playwright 宸ヤ綔娴併€佹牴绾ф€昏〃涓诲瓨鍌ㄣ€佸垎鍖匢D鍞竴瀹氫綅銆乣existing/complete/upload` 璺宠繃涓庝笂浼犺竟鐣屻€丆SV UTF-8 with BOM 涓庡仴搴峰€艰鐩栬鍒欍€佷緵搴斿晢鍥為€€璇嗗埆銆佽繘搴︽偓娴獥涓庡姩鎬佸苟鍙戯紙`Math.floor(total/5)`锛屾渶灏?`1` 鏈€澶?`999`锛夈€佸畾鏃朵笂浼?`10:00/16:00` 涓?`0~300s`锛坄100ms` 姝ヨ繘锛夊欢杩熻鍒欍€?
- 鏈疆浠呮洿鏂版枃妗ｏ紙`AGENTS.md`銆乣log.md`锛夛紝鏈慨鏀?JS/鍚庣浠ｇ爜銆佹湭淇敼 `extension/manifest.json`銆佹湭鍗囩骇鐗堟湰銆佹湭鎵撳寘 dist銆?

- 缁х画淇濇寔 `extension/manifest.json` 鐗堟湰 `0.2.11`锛屼粎鍋氫笂浼犵粺璁¤繘搴︽偓娴獥鏍峰紡寰皟锛堜笉鏀圭粺璁′笟鍔￠€昏緫锛夈€?
- `shared/progress-indicator.js` 鎮诞绐椾綅缃笂绉诲埌椤甸潰椤堕儴涓棿闄勮繎锛坄top: 68px`锛夛紝骞跺鍔犲崱鐗囧唴杈硅窛涓庨棿璺濓紙`padding: 12px 16px`銆乣gap: 10px`锛夛紝鎻愬崌瀹屾垚鎬佸拰杩涜涓€侀槄璇昏垝閫傚害銆?

- 淇濇寔 `extension/manifest.json` 鐗堟湰 `0.2.11`锛屾湰杞笉鍗囩骇 `0.2.12`銆?
- 鍏变韩涓婁紶杩涘害缁勪欢 `extension/shared/progress-indicator.js` 鏀逛负"椤甸潰椤堕儴灞呬腑鎮诞绐?鏄剧ず锛坄position: fixed`锛夛紝涓嶅啀鎸ゅ崰 LabelX 椤堕儴宸ュ叿鏍忓竷灞€銆?
- 杩涘害杩涜涓?瀹屾垚/澶辫触缁熶竴浣跨敤鍚屼竴绱у噾鍗＄墖甯冨眬锛屽畬鎴愭€佷笉鍐嶅嚭鐜版í鍚戦摵婊＄殑缁胯壊闀挎潯銆?
- 涓婁紶鎸夐挳鐘舵€佹洿鏂颁笉鍐嶅啓鍏ラ暱 `title` 鏂囨锛岀Щ闄よ浆鍐?蹇垽鎸夐挳 tooltip 鍔ㄦ€佽祴鍊硷紝閬垮厤榧犳爣鎮仠鍑虹幇榛戣壊闀挎枃鏈銆?
- 杞啓涓庡揩鍒ょ户缁叡鐢ㄥ悓涓€ `shared/progress-indicator.js` 缁勪欢锛屼粎淇牱寮忥紝涓嶆敼缁熻涓氬姟閫昏緫銆乪xisting 鍒ゆ柇銆佸苟鍙戣鍒欍€佸畾鏃惰鍒欏拰鍚庣鎺ュ彛銆?

- 缁х画淇濇寔 `extension/manifest.json` 鐗堟湰 `0.2.11`锛屾湰杞笉鍗囩骇 `0.2.12`銆?
- 淇杞啓寰呰ˉ浠诲姟鍚嶇О閾捐矾锛歚enrichSubtaskData` 鏀逛负鍋ュ悍鏂囨湰浼樺厛锛坄detail -> summary -> taskMap` 澶氭簮鍥為€€锛夛紝骞惰ˉ鍏?`summary.name`銆乣taskMap.taskName/name`銆乣task.id` 绛夊€欓€夋潵婧愩€?
- 淇杞啓鍚堝苟閿鐢細鍚?`鍒嗗寘ID + role + subTaskId` 鍛戒腑鏃ц鏃朵紭鍏堝鐢ㄦ棫 mergeRow锛岄伩鍏?鏈瘑鍒緵搴斿晢鏃ц"涓?鏂拌瘑鍒緵搴斿晢鏂拌"骞跺瓨瀵艰嚧浠诲姟鍚嶇О濮嬬粓涓嶈ˉ榻愩€?
- 淇濇寔瑙勫垯锛歚exists=true` 涓嶇瓑浜?`complete=true`锛涗换鍔″悕绉颁负绌轰粛瑙嗕负 `complete=false`锛屽繀椤荤户缁媺璇︽儏骞朵笂浼犺ˉ榻愩€?
- 淇鍏变韩杩涘害缁勪欢鏍峰紡锛氭柊澧炲眳涓灞傚鍣紝杩涜涓?瀹屾垚鎬佷繚鎸佸悓涓€绱у噾鍗＄墖甯冨眬锛涘搴︽彁鍗囧埌 `560~860px` 骞舵敮鎸佹崲琛岋紝鍥涗綅鏁版垚鍔?澶辫触鏁板瓧鍙銆?
- 杞啓瀹屾垚鎬佹憳瑕佹枃妗堝帇缂╀负鏍稿績鏁板瓧锛堟壂鎻?琛ラ綈/涓婁紶/璺宠繃瀹屾暣/寰呰ˉ/搴熷純/澶辫触/骞跺彂锛夛紝閬垮厤瀹屾垚鎬佺豢鑹插潡琚秴闀挎枃鏈拺鍧忋€?
- 淇濇寔瑙勫垯锛氭棤寰呬笂浼犳暟鎹笉璋冪敤 `/statistics/upload`锛屾樉绀?宸插叏閮ㄥ畬鏁达紝鏃犻渶涓婁紶"銆?
- 涓诲瓨鍌ㄧ户缁繚鎸佹牴绾?`statistics-data/statistics-merged.csv`锛屼笉涓诲姩鐢熸垚 `statistics-data/suppliers/`銆?

- 缁х画淇濇寔 `extension/manifest.json` 鐗堟湰 `0.2.11`锛屼笉鍗囩骇 `0.2.12`锛屾湰杞仛鐒︾粺璁″皬淇銆?
- 鏂板缁熻 CSV 缁熶竴瀛楁娓呮礂锛氳浆鍐?蹇垽鍚庣鍐欏嚭鍓嶇粺涓€鍘?BOM銆佸幓棣栧熬绌虹櫧锛堝惈鍏ㄨ绌烘牸/Tab/鎹㈣/闆跺瀛楃锛夛紝浠诲姟鍚嶇О銆佷换鍔D銆佸瓙浠诲姟ID銆佸垎鍖匢D銆佷汉鍛樸€佹椂闂淬€佸畬鎴愮姸鎬併€佷緵搴斿晢閮戒笉鍐嶄繚鐣欏墠鍚庣┖鏍笺€?
- 淇渚涘簲鍟嗗洖閫€璇嗗埆锛氬綋鍓嶅悗绔?鍓嶇 helper 閬囧埌 `鏈瘑鍒緵搴斿晢` / `unknown-supplier` / 绌哄€兼椂锛屼笉鍐嶇洿鎺ユ部鐢紝缁熶竴鍥為€€鍒颁换鍔″悕绉伴噸鏂版帹鏂紙`妫嬬噴`銆乣甯屽皵璐濆３`锛夈€?
- 蹇垽缁熻涓婁紶鎺ュ叆鍏变韩杩涘害鏉?`shared/progress-indicator.js`锛屾樉绀洪樁娈点€佸畬鎴?鎬绘暟銆佺櫨鍒嗘瘮銆佸苟鍙戙€佹垚鍔?澶辫触锛屽苟鍦ㄤ笂浼犲畬鎴?澶辫触鍚庢樉绀烘憳瑕併€?
- 蹇垽璇︽儏鎶撳彇鏀逛负鎸?`recordCount` 鍒嗛〉琛ラ綈锛堜繚鎸?`pageSize=400` 鍙ｅ緞锛夛紝璇︽儏骞跺彂鏀逛负鍔ㄦ€?`Math.floor(total/5)`锛屾渶灏?`1`銆佹渶澶?`500`锛屼笌杞啓骞跺彂灞曠ず鍙ｅ緞涓€鑷淬€?
- 淇濇寔鎵╁睍鐗堟湰 `0.2.11` 涓嶅崌绾?`0.2.12`锛屼慨姝?LabelX 缁熻瀵煎嚭绛栫暐骞堕噸鏂版寜 `0.2.11` 鍙ｅ緞楠岃瘉涓庢墦鍖呫€?
- 淇杞啓缁熻杩涘害骞跺彂鏄剧ず锛氳鎯呴樁娈靛苟鍙戞敼涓?`Math.floor(total/5)`锛屾渶灏?`1`銆佹渶澶?`500`锛岃繘搴︽潯鏄剧ず骞跺彂涓庡疄闄呮墽琛屽苟鍙戜繚鎸佷竴鑷达紙渚嬪 `total=1854 -> 370`锛宍total=8000 -> 500`锛夈€?
- 淇渚涘簲鍟嗚瘑鍒ǔ瀹氭€э細`statistics-supplier.js` 涓?`supplier-utils.js` 缁熶竴浠诲姟鍚嶈鑼冨寲锛坉ecode + 娓呯悊鍓嶅悗绌虹櫧 + 杩炵画绌虹櫧瑙勬暣锛夛紝浼樺厛鎸変换鍔″悕鍖呭惈鍏崇郴璇嗗埆 `甯屽皵璐濆３` / `妫嬬噴`锛屼慨澶嶅墠瀵肩┖鏍间笌鍏ㄨ绌烘牸鍦烘櫙璇垽銆?
- 淇 LabelX 缁熻涓诲瓨鍌ㄥ彛寰勶細杞啓涓庡揩鍒ゅ悗绔富鍐欏叆鎭㈠涓烘牴绾?`statistics-data/statistics-merged.csv`锛宍/statistics/download` 榛樿涓嬭浇鎬昏〃锛屼笉鍐嶅己鍒?`supplier` 鍙傛暟锛涘巻鍙?`suppliers/<渚涘簲鍟?/statistics-merged.csv` 浠呭吋瀹硅鍙栬縼绉伙紝涓嶅垹闄ゆ棫杩愯鏁版嵁銆?
- 淇鍚庣鐩綍琛屼负锛歚ensureDataDir()` 涓嶅啀涓诲姩鍒涘缓 `statistics-data/suppliers/`锛屾柊涓婁紶浠呭啓鏍圭骇 `statistics-data/statistics-merged.csv`銆?
- 鏂板鍏变韩涓婁紶杩涘害缁勪欢 `extension/shared/progress-indicator.js`锛屽苟鎺ュ叆杞啓缁熻涓婁紶娴佺▼锛屽睍绀洪樁娈点€佸畬鎴愭暟/鎬绘暟銆佺櫨鍒嗘瘮銆佸苟鍙戙€佹垚鍔?澶辫触锛岄暱浠诲姟鏈熼棿涓嶅啀鍙樉绀?涓婁紶涓?銆?
- 淇杞啓缁熻鎶撳彇瀹屾暣鎬э細`transcription-stats-client.js` 绉婚櫎鏃х‖涓婇檺锛? 椤?50 瀛愪换鍔?300 璇︽儏锛夛紝鏀逛负鎸?`recordCount` 璁＄畻鍒嗛〉锛涢椤典笌璇︽儏鍒嗛〉淇濈暀淇濇姢闃堝€硷紝璇︽儏榛樿骞跺彂 `5`銆佷笂闄?`500`锛岃鎯呬紭鍏?`pageSize=5000` 骞跺湪蹇呰鏃剁户缁垎椤佃ˉ榻愩€?
- 淇杞啓鏈夋晥鏃堕暱鍙ｅ緞锛氫粎绱"鏄惁鏈夋晥"涓ユ牸绛変簬"鏈夋晥"鐨勯鐩椂闀匡紝涓嶄娇鐢?`includes(\"鏈夋晥\")`锛岄伩鍏?鏃犳晥"璇畻銆?
- 淇杞啓浜哄憳瑙ｆ瀽锛氭柊澧?`dataResultHistory` 鍏滃簳锛堜紭鍏?`type===0`锛屽惁鍒欐渶鍚庝竴鏉★級銆?
- 淇蹇垽缁熻閲囬泦骞跺彂涓庡垎椤典笂闄愶細棣栭〉鍒嗛〉淇濈暀淇濇姢闃堝€硷紝璇︽儏骞跺彂榛樿 `5`锛屼繚鎸佸揩鍒?`pageSize=400` 涓氬姟鍙ｅ緞涓嶅彉銆?
- 淇杞啓/蹇垽鍚庣 CSV 鍐欏嚭瑙勫垯锛氫緵搴斿晢淇℃伅浠嶄繚鐣欏湪鍐呴儴 payload/mergeKey/琛屾暟鎹腑鐢ㄤ簬闃插啿绐侊紱CSV 瀵煎嚭鏀逛负鍔ㄦ€佷緵搴斿晢鍒楋紙鍗曚緵搴斿晢涓嶈緭鍑猴紝澶氫緵搴斿晢鍦ㄦ渶鍚庝竴鍒楄拷鍔狅級銆?
- 鏂囨。鍚屾鏇存柊锛歚AGENTS.md`銆佹牴 `README.md`銆乣extension/README.md`銆乣platform-resources/backend/README.md`銆佽浆鍐?蹇垽妯″潡 README銆丩abelX 骞冲彴 README銆佽浆鍐欑粺璁＄瓥鐣ユ枃妗ｏ紝缁熶竴鍒?0.2.11 淇鍙ｅ緞銆?
- 鏈疆缁х画閬靛惊椤甸潰閲囬泦宸ヤ綔娴侊細缁撴瀯鍜?Network 閲囬泦浼樺厛 Chrome DevTools / MCP锛汸laywright Edge 浠呯敤浜庣湡瀹炴搷浣滈獙璇佹垨 DevTools 涓嶅彲鐢ㄥ厹搴曪紱Codex 浠呰礋璐ｆ墦寮€娴忚鍣紝鐧诲綍涓庤繘椤甸潰鐢辩敤鎴峰畬鎴愩€?

## 2026-05-09

- 淇鎵╁睍閲嶈浇鍚庣殑鏃ч〉闈㈠埛閿欙細`shared/storage.js` 鏂板鎵╁睍涓婁笅鏂囧彲鐢ㄦ€ф娴嬩笌 `EXTENSION_CONTEXT_INVALIDATED` 缁撴瀯鍖栭敊璇紝缁熶竴璇嗗埆 `Extension context invalidated`銆?
- 杞啓杩愯鏃剁敓鍛藉懆鏈熶慨澶嶏細`runtime-config.js` 瀵逛笂涓嬫枃澶辨晥鏀逛负涓€娆℃€?info + 瀹夊叏 fallback锛屼笉鍐嶆寜鏅€氳缃姞杞藉け璐ュ弽澶?`warn`銆?
- 杞啓 content runtime 鏂板 `extension-context-invalidated` 鍋滄満鍒嗘敮锛氬懡涓悗鍋滄宸ュ叿鏍?蹇嵎閿?缁熻璋冨害涓庨噸璇曡瀵熷櫒锛宍PANEL_PING` 杩斿洖"鎵╁睍涓婁笅鏂囧凡澶辨晥锛岃鍒锋柊椤甸潰"銆?
- 鏈疆浠嶄繚鎸?`extension/manifest.json` 鐗堟湰 `0.2.10`銆?

- 鏍囪礉鏄撻噰涓€妫€璐ㄦ鏂板"瀵煎嚭鍚庝笂浼犲悗绔?鑳藉姏锛歚group/detail` 瀵煎嚭鎬昏〃鐢熸垚 CSV 鍚庯紝淇濇寔鏈湴涓嬭浇锛屽悓鏃惰嚜鍔?`POST /api/data-baker/round-one-quality/export/upload` 涓婁紶銆?
- 鏂板 DataBaker 瀵煎嚭鍚庣妯″潡锛歚export-routes.js`銆乣export-store.js`锛岀粺涓€鎸傝浇鍒?`platform-resources/backend/server.js`锛屾彁渚?`health/config/upload/download(鍚?HEAD)/list`銆?
- 鏂板 DataBaker 瀵煎嚭淇濆瓨鐩綍锛歚platform-resources/data-baker/round-one-quality/backend/export-data/`锛岄粯璁ゅ啓 `latest.csv` 涓?`latest.json`锛屽彲閫氳繃鐜鍙橀噺寮€鍚?history/events銆?
- 鏀跺彛瀹夊叏杈圭晫锛氬鍑轰笂浼犲け璐ヤ笉闃绘柇鏈湴涓嬭浇锛涘悗绔檺鍒?`csvText` 鏈€澶?20MB锛涙棩蹇椾粎杈撳嚭 `requestId/rowCount/fileName/csvPath/uploadedAt`锛沗export-data` 宸插姞鍏?`.gitignore`銆?
- 鏈疆浠嶄繚鎸?`extension/manifest.json` 鐗堟湰 `0.2.10`銆?

- 閰嶇疆鏀跺彛锛氬垹闄?ASR 杞啓璇︽儏椤?杞啓缁熻瀵煎嚭"閰嶇疆鏉垮潡锛岀Щ闄?鍚敤杞啓缁熻涓婁紶"绛夊彲鍏抽棴鎺т欢锛岃浆鍐欓潰鏉夸粎淇濈暀鑷姩鎾斁銆佸€嶉€熴€佹闀裤€侀煶閲忓拰蹇嵎閿厤缃€?
- 閰嶇疆鏀跺彛锛氬揩鍒よ鎯呴〉绉婚櫎"鍚敤缁熻涓婁紶 / 鍚敤瀹氭椂涓婁紶"鍙叧闂帶浠讹紝缁熻涓婁紶鏀逛负鍙寮哄埗鍚敤璇存槑銆?
- 杩愯鏃舵敹鍙ｏ細杞啓涓庡揩鍒ょ粺璁′笂浼犳敼涓洪粯璁ゅ己鍒跺惎鐢紱宸插疄鐜板畾鏃朵笂浼犺兘鍔涚殑鑴氭湰锛屽畾鏃朵笂浼犱篃鎸夎剼鏈鍒欏己鍒跺惎鐢紝涓嶅啀鍙?options 寮€鍏虫帶鍒躲€?
- 瀛樺偍鏀跺彛锛歚shared/storage.js` 鍦ㄨ浆鍐?蹇垽 normalize 闃舵寮哄埗 `statsUploadEnabled=true`銆乣statsAutoUploadOnSchedule=true`锛屽拷鐣ユ棫瀛樺偍涓殑 `false`銆?
- 淇杞啓杩愯鏃舵姤閿欏彲璇绘€э細`runtime-config.js` 鏂板閿欒鎽樿涓庡畨鍏ㄥ洖閫€锛岄伩鍏嶆帶鍒跺彴鍑虹幇 `[ASR Edge][transcription] load settings failed [object Object]`锛屽姞杞藉け璐ユ椂鍥為€€鍒板畨鍏ㄩ粯璁ら厤缃苟缁х画杩愯銆?
- 鏈疆浠嶄繚鎸?`extension/manifest.json` 鐗堟湰 `0.2.10`銆?

- 缁熶竴鍚庣鎺ュ彛鍦板潃閰嶇疆鍏ュ彛锛歰ptions 棣栭〉椤堕儴"鍚庣鎺ュ彛鍦板潃"鏀逛负鍏ㄥ眬 `meta.backendEndpointMode`锛坄server/local`锛夛紝涓嶅啀閫氳繃 DataBaker 鑴氭湰瀛楁闂存帴鎵胯浇銆?
- 鍒犻櫎鑴氭湰璇︽儏椤甸噸澶?endpoint 閰嶇疆鎺т欢锛氱Щ闄よ浆鍐?涓婁紶鍦板潃"銆佸揩鍒?涓婁紶鎺ュ彛鍦板潃"鍜屽揩鍒?AI"鍚庣鎺ュ彛鍦板潃"杈撳叆銆?
- options 璇︽儏椤典粎淇濈暀涓氬姟寮€鍏冲拰鍙傛暟锛堣浆鍐?蹇垽/鏍囪礉锛夛紝鍚庣鍦板潃缁熶竴鍙璇存槑"鐢遍椤靛叏灞€鎺у埗"銆?
- 杞啓缁熻銆佸揩鍒ょ粺璁°€佸揩鍒?AI 寤鸿銆佹爣璐濇槗閲?AI 鎺ㄨ崘杩愯鏃剁粺涓€鏀逛负"鍏ㄥ眬 baseUrl + 鍥哄畾 API path"鎷兼帴锛屼笉鍐嶄互鑴氭湰绾?endpoint 瀛楁浣滀负杩愯鏃朵富鏉ユ簮銆?
- `shared/storage.js` 鏂板鏃у瓧娈佃縼绉伙細褰?`meta.backendEndpointMode` 缂哄け鏃讹紝浼氫粠鍘嗗彶 `statsUploadEndpoint/aiSuggestionEndpoint/aiRecommendEndpoint` 鎺ㄦ柇 `local/server`锛岄伩鍏嶆棫閰嶇疆鎶ラ敊銆?
- 鏈疆浠嶄繚鎸?`extension/manifest.json` 鐗堟湰 `0.2.10`銆?

- 淇 ASR 杞啓缁熻 CSV 瑙掕壊姹℃煋锛氬墠绔?`csvPatch` 鏀舵暃涓哄熀纭€瀛楁锛坄浠诲姟鍚嶇О/浠诲姟ID/鍒嗗寘ID/棰樻暟/鏈夋晥鏃堕暱(绉?`锛夛紝涓嶅啀鍐欏叆鏍囨敞/瀹℃牳瀛楁銆?
- 淇杞啓鍚庣鍚堝苟杈圭晫锛歚applyBasePatch` 蹇界暐鍏ㄩ儴瑙掕壊瀛楁锛涙爣娉?瀹℃牳瀛楁浠呭厑璁?`applyRoleRecord` 鎸?`role` 鍐欏叆銆?
- 淇 `role` 瀹归敊椋庨櫓锛歚roleRecord.role` 涓嶅啀榛樿鍥為€€ label锛岀己澶辨垨闈炴硶鏃剁洿鎺ユ嫆缁濆啓鍏ュ苟杩斿洖閿欒锛岄伩鍏嶈鎶婂鏍告暟鎹啓鍏ユ爣娉ㄥ垪銆?
- 鏈湴鑷祴瑕嗙洊 `audit-only` / `label-only` / `label->audit` / `audit->label` / 缂哄け role 浜旂鍦烘櫙锛岄獙璇佸垎鍖呭悎骞跺拰椤哄簭鏃犲叧鎬с€?
- 鏈疆浠嶄繚鎸?`extension/manifest.json` 鐗堟湰 `0.2.10`銆?

- 淇 ASR 杞啓缁熻涓婁紶璇锋眰椋庢毚椋庨櫓锛氳鎯呮姄鍙栦粠 `pageSize=10` 璋冩暣涓?`pageSize=100`锛屽苟澧炲姞 `maxPages=3`銆乣maxItems=300` 纭笂闄愩€?
- 淇璇︽儏鍒嗛〉鍋滄鏉′欢锛氶亣绌洪〉銆侀噸澶嶉〉绛惧悕銆乣recordCount` 缂哄け銆乣recordCount` 宸叉弧瓒虫垨杈惧埌涓婇檺鍗冲仠姝紝閬垮厤鐤戜技鏃犻檺寰幆璇锋眰銆?
- 淇棣栭〉鍒嗛〉鎶撳彇杈圭晫锛氬垪琛ㄥ垎椤垫渶澶?`5` 椤碉紝鍘婚櫎鏃х殑澶ц寖鍥村惊鐜瓥鐣ャ€?
- 鏂板棣栭〉閲囬泦闄愭祦锛氳鎯呰姹傚苟鍙戦檺鍒朵负 `2`锛屽崟娆′笂浼犳渶澶氬鐞?`50` 涓浆鍐欏瓙浠诲姟锛屽苟鎸夋竻娲楀悗鐨?`subTaskId` 鍘婚噸锛屽崟杞彧璇锋眰涓€娆¤鎯呫€?
- 鏂板涓婁紶浜掓枼閿佸弽棣堬細涓婁紶杩涜涓繑鍥?`upload-in-progress` + `skipped=true`锛屾墜鍔ㄨ繛鐐逛笌瀹氭椂瑙﹀彂涓嶄細骞跺彂绗簩杞笂浼犮€?
- 鍚屾琛ュ厖杞啓缁熻绛栫暐鏂囨。锛氭柊澧?`platform-resources/alibaba-labelx/asr-transcription/statistics.md`锛屽苟鏇存柊 `network.md` 涓庤浆鍐?README銆?
- 鏈疆浠嶄繚鎸?`extension/manifest.json` 鐗堟湰 `0.2.10`銆?

## 2026-05-08

- ASR 杞啓缁熻鍙栨暟鎸?`platform-resources/alibaba-labelx/asr-transcription/network.md` 淇锛氳鎯呮帴鍙ｅ垎椤佃В鏋愭敼涓?`data.dataList[]`锛屽苟淇濇寔 `pageSize=10` + `maxPages=20`銆?
- 杞啓缁熻鏂板璇︽儏椤靛厓淇℃伅鍚堝苟锛歚fetchSubtaskDetail` 浼氭妸鍒嗛〉棣栧睆 metadata锛坄taskId/batchId/taskName/status/gmtCreate/gmtCommit`锛変笌棣栭〉 summary 鍚堝苟锛岄伩鍏嶅彧鎷块鐩垪琛ㄥ鑷村瓧娈电己澶便€?
- ASR 杞啓鎭㈠杞婚噺璁剧疆闈㈡澘锛歰ptions 杞啓璇︽儏椤垫柊澧炶嚜鍔ㄦ挱鏀俱€侀粯璁ゅ€嶉€?閲嶇疆鍊嶉€熴€佸€嶉€熸杩涖€佸墠杩?鍚庨€€姝ラ暱銆侀粯璁ら煶閲忋€佸綋鍓嶉琛屼负鍜岃浆鍐欑粺璁′笂浼犻厤缃€?
- ASR 杞啓鎭㈠蹇嵎閿厤缃笌杩愯鏃讹細鏂板 `shortcut-bus.js`锛屼粎鏀寔褰撳墠淇濈暀鍔ㄤ綔锛堝惈"涓婁紶杞啓缁熻"锛夛紝骞跺姞鍏?杈撳叆妗嗘櫘閫氬瓧绗︿笉鎷︽埅"淇濇姢銆?
- `runtime-config.js` 鏀逛负璇诲彇 `scriptCenter.projects.transcription.asrConfig` 骞惰鑼冨寲瀹夊叏瀛楁锛屼笉鍐嶄粎浣跨敤鍥哄畾纭紪鐮佸€硷紱杞啓杩愯鏃跺弬鏁颁笌 options 淇濆瓨鍊兼墦閫氥€?
- `manifest.json` 涓鸿浆鍐欐敞鍏ラ摼璺柊澧?`sites/alibaba-labelx/asr-transcription/shortcut-bus.js`锛堝湪 `content.js` 鍓嶏級锛岀増鏈繚鎸?`0.2.10`銆?

- ASR 杞啓鏂板缁熻瀵煎嚭鑳藉姏锛氭柊澧?`transcription-stats-client.js`锛堟祻瑙堝櫒绔笂浼犲鎴风锛夛紝鎻愪緵椤堕儴"涓婁紶杞啓缁熻"鍏ュ彛銆佸伐鍏锋爮"涓婁紶缁熻"鍔ㄤ綔銆佸畾鏃朵笂浼犺皟搴︼紙榛樿 `10:00` / `16:00`锛宩itter `10` 鍒嗛挓锛夊拰涓婁紶鐘舵€佹彁绀恒€?
- ASR 杞啓鏂板鐙珛缁熻鍚庣锛氭柊澧?`platform-resources/alibaba-labelx/asr-transcription/backend/`锛屽寘鍚?`health/config/upload/download` 璺敱銆佸垎鍖呭悎骞躲€丆SV 鍐欏叆涓庝笅杞斤紱榛樿杈撳嚭 `statistics-data/statistics-merged.csv`銆?
- 杞啓缁熻 CSV 鍒楀浐瀹氫负锛歚浠诲姟鍚嶇О,浠诲姟ID,鏍囨敞瀛愪换鍔D,瀹℃牳瀛愪换鍔D,鍒嗗寘ID,棰樻暟,鏈夋晥鏃堕暱(绉?,鏍囨敞鍛?瀹℃牳鍛?鏍囨敞棰嗗彇鏃堕棿,鏍囨敞鎻愪氦鏃堕棿,瀹℃牳棰嗗彇鏃堕棿,瀹℃牳鎻愪氦鏃堕棿,鏍囨敞鏄惁瀹屾垚,瀹℃牳鏄惁瀹屾垚`锛屽悓涓€鍒嗗寘鎸?`mergeKey.batchId` 鍚堝苟鏍囨敞/瀹℃牳璁板綍銆?
- 缁熶竴鍚庣娉ㄥ唽鏂板 `alibaba-labelx/asr-transcription` 椤圭洰璺敱涓庣幆澧冨彉閲忔敮鎸侊紙`ASR_TRANSCRIPTION_STATS_DIR`銆乣ASR_TRANSCRIPTION_PERSIST_ROWS_JSON`銆乣ASR_TRANSCRIPTION_PERSIST_UPLOAD_EVENTS`锛夈€?
- options 杞啓璇︽儏椤电户缁繚鎸佽交閲忔ā寮忥紝涓嶆仮澶嶆棫瀹屾暣璁剧疆琛ㄥ崟锛屼粎鏂板缁熻瀵煎嚭灏忓崱锛堝紑鍏炽€佷笂浼犲湴鍧€銆佹湰鍦颁繚瀛樼洰褰曞拰涓嬭浇鍦板潃璇存槑锛夈€?
- 鏈疆浠嶄繚鎸?`extension/manifest.json` 鐗堟湰 `0.2.10`锛屽洜涓哄綋鍓嶅睘浜?`0.2.10` 娴嬭瘯淇闃舵锛屼笉鎻愬墠鍗囧埌 `0.2.11`銆?
- 淇杞啓缁熻鍓嶅悗绔懡鍚嶄笌杈圭晫锛氭墿灞曚晶鏂囦欢浠?`transcription-stats-server.js` 閲嶅懡鍚嶄负 `transcription-stats-client.js`锛屽彧淇濈暀閲囬泦/涓婁紶瀹㈡埛绔亴璐ｏ紱Node 鏈嶅姟缁х画鍙湪 `platform-resources/alibaba-labelx/asr-transcription/backend/`銆?
- 淇杞啓缁熻鍙栨暟閫昏緫锛氳鎯呮帴鍙ｆ敼涓?`pageSize=10` 鍒嗛〉鎶撳彇锛堝惈鏈€澶ч〉鏁颁繚鎶わ級锛屾柊澧?`subTaskId` 绌虹櫧娓呮礂锛堢┖鏍?Tab/鎹㈣/鍏ㄨ绌烘牸锛夊悗鍐嶈姹?`/subTask/{id}/data`銆?
- 淇杞啓浠诲姟璇嗗埆锛氭帓闄?`labelModel=vote` 涓?ASR鏇翠紭缁撴灉鍒ゆ柇"绫诲揩鍒や换鍔★紝閲囬泦 `labelModel=single`銆乣size=50`銆佷换鍔″悕鍚?涓枃鏅€氳瘽asr浠诲姟"绛夎浆鍐欎换鍔°€?
- 淇鏈夋晥鏃堕暱姹囨€伙細杞啓缁熻鏀逛负浠庡垎椤?`dataList` 鑱氬悎 `item.data.duration/item.duration/item.audioDuration/...` 鍊欓€夊瓧娈碉紝涓嶅啀鍙緷璧栧崟涓€璺緞銆?

- ASR 杞啓杞婚噺宸ュ叿鏍忓畬鎴愰〉闈㈠唴甯冨眬鏀归€狅細鏂板 `toolbar.js`锛屽伐鍏锋爮浼樺厛娉ㄥ叆 `.mark-toolbox`锛堜紭鍏?breadcrumb 鍚庯級锛屾棤 `.mark-toolbox` 鏃跺洖閫€鍒伴鏉￠鍗″墠锛屼笉鍐嶉粯璁ゅ浐瀹氭偓娴湪椤甸潰椤堕儴涓ぎ銆?
- ASR 杞啓宸ュ叿鏍忔敼涓哄垎缁勭粨鏋勶細`褰撳墠棰?鏂囨湰/闊抽/鍊嶉€?闊抽噺/鐘舵€乣锛涚姸鎬佸潡鏂板褰撳墠棰樺畾浣嶃€佸綋鍓嶉煶棰戠姸鎬佸拰鏈€杩戝姩浣滅粨鏋滐紝鎸夐挳鍔ㄤ綔缁х画鍙綔鐢ㄤ簬褰撳墠棰?褰撳墠闊抽銆?
- 杞啓杩愯鏃剁紪鎺掓敹鏁涳細`content.js` 鍙礋璐ｅ懡涓噸璇曘€佸姩浣滃垎鍙戙€乸opup ping 涓庡伐鍏锋爮鐘舵€佹洿鏂帮紱淇濈暀 DOMContentLoaded/load/MutationObserver/SPA/杞閲嶈瘯閾捐矾锛岄伩鍏嶈繃鏃╁垽瀹氬け璐ャ€?
- options 杞啓璇︽儏椤电户缁繚鎸佽交閲忚鏄庯紝琛ュ厖"鐗堟湰 0.2.10銆佹敮鎸佽兘鍔涖€佷笉鏀寔鑳藉姏銆佷娇鐢ㄦ楠?鏂囨锛屼笉鎭㈠瀹屾暣璁剧疆琛ㄥ崟銆?
- `manifest.json` 涓鸿浆鍐欐敞鍏ユ柊澧?`toolbar.js`锛堝湪 `content.js` 鍓嶏級锛岀増鏈户缁繚鎸?`0.2.10`锛堝綋鍓嶄粛灞炲悓鐗堟湰淇涓庝綋楠屼紭鍖栭樁娈碉級銆?

- 淇鐗堟湰绛栫暐锛氬綋鍓?ASR 杞啓灞炰簬 `0.2.10` 瀹為檯浣跨敤 BUG 淇杩囩▼锛岀増鏈彿鍥為€€骞朵繚鎸佷负 `0.2.10`锛屼笉鎻愬墠鍗囧埌 `0.2.11`銆?
- 鏄庣‘ `0.2.11` 浠呭湪 `0.2.10` 淇瀹屾垚涓旈€氳繃鐪熷疄娴忚鍣ㄩ獙璇佸悗鍐嶄娇鐢ㄣ€?
- 閲嶆柊鐢熸垚 `dist/annotation-script-center-v0.2.10.zip` 浣滀负褰撳墠鏈夋晥娴嬭瘯鍖呫€?

- 淇 Alibaba LabelX 杞啓杞婚噺鑴氭湰娉ㄥ叆鏃舵満锛歚content.js` 鏀逛负鎸佺画閲嶈瘯鍛戒腑锛坄DOMContentLoaded`銆乣load`銆乣MutationObserver`銆乣pushState/replaceState/popstate`銆佺煭杞锛夛紝涓嶅啀鍦?`document_start` 棣栨 DOM 鏈氨缁椂姘镐箙鍋滄満銆?
- 淇 popup 璇姤"娉ㄥ叆澶辫触"锛氳浆鍐?`PANEL_PING` 鏀逛负鑴氭湰娉ㄥ叆鍚庢亽鍝嶅簲锛屾柊澧?`injected/matched/reason`锛沺opup 鏂板"宸叉敞鍏ワ紝绛夊緟杞啓璇︽儏椤?鐘舵€侊紝浠呭湪鐪熸鏃犲搷搴旀椂鏄剧ず"娉ㄥ叆澶辫触"銆?
- 鍒犻櫎杞啓鐙珛璁剧疆閾捐矾锛氱Щ闄?`settings-panel.js`銆乷ptions 椤佃浆鍐欒缃〃鍗曟寕杞姐€侀〉闈㈠唴 overlay 璁剧疆鍏ュ彛涓?璁剧疆"宸ュ叿鏍忔寜閽€?
- 鍒犻櫎杞啓蹇嵎閿摼璺細绉婚櫎 `shortcut-bus.js`銆乧ontent 渚у揩鎹烽敭缁戝畾涓庨厤缃緷璧栵紱杞啓浠呬繚鐣欓〉闈㈠伐鍏锋爮鎸夐挳瑙﹀彂銆?
- 绮剧畝 `runtime-config.js`锛氫粎淇濈暀鑴氭湰涓績鍚敤鐘舵€佽鍙栦笌鍥哄畾榛樿鍊艰緭鍑猴紝涓嶅啀淇濆瓨鎴栬闃呰浆鍐欑嫭绔嬮厤缃€?
- `manifest.json` 鍒犻櫎 `settings-panel.js` 鍜?`shortcut-bus.js` 寮曠敤锛岀増鏈粠 `0.2.10` 鎻愬崌鍒?`0.2.11`銆?

- `asr-transcription` 鎸?鍒犻櫎鏃х洰褰?+ 杞婚噺閲嶅啓"鎵ц锛氬厛 `git rm -r extension/sites/alibaba-labelx/asr-transcription/`锛屽啀閲嶅缓涓烘渶灏忔枃浠堕泦锛坄content.js`銆乣settings-panel.js`銆乣runtime-config.js`銆乣audio-controller.js`銆乣active-item.js`銆乣item-actions.js`銆乣shortcut-bus.js`銆乣text-utils.js`銆乣README.md`锛夈€?
- `manifest.json` 鍒犻櫎杞啓鏃?MAIN world 涓庢棫 ISOLATED world 閾捐矾寮曠敤锛岀Щ闄ゆ墍鏈夋棫 legacy/save/submit/batch/ai/export/leaderboard/page-flow 鐩稿叧鑴氭湰璺緞锛屼粎淇濈暀杞婚噺鐗堣浆鍐欒剼鏈紩鐢紱蹇垽涓?DataBaker 閾捐矾淇濇寔涓嶅彉銆?
- 杞啓杩愯鏃舵敹鏁涗负"褰撳墠棰?+ 褰撳墠闊抽"鑳藉姏锛氬揩閫熷～鍏ャ€佹爣鏈夋晥/鏃犳晥銆佸幓绌烘牸銆佹暟瀛楄浆鎹€佺劍鐐瑰垏鎹€佹挱鏀?鏆傚仠銆佸墠杩?鍚庨€€銆佸€嶉€熻皟鏁?閲嶇疆銆侀煶閲忚皟鏁?閲嶇疆銆佸鍒舵椂闀匡紱涓嶅仛鑷姩淇濆瓨/鎻愪氦/娴佽浆涓庢暣椤垫壒閲忓姩浣溿€?
- options 椤佃ˉ鍏呭姞杞?`runtime-config.js`锛岀‘淇濊浆鍐欒缃潰鏉垮彲鍦ㄨ剼鏈腑蹇冪户缁繚瀛樺熀纭€閰嶇疆銆?
- 鏂囨。鍚屾鏇存柊鏍?`README.md`銆乣extension/sites/alibaba-labelx/asr-transcription/README.md`銆乣platform-resources/alibaba-labelx/asr-transcription/README.md`锛屾槑纭?鏃ц兘鍔涘凡鍒狅紝鎭㈠闇€閲嶆柊璁捐鍜岄獙鏀?銆?

- 缁х画娓呯悊 `asr-transcription`锛氬垹闄ゅ叏椤垫壒閲忎慨鏀瑰姩浣滐紙鍏ㄩ〉鏍囨湁鏁堝苟濉厖銆佸叏椤靛幓绌烘牸銆佸叏椤垫牎楠岃嚜鍔ㄤ慨澶嶏級鍦ㄥ伐鍏锋爮銆佸揩鎹烽敭鍜屼氦浜掓墽琛屽櫒涓殑鍏ュ彛涓庨€昏緫锛屼粎淇濈暀褰撳墠棰樼骇鍒搷浣溿€?
- 鐗╃悊鍒犻櫎鏃ц嚜鍔ㄥ寲涓庢棫淇濆瓨閾捐矾鏂囦欢锛歚annotation-save-runner.js`銆乣annotation-submit-runner.js`銆乣annotation-page-flow-runner.js`銆乣legacy-save-coordinator.js`銆乣legacy-ai-punctuation.js`銆乣legacy-auto-assign.js`銆乣legacy-batch-flow.js`銆乣legacy-export.js`銆乣legacy-leaderboard.js`銆?
- 鍚屾鏀跺彛寮曠敤閾捐矾锛氭洿鏂?`manifest.json`銆乣runtime-contract.js`銆乣content.js`銆乣annotation-control-panel.js`銆乣runtime-debug.js`銆乣annotation-debug-snapshot.js`锛岀Щ闄や笂杩版ā鍧椾緷璧栦笌鏆撮湶銆?
- 鍚屾鏀跺彛閰嶇疆涓庡吋瀹硅縼绉伙細鏇存柊 `shared/constants.js` 涓?`shared/storage.js`锛屽垹闄ゅ叏椤垫壒閲忓揩鎹烽敭瀹氫箟锛屾棫瀛楁缁熶竴娓呯悊涓?`null` 鎴栬繍琛屾椂蹇界暐銆?
- 鏂囨。鍙ｅ緞鏇存柊涓?鏃у姛鑳藉凡鍒犻櫎锛屽悗缁闇€鎭㈠蹇呴』閲嶆柊璁捐骞堕噸鏂伴獙鏀讹紝涓嶄粠鏃ц剼鏈洿鎺ユ仮澶?銆?

- 瀵?`asr-transcription` 鎵ц鍩虹鏀跺彛閲嶆瀯锛氱鐢ㄦ墿灞曚晶鑷畾涔変繚瀛?payload 娉ㄥ叆銆佹墜鍔ㄥ己鍒朵繚瀛樸€佹彁浜ら棴鐜€佽嚜鍔ㄦ彁浜ゃ€佽嚜鍔ㄩ鍙栥€佽嚜鍔ㄦ祦杞叆鍙ｏ紱淇濈暀鍏煎绌哄疄鐜颁互閬垮厤 manifest/娉ㄥ叆閾捐矾鏂摼銆?
- 鏀跺彛杞啓蹇嵎閿拰閰嶇疆锛氱Щ闄?AI 鏍囩偣銆佽嚜鍔ㄦ壒閲忔彁浜ゃ€佹牎楠屽悗鑷姩鎻愪氦銆佹帓琛屾绛夊嵄闄╁揩鎹烽敭鍏ュ彛锛涙柊澧炲苟缁熶竴浣跨敤 `playbackRateValue`銆乣rateStepValue`銆乣seekStepSeconds`锛岄煶棰戞杩?鍊嶉€?闊抽噺閲嶇疆鏀逛负璇诲彇缁熶竴閰嶇疆銆?
- 鏀跺彛杩愯鏃惰嚜鍔ㄩ摼璺細`content.js` 涓嶅啀鍚姩鑷姩鎶㈠崟鍜屾壒閲忔祦杞疆璇紱`legacy-batch-flow`銆乣legacy-auto-assign`銆乣legacy-ai-punctuation` 榛樿杩斿洖 `disabled-in-basic-stage`銆?
- 鍚屾鏂囨。鍙ｅ緞锛氭洿鏂版牴 `README.md`銆乣extension/sites/alibaba-labelx/asr-transcription/README.md`銆乣platform-resources/alibaba-labelx/asr-transcription/README.md`锛屾槑纭?鍩虹杞啓闃舵"瑙勫垯涓庣湡瀹為〉闈㈤獙鏀舵楠ゃ€?
- 鏂囨。鐩綍杩佺Щ锛氬皢 `docs` 涓嬫棫 `extension` 瀛愮洰褰曟枃浠跺叏閲忚縼绉诲埌 `docs` 鏍圭洰褰曪紝骞舵竻鐞嗙┖瀛愮洰褰曘€?
- 鏂囨。寮曠敤淇锛歊EADME銆丄GENTS銆乨ocs 涓庡钩鍙拌祫鏂欎腑鐨勬棫瀛愮洰褰曞紩鐢ㄧ粺涓€鏀逛负 `docs/`銆?
- 鐢ㄦ埛鍙鍛藉悕缁熶竴锛氭枃妗ｄ腑鐨勫钩鍙板悕绉扮粺涓€涓?鏍囪礉鏄撻噰"锛岃剼鏈悕绉扮粺涓€涓?鏍囪礉鏄撻噰涓€妫€璐ㄦ"锛涗繚鐣?`data-baker` 鐩綍涓?API 璺緞绛夊巻鍙叉妧鏈爣璇嗐€?
- 鐜妯℃澘棣栬疆鏀舵暃锛歚config/env/ai.env.example` 褰撴椂鍏堟敹鎴愪簡鈥淒ashScope + 棰濆 provider 绀轰緥鈥濈殑杩囨浮妯℃澘锛屽悗缁啀缁х画鐦﹁韩涓烘渶灏忕敓浜х増銆?- 鏂板 `AGENTS.md` 闀挎湡瑙勫垯锛氭墽琛岀被浠诲姟闇€妫€鏌ュ苟鍚屾鎻愬崌鎵╁睍鐗堟湰鍙凤紱榛樿浠ｇ爜鎴栫敤鎴峰彲瑙佽涓哄彉鍖栨椂鎻愬崌 patch 鐗堟湰銆?
- 鏂板 `AGENTS.md` 闀挎湡瑙勫垯锛氶獙璇侀€氳繃鍚庨粯璁ゆ寜 `manifest.version` 鐢熸垚 `dist/annotation-script-center-v<version>.zip`锛屽苟妫€鏌ュ帇缂╁寘鏍圭洰褰曠粨鏋勩€?
- 鏈疆灏?`extension/manifest.json` 鐗堟湰浠?`0.2.9` 鎻愬崌鍒?`0.2.10`銆?
- 缁х画娓呯悊鏂囨。涓殑鏍囪礉鏄撻噰鏃хО娈嬬暀锛氱粺涓€鐢ㄦ埛鍙骞冲彴鍚嶄负"鏍囪礉鏄撻噰"锛岃剼鏈悕涓?鏍囪礉鏄撻噰涓€妫€璐ㄦ"銆?
- 鏄庣‘ `dist/` 涓烘瀯寤轰骇鐗╃洰褰曪紝榛樿涓嶆彁浜?git銆?

## 2026-05-07

- 寮哄寲 `AGENTS.md` 鍗忎綔瑙勫垯锛氭柊澧?缃戦〉绔寚鎸?AI + Codex 鎵ц AI"妯″紡锛屾槑纭綉椤电 Prompt 鏄綋鍓嶄换鍔＄洿鎺ユ墽琛屼緷鎹紝鍐茬獊鏃跺綋鍓嶄换鍔′紭鍏堟寜 Prompt 鎵ц骞跺悓姝ユ枃妗ｃ€?
- 鏂板鎵ц绾︽潫锛氭墽琛岀被浠诲姟涓嶅緱鍋滅暀鍦ㄥ璁℃姤鍛婏紱瀛愪唬鐞嗙粨璁哄彧鑳戒綔涓轰腑闂村垎鏋愶紝涓荤嚎绋嬪繀椤荤户缁惤鍦颁慨鏀逛笌楠岃瘉銆?
- 鏂板鏂囨。娌夋穩绾︽潫锛氱綉椤电纭鐨勪笟鍔¤鍒欍€侀檺鍒跺拰楠屾敹鍙ｅ緞蹇呴』鍐欏叆 README/docs锛屽苟鍦ㄥ奖鍝嶈涓烘椂鍚屾璁板綍鍒?`log.md`銆?
- 鏂板杈撳嚭瑙勮寖锛欳odex 鏈€缁堣緭鍑洪渶鍖呭惈鍒嗘敮銆佷慨鏀规枃浠躲€侀獙璇佺粨鏋溿€乣git status --short`銆乧ommit hash銆乸ush 缁撴灉銆侀闄╃偣鍜屽悗缁湡瀹為〉闈㈤獙鏀堕」銆?
- 鏂板鐪熷疄椤甸潰涓嶅彲璁块棶澶勭悊瑙勫垯锛氱姝吉閫犻〉闈㈢粨璁猴紱鍙厛瀹屾垚涓嶄緷璧栭〉闈㈢殑浠ｇ爜/鏂囨。鏀瑰姩锛屽苟鏄庣‘鏍囨敞"闇€瑕佺湡瀹為〉闈㈤獙璇?椤广€?
- 鏂板 `asr-transcription` 褰撳墠涓氬姟鍙ｅ緞锛氫粎鍋氬熀纭€杞啓锛堜竴闊抽涓€鏂囨湰妗嗭級锛屾殏涓嶅仛鏃堕棿鎴炽€佽璇濅汉銆丄I 鍒濈/鏍″/鏍煎紡鍖栵紝淇濆瓨浠ュ钩鍙拌嚜鍔ㄤ繚瀛樹负鍑嗭紝涓嶇収鎼?`asr-judgement` 鍒ゅ埆鍔ㄤ綔涓庝繚瀛橀摼璺€?

## 2026-04-30

- 閲嶅仛 鏍囪礉鏄撻噰蹇嵎閿劍鐐规仮澶嶇瓥鐣ワ細`shortcuts.js` 鍒犻櫎鏃х劍鐐瑰摠鍏典笌琚姩鎭㈠渚濊禆锛屼笉鍐嶅湪骞冲彴鎸夐挳鐐瑰嚮銆乤ctive 棰樼洰鍙樺寲鎴栫獥鍙?focus 鏃剁洸鐩?blur/focus銆?
- 鏂板"鏈彞璇濇枃鏈?鍙樺寲妫€娴嬫満鍒讹細褰撳钩鍙拌嚜鍔ㄥ垏棰樺鑷?textarea 鍐呭鍙樺寲涓旂敤鎴蜂笉鍦ㄦ墜鍔ㄧ紪杈戞椂锛岃剼鏈細鐭殏 focus 鏂囨湰妗嗗啀 blur 閫€鍑猴紝鐢ㄤ簬鎭㈠蹇嵎閿劍鐐广€?
- 鎵嬪姩杈撳叆淇濇姢澧炲己锛氱敤鎴峰湪"鏈彞璇濇枃鏈?涓緭鍏ユ椂涓嶄細琚畾鏃舵鏌ユ姠璧板厜鏍囷紱浠呭懡涓凡閰嶇疆蹇嵎閿椂鎵嶅己鍒堕€€鍑鸿緭鍏ユ骞舵墽琛屽姩浣溿€?
- 淇 鏍囪礉鏄撻噰涓€妫€璐ㄦ蹇嵎閿鍔ㄧ劍鐐规仮澶嶅彲鑳藉奖鍝嶉煶棰戞挱鏀剧殑闂锛歚shortcuts.js` 绉婚櫎骞冲彴鎸夐挳鐐瑰嚮銆佸乏渚у彞瀛愬垏鎹€乤ctive 棰樼洰鍙樺寲銆佺獥鍙?focus 绛夎鍔?blur/focus 鎭㈠閾捐矾銆?
- 鏍囪礉鏄撻噰蹇嵎閿瓥鐣ユ敹鏁涗负"浠呭懡涓凡閰嶇疆蹇嵎閿椂寮哄埗閫€鍑鸿緭鍏ユ骞舵墽琛屽姩浣?锛涙湭鍛戒腑蹇嵎閿椂涓嶆嫤鎴櫘閫氳緭鍏ャ€佷笉骞查骞冲彴鍒囬鍜岄煶棰戠粍浠跺垵濮嬪寲銆?
- 淇濈暀"濉叆鎺ㄨ崘鏂囨湰"鍚庣殑涓诲姩澶辩劍鑳藉姏锛坄data-api.js`锛夛紝浠呭湪鐢ㄦ埛鐐瑰嚮濉叆鎴愬姛鍚庤Е鍙戯紝涓嶅奖鍝嶅钩鍙拌嚜鍔ㄥ垏棰樻祦绋嬨€?

## 2026-04-29

- 淇 鏍囪礉鏄撻噰 鎬昏〃瀵煎嚭鍒嗛〉澶у皬涓嬫媺绋冲畾鎬э細`group-export.js` 鍒囨崲 `100鏉?椤礰 鍓嶅厛鐐瑰嚮 `.el-pagination__sizes .el-select` 鍐呯殑 `.el-input.el-input--mini.el-input--suffix`锛岀瓑寰?`.el-select-dropdown.el-popper` 娓叉煋鍚庡啀閫夋嫨 `100鏉?椤礰銆?
- 鍒嗛〉澶у皬涓嬫媺鍖归厤澧炲姞闃茶鐐硅鍒欙細浠呴€夋嫨鍖呭惈 `10/20/50/100鏉?椤礰 缁勫悎鐨勫彲瑙?dropdown锛屼紭鍏堟渶鍚庝竴涓彲瑙侀」锛岄伩鍏嶈鐐圭瓫閫夋潯浠朵笅鎷夈€?
- 鍒囨崲 `100鏉?椤礰 鍚庢柊澧炵姸鎬佹彁绀轰笌鍏滃簳锛氭敮鎸?宸查€夋嫨100鏉?椤碉紝姝ｅ湪绛夊緟骞冲彴鍝嶅簲"锛涜嫢鍝嶅簲鏈強鏃舵崟鑾蜂絾鍒嗛〉鏄剧ず宸插彉鏇翠负 `100鏉?椤礰锛屽厑璁哥户缁叏閲忓鍑恒€?

- 浼樺寲 鏍囪礉鏄撻噰 group/detail 鎬昏〃瀵煎嚭涓?骞冲彴鍘熺敓鍒嗛〉鍏ㄩ噺瀵煎嚭"锛歚group-export.js` 鐐瑰嚮鍚庡厛鍒囨崲 `100鏉?椤礰锛屽啀閫氳繃璺抽〉鎺т欢閫愰〉瑙﹀彂 `queryByCondition`锛岀敱 MAIN world 鎷︽埅鍝嶅簲骞跺悎骞跺幓閲嶅悗涓嬭浇 CSV銆?
- 鏍囪礉鏄撻噰 鎬昏〃 CSV 瀛楁绉婚櫎"閲囬泦ID"鍒楋紝缁х画淇濈暀涓枃琛ㄥご銆乁TF-8 BOM 涓?鍘熷JSON"鑴辨晱鍒楋紱瀵煎嚭杩囩▼涓嶅啓鍏?`access_token`銆乣refresh_token`銆乧ookie 鎴?authorization銆?
- 瀵煎嚭澶辫触鏃跺鍔犳槑纭彁绀哄拰褰撳墠椤靛厹搴曞鍑烘彁绀猴細鍒嗛〉鎺т欢涓嶅彲鐢ㄤ細鎻愮ず鎵嬪姩鍒囨崲 `100鏉?椤礰 鍚庨噸璇曪紝閬垮厤闈欓粯澶辫触銆?

- 淇 鏍囪礉鏄撻噰 group/detail 瀵煎嚭 `code=51000`锛歚group-export.js` 涓嶅啀鐩存帴 `fetch /cms/tbAudioUserTask/queryByCondition`锛屾敼涓鸿Е鍙戦〉闈㈠師鐢熸煡璇㈠苟绛夊緟 MAIN world 鎷︽埅鍝嶅簲鍚庡鍑恒€?
- 鎵╁睍 `page-world/network-observer.js`锛氭柊澧?`queryByCondition` 鎷︽埅銆乣DATABAKER_ROUND_ONE_QUALITY_GROUP_QUERY_RESPONSE` 娑堟伅绫诲瀷锛屼互鍙?`window.__ASREdgeDataBakerRoundOneGroupQueryCache`锛堟渶澶?20 鏉★級缂撳瓨锛涗繚鐣欏師鏈?`queryCollectStatementByCondtion` 閫昏緫涓嶅彉銆?
- 瀵煎嚭娴佺▼绗竴鐗堣皟鏁翠负"褰撳墠椤靛鍑?锛氭寜閽枃妗堟敼涓?瀵煎嚭褰撳墠椤垫暟鎹?锛屾枃浠跺悕鍖呭惈 `pageNum`锛涙敮鎸佹煡璇㈡寜閽Е鍙戙€佸垎椤佃Е鍙戝拰 `location.reload()` 鍏滃簳锛屽苟閫氳繃 `sessionStorage` 鎭㈠绛夊緟鐘舵€併€?

- 鍒犻櫎 鏍囪礉鏄撻噰 鍚庣鑷姩瀵煎嚭閾捐矾锛氱Щ闄?`export-auth.js`銆乣export-client.js`銆乣export-csv.js`銆乣export-routes.js`锛屽苟鍦?`backend/index.js` 鍙栨秷瀵煎嚭璺敱娉ㄥ唽锛屼粎淇濈暀 AI 鎺ㄨ崘鏂囨湰璺敱銆?
- 娓呯悊瀵煎嚭鐧诲綍閰嶇疆妯℃澘锛歚config/env/ai.env.example` 鍒犻櫎鍏ㄩ儴 `DATABAKER_EXPORT_*`銆乣ticket`銆乣nounce` 鐩稿叧鍙橀噺锛岄伩鍏嶇户缁厤缃处鍙峰瘑鐮佹垨 token 閾捐矾銆?
- 娓呯悊鏂囨。鐜拌璇存槑锛氭牴 README銆佹爣璐濇槗閲?鎵╁睍 README銆佸钩鍙?README銆佸悗绔?README 鍏ㄩ儴绉婚櫎鍚庣瀵煎嚭鎺ュ彛涓庤嚜鍔ㄧ櫥褰曡鏄庯紝缁熶竴涓哄墠绔悓婧愬鍑猴紙`/cms/tbAudioUserTask/queryByCondition`銆乣credentials: include`銆侀粯璁?`pageSize=100`銆丆SV UTF-8 BOM 鏈湴涓嬭浇锛夈€?

- 鏍囪礉鏄撻噰 `group/detail?taskId=...` 鎬昏〃瀵煎嚭榛樿閾捐矾鍒囨崲涓哄墠绔悓婧愬鍑猴細鎵╁睍鐩存帴浣跨敤褰撳墠椤甸潰鐧诲綍鎬佽姹?`/cms/tbAudioUserTask/queryByCondition`锛坄credentials: include`锛夛紝榛樿 `pageSize=100` 鑷姩缈婚〉骞朵笅杞芥湰鍦?CSV锛堝惈 UTF-8 BOM锛夈€?
- `group-export.js` 瀵煎嚭娴佺▼鏂板鍒嗛〉杩涘害鐘舵€侊紙绗?x / y 椤点€佸凡鑾峰彇 n / total 鏉★級銆佹渶澶ч〉鏁颁繚鎶わ紙`10000`锛変笌鐧诲綍鎬佸け鏁堥敊璇彁绀猴紱涓嶅啀榛樿渚濊禆 `127.0.0.1:3333` 鏈湴鍚庣銆?
- CSV 瀵煎嚭鍒楁敼涓轰腑鏂囪〃澶村苟鏂板"鍘熷JSON"鑴辨晱鍒楋紱瀵煎嚭鏃惰繃婊?`token/cookie/authorization/signature/ossaccesskeyid` 鏁忔劅瀛楁锛屼笉瀵煎嚭瀹屾暣 URL銆?
- 鍚屾鏇存柊 README 鏂囨。鍙ｅ緞锛氬墠绔悓婧愬鍑轰负榛樿鎺ㄨ崘锛屽悗绔鍑轰繚鐣欎负澶囩敤鑳藉姏锛涘悗绔嚜鍔ㄧ櫥褰曞彈婊戝潡楠岃瘉鐮?`ticket/nounce` 闄愬埗锛屼笉浣滀负棣栭€夈€?

- 浣跨敤 `chrome_devtools` 瀹屾垚 鏍囪礉鏄撻噰 鐧诲綍璇锋眰鑴辨晱璋冪爺锛氱‘璁ょ湡瀹炴帴鍙ｄ负 `POST /cms/authentication/form`锛宍username/password/ticket/nounce` 璧?query锛屽搷搴?token 璺緞涓?`data.access_token` / `data.refresh_token`锛屽苟浼氳缃?`JSESSIONID`銆?
- 鏍囪礉鏄撻噰 瀵煎嚭鍚庣瀵归綈鐪熷疄鐧诲綍濂戠害锛歚export-auth.js` 鏂板 query 浼犲弬鐧诲綍銆乧aptcha `ticket/nounce` 閰嶇疆銆丆ookie/JSESSIONID 缂撳瓨涓?`language` 澶村吋瀹癸紱`export-client.js` 璇锋眰渚у悓姝ュ甫 `language` 涓?Cookie銆?
- 鏇存柊瀵煎嚭鐜妯℃澘涓庢枃妗ｏ細`ai.env.example`銆佹牴 README銆佸钩鍙?README銆佸悗绔?README 鍚屾鐧诲綍濂戠害瀛楁涓庡畨鍏ㄨ姹傦紙涓嶈褰曠湡瀹炶处鍙枫€佸瘑鐮併€乼oken銆乧ookie锛夈€?
- 瀹炴祴瀵煎嚭楠岃瘉锛歚health` 鍦ㄨˉ鍏ㄩ厤缃悗鍙?`ready=true`锛涘鐢ㄥ凡浣跨敤鐨?`ticket` 浼氳繑鍥?婊戝潡楠岃瘉鐮佹牎楠屼笉閫氳繃"锛屽悗绔幇宸查€忎紶鏄庣‘涓氬姟閿欒锛屼笉鍐嶈鎶ョ己灏?token銆?

- 鏂板 鏍囪礉鏄撻噰涓€妫€璐ㄦ瀵煎嚭鍚庣锛歚/api/data-baker/round-one-quality/export/health` 涓?`/api/data-baker/round-one-quality/export/task`锛涜处鍙峰瘑鐮佷粠鐜鍙橀噺璇诲彇锛屽鍑洪摼璺敮鎸?token 鍐呭瓨缂撳瓨銆佽繃鏈熷埛鏂颁笌 401/403 鑷姩閲嶇櫥锛屾寜 `taskId` 鑷姩缈婚〉 `queryByCondition` 骞剁敓鎴?CSV 鍒?`platform-resources/data-baker/round-one-quality/backend/exports/`锛屽搷搴斾笉杩斿洖 token銆?
- 鏂板 鏍囪礉鏄撻噰 `group/detail?taskId=...` 椤甸潰"瀵煎嚭鏁版嵁鎬昏〃"鎸夐挳锛氱偣鍑诲悗璋冪敤鏈湴瀵煎嚭鎺ュ彛骞惰Е鍙戞祻瑙堝櫒涓嬭浇锛屽悓鏃跺睍绀?姝ｅ湪瀵煎嚭/宸插鍑?澶辫触鍘熷洜"鐘舵€併€?
- 淇 鏍囪礉鏄撻噰涓€妫€璐ㄦ杈撳叆妗嗚澶辩劍锛氬揩鎹烽敭鐒︾偣鎭㈠鎷嗗垎涓鸿鍔ㄦ仮澶嶄笌寮哄埗鎭㈠锛涜鍔ㄦ仮澶嶄細璺宠繃缂栬緫鎬佸拰鏈€杩?1200ms 鎵嬪姩鐐瑰叆杈撳叆妗嗗満鏅紝鍛戒腑宸查厤缃揩鎹烽敭鏃朵粛鍙己鍒跺け鐒︽墽琛屽姩浣溿€?
- 鏂板瀵煎嚭鐜鍙橀噺妯℃澘 `DATABAKER_EXPORT_*` 涓庣櫥褰曞瓧娈?token 璺緞鍙厤缃」锛涘悓姝?`.gitignore` 蹇界暐 `platform-resources/data-baker/round-one-quality/backend/exports/`銆?
- 鏍囪礉鏄撻噰 AI 鎺ㄨ崘鏂囨湰鏂板鍘荤┖鏍煎厹搴曪細鍚庣缁熶竴娓呯悊 `heardText` 鍜屾渶缁?`recommendedText` 涓殑鏅€氱┖鏍笺€佸叏瑙掔┖鏍笺€乀ab 鍜屾崲琛岋紱鍓嶇灞曠ず銆佸鍒跺拰濉叆鍓嶄篃鍋氬吋瀹瑰厹搴曪紝涓嶄慨鏀归〉闈㈠€欓€夋枃鏈師鏂囷紝涓嶈嚜鍔ㄤ繚瀛樻垨鎻愪氦銆?
- 鏇存柊 AGENTS.md 椤圭洰瀹氫綅锛氬綋鍓嶉噸鐐瑰钩鍙版敹鍙ｄ负 Alibaba LabelX 涓?鏍囪礉鏄撻噰锛岄噸鐐硅剼鏈寘鍚揩鍒ゃ€佽浆鍐欏拰 鏍囪礉鏄撻噰涓€妫€璐ㄦ銆?
- 鍥哄寲鍗曚汉椤圭洰 Git 宸ヤ綔娴侊細榛樿 main 鍒嗘敮鐩存帴鎵ц锛岄獙璇侀€氳繃鍚?commit 骞?push锛屼笉鍒涘缓鍒嗘敮銆佷笉鍒涘缓 PR銆?
- 鍥哄寲澶嶆潅浠诲姟浼樺厛浣跨敤 subagent / parallel agents锛涗笉鏀寔鏃舵寜鐩稿悓鍒嗗伐涓茶鎵ц銆?
- 鍥哄寲榛樿鐢辩綉椤电鎸囨尌 AI 閫氳繃 GitHub 鐩存帴楠屾敹锛屼笉鍐嶉粯璁よ緭鍑洪獙鏀?Prompt銆?
- 鏈疆浠呮洿鏂板崗浣滄枃妗ｏ紝涓嶆敼鎵╁睍涓氬姟浠ｇ爜銆佷笉鏀瑰悗绔?API銆佷笉鏀?manifest銆?

- 淇 鏍囪礉鏄撻噰 鐐瑰嚮骞冲彴"纭畾"鍚庤嚜鍔ㄥ垏棰樺鑷村揩鎹烽敭澶辩劍鐨勯棶棰橈細蹇嵎閿繍琛屾椂鏂板骞冲彴鍔ㄤ綔鎸夐挳鐐瑰嚮銆乣.sentence-list .sentence-item.active` 鍙樺寲銆佸揩鎹烽敭瑙﹀彂骞冲彴鎸夐挳鍜岀獥鍙ｉ噸鏂拌仛鐒﹀悗鐨勫娆＄劍鐐规仮澶嶏紱鍙仛 blur + 闅愯棌鐒︾偣鍝ㄥ叺锛屼笉妯℃嫙鐐瑰嚮椤甸潰绌虹櫧澶勩€?
- 淇 鏍囪礉鏄撻噰涓€妫€璐ㄦ蹇嵎閿劍鐐规仮澶嶏細蹇嵎閿繍琛屾椂鍏堝尮閰嶅凡閰嶇疆鍔ㄤ綔锛屾湭鍛戒腑鏃朵笉鎷︽埅鏅€氳緭鍏ワ紱鍛戒腑鍚庨€氳繃闅愯棌鐒︾偣鍝ㄥ叺閫€鍑鸿緭鍏ユ骞舵墽琛屽姩浣滐紝鍚屾椂鐩戝惉宸︿晶鍙ュ瓙鐐瑰嚮鍚庡欢杩熸仮澶嶇劍鐐广€?
- 鏍囪礉鏄撻噰 "濉叆鎺ㄨ崘鏂囨湰"鍚庡鍔犵珛鍗炽€?0ms銆?80ms 涓夋澶辩劍鍏滃簳锛岄伩鍏?Element UI / Vue 鍦?input/change 鍚庨噸鏂拌仛鐒?textarea锛涗粛涓嶈嚜鍔ㄤ繚瀛樸€佹彁浜ゆ垨鍒ゅ畾銆?
- 鏍囪礉鏄撻噰 AI 鎺ㄨ崘鏂囨湰鏂板涓枃鍙ユ湯鏍囩偣鍏滃簳锛氬悗绔湪瀵规瘮缁撴灉鍜岃瘝琛ㄥ己鏇挎崲鍚庣粺涓€琛ュ叏 `銆傦紒锛燂紱鈥锛屽墠绔睍绀哄拰濉叆鍓嶄篃鍋氭棫鍚庣鍏煎鍏滃簳锛涗粛涓嶈嚜鍔ㄤ繚瀛樻垨鎻愪氦銆?
- 浼樺寲 鏍囪礉鏄撻噰涓€妫€璐ㄦ蹇嵎閿劍鐐硅涓猴細鏅€氳緭鍏ヤ笉鎷︽埅锛屽彧鏈夊懡涓凡閰嶇疆 鏍囪礉鏄撻噰蹇嵎閿椂鎵嶄細鑷姩 blur 褰撳墠杈撳叆鐒︾偣骞舵墽琛屽姩浣溿€?
- 鏍囪礉鏄撻噰 "濉叆鎺ㄨ崘鏂囨湰"鎴愬姛鍚庤嚜鍔ㄩ€€鍑?鏈彞璇濇枃鏈?杈撳叆妗嗗苟鎶婄劍鐐逛氦鍥為〉闈紝渚夸簬缁х画浣跨敤蹇嵎閿紱浠嶄笉鑷姩淇濆瓨銆佹彁浜ゆ垨鍒ゅ畾銆?
- 鏂板 鏍囪礉鏄撻噰涓€妫€璐ㄦ鑷姩姣忛〉鏉℃暟璁剧疆锛歰ptions 榛樿鍚敤 `50鏉?椤礰锛岃繍琛屾椂鍦?`roundOneCollect` 璇︽儏椤垫湁闄愰噸璇曠偣鍑婚〉闈㈠師鐢熷垎椤典笅鎷夛紝涓嶈嚜鍔ㄦ彁浜や换鍔°€?
- 鏂板 鏍囪礉鏄撻噰涓€妫€璐ㄦ蹇嵎閿厤缃紝榛樿鍏ㄩ儴鏈缃紝鏀寔 AI 鎺ㄨ崘銆佸鍒?AI 鍚煶鏂囨湰銆佸鍒舵帹鑽愭枃鏈€佸～鍏ャ€佸拷鐣ャ€佸彞瀛愬垽瀹氬悎鏍?/ 涓嶅悎鏍笺€佷换鍔″垽瀹氶€氳繃 / 閮ㄥ垎椹冲洖 / 鍏ㄩ儴椹冲洖銆?
- 鏍囪礉鏄撻噰蹇嵎閿繍琛屾椂鍙湪璇︽儏椤电敓鏁堬紝鏅€氳緭鍏ヤ笉鎷︽埅锛屼换鍔″垽瀹氭寜閽?disabled 鏃朵笉缁曡繃骞冲彴闄愬埗锛涜剼鏈€诲紑鍏冲叧闂椂宸ュ叿鍗°€佽嚜鍔ㄥ垎椤靛拰蹇嵎閿叏閮ㄥ仠姝€?
- 淇 鏍囪礉鏄撻噰 闂藉崡鏂硅█璇嶈〃鎷奸煶鎵规敞璇浛鎹細鎷彿鍐呭銆佹媺涓佹嫾闊炽€佹暟瀛楁敞闊冲拰娈嬬暀杩炴帴绗︿笉鍐嶅弬涓庡缓璁敤瀛?/ 瀵瑰簲鍗庤瑙ｆ瀽锛汣SV 鍗曞瓧鏄犲皠榛樿璺宠繃寮烘浛鎹紝閬垮厤鎶?`瀹跺涵` 璇敼鎴愬紓甯告枃鏈€?
- 浼樺寲 鏍囪礉鏄撻噰 AI 鎺ㄨ崘閫熷害瀹氫綅锛歈wen 鍘熺敓 `fetch` 璇锋眰榛樿鏀逛负椤跺眰 `enable_thinking=false`锛屼笉鍐嶄娇鐢?`extra_body`锛屽苟鍦ㄤ緵搴斿晢涓嶆敮鎸佽鍙傛暟鏃惰嚜鍔ㄧЩ闄ゅ瓧娈甸噸璇曚竴娆★紱鍙€氳繃 `DATABAKER_AI_ENABLE_THINKING=1` 寮€鍚?thinking銆?
- 鏂板 鏍囪礉鏄撻噰 `DATABAKER_AI_PIPELINE_MODE=two_stage|listen_only`锛岄粯璁や繚鐣欏惉闊?+ 瀵规瘮鍙屾ā鍨嬶紝`listen_only` 鏋侀€熸ā寮忓彧璋冪敤 `qwen3.5-omni-flash` 骞剁粨鍚堟湰鍦拌瘝琛ㄥ己鏇挎崲鐢熸垚鎺ㄨ崘鏂囨湰銆?
- 鏍囪礉鏄撻噰 AI 鍝嶅簲銆佹帹鑽愬崱鍜岃皟鐢ㄦ棩蹇楄ˉ鍏呮祦姘寸嚎妯″紡銆佸惉闊宠€楁椂銆佸姣旇€楁椂鍜屾€昏€楁椂锛屼究浜庡尯鍒嗙湡瀹?Qwen 璋冪敤鎱㈠湪鍚煶闃舵杩樻槸瀵规瘮闃舵銆?
- 琛ュ厖 鏍囪礉鏄撻噰 褰撳墠椤?AI 鎺ㄨ崘棰勭敓鎴愭柟妗堬細鍚庣画鍙敱鍓嶇鎸夐挳瑙﹀彂褰撳墠椤佃褰曢鐢熸垚銆佸悗绔檺鍒跺苟鍙戙€佸墠绔寜 `itemId` 鍐呭瓨缂撳瓨锛涢粯璁や笉鑷姩鎵ц锛岄伩鍏嶆垚鏈け鎺с€?
- 淇 鏍囪礉鏄撻噰 Qwen-Omni 鍚煶璇锋眰鏍煎紡锛歚requestListen` 鏀圭敤 `input_audio`锛屾寜闊抽 URL pathname 鍚庣紑鎺ㄦ柇 `wav/mp3/aac/m4a/amr/3gp/3gpp`锛屽苟绉婚櫎鍚煶璇锋眰鐨?`response_format`锛岄伩鍏嶅妯℃€佽姹傝Е鍙?HTTP 400銆?
- 鏍囪礉鏄撻噰 鍓嶇閿欒鎻愮ず琛ュ厖鍚庣鑴辨晱 `summary`锛屾柟渚挎帓鏌?provider 400锛屽悓鏃剁户缁伩鍏嶆毚闇插畬鏁撮煶棰?URL銆乼oken銆乧ookie銆乣OSSAccessKeyId`銆乣Signature` 鎴?API Key銆?
- 鏍囪礉鏄撻噰 options 璁剧疆椤靛皢 鍚庣鎺ュ彛鍦板潃鏀舵暃涓?鏈嶅姟鍣?/ 鏈満"涓や釜閫夐」锛屾棫鐨勮嚜瀹氫箟鍦板潃浼氬洖閫€鍒伴粯璁ゆ湇鍔″櫒鎺ュ彛锛屽憳宸ラ粯璁よ蛋鏈嶅姟鍣紝鏈満浠呯敤浜庡紑鍙戣皟璇曘€?
- 鏍囪礉鏄撻噰 options 璇锋眰瓒呮椂鏃堕棿鏀逛负鎸夌灞曠ず锛岄粯璁?`120` 绉掞紝淇濆瓨鍚庝粛鍐欏叆姣瀛楁 `aiRecommendRequestTimeoutMs` 渚涜繍琛屾椂浣跨敤銆?
- 鏍囪礉鏄撻噰 AI 璋冪敤鏃ュ織 CSV 鏂板缓鏃朵娇鐢ㄤ腑鏂囪〃澶达紝JSONL 缁х画淇濈暀鑻辨枃 key锛屼究浜庝汉宸ユ煡鐪嬪拰鍚庣画绋嬪簭澶勭悊銆?
- 鏂板 鏍囪礉鏄撻噰 闂藉崡鏂硅█瀛楄瘝琛?`platform-resources/data-baker/round-one-quality/ai/minnan-lexicon.csv`锛屽悗绔?`ai-lexicon.js` 浼氳В鏋?CSV 骞朵负鍚煶 / 瀵规瘮 prompt 娉ㄥ叆鐭笂涓嬫枃锛涜瘝琛ㄥ彧杈呭姪瀛楀舰鍒ゆ柇锛屼笉寮鸿鏇挎崲鏂囨湰銆?
- 澧炲己 鏍囪礉鏄撻噰 璇嶈〃绛栫暐锛氶粯璁?`DATABAKER_AI_LEXICON_REWRITE_MODE=aggressive`锛屽鏈€缁堟帹鑽愭枃鏈仛"瀵瑰簲鍗庤 -> 寤鸿鐢ㄥ瓧"鐨勫己鏇挎崲骞惰褰曟浛鎹㈡槑缁嗭紱璁剧疆涓?`off` 鏃朵粎淇濈暀 prompt 涓婁笅鏂囥€?
- 鏍囪礉鏄撻噰 AI 鍝嶅簲鍜岃皟鐢ㄦ棩蹇楁柊澧為樁娈佃€楁椂锛氬惉闊宠€楁椂銆佸姣旇€楁椂鍜屾€昏€楁椂锛涙棩蹇楀悓姝ヨ褰曡瘝琛ㄥ惎鐢ㄧ姸鎬併€佹浛鎹㈡ā寮忋€佹浛鎹㈡暟閲忓拰鏇挎崲鏄庣粏锛屼究浜庡尯鍒?`mock=true` 鏈湴鑰楁椂涓?`mock=false` 鐪熷疄 Qwen 璋冪敤鑰楁椂銆?
- 鏍囪礉鏄撻噰 鎺ㄨ崘鍗℃柊澧炶瘝琛ㄦ浛鎹㈡彁绀猴紝杩斿洖璇嶈〃寮烘浛鎹㈡椂鏄剧ず鏇挎崲鏁伴噺鍜屾渶澶?8 涓浛鎹㈤」锛屽鍒跺拰濉叆缁х画浣跨敤鏈€缁?`recommendedText`銆?
- options "鏍囨敞鑴氭湰涓績"鏂板 `鏍囪礉鏄撻噰` 骞冲彴鍖哄煙鍜?`鏍囪礉鏄撻噰涓€妫€璐ㄦ` 鑴氭湰鍗＄墖锛屾敮鎸佸湪鎺у埗闈㈡澘鍚仠璇ヨ剼鏈€?
- 鏂板 鏍囪礉鏄撻噰涓€妫€璐ㄦ涓撳睘璁剧疆椤碉紝鍙厤缃?鍚庣鎺ュ彛鍦板潃銆佽姹傝秴鏃舵椂闂村拰 AI 鎺ㄨ崘寮€鍏筹紱榛樿 endpoint 涓?`https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`锛屾湰鏈?`127.0.0.1:3333` 浠呯敤浜庡紑鍙戣皟璇曘€?
- 鏍囪礉鏄撻噰 content script 鏀逛负璇诲彇 `chrome.storage` 涓殑鑴氭湰鍚仠銆丄I 鎺ㄨ崘寮€鍏炽€乪ndpoint 鍜?timeout锛涘叧闂剼鏈垨鍏抽棴 AI 鎺ㄨ崘鍚庝笉鏄剧ず鎺ㄨ崘宸ュ叿鍗°€?
- 鎵╁睍鍓嶇浠嶄笉淇濆瓨 API Key銆乤ccess token銆乧ookie 鎴栧畬鏁撮煶棰?URL锛屾爣璐濇槗閲?妯″瀷瀵嗛挜缁х画鐢卞悗绔€氳繃 `config/env/ai.env` 璇诲彇銆?
- manifest 鐗堟湰鎻愬崌鍒?`0.2.8`銆?
- 鏂板缁熶竴 AI 鐜閰嶇疆鏂囦欢 `config/env/ai.env` 鑷姩鍔犺浇鑳藉姏锛岀粺涓€鍚庣鍚姩鏃朵細鍏堝姞杞戒粨搴撳唴 AI 鐜閰嶇疆锛屼笉鍐嶈姹傛瘡娆℃墜鍔ㄨ缃?`DASHSCOPE_API_KEY`銆?
- 鏂板 `config/env/ai.env.example`锛岃鐩?DashScope銆佸巻鍙查澶?provider 绀轰緥銆佸叾浠栨ā鍨嬫湇鍔″拰 鏍囪礉鏄撻噰 AI 鎺ㄨ崘鏂囨湰閰嶇疆椤广€?- `.gitignore` 鏂板鐪熷疄瀵嗛挜鏂囦欢蹇界暐瑙勫垯锛歚config/env/ai.env`銆乣config/env/ai.local.env`銆乣.env`銆乣.env.*`锛屼繚鐣欐ā鏉挎枃浠跺彲鎻愪氦銆?
- 鏂板 鏍囪礉鏄撻噰涓€妫€璐ㄦ绔欑偣鐩綍 `extension/sites/data-baker/round-one-quality/`锛屼粎鍦?`datafactory.data-baker.com` 鐨?`roundOneCollect` 璇︽儏椤垫敞鍏?AI 鎺ㄨ崘鏂囨湰"宸ュ叿鍗°€?
- 鏍囪礉鏄撻噰 鍓嶇鏂板 MAIN world 缃戠粶瑙傚療鑴氭湰锛屽彧鍦ㄥ唴瀛樹腑缂撳瓨 `queryCollectStatementByCondtion` 褰撳墠椤靛搷搴旓紱ISOLATED world 鏍规嵁 `.sentence-list .sentence-item.active`銆佸彸渚?鏈彞璇濇枃鏈? textarea 鍜屾帴鍙ｈ褰曞畾浣嶅綋鍓嶅崟鏉°€?
- 鏍囪礉鏄撻噰 鎺ㄨ崘缁撴灉鍗℃敮鎸佸睍绀洪〉闈㈠€欓€夋枃鏈€丄I 鍚煶鏂囨湰銆丄I 鎺ㄨ崘鏂囨湰銆佸彉鏇存爣璁般€佺疆淇″害銆佹ā鍨嬪拰澶嶆牳鎻愮ず锛屽苟鎻愪緵"澶嶅埗鎺ㄨ崘鏂囨湰""濉叆鎺ㄨ崘鏂囨湰""蹇界暐"锛涘～鍏ュ繀椤荤敱鐢ㄦ埛鐐瑰嚮瑙﹀彂锛屼笉鑷姩淇濆瓨銆佹彁浜ゃ€佸垽瀹氭垨娴佽浆銆?
- 缁熶竴鍚庣鏂板 鏍囪礉鏄撻噰 AI 鎺ㄨ崘鎺ュ彛锛?
  - `GET /api/data-baker/round-one-quality/ai/recommend/health`
  - `POST /api/data-baker/round-one-quality/ai/recommend`
- 鏍囪礉鏄撻噰 鍚庣榛樿浣跨敤鍚煶妯″瀷 `qwen3.5-omni-flash` 鍜屽姣旀ā鍨?`qwen3.5-plus`锛屾部鐢ㄥ師鐢?`fetch` 璋?DashScope锛屾敮鎸?`DATABAKER_AI_MOCK=1` mock銆佽垂鐢ㄤ及绠楀拰鏈夋晥闊抽瑁佸壀鐜鍙橀噺棰勭暀銆?
- `manifest.json` 鏂板 `https://datafactory.data-baker.com/*` 鏉冮檺涓?content script锛屾墿灞曠増鏈彁鍗囧埌 `0.2.7`锛涘悓姝ユ洿鏂版牴 README銆佹墿灞?README銆佸钩鍙拌祫婧?README銆佺粺涓€鍚庣 README 鍜?鏍囪礉鏄撻噰 椤甸潰 / 缃戠粶璧勬枡銆?

## 2026-04-28

- 涓?Alibaba LabelX ASR 蹇垽鏂板"AI 鍗婅嚜鍔ㄥ弬鑰冨缓璁?绗竴鐗堬細鏂板 `judgement-ai-suggestion.js`锛屼粎鏀寔鎸夐挳/蹇嵎閿墜鍔ㄥ垎鏋愬綋鍓嶉鍗★紝涓嶈嚜鍔ㄥ垎鏋愬叏椤碉紝涓嶈嚜鍔ㄤ繚瀛?鎻愪氦/棰嗗彇/娴佽浆銆?
- 蹇垽璁剧疆鏂板 AI 寤鸿閰嶇疆锛歚aiSuggestionEnabled`锛堥粯璁?false锛夈€乣aiSuggestionEndpoint`銆乣aiSuggestionRequestTimeoutMs`銆乣aiSuggestionModel`锛堥粯璁?`qwen3-omni-flash`锛夈€乣aiSuggestionAvailableModels`锛堥鐣?`qwen3.5-omni-plus`锛夛紱蹇嵎閿姩浣滅粺涓€涓?`shortcuts.aiSuggestCurrentItem`銆?
- 蹇垽宸ュ叿鏍忔柊澧?AI 鍒嗘瀽褰撳墠棰?鎸夐挳锛涘缓璁崱鏀寔"閲囩敤寤鸿/蹇界暐"锛岄噰鐢ㄥ缓璁粺涓€璋冪敤 `selectJudgementChoice(choiceActionKey)`锛屼笉閲嶅啓鍗曢€夐€昏緫銆?
- AI 寤鸿涓庨浄棰樿仈鍔細鍛戒腑闆烽鏃舵樉绀?闆烽浼樺厛"锛涜嫢 AI 涓庨浄棰樻爣鍑嗙瓟妗堝啿绐侊紝绂佺敤"閲囩敤寤鸿"銆?
- 蹇垽鍚庣鏂板 AI 璺敱涓庡鎴风锛?
  - `GET /api/alibaba-labelx/asr-judgement/ai/health`
  - `POST /api/alibaba-labelx/asr-judgement/ai/suggest`
  - 鏂板 `ai-routes.js`銆乣ai-client-qwen.js`銆乣ai-prompt.js`銆乣ai-response-schema.js`銆?
- AI 鍚庣榛樿鐪熷疄璋冪敤 DashScope Qwen锛坄stream=true`锛夛紝榛樿妯″瀷 `qwen3-omni-flash`锛涗粎 `ASR_JUDGEMENT_AI_MOCK=1` 鎵嶈蛋 mock锛涙湭閰嶇疆 `DASHSCOPE_API_KEY` 鏃?health 杩斿洖 `missing-api-key`锛宻uggest 杩斿洖娓呮櫚閿欒涓旀湇鍔′笉宕╂簝銆?
- 鏂板 AI 瑙勫垯璧勬枡锛歚platform-resources/alibaba-labelx/asr-judgement/ai/rules.ai.md`銆乣prompt-template.md`銆乣fewshot-examples.json`锛涘苟鍦ㄧ浉鍏?README 鍚屾鏂囨。璇存槑銆傚凡鏄庣‘鍙栨秷鍘嗗彶棰濆 provider 鎺ュ叆锛屼笉鏂板棰濆 client銆?- 瀹夊叏绾︽潫琛ュ厖锛氫笉鍦ㄦ棩蹇?瀛樺偍/DOM 鎸佷箙鍖栧畬鏁?`audioUrl`锛屽悗绔棩蹇椾粎璁板綍 requestId銆乭ostname銆乮temIndex銆乵odel銆?

- 淇 AI prompt 杈撳叆鏈€灏忓寲锛歚ai-prompt.js` 浠呭悜妯″瀷鏂囨湰 prompt 鎻愪緵 `asrText1/asrText2`锛屼笉鍐嶅寘鍚?`projectId/subTaskId/itemId/itemIndex`锛宍audioUrl` 浠呬綔涓烘ā鍨嬮煶棰戣緭鍏ュ瓧娈点€?
- 淇妯″瀷鏍￠獙閾捐矾锛氳姹傛樉寮忎紶鍏ラ潪娉?`model` 鏃?`suggest` 杩斿洖 `HTTP 400` + `code=invalid-model`锛涙湭浼?`model` 鏃舵墠浣跨敤 `ASR_JUDGEMENT_AI_MODEL` 鎴栭粯璁?`qwen3-omni-flash`銆?
- 娓呯悊鍐椾綑閰嶇疆瀛楁锛氱Щ闄ゆ棫蹇嵎閿嫭绔嬪瓧娈碉紝缁熶竴浣跨敤 `shortcuts.aiSuggestCurrentItem` 骞跺吋瀹硅縼绉绘棫閰嶇疆銆?
- 鎻愬崌鎵╁睍鐗堟湰鍒?`0.2.6`锛屽苟鍚屾鏇存柊鐩稿叧 README 涓庨獙璇佽鏄庛€?

## 2026-04-27

- 琛ュ厖鏈嶅姟鍣ㄦ墿灞曞帇缂╁寘涓嬭浇鐩綍璇存槑锛氳褰?Nginx `autoindex` 閰嶇疆銆乣/downloads/` 璁块棶鍦板潃銆乣dist/` 鐩綍绾﹀畾鍜岄獙璇佸懡浠わ紝渚夸簬鐢ㄦ埛閫夋嫨涓嶅悓鐗堟湰 zip 涓嬭浇銆?
- 琛ュ厖鏍圭洰褰?README 鍜屾墿灞曟簮鐮?README 鐨勬墿灞曞帇缂╁寘鐢熸垚鍛戒护锛屾槑纭帇缂╁寘鏍圭骇蹇呴』鐩存帴鍖呭惈 `manifest.json`锛涘悓姝ヨˉ寮?`.gitignore` 瀵规棫 `edge-extension/dist/` 鐨勫拷鐣ヨ鍒欍€?
- 灏嗘墿灞曟簮鐮佷粠 `edge-extension/extension/` 杩佺Щ鍒颁粨搴撴牴鐩綍 `extension/`锛屽皢鍘嗗彶鏂囨。杩佺Щ鍒?`docs/`锛屽皢鏃у弬鑰冭剼鏈縼绉诲埌 `legacy-reference/`锛涙柊澧炴牴鐩綍 README 鐨勬湰鍦板姞杞姐€佹墦鍖呭拰鏈嶅姟鍣ㄩ儴缃茶鏄庯紝骞舵柊澧?`.gitignore` 蹇界暐 `dist/` 绛夋瀯寤轰骇鐗┿€?
- 灏嗘墿灞曞畾浣嶈皟鏁翠负 Chrome / Chromium MV3 鍗曟簮鐮佸舰鎬侊細Chrome 鍜?Edge 閮藉姞杞藉悓涓€涓?`extension/` 鐩綍锛屼笉鍐嶈鍒掑鍒朵竴濂椾笟鍔¤繍琛屾椂浠ｇ爜锛涘悓姝ユ洿鏂扮淮鎶よ鏄庛€佹湰鍦板姞杞借鏄庡拰鎵╁睍婧愮爜鐩綍 README銆?
- 涓哄揩鍒ゆ柊澧炲綋鍓嶉煶棰戝墠杩?/ 鍚庨€€蹇嵎閿姩浣滐紝榛樿 `ArrowLeft` 鍚庨€€銆乣ArrowRight` 鍓嶈繘锛屽墠杩?/ 鍚庨€€姝ラ暱榛樿 `0.5` 绉掑苟鍙湪 options 涓厤缃€?
- 璋冩暣蹇垽鍊嶉€熶笌闊抽噺璇箟锛歰ptions 鍙繚瀛橀粯璁ゅ€嶉€熷拰榛樿闊抽噺锛涘揩鎹烽敭鍙复鏃惰皟鏁村綋鍓嶉煶棰戯紝閲嶇疆鍊嶉€?/ 閲嶇疆闊抽噺鎭㈠鍒伴潰鏉块粯璁ゅ€硷紝涓嶅啀鎵╂暎鍒板叾浠栭鍗￠煶棰戙€?
- 灏嗗揩鍒ゅ€嶉€熸杩涙敼涓?`0.1/0.25/0.5/1` 鍥涙。閫夋嫨锛岀Щ闄?options 涓?褰撳墠鍊嶉€?瀛楁銆?
- 椤堕儴涓诲鑸姸鎬佸悎骞舵樉绀烘€绘椂闀裤€佸綋鍓嶉粯璁ゆ瘡椤垫潯鏁般€侀粯璁ゅ€嶉€熷拰榛樿闊抽噺锛沗.mark-toolbox` 宸ュ叿鏍忕Щ闄ゆ瘡椤电姸鎬佸苟鏂板褰撳墠闊抽鍓嶈繘 / 鍚庨€€鎸夐挳銆?
- manifest 鐗堟湰鎻愬崌鍒?`0.2.4`锛屽悓姝ユ洿鏂板揩鍒?README 涓?`AGENTS.md` 涓殑闊抽妯″潡鑱岃矗鍜岄獙璇佹楠ゃ€?
- 灏嗗揩鍒ゅ墠杩?/ 鍚庨€€姝ラ暱涔熸敼涓?`0.1/0.25/0.5/1` 鍥涙。閫夋嫨锛屾棫鐨勯潪鍥涙。閰嶇疆浼氬洖閫€鍒?`0.5` 绉掞紱manifest 鐗堟湰鎻愬崌鍒?`0.2.5`銆?
- 鏂板鏍圭洰褰?`PRIVACY_POLICY.md`锛岀敤浜?Edge 鎵╁睍涓婃灦鏃惰鏄庢墿灞曞鐞嗙殑璁剧疆銆丩abelX 浠诲姟缁熻鏁版嵁銆佷笂浼犳帴鍙ｅ拰鐢ㄦ埛鎺у埗鏂瑰紡銆?

## 2026-04-25

- 涓?Alibaba LabelX ASR 蹇垽鏂板鎬绘椂闀跨粺璁★細璇诲彇 `/api/v1/label/center/subTask/{subTaskId}/data`锛屾眹鎬?`data.dataList[].data.duration`銆?
- 涓哄揩鍒ゆ柊澧為粯璁ゆ瘡椤垫潯鏁拌缃紝榛樿鍊间负 `all`锛屽皾璇曞皢璇︽儏椤?data 璇锋眰鏀瑰啓涓?`pageSize=400`銆?
- 鏂板蹇垽 MAIN world 缃戠粶鎹曡幏涓庤姹傛敼鍐欙紝鏀寔鍚屾爣绛鹃〉鍒锋柊鏃惰鍙栫紦瀛橀厤缃€?
- 灏嗘€绘椂闀挎樉绀轰綅缃皟鏁村埌椤甸潰椤堕儴涓诲鑸尯鍩燂紝蹇垽宸ュ叿鏍忎腑淇濈暀姣忛〉鐘舵€併€?
- 灏嗛煶棰戣繍琛屾椂鎷嗗垎涓?`audio-volume-controller.js`銆乣audio-rate-controller.js`銆乣audio-playback-controller.js`锛宍audio-controller.js` 鍙繚鐣欑紪鎺掋€佹壂鎻忓拰鍔ㄤ綔璺敱銆?
- 灏嗗垎椤靛拰鎬绘椂闀块€昏緫鎷嗗垎涓?`judgement-page-size.js` 鍜?`judgement-duration-summary.js`銆?
- 灏?MAIN world 缃戠粶閫昏緫鎷嗗垎涓?`network-protocol.js`銆乣network-config.js`銆乣network-url-rewriter.js`銆乣network-summary.js` 鍜?`network-observer.js`銆?
- 灏?`content.js` 涓殑鍒ゅ埆鍔ㄤ綔銆佸揩鎹烽敭銆佹彁绀哄拰宸ュ叿鏍忔媶鍒嗕负 `judgement-actions.js`銆乣judgement-shortcuts.js`銆乣judgement-toast.js` 鍜?`judgement-toolbar.js`銆?
- 鏇存柊蹇垽 README锛岃褰曞綋鍓嶈繍琛屾椂妯″潡杈圭晫鍜岄獙璇佹楠ゃ€?
- 灏嗛」鐩淮鎶よ鏄庣粺涓€杩佺Щ鍒颁粨搴撴牴鐩綍 `AGENTS.md`锛屽苟鏂板鏍圭洰褰?`log.md` 浣滀负闀挎湡淇敼鏃ュ織銆?
- 缁熶竴璋冩暣椤圭洰 README锛氶噸鍐?`edge-extension/README.md`锛屾洿鏂?`alibaba-labelx/README.md`銆佸揩鍒?README銆佸揩鍒ら〉闈㈢粨鏋?README 鍜岀綉缁滈噰闆?README锛屼娇鏂囨。鍖归厤褰撳墠 `asr-judgement` 妯″潡鎷嗗垎鍚庣殑瀹為檯缁撴瀯銆?
- 鍦?`AGENTS.md` 涓柊澧?Git 鎻愪氦瑕佹眰锛氭瘡娆″畬鎴愪慨鏀瑰苟楠岃瘉鍚庢彁浜わ紝鎻愪氦鍓嶆鏌ユ殏瀛樿寖鍥达紝榛樿涓嶄富鍔ㄦ帹閫併€?
- 灏嗗揩鍒?榛樿姣忛〉鏉℃暟"浠庨粯璁?`400` 璋冩暣涓洪粯璁?`100 鏉?椤礰锛岃缃〉鎻愪緵 `100/150/200/400 鏉?椤礰 鑷畾涔夋。浣嶏紝鍘嗗彶 `all/鍏ㄩ儴` 閰嶇疆鍏煎涓?`400 鏉?椤礰銆?
- 鏂板蹇垽椤垫暟璐熻浇娴嬭瘯鏂囨。锛岀敤浜庡湪 DevTools Console 瀵规瘮涓嶅悓 `pageSize` 鐨勬帴鍙ｈ€楁椂銆佸搷搴斿ぇ灏忓拰椤甸潰 DOM 鍘嬪姏銆?
- 涓哄揩鍒ゆ柊澧炲疄楠屾€?绐楀彛鍖栨樉绀?寮€鍏筹紝寮€鍚悗鎸夊綋鍓嶉鍙峰彧灞曞紑鍓嶅悗 5 棰橈紝骞舵姌鍙犵獥鍙ｅ棰樺崱浠ラ檷浣?400 鏉￠〉闈㈢殑娓叉煋鍘嬪姏銆?
- 璋冩暣蹇垽绐楀彛鍖栭殣钘忔柟寮忥細绐楀彛澶栭鍗￠珮搴︽敼涓?2px锛屽苟閫氳繃 LabelX inline CSS 鍙橀噺闅愯棌鍐呭鍖哄拰鍥炵瓟鍖猴紝鎭㈠鏃惰繕鍘熷師濮嬪彉閲忋€?
- 鍥犵獥鍙ｅ寲鏄剧ず鍦?LabelX 椤甸潰鏈兘绋冲畾鐢熸晥锛屾殏鏃朵粠 options 鍓嶇绉婚櫎寮€鍏筹紝骞跺湪杩愯鏃跺己鍒跺叧闂紱浠ｇ爜淇濈暀涓烘湭瀹屾垚鑳藉姏绛夊緟鍚庣画缁х画楠岃瘉銆?
- 鍦ㄥ揩鍒?README 涓ˉ鍏呰剼鏈兘鍔涜矾绾匡細浼樺厛鎻愭晥鑴氭湰锛屽叾娆″崐鑷姩浜哄伐锛屾渶鍚庡叏鑷姩锛涙柊澧?ASR 鏂囨湰宸紓楂樹寒銆佸樊寮傛憳瑕併€佸樊寮傚鑸瓑鍚庣画鎻愭晥鍔熻兘姹犮€?
- 涓哄揩鍒ゆ柊澧?ASR 鏂囨湰瀵归綈宸紓瑙嗗浘锛屾寜瀛楃绾х紪杈戣窛绂荤敓鎴愰珮浜榻愭枃鏈拰宸紓鎽樿銆?
- 涓哄揩鍒ゆ柊澧?閫夋嫨鍚庤嚜鍔ㄤ笅涓€棰?璁剧疆锛岄€夋嫨 `1~5` 鎴栫偣鍑诲揩鍒ゅ伐鍏锋爮鍒ゅ埆鎸夐挳鍚庡彲鑷姩璺冲埌褰撳墠椤典笅涓€棰樸€?
- 涓哄揩鍒?ASR 瀵归綈宸紓瑙嗗浘鏂板 options 寮€鍏筹紝榛樿寮€鍚紝鍏抽棴鍚庢仮澶?LabelX 鍘熷鏂囨湰灞曠ず銆?
- 淇杞啓 content 璇诲彇杩愯鏃跺绾︽椂鍙闂?`window` 鐨勫吋瀹归棶棰橈紝鏀逛负浼樺厛璇诲彇 `globalThis`锛屽噺灏?Edge MV3 闅旂鐜涓嬬殑 `Runtime contract is not loaded` 璇姤銆?
- 淇蹇垽杩涘叆鏂拌鎯呴〉鍙兘璇€夐€夐」鐨勯槻鎶わ細蹇嵎閿彧鍝嶅簲鐪熷疄鐢ㄦ埛浜嬩欢锛屽垽鍒啓鍏ヤ笉鍐嶅湪鏃犳硶瀹氫綅褰撳墠棰樺崱鏃堕粯璁ゅ洖閫€鍒扮涓€椤电涓€棰樸€?
- 淇蹇垽缃戠粶鏀瑰啓瀵艰嚧缈婚〉鏁版嵁閿欎綅锛氬師鐢?`1~50 鏉?椤礰 涓嶅啀璧扮綉缁滄敼鍐欙紱鑷畾涔夋。浣嶅彧瑕嗙洊 `pageSize`锛屼笉鍐嶆妸鎵€鏈夊垎椤佃姹傚己鍒舵敼鎴?`page=1`銆?
- 鏆傚仠蹇垽 `100/150/200/400 鏉?椤礰 鑷畾涔夊ぇ椤垫暟鍏ュ彛锛宱ptions 鍙繚鐣?LabelX 鍘熺敓 `1~50 鏉?椤礰锛屽巻鍙插ぇ椤垫暟閰嶇疆鑷姩鍥為€€涓?`50 鏉?椤礰锛屽苟璁板綍鍒版湭瀹屾垚鑳藉姏銆?
- 涓哄揩鍒ゆ柊澧炶交閲忛鍗℃憳瑕侊細褰?LabelX 鏍峰紡璁剧疆闅愯棌鍐呭鍖哄拰鍥炵瓟鍖烘椂锛屽湪姣忎釜棰樺崱鏍硅妭鐐瑰睍绀?`asr_text1`銆乣asr_text2` 鍜?鍝釜ASR鏇翠紭"鐨勫綋鍓嶉€夋嫨鐘舵€併€?
- 涓哄揩鍒よ交閲忛鍗℃憳瑕佹柊澧?options 寮€鍏筹紝榛樿寮€鍚紱鎽樿鍧楁敼涓虹敱寮€鍏虫帶鍒舵樉绀猴紝涓嶅啀瑕佹眰鍏堥殣钘?LabelX 鍐呭鍖哄拰鍥炵瓟鍖恒€?
- 璋冩暣蹇垽榛樿闊抽噺蹇嵎閿細澧炲ぇ闊抽噺涓?`[`锛屽噺灏忛煶閲忎负 `]`锛岄噸缃煶閲忎负 `\`锛屽苟閫氳繃 schema 杩佺Щ琛ラ綈鏃ч厤缃腑鐨勭┖蹇嵎閿€?
- 淇蹇垽杞婚噺棰樺崱鎽樿鍦?LabelX 妯悜棰樺崱甯冨眬涓笉鍙鐨勯棶棰橈細鎽樿棰樺崱鏍硅妭鐐瑰己鍒跺崰婊℃暣琛岋紝骞跺鍔犱粠 ASR 宸紓瑙嗗浘 `data-asr-edge-signature` 鍥為€€璇诲彇鏂囨湰銆?
- 鍐嶆璋冩暣蹇垽杞婚噺棰樺崱鎽樿鎸傝浇鐐癸細鎽樿鏀逛负鎻掑叆鍒?`.labelRender-scrollable` 涓嬪搴斿師棰樺崱鍓嶆柟锛岄伩鍏嶅師棰樺崱鍦ㄩ殣钘忓唴瀹瑰尯 / 鍥炵瓟鍖哄悗琚帇缂╂垨瑁佸壀瀵艰嚧鎽樿涓嶅彲瑙併€?
- 淇蹇垽杞婚噺棰樺崱鎽樿鍦?LabelX 鎸佺画 DOM 鏇存柊鏃朵笉鐢熸垚鐨勯棶棰橈細鍚姩鏃剁珛鍗虫壂鎻忛鍗★紝鍚庣画 MutationObserver 鏀逛负鑺傛祦鎵弿锛岄伩鍏嶉槻鎶栬鏃跺櫒琚繛缁彉鍔ㄩ暱鏈熼噸缃€?
- 鍚屾淇蹇垽 ASR 瀵归綈宸紓瑙嗗浘鐨勬壂鎻忔椂鏈猴細鍚姩鏃剁珛鍗冲鐞嗙幇鏈夐鍗★紝鍚庣画 DOM 鍙樺姩鏀逛负鑺傛祦鎵弿锛岄伩鍏嶅埛鏂伴〉闈㈠悗宸紓瑙嗗浘杩熻繜涓嶇敓鎴愩€?
- 澧炲己蹇垽杞婚噺棰樺崱鎽樿锛氬湪"鍝釜ASR鏇翠紭"褰撳墠閫夋嫨涓嬫柟鏄剧ず闊抽鏃堕棿姣旓紝骞跺湪 ASR 瀵归綈宸紓瑙嗗浘寮€鍚椂鍚屾鐢ㄥ樊寮傞珮浜増鏈睍绀烘憳瑕佸唴涓ゆ潯 ASR 鏂囨湰銆?
- 淇蹇垽杞婚噺棰樺崱鎽樿瀹藉害锛氭憳瑕佸灞備繚鎸佹暣琛岄伩鍏嶄笌鍘熼鍗″苟鎺掞紝鍐呴儴鍙鍗＄墖鎸夊搴?`.labelRender-item` 瀹為檯瀹藉害缂╂斁锛岄€傞厤 LabelX 鍗＄墖澶у皬 / 鍒楁暟鍙樺寲銆?
- 涓哄揩鍒?ASR 瀵归綈宸紓瑙嗗浘鏂板棰滆壊璁剧疆锛歰ptions 鍙垎鍒厤缃浛鎹?/ 涓嶅悓瀛椼€佺己瀛?/ 澶氬瓧銆佹爣鐐?/ 绌烘牸鐨勯珮浜儗鏅壊锛屾櫘閫氬樊寮傝鍥惧拰杞婚噺棰樺崱鎽樿鍏辩敤璇ラ厤缃€?
- 浼樺寲蹇垽 ASR 鏂囨湰瀵归綈绠楁硶锛氶檷浣庢爣鐐瑰拰绌烘牸鎻掑叆 / 鍒犻櫎鏉冮噸锛屽噺灏戞爣鐐瑰樊寮傚鑷翠腑鏂囦富浣撻敊浣嶇殑闂銆?
- 淇蹇垽杞婚噺棰樺崱鎽樿鎸傝浇鏂瑰紡锛氭憳瑕佹敼涓烘彃鍏?`.labelRender-item` 鏍硅妭鐐瑰唴閮ㄩ《閮紝骞舵竻鐞嗘棫鐗堝閮ㄦ憳瑕佸潡锛屾仮澶?LabelX 鍘熺敓澶氬垪 / flex 鎺掔増銆?
- 浼樺寲蹇垽杞婚噺棰樺崱鎽樿灞曠ず锛欰SR 鏂囨湰鏀逛负鑷姩鎹㈣瀹屾暣鏄剧ず锛屼簲绉嶅垽鍒粨鏋滀娇鐢ㄤ笉鍚岄鑹诧紝宸紓鎽樿绉诲姩鍒版爣棰樹笅鏂逛互瀵归綈鍙充晶闊抽鏃堕棿銆?
- 鏂板蹇垽缁熻涓婁紶妗嗘灦锛氬垱寤?`asr-judgement-server.js`锛屾寜 CSV 鏍蜂緥鐢熸垚鍒嗗寘绾цˉ涓佽褰曪紝鏀寔杩涘叆瀛愪换鍔″悗涓婁紶銆佸伐鍏锋爮鎵嬪姩涓婁紶銆?0:00 / 16:00 瀹氭椂涓婁紶鍜岃繙绋嬫椂闂撮厤缃?URL 棰勭暀銆?
- 璋冩暣蹇垽缁熻涓婁紶鍏ュ彛锛氫笂浼犳寜閽Щ鍒?options 蹇垽璁剧疆闈㈡澘锛屽彇娑堣繘鍏ュ瓙浠诲姟璇︽儏鑷姩涓婁紶锛涗笂浼犲湴鍧€鏀逛负鏈嶅姟鍣?/ 鏈満涓や釜閫夐」锛岄粯璁ゆ湇鍔″櫒 `47.108.254.138:3333`锛屽苟璁?`asr-judgement-server.js` 鍙洿鎺ュ惎鍔ㄦ湰鍦版帴鏀舵湇鍔°€?
- 鎷嗗垎蹇垽缁熻鏈湴鏈嶅姟锛歚asr-judgement-server.js` 鍥炲綊鎵╁睍渚т笂浼犺繍琛屾椂锛屾柊澧?`backend/server.js` 浣滀负 Node 鍚姩鍏ュ彛锛屽苟鎸?HTTP銆丆SV 鍒椼€丆SV 鍐欏叆銆佹枃浠跺瓨鍌ㄥ拰鍒嗗寘鍚堝苟鎷嗘垚灏忔枃浠躲€?
- 璋冩暣蹇垽缁熻涓婁紶鍒?LabelX 鏍囨敞棣栭〉锛氬湪 `labelingTask?projectId=...` 椤甸潰鏄剧ず"涓婁紶缁熻"鎸夐挳锛屼娇鐢ㄩ椤?`tasks`銆乣subTasks` 鍜?`/subTask/{subTaskId}/data` 鎵归噺閲囬泦鍚庝笂浼狅紝options 涓嶅啀鎻愪緵鎵嬪姩涓婁紶鎸夐挳鍜屽崟鐙殑瀹氭椂鏃堕棿杈撳叆妗嗐€?
- 蹇垽缁熻瀹氭椂閰嶇疆鏀逛负浠?涓婁紶鎺ュ彛鍦板潃"杩藉姞 `purpose=schedule` 鑾峰彇锛屾湰鍦?`backend` 鏈嶅姟鏀寔鎵归噺 `payloads` 鍚堝苟锛屽苟鏂板瀹氭椂閰嶇疆鍝嶅簲銆?
- 浼樺寲蹇垽缁熻涓婁紶棣栭〉閲囬泦锛氶€氳繃 DevTools 纭瀹℃牳棣栭〉 `/checkTask` 浣跨敤 `type=check` / `subTaskType=check`锛屼笂浼犳寜閽敼涓烘寕杞藉湪椤堕儴澶村儚鏃侊紝棣栭〉鐐瑰嚮鏃跺悓鏃堕噰闆嗘爣娉ㄥ拰瀹℃牳涓ょ被鍒嗗寘锛涜ˉ鍏呭ご鍍?hover 鐢ㄦ埛鍚嶇粨鏋勩€佸鏍搁椤电粨鏋勫拰缃戠粶閲囬泦鏂囨。銆?
- 涓哄揩鍒ょ粺璁′笂浼犳柊澧?ASR 鏇翠紭鍒ゆ柇浠诲姟杩囨护锛氫紭鍏堟寜 `labelModel=vote` 璇嗗埆锛岀粨鍚?`taskName` 鍜?`size=400` 鍏滃簳锛岃嚜鍔ㄨ烦杩?`labelModel=single`銆乣size=50` 鎴?`涓枃鏅€氳瘽asr浠诲姟` 鐨勫巻鍙茶浆鍐欐暟鎹€?
- 浼樺寲蹇垽缁熻涓婁紶鏁版嵁瑙勬ā澶勭悊锛氭椂闀跨鏁扮粺涓€淇濈暀 4 浣嶅皬鏁帮紝璇︽儏椤典笂浼犲拰瀹氭椂涓婁紶鏀逛负鎸?`projectId` 閲囬泦鍏ㄨ处鍙锋暟鎹紱鏈湴缁熻鏈嶅姟榛樿鍙惤鍚堝苟 CSV锛屼笉鍐嶅啓 `statistics-rows.json` 鍜屼笂浼犱簨浠舵棩蹇楋紝骞跺皢鎵归噺鍚堝苟鏀逛负涓€娆¤鍐欍€?
- 淇蹇垽璇︽儏椤电粺璁′笂浼狅細绉婚櫎褰撳墠 `subTaskId` 鍗曟潯涓婁紶鍥為€€锛岃鎯呴〉銆侀椤靛拰瀹氭椂涓婁紶缁熶竴璧?`projectId` 椤圭洰绾ф壒閲忛噰闆嗭紝淇濊瘉鍚屼竴璐﹀彿鍚屼竴椤圭洰涓婁紶琛屾暟涓€鑷淬€?
- 鏂板鏍圭洰褰?`platform-resources/` 骞冲彴璧勬簮搴擄紝杩佺Щ Alibaba LabelX 蹇垽鐨勯〉闈㈢粨鏋勩€佺綉缁滈噰闆嗐€佺粺璁℃牸寮忋€佹湭瀹屾垚浜嬮」鍜屾湰鍦拌皟璇曞悗绔紱鍚庣画璺?Edge / Chrome 鍏辩敤鐨勮祫鏂欎笌宸ュ叿缁熶竴鍐欏叆璇ョ洰褰曘€?
- 绉婚櫎蹇垽鎵╁睍鐩綍涓殑鏃?`page-structure/` 鍐呭锛涘皢蹇垽缁熻鏈湴 Node 鏈嶅姟杩佺Щ鍒?`platform-resources/alibaba-labelx/asr-judgement/backend/`锛屽苟鏇存柊鍚姩璺緞鍜岀粺璁¤緭鍑虹洰褰曘€?
- 鏂板 `platform-resources/backend/` 缁熶竴 Node 鍚庣鍏ュ彛鍜岃矾鐢辨敞鍐岀粨鏋勶紝蹇垽椤圭洰鍚庣鏀逛负閫氳繃 `index.js` 娉ㄥ唽 API锛涙柊澧炵粺璁?CSV 涓嬭浇鎺ュ彛 `/api/alibaba-labelx/asr-judgement/statistics/download`銆?
- 灏嗗揩鍒ょ粺璁℃湇鍔″櫒涓婁紶鍦板潃鏀逛负鍩熷悕 `https://script.xiangtianzhen.store/api/alibaba-labelx/asr-judgement/statistics/upload`锛屾墿灞?manifest 鐗堟湰鎻愬崌鍒?`0.2.1` 骞舵柊澧炲煙鍚?host permission锛涚Щ闄?CSV 涓嬭浇鏃ф帴鍙?`/api/asr-judgement/statistics/download`銆?
- 鍚堝苟蹇垽缁熻璧勬枡鐩綍锛氬垹闄や粎鍚?README 鐨?`platform-resources/alibaba-labelx/asr-judgement/statistics/`锛岀粺璁″琛ㄥ瓧娈点€佷笂浼犺鍒欏拰鏈嶅姟绔悎骞跺绾︾粺涓€缁存姢鍒?`backend/README.md`銆?
- 鎭㈠蹇垽榛樿姣忛〉鏉℃暟涓殑 `400 鏉?椤礰 鍏ュ彛锛歰ptions 鍙柊澧?400 妗ｄ綅锛岃繍琛屾椂灏?400 璇嗗埆涓鸿嚜瀹氫箟鍏ㄩ噺璇锋眰骞舵敼鍐欒鎯呴〉 `data` 璇锋眰锛宍100/150/200 鏉?椤礰 缁х画涓嶅紑鏀惧苟鍥為€€鍒?`50 鏉?椤礰銆?
- 鏂板蹇垽"闆烽鍒ゆ柇"鑳藉姏锛歮anifest 鐗堟湰鎻愬崌鍒?`0.2.2`锛屾墦鍖呮湰鍦?`thunder-question-bank.csv` 闆烽搴擄紝options 榛樿寮€鍚紑鍏筹紱鍛戒腑闆烽鏃跺湪杞婚噺棰樺崱鎽樿鍜屽洖绛斿尯"鐗规畩鎯呭喌鏍囨敞"鏄剧ず鏍囧噯绛旀锛屽綋鍓嶉€夋嫨涓庢爣鍑嗙瓟妗堜笉涓€鑷存椂鏄剧ず绾㈣壊涓ラ噸鎻愮ず鍜岄敊璇?toast銆?
- 澧炲己蹇垽缁熻涓婁紶澶辫触璇婃柇锛氶潪 2xx 鍝嶅簲浼氭樉绀虹姸鎬佺爜銆佺洰鏍囦笂浼犲湴鍧€鍜屽搷搴旀憳瑕侊紱娴忚鍣ㄦ潈闄愩€丆ORS銆佽瘉涔︽垨缃戠粶鎷︽埅瀵艰嚧璇锋眰鏈彂鍑烘椂浼氭樉绀烘洿鏄庣‘鐨勯敊璇潵婧愩€?
- 淇杞啓鑴氭湰鍦?LabelX 闈炶浆鍐欓〉闈㈢殑濂戠害缂哄け鍛婅锛歮anifest 鐗堟湰鎻愬崌鍒?`0.2.3`锛宍content.js` 鏀逛负绛夊緟 `runtime-contract.js` 娉ㄥ叆鍚庡啀鍚姩锛岃秴鏃朵粛缂哄け鏃朵互 info 绾ф棩蹇楄烦杩囷紝閬垮厤鍦ㄥ揩鍒ら椤靛嚭鐜?`Runtime contract is not loaded` 鎵╁睍閿欒銆?
## 2026-05-08

- ASR 杞啓缃戠粶璇锋眰鏂囨。琛ュ綍锛氭柊澧?`platform-resources/alibaba-labelx/asr-transcription/network.md`锛屽熀浜庣湡瀹?DevTools 閲囬泦娌夋穩棣栭〉涓庤鎯呴〉鎺ュ彛缁撴瀯锛堣劚鏁忥級銆?
- 鏄庣‘杞啓鍙栨暟鍏抽敭绾︽潫锛氳鎯呮帴鍙?`subTask/{id}/data` 浣跨敤 `pageSize=10`锛沗subTaskId` 闇€鍏?`decode + 鍘荤┖鐧絗 鍚庡啀鎷兼帴璇锋眰銆?
- 鏄庣‘浠诲姟璇嗗埆杈圭晫锛歚labelModel=vote` / "ASR鏇翠紭缁撴灉鍒ゆ柇"绫讳换鍔℃帓闄わ紝`labelModel=single` / `size=50` / "涓枃鏅€氳瘽asr浠诲姟"绫讳换鍔￠噰闆嗐€?
- 鍚屾鏇存柊 `platform-resources/alibaba-labelx/asr-transcription/README.md` 涓?`platform-resources/alibaba-labelx/README.md`锛屽皢杞啓缃戠粶鏂囨。浠庡崰浣嶈鏄庡崌绾т负鍙墽琛屽彛寰勬枃妗ｃ€?

- 鏂板 Magic Data ANNOTATOR 骞冲彴鍓嶇疆閲囬泦鏂囨。鐩綍锛歚platform-resources/magic-data/annotator/`銆?
- 鏂板骞剁淮鎶ゆ枃妗ｏ細`README.md`銆乣page-structure.md`銆乣network.md`銆乣safety-boundary.md`銆乣development-plan.md`銆?
- 鏈疆閲囬泦椤甸潰鑼冨洿锛氶椤点€佹爣娉ㄤ换鍔￠〉銆佹爣娉ㄤ换鍔¤鎯呴〉銆佹爣娉ㄥ崟鏉￠〉銆佸鏍镐换鍔￠〉銆佸鏍镐换鍔¤鎯呴〉銆佸鏍稿崟鏉￠〉銆?
- 宸查€氳繃 `chrome_devtools` 瀹屾垚鐪熷疄椤甸潰鍙閲囬泦锛岃褰曡姹傛憳瑕佸苟鑴辨晱澶勭悊銆?
- 鏄庣‘鏁忔劅鍔ㄤ綔杈圭晫锛氶鍙栥€佸紑濮嬶紙浼氭敼鐘舵€侊級銆佷繚瀛樸€佹彁浜ゃ€佸鏍搁€氳繃銆佸鏍搁┏鍥炪€侀€€鍥炪€佹壒閲忔祦杞瓑鍧囩姝㈣嚜鍔ㄨЕ鍙戙€?
- 鏈疆鏈慨鏀规墿灞曡繍琛屾椂浠ｇ爜锛涙湭淇敼 `extension/manifest.json`锛涙湭淇敼 `extension/options/`锛涙湭淇敼 `extension/popup/`銆?
- 鎸?`platform-resources/alibaba-labelx/asr-judgement` 鐩綍鏂瑰紡閲嶆瀯 Magic Data 鏂囨。锛氭柊澧?`platform-resources/magic-data/annotator/page-structure/` 涓?`network/` 瀛愮洰褰曘€?
- `page-structure.md` 涓?`network.md` 鏀逛负鍏煎绱㈠紩鍏ュ彛锛岃缁嗗唴瀹规媶鍒嗗埌瀛愮洰褰曞鏂囦欢銆?
- 琛ュ叏 `network.md` 缂哄け椤癸細鏂板娆㈣繋椤点€佹爣娉ㄩ摼璺€佸鏍搁摼璺€侀煶棰戣劚鏁忋€佹晱鎰熷啓鎿嶄綔娓呭崟涓庡緟琛ラ噰椤广€?

## 2026-05-09

- 琛ュ厖 Alibaba LabelX 骞冲彴鍏叡璧勬枡锛氭柊澧?`platform-resources/alibaba-labelx/network.md`锛屽皢杞啓鍜屽揩鍒ゅ叡鐢ㄧ殑 `data/summary/board/getLabelTaskInfo/tasks/subTasks/tasks/process/save/commit/fetch/audio` 鎺ュ彛娌夋穩涓哄叕鍏辩綉缁滃彛寰勩€?
- 鏂板 `platform-resources/alibaba-labelx/page-structure.md`锛岃褰曢€氱敤椤堕儴瀵艰埅銆佹爣娉?瀹℃牳棣栭〉銆佽鎯呴〉 `.mark-toolbox`銆乣.labelRender-item`銆侀煶棰戞帶浠跺拰楂橀闄╂寜閽竟鐣屻€?
- 鏂板 `platform-resources/alibaba-labelx/asr-transcription/page-structure.md`锛岃褰?ASR 杞啓瀹℃牳棣栭〉鍜?`missionType=check` 璇︽儏椤?HTML/DOM 缁撴瀯銆侀煶棰戠粨鏋勩€佹湁鏁堟€у垏鎹€佹枃鏈紪杈戝拰鎻愪氦浠诲姟琛屼负銆?
- 鏇存柊 `platform-resources/alibaba-labelx/asr-transcription/network.md`锛岃ˉ鍏呭鏍搁椤?`type=check/subTaskType=check`銆佸鏍歌鎯呴〉瀛楁銆佽嚜鍔ㄤ繚瀛樸€乣mistake`銆乣subTask/{id}/data` 淇濆瓨銆乣commit` 鍜?`check/fetch` 閾捐矾銆?
- 鏄庣‘褰撳墠鐪熷疄鎺ュ彛鏈彂鐜?`supplier/vendor/company/provider/渚涘簲鍟哷 瀛楁锛涘悗缁緵搴斿晢缁熻鍙兘鎸?`payload` 鏄惧紡瀛楁銆乣csvPatch["渚涘簲鍟?]` 鎴?`taskName/name` 鍓嶇紑鎺ㄦ柇锛屽綋鍓嶆牱渚嬪寘鎷?`妫嬬噴` 鍜屽巻鍙叉牱渚?`甯屽皵璐濆３`銆?
- 杩藉姞閲囬泦 LabelX ASR 杞啓瀹℃牳璇︽儏椤碉細纭 `鎻愪氦骞剁粨鏉焋 澶嶇敤 `subTask/{subTaskId}/commit`锛屼絾涓嶄細瑙﹀彂 `check/fetch` 鑷姩棰嗗彇锛屼細鐩存帴杩斿洖瀹℃牳棣栭〉銆?
- 琛ュ厖璇︽儏椤靛垎椤点€佹瘡椤垫潯鏁板拰绛涢€夊绾︼細绗?2/3 椤典細閲嶆媺 `data/summary/board`锛涘師鐢熸瘡椤垫潯鏁板彲瑙?`1/2/3/4/5/10/20/30/40/50 鏉?椤礰锛涘洖绛斿尯閫夋嫨棰樼瓫閫夊啓鍏?`filter.questions[].title/value`銆?
- 琛ラ噰 Alibaba LabelX ASR 杞啓鏍囨敞璇︽儏椤碉細纭 `missionType=label` 鏅€氭彁浜よЕ鍙?`POST /api/v1/label/center/subTask/{subTaskId}/commit`锛岃嚜鍔ㄩ鍙栧紑鍚椂缁х画瑙﹀彂 `POST /api/v1/label/center/{taskId}/label/fetch`銆?
- 楠岃瘉杞啓鏍囨敞璇︽儏椤?`50 鏉?椤礰锛氶〉闈竴娆℃覆鏌?50 涓煶棰戦鍗★紝蹇€熸壒閲忓啓鍏?10 涓?textarea 鍙骇鐢?1 鏉?`dataList` 淇濆瓨锛屽悗缁叏椤典竴閿～鍏呬笉鑳戒緷璧栨壒閲?DOM 鍐欏叆鍚庣粺涓€澶辩劍銆?
- 琛ュ厖杞啓鏍囨敞淇濆瓨濂戠害锛氭枃鏈紪杈戣嚜鍔ㄤ繚瀛樹粛璧?`POST /api/v1/label/center/subTask/{subTaskId}/data`锛屼繚瀛樹綋椤跺眰涓?`dataList` 鍜?`timestamp`锛岄煶棰?URL 瀛楁蹇呴』鎸佺画鑴辨晱銆?
- 鏈疆鍙洿鏂板钩鍙拌祫鏂?Markdown 鍜屾棩蹇楋紝鏈慨鏀规墿灞曡繍琛屾椂浠ｇ爜銆乵anifest銆佸悗绔唬鐮佹垨杩愯鏁版嵁銆?
- 琛ラ噰 Alibaba LabelX ASR 杞啓瀹℃牳璇︽儏椤甸┏鍥為摼璺細椤堕儴 `椹?鍥瀈 鎵撳紑 `椹冲洖鑷充笂涓幆鑺俙 寮圭獥锛屾彁浜ゅ悗瑙﹀彂 `POST /api/v1/label/center/subTask/{subTaskId}/reject`锛岃姹備綋瀛楁涓?`subTaskId/rejectReason/type/userIdList`锛屾垚鍔熷悗杩斿洖瀹℃牳棣栭〉銆?
- 琛ラ噰杞啓璇︽儏椤电瓫閫夐潰鏉匡細璁板綍 dropdown / filter 闈㈡澘 class銆佸唴瀹瑰尯鍏抽敭璇?`filter.content`銆乣questionsQueryConditions=OR` 鍜?`dataStatus=UNFINISHED`銆?
- 灏濊瘯楂橀€熷叏椤靛～鍏呬繚瀛樻柟妗堬細鍦?`椹冲洖涓璥 瀹℃牳璇︽儏椤电洿鎺?POST 3 鏉?`dataList[]` 鍜屾渶灏忓瓧娈典繚瀛樺潎杩斿洖涓氬姟 `code=400`锛岄〉闈㈣嚜韬崟鏉¤嚜鍔ㄤ繚瀛樹篃杩斿洖 `code=400`锛涚‘璁よ鐘舵€侀〉闈笉鑳介獙璇佷繚瀛樻垚鍔熷瀷鎵归噺鍐欏叆锛岄渶瑕佸悗缁湪姝ｅ父鍙紪杈戣鎯呴〉澶嶆祴銆?

- 鍗囩骇鎵╁睍鐗堟湰鍒?`0.2.11`锛屾柊澧?Alibaba LabelX 杞啓/蹇垽缁熻"鎸変緵搴斿晢鍒嗚〃"鑳藉姏锛屾柊澧炴墿灞曚晶 `extension/shared/statistics-supplier.js` 鍜屽悗绔晶 `platform-resources/alibaba-labelx/supplier-utils.js` 缁熶竴渚涘簲鍟嗚瘑鍒伐鍏枫€?
- 杞啓涓庡揩鍒ょ粺璁?CSV 鏂板 `渚涘簲鍟哷 鍒楋紝涓婁紶 payload 鏂板 `supplier` 瀵硅薄銆乣mergeKey.supplierKey/supplierName`锛屽苟灏嗗箓绛夊悎骞堕敭鍗囩骇涓?`渚涘簲鍟?+ 鍒嗗寘ID`锛岄伩鍏嶈法渚涘簲鍟嗗悓鍒嗗寘鍐茬獊瑕嗙洊銆?
- 涓ゅ鍚庣缁熻鏈嶅姟鍧囨敼涓轰粎鍐欏叆 `statistics-data/suppliers/<渚涘簲鍟?/statistics-merged.csv`锛涗笉鍐嶇淮鎶ゆ牴绾?`statistics-data/statistics-merged.csv`锛屼絾缁х画鍏煎璇诲彇鍘嗗彶鏍圭骇 CSV 浣滀负杩佺Щ杈撳叆锛屼笉鍒犻櫎鏃ф枃浠躲€?
- 鏂板骞剁粺涓€涓嬭浇濂戠害锛歚/statistics/download` 蹇呴』甯?`supplier` 鍙傛暟锛涙湭浼犺繑鍥?`400` 涓旀彁绀?`suppliers` 鍒楄〃鎺ュ彛銆傛柊澧?`.../statistics/suppliers` 鐢ㄤ簬鍒楀嚭鍙笅杞戒緵搴斿晢涓庝笅杞介摼鎺ャ€?
- 鏇存柊缁熶竴鍚庣鍚姩鏃ュ織鍜?health 杩斿洖鍙ｅ緞锛屾樉寮忔彁渚?`suppliersPath`銆乣downloadRequiresSupplier`銆乣suppliersDir`锛屽苟灏嗘棫 `csvPath` 鏍囪涓?deprecated 绌哄€笺€?
- 鍚屾鏇存柊鍗忎綔涓庢枃妗ｈ鍒欙細鏂板 Chrome DevTools / MCP 浼樺厛閲囬泦銆丳laywright Edge 浠呯敤浜庣湡瀹炴搷浣滈獙璇佹垨鍏滃簳銆佺敤鎴峰洖澶?澶勭悊濂戒簡"鍚庡啀缁х画閲囬泦娴嬭瘯锛屼互鍙?LabelX 鍏叡璧勬枡涓庤浆鍐欎笓椤硅祫鏂欑洰褰曟矇娣€瑕佹眰銆?

## 2026-05-10锛?.2.11 灏忎慨姝ｏ細缁熻 CSV 涓枃涔辩爜涓庡仴搴峰€艰鐩栵級

- 淇 LabelX 杞啓/蹇垽缁熻閾捐矾涓殑涓枃鏇挎崲瀛楃 `锟絗 闂锛岄噸鐐硅鐩?`浠诲姟鍚嶇О`銆乣鏍囨敞鍛?瀹℃牳鍛榒銆乣渚涘簲鍟哷銆?
- 鏂板/缁熶竴鏂囨湰璐ㄩ噺瑙勫垯锛氳瘑鍒?`U+FFFD` 涓烘崯鍧忔枃鏈紝鍚堝苟鏃?鏂板仴搴峰€间紭鍏堣鐩栨棫鎹熷潖鍊?銆?
- 渚涘簲鍟嗚В鏋愬寮猴細`渚涘簲鍟?鏈瘑鍒緵搴斿晢/unknown-supplier/鍚拷` 鏃跺洖閫€浠诲姟鍚嶆帹鏂紝涓嶅啀淇濈暀鎹熷潖渚涘簲鍟嗗€笺€?
- CSV writer 缁熶竴鏀逛负 UTF-8 with BOM 鍐欏叆锛屽吋瀹?Excel 鐩存帴鎵撳紑涓枃鏄剧ず銆?
- CSV/file-store/payload-merge 涓夊眰鍚屾鏀舵暃娓呮礂瑙勫垯锛岄伩鍏嶆棫鎹熷潖鍊兼寔缁薄鏌撴柊瀵煎嚭銆?
- 涓诲瓨鍌ㄥ彛寰勪繚鎸佹牴绾?`statistics-data/statistics-merged.csv`锛屼笉涓诲姩鐢熸垚 `statistics-data/suppliers/`銆?
- 杞啓/蹇垽鍓嶇 payload 鏋勯€犲鍔犲仴搴锋枃鏈紭鍏堥€夋嫨锛岄檷浣庢簮澶存惡甯︽崯鍧忓€兼鐜囥€?

## 2026-05-10锛?.2.11 灏忎慨姝ｏ細瀵煎嚭瀹屾暣鎬ф牎楠?+ 鏂偣璺宠繃 + 瀹氭椂寤惰繜锛?

- 鏂板杞啓/蹇垽 existing 妫€鏌ユ帴鍙ｏ細瀵煎嚭鍓嶆寜鍒嗗寘ID鎵归噺鍒ゆ柇鏄惁宸插畬鏁达紝瀹屾暣鏁版嵁璺宠繃璇︽儏鎷夊彇銆?
- 鍒嗗寘ID涓虹┖鐨勬暟鎹洿鎺ュ簾寮冿紝涓嶅啓 CSV銆佷笉涓婁紶锛屽苟璁″叆澶辫触/搴熷純缁熻銆?
- 鍚庣鍚堝苟缁撴灉鏂板澶辫触鍒楄〃锛坒ailedCount/failures锛夛紝涓嶄腑鏂暣鎵瑰鐞嗭紝渚夸簬鍓嶇浜屾閲嶈瘯銆?
- 鍓嶇涓婁紶娴佺▼鏂板 skippedComplete/discardedNoBatch/failedPayloadValidation 姹囨€讳笌澶辫触鎻愮ず銆?
- 缁撴潫鏃惰嫢澶辫触鏁?> 0锛岀粺涓€鎻愮ず"鏈夋暟鎹鍑哄け璐ワ紝璇峰啀娆＄偣鍑诲鍑?銆?
- 鍔ㄦ€佸苟鍙戜笂闄愮敱 500 璋冩暣涓?999锛歚Math.floor(total/5)`锛屾渶灏?銆佹渶澶?99銆?
- 瀹氭椂涓婁紶鏀逛负 10:00/16:00锛涙柊澧?schedule 涓婁紶鍓嶉殢鏈哄欢杩?0~300 绉掞紙100ms 姝ヨ繘锛夛紱鎵嬪姩涓婁紶涓嶅欢杩熴€?
- 涓诲瓨鍌ㄧ户缁牴绾?`statistics-data/statistics-merged.csv`锛屼笉涓诲姩鍒涘缓 `statistics-data/suppliers/`銆?
- CSV 缁х画 UTF-8 with BOM銆佸崟渚涘簲鍟嗕笉鍑?渚涘簲鍟?鍒椼€佸渚涘簲鍟嗘湯鍒楄拷鍔?渚涘簲鍟?銆?

## 2026-05-10锛堜慨姝ｇ粺璁″け璐ュ垽鏂苟淇濈暀閮ㄥ垎鎴愬姛鏁版嵁锛?

- 淇杞啓/蹇垽鍓嶇 payload 鏍￠獙鍙ｅ緞锛氫粎 `鍒嗗寘ID` 缂哄け鎵嶆嫆缁濅笂浼狅紱鍏朵綑鍏抽敭瀛楁绌哄€兼敼涓?warning/incomplete锛屼笉鍐嶈鍏?failed銆?
- 淇杞啓/蹇垽杩涘害姹囨€伙細`failed` 浠呯粺璁＄湡姝ｅけ璐ワ紙璇︽儏璇锋眰寮傚父銆佹牎楠屾嫆缁濄€佷笂浼犲け璐ョ瓑锛夛紝`discardedNoBatchId` 涓?`warningPayloadCount` 鍗曠嫭灞曠ず銆?
- 淇杞啓/蹇垽鏈€缁堟彁绀猴細浠?`failed > 0` 鎵嶆彁绀?鏈夋暟鎹鍑哄け璐ワ紝璇峰啀娆＄偣鍑诲鍑?锛涗粎 warning 鏃舵彁绀?閮ㄥ垎瀛楁寰呭悗缁鑹茶ˉ榻?銆?
- 淇鍚庣 existing complete 鍒ゅ畾锛氳浆鍐欐寜 `label=鏍囨敞瀛愪换鍔D`銆乣audit=瀹℃牳瀛愪换鍔D`锛涘揩鍒ゆ寜 `label=浠讳竴鏍囨敞鍛樺瓙浠诲姟ID`銆乣audit=瀹℃牳瀛愪换鍔D`锛屼笉鍐嶈姹傚彟涓€瑙掕壊瀛楁瀹屾暣銆?
- 淇鍚庣鎵归噺涓婁紶杩斿洖缁撴瀯锛氭柊澧?`acceptedCount/rejectedCount/rejectedItems`锛屼繚鐣?`failedCount/failures` 鍏煎瀛楁锛岀‘淇?閮ㄥ垎澶辫触涓嶅奖鍝嶆垚鍔熷啓鍏?銆?
- 淇濇寔涓诲瓨鍌ㄤ负鏍圭骇 `statistics-data/statistics-merged.csv`锛屼笉涓诲姩鍒涘缓 `statistics-data/suppliers/`銆?
- 淇濇寔骞跺彂瑙勫垯 `Math.floor(total/5)`锛堟渶灏?1锛屾渶澶?999锛夈€佸畾鏃朵笂浼?`10:00/16:00`銆佸畾鏃堕殢鏈哄欢杩?`0~300s`锛?00ms 姝ヨ繘锛夈€?

## 2026-05-10锛堜慨姝ｇ粺璁¤烦杩囧畬鏁村垽鏂拰杩涘害瀹藉害锛?

- 淇 `existing complete` 鍒ゅ畾杩囧闂锛歚exists=true` 涓嶅啀鐩存帴璺宠繃锛岃浆鍐?蹇垽閮芥敼涓?鍩虹瀛楁 + 褰撳墠 role 瀛愪换鍔D"鏈€浣庡畬鏁存潯浠躲€?
- 杞啓/蹇垽鍧囨敮鎸侊細浠诲姟鍚嶇О绌哄€煎垽 `complete=false`锛堝緟琛ワ級锛岃€岄潪澶辫触锛涗笅涓€娆″鍑轰細缁х画鎷夎鎯呰ˉ榻愩€?
- 淇鍓嶇璺宠繃閫昏緫锛氫粎 `complete=true` 璁″叆 `skippedComplete`锛沗exists=true && complete=false` 缁х画鎷夎鎯呭苟鍙笂浼犺ˉ榻愩€?
- 淇鏃犳剰涔変笂浼狅細褰?`payloads.length===0` 鏃朵笉璋冪敤涓婁紶鎺ュ彛锛屾樉绀?宸插叏閮ㄥ畬鏁达紝鏃犻渶涓婁紶"锛屼笉鍐嶅嚭鐜?涓婁紶 1"鍗犱綅琛屼负銆?
- 杩涘害闈㈡澘鏍峰紡浼樺寲锛氬搴︽彁鍗囧埌 `min-width:560px / max-width:780px`锛屾枃鏈厑璁告崲琛岋紝鍥涗綅鏁版垚鍔?澶辫触璁℃暟鍙銆?
- 淇濇寔涓诲瓨鍌ㄥ彛寰勶細鏍圭骇 `statistics-data/statistics-merged.csv`锛屼笉涓诲姩鐢熸垚 `statistics-data/suppliers/`銆?
- 鐗堟湰淇濇寔 `0.2.11`锛屽苟鍙戣鍒欎繚鎸?`Math.floor(total/5)`锛堟渶灏?銆佹渶澶?99锛夈€?

## 2026-05-11锛?.3.0 娴嬭瘯淇锛歰ptions 闅愯棌鍏ュ彛鑱斿姩锛?

- 淇 options 棣栭〉"鍚庣鎺ュ彛鍦板潃"闅愯棌鍏ュ彛鐘舵€佸垎瑁傞棶棰橈紝缁熶竴涓哄崟涓€瑙ｉ攣鐘舵€侊細杩炵画鐐瑰嚮"鍚庣鎺ュ彛鍦板潃"鏍囬 10 娆″悗锛屽悓鏃舵樉绀?鏈嶅姟鍣?鏈満"鍒囨崲鎸夐挳涓?椤圭洰鏁版嵁涓嬭浇"闈㈡澘銆?
- 鏈В閿佸墠缁熶竴闅愯棌鍚庣鍒囨崲涓庨」鐩暟鎹笅杞斤紝骞剁Щ闄ゆ墍鏈?杩炵画鐐瑰嚮 10 娆?鎻愮ず鏂囨銆?
- 鏈В閿佸墠 `home-endpoint-status` 涓嶅啀鏄剧ず"褰撳墠宸查€夋嫨锛氭湇鍔″櫒锛坰cript.xiangtianzhen.store锛?.."鏂囨锛涗粎鍦ㄨВ閿佸悗鏄剧ず褰撳墠鍚庣閫夋嫨鐘舵€併€?
- 鐐瑰嚮缁戝畾浠嶅彧鎸傚湪"鍚庣鎺ュ彛鍦板潃"鏍囬鑺傜偣锛屼笉缁戝畾鏁翠釜鍗＄墖锛涢紶鏍囨牱寮忎繚鎸侀粯璁わ紙闈?pointer锛夈€?
- 椤甸潰鍒锋柊鍚庤В閿佺姸鎬佷笉鎸佷箙鍖栵紝绗﹀悎"姣忔杩涘叆 options 閲嶆柊闅愯棌"鐨勬祴璇曞彛寰勩€?
- 0.3.0 娴嬭瘯鐗?service worker 璺緞淇锛歚extension/background/service-worker.js` 鐨?`importScripts` 鏀逛负 `chrome.runtime.getURL("shared/constants.js")` 涓?`chrome.runtime.getURL("shared/storage.js")`锛岄伩鍏嶈瑙ｆ瀽涓洪敊璇殑 `background/shared/*` 璺緞銆?
- 淇鍚?service worker 灏嗕粠鎵╁睍鏍圭洰褰曞姞杞藉叡浜ā鍧楋紝瑙ｅ喅 `Failed to execute 'importScripts' ... background/shared/constants.js failed to load` 涓庢敞鍐屽け璐?`Status code: 15` 闂銆?
- 0.3.0 娴嬭瘯淇锛氭爣璐濇槗閲囧鍑?CSV 涓庡師濮嬭褰曞垎绂汇€傚墠绔鍑轰笌涓婁紶鐨?`csvText` 涓嶅啀鍖呭惈"鍘熷JSON"鍒楋紱鍘熷璁板綍鏀逛负鑴辨晱 `rawRecords` 鐙珛涓婁紶銆?
- 鏍囪礉鏄撻噰鍚庣瀵煎嚭瀛樺偍鏂板 `latest-raw.json`锛宍latest.csv` 鍙繚瀛?CSV锛宍latest.json` 缁х画淇濆瓨 meta锛涘紑鍚?history 鏃跺悓姝ュ啓鍏?`*.raw.json`銆?
- 鏍囪礉鏄撻噰瀵煎嚭涓婁紶璺敱澧炲己锛氬吋瀹?`rawRecords/rawJson`锛屾柊澧炲師濮嬭褰曞ぇ灏忛檺鍒讹紝health/config 杩斿洖 `latestRawJsonPath`銆?
- 椤圭洰鏁版嵁涓嬭浇 CSV 娓呮礂澧炲己锛歚sanitizeParsedCsv` 寮哄埗鍓旈櫎"鍘熷JSON"鍒楋紝閬垮厤鍘嗗彶 CSV 娉勯湶鍘熷璁板綍銆?
- 椤圭洰鏁版嵁涓嬭浇渚涘簲鍟嗛摼璺寮猴細涓嬭浇 token 璇诲彇澧炲姞灏鹃儴涓枃鏍囩偣瀹归敊锛涗緵搴斿晢閿欒杩斿洖琛ュ厖 dataset/supplier/suppliers锛涗笅杞介摼璺柊澧炲畨鍏ㄨ皟璇曟憳瑕侊紙浠?requestId/jti/dataset/supplier/璁℃暟锛屼笉璁板綍瀹屾暣 token锛夈€?

## 2026-05-11锛堝崗浣滆鍒欐洿鏂帮細浠诲姟鏆楀彿涓庨粯璁ゅ垎鏀瓥鐣ワ級

- `AGENTS.md` 鏂板"浠诲姟鏆楀彿瑙勫垯"绔犺妭锛屾槑纭?`ASC_READONLY`銆乣ASC_NEW_BRANCH`銆乣ASC_CONTINUE_BRANCH`銆乣ASC_MAIN_HOTFIX`銆乣ASC_RELEASE_MERGE`銆乣ASC_ABORT_IF_DIRTY` 鐨勬墽琛岀害鏉熴€?
- 鏄庣‘ Codex 鏃犳硶璇诲彇缃戦〉绔巻鍙插璇濓紝姣忔鎵ц Prompt 蹇呴』鎼哄甫浠诲姟鏆楀彿锛屽苟鎸夋殫鍙锋墽琛?Git 绛栫暐銆?
- 璋冩暣鍗曚汉椤圭洰鍒嗘敮鍙ｅ緞锛氫繚鐣?灏忎慨/褰撳墠鐗堟湰 BUG/鍗曟ā鍧楀彲鐩存帴 main"锛屽悓鏃舵槑纭?鏂板璇濇柊闇€姹傞€氬父璧版柊鍒嗘敮銆佸悓瀵硅瘽杩介棶閫氬父缁х画褰撳墠鍒嗘敮銆佺敤鎴锋槑纭姹傜洿鏀?main 鏃朵粠鐢ㄦ埛鎸囦护"銆?
- 骞惰瑙勫垯琛ュ厖锛氳皝鍏堝畬鎴愬苟閫氳繃楠屾敹锛岃皝鍏堣繘鍏?`ASC_RELEASE_MERGE`锛涘彂甯冨悎骞堕樁娈垫墠鎵ц patch 鎻愬崌銆丆RX 涓変欢濂楃敓鎴愪笌 tag銆?

## 2026-05-11锛堝崗浣滆鍒欎慨姝ｏ細浠诲姟鏆楀彿浼樺厛浜?main 鏃ч粯璁わ級

- 淇 `AGENTS.md` 涓?榛樿鐩存帴鍦?main 鍒嗘敮瀹屾垚鎵ц绫讳换鍔?鐨勬棫鍙ｅ緞锛屾敼涓?鎵ц绫讳换鍔￠粯璁ゆ寜浠诲姟鏆楀彿鍐冲畾 Git 绛栫暐"銆?
- 琛ュ厖鏃犳殫鍙峰厹搴曪細鏂板姛鑳姐€佸苟琛屽姛鑳姐€佽法妯″潡鏀瑰姩榛樿鐙珛鍒嗘敮锛涘皬淇€佸綋鍓嶇増鏈?BUG銆佸崟妯″潡浠诲姟銆佹枃妗ｆ敹灏惧彲鐩存帴 main銆?
- 淇鏃у垎鏀彛寰勶細涓嶅啀瑕佹眰"褰撳墠涓嶅湪 main 灏卞垏鍥?main"锛涙敼涓?鍒嗘敮涓庝换鍔℃殫鍙?鐩爣鍒嗘敮涓嶇鏃跺仠姝㈠苟鎶ュ憡锛屼笉寰楁搮鑷垏鎹?銆?
- 鏄庣‘ `ASC_CONTINUE_BRANCH` 蹇呴』鐣欏湪鐩爣鍔熻兘鍒嗘敮鎵ц锛宍ASC_RELEASE_MERGE` 鎵嶅厑璁稿洖 main 鍋氬彂甯冨悎骞躲€?

## 2026-05-11锛堝崗浣滆鍒欒ˉ鍏呮鍐茬獊娓呯悊锛?

- 娓呯悊 `AGENTS.md` 鍦?2026-05 绋冲畾鍗忎綔瑙勫垯琛ュ厖"涓殑鏃у彛寰勶細涓嶅啀鍐?鎵ц绫讳换鍔￠粯璁ら獙璇侀€氳繃鍚庣洿鎺?push 鍒?main""榛樿涓嶅垱寤哄垎鏀紝涓嶅垱寤?PR"銆?
- 缁熶竴鏀逛负鎸変换鍔℃殫鍙蜂笌鐩爣鍒嗘敮鎵ц commit/push锛氭柊鍔熻兘/鏂伴渶姹?骞惰/璺ㄦā鍧楅粯璁ょ嫭绔嬪垎鏀紝灏忎慨涓庢枃妗ｆ敹灏惧彲鎸?`ASC_MAIN_HOTFIX` 鐩存敼 `main`銆?
- 淇濈暀骞跺己璋冨彧璇诲璁′笉寰楁敼鍔ㄥ拰鎻愪氦銆侀獙璇佸け璐ヤ笉寰?commit/push銆丳R 浠呭湪鐢ㄦ埛鏄庣‘瑕佹眰鏃跺垱寤恒€?

## 2026-05-17锛圓baka AI Task21 蹇嵎閿寮猴細鏆傚瓨涓庨€佸锛?

- Abaka AI Task21 鏂板蹇嵎閿細`6` 鏆傚瓨銆乣7` 閫佸锛涘苟鍚屾鍒伴粯璁よ缃€乻torage 褰掍竴鍖栦笌 options 閰嶇疆椤点€?
- 涓や釜鍔ㄤ綔閮藉彧鐐瑰嚮椤甸潰鐪熷疄鎸夐挳锛坄鏆傚瓨/Save/Stash`銆乣閫佸/Submit/Submit Review`锛夛紝涓嶇洿鎺ヨ皟鐢ㄥ钩鍙?API銆?
- `7` 閫佸蹇嵎閿柊澧炲畨鍏ㄩ檺鍒讹細鐤戜技鏍囨敞鍐呭鐜涓嬮樆姝㈡墽琛岋紱`viewMode=true` 鏌ョ湅椤典笉鎵ц銆?
- `7` 涓嶈嚜鍔ㄧ‘璁や簩娆″脊绐楋紱鑻ュ嚭鐜扮‘璁ゅ脊绐楀繀椤荤敤鎴锋墜鍔ㄧ‘璁ゃ€?
- 淇濇寔鍘熸湁 Task21 same_font 涓庢淳鐢熷瓧娈靛揩鎹烽敭锛?~5锛夐€昏緫涓嶅彉銆?
- 鏈慨鏀瑰悗绔€佹湭鎻愬崌 `manifest` 鐗堟湰銆佹湭鐢熸垚 CRX/ZIP/update.xml/crx-latest.json 绛夊彂甯冧骇鐗┿€?
- 2026-05-20
  - DataBaker 閫氱敤 AI 鑳藉姏寮€濮嬭縼绉诲埌缁熶竴鍚庣鍩哄骇 `platform-resources/backend/ai/`銆?
  - 鏂板缁熶竴鐩綍锛?
    - `platform-resources/backend/ai/config.js`
    - `platform-resources/backend/ai/errors.js`
    - `platform-resources/backend/ai/sanitizer.js`
    - `platform-resources/backend/ai/provider-queue.js`
    - `platform-resources/backend/ai/result-cache.js`
    - `platform-resources/backend/ai/usage.js`
    - `platform-resources/backend/ai/providers/qwen-openai-compatible.js`
    - `platform-resources/backend/ai/providers/funasr-python.js`
    - `platform-resources/backend/ai/python/funasr_client.py`
    - `platform-resources/backend/ai/python/requirements.txt`
  - DataBaker 鐩綍涓殑 `ai-client-qwen.js`銆乣ai-client-funasr.js`銆乣ai-provider-queue.js`銆乣ai-result-cache.js` 鏀逛负 deprecated 钖勫皝瑁咃紝鍙?re-export 缁熶竴鍩哄骇妯″潡銆?
  - 缁熶竴鍚庣鍚姩鍏ュ彛淇濇寔涓嶅彉锛歚node platform-resources/backend/server.js`銆?
  - Python 浠嶄笉浣滀负鐙珛鏈嶅姟鍚姩锛屽彧浣滀负缁熶竴 Node 鍚庣鍐呴儴杈呭姪杩涚▼璋冪敤銆?
  - DataBaker `fun-asr` 绻佷綋瀛楃儹淇細
    - `platform-resources/backend/ai/python/funasr_client.py` 鏂板 OpenCC `t2s` 绻佽浆绠€锛汷penCC 涓嶅彲鐢ㄦ椂閫€鍥炲唴缃槧灏勩€?
    - `platform-resources/backend/ai/python/requirements.txt` 鏂板 `opencc-python-reimplemented`銆?
    - DataBaker `ai-service.js` 寮哄寲鏅€氱箒浣撳埌绠€浣撶殑鐭绾у拰瀛楃绾у厹搴曟槧灏勶紝骞剁户缁繚鎶?`闃?/ 姹?/ 浼?/ 璇禶 绛夐椊鍗楄瘝琛ㄥ缓璁敤瀛椼€?
    - `heardText` 鍦?Python 杩斿洖鍓嶅厛绻佽浆绠€锛孨ode 渚у湪 compare 鍓嶅拰鏈€缁堝搷搴旂粍瑁呮椂鍐嶅仛涓€娆¤瘝琛ㄤ繚鎶ゅ厹搴曘€?
    - `recommendedText` 涓?`omni_single` 杈撳嚭閮界粺涓€鍋氱畝浣撴敹鍙ｃ€?
    - `RULE_VERSION` 鍗囩骇涓?`data-baker-round-one-quality-ai-v7-simplified-funasr`锛岄儴缃插悗闇€瑕侀噸鍚粺涓€ Node 鍚庣锛岄伩鍏嶆棫鍐呭瓨缂撳瓨缁х画鍛戒腑绻佷綋缁撴灉銆?
  - DataBaker "AI杩炵画濉叆鍚堟牸椤瑰苟鍙戞暟閲?鐑慨锛?
    - 鍓嶇榛樿鍊兼敼涓?`20`銆?
    - 鍓嶇璁剧疆鑼冨洿鏀逛负 `1~50`銆?
    - 闈炴硶鍊兼垨绌哄€煎洖钀?`20`锛屽皬浜?`1` 褰掍竴鍒?`1`锛屽ぇ浜?`50` 褰掍竴鍒?`50`銆?
    - 杩愯鏃?`maxConcurrency` 涓婇檺鍚屾鏀惧鍒?`50`锛屼絾濉叆闃舵浠嶄繚鎸侀『搴忔秷璐广€?
    - 鍚庣 provider queue 涓?RPM 闄愭祦淇濇寔涓嶅彉锛屽墠绔苟鍙戞彁楂樺彧浼氳鏇村璇锋眰杩涘叆缁熶竴鍚庣鎺掗槦銆?
## 2026-05-21 LabelX 缁熻涓婁紶 force replace

- 瑕嗙洊鑼冨洿锛欰libaba LabelX ASR 蹇垽缁熻涓婁紶銆丄libaba LabelX ASR 杞啓缁熻涓婁紶銆?
- 淇濈暀鍘熸湁閫昏緫锛氭墜鍔ㄤ笂浼犻粯璁ゅ厛鏌?existing锛宍complete=true` 鐨勫畬鏁村垎鍖呴粯璁よ烦杩囥€?
- 鏂板棣栭〉鎵嬪姩琛ュ厖妯″紡锛氳嫢鏈疆 `skippedCompleteCount > 0`锛屽墠绔樉绀?鍙栨秷璺宠繃涓婁紶鏁版嵁"鎸夐挳锛?0 绉掑唴鍙偣鍑汇€?
- 鎸夐挳瑙﹀彂鍚庝娇鐢?`home-manual-force-replace`锛岄噸鏂版媺鍙栨湰杞寖鍥村唴鍏ㄩ儴璇︽儏锛屼笉鍐嶈烦杩囧畬鏁存暟鎹€?
- 鍚庣鎸?`replaceBatchIds` 鍒犻櫎鏃?CSV 琛岋紝鍐嶅啓鍏ユ湰娆?payloads锛涙櫘閫氫笂浼犱笌瀹氭椂涓婁紶涓嶅彈褰卞搷銆?
- 璇︽儏椤电涓€鐗堜笉榛樿鏀寔 force replace锛岄伩鍏嶅彧鎷垮埌鍗曡鑹叉椂璇垹鏁磋鍙︿竴瑙掕壊瀛楁銆?
- 杩愯鏁版嵁鐩綍 `statistics-data/`銆乣export-data/`銆乣audit-data/` 浠嶄笉鎻愪氦 Git銆?

## 2026-05-21 CSV 瀛楁鍛藉悕鍙ｅ緞鐑慨

- 淇 LabelX 蹇垽瀵煎嚭瀛楁锛歚鏈夋晥鏃堕暱(绉?_S`銆乣鏍囨敞鍛?_P`銆乣鏍囨敞鍛?_P`銆乣鏍囨敞鍛?_P`銆乣瀹℃牳鍛榑P`銆?
- 淇 LabelX 杞啓瀵煎嚭瀛楁锛歚鏈夋晥鏃堕暱(绉?_S`銆乣鏍囨敞鍛榑P`銆乣瀹℃牳鍛榑P`銆?
- 淇 DataBaker 瀵煎嚭瀛楁锛歚璐ㄦ浜篲P`銆乣鏈夋晥鍚堟牸鏃堕暱_S`銆?
- 鏃у瓧娈靛吋瀹硅縼绉伙細`鏈夋晥鏃堕暱` / `鏈夋晥鏃堕暱(绉?` / `鏈夋晥鍚堟牸鏃堕暱` 涓庢棫浜哄憳鍒楀湪涓嬩竴娆″悎骞跺啓鍑?CSV 鏃惰縼绉诲埌鏂板瓧娈碉紝涓嶈緭鍑洪噸澶嶅垪銆?

## 2026-05-21锛堟爣璐濇槗閲囦竴妫€璐ㄦ鐑慨锛氫慨澶嶆壒閲?tasks 浣滅敤鍩熼敊璇級

- 淇 DataBaker `AI骞跺彂鍒嗘瀽骞惰繛缁～鍏ュ悎鏍奸」` 鐐瑰嚮鍚庡嚭鐜?`tasks is not defined` 鐨勫墠绔繍琛屾椂閿欒銆?
- 鏍瑰洜鏄?`content.js` 鐨勬壒閲忔偓娴獥鎽樿鍑芥暟鍦?`tasks` 鍧楃骇浣滅敤鍩熷鐩存帴璇诲彇 `tasks.length`銆?
- 鐜板凡鏀逛负鍩轰簬 `plannedSendCount / totalCount` 鏋勫缓鎽樿锛屼笉鍐嶈法浣滅敤鍩熷紩鐢?`tasks`銆?
- 棰濆琛ュ厖锛歚createItemsFromQualifiedRecords(...)` 鐢熸垚绌轰换鍔℃椂浼氱粰鍑烘槑纭彁绀猴紝涓嶅啀缁х画杩涘叆绌烘壒閲忔祦绋嬨€?
- 鎵╁睍閲嶈浇鍚庨渶鍒锋柊 DataBaker 椤甸潰锛屽惁鍒欐棫 content script 浠嶅彲鑳戒繚鐣欍€?

## 2026-05-21 - fix(data-baker): add batch request dedupe tracing

- 淇 DataBaker 鎵归噺杩炵画濉叆缂哄皯鎵规杩借釜鐨勯棶棰橈細姣忔鎵归噺杩愯鐢熸垚 `batchRunId`锛屾瘡鏉¤姹傞檮甯?`batchItemIndex`銆乣batchProcessKey`銆乣clientRequestId`銆?
- 鍓嶇鍚屾壒娆″厛鎸?`processKey` 鍘婚噸锛岄噸澶嶄换鍔′笉鍐嶅彂閫侊紱鎮诞绐楀鍔犲敮涓€浠诲姟鏁般€侀噸澶嶈烦杩囨暟銆佹壒娆D銆佸凡鍙戣捣璇锋眰鍜屾椿璺冭姹傜粺璁°€?
- 椤甸潰绾у叏灞€閿侀槻姝㈡棫 content script銆佸 runtime 鎴栧弻鍑绘寜閽噸澶嶅惎鍔ㄧ浜屾壒銆?
- 鍚庣鏂板鍐呭瓨绾?in-flight dedupe锛氬悓涓€ `batchRunId + batchProcessKey` 鐨勮姹備細 join 鍚屼竴 promise锛岄伩鍏嶉噸澶嶆墦涓婃父妯″瀷銆?

## 2026-05-21锛圱ask21 鍔╂墜锛氭仮澶嶅垪琛ㄩ〉缁熻/瀵煎嚭鎸夐挳鍏ュ彛锛?

- 淇 Abaka AI Task21 `/task-v2/data-item` 鍒楄〃椤甸《閮ㄥ彸渚х粺璁″叆鍙ｄ笉鍙闂銆?
- `content.js` 鏂板 `isTask21DataItemListPage()`锛岃瘑鍒?`abao.fortidyndns.com` 涓嬪甫 `taskId` 涓?`vm=all/batch` 鐨?`/task-v2/data-item` 椤甸潰銆?
- 鏂板椤堕儴鍙充晶鎸夐挳鎸傝浇閫昏緫锛屼紭鍏堟彃鍏ワ細
  - `.app-content-header-right .action-buttons.is-global`
  - `.app-content-header-right .search-actions.is-global`
  - `.app-content-header-right`
  - 椤堕儴瀹瑰櫒缂哄け鏃?fallback 涓洪〉闈㈠彸涓婅娴姩鍏ュ彛
- 鎸夐挳浣跨敤鍥哄畾灞炴€?`data-asc-task21-statistics-toolbar="true"` 鍘婚噸锛屾敮鎸?Vue/SPA 閲嶆覆鏌撳悗鑷姩閲嶆寕杞斤紝绂诲紑鍒楄〃椤靛悗鑷姩绉婚櫎銆?
- 褰撳墠浠撳簱鏈寘鍚?Task21 缁熻鍚庣涓庣嫭绔嬪墠绔粺璁?runtime锛屽洜姝わ細
  - `缁熻褰撳墠鍒楄〃` 褰撳墠浼氱粰鍑?Task21缁熻妯″潡鏈氨缁紝璇峰厛瀹屾垚缁熻閲囬泦妯″潡銆?
  - `涓嬭浇缁熻CSV` 榛樿绂佺敤锛屼笉浼€犱笅杞藉湴鍧€
- `/items` 璇︽儏椤靛瓧娈垫梺 `AI鍒嗘瀽 / 鏁翠綋鍒嗘瀽` 鍏ュ彛淇濇寔涓嶅彉銆?
- 鎵╁睍閲嶈浇鍚庨渶鍒锋柊 Abaka Task21 椤甸潰鍐嶉獙璇侊紝閬垮厤鏃?content script 缁х画椹荤暀銆?

## 2026-05-26锛圡agic Data 璇嗗埆绛栫暐淇濆瓨鍥炴粴鐑慨锛?
- 淇 `Magic Data` 鍙屽姪鎵嬪湪 options 涓皢璇嗗埆绛栫暐鍒囧洖 `direct_dialect` 鍚庤 legacy `recognition_convert` 鍥炴粴鐨勯棶棰樸€?- 淇鐐癸細
  - `extension/options/options.js` 鏂板鏄惧紡绛栫暐瑙ｆ瀽浼樺厛绾э細`aiReviewRecognitionStrategy > recognitionStrategy > fallback > legacy recognitionMode`銆?
  - 淇濆瓨鏃跺悓姝ヨ鐩?`aiReviewRecognitionMode/recognitionMode/pipelineMode`锛岄伩鍏嶆繁鍚堝苟淇濈暀鏃?`recognition_convert`銆?
  - `extension/shared/storage.js` 鐨勬樉寮忕瓥鐣ユ娴嬭ˉ鍏?`recognitionStrategy` 鍏煎瀛楁锛岄伩鍏?normalize 闃舵璇洖鍐欍€?
  - `platforms.magicData.scripts.*` 涓?`scriptCenter.projects.*` 鍙岃矾寰勫悓姝ュ悓涓€绛栫暐鍜?legacy 娲剧敓瀛楁锛岄伩鍏嶅洖鏄惧啿绐併€?- 褰撳墠鐗堟湰鍙ｅ緞淇濇寔 `0.3.6`锛屾湭鎻愬崌鐗堟湰銆佹湭鐢熸垚 CRX銆佹湭鎵?tag銆?
## 2026-05-28锛圓ishell Tech defaults 涓庨潰鏉挎寕杞界儹淇級

- 淇 `Aishell Tech` options 椤垫ā鍨嬮€夋嫨涓虹┖銆丳rompt 榛樿鍊肩己澶辩殑闂锛?  - `extension/options/options.js` 鏂板 DataBaker 椋庢牸鐨勬ā鍨嬩笅鎷夋瀯寤哄嚱鏁帮紝渚?Aishell 澶嶇敤銆?  - Aishell defaults 璇诲彇椤哄簭璋冩暣涓猴細Aishell 鐙珛 defaults -> DataBaker defaults -> 鏈湴 DataBaker Prompt/妯″瀷榛樿鍊笺€?  - Aishell 鏈湴鍥為€€ Prompt 鐜颁笌 `platform-resources/data-baker/round-one-quality` 淇濇寔涓€鑷淬€?- 淇 `Aishell Tech` 鏍囨敞椤甸潰鏉垮垵娆℃寕鍒颁笉鍙鍖哄煙鍚庝笉浼氳嚜鍔ㄥ洖鍒拌〃鍗曞尯鐨勯棶棰橈細
  - `extension/sites/aishell-tech/minnan-helper/ui-panel.js` 鏀逛负浼樺厛鎸傚埌 `.mark-area` 鍐呫€佽〃鍗曡妭鐐逛箣鍓嶃€?  - 褰?`.mark-area` 鍚庡姞杞藉嚭鏉ユ椂锛岀幇浼氳嚜鍔ㄦ妸宸插瓨鍦ㄧ殑闈㈡澘閲嶆柊鎼洖鍙琛ㄥ崟鍖恒€?- 淇 `Aishell Tech` 椤甸潰鍦ㄧ湡瀹?Edge 涓暣缁?content scripts 鏈惤鍒伴〉闈㈢殑闂锛?  - 澶嶆祴纭 `detail -> 鏌ョ湅 -> mark` 閾捐矾鍙ǔ瀹氭墦寮€锛屼絾 `window.__ASREdgeAishellTechMarkObserverInstalled` 涓庨潰鏉胯妭鐐归兘涓嶅瓨鍦ㄣ€?  - `Secure Preferences` 鏄剧ず鎵╁睍 host 鏉冮檺宸叉巿浜堛€乣withholding_permissions=false`锛屾帓闄ょ珯鐐规潈闄愭湭鏀惧紑銆?  - `chrome.storage.local` 鍙 `aishellTech.enabled=true`銆乣minnanHelper.aiRecommendEnabled=true`锛屾帓闄よ剼鏈缃鍏抽棴銆?  - 鐜版柊澧?`background/service-worker.js` 瀵?Aishell 鐨?`registerContentScripts` 鍏滃簳娉ㄥ唽锛屽苟缁?`data-api / ai-recommendation / ui-panel / shortcuts / content` 澧炲姞瀹夎瀹堝崼锛岄伩鍏嶄笌 `manifest content_scripts` 鍙屾敞鍏ユ椂閲嶅鎵ц銆?- 鏂板 Aishell 娴嬭瘯鎸夐挳妯″紡锛?  - 鍗曟潯 `璇嗗埆` 鎸夐挳鎸傚埌椤甸潰搴曢儴 `淇濆瓨` 鎸夐挳鏃併€?  - `鎵归噺璇嗗埆 / 鍋滄` 鎸夐挳鎸傚埌鏂囦欢鍚嶈鏃併€?  - 鍗曟潯涓庢壒閲忛兘鍏堝彧鍋氳瘑鍒笌鎮诞灞曠ず锛屼笉鑷姩濉叆锛屼笉鑷姩淇濆瓨锛涗究浜庡厛楠岃瘉娉ㄥ叆銆佽姹傚拰 Prompt 杈撳嚭銆?- 淇 Aishell `detail -> mark` 鍦烘櫙鐨勮矾鐢卞垏鎹㈡紡娉ㄥ叆锛?  - 鐢ㄦ埛澶嶇幇锛氫粠 `https://mark.aishelltech.com/mytask/detail/:taskId` 鐐瑰嚮鈥滄煡鐪嬧€濊繘鍏?`mark?...` 鍚庯紝鎸夐挳涓嶅嚭鐜帮紱鎵嬪姩鍒锋柊鍚庝細鍑虹幇锛屼絾骞冲彴浼氬崱浣忋€?  - 澶勭悊鏂瑰紡锛歚manifest.json` 鏂板 `webNavigation` 鏉冮檺锛宍background/service-worker.js` 鏂板 `onHistoryStateUpdated / onCompleted / tabs.onUpdated` 涓夊眰鍏滃簳锛屽湪杩涘叆 Aishell `detail / mark / index` 璺敱鏃朵富鍔ㄦ墽琛岃剼鏈敞鍏ャ€?  - Aishell 鍚勫墠绔ā鍧楀凡甯﹀畨瑁呭畧鍗紝鍥犳琛ユ敞鍏ヤ笉浼氬鑷撮噸澶嶇粦瀹氥€?- 琛ュ厖鍓嶇璺敱妫€娴嬪厹搴曪細
  - 鏍规嵁鐢ㄦ埛澶嶇幇锛屽钩鍙颁粠 `detail` 杩涘叆 `mark` 鏃跺彲鑳芥湭璧版爣鍑?`history` 璺敱浜嬩欢銆?  - `extension/sites/aishell-tech/minnan-helper/content.js` 鏂板 `250ms` URL 杞锛涘彧瑕佸悓椤?URL 鍙樺寲锛屽氨浼氶噸鏂版墽琛岃繍琛屾椂璇勪及銆?  - `page-world/network-observer.js` 涓?`content.js` 棰濆鍐欏叆 `data-asc-aishell-main-world / data-asc-aishell-isolated` 璋冭瘯鏍囪锛屼究浜庣‘璁ゅ埌搴曟槸涓讳笘鐣屻€侀殧绂讳笘鐣岃繕鏄寜閽寕杞藉眰澶辨晥銆?- 鏂板骞冲彴瀹炴祴鍙ｅ緞锛?  - 瀹炴祴搴斾紭鍏堜粠 `/mytask/detail/:taskId` 杩涘叆锛屽啀鐐瑰嚮鍒嗗寘鈥滄煡鐪嬧€濊繘鍏?`/mytask/mark`銆?  - 鐩存帴鎵嬭緭 `/mytask/mark?...` 鏃讹紝骞冲彴鑷韩鍙兘鍑虹幇鍗′綇锛涜繖涓嶄綔涓哄姪鎵嬮潰鏉挎晠闅滃垽瀹氫緷鎹€?
## 2026-05-28锛圓ishell Tech 鎮诞绐楁寜閽帴鍏ュ疄闄呭姛鑳斤級

- 鍦ㄦ渶灏忔偓娴獥鐗堝熀纭€涓婅ˉ榻愬崟鏉″疄鐢ㄥ姩浣滐細
  - `璇嗗埆` 浠嶈蛋鐙珛 Aishell recommend 鎺ュ彛銆?  - 缁撴灉鍖烘柊澧?`澶嶅埗鍚煶鏂囨湰`銆乣澶嶅埗鎺ㄨ崘鏂囨湰`銆乣濉叆褰撳墠鏉銆乣蹇界暐`銆?  - `濉叆褰撳墠鏉 鍙啓鍏ラ〉闈㈢湡瀹炴枃鏈锛屽苟娲惧彂 `input/change` 浜嬩欢锛涗粛涓嶈嚜鍔ㄤ繚瀛樸€?- 鎵归噺璇嗗埆琛ラ綈杩愯鎺у埗锛?  - `鎵归噺璇嗗埆` 缁х画鍙鐞嗗綋鍓嶅垎鍖呫€佷粠褰撳墠閫変腑鏉″紑濮嬨€佽烦杩囧凡瀹屾垚鏉＄洰銆?  - 鏂板 `鍋滄鎵归噺`锛屽彧鍦ㄥ綋鍓嶆潯缁撴潫鍚庡仠涓嬶紝涓嶅己鏉€褰撳墠杩涜涓殑 AI 璇锋眰銆?  - 鎵归噺鍖烘柊澧炲け璐ヨ鏁颁笌澶辫触娓呭崟锛屼究浜庝汉宸ュ洖鐪嬪け璐ユ潯鐩€?- `extension/sites/aishell-tech/minnan-helper/data-api.js` 鏂板 Aishell 鏂囨湰妗嗗畾浣嶄笌濉叆鑳藉姏锛屽苟琛ュ厖涓枃鍙ユ湯鏍囩偣涓庣┖鐧芥竻娲楄緟鍔╁嚱鏁般€?
## 2026-05-28锛圓ishell Tech 鐢ㄦ埛瑙﹀彂鍚庣湡瀹炰繚瀛橈級

- 鏍规嵁浜哄伐瀹炴祴鍙嶉锛屽皢鍗曟潯鍔ㄤ綔浠庘€滀粎濉叆鈥濇敼涓衡€滃～鍏ュ苟鐐瑰嚮椤甸潰鐪熷疄淇濆瓨鈥濓細
  - `濉叆褰撳墠鏉 鐜版敼涓?`濉叆骞朵繚瀛樺綋鍓嶆潯`銆?  - 浠嶅厛鍐欏叆椤甸潰鐪熷疄杈撳叆妗嗭紝鍐嶇偣鍑?`.mark-area` 閲岀殑鐪熷疄 `淇濆瓨` 鎸夐挳銆?  - 淇濆瓨鍚庤疆璇㈢瓑寰呭乏渚у垪琛ㄦ潯鐩彉涓哄畬鎴愭垨鑷姩鍒囧埌涓嬩竴鏉★紝瓒呮椂鎵嶆姤閿欍€?- 鎵归噺鍔ㄤ綔涔熸敼涓虹敤鎴疯Е鍙戝悗鐨勯『搴忕湡瀹炰繚瀛橈細
  - `鎵归噺璇嗗埆` 鐜板湪浼氬厛鍒囧埌鐩爣鏉＄洰銆佽姹?AI銆佹垚鍔熷悗绔嬪嵆濉叆骞剁偣鍑荤湡瀹?`淇濆瓨`銆?  - 姣忔潯閮界瓑寰呴〉闈㈠垏鏉℃垚鍔熷悗鍐嶇户缁笅涓€鏉°€?  - 澶辫触鏉＄户缁繘鍏ュけ璐ユ竻鍗曪紝涓嶉樆濉炲悗缁潯鐩€?
## 2026-05-28锛堢櫨鐐兼ā鍨嬬粺涓€娉ㄥ唽涓庡弻閫氶亾璋冪敤锛?
- `platform-resources/backend/ai/` 鏂板缁熶竴妯″瀷娉ㄥ唽涓庢淳鍙戝眰锛?  - `model-catalog.js` 浣滀负鐧剧偧鏍稿績妯″瀷鍞竴浜嬪疄婧愶紝缁熶竴鐧昏 `qwen3.6-plus`銆乣qwen3.5-plus`銆乣qwen3.6-flash`銆乣qwen3.5-flash`銆乣qwen3.5-omni-plus`銆乣qwen3.5-omni-flash`銆乣fun-asr` 鐨勬枃妗ｅ湴鍧€銆佽垂鐢ㄦ枃妗ｃ€乫amily銆乼ier銆乼hinking 榛樿绛栫暐涓庤繍琛屾椂椤哄簭銆?  - `model-dispatcher.js` 缁熶竴鎻愪緵 `getModelMeta / listModelsByFamily / invokeModel / getModelDocs`锛岄粯璁?`JS 浼樺厛锛孭ython 澶囩敤`銆?- 閫氱敤 Qwen Python 澶囩敤閾捐矾宸茶ˉ榻愶細
  - 鏂板 `platform-resources/backend/ai/python/qwen_openai_client.py`銆?  - 鏂板 `platform-resources/backend/ai/providers/qwen-python.js`銆?  - 鏂囨湰姣旇緝涓?Omni `input_audio` 鐜板湪閮藉叿澶?JS/Python 鍙岄€氶亾璋冪敤鑳藉姏锛汧un-ASR 缁х画淇濈暀 REST + Python SDK 鍙岄€氶亾銆?- `config.js`銆丄ishell/DataBaker health/defaults 鍜屽墠绔叡浜厹搴曞父閲忓凡寮€濮嬫敼涓轰粠缁熶竴妯″瀷鐩綍琛嶇敓锛岄伩鍏嶆ā鍨嬪悕鍗曠户缁暎钀界‖缂栫爜銆?- `docs/external-docs-aliyun-bailian.md` 宸叉柊澧炩€滄ā鍨嬬洰褰曗€濇锛岀粺涓€璁板綍 7 涓牳蹇冩ā鍨嬬殑瀹樻柟鏂囨。銆丄PI 鏂囨。銆佽垂鐢ㄦ枃妗ｄ笌榛樿 thinking 绛栫暐銆?
## 2026-05-28锛圓ishell Tech 骞跺彂璇嗗埆涓庡弻绛栫暐妯″紡锛?
- 鎵归噺璇嗗埆浠庘€滃厛鍒囨潯鍐嶈瘑鍒€濇敼涓衡€滅洿鎺ヨ鍙?`packageItemList` 鍚庡苟鍙戝彂璧?AI 璇锋眰鈥濓細
  - 涓嶅啀绛夊緟椤甸潰褰撳墠閫変腑鏉″垏鎹㈠畬鎴愬悗鎵嶈姹?AI銆?  - 鍓嶇鎸夐厤缃苟鍙戞暟鍙戣捣璇锋眰锛屼絾鍥哄畾姣?`50ms` 鎵嶅厑璁稿彂鍑轰笅涓€鏉★紝鏁翠綋璇锋眰閫熺巼涓嶈秴杩?`20 req/s`銆?  - 鍝潯缁撴灉鍏堣繑鍥烇紝灏卞厛鍒囧埌鍝潯骞舵墽琛屸€滃～鍏ュ苟淇濆瓨褰撳墠鏉♀€濄€?- Aishell 鐙珛琛ラ綈涓ょ闂藉崡璇瘑鍒瓥鐣ワ紝骞跺榻?options/defaults/backend锛?  - 榛樿绛栫暐鏀逛负 `mandarin_to_dialect`锛堟櫘閫氳瘽瀵圭収榛樿锛夛細鍚煶妯″瀷鍏堣緭鍑烘櫘閫氳瘽锛屽啀缁撳悎椤甸潰棰勬祴闂藉崡璇枃鏈拰瀛楄瘝琛ㄧ敓鎴愭渶缁堥椊鍗楄銆?  - 淇濈暀 `direct_dialect`锛堢洿鎺ュ惉鍐欓椊鍗楄锛夋祴璇曟ā寮忋€?  - `defaults/health` 鏂板 `modelModeOptions`銆乣recognitionStrategyOptions`銆乣promptProfiles`锛孉ishell options 闈㈡澘鏀逛负鐪熸淇濆瓨 `妯″瀷鏂规 + 璇嗗埆绛栫暐`銆?
## 2026-05-28锛圓ishell Tech 涔卞簭鎵归噺淇濆瓨鍒ゅ畾鐑慨锛?
- 淇鎵归噺璇嗗埆涓€滅涓€鏉℃垚鍔熴€佸悗缁ぇ閲忔彁绀轰繚瀛樿秴鏃垛€濈殑闂锛?  - 鏃ч€昏緫鍙寜 DOM 鏄惁鑷姩鍒囨潯 / 鏉＄洰鏄惁鍑虹幇 `list-item-finshed` 鏉ュ垽鏂繚瀛樻垚鍔熴€?  - 鍦ㄤ贡搴忎繚瀛樺満鏅笅锛屽钩鍙颁笉涓€瀹氳嚜鍔ㄥ垏鍒颁笅涓€鏉★紝瀵艰嚧淇濆瓨宸叉垚鍔熶篃浼氳璇垽鎴愬け璐ャ€?- `extension/sites/aishell-tech/minnan-helper/data-api.js` 宸茶ˉ涓ゅ眰纭锛?  - 鍒囨潯鍚庡厛绛夊緟鍙充晶琛ㄥ崟鐪熸鍒囧埌鐩爣鏂囦欢锛屽啀鎵ц濉叆涓庝繚瀛樸€?  - 鐐瑰嚮淇濆瓨鍚庯紝闄ょ户缁瀵?DOM 澶栵紝杩樹細杞 `getShortMark` 涓?`packageItemList` 纭骞冲彴鐘舵€佸凡鏇存柊銆?
## 2026-05-28锛圓ishell Tech 鎵归噺淇濆瓨鑺傚鏀炬參鐑慨锛?
- 鏍规嵁浜哄伐澶嶆祴鍙嶉锛屽綋鍓嶄富瑕佸け璐ョ偣浠庘€滀繚瀛樿鍒も€濇敹鏁涘埌鈥滃垏鏉″悗鍙充晶琛ㄥ崟浠嶆湭瀹屽叏绋冲畾灏辩户缁繚瀛樷€濄€?- 鏈疆娌℃湁鏀?AI 骞跺彂璇锋眰绛栫暐锛屽彧鏀炬參鐪熷疄椤甸潰鎿嶄綔鑺傚锛?  - `content.js` 璋冮珮鎵归噺鍒囨潯瓒呮椂锛屽苟鍦ㄥ垏鏉℃垚鍔熷悗澧炲姞棰濆绋冲畾绛夊緟銆?  - `fillAndSaveCurrent` 鐜板湪鏀寔 `postSaveSettleMs`锛屼繚瀛樻垚鍔熷悗浼氶澶栫瓑寰呬竴娈垫椂闂达紝鍐嶅鐞嗕笅涓€鏉°€?  - 鎵归噺寰幆姣忔潯缁撴潫鍚庨兘浼氬啀绛変竴涓煭闂撮殧锛岄檷浣庤繛缁垏鏉?杩炵画淇濆瓨鎶?Aishell 椤甸潰鎵撲贡鐨勬鐜囥€?
## 2026-05-28锛圓ishell Tech 鎵归噺淇濆瓨鍒囧洖鍘熺敓 SaveShortMark锛?
- 鏍规嵁澶嶆祴鍙嶉锛孉ishell 鎵归噺鐨勬牳蹇冮棶棰樹笉鏄?AI 骞跺彂鏈韩锛岃€屾槸鈥滃垏鏉″悗渚濊禆椤甸潰鐪熷疄淇濆瓨鎸夐挳鈥濊繖涓€姝ュ鏄撳彈椤甸潰鍒囨崲鐘舵€佸共鎵般€?- 鏈疆鏀跺彛涓烘洿鎺ヨ繎 DataBaker 鐨勬ā寮忥細
  - 缁х画浣跨敤鍓嶇骞跺彂绐楀彛鍜屸€滃摢鏉″厛杩斿洖灏卞厛杩涗繚瀛橀槦鍒椻€濈殑娑堣垂鏂瑰紡銆?  - 鍥炲～鏃跺厛鍒囧埌鐩爣鏉″苟濉叆椤甸潰鏂囨湰妗嗭紝鍐嶇洿鎺ヨ皟鐢ㄥ钩鍙板師鐢?`POST /api/mark/SaveShortMark`锛屼笉鍐嶄緷璧栭〉闈㈡寜閽€?  - 淇濆瓨鎴愬姛鍒ゅ畾缁熶竴鏀逛负杞 `getShortMark` 涓?`packageItemList`锛岀‘璁ゅ钩鍙版枃鏈拰 `dataStatus` 宸叉洿鏂板悗鍐嶇户缁笅涓€鏉°€?
## 2026-05-28锛堢粺涓€ AI jobs 涓庢寜妯″瀷鍏ㄥ眬闃熷垪锛?
- 缁熶竴鍚庣 AI framework 鏂板鍏叡 `ai-job-store` 涓庨€氱敤 jobs 璺敱杈呭姪锛?  - `platform-resources/backend/ai-framework/runtime/ai-job-store.js`
  - `platform-resources/backend/ai-framework/core/create-ai-job-routes.js`
- 缁熶竴 provider queue 鏀寔鎸夆€滃叿浣撴ā鍨嬪悕鈥濆缓鍏变韩姹狅細
  - 鏂板 `buildModelQueueKey(modelName)`銆?  - 榛樿妯″瀷姹犻€熺巼璋冩暣涓?`20 req/s`锛屽嵆 `50ms` 涓€涓彂鍑烘満浼氾紱榛樿骞跺彂涓婇檺 `15`銆?  - 鍚屼竴妯″瀷璺ㄥ钩鍙般€佽法鑴氭湰鍏变韩姹狅紝涓嶅啀鎸夎剼鏈垎缁勫悇鑷帓闃熴€?- 宸叉帴鍏?jobs 榛樿閾捐矾鐨勫钩鍙帮細
  - Aishell Minnan `recommend`
  - DataBaker round-one-quality `recommend`
  - Magic Data hakka/minnan `review-current`
  - LabelX asr-judgement `suggest`
  - LabelX asr-transcription `suggest-current`
  - Abaka Task21 `analyze`
- 鍓嶇鏂板鍏变韩 `extension/shared/ai-job-client.js`锛?  - 缁熶竴璐熻矗 `POST /jobs`銆佽疆璇?`GET /jobs/:jobId`銆佽鍙?`GET /jobs/:jobId/debug`銆?  - DataBaker銆丄ishell銆丮agic Data銆丩abelX銆丄baka 鐨勯粯璁?AI 瀹㈡埛绔潎宸插垏鍒?jobs 閾捐矾銆?- Aishell 杩欒疆閲嶇偣淇鐨勬槸鈥滈珮骞跺彂涓嬪悓姝?recommend 闀胯繛鎺ヨ娴忚鍣?/ Nginx / 浠ｇ悊灞備腑鏂€濈殑鏍瑰洜锛?  - 鍓嶇鎵归噺閫昏緫淇濈暀鍘熸湁缁撴灉娑堣垂椤哄簭鎺у埗銆?  - 搴曞眰 AI 璇锋眰鏀逛负鐭姹傚缓浠诲姟 + 杞锛岄伩鍏嶅崟涓悓姝?`POST` 闀挎椂闂存寕璧枫€?## 2026-06-09锛圡agic Data 瀹㈠璇濆姪鎵嬶細鍏ㄨ嚜鍔ㄩ摼璺笌 hover 闂儊淇锛?
- 淇 `濉叆鏈` hover 闂儊锛?  - `extension/sites/magic-data/hakka-helper/assistant-panel.js` 鎶婅鍐呭缓璁笌璇磋瘽浜哄缓璁敼鎴愬箓绛夋洿鏂帮紝澶嶇敤鏃㈡湁鏂囨湰/鎸夐挳鑺傜偣锛屼笉鍐嶅湪 hover 鎴栭〉闈㈣交寰噸缁樻椂鍙嶅 `remove + recreate`銆?- 鏂板瀹㈠璇濆姪鎵?`#/asrmark` 褰撳墠椤典复鏃垛€滃叏鑷姩鈥濆紑鍏筹細
  - `extension/sites/magic-data/hakka-helper/content.js` 鏂板椤靛唴鍙腑鏂姸鎬佹満锛屽浐瀹氭墽琛?`绛夊緟鍔犺浇 -> AI璇嗗埆 -> 濉叆 -> 鎻愪氦 -> 绛夊緟涓嬩竴鏉銆?  - 浠呭湪 `#/asrmark` 鏄剧ず锛涢粯璁ゅ叧闂紱鍒锋柊鍚庝笉淇濈暀锛涗换涓€姝ュけ璐ョ珛鍗冲仠鏈猴紱鎵嬪姩鍏抽棴鏃朵細绔嬪埢涓柇鏈畬鎴愭楠ゃ€?  - 鑷姩鎻愪氦浠嶅彧鐐瑰嚮椤甸潰鐪熷疄 `鎻愪氦` 鎸夐挳锛屼笉鐩磋皟骞冲彴鎻愪氦 API銆?- 琛ュ厖椤甸潰 ready 鍒ゅ畾涓?header 瑙傛祴锛?  - `extension/sites/magic-data/shared/page-world/network-observer.js` 鏂板 `annotateHeaderInfo/{taskItemId}` 鍙鐩戝惉涓?header cache 妗ユ帴銆?  - `extension/sites/magic-data/shared/data-collector.js` 鏂板 header cache銆乣refreshAnnotateHeader()`銆乣waitForAsrmarkReady()`銆佹彁浜ゆ寜閽彲鐐瑰嚮鍒ゆ柇銆?- 琛ラ綈鍙腑鏂帴鍙ｏ細
  - `extension/shared/ai-job-client.js` 鏂板澶栭儴 `signal` 鏀寔锛宑reate/poll/delay 鍧囧彲鍝嶅簲鐢ㄦ埛鍋滄銆?  - `extension/sites/magic-data/shared/ai-review-client.js` 鏂板 `options.signal` 閫忎紶锛屽苟鎶婃墜鍔ㄥ仠姝㈢粺涓€褰掍竴鎴?`user-aborted`銆?- 2026-06-09 琛ュ厖鐑慨锛堝瀹惰瘽鍔╂墜鍏ㄨ嚜鍔?no-op 濉叆涓庡揩鎹烽敭鎺у埗锛夛細
  - 淇 `AI 鍥涢」閮芥纭甡 鏃跺叏鑷姩璇垽涓衡€滃け璐ュ仠鏈衡€濈殑闂锛歚assistant-panel.js` 褰撳墠鎶娾€滄棤闇€濉叆鈥濆綊涓€涓烘垚鍔熸€侊紝鑷姩閾捐矾浼氱户缁洿鎺ョ偣鍑荤湡瀹?`鎻愪氦` 鎸夐挳銆?  - 瀹㈠璇濆姪鎵嬪叏鑷姩鍏ュ彛鏀逛负鍙綍鍒跺揩鎹烽敭 `寮€鍚?鍏抽棴鍏ㄨ嚜鍔╜锛屼笉鍐嶅湪鍙充晶闈㈡澘娓叉煋鍗曠嫭鎸夐挳銆?  - `extension/options/options.js` 涓?`extension/sites/magic-data/hakka-helper/shortcuts-runtime.js` 宸插悓姝ヨˉ榻愯蹇嵎閿姩浣滃畾涔夈€?- 鏂板娴嬭瘯锛?  - `extension/shared/ai-job-client.test.js`
  - `extension/sites/magic-data/shared/ai-review-client.test.js` 杩藉姞 job/fetch 涓ゆ潯鍙栨秷鐢ㄤ緥銆?
## 2026-06-10锛堥椊鍗楄涓昏瘝琛ㄥ悓姝ヨ惤鍦板埌 DataBaker 涓?Aishell锛?
- 鏂板杩愯鏃朵富璇嶈〃鏂囦欢锛?  - `platform-resources/data-baker/round-one-quality/backend/reference/minnan-lexicon.json`
  - `platform-resources/aishell-tech/minnan-helper/backend/reference/minnan-lexicon.json`
- 鏈疆鎸夌敤鎴风‘璁ゅ悗鐨勫畬鎴愮増闂藉崡璇?JSON锛屽悓姝ュ啓鍏?DataBaker 涓?Aishell 涓や釜杩愯鏃朵富璇嶈〃璺緞銆?- 褰撳墠涓よ竟鍏堝叡鐢ㄥ悓涓€浠借瘝琛ㄥ唴瀹癸紝渚夸簬缁熶竴缁存姢锛涘悓鏃剁户缁繚鐣欏悇鑷嫭绔?JSON 璺緞锛屽悗缁鏈夊钩鍙板樊寮傚啀鍒嗗埆婕旇繘銆?- 鏈疆鍙仛杩愯鏃朵富璇嶈〃钀藉湴涓庢枃妗ｅ彛寰勫悓姝ワ紝涓嶆敼鍙傝€冩簮 `CSV/XLSX` 璺緞锛屼笉鏀瑰叿浣撹瘝鏉″唴瀹广€?
## 2026-06-10锛圖ataBaker CVPC 鏌冲窞璇濅富璇嶈〃姝ｅ紡钀藉湴锛?
- 鏂板杩愯鏃朵富璇嶈〃鏂囦欢锛?  - `platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-lexicon.json`
- 鏈疆鎺ュ叆鍩轰簬鐢ㄦ埛纭鍚庣殑瀹屾垚鐗堟煶宸炶瘽璇嶈〃锛屽綋鍓嶅彲鐩存帴浣滀负 DataBaker CVPC 鏌冲窞璇濊剼鏈殑杩愯鏃朵富璇嶈〃浣跨敤銆?- 璇嶈〃缁撴瀯宸插榻愮粺涓€涓氬姟璇嶈〃 JSON 濂戠害锛?  - 椤跺眰鍥哄畾涓?`schemaVersion / language / mode / sourceFiles / updatedAt / entries`
  - 姣忔潯 entry 鏄惧紡琛ラ綈 `id / normalized / display / mandarin / aliases / notes / tags / attributes`
- 涓烘敹鍙ｉ噸澶嶅唴瀹癸紝鏈疆棰濆鍋氫簡 3 澶勬渶灏忓唴瀹逛慨姝ｏ細
  - 鍒犻櫎琛ュ厖鍖轰笌涓昏〃閲嶅鐨?`lz-079锛堝悧鍠?-> 鐚村瓙锛塦
  - 鍒犻櫎琛ュ厖鍖轰笌涓昏〃閲嶅鐨?`lz-216锛堟尐 -> 琚級`
  - 鍚堝苟 `lz-014 / lz-015` 鐨勪笉鍚岃闊筹紝淇濈暀鍗曟潯 `涓?-> 涓猔锛屽苟鍦?`attributes` 涓褰?`pronunciation=gu贸`銆乣pronunciationVariants=[g茅]`
- 鏌冲窞璇濊瘝琛ㄧ淮鎶ゅ彛寰勫悓姝ユ敹鍙ｄ负锛?  - 褰撳墠杩愯鏃跺彧缁存姢涓€浠?`鏌冲窞璇?-> 鏅€氳瘽` 涓昏瘝琛?  - 鑻ュ悗缁渶瑕?`鏅€氳瘽 -> 鏌冲窞璇漙 鍙嶆煡锛屽簲浼樺厛鐢变唬鐮佷粠璇ヤ富璇嶈〃娲剧敓锛屼笉鍐嶄汉宸ュ苟琛岀淮鎶ょ浜屼唤骞宠璇嶈〃
- 2026-06-10 琛ュ厖灏忎慨锛?  - 灏嗚ˉ鍏呭尯鐨?`濞冨唇 -> 灏忓瀛恅 骞跺洖涓昏〃 `濞冧粩 -> 灏忓`
  - 褰撳墠浠?`濞冧粩` 浣滀负涓昏瘝鏉★紝`濞冨唇` 鏀逛负 `濞冧粩` 鐨勫埆鍐欙紝涓嶅啀鍗曠嫭淇濈暀 `灏忓瀛恅 鏄犲皠

## 2026-06-10锛圖ataBaker CVPC 鏌冲窞璇濇壒閲忚瘑鍒儹淇簩锛?
- 淇 `鎵归噺璇嗗埆骞惰嚜鍔ㄥ～鍏 鍦ㄩ儴鍒嗙┖鐧芥枃鏈涓婅鎶モ€滃綋鍓嶉〉闈㈠垎娈电姸鎬佸凡鍙樺寲锛屽凡鍋滄鎵归噺鍐欏洖锛岃鍒锋柊鍚庨噸璇曘€傗€濓細
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js` 褰撳墠鍦ㄦ壒閲忓啓鍥炲墠锛屼細鍏堜粠鍚岄煶棰戝叾浠栨鎴栨ā鏉块噷澶嶇敤 `鏍囨敞鏂囨湰 / 鏅€氳瘽椤烘粦` 瀛楁瀹氫箟锛涚洰鏍囨鏈韩缂哄皯 text attr 鏃朵笉鍐嶇洿鎺?fail closed銆?  - 淇濇寔鍘熸湁瀹夊叏杈圭晫锛氫粛鐒跺彧鎸夋垚鍔熸鏇存柊锛屼粛鐒朵紭鍏堟寜 `uniqueId`銆佸け璐ユ椂鍥為€€鎸?`selectionKey(start/end)` 瀵归綈 latest rows銆?- 2026-06-10 琛ュ厖灏忎慨锛?  - 閽堝 `annotation/annos` 鎵€鏈?instance 琛岄兘鍙湁 `鏄惁鏈夋晥锛圴alid or Not锛塦銆佸畬鍏ㄦ病鏈?`鏍囨敞鏂囨湰 / 鏅€氳瘽椤烘粦` attr 鐨勫満鏅紝鎵归噺鍐欏洖褰撳墠鏂板鑴氭湰绾?fallback descriptor銆?  - 褰撻〉闈㈡ā鏉垮拰鍚岄煶棰戞墍鏈夋閮芥嬁涓嶅埌鏂囨湰瀛楁瀹氫箟鏃讹紝浼氬洖閫€浣跨敤璇ヨ剼鏈凡鐭ョ殑涓ゆ潯鏂囨湰瀛楁 `unique_id` 缁х画鏋勯€?`save_increment`锛岄伩鍏嶅啀娆¤鎶モ€滃綋鍓嶉〉闈㈠垎娈电姸鎬佸凡鍙樺寲鈥濄€?- 鎵归噺鍏ュ彛 UI 褰撳墠浠庘€滄枃鏈寖鍥磋緭鍏モ€濇敼涓衡€滃叏閮?+ 娈靛彿閫夋嫨妗嗏€濓細
  - 榛樿鍏ㄩ€夊綋鍓嶉煶棰戝叏閮ㄦ銆?  - 鏀寔鐐瑰嚮鍗曟鍜屾嫋鍔ㄨ繛缁€夋嫨銆?  - `鎵归噺璇嗗埆骞跺～鍏 缁х画澶嶇敤 `褰撳墠娈?AI 鎺ㄨ崘` 鍚屾姗欒壊鏍峰紡銆?- `content.js` 褰撳墠浼氬湪璇诲彇褰撳墠闊抽涓婁笅鏂囧悗鍚屾鍒锋柊鎵归噺鍙€夋锛涘垏闊抽鏃堕噸缃负鍏ㄩ€夛紝鍚岄煶棰戝垏娈垫椂淇濈暀宸查€夎寖鍥淬€?- 鏈疆瀹氬悜楠岃瘉锛?  - `node --test --test-name-pattern "applyBatchTextRecommendations" extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `node --test --test-name-pattern "batch" extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `node --test --test-name-pattern "CVPC batch controller" extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`

## 2026-06-11锛堜簲涓钩鍙拌瘝琛ㄧ姸鎬佸睍绀烘敹鍙ｏ級

- 鏂板鍏变韩鍓嶇 helper锛歚extension/shared/lexicon-display.js`
  - 缁熶竴鎶婂悗绔瘝琛ㄧ姸鎬佹牸寮忓寲涓轰腑鏂?`璇嶈〃鐘舵€佷笌妯″紡`
  - 榛樿骞冲彴鏄剧ず锛歚涓昏瘝琛ㄧ姸鎬?/ 鍥哄畾鎼哄甫 / 鏀瑰啓妯″紡`
  - 鏌冲窞璇濇樉绀猴細`涓昏瘝琛ㄧ姸鎬?/ 鍚煶鍙傝€?寮€鍚瘄鍏抽棴 / 鏂囨湰淇鍥哄畾鎼哄甫`
- 鍓嶇灞曠ず鍚屾琛ラ綈鍒?5 涓剼鏈細
  - DataBaker 闂藉崡璇粨鏋滃崱鏂板 `璇嶈〃鐘舵€佷笌妯″紡`
  - Aishell 闂藉崡璇?AI 璇婃柇鍖烘柊澧?`璇嶈〃鐘舵€佷笌妯″紡`
  - Magic Data 瀹㈠璇濄€侀椊鍗楄鎬荤粨璁哄尯鏂板 `璇嶈〃鐘舵€佷笌妯″紡`
  - DataBaker CVPC 鏌冲窞璇?`AI淇℃伅` 鏂板 `璇嶈〃鐘舵€佷笌妯″紡`
- 鍚庣鍝嶅簲鍙ｅ緞琛ラ綈锛?  - DataBaker 闂藉崡璇?`lexicon` 鎴愬姛浣撴柊澧?`status / source / sourceFile / referenceSourceFile / rowCount / warningMessage`
  - Aishell 闂藉崡璇垚鍔熶綋 `meta.lexicon` 鏂板 `status / source / sourceFile / referenceSourceFile / rowCount / warningMessage / rewriteMode`
  - Magic Data 瀹㈠璇濇垚鍔熶綋 `lexicon` 鏂板 `rewriteMode`
  - DataBaker CVPC 鏌冲窞璇濇垚鍔熶綋鏂板 `lexicon.status / source / sourceFile / referenceSourceFile / rowCount / warningMessage / listenReferenceEnabled`
- 鏈疆瀹氬悜楠岃瘉锛?  - `node --test extension/shared/lexicon-display.test.js`
  - `node --test extension/sites/aishell-tech/minnan-helper/diagnostics.test.js`
  - `node --test extension/sites/data-baker/round-one-quality/ui-panel.test.js`
  - `node --test extension/sites/magic-data/shared/assistant-panel-core.test.js`
  - `node --test extension/sites/magic-data/hakka-helper/assistant-panel.test.js`
  - `node --test extension/sites/magic-data/minnan-helper/assistant-panel.test.js`
  - `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `node --test platform-resources/data-baker/round-one-quality/backend/ai-service.test.js`
  - `node --test platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js`
  - `node --test platform-resources/magic-data/hakka-helper/backend/ai-routes.test.js`
  - `node --test platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`

