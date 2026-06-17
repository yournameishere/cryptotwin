export function logServerError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const name = error instanceof Error ? error.name : typeof error;

  console.error(
    JSON.stringify({
      context,
      message,
      name,
      timestamp: new Date().toISOString()
    })
  );
}
