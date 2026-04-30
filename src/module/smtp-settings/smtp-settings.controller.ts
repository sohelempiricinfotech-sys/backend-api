import { Request, Response } from "express";
import { getSmtpSettings, upsertSmtpSettings } from "./smtp-settings.services";

export const getSmtpSettingsController = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.loginUser.user;

    const settings = await getSmtpSettings(org_id);

    return res.status(200).json({
      message: "SMTP settings fetched successfully",
      data: settings
        ? {
            host: settings.host,
            port: settings.port,
            secure: settings.secure,
            username: settings.username,
            password: settings.password,
            from_email: settings.from_email,
            from_name: settings.from_name,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Error fetching SMTP settings:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const upsertSmtpSettingsController = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;

    const { host, port, secure, username, password, from_email, from_name } = req.body;

    await upsertSmtpSettings(
      org_id,
      { host, port, secure: secure ?? false, username, password, from_email, from_name },
      user_id
    );

    return res.status(200).json({ message: "SMTP settings saved successfully" });
  } catch (error: any) {
    console.error("Error saving SMTP settings:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};
