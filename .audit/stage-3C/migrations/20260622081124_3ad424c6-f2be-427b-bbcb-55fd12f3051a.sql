
CREATE POLICY "project docs members read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND public.is_project_member(
      ((string_to_array(name, '/'))[1])::uuid,
      auth.uid()
    )
  );

CREATE POLICY "project docs admins all"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'project-documents' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'project-documents' AND public.has_role(auth.uid(), 'admin'));
