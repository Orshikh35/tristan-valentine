import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const port = Number(process.env.SMTP_PORT || 587);
    const secure = port === 465;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({ ok: false, message: "SMTP env missing" }, { status: 500 });
    }
    if (!process.env.NOTIFY_EMAIL) {
      return NextResponse.json({ ok: false, message: "NOTIFY_EMAIL missing" }, { status: 500 });
    }

    // Visitor info (Vercel дээр IP нь ихэнхдээ x-forwarded-for дээр ирдэг)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const country =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      "unknown";

    const city =
      req.headers.get("x-vercel-ip-city") ||
      "unknown";

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.NOTIFY_EMAIL,
      subject: "👀 New visitor opened your Valentine page",
      text:
        `Time: ${body.ts}\n` +
        `Page: ${body.page}\n` +
        `Referrer: ${body.referrer}\n` +
        `IP: ${ip}\n` +
        `Country: ${country}\n` +
        `City: ${city}\n` +
        `UserAgent: ${body.userAgent}\n`,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "Server error" }, { status: 500 });
  }
}
