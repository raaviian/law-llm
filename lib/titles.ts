/**
 * Professional titles shown as a badge on the profile and team pages. These are
 * display-only and SEPARATE from the permission role (owner/admin/member) which
 * governs access. Only owners/admins assign a member's title.
 *
 * Keep these slugs in sync with the CHECK constraint in
 * supabase/migrations/0012_member_titles.sql.
 */
export const MEMBER_TITLES = {
  partner: "Partner",
  senior_lawyer: "Senior Lawyer",
  junior_lawyer: "Junior Lawyer",
  paralegal: "Paralegal",
  admin_staff: "Admin Staff",
} as const;

export type MemberTitle = keyof typeof MEMBER_TITLES;

export function isMemberTitle(value: string): value is MemberTitle {
  return value in MEMBER_TITLES;
}
