import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { handleApiError, AppError, ErrorCodes } from "@/lib/error-handler";

async function verify(token: string) {
  // Find the user that has this verification token (we store tokens on the User model)
  const record = await prisma.user.findUnique({
    where: { verificationToken: token },
  });

  if (!record) {
    throw new AppError(
      "Invalid verification token",
      400,
      ErrorCodes.INVALID_TOKEN,
    );
  }

  if (
    record.verificationTokenExpiry &&
    record.verificationTokenExpiry < new Date()
  ) {
    // Clear expired token from the user record
    await prisma.user.update({
      where: { id: record.id },
      data: {
        verificationToken: null,
        verificationTokenExpiry: null,
      } as Prisma.UserUpdateInput,
    });
    throw new AppError(
      "Verification token has expired",
      400,
      ErrorCodes.TOKEN_EXPIRED,
    );
  }

  // Update user email verification status and clear token fields
  const user = await prisma.user.update({
    where: { id: record.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
      verificationTokenExpiry: null,
    } as Prisma.UserUpdateInput,
  });

  if (!user) {
    throw new AppError(
      "User not found for this verification token",
      404,
      ErrorCodes.NOT_FOUND,
    );
  }

  // Token fields already cleared on the user

  return {
    verified: true,
    email: record.email,
    message: "Email verified successfully! You can now log in.",
  };
}

// Helper function to get base URL safely
function getBaseUrl(req: Request): string {
  // Use environment variable first, fallback to request origin
  const envUrl = process.env.NEXTAUTH_URL;
  if (envUrl) {
    return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
  }

  // Fallback to request origin (works in production)
  const origin = req.headers.get("origin") || "http://localhost:3000";
  return origin;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      throw new AppError(
        "Verification token is required",
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    const result = await verify(token);

    // Use helper function to get base URL
    const baseUrl = getBaseUrl(req);

    // Construct redirect URL safely
    const redirectUrl = new URL("/auth", baseUrl);
    redirectUrl.searchParams.set("verified", "true");
    redirectUrl.searchParams.set("email", result.email);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    // Handle errors with proper redirect
    const baseUrl = getBaseUrl(req);
    const errorMessage =
      error instanceof AppError
        ? error.message
        : "Verification failed. Please try again.";

    const redirectUrl = new URL("/auth", baseUrl);
    redirectUrl.searchParams.set("verified", "false");
    redirectUrl.searchParams.set("error", errorMessage);

    return NextResponse.redirect(redirectUrl);
  }
}

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      throw new AppError(
        "Verification token is required",
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    const result = await verify(token);

    return NextResponse.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
