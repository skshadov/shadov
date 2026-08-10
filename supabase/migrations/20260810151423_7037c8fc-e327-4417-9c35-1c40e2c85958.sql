UPDATE public.site_pricing
SET data = jsonb_set(
  data,
  '{groups}',
  COALESCE(
    (
      SELECT jsonb_agg(price_group ORDER BY ordinal_position)
      FROM jsonb_array_elements(COALESCE(data->'groups', '[]'::jsonb)) WITH ORDINALITY AS groups(price_group, ordinal_position)
      WHERE lower(trim(price_group->>'title')) NOT LIKE 'расход материала%'
    ),
    '[]'::jsonb
  )),
  updated_at = now()
WHERE slug = 'mekhanizirovannaya-shtukaturka'
  AND jsonb_typeof(data->'groups') = 'array';