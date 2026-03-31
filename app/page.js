"use client";

import { useMemo, useState } from "react";

const models = {
  mistral: {
    label: "Mistral",
    accent: "#f97316",
    accentDark: "#ea580c",
    pageBg: "linear-gradient(135deg,#fff7ed,#ffe9d7)",
    buttonBg: "linear-gradient(135deg,#fb923c,#f97316)",
    bannerBg: "#fffbeb",
    bannerBorder: "#fcd34d",
    bannerText: "#92400e",
    pillBg: "#ffedd5",
    pipeline: "Mistral OCR + chat",
  },
  gemini: {
    label: "Gemini",
    accent: "#3b82f6",
    accentDark: "#2563eb",
    pageBg: "linear-gradient(135deg,#e0f2ff,#e5e7ff)",
    buttonBg: "linear-gradient(135deg,#3b82f6,#6366f1)",
    bannerBg: "#eef2ff",
    bannerBorder: "#c7d2fe",
    bannerText: "#1e3a8a",
    pillBg: "#e0f2fe",
    pipeline: "Gemini 1.5 Flash",
  },
};

const states = {
  IDLE: "idle",
  PROCESS: "process",
  DONE: "done",
  ERROR: "error",
};

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState("");
  const [model, setModel] = useState("mistral");
  const [status, setStatus] = useState(states.IDLE);
  const [error, setError] = useState("");
  const [rawMarkdown, setRawMarkdown] = useState("");
  const [exam, setExam] = useState(null);
  const [pagesProcessed, setPagesProcessed] = useState(0);

  const theme = models[model];
  const isBusy = status === states.PROCESS;

  const banner = useMemo(() => {
    if (status === states.PROCESS) {
      return model === "mistral"
        ? "Running Mistral OCR and parsing (up to 60s)..."
        : "Running Gemini Flash parsing (up to 60s)...";
    }
    if (status === states.DONE) return "Completed";
    return "";
  }, [status, model]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setExam(null);
    setRawMarkdown("");
    setPagesProcessed(0);

    if (!pdfUrl) {
      setError("Enter a public PDF URL.");
      setStatus(states.ERROR);
      return;
    }

    try {
      setStatus(states.PROCESS);
      const endpoint = model === "mistral" ? "/api/process" : "/api/parse-pdf";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfUrl }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Processing failed" }));
        throw new Error(err.error || "Processing failed");
      }

      const data = await res.json();
      setExam(data.structured);
      setRawMarkdown(data.raw_markdown || "");
      setPagesProcessed(data.pages_processed || 0);
      setStatus(states.DONE);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setStatus(states.ERROR);
    }
  }

  return (
    <div className="min-h-screen text-zinc-900" style={{ background: theme.pageBg }}>
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-2">
          <p
            className="text-sm font-semibold uppercase tracking-[0.2em]"
            style={{ color: theme.accent }}
          >
            Exam Paper Structurer ({theme.label})
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Turn a public exam PDF link into structured JSON and a paper-like view.
          </h1>
          <p className="text-zinc-600">
            Uses {theme.pipeline} in a single pass (60s cap). Paste one public URL and run.
          </p>
          <div className="mt-3 inline-flex w-fit rounded-full bg-white/70 p-1 shadow-sm ring-1 ring-black/5">
            {Object.entries(models).map(([key, value]) => {
              const active = model === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setModel(key)}
                  className="relative rounded-full px-4 py-2 text-sm font-semibold transition"
                  style={{
                    color: active ? "#ffffff" : "#111827",
                    background: active ? value.buttonBg : "transparent",
                    boxShadow: active ? "0 10px 25px rgba(0,0,0,0.12)" : "none",
                  }}
                  disabled={isBusy}
                >
                  {value.label}
                </button>
              );
            })}
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <label className="text-sm font-medium text-zinc-700">Public PDF URL</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              required
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="https://.../exam.pdf"
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-base shadow-inner focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: theme.buttonBg,
                boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
              }}
            >
              {isBusy ? "Working..." : "Process"}
            </button>
          </div>
          <div className="text-sm text-zinc-600">
            One URL per run. We run {theme.label} parsing, then render the structured exam.
          </div>
          {banner && (
            <div
              className="rounded-lg px-4 py-2 text-sm"
              style={{
                background: theme.bannerBg,
                border: `1px solid ${theme.bannerBorder}`,
                color: theme.bannerText,
              }}
            >
              {banner}
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </form>

        {pagesProcessed > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">OCR Summary</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-zinc-700 sm:grid-cols-4">
              <div>
                <dt className="text-zinc-500">Pages</dt>
                <dd>{pagesProcessed}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Pipeline</dt>
                <dd>{theme.pipeline}</dd>
              </div>
            </dl>
          </div>
        )}

        {exam && <PaperView exam={exam} theme={theme} />}

        {rawMarkdown && (
          <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
              OCR Markdown
            </summary>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-sm text-zinc-700">
              {rawMarkdown}
            </pre>
          </details>
        )}

        {exam && (
          <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
              Structured JSON
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre text-xs text-zinc-800">
              {JSON.stringify(exam, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

function PaperView({ exam, theme }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex flex-col gap-1">
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: theme.accent }}
        >
          Rendered Paper
        </p>
        <h2 className="text-2xl font-semibold text-zinc-900">{exam.exam_title}</h2>
        <div className="text-sm text-zinc-600">
          <span>{exam.subject}</span>
          {exam.duration && <span className="ml-2">• {exam.duration}</span>}
          {exam.total_marks !== null && exam.total_marks !== undefined && (
            <span className="ml-2">• {exam.total_marks} marks</span>
          )}
        </div>
        {exam.instructions?.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
            {exam.instructions.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        )}
      </header>

      <div className="flex flex-col gap-5">
        {exam.sections?.map((section, idx) => (
          <Section key={`${section.section_label}-${idx}`} section={section} theme={theme} />
        ))}
      </div>
    </section>
  );
}

function Section({ section, theme }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-col">
          <span
            className="text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: theme.accentDark }}
          >
            {section.section_label}
          </span>
          <h3 className="text-lg font-semibold text-zinc-900">{section.section_title || "Section"}</h3>
        </div>
        {section.section_marks !== undefined && section.section_marks !== null && (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: theme.pillBg, color: theme.accentDark }}
          >
            {section.section_marks} marks
          </span>
        )}
      </div>
      {section.section_instructions && (
        <p className="mt-2 text-sm text-zinc-700">{section.section_instructions}</p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {section.questions?.map((q, idx) => (
          <Question key={`${q.question_number}-${idx}`} question={q} theme={theme} />
        ))}
      </div>
    </article>
  );
}

function Question({ question, theme }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-900">
          {question.question_number ? `${question.question_number}. ` : ""}
          {question.question_text}
        </div>
        {question.marks !== undefined && question.marks !== null && (
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ background: theme.pillBg, color: theme.accentDark }}
          >
            {question.marks} marks
          </span>
        )}
      </div>
      {question.sub_questions && question.sub_questions.length > 0 && (
        <ul className="mt-3 space-y-2 text-sm text-zinc-800">
          {question.sub_questions.map((sq, idx) => (
            <li key={`${sq.part}-${idx}`} className="flex items-start gap-2">
              <span className="font-semibold" style={{ color: theme.accentDark }}>
                {sq.part})
              </span>
              <div className="flex-1">
                <div>{sq.text}</div>
                {sq.marks !== undefined && sq.marks !== null && (
                  <div className="text-xs text-zinc-600">Marks: {sq.marks}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
