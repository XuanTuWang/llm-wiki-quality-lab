import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeSDK } from "@opentelemetry/sdk-node";

const sdk = new NodeSDK({
  spanProcessors: [
    new LangfuseSpanProcessor({
      exportMode: "immediate",
      mediaUploadEnabled: false,
    }),
  ],
});

sdk.start();
