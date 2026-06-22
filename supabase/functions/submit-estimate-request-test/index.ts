/**
 * Stage 3D test variant. TEST_MODE_ENABLED + TEST_RUN_TOKEN gate.
 * Активируется отдельно от production-флага PUBLIC_DATA_COLLECTION_ENABLED.
 * После завершения e2e-проверок развёртывание удаляется.
 */
import { createHandler } from "../_shared/handler.ts";
Deno.serve(createHandler({ name: "submit-estimate-request-test", testMode: true }));
