import { z } from "zod";

// Schema describing the structured exam paper JSON returned by Mistral parsing.
export const examSchema = z.object({
  exam_title: z.string().min(1, "exam_title is required"),
  subject: z.string().min(1, "subject is required"),
  total_marks: z.number().nullable().optional(),
  duration: z.string().nullable().optional(),
  instructions: z.array(z.string()).default([]),
  sections: z
    .array(
      z.object({
        section_label: z.string().min(1),
        section_title: z.string().nullable().optional(),
        section_marks: z.number().nullable().optional(),
        section_instructions: z.string().nullable().optional(),
        questions: z
          .array(
            z.object({
              question_number: z.string().min(1),
              question_text: z.string().min(1),
              marks: z.number().nullable().optional(),
              sub_questions: z
                .array(
                  z.object({
                    part: z.string().min(1),
                    text: z.string().min(1),
                    marks: z.number().nullable().optional(),
                  })
                )
                .default([]),
            })
          )
          .default([]),
      })
    )
    .default([]),
});

export function coerceExamJson(raw) {
  const parsed = examSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  // If validation fails, surface a simplified error for the caller.
  throw new Error(`Invalid exam JSON: ${parsed.error.errors.map((e) => e.message).join("; ")}`);
}
