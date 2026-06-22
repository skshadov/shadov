// Test mirror of submit-estimate-request. Reads TEST_* env vars. Deleted after audit.
import { createHandler } from "../_shared/handler.ts";

const handler = createHandler({ name: "submit-estimate-request-test", testMode: true });
Deno.serve(handler);