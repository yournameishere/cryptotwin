export function getAppBaseUrl() {
  const explicit = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);

  if (explicit) {
    return explicit;
  }

  const vercelProductionUrl = normalizeVercelHost(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  );

  if (vercelProductionUrl) {
    return vercelProductionUrl;
  }

  const vercelPreviewUrl = normalizeVercelHost(process.env.VERCEL_URL);

  if (vercelPreviewUrl) {
    return vercelPreviewUrl;
  }

  return "http://localhost:3000";
}

function normalizeUrl(value: string | undefined) {
  const clean = value?.trim();

  if (!clean) {
    return null;
  }

  try {
    const url = new URL(clean);
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function normalizeVercelHost(value: string | undefined) {
  const clean = value?.trim().replace(/^https?:\/\//, "");
  return clean ? `https://${clean.replace(/\/$/, "")}` : null;
}
