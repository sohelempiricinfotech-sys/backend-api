import { Readable } from "stream";
import { GetObjectCommand } from "@aws-sdk/client-s3";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { PDFParse } from "pdf-parse"
import mammoth from "mammoth";
import { s3Client } from "../../utility/s3";

/** Stream a S3 object into a Buffer */
async function getS3FileBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME || "",
        Key: key,
    });
    const response = await s3Client.send(command);
    const stream = response.Body as Readable;
    return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
    });
}

/** Strip HTML tags to get plain text (fallback for .doc files stored as HTML) */
function stripHtml(html: string): string {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/\s{2,}/g, " ")
        .trim();
}

/** Extract plain text from a resume buffer based on file extension */
async function extractResumeText(buffer: Buffer, filePath: string): Promise<string> {
    const lower = filePath.toLowerCase();

    if (lower.endsWith(".pdf")) {
        const p = new PDFParse({ data: buffer });
        const data = await p.getText()
        return data.text;
    }

    if (lower.endsWith(".docx")) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }

    // .doc — could be a real binary Word file OR an HTML file with a .doc extension
    if (lower.endsWith(".doc")) {
        const snippet = buffer.slice(0, 5).toString("utf8");
        const isHtml = snippet.trim().toLowerCase().startsWith("<");
        if (isHtml) {
            return stripHtml(buffer.toString("utf8"));
        }
        try {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        } catch {
            // Last resort: treat as HTML
            return stripHtml(buffer.toString("utf8"));
        }
    }

    throw new Error(`Unsupported file type for path: ${filePath}`);
}

/**
 * Downloads a resume file from S3 by its key (file_path),
 * extracts plain text from PDF / DOCX / DOC (including HTML-based .doc),
 * and logs the result to the console.
 *
 * @param filePath  S3 object key, e.g. "resumes/abc-resume.pdf"
 * @returns         The extracted plain text
 */
export async function parseResumeText(filePath: string): Promise<string> {
    const buffer = await getS3FileBuffer(filePath);
    const text = await extractResumeText(buffer, filePath);
    return text;
}

/**
 * Builds an AI prompt that instructs the model to parse resume text
 * into a structured JSON object.
 *
 * @param resumeText  Plain text extracted from the resume
 * @returns           The full prompt string to send to the AI
 */
export function buildResumeParsePrompt(resumeText: string): string {
    return `You are an expert resume parser. Extract structured information from the resume text below and return ONLY a valid JSON object — no markdown, no explanation, no code fences.

The JSON must have exactly this shape (use null for missing fields, empty arrays [] for missing lists):
{
  "first_name": string | null,
  "last_name": string | null,
  "email": string | null,
  "phone": string | null,
  "designation": string | null,
  "gender": string | null,
  "experience_years": number | null,
  "notice_period": number | null,
  "short_summary": string | null,
  "linkedin_url": string | null,
  "skills": string[],
  "objectives": string[],
  "experiences": [
    {
      "job_title": string | null,
      "company_name": string | null,
      "location": string | null,
      "start_date": string | null,
      "end_date": string | null,
      "is_present": boolean,
      "description": string | null
    }
  ],
  "metadata": {
    "date_of_birth": string | null,
    "address_line_1": string | null,
    "address_line_2": string | null,
    "country_iso_code": string | null,
    "country": string | null,
    "state": string | null,
    "city": string | null,
    "pincode": string | null,
    "pan_card_number": string | null,
    "aadhar_card_number": string | null
  }
}

Skill Normalization Rules:
- Normalize every skill to its widely recognized, standard industry name.
- Fix typos and misspellings (e.g. "Androit" → "Android", "Fitbat" → "Fitbit", "Recat" → "React").
- Use standard abbreviations where common (e.g. "Cascading Style Sheets" → "CSS", "Hypertext Markup Language" → "HTML", "JavaScript Object Notation" → "JSON").
- Strip unnecessary suffixes like "SDK", "Framework", "Library" unless they are part of the standard name (e.g. "Android SDK" → "Android", "React.js Library" → "React", but ".NET Framework" stays ".NET").
- Split combined skills into separate entries (e.g. "HTML/CSS" → ["HTML", "CSS"], "React & Redux" → ["React", "Redux"]).
- Use PascalCase or official casing (e.g. "javascript" → "JavaScript", "nodejs" → "Node.js", "postgresql" → "PostgreSQL", "mongodb" → "MongoDB").
- Deduplicate skills — do not include the same skill twice.

Location Extraction Rules:
- Extract the candidate's location from the resume (address, city, state, country mentions).
- "country_iso_code" must be the ISO 3166-1 alpha-2 code (e.g. "IN" for India, "US" for United States, "GB" for United Kingdom, "CA" for Canada, "AU" for Australia).
- "country" must be the full country name (e.g. "India", "United States").
- "state" must be the full state/province name (e.g. "Gujarat", "California", "Ontario").
- If only a city is mentioned, infer the state and country from context if possible.

General Rules:
- Return ONLY the raw JSON object, nothing else.
- Dates must be in YYYY-MM-DD format or null.
- notice_period is in days (e.g. 30, 60, 90).
- experience_years should be a number (e.g. 3.5).
- is_present is true only if the candidate is currently working there.

Resume Text:
---
${resumeText}
---`;
}
