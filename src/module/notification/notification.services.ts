import nodemailer from "nodemailer";
import {
  NotificationChannel,
  SendNotificationInput,
  NotificationResponse,
} from "./notification.type";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmailNotification = async (
  payload: SendNotificationInput["payload"]
): Promise<NotificationResponse> => {
  const { to, subject, html, text } = payload;

  if (!to || !subject || (!html && !text)) {
    return { success: false, message: "Missing required email fields (to, subject, html or text)" };
  }

  const info = await transporter.sendMail({
    from: process.env.OUTLOOK_USER_EMAIL,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html: html || undefined,
    text: text || undefined,
  });

  return {
    success: true,
    message: "Email sent successfully",
    messageId: info.messageId,
  };
};

export const sendNotification = async (
  input: SendNotificationInput
): Promise<NotificationResponse> => {
  const { channel, payload } = input;

  switch (channel) {
    case NotificationChannel.EMAIL:
      return sendEmailNotification(payload);

    case NotificationChannel.SMS:
      return { success: false, message: "SMS channel not implemented yet" };

    case NotificationChannel.PUSH:
      return { success: false, message: "Push channel not implemented yet" };

    default:
      return { success: false, message: `Unknown channel: ${channel}` };
  }
};
