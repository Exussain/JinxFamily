// Mirrors product schemas without inventing a second set of field names for
// the dedicated Fortnite purchase pages.  Only keys explicitly configured by
// an admin are stored in custom_fields.
export function credentialCustomFields(schema, { platform, email, password }) {
  if (!Array.isArray(schema)) return {};
  const values = {};
  for (const field of schema) {
    if (!field || typeof field !== "object" || !field.key) continue;
    const key = String(field.key).trim();
    const normalized = key.toLowerCase();
    if (/(platform|account_type|login_method)/.test(normalized)) values[key] = platform || "";
    else if (/(email|mail)/.test(normalized)) values[key] = email || "";
    else if (/(password|_pass$|pass_word)/.test(normalized)) values[key] = password || "";
  }
  return values;
}
