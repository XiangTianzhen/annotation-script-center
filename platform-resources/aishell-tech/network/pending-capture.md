# 待补采项

## 网络请求

### 按钮操作级

1. **"有效音频"按钮**：点击后触发的请求（URL + 响应）
2. **"查看历史标注记录"**：弹窗触发的请求（URL + 响应结构）
3. **"删除音频标点"**：点击后触发的请求
4. **"开始标注"按钮**（任务详情页）：点击后的完整请求链路

### 角色级（需质检员/验收员账号）

5. **质检保存**（`/api/check/saveCheck`）：真实 payload + 响应
6. **重检保存**（`/api/check/saveReCheck`）：真实 payload + 响应
7. **完成质检包**（`/api/check/FinishCheck`）：真实 payload + 响应
8. **验收保存**（`/api/accept/saveAccept`）：真实 payload + 响应

### 标注类型

9. **长标注保存**（`/api/mark/saveLongMark`）：长音频/切片标注的 payload 格式

### 页面级

10. **质检/验收员视图**：`.check-area` 可见时的完整 DOM 和交互行为
11. **历史标注记录弹窗**：弹窗 DOM 结构和内容渲染
