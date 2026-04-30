import { sendEmail } from "./sendEmail";

export const bulkEmail = async (
  data: Array<{ email: string; message: string,subject: string }>
) => {
  for (let i = 0; i < data.length; i++) {
    const mess = data[i].message; 
    const otpEmail = {
      channels: ["email"],
      notification: {
        subject: data[i].subject, 
        message: mess,
        priority: "high",
        timestamp: `${new Date().toISOString()}`,
        user: {
          email: data[i].email,
          preferences: {
            doNotDisturb: false,
          },
        },
      },
    };
    sendEmail(otpEmail);
  }
  return;
};
