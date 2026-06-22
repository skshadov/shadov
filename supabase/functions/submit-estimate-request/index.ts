/**
 * Stage 3B — production submit-estimate-request.
 * Вся бизнес-логика и валидация в общем handler (../_shared/handler.ts),
 * чтобы тестовый вариант разделял код. Production-флаг и список origins
 * читаются из ALLOWED_ORIGINS / PUBLIC_DATA_COLLECTION_ENABLED.
 */
import { createHandler } from "../_shared/handler.ts";
Deno.serve(createHandler({ name: "submit-estimate-request", testMode: false }));