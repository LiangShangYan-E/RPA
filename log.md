## 2026-04-16 14:50:15

- 修改文件：`src/views/TaskManagement.vue`
- 变更内容：
  - 任务列表点击“执行”成功后，新增轮询任务详情逻辑（最多 30 次，每 2 秒一次）。
  - 当任务状态变为 `SUCCESS`/`FAILED` 或回填到开始/结束时间后，触发任务列表刷新。
  - 保障执行记录相关时间字段在后端异步执行完成后可及时显示。

## 2026-04-16 14:53:33

- 修改文件：`src/views/TaskManagement.vue`
- 变更内容：
  - 增加按任务定向查询执行记录的回填逻辑（优先带 `taskId/taskCode` 查询 `/task/executions`）。
  - 列表加载时，若全量执行记录未匹配到时间，会对当前任务再次定向查询并补齐开始/结束时间。
  - 详情页打开时同样增加定向回填，避免任务已完成但时间仍显示为 `-`。

## 2026-04-16 15:01:00

- 修改文件：`src/api/task.js`、`src/views/TaskManagement.vue`
- 变更内容：
  - 扩展执行记录时间字段映射，兼容 `start_time/end_time`、`started_at/finished_at`、`begin_time/complete_time` 等下划线命名。
  - 扩展任务详情时间字段映射，兼容 `start_time/end_time` 等命名，避免数据库有值但前端取不到。

## 2026-04-16 15:03:19

- 修改文件：`src/api/task.js`、`src/views/TaskManagement.vue`
- 变更内容：
  - 根据数据库字段补充时间映射，新增兼容 `last_started_at` 与 `last_finished_at`。
  - 任务详情与执行记录都可读取这两个字段，修复“数据库有时间但页面显示为 `-`”。

## 2026-04-16 15:10:15

- 修改文件：`src/utils/datetime.js`、`src/api/task.js`、`src/views/TaskManagement.vue`
- 变更内容：
  - 新增本地时间格式化工具 `formatLocalDateTime`，统一输出为 `yyyy-MM-dd HH:mm:ss`。
  - 执行记录接口时间字段在归一化时统一走本地时区格式化。
  - 任务列表与任务详情中的创建/开始/完成时间统一按本地时区格式化展示。

## 2026-04-16 15:12:52

- 修改文件：`src/utils/datetime.js`、`src/api/task.js`、`src/views/TaskManagement.vue`
- 变更内容：
  - 新增 `formatUtcStringToLocal`，对无时区标识的 UTC 时间按本地时区展示。
  - 执行时间字段优先使用 `last_started_at/last_finished_at` 并按 UTC 转本地，修复与创建时间相差 8 小时的问题。

## 2026-04-16 17:06:05

- 修改文件：`src/views/ExecutionRecord.vue`、`src/api/task.js`
- 变更内容：
  - 执行记录页面重构为“列表 + 详情弹窗”样式，新增执行ID筛选、执行时长列、失败错误信息块、步骤时间线展示。
  - 详情弹窗支持显示失败阶段信息，失败时突出展示错误文本。
  - 执行记录字段映射增强：兼容 `process_code`、`robot_code`、`error_message`、`duration_sec`、`steps/step_logs` 等字段，便于直接对接执行库数据。
