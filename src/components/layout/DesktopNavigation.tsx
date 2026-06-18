/**
 * Десктопная навигация (§10 ТЗ + уточнение 9).
 * Использует Radix NavigationMenu для корректной клавиатурной
 * работы, aria-expanded, aria-haspopup, Escape-закрытия,
 * возвращения фокуса на триггер. Меню не «только на hover» —
 * Radix открывает по клавиатуре Enter/Space.
 */
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Link } from "@tanstack/react-router";
import { MAIN_NAV, isDropdown, type NavDropdown } from "@/data/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export function DesktopNavigation() {
  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList className="gap-1">
        {MAIN_NAV.map((item) =>
          isDropdown(item) ? (
            <DropdownItem key={item.to} item={item} />
          ) : (
            <NavigationMenuItem key={item.to}>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: true }}
                  activeProps={{ "data-status": "active" }}
                  className="text-sm"
                >
                  {item.label}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function DropdownItem({ item }: { item: NavDropdown }) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="text-sm">{item.label}</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid w-[640px] grid-cols-[1fr_1.4fr] gap-0 overflow-hidden rounded-md border border-border bg-popover">
          <div className="flex flex-col justify-between gap-6 border-r border-border bg-[color:var(--surface-deep)] p-5">
            <div>
              <p className="font-display text-base font-semibold leading-tight">
                {item.label}
              </p>
              {item.description ? (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </div>
            <NavigationMenuLink asChild>
              <Link
                to={item.to}
                className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-primary hover:underline"
              >
                Перейти в раздел
                <ArrowRight aria-hidden="true" className="h-3 w-3" />
              </Link>
            </NavigationMenuLink>
          </div>
          <ul className="grid grid-cols-2 gap-1 p-3">
            {item.items.map((sub) => (
              <li key={sub.to}>
                <NavigationMenuLink asChild>
                  <Link
                    to={sub.to}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm leading-snug transition-colors",
                      "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent",
                    )}
                  >
                    {sub.label}
                  </Link>
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}