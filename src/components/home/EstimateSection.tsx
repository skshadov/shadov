/**
 * §12.10 — единственная форма расчёта на главной (см. §44: запрет
 * дублирования форм после каждого блока).
 */
import { SectionHeading } from "@/components/common/SectionHeading";
import { EstimateForm } from "@/components/forms/EstimateForm";

export function EstimateSection() {
  return (
    <section id="estimate" className="surface-light scroll-mt-24 border-b border-border">
      <div className="container-page py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Получить расчёт"
              title="Предварительная оценка вашего объекта"
              description="Опишите задачу — мы свяжемся, уточним детали, при необходимости предложим выезд на объект и подготовим постатейную смету."
            />
            <ul className="mt-6 grid gap-3 text-sm text-muted-foreground">
              <li>• Заявка не является договором и ни к чему вас не обязывает.</li>
              <li>• Мы не передаём ваши данные третьим лицам.</li>
              <li>• На Этапе 1 форма работает в демонстрационном режиме — данные сохраняются только на вашем устройстве.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 md:p-7">
            <EstimateForm />
          </div>
        </div>
      </div>
    </section>
  );
}