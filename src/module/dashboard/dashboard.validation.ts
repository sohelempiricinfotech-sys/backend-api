import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const dashboardStatsSchema = z.object({
  user_ids: z
    .array(z.number().int().positive())
    .optional(),
  start_date: z
    .string()
    .regex(dateRegex, "start_date must be in YYYY-MM-DD format"),
  end_date: z
    .string()
    .regex(dateRegex, "end_date must be in YYYY-MM-DD format"),
});

export const dashboardChartSchema = z.object({
  user_ids: z
    .array(z.number().int().positive())
    .optional(),
  start_date: z
    .string()
    .regex(dateRegex, "start_date must be in YYYY-MM-DD format"),
  end_date: z
    .string()
    .regex(dateRegex, "end_date must be in YYYY-MM-DD format"),
});

export const candidatesByStateSchema = z.object({
  country: z.string().min(1, "country is required"),
  user_ids: z
    .array(z.number().int().positive())
    .optional(),
  start_date: z
    .string()
    .regex(dateRegex, "start_date must be in YYYY-MM-DD format"),
  end_date: z
    .string()
    .regex(dateRegex, "end_date must be in YYYY-MM-DD format"),
});
