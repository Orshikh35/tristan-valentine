import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body?.action) {
    return NextResponse.json({ ok: false, message: "Missing action" }, { status: 400 });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ ok: false, message: "SMTP env missing" }, { status: 500 });
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const subject = body.action === "yes" ? "✅ She/He clicked YES" : "❌ She/He clicked NO";
  const text =
    `Action: ${body.action}\n` +
    `Time: ${body.ts}\n` +
    `Page: ${body.page}\n` +
    `UserAgent: ${body.userAgent}\n`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.NOTIFY_EMAIL!,
    subject,
    text,
  });

  return NextResponse.json({ ok: true });
}
