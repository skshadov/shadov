/**
 * Подэтап 2.1 — баннер «черновик юридического документа» (§19 запроса).
 */
export function LegalDraftNotice() {
  return (
    <div role="note" className="mb-6 rounded-md border border-[color:var(--accent-warning)]/40 bg-[color:var(--accent-warning)]/10 p-4 text-sm leading-relaxed">
      <p className="font-semibold">Черновик юридического документа</p>
      <p className="mt-1 text-muted-foreground">
        Перед публикацией необходимо заполнить реквизиты оператора через административную панель и проверить текст с юристом.
      </p>
    </div>
  );
}
