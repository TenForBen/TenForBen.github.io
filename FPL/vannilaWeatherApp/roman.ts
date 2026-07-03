// roman.ts
// Typed source for the Roman numeral converter.
// TypeScript does NOT run in the browser — compile it first:
//     tsc roman.ts --target ES2017
// That produces roman.js (a classic script), which roman.html loads.

type RomanPair = [value: number, numeral: string];

interface ParseResult {
  ok: boolean;
  value?: number;
  message?: string;
}

// Converts an integer (1–3999) to its Roman numeral string.
function toRoman(num: number): string {
  const map: RomanPair[] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  for (const [value, numeral] of map) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

// Validates raw input, returns a small result object.
function parseNumber(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: false, message: "Please enter a number." };
  const n = Number(trimmed);
  if (!Number.isInteger(n))
    return { ok: false, message: "Roman numerals need a whole number (no decimals)." };
  if (n < 1 || n > 3999)
    return { ok: false, message: "Only numbers from 1 to 3999 can be shown." };
  return { ok: true, value: n };
}

function initRomanConverter(): void {
  const input = document.getElementById("numberInput") as HTMLInputElement | null;
  const button = document.getElementById("convertBtn") as HTMLButtonElement | null;
  const resultBox = document.getElementById("result") as HTMLDivElement | null;
  if (!input || !button || !resultBox) return;

  const show = (html: string, type: "success" | "danger"): void => {
    resultBox.innerHTML = `<div class="alert alert-${type} text-center">${html}</div>`;
  };

  const convert = (): void => {
    const parsed = parseNumber(input.value);
    if (!parsed.ok) {
      show(parsed.message ?? "Invalid input.", "danger");
      return;
    }
    show(`<h4>${parsed.value} = <b>${toRoman(parsed.value as number)}</b></h4>`, "success");
  };

  button.addEventListener("click", convert);
  input.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") convert();
  });
}

// Only wire up the DOM in a browser (guarded so the compiled file is safe to import).
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initRomanConverter);
}
