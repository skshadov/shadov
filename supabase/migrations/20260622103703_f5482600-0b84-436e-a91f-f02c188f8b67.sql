DELETE FROM public.consent_records WHERE document_version LIKE 'stage3e%' OR document_version = 'test';
DELETE FROM public.estimate_requests WHERE source_path LIKE '/stage3e%' OR source_path LIKE '/test%' OR request_number LIKE 'STAGE3E%' OR request_number LIKE 'TEST-%';
DELETE FROM public.submission_rate_limits WHERE key_hash LIKE 'stage3e-%';