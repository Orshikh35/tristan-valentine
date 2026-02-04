import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body?.action) {
    return NextResponse.json({ ok: false, message: "Missing action" }, { status: 400 });
  }

  // SMTP тохиргоо (.env дээр хадгална)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
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
    from: process.env.SMTP_FROM,       // ж: "Valentine Bot <bot@yourdomain.com>"
    to: process.env.NOTIFY_EMAIL,      // чиний email
    subject,
    text,
  });

  return NextResponse.json({ ok: true });
}
