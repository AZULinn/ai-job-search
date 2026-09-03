# 贡献指南

欢迎参与改进 Ai Job Search。

## 添加公司数据

如果目标公司使用 Greenhouse、Lever 或 Ashby 托管招聘页面，在 `config/companies.config.ts` 的 `ATS_COMPANIES` 中添加一条：

```ts
{ name: "公司名", ats: "greenhouse", token: "URL 中的 slug", tier: 1, category: "外企", region: "海外" }
```

`token` 的获取方式：
- Greenhouse：`boards.greenhouse.io/` 后面的字符串
- Lever：`jobs.lever.co/` 后面的字符串
- Ashby：`jobs.ashbyhq.com/` 后面的字符串

本地验证：

```bash
npm run crawl -- --only=greenhouse
```

检查 `data/jobs.json` 中是否出现该公司的岗位。

## 添加社区仓库

在 `config/sources.config.ts` 的 `OPENSOURCE_REPOS` 中添加：

```ts
{ id: "repo:xxx", owner: "用户名", repo: "仓库名", path: "README.md", parser: "md-table", category: "互联网" }
```

解析器会根据表头自动识别"公司 / 岗位 / 地点 / 链接"列。启用前请确认原始文件存在且表格格式可被识别。

## 添加新的数据源适配器

1. 在 `scripts/sources/` 下新建文件，导出一个 `SourceAdapter`：

```ts
export default {
  id: "my-source",
  label: "数据源名称",
  async fetch(): Promise<RawJob[]> {
    // 实现采集逻辑
  }
}
```

2. `fetch()` 返回 `RawJob[]` 数组。单个源的失败不应影响其他源（用 try/catch 或 `Promise.allSettled` 隔离）。

3. 在 `scripts/crawl.ts` 的 `selectAdapters` 中注册。

## 调整排序权重

编辑 `config/ranking.config.ts`，无需修改代码逻辑。

## 调试匹配算法

匹配逻辑在 `lib/matchScore.ts`，加权公式在 `computeProfileMatchDetailed` 出。如需调整各维度权重，修改对应百分比即可。

## 开发规范

- `lib/` 和 `scripts/` 内部使用相对路径导入（tsx 兼容）。
- `app/` 和 `components/` 使用 `@/` 别名。
- 提交前运行 `npm run build` 确认构建通过。
- 数据源适配器必须做错误隔离，单源故障不能影响整体。
- 所有 AI 调用走 `lib/deepseek.ts` 的 `callDeepSeek`，统一超时和错误处理。

## 提交规范

- feat: 新功能
- fix: 修复
- docs: 文档
- refactor: 重构
- chore: 构建/工具链变更
