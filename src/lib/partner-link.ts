export type PartnerLink = { href: string; label: string; external: boolean };

/**
 * Only http(s) and mailto values ever become real links. Anything else the
 * operator typed into the admin is treated as "no site yet" instead of being
 * rendered into an href. Shared by the public partners wall and the admin
 * preview so the two can never disagree about what is clickable.
 */
export function partnerLink(url: string): PartnerLink | null {
  const value = url.trim();
  if (/^https?:\/\//i.test(value)) return { href: value, label: "Visit site", external: true };
  if (/^mailto:/i.test(value)) return { href: value, label: "Get in touch", external: false };
  return null;
}
