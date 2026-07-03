// roman.js
// Roman numeral converter — pure logic + UI wiring.
// Loaded by roman.html via <script src="roman.js"></script>.

// ---- Pure logic ----------------------------------------------------------
// Converts an integer (1–3999) to its Roman numeral string.
function toRoman(num) {
  const map = [
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

// Validates raw input, returns { ok, value } or { ok, message }.
function parseNumber(raw) {
  const trimmed = String(raw).trim();
  if (trimmed === "") return { ok: false, message: "Please enter a number." };
  const n = Number(trimmed);
  if (!Number.isInteger(n))
    return { ok: false, message: "Roman numerals need a whole number (no decimals)." };
  if (n < 1 || n > 3999)
    return { ok: false, message: "Only numbers from 1 to 3999 can be shown." };
  return { ok: true, value: n };
}

// ---- UI wiring -----------------------------------------------------------
function initRomanConverter() {
  const input = document.getElementById("numberInput");
  const button = document.getElementById("convertBtn");
  const resultBox = document.getElementById("result");
  if (!input || !button || !resultBox) return; // guard: not on this page

  function show(html, type) {
    resultBox.innerHTML =
      '<div class="alert alert-' + type + ' text-center">' + html + "</div>";
  }

  function convert() {
    const parsed = parseNumber(input.value);
    if (!parsed.ok) {
      show(parsed.message, "danger");
      return;
    }
    show("<h4>" + parsed.value + " = <b>" + toRoman(parsed.value) + "</b></h4>", "success");
  }

  button.addEventListener("click", convert);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") convert();
  });
}

// Only wire up the DOM in a browser (guarded so the file is safe to import in Node).
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initRomanConverter);
}

// ---- Optional: makes the pure functions importable for tests in Node -----
if (typeof module !== "undefined" && module.exports) {
  module.exports = { toRoman, parseNumber };
}
