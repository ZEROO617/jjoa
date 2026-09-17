/** "2025-03" 또는 "2025-03-01" 형태를 "2025.03" 으로 정규화한다. */
export function formatMonth(value?: string): string {
  if (!value) return "";
  const [year, month] = value.split("-");
  if (!year) return value;
  return month ? `${year}.${month.padStart(2, "0")}` : year;
}

/** 시작–종료 기간 문자열. 종료일이 없으면 진행 중으로 표기한다. */
export function formatPeriod(startDate: string, endDate?: string): string {
  const start = formatMonth(startDate);
  if (!endDate) return `${start} — PRESENT`;
  return `${start} — ${formatMonth(endDate)}`;
}
