export function FlexibilityNote() {
  const items = [
    {
      title: "Внесём любые изменения",
      text: "Перенос стен, изменение площади, замена материалов, своя планировка фасада — корректируем проект по вашему запросу. Бесплатно, в рамках договора строительства.",
    },
    {
      title: "Построим по вашему проекту",
      text: "Если у вас уже есть готовая архитектура — берём проект в работу, делаем сметную привязку, согласуем с инженерами и строим.",
    },
    {
      title: "Индивидуальный проект",
      text: "Разработаем планировку с нуля под ваш участок, семью и бюджет. Стоимость проектирования включена в стоимость строительства.",
    },
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-5 md:p-7">
      <h2 className="font-display text-xl font-semibold">Проект — это отправная точка</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Все 160+ проектов в каталоге можно адаптировать. Также строим по чужим проектам и проектируем с нуля — без отдельной строки в смете.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {items.map((i) => (
          <div key={i.title} className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm font-semibold text-foreground">{i.title}</div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{i.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}