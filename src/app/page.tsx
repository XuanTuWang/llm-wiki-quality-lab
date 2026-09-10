"use client";

import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  FlaskConical,
  Menu,
  MessageSquareText,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { buildQualityDashboard, type QualityRun } from "@/lib/quality";

type View = "sources" | "review" | "wiki" | "ask" | "quality";
type Decision = "pending" | "approved" | "rejected";
type PrivacyMode = "demo" | "private";
type RuntimeStatus = {
  database: "connected" | "needs_configuration" | "unreachable";
  llm: "configured" | "needs_configuration";
  langfuse: "configured" | "needs_configuration";
};

const navigation: { id: View; label: string; icon: typeof BookOpen; badge?: string }[] = [
  { id: "sources", label: "资料库", icon: FileText },
  { id: "review", label: "待确认", icon: Sparkles },
  { id: "wiki", label: "已整理", icon: BookOpen },
  { id: "ask", label: "问一问", icon: MessageSquareText },
  { id: "quality", label: "效果查看", icon: FlaskConical },
];

type DemoSource = {
  title: string;
  detail: string;
  status: string;
  tone: "evidence" | "proposal";
};

const initialSources: DemoSource[] = [];
const qualityRuns: QualityRun[] = [];

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "evidence" | "proposal" }) {
  return <span className={"badge badge-" + tone}>{children}</span>;
}

function Intro({ kicker, title, description, action }: { kicker: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-intro"><div><p className="eyebrow">{kicker}</p><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

export default function HomePage() {
  const [view, setView] = useState<View>("sources");
  const [decision, setDecision] = useState<Decision>("pending");
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>("demo");
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const navigate = (next: View) => { setView(next); setOpen(false); };
  const privateMode = privacyMode === "private";
  const connected = runtimeStatus?.database === "connected" && runtimeStatus.llm === "configured";

  useEffect(() => {
    let active = true;
    const readyFrame = window.requestAnimationFrame(() => setHydrated(true));
    fetch("/api/runtime/status")
      .then((response) => response.json())
      .then((status: RuntimeStatus) => {
        if (active) {
          setRuntimeStatus(status);
        }
      })
      .catch(() => {
        if (active) {
          setRuntimeStatus({ database: "unreachable", llm: "needs_configuration", langfuse: "needs_configuration" });
        }
      });

    return () => {
      active = false;
      window.cancelAnimationFrame(readyFrame);
    };
  }, []);

  return <main className={dark ? "app-shell theme-dark" : "app-shell"} aria-busy={!hydrated}>
    <header className="topbar">
      <button className="icon-button mobile-only" aria-label="打开导航" onClick={() => setOpen(true)}><Menu size={20} /></button>
      <div className="workspace-context"><span className="workspace-mark"><BookOpen size={17} /></span><div><p className="eyebrow">我的资料</p><p className="workspace-title">个人知识库 <ChevronRight size={14} /></p></div></div>
      <div className="topbar-actions"><span className={connected ? "runtime-chip runtime-ready" : "runtime-chip"}>{connected ? "已连接" : "等待连接"}</span><button className="privacy-chip" type="button" aria-pressed={privateMode} aria-label={privateMode ? "切换到普通模式" : "切换到私密模式"} onClick={() => setPrivacyMode(privateMode ? "demo" : "private")}><ShieldCheck size={15} /> {privateMode ? "私密资料 · 不保存原文" : "普通资料"}</button><button className="icon-button" aria-label="切换主题" onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button className="search-button"><Search size={17} /><span>搜索资料</span><kbd>⌘ K</kbd></button></div>
    </header>
    {open && <button className="nav-scrim" aria-label="关闭导航" onClick={() => setOpen(false)} />}
    <aside className={open ? "sidebar sidebar-open" : "sidebar"}>
      <div className="mobile-nav-title"><span>工作区导航</span><button className="icon-button" aria-label="关闭导航" onClick={() => setOpen(false)}><X size={18} /></button></div>
      <nav aria-label="工作区分区"><p className="nav-label">整理资料</p>{navigation.map(({ id, label, icon: Icon, badge }) => <button key={id} onClick={() => navigate(id)} className={view === id ? "nav-item nav-active" : "nav-item"}><Icon size={19} /><span>{label}</span>{badge && <span className="nav-badge">{badge} 项待确认</span>}</button>)}</nav>
      <div className="sidebar-foot"><div className="progress-label"><span>连接设置</span><strong>{connected ? "可用" : "等待设置"}</strong></div><div className="progress-track"><span style={{ width: connected ? "100%" : "40%" }} /></div><p>{runtimeStatus?.database === "unreachable" ? "暂时连不上数据库，请检查连接地址。" : "完成数据库和模型设置后，新资料会自动保存。"}</p></div>
    </aside>
    <section className="content-area">
      {view === "review" && <Review decision={decision} setDecision={setDecision} onPublished={() => navigate("wiki")} />}
      {view === "sources" && <Sources databaseConnected={runtimeStatus?.database === "connected"} />}
      {view === "wiki" && <Wiki decision={decision} />}
      {view === "ask" && <Ask privateMode={privateMode} />}
      {view === "quality" && <Quality />}
    </section>
  </main>;
}

function Review({ decision, setDecision, onPublished }: { decision: Decision; setDecision: (value: Decision) => void; onPublished: () => void }) {
  const pending = decision === "pending";
  const status = pending ? "请确认" : decision === "approved" ? "已确认，等待发布" : "已忽略，不会保存";
  const [editing, setEditing] = useState(false);
  const [claim, setClaim] = useState("系统应在将回答呈现为工作区知识前，验证其是否由已批准的来源材料支持。");
  if (decision === "pending") {
    return <><Intro kicker="02 / 确认内容" title="待确认" description="AI 整理后的建议会放在这里，确认后才会保存到知识库。" action={<Badge tone="neutral">0 项待确认</Badge>} />
      <section className="empty-panel"><Sparkles size={24} /><h2>还没有待确认内容</h2><p>先添加资料。完成模型连接后，系统会把整理建议放在这里供你确认。</p></section>
    </>;
  }
  return <><Intro kicker="02 / 确认内容" title="待确认" description="AI 会先整理资料；确认后，内容才会保存到知识库。" action={<Badge tone="proposal">2 项待确认</Badge>} />
    <div className="review-layout">
      <article className="panel proposal-panel">
        <div className="panel-header"><div><p className="eyebrow">AI 整理的内容</p><h2>建议加入“可靠性模式”</h2></div><Badge tone={pending ? "proposal" : "evidence"}>{status}</Badge></div>
        <div className="proposal-copy"><p className="field-label">建议保存的内容</p>{editing ? <textarea className="claim-editor" aria-label="编辑建议内容" value={claim} onChange={(event) => setClaim(event.target.value)} /> : <p className="claim-text">{claim}</p>}<p className="diff-line"><span>+</span> 会与“AI 知识系统的可靠性模式”放在一起。</p></div>
        <p className="model-note"><Sparkles size={17} /> 根据下面的资料自动整理 · 已找到相关内容</p>
        <div className="decision-bar">{pending ? <><button className="button button-primary" onClick={() => { setDecision("approved"); onPublished(); }}><Check size={17} />确认并保存</button><button className="button button-secondary" onClick={() => setEditing(!editing)}>{editing ? "保存修改" : "修改内容"}</button><button className="button button-quiet" onClick={() => setDecision("rejected")}>暂不保存</button></> : <button className="button button-secondary" onClick={() => setDecision("pending")}>重新确认</button>}</div>
      </article>
      <aside className="evidence-rail"><div className="evidence-heading"><span className="evidence-number">01</span><div><p className="eyebrow">参考资料</p><h2>AI 知识系统的可靠性模式</h2></div></div><blockquote>“知识系统需要一个发布边界：生成内容在审核者核对资料并接受变更前，应始终保持为暂定状态。”</blockquote><dl className="source-meta"><div><dt>资料类型</dt><dd>Markdown 研究笔记</dd></div><div><dt>位置</dt><dd>第 4 段 · 第 12–16 行</dd></div><div><dt>文件校验</dt><dd className="mono">sha256:a90e7d2…</dd></div></dl><button className="text-link">查看原始资料 <ArrowUpRight size={15} /></button></aside>
    </div>
  </>;
}

function Sources({ databaseConnected }: { databaseConnected: boolean }) {
  const [items, setItems] = useState(initialSources);
  const [composerOpen, setComposerOpen] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const saveSource = async (title: string, body: string) => {
    if (!databaseConnected) {
      throw new Error("database_not_connected");
    }

    const response = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });

    if (!response.ok) {
      throw new Error("source persistence failed");
    }

    setItems((current) => [
      ...current,
      { title: title.slice(0, 72), detail: "文本 · 已保存到工作区", status: "已保存", tone: "evidence" },
    ]);
  };

  const addSource = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = sourceText.trim();
    if (!trimmed) {
      setError("请先粘贴想添加的文字或 Markdown。 ");
      return;
    }
    const firstLine = trimmed.split("\n").find(Boolean) ?? "未命名公开资料";
    setSaving(true);
    setError(null);
    setImportNotice(null);
    try {
      await saveSource(firstLine, trimmed);
    } catch (reason) {
      setSaving(false);
      setError(reason instanceof Error && reason.message === "database_not_connected" ? "请先完成数据库连接，再添加资料。" : "资料暂时无法保存，请检查数据库连接后重试。");
      return;
    }
    setSourceText("");
    setError(null);
    setComposerOpen(false);
    setSaving(false);
  };

  const importFiles = async (fileList: FileList | null, fromFolder: boolean) => {
    const files = Array.from(fileList ?? []).filter((file) =>
      /\.(md|markdown|txt|json)$/i.test(file.name),
    );

    if (files.length === 0) {
      setError("请选择 Markdown、TXT 或 JSON 文件。");
      return;
    }

    setSaving(true);
    setError(null);
    setImportNotice(null);
    let imported = 0;
    let failed = 0;

    for (const file of files) {
      try {
        const body = file.text ? (await file.text()).trim() : "";
        if (!body) {
          failed += 1;
          continue;
        }
        await saveSource(file.name, body);
        imported += 1;
      } catch {
        failed += 1;
      }
    }

    setSaving(false);
    if (imported > 0) {
      setImportNotice(
        fromFolder ? `已从所选文件夹导入 ${imported} 份资料。` : `已导入 ${imported} 份本地资料。`,
      );
    }
    if (failed > 0) {
      setError(`${failed} 份文件无法读取或保存，请检查后重试。`);
    }
  };

  return <><Intro kicker="01 / 添加资料" title="资料库" description="添加文件、文件夹或文字。原文会保留，AI 只会帮你整理。" action={<div className="source-actions"><button className="button button-primary" type="button" onClick={() => setComposerOpen(true)}>粘贴文字</button><button className="button button-secondary" type="button" onClick={() => fileInputRef.current?.click()}>上传文件</button><button className="button button-secondary" type="button" onClick={() => folderInputRef.current?.click()}>选择文件夹</button></div>} />
    <input ref={fileInputRef} className="file-picker" type="file" multiple accept=".md,.markdown,.txt,.json,text/plain,application/json" aria-label="选择本地文件" onChange={(event) => { void importFiles(event.currentTarget.files, false); event.currentTarget.value = ""; }} />
    <input ref={(element) => { folderInputRef.current = element; element?.setAttribute("webkitdirectory", ""); }} className="file-picker" type="file" multiple accept=".md,.markdown,.txt,.json,text/plain,application/json" aria-label="选择工作区文件夹" onChange={(event) => { void importFiles(event.currentTarget.files, true); event.currentTarget.value = ""; }} />
    {composerOpen && <form className="source-composer" onSubmit={addSource}><label htmlFor="source-text">粘贴文字或 Markdown</label><textarea id="source-text" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="粘贴一段想保存的资料。" aria-describedby={error ? "source-error" : undefined} /><div className="composer-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? "正在保存…" : "添加资料"}</button><button className="button button-secondary" type="button" disabled={saving} onClick={() => { setComposerOpen(false); setError(null); }}>取消</button></div>{error && <p id="source-error" className="form-error" role="alert">{error}</p>}<small>{databaseConnected ? "资料会保存，并保留版本记录。" : "还没有连接数据库，资料会暂时保留在当前页面。"}</small></form>}
    {!composerOpen && error && <p className="import-error" role="alert">{error}</p>}
    {importNotice && <p className="import-notice" role="status">{importNotice}</p>}
    <div className="source-layout"><div className="source-list">{items.length > 0 ? items.map(({ title, detail, status, tone }) => <button className="source-row" key={title}><span className="source-icon"><FileText size={18} /></span><span className="source-main"><strong>{title}</strong><small>{detail}</small></span><Badge tone={tone}>{status}</Badge></button>) : <div className="empty-state"><FileText size={22} /><h2>还没有资料</h2><p>{databaseConnected ? "上传文件、选择文件夹或粘贴文字后，资料会出现在这里。" : "先完成数据库连接，再开始添加资料。"}</p></div>}</div><article className="panel source-preview"><p className="eyebrow">开始使用</p><h2>{databaseConnected ? "添加第一份资料" : "先完成连接设置"}</h2><p>{databaseConnected ? "支持上传文件、选择文件夹或粘贴文字。保存后会保留原文和版本记录。" : "在 .env.local 中填写 DATABASE_URL，执行迁移并重启服务。模型与 Langfuse 可以在资料保存后再接入。"}</p></article></div>
  </>;
}

function Wiki({ decision }: { decision: Decision }) {
  const [citationOpen, setCitationOpen] = useState(false);
  const published = decision === "approved";
  if (!published) {
    return <><Intro kicker="03 / 已整理内容" title="已整理" description="确认过的内容会保存在这里，并标明参考资料。" />
      <section className="empty-panel"><BookOpen size={24} /><h2>还没有已整理的内容</h2><p>确认一条 AI 整理建议后，它会显示在这里，并保留对应的参考资料。</p></section>
    </>;
  }
  return <><Intro kicker="03 / 已整理内容" title="已整理" description="确认过的内容会保存在这里，并标明参考资料。" />
    <div className="wiki-layout"><article className="wiki-page"><Badge tone={published ? "evidence" : "proposal"}>{published ? "已保存 · 参考了 3 处资料" : "等待确认"}</Badge><h2>AI 知识系统的可靠性模式</h2><p>原始资料、AI 整理的解释和你确认过的内容会分开保存。保存内容需要你亲自确认。</p>{published ? <p>每一条保存的内容都能回到对应资料，方便查看它从哪里来。<sup><button className="citation" aria-expanded={citationOpen} aria-label="查看参考资料 1" onClick={() => setCitationOpen(!citationOpen)}>1</button></sup></p> : <p className="draft-note">确认“待确认”中的内容后，它会出现在这里。</p>}<hr /><p className="eyebrow">相关内容</p><div className="related-links"><button>人工确认 <ChevronRight size={15} /></button><button>资料匹配规则 <ChevronRight size={15} /></button></div></article><aside className="evidence-rail"><p className="eyebrow">参考资料</p><h2>内容来自哪里</h2>{citationOpen || published ? <div className="citation-card"><span className="evidence-number">01</span><p>AI 知识系统的可靠性模式</p><small>第 4 段 · 第 12–16 行</small><blockquote>“生成内容在审核者核对资料前，应保持为暂定状态……”</blockquote></div> : <p className="empty-citation">确认后可在这里查看对应资料。</p>}<button className="text-link">查看资料 <ArrowUpRight size={15} /></button></aside></div>
  </>;
}

function Ask({ privateMode }: { privateMode: boolean }) {
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return <><Intro kicker="04 / 根据资料提问" title="问一问" description="回答会优先参考你已确认保存的资料。" />
    <div className="ask-layout"><article className="panel answer-panel">{submitted && question.trim() ? <div className="insufficient-panel" role="status"><strong>暂时找不到相关资料</strong><p>还没有已确认的资料可以回答这个问题。请先添加资料，并确认系统整理出的内容。</p><span>完成模型和资料库连接后，可在这里测试真实问答。</span></div> : <section className="empty-state"><MessageSquareText size={24} /><h2>从资料库开始提问</h2><p>添加资料并确认整理内容后，回答会在这里显示参考资料。</p></section>}</article><form className="ask-box" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><label htmlFor="question">向资料库提问</label><div><input id="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例如：人工确认有什么用？" /><button aria-label="发送问题" type="submit">↑</button></div><small>{privateMode ? "私密资料不会保存原文到运行记录。" : "回答只会参考已确认的资料。"}</small></form></div>
  </>;
}

function Quality() {
  const dashboard = buildQualityDashboard(qualityRuns);
  if (qualityRuns.length === 0) {
    return <><Intro kicker="05 / 回答效果" title="效果查看" description="这里会显示真实回答的资料引用、检查结果和运行记录。" action={<button className="button button-secondary">打开 Langfuse <ArrowUpRight size={16} /></button>} />
      <section className="empty-panel"><FlaskConical size={24} /><h2>还没有运行记录</h2><p>完成模型连接并发起一次真实回答后，效果数据会显示在这里。连接 Langfuse 后，还可以查看更详细的运行记录。</p></section>
    </>;
  }
  const metrics = [
    ["回答有出处", percent(dashboard.kpis.citationSupport), "evidence"],
    ["回答贴合资料", score(dashboard.kpis.groundedness), "evidence"],
    ["资料不足时会说明", percent(dashboard.kpis.appropriateRefusal), "evidence"],
    ["已检查的问题", String(dashboard.kpis.evaluationCoverage.scoredRuns) + " / " + String(dashboard.kpis.evaluationCoverage.totalRuns), "proposal"],
  ] as const;
  const previous = dashboard.promptComparison.find((item) => item.promptVersion === "v0.2");
  const current = dashboard.promptComparison.find((item) => item.promptVersion === "v0.3");
  const bars = [
    ["回答有出处", previous?.citationSupport, current?.citationSupport],
    ["回答贴合资料", previous?.groundedness, current?.groundedness],
    ["资料不足时会说明", previous?.appropriateRefusal, current?.appropriateRefusal],
  ] as const;
  return <><Intro kicker="05 / 回答效果" title="效果查看" description="看看回答有没有参考资料、是否贴合资料，以及最近的检查结果。" action={<button className="button button-secondary">打开 Langfuse <ArrowUpRight size={16} /></button>} />
    <div className="metric-grid">{metrics.map(([label, value, tone]) => <article className="metric-card" key={label}><p>{label}</p><strong>{value}</strong><span className={tone === "evidence" ? "metric-good" : "metric-warm"}>{tone === "evidence" ? "表现良好" : "检查用资料"}</span></article>)}</div>
    <div className="quality-grid"><article className="panel prompt-panel"><div className="panel-header"><div><p className="eyebrow">回答规则对比</p><h2>不同规则下的回答效果</h2></div><span className="mono">{qualityRuns.length} 个问题</span></div><div className="bar-legend"><span><i className="bar-a" /> v0.2</span><span><i className="bar-b" /> v0.3</span></div>{bars.map(([label, before, after]) => <div className="bar-row" key={label}><span>{label}</span><div className="bars"><i className="bar-a" style={{ width: String((before ?? 0) * 100) + "%" }} /><i className="bar-b" style={{ width: String((after ?? 0) * 100) + "%" }} /></div><strong>{"+" + String(Math.round(((after ?? 0) - (before ?? 0)) * 100)) + " 分"}</strong></div>)}</article><article className="panel run-panel"><p className="eyebrow">最近一次回答</p><h2>回答过程</h2><ol><li><Check size={15} /> 查找已确认的资料 <span>81ms</span></li><li><Check size={15} /> 检查资料是否相关 <span>通过</span></li><li><Check size={15} /> 按回答规则生成 <span>1.2s</span></li><li><Check size={15} /> 检查参考资料 <span>通过</span></li></ol><button className="text-link">查看运行记录 <ArrowUpRight size={15} /></button></article></div>
    <div className="quality-table-wrap"><table><caption>检查记录</caption><thead><tr><th>回答规则</th><th>记录编号</th><th>耗时</th><th>检查结果</th></tr></thead><tbody>{dashboard.runTable.map((run) => <tr key={run.id}><td className="mono">{run.promptVersion}</td><td className="mono">{run.traceId}</td><td>{run.durationMs}ms</td><td>{run.scored ? "已检查" : "等待检查"}</td></tr>)}</tbody></table></div>
  </>;
}

function percent(value: number | null): string {
  return value === null ? "—" : String(Math.round(value * 100)) + "%";
}

function score(value: number | null): string {
  return value === null ? "—" : value.toFixed(2);
}
