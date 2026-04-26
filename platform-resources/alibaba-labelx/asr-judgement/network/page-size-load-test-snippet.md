# 快判每页条数负载测试脚本

## 使用场景

当需要比较 `50/100/150/200/400 条/页` 的接口负载时，可在 LabelX 快判详情页打开 DevTools Console，粘贴并执行下面脚本。

这个脚本只测 `data` 接口请求、响应体大小和 JSON 解析成本，同时记录当前页面 DOM 压力。页面真正卡顿通常还来自 LabelX 把题卡、音频控件、单选项和文本框渲染进 DOM 的成本，所以测试结果要和实际滚动、点击、快捷键响应一起判断。

## Console 脚本

```js
(async function testJudgementPageSizeLoad() {
  const pageSizes = [50, 100, 150, 200, 400];
  const subTaskId = decodeURIComponent(
    new URL(location.href).searchParams.get("subTaskId") || ""
  ).trim();

  if (!subTaskId) {
    console.warn("当前 URL 未找到 subTaskId，请在快判详情页执行。");
    return;
  }

  const filter = {
    questions: [],
    dataStatus: "ALL",
    questionsQueryConditions: "AND",
  };

  function readDomPressure() {
    return {
      domNodes: document.getElementsByTagName("*").length,
      itemCards: document.querySelectorAll(".labelRender-item[data-index]").length,
      audioElements: document.querySelectorAll("audio[controls]").length,
      radioInputs: document.querySelectorAll("input[type='radio']").length,
      textareas: document.querySelectorAll("textarea").length,
      bodyTextLength: document.body ? document.body.innerText.length : 0,
      usedHeapMB:
        performance.memory && performance.memory.usedJSHeapSize
          ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
          : null,
    };
  }

  async function fetchOne(pageSize) {
    const url = new URL(
      `/api/v1/label/center/subTask/${encodeURIComponent(subTaskId)}/data`,
      location.origin
    );
    url.searchParams.set("page", "1");
    url.searchParams.set("pageSize", String(pageSize));
    url.searchParams.set("filterPassedVote", "false");
    url.searchParams.set("filter", JSON.stringify(filter));
    url.searchParams.set("_", String(Date.now()));

    const before = readDomPressure();
    const startedAt = performance.now();
    const response = await fetch(url.toString(), {
      credentials: "include",
      cache: "no-store",
    });
    const responseAt = performance.now();
    const text = await response.text();
    const textAt = performance.now();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (error) {
      console.warn("JSON 解析失败", pageSize, error);
    }
    const parsedAt = performance.now();
    const list = Array.isArray(json?.data?.dataList) ? json.data.dataList : [];
    const durations = list
      .map((item) => Number(item?.data?.duration))
      .filter((value) => Number.isFinite(value));

    return {
      pageSize,
      status: response.status,
      ok: response.ok,
      fetchMs: Math.round(responseAt - startedAt),
      readTextMs: Math.round(textAt - responseAt),
      parseJsonMs: Math.round(parsedAt - textAt),
      totalMs: Math.round(parsedAt - startedAt),
      responseKB: Math.round(new Blob([text]).size / 1024),
      itemCount: list.length,
      packageSize: Number(json?.data?.size) || null,
      durationCount: durations.length,
      durationSeconds: Math.round(durations.reduce((sum, value) => sum + value, 0)),
      domBefore: before,
      domAfter: readDomPressure(),
    };
  }

  console.table(
    pageSizes.map((pageSize) => ({
      pageSize,
      note: "pending",
    }))
  );

  const results = [];
  for (const pageSize of pageSizes) {
    results.push(await fetchOne(pageSize));
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.table(
    results.map((row) => ({
      pageSize: row.pageSize,
      status: row.status,
      totalMs: row.totalMs,
      fetchMs: row.fetchMs,
      parseJsonMs: row.parseJsonMs,
      responseKB: row.responseKB,
      itemCount: row.itemCount,
      packageSize: row.packageSize,
      durationSeconds: row.durationSeconds,
      domNodes: row.domAfter.domNodes,
      itemCards: row.domAfter.itemCards,
      audioElements: row.domAfter.audioElements,
      usedHeapMB: row.domAfter.usedHeapMB,
    }))
  );
  console.log("完整结果：", results);
})();
```

## 判断建议

- 如果 `400` 的接口耗时和响应体大小都明显高于 `100/150/200`，优先使用 `100` 或 `150`。
- 如果接口耗时差异不大，但切到 `400 条/页` 后滚动、点击、快捷键明显变慢，瓶颈主要是页面渲染与 DOM 数量，不是网络。
- 扩展当前只改写 `pageSize` 并保留总时长全量统计；要让 400 条稳定不卡，需要宿主页面支持虚拟滚动或窗口化渲染，content script 强行接管列表风险较高。
