function getNameFromEmail(email: string): string {
  const localPart = email.split('@')[0];

  return localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
export default getNameFromEmail;