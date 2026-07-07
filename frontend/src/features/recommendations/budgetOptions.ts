export const budgetOptions: Array<{ value: number | null; label: string }> = [
  { value: null, label: "가격대 선택 안 함" },
  { value: 1, label: "1단계 · 0~5,000원" },
  { value: 2, label: "2단계 · 5,000~10,000원" },
  { value: 3, label: "3단계 · 10,000~15,000원" },
  { value: 4, label: "4단계 · 15,000~20,000원" },
  { value: 5, label: "5단계 · 20,000원 이상" }
];

export function readBudgetValue(value: string) {
  return value ? Number(value) : null;
}
