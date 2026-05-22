# Abaka AI Task17 网络差异

## 目录定位

本文只记录 Task17 相对公共 Task 页面网络的差异。公共列表、查看、状态 Tab、资源和动作接口见 `../../network/README.md`。

## 已确认差异

### 领取审核空池

- 触发页面：Task17 内审 Data 页。
- 触发按钮：`领取审核 / Claim Review`。
- Method：`POST`
- Path：`/api/v2/item/receive-item`
- Request shape：

    {
      "taskId": "{task17Id}",
      "nodeId": "{reviewNodeId}",
      "search": {
        "type": "AND",
        "units": []
      }
    }

- Response shape：

    {
      "code": 1000000,
      "message": "领取条目失败，无条目可领"
    }

页面未跳转 `/items`；随后出现验证组件，本轮未继续操作。

## 复用公共接口

- Data 页列表：`../network/task-page/03-data-page-item-list.md`
- 查看页初始化：`../network/task-page/05-items-view-init.md`
- 领取审核接口结构：`../network/task-page/15-claim-review.md`
- 资源加载：`../network/task-page/17-resource-files.md`

## 待补

- Task17 标注 / 审核详情页字段结构只做公共对比，暂不作为功能目标。
- Task17 审核通过、驳回、提交类接口未采集，当前边界下不主动测试。

