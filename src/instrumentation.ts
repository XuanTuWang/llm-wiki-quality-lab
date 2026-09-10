export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.LANGFUSE_PUBLIC_KEY &&
    process.env.LANGFUSE_SECRET_KEY
  ) {
    await import("./instrumentation.node");
  }
}
