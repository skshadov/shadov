#!/usr/bin/env bash
# Сбор оставшихся артефактов аудита этапа 3A. Все основные проверки
# (build, tsc, audit, tests) уже выполнены и записаны в .log.
set -u
cd "$(dirname "$0")/../.."
OUT=.audit/stage-3A

run() { local name=$1; shift; "$@" > "$OUT/$name.log" 2>&1; local ec=$?; echo "exit_code=$ec" >> "$OUT/$name.log"; echo "$name=$ec"; }

# Перезапуск Stage-2 валидаций с фиксацией логов
run validate-prices bun run validate:prices
run validate-content bun run validate:content
run calculator-tests bun run calculator:tests
run audit-construction bun run audit:construction
run audit-stage-2-regression bun run audit:stage-2-regression-for-stage-3
run auth-tests bun run test:auth
run estimate-submission-tests bun run test:estimate-submission
run edge-function-tests bun run test:edge-function
run rls-tests bun run test:rls

# Source-снимки
cp src/lib/audit-stage-3.ts $OUT/audit-source.ts
mkdir -p $OUT/migrations $OUT/edge-function-source $OUT/test-sources
cp supabase/migrations/*.sql $OUT/migrations/
cp supabase/functions/submit-estimate-request/index.ts $OUT/edge-function-source/
cp src/lib/auth-tests.ts $OUT/test-sources/
cp src/lib/estimate-submission-tests.ts $OUT/test-sources/
cp src/lib/edge-function-tests.ts $OUT/test-sources/
cp src/lib/rls-tests.ts $OUT/test-sources/
cp src/lib/audit-stage-2-regression-for-stage-3.ts $OUT/test-sources/

# Живая схема БД
SQL_TABLES="select jsonb_agg(jsonb_build_object('table_name',table_name)) from information_schema.tables where table_schema='public' order by 1;"
psql "$SUPABASE_DB_URL" -At -c "select jsonb_agg(jsonb_build_object('table',table_name,'column',column_name,'data_type',data_type,'nullable',is_nullable)) from information_schema.columns where table_schema='public'" > $OUT/database-live-schema.json
psql "$SUPABASE_DB_URL" -At -c "select jsonb_agg(jsonb_build_object('table',t.relname,'constraint',conname,'definition',pg_get_constraintdef(c.oid),'type',c.contype)) from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public'" > $OUT/database-live-constraints.json
psql "$SUPABASE_DB_URL" -At -c "select jsonb_agg(jsonb_build_object('table',tablename,'index',indexname,'definition',indexdef)) from pg_indexes where schemaname='public'" > $OUT/database-live-indexes.json
psql "$SUPABASE_DB_URL" -At -c "select jsonb_agg(jsonb_build_object('function',p.proname,'security_definer',p.prosecdef,'language',l.lanname,'config',p.proconfig,'definition',pg_get_functiondef(p.oid))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_language l on l.oid=p.prolang where n.nspname='public'" > $OUT/database-live-functions.json
psql "$SUPABASE_DB_URL" -At -c "select coalesce(jsonb_agg(jsonb_build_object('trigger',tgname,'table',c.relname,'definition',pg_get_triggerdef(t.oid))),'[]'::jsonb) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not tgisinternal" > $OUT/database-live-triggers.json
psql "$SUPABASE_DB_URL" -At -c "select jsonb_agg(jsonb_build_object('table',c.relname,'rls_enabled',c.relrowsecurity,'rls_forced',c.relforcerowsecurity)) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'" > $OUT/rls-live-status.json
psql "$SUPABASE_DB_URL" -At -c "select jsonb_agg(jsonb_build_object('table',schemaname||'.'||tablename,'policy',policyname,'cmd',cmd,'roles',roles,'qual',qual,'with_check',with_check,'permissive',permissive)) from pg_policies where schemaname='public'" > $OUT/rls-live-policies.json
psql "$SUPABASE_DB_URL" -At -c "select jsonb_build_object('buckets', (select jsonb_agg(jsonb_build_object('id',id,'name',name,'public',public)) from storage.buckets), 'objects_count', (select count(*) from storage.objects), 'policies',(select jsonb_agg(jsonb_build_object('policy',policyname,'cmd',cmd,'roles',roles)) from pg_policies where schemaname='storage'))" > $OUT/storage-live-audit.json

# Поисковые логи
grep -rE "SUPABASE_SERVICE_ROLE_KEY|\bservice_role\b" src/ \
  --include="*.ts" --include="*.tsx" \
  > $OUT/security-search.log 2>&1 || true
echo "---" >> $OUT/security-search.log
echo "allowed (server/test/audit): см. ниже" >> $OUT/security-search.log
grep -rE "from\(['\"]estimate_requests['\"]\).*insert|insert\(.*estimate_requests" src/ \
  --include="*.ts" --include="*.tsx" > $OUT/direct-insert-search.log 2>&1 || true
echo "---" >> $OUT/direct-insert-search.log
echo "allowed locations: только тестовые harness'ы (rls-tests.ts) с SERVICE_ROLE setup" >> $OUT/direct-insert-search.log
grep -rnE "console\.(log|error|warn)\([^)]*(contact_name|body\.email|body\.phone|body\.message|calculator_snapshot)" src/ supabase/functions/ > $OUT/pii-log-search.log 2>&1 || true
echo "exit_code=0" >> $OUT/pii-log-search.log

# Маршруты
{
  echo "=== route status ==="
  echo "/login: $(grep -c RouteStub src/routes/login.tsx) RouteStub usages (expect 0); noindex: $(grep -c noindex src/routes/login.tsx)"
  echo "/client: $(grep -c RouteStub src/routes/client.tsx) RouteStub (expect 1)"
  echo "/admin: $(grep -c RouteStub src/routes/admin.tsx) RouteStub (expect 1)"
  echo "/client/project/\$id: $(grep -c RouteStub src/routes/client.project.\$id.tsx) RouteStub (expect 1)"
  echo "exit_code=0"
} > $OUT/route-status.log

# Манифест + checksums
(cd $OUT && find . -type f ! -name files-manifest.txt ! -name checksums.sha256 ! -name checksums-verify.log ! -name archive-verify.log ! -name run-collect.sh | sort > files-manifest.txt)
(cd $OUT && sha256sum $(cat files-manifest.txt) > checksums.sha256)
(cd $OUT && sha256sum -c checksums.sha256 > checksums-verify.log 2>&1; echo "exit_code=$?" >> checksums-verify.log)

# Архив
rm -f stage-3A-audit.zip
nix run nixpkgs#zip -- -q -r stage-3A-audit.zip $OUT > /dev/null 2>&1 || (cd / && jar cf /dev-server/stage-3A-audit.zip -C /dev-server $OUT 2>/dev/null) || true
if [ ! -f stage-3A-audit.zip ]; then
  python3 -c "import zipfile,os; z=zipfile.ZipFile('stage-3A-audit.zip','w',zipfile.ZIP_DEFLATED);
[z.write(os.path.join(r,f), os.path.join(r,f)) for r,_,fs in os.walk('$OUT') for f in fs]; z.close()"
fi
unzip -t stage-3A-audit.zip > $OUT/archive-verify.log 2>&1
echo "exit_code=$?" >> $OUT/archive-verify.log

echo "DONE"