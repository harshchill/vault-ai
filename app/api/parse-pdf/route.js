import { NextResponse } from "next/server";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { coerceExamJson } from "@/lib/exam-schema";

export const maxDuration = 60;

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (err) {
    return false;
  }
}

const examResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    exam_title: { type: SchemaType.STRING },
    subject: { type: SchemaType.STRING },
    total_marks: { type: SchemaType.NUMBER, nullable: true },
    duration: { type: SchemaType.STRING, nullable: true },
    instructions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    sections: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          section_label: { type: SchemaType.STRING },
          section_title: { type: SchemaType.STRING, nullable: true },
          section_marks: { type: SchemaType.NUMBER, nullable: true },
          section_instructions: { type: SchemaType.STRING, nullable: true },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                question_number: { type: SchemaType.STRING },
                question_text: { type: SchemaType.STRING },
                marks: { type: SchemaType.NUMBER, nullable: true },
                sub_questions: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      part: { type: SchemaType.STRING },
                      text: { type: SchemaType.STRING },
                      marks: { type: SchemaType.NUMBER, nullable: true },
                    },
                    required: ["part", "text"],
                  },
                },
              },
              required: ["question_number", "question_text"],
            },
          },
        },
        required: ["section_label", "questions"],
      },
    },
  },
  required: ["exam_title", "subject", "sections"],
};

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
  }

  const fileManager = new GoogleAIFileManager(apiKey);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  let tempFilePath;
  let uploadedFileName;

  try {
    // Download PDF into memory
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF (status ${pdfResponse.status})`);
    }
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    // Persist to /tmp for Gemini file upload
    tempFilePath = path.join(os.tmpdir(), `pdf-${crypto.randomUUID()}.pdf`);
    fs.writeFileSync(tempFilePath, pdfBuffer);

    // Upload to Gemini file manager to obtain a fileUri
    const uploadResponse = await fileManager.uploadFile(tempFilePath, {
      mimeType: "application/pdf",
      displayName: path.basename(tempFilePath),
    });
    uploadedFileName = uploadResponse.file.name;
    const fileUri = uploadResponse.file.uri;

    // Ask Gemini to extract structured JSON matching our schema
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: "application/pdf",
                fileUri,
              },
            },
            {
              text:
                "Extract the exam paper contents from the attached PDF and return ONLY a valid JSON object that matches the provided schema. Do not add markdown or prose.",
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: examResponseSchema,
        temperature: 0.2,
      },
    });

    const rawText = result.response?.text?.() || "{}";
    const parsed = JSON.parse(rawText);
    const structured = coerceExamJson(parsed);

    return NextResponse.json({ success: true, structured });
  } catch (err) {
    const message = err?.message || "Gemini parsing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.error("Failed to clean up temp file", err);
      }
    }
    if (uploadedFileName) {
      try {
        await fileManager.deleteFile(uploadedFileName);
      } catch (err) {
        console.error("Failed to delete Gemini file", err);
      }
    }
  }
}
