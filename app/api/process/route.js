import { Mistral } from "@mistralai/mistralai";
import { NextResponse } from "next/server";
import { coerceExamJson } from "@/lib/exam-schema";

export const maxDuration = 60; // allow larger PDFs on platforms with function time limits

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (err) {
    return false;
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pdfUrl = body?.pdfUrl;
  if (!pdfUrl || !isValidUrl(pdfUrl)) {
    return NextResponse.json({ error: "pdfUrl is required and must be a public URL" }, { status: 400 });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing MISTRAL_API_KEY" }, { status: 500 });
  }

  const mistral = new Mistral({ apiKey });

  try {
    // Step 1: OCR directly from the URL
    const ocrResponse = await mistral.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        documentUrl: pdfUrl,
      },
    });

    const fullMarkdown = (ocrResponse.pages || [])
      .map((page) => page.markdown || "")
      .join("\n\n---\n\n");

    // Step 2: Parse markdown into structured JSON
    const structuredResponse = await mistral.chat.complete({
      model: "mistral-small-latest",
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an exam paper parser. Extract the content from the OCR text into structured JSON. Return ONLY a valid JSON object with no markdown, no explanation, matching this exact schema:\n{\n  \"exam_title\": \"string\",\n  \"subject\": \"string\",\n  \"total_marks\": number or null,\n  \"duration\": \"string or null\",\n  \"instructions\": [\"string\"],\n  \"sections\": [\n    {\n      \"section_label\": \"e.g. Section A\",\n      \"section_title\": \"string or null\",\n      \"section_marks\": number or null,\n      \"section_instructions\": \"string or null\",\n      \"questions\": [\n        {\n          \"question_number\": \"e.g. 1 or 1a\",\n          \"question_text\": \"full question text\",\n          \"marks\": number or null,\n          \"sub_questions\": [\n            {\n              \"part\": \"e.g. a, b, i, ii\",\n              \"text\": \"string\",\n              \"marks\": number or null\n            }\n          ]\n        }\n      ]\n    }\n  ]\n}",
        },
        {
          role: "user",
          content: `Parse this exam paper OCR output into the JSON schema:\n\n${fullMarkdown}`,
        },
      ],
    });

    const rawContent = structuredResponse.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawContent);
    const structured = coerceExamJson(parsed);

    return NextResponse.json({
      success: true,
      pages_processed: ocrResponse.pages?.length || 0,
      raw_markdown: fullMarkdown,
      structured,
    });
  } catch (err) {
    const message = err?.message || "Mistral OCR or parsing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
