/**
 * Stage 3B test variant. Активируется отдельным флагом TEST_MODE_ENABLED,
 * не трогает production-флаг PUBLIC_DATA_COLLECTION_ENABLED. Allowed origins
 * берутся из TEST_ALLOWED_ORIGINS. Все данные пишутся в те же таблицы;
 * после прогона e2e-тестов очистка выполняется напрямую через service_role.
 */
import { createHandler } from "../_shared/handler.ts";
Deno.serve(createHandler({ name: "submit-estimate-request-test", testMode: true }));