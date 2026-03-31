/* eslint-disable @typescript-eslint/no-explicit-any */
import ejs from "ejs";
import status from "http-status";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";

// Create transporter
const transporter = nodemailer.createTransport({
  host: envVars.EMAIL_SENDER.SMTP_HOST,
  port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
  secure: Number(envVars.EMAIL_SENDER.SMTP_PORT) === 465, // auto detect
  auth: {
    user: envVars.EMAIL_SENDER.SMTP_USER,
    pass: envVars.EMAIL_SENDER.SMTP_PASS,
  },
});

// Verify transporter (important for debugging)
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}

export const sendEmail = async ({
  subject,
  templateData,
  templateName,
  to,
  attachments,
}: SendEmailOptions) => {
  try {
    // Template path
    const templatePath = path.resolve(
      process.cwd(),
      `src/templates/${templateName}.ejs`
    );

    // Check template exists
    if (!fs.existsSync(templatePath)) {
      throw new AppError(
        status.NOT_FOUND,
        `Email template "${templateName}" not found`
      );
    }

    // Render HTML
    const html = await ejs.renderFile(templatePath, { ...templateData, subject });

    // Send mail
    const info = await transporter.sendMail({
      from: `"SkillBridge" <${envVars.EMAIL_SENDER.SMTP_FROM}>`,
      to,
      subject,
      html,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });

    console.log(`📨 Email sent to ${to} | ID: ${info.messageId}`);

    return info;
  } catch (error: any) {
    console.error("❌ Email Sending Error:", error);

    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to send email"
    );
  }
};