export type RuntimeConfiguration = {
  databaseConfigured: boolean;
  llmConfigured: boolean;
  langfuseConfigured: boolean;
};

export function getRuntimeConfiguration(
  environment: Record<string, string | undefined> = process.env,
): RuntimeConfiguration {
  return {
    databaseConfigured: Boolean(environment.DATABASE_URL),
    llmConfigured: Boolean(environment.LLM_API_KEY && environment.LLM_MODEL),
    langfuseConfigured: Boolean(
      environment.LANGFUSE_PUBLIC_KEY && environment.LANGFUSE_SECRET_KEY,
    ),
  };
}
