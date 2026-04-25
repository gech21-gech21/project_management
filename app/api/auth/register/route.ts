import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Resend } from "resend";
import { handleApiError } from "@/lib/error-handler";
import { createSuccessResponse } from "@/lib/api-response";

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  specialization: z.string().optional(),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
});

export async function POST(req: Request) {
  try {
    const { email, password, name, username, specialization } = registerSchema.parse(await req.json());
    
    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existingUsername) {
      return createSuccessResponse(
        { 
          exists: true,
          field: "username",
          message: "Username already taken. Please choose another."
        },
        "Username already taken",
        200
      );
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      // Check if user is already verified
      if (existingUser.emailVerified) {
        return createSuccessResponse(
          { 
            exists: true,
            verified: true,
            message: "User with this email already exists. Please login."
          },
          "User already exists",
          200
        );
      } else {
        // User exists but not verified - resend verification
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        // Update existing user with new token
        await prisma.user.update({
          where: { email },
          data: {
            verificationToken,
            verificationTokenExpiry,
            fullName: name,
            username,
            specialization,
            password: await bcrypt.hash(password, 12),
          },
        });
        
        // Send verification email
        await sendVerificationEmail(email, verificationToken, name);
        
        return createSuccessResponse(
          {
            message: "Verification email resent. Please check your inbox.",
            verificationRequired: true,
          },
          "Verification email resent",
          200
        );
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Create user with verification fields
    const user = await prisma.user.create({
      data: {
        email,
        fullName: name,
        username,
        specialization,
        password: hashedPassword,
        emailVerified: null,
        verificationToken,
        verificationTokenExpiry,
        role: "TEAM_MEMBER",
        status: "ACTIVE",
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
      }
    });
    
    // Send verification email
    await sendVerificationEmail(email, verificationToken, name);
    
    return createSuccessResponse(
      { 
        user,
        verificationRequired: true,
        message: "Registration successful! Please check your email to verify your account.",
        ...(process.env.NODE_ENV === 'development' && {
          verificationToken,
          verificationUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}`
        })
      },
      "Registration successful! Please check your email to verify your account.",
      201
    );
    
  } catch (error) {
    console.error("Registration error:", error);
    return handleApiError(error);
  }
}

async function sendVerificationEmail(email: string, token: string, name?: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
  
  // In development, just log the URL
  if (process.env.NODE_ENV === "development") {
    console.log("\n" + "=".repeat(60));
    console.log("📧 VERIFICATION EMAIL");
    console.log("=".repeat(60));
    console.log(`To: ${email}`);
    console.log(`Name: ${name || 'User'}`);
    console.log(`Token: ${token}`);
    console.log(`🔗 Link: ${verificationUrl}`);
    console.log("=".repeat(60) + "\n");
    return;
  }
  
  // In production, send via Resend
  if (!resend) {
    console.warn("Resend API key not configured. Email not sent.");
    console.log(`Verification link for ${email}: ${verificationUrl}`);
    return;
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Acme <onboarding@resend.dev>",
      to: [email],
      subject: "Verify your email address",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
            .container { max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e4e4e7; }
            .logo { font-size: 24px; font-weight: bold; color: #18181b; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7; text-align: center; font-size: 14px; color: #71717a; }
            .link { word-break: break-all; color: #18181b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><span class="logo">Project Management</span></div>
            <div class="content">
              <h1 style="font-size: 24px; margin-bottom: 20px;">Verify your email address</h1>
              <p style="margin-bottom: 20px;">Hello ${name || 'there'},</p>
              <p style="margin-bottom: 20px;">Thanks for signing up for Project Management! Please verify your email address by clicking the button below:</p>
              <div style="text-align: center;"><a href="${verificationUrl}" class="button">Verify Email Address</a></div>
              <p style="margin-top: 30px; margin-bottom: 20px;">Or copy and paste this link into your browser:</p>
              <p style="background-color: #f4f4f5; padding: 12px; border-radius: 4px;"><a href="${verificationUrl}" class="link" style="color: #18181b;">${verificationUrl}</a></p>
              <p style="margin-top: 30px; color: #71717a; font-size: 14px;">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer"><p>&copy; ${new Date().getFullYear()} Project Management. All rights reserved.</p></div>
          </div>
        </body>
        </html>
      `,
    });
    
    if (error) {
      console.error("Resend error:", error);
      throw error;
    }
    
    console.log(`✅ Verification email sent to ${email}`, data);
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }
}
