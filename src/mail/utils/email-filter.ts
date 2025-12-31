const BLOCKED_KEYWORDS = [
  'noreply',
  'no-reply',
  'donotreply',
  'notification',
  'notifications',
  'mailer',
  'newsletter',
  'promo',
  'marketing',
  'facebookmail',
  'linkedin',
  'instagram',
  'twitter',
  'x.com',
  'amazonses',
];

export function isProfessionalHumanEmail(email: string): {
  isHuman: boolean;
  reason?: string;
} {
  if (!email) return { isHuman: false, reason: 'empty' };

  const lower = email.toLowerCase();
  const [local, domain] = lower.split('@');
  if (!local || !domain) {
    return { isHuman: false, reason: 'invalid_format' };
  }

  // 🔴 Block obvious system / promo mails (like your example)
  if (BLOCKED_KEYWORDS.some((k) => lower.includes(k))) {
    return { isHuman: false, reason: 'blocked_keyword' };
  }

  // ✅ allow normal modern emails (numbers, dots, underscores)
  if (!/^[a-z0-9._+-]+$/.test(local)) {
    return { isHuman: false, reason: 'invalid_local' };
  }

  // basic domain sanity
  if (!domain.includes('.')) {
    return { isHuman: false, reason: 'invalid_domain' };
  }

  return { isHuman: true };
}
