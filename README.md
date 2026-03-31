# 🎓 Vault AI - Exam Paper Structurer

A Next.js app that turns public exam PDFs into structured JSON with two pipelines: **Mistral** (OCR + chat) and **Gemini** (file upload + JSON schema). The UI toggles models and swaps branding to match.

## ✨ Features
- Dual models: Mistral (OCR URL → markdown → chat) and Gemini (file upload → JSON schema), same output schema.
- 60s budget (`maxDuration = 60`) on both routes for serverless limits.
- Clean UI with per-model gradients, status banners, rendered paper, JSON view; Mistral also shows OCR markdown + page count.

## 🚀 Getting Started
- Prereqs: Node.js 18+, keys for both providers.
- Install deps: `npm install`.
- Env (.env.local):
  ```env
  MISTRAL_API_KEY=your_mistral_key
  GEMINI_API_KEY=your_gemini_key
  ```
- Run dev: `npm run dev` and open http://localhost:3000.

## 📖 Usage
1) Paste a **public PDF URL**. 2) Choose **Mistral** or **Gemini** (default Mistral). 3) Click **Process** (up to 60s). 4) Review the rendered paper + JSON; Mistral responses also include markdown and page count.

## 🏗️ Project Structure
```
vault-ai/
├── app/
│   ├── api/
│   │   ├── process/route.js      # Mistral: OCR URL -> markdown -> chat JSON
│   │   └── parse-pdf/route.js    # Gemini: fetch -> /tmp -> upload -> JSON schema
│   ├── globals.css
│   ├── layout.js
│   └── page.js                   # UI with model toggle + theming
├── lib/
│   └── exam-schema.js            # Shared Zod schema for both models
├── public/
├── .env.local
├── next.config.mjs
├── package.json
└── postcss.config.mjs
```

## 🔧 Technologies
- Next.js 16.2, React 19, Tailwind 4
- Mistral SDK (@mistralai/mistralai)
- Gemini SDK (@google/generative-ai)
- Zod for validation

## 📊 Data Structure (shared)
```json
{
  "exam_title": "string",
  "subject": "string",
  "total_marks": "number|null",
  "duration": "string|null",
  "instructions": ["string"],
  "sections": [
    {
      "section_label": "Section A",
      "section_title": "string|null",
      "section_marks": "number|null",
      "section_instructions": "string|null",
      "questions": [
        {
          "question_number": "1 or 1a",
          "question_text": "string",
          "marks": "number|null",
          "sub_questions": [
            { "part": "a", "text": "string", "marks": "number|null" }
          ]
        }
      ]
    }
  ]
}
```

## 🚦 API Endpoints
- **POST `/api/process`** (Mistral)
  - Body: `{ "pdfUrl": "https://.../exam.pdf" }`
  - Flow: Mistral OCR on URL → markdown stitch → chat (`mistral-small-latest`) → JSON parse → `coerceExamJson` → returns `{ success, pages_processed, raw_markdown, structured }`.

- **POST `/api/parse-pdf`** (Gemini)
  - Body: `{ "pdfUrl": "https://.../exam.pdf" }`
  - Flow: fetch PDF → write to `/tmp` → `GoogleAIFileManager.uploadFile` → `gemini-2.5-flash` with `responseSchema` → JSON parse → `coerceExamJson` → returns `{ success, structured }`.
  - Cleanup: `finally` removes the `/tmp` file and `fileManager.deleteFile` on the Gemini upload.

UI picks the endpoint based on the toggle and swaps palette (orange for Mistral, blue/purple gradient for Gemini).

## 🎨 Implementation Notes (per model)
- **Mistral mode**: Uses public PDF URL directly; `mistral-ocr-latest` → joined markdown → `mistral-small-latest` with `responseFormat: json_object`; validates with `exam-schema`; includes markdown + pages in the response.
- **Gemini mode**: Downloads to RAM → saves to `/tmp` → uploads via `GoogleAIFileManager` (server import) → `gemini-2.5-flash` with `responseSchema` mirroring the Zod schema → validates with `exam-schema`; returns structured JSON only; always cleans temp + remote files in `finally`.

## 🔌 Bring this into your project (direct steps)
1) `npm install @mistralai/mistralai @google/generative-ai zod`.
2) Copy a shared exam schema (see `lib/exam-schema.js`).
3) Mistral path: OCR the URL with `mistral-ocr-latest`, stitch markdown, run chat with `responseFormat: json_object`, JSON-parse, validate.
4) Gemini path: fetch PDF, write to `/tmp`, `uploadFile` via `GoogleAIFileManager` (server import), call `generateContent` with `responseSchema`, JSON-parse, validate, and clean temp + remote files in `finally`.
5) Expose both as separate Next.js routes; add a frontend toggle to call the right endpoint.

## ⚙️ Configuration
| Variable | Description | Required |
|----------|-------------|----------|
| `MISTRAL_API_KEY` | Mistral key for OCR + chat | Yes (Mistral mode) |
| `GEMINI_API_KEY`  | Gemini key for file upload + JSON | Yes (Gemini mode) |

## 🐛 Known Limitations
- Requires public PDF URLs.
- 60s cap; very large PDFs may time out.
- OCR quality depends on source PDF.

---
Built with ❤️ using Next.js, Mistral, and Gemini.
