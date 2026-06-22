import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/public/stage3d-env-check')({
  server: { handlers: { GET: async () => {
    const names = ['TEST_MODE_ENABLED','TEST_RUN_TOKEN','TEST_ALLOWED_ORIGINS','TEST_RATE_LIMIT_SALT','SUPABASE_URL','SUPABASE_PROJECT_ID'];
    const status: Record<string,{present:boolean,length:number}> = {};
    for (const n of names) {
      const v = process.env[n];
      status[n] = { present: typeof v === 'string' && v.length > 0, length: (v||'').length };
    }
    return new Response(JSON.stringify(status,null,2), { headers: { 'Content-Type':'application/json' }});
  }}}
});
