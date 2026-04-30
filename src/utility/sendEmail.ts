import { sendNotification } from "../module/notification/notification.services";
import { NotificationChannel } from "../module/notification/notification.type";

export const sendEmail = async (values: {
  notification: {
    subject: string;
    message: string;
    user: { email: string };
  };
}): Promise<void> => {
  try {
    const { notification } = values;
    const response = await sendNotification({
      channel: NotificationChannel.EMAIL,
      payload: {
        to: notification.user.email,
        subject: notification.subject,
        html: notification.message,
      },
    });
    console.log("Notification response:", response);
  } catch (error) {
    console.error("Error sending email via notification service:", error);
  }
};
