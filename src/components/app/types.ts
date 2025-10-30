/**
 * Navigation link structure for AppHeader
 */
export interface NavLink {
  href: string;
  label: string;
}

/**
 * User information for AppHeader display
 * Represents authenticated user data passed from parent layout
 */
export interface UserInfo {
  userId: string;
  email: string;
  displayName: string | null;
}

/**
 * Helper to get display name from user info
 * Falls back to email or generic label
 */
export function getUserDisplayName(user: UserInfo | null): string {
  if (!user) return "Użytkownik";
  return user.displayName || user.email.split("@")[0] || "Użytkownik";
}

/**
 * Helper to get user initials for avatar
 * Returns first character of display name or email
 */
export function getUserInitials(user: UserInfo | null): string {
  if (!user) return "U";
  const name = user.displayName || user.email;
  return name.charAt(0).toUpperCase();
}
