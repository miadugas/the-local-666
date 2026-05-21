import type { Response } from "express";
import { isDev } from "../env.js";

export const SESSION_COOKIE = "session_token";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: !isDev,
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  });
}

export function clearSessionCookie(res: Response): void {
  res.cookie(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: !isDev,
    path: "/",
    maxAge: 0,
  });
}
