export enum NotificationChannel {
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
}

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export interface SendNotificationInput {
  channel: NotificationChannel;
  payload: EmailPayload;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  messageId?: string;
}
