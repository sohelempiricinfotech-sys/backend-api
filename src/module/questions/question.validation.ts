import { z } from "zod";

export const questionTypeEnum = z.enum(["text", "textarea", "radio", "checkbox", "dropdown", "file"]);

export const questionInputSchema = z.object({
    id: z.number().optional(),
    question_text: z.string(),
    question_type: questionTypeEnum,
    options: z.array(z.string()).optional(),
    is_required: z.boolean().optional(),
    order: z.number().optional(),
    isDeleted: z.boolean().optional(),
    description: z.string().optional(),
}).refine(
    (data) => data.isDeleted || data.question_text.length > 0,
    { message: "Question text is required", path: ["question_text"] }
);

// Schema for questions array in job create/update requests
export const questionsArraySchema = z.array(questionInputSchema).optional();
