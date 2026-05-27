# 待补采项

## 网络请求

### 按钮操作级

2. **"有效音频"按钮**：点击后触发的请求（URL + 响应）
3. **"查看历史标注记录"**：弹窗触发的请求（URL + 响应结构）
4. **"删除音频标点"**：点击后触发的请求
5. **"开始标注"按钮**（任务详情页）：点击后的完整请求链路

### 角色级（需质检员/验收员账号）

6. **质检保存**（`/api/check/saveCheck`）：真实 payload + 响应
7. **重检保存**（`/api/check/saveReCheck`）：真实 payload + 响应
8. **完成质检包**（`/api/check/FinishCheck`）：真实 payload + 响应
9. **验收保存**（`/api/accept/saveAccept`）：真实 payload + 响应

### 标注类型

10. **长标注保存**（`/api/mark/saveLongMark`）：长音频/切片标注的 payload 格式

### 页面级

1. **我的团队**（`/organization/myteam`）：完整 DOM 采集
3. **质检/验收员视图**：`.check-area` 可见时的完整 DOM 和交互行为
4. **历史标注记录弹窗**：弹窗 DOM 结构和内容渲染
