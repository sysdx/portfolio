// Admin access policy, used by proxy.ts and by every server action.
// Until Supabase Auth is wired in (phase 2), the admin only works on your own machine:
// production builds refuse admin pages and admin actions.
export function adminEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.ADMIN_AUTH_READY === "true";
}

export function assertAdmin(): void {
  if (!adminEnabled()) {
    throw new Error("The admin is turned off in production until sign-in is configured.");
  }
}
