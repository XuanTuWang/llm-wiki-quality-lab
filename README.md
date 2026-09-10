# 证据优先知识库

这是一个中文优先的个人知识库工程：资料先进入工作区，AI 提议必须经人工审核，发布后的知识与回答均可回到精确来源。

## 本地启动

```bash
pnpm install
pnpm dev
```

访问 `http://localhost:3000`。首次打开是空资料库；未完成连接时，页面只展示配置指引，不会生成预置资料、审核内容或质量数据。

## 导入资料

资料库支持三种入口：

- 粘贴公开文本或 Markdown；
- 上传多个本地 `.md`、`.markdown`、`.txt`、`.json` 文件；
- 选择一个文件夹作为工作区，批量导入其中的上述文本资料。

文件夹模式使用浏览器原生目录选择器。系统只读取你在选择器中主动确认的文件内容，不保留本地绝对路径；Chromium 系浏览器的支持最完整。

## 配置工程运行环境

复制环境变量模板：

```bash
cp .env.example .env.local
```

在 `.env.local` 中填写以下字段，文件已被 Git 忽略，请勿提交或粘贴到聊天中：

```dotenv
# Supabase 的 Postgres 连接串
DATABASE_URL=

# 任意 OpenAI-compatible 模型服务
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=
LLM_MODEL=

# Langfuse 项目凭据
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_BASE_URL=https://cloud.langfuse.com
LANGFUSE_TRACING_ENVIRONMENT=development
```

填写 `DATABASE_URL` 后执行：

```bash
pnpm db:migrate
```

随后重启 `pnpm dev`。页面顶部会自动检测数据库、模型与 Langfuse 的配置状态；数据库连通后，新增资料会写入 Postgres，并生成版本、SHA-256 与可引用分块。

## 验证命令

```bash
pnpm test
pnpm test:e2e
pnpm build
pnpm lint
pnpm exec tsc --noEmit
```

## 当前边界

- 已支持：中文交互、粘贴/本地文件/文件夹资料录入、审核与发布流程、证据不足拒答、私密模式提示、运行环境检测、数据库资料持久化入口。
- 后续接入：模型驱动的结构化提取、已发布知识检索问答、Langfuse 的真实 Trace、Score、Dataset 写入。
