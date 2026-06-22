/**
 * Этап 3 — единая проверка наличия реквизитов оператора и feature flags.
 *
 * Публичная отправка персональных данных и публичная авторизация
 * включаются только при одновременном выполнении двух условий:
 *  1) operatorConfigured = true (реквизиты в src/config/company.ts заполнены)
 *  2) соответствующий feature flag = true (env / build-time).
 */
import { company, isFilled } from "@/config/company";

export interface OperatorStatus {
  operatorConfigured: boolean;
  missingRequiredFields: string[];
}

/** Проверка минимально необходимого набора реквизитов оператора. */
export function getOperatorStatus(): OperatorStatus {
  const missing: string[] = [];
  // legalName ИЛИ полное имя ИП должны быть заполнены — здесь поле одно.
  if (!isFilled(company.legalName)) missing.push("legalName");
  if (!isFilled(company.email) && !isFilled(company.phone)) missing.push("contact");
  if (!isFilled(company.inn)) missing.push("inn");
  if (!isFilled(company.ogrn)) missing.push("ogrn");
  if (!isFilled(company.legalAddress)) missing.push("legalAddress");
  return {
    operatorConfigured: missing.length === 0,
    missingRequiredFields: missing,
  };
}

/** Безопасное чтение boolean-флага из import.meta.env. */
function envFlag(key: string): boolean {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    const value = env?.[key];
    if (!value) return false;
    const v = value.toLowerCase().trim();
    return v === "1" || v === "true" || v === "yes" || v === "on";
  } catch {
    return false;
  }
}

export function isPublicDataCollectionEnabled(): boolean {
  return envFlag("VITE_PUBLIC_DATA_COLLECTION_ENABLED") && getOperatorStatus().operatorConfigured;
}

export function isPublicAuthEnabled(): boolean {
  return envFlag("VITE_PUBLIC_AUTH_ENABLED") && getOperatorStatus().operatorConfigured;
}

/** Сводка для аудита / отображения в UI. */
export function getOperatorSummary() {
  const status = getOperatorStatus();
  return {
    operatorConfigured: status.operatorConfigured,
    missingRequiredFields: status.missingRequiredFields,
    publicDataCollectionEnabled: isPublicDataCollectionEnabled(),
    publicAuthEnabled: isPublicAuthEnabled(),
  };
}

/** Текущая версия согласия (поднимается при изменении текста). */
export const CONSENT_VERSION = "2026-06-22";