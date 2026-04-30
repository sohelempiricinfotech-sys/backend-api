import { publishToQueue } from "./amqp";

export enum EmailPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
}

export interface EmailSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface EmailQueueMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from_email: string;
  from_name?: string;
  reply_to?: string;
  smtp: EmailSmtpConfig;
}

export async function publishEmail(
  payload: EmailQueueMessage,
  priority: EmailPriority = EmailPriority.NORMAL,
): Promise<boolean> {
  const queue = process.env.EMAIL_QUEUE_NAME || "email_queue";
  return publishToQueue(queue, payload, priority);
}
