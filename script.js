/* ── State ── */
let display = "0";
let historyLine = "";
let shouldReset = false;
let isLight = false;
let isScientific = false;
let showHistory = false;
let historyList = [];
let activeTimeout = null;

/* ── DOM refs ── */
const $ = (id) => document.getElementById(id);
const displayEl = $("displayValue");
const historyEl = $("historyLine");
const wrapper = $("calcWrapper");
const sciGrid = $("sciGrid");
const stdGrid = $("stdGrid");
const historyPanel = $("historyPanel");
const mainContent = $("mainContent");
const historyListEl = $("historyList");

/* ── Render helpers ── */
function updateDisplay() {
  const len = display.length;
  displayEl.style.fontSize = len > 12 ? "1.5rem" : len > 8 ? "1.875rem" : "2.25rem";
  displayEl.textContent = display;
  historyEl.textContent = historyLine;
}

function createButton(label, type, wide) {
  const btn = document.createElement("button");
  btn.className = "calc-btn " + type + (wide ? " wide" : "");
  btn.textContent = label;
  btn.dataset.label = label;
  return btn;
}

/* ── Calculator logic ── */
function handleNumber(num) {
  if (display === "Error") { display = num; updateDisplay(); return; }
  if (shouldReset) { display = num; shouldReset = false; updateDisplay(); return; }
  if (display === "0" && num !== ".") { display = num; }
  else if (num === "." && (display.split(/[+\-×÷]/).pop() || "").includes(".")) { return; }
  else { display += num; }
  updateDisplay();
}

function handleOperator(op) {
  if (display === "Error") return;
  const last = display[display.length - 1];
  if (["+", "−", "×", "÷", "^"].includes(last)) { display = display.slice(0, -1) + op; }
  else { display += op; shouldReset = false; }
  updateDisplay();
}

function handleClear() {
  display = "0"; historyLine = ""; shouldReset = false;
  updateDisplay();
}

function handleBackspace() {
  if (display === "Error") { handleClear(); return; }
  display = display.length === 1 ? "0" : display.slice(0, -1);
  updateDisplay();
}

function factorial(n) {
  if (n <= 1) return 1;
  let r = 1; for (let i = 2; i <= n; i++) r *= i; return r;
}

function calculate() {
  if (display === "Error") return;
  try {
    let expr = display.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/\^/g, "**");
    const last = expr[expr.length - 1];
    if (["+", "-", "*", "/", "*"].includes(last)) return;

    if (expr.includes("/0") && !expr.includes("/0.")) {
      const parts = expr.split("/");
      for (let i = 1; i < parts.length; i++) {
        if (parseFloat(parts[i]) === 0) {
          historyLine = display + " ="; display = "Error"; shouldReset = true;
          updateDisplay(); return;
        }
      }
    }

    const result = new Function("return " + expr)();
    const formatted = typeof result === "number" ? parseFloat(result.toFixed(10)).toString() : "Error";
    historyLine = display + " =";
    if (formatted !== "Error") historyList.push({ expression: display, result: formatted });
    display = formatted; shouldReset = true;
    updateDisplay();
  } catch { historyLine = display + " ="; display = "Error"; shouldReset = true; updateDisplay(); }
}

function handleScientificFn(fn) {
  if (display === "Error") return;
  try {
    const val = parseFloat(display);
    if (isNaN(val)) return;
    let result, expr;

    switch (fn) {
      case "sin": result = Math.sin(val * Math.PI / 180); expr = "sin(" + display + ")"; break;
      case "cos": result = Math.cos(val * Math.PI / 180); expr = "cos(" + display + ")"; break;
      case "tan":
        if (val % 180 === 90) { historyLine = "tan(" + display + ")"; display = "Error"; shouldReset = true; updateDisplay(); return; }
        result = Math.tan(val * Math.PI / 180); expr = "tan(" + display + ")"; break;
      case "log":
        if (val <= 0) { historyLine = "log(" + display + ")"; display = "Error"; shouldReset = true; updateDisplay(); return; }
        result = Math.log10(val); expr = "log(" + display + ")"; break;
      case "ln":
        if (val <= 0) { historyLine = "ln(" + display + ")"; display = "Error"; shouldReset = true; updateDisplay(); return; }
        result = Math.log(val); expr = "ln(" + display + ")"; break;
      case "√":
        if (val < 0) { historyLine = "√(" + display + ")"; display = "Error"; shouldReset = true; updateDisplay(); return; }
        result = Math.sqrt(val); expr = "√(" + display + ")"; break;
      case "x²": result = val * val; expr = "(" + display + ")²"; break;
      case "x³": result = val * val * val; expr = "(" + display + ")³"; break;
      case "1/x":
        if (val === 0) { historyLine = "1/(" + display + ")"; display = "Error"; shouldReset = true; updateDisplay(); return; }
        result = 1 / val; expr = "1/(" + display + ")"; break;
      case "±": result = -val; expr = "-(" + display + ")"; break;
      case "n!":
        if (val < 0 || !Number.isInteger(val) || val > 170) { historyLine = display + "!"; display = "Error"; shouldReset = true; updateDisplay(); return; }
        result = factorial(val); expr = display + "!"; break;
      default: return;
    }

    const formatted = parseFloat(result.toFixed(10)).toString();
    historyLine = expr; display = formatted; shouldReset = true;
    if (formatted !== "Error") historyList.push({ expression: expr, result: formatted });
    updateDisplay();
  } catch { display = "Error"; shouldReset = true; updateDisplay(); }
}

function insertConstant(val) {
  if (shouldReset || display === "0" || display === "Error") display = val;
  else display += val;
  shouldReset = false;
  updateDisplay();
}

function insertParen(ch) {
  if (ch === "(") {
    if (shouldReset || display === "0") display = "(";
    else display += "(";
    shouldReset = false;
  } else { display += ")"; shouldReset = false; }
  updateDisplay();
}

/* ── Build buttons ── */
const sciButtons = [
  { l: "sin", fn: () => handleScientificFn("sin") },
  { l: "cos", fn: () => handleScientificFn("cos") },
  { l: "tan", fn: () => handleScientificFn("tan") },
  { l: "log", fn: () => handleScientificFn("log") },
  { l: "ln",  fn: () => handleScientificFn("ln") },
  { l: "√",   fn: () => handleScientificFn("√") },
  { l: "x²",  fn: () => handleScientificFn("x²") },
  { l: "x³",  fn: () => handleScientificFn("x³") },
  { l: "^",   fn: () => handleOperator("^") },
  { l: "1/x", fn: () => handleScientificFn("1/x") },
  { l: "±",   fn: () => handleScientificFn("±") },
  { l: "n!",  fn: () => handleScientificFn("n!") },
  { l: "π",   fn: () => insertConstant(Math.PI.toFixed(10).replace(/0+$/, "")) },
  { l: "e",   fn: () => insertConstant(Math.E.toFixed(10).replace(/0+$/, "")) },
  { l: "(",   fn: () => insertParen("(") },
  { l: ")",   fn: () => insertParen(")") },
];

sciButtons.forEach((b) => {
  const btn = createButton(b.l, "scientific");
  btn.addEventListener("click", b.fn);
  sciGrid.appendChild(btn);
});

const stdButtons = [
  { l: "C", t: "function", fn: handleClear },
  { l: "⌫", t: "function", fn: handleBackspace },
  { l: "%", t: "function", fn: () => handleOperator("%") },
  { l: "÷", t: "operator", fn: () => handleOperator("÷") },
  { l: "7", t: "number", fn: () => handleNumber("7") },
  { l: "8", t: "number", fn: () => handleNumber("8") },
  { l: "9", t: "number", fn: () => handleNumber("9") },
  { l: "×", t: "operator", fn: () => handleOperator("×") },
  { l: "4", t: "number", fn: () => handleNumber("4") },
  { l: "5", t: "number", fn: () => handleNumber("5") },
  { l: "6", t: "number", fn: () => handleNumber("6") },
  { l: "−", t: "operator", fn: () => handleOperator("−") },
  { l: "1", t: "number", fn: () => handleNumber("1") },
  { l: "2", t: "number", fn: () => handleNumber("2") },
  { l: "3", t: "number", fn: () => handleNumber("3") },
  { l: "+", t: "operator", fn: () => handleOperator("+") },
  { l: "0", t: "number", fn: () => handleNumber("0"), w: true },
  { l: ".", t: "number", fn: () => handleNumber(".") },
  { l: "=", t: "operator", fn: calculate },
];

stdButtons.forEach((b) => {
  const btn = createButton(b.l, b.t, b.w);
  btn.addEventListener("click", b.fn);
  stdGrid.appendChild(btn);
});

/* ── Toolbar toggles ── */
$("btnScientific").addEventListener("click", () => {
  isScientific = !isScientific;
  showHistory = false;
  $("btnScientific").classList.toggle("active", isScientific);
  $("btnHistory").classList.remove("active");
  sciGrid.style.display = isScientific ? "grid" : "none";
  wrapper.classList.toggle("scientific", isScientific);
  historyPanel.style.display = "none";
  mainContent.style.display = "";
});

$("btnHistory").addEventListener("click", () => {
  showHistory = !showHistory;
  $("btnHistory").classList.toggle("active", showHistory);
  historyPanel.style.display = showHistory ? "" : "none";
  mainContent.style.display = showHistory ? "none" : "";
  if (showHistory) renderHistory();
});

$("btnTheme").addEventListener("click", () => {
  isLight = !isLight;
  document.documentElement.classList.toggle("light-theme", isLight);
  $("btnTheme").textContent = isLight ? "🌙" : "☀️";
});

$("clearHistory").addEventListener("click", () => {
  historyList = [];
  renderHistory();
});

function renderHistory() {
  if (historyList.length === 0) {
    historyListEl.innerHTML = '<div class="history-empty">No calculations yet</div>';
    return;
  }
  historyListEl.innerHTML = "";
  [...historyList].reverse().forEach((entry) => {
    const div = document.createElement("div");
    div.className = "history-entry";
    div.innerHTML = '<div class="expr">' + entry.expression + '</div><div class="result">' + entry.result + '</div>';
    div.addEventListener("click", () => {
      display = entry.result; shouldReset = true; showHistory = false;
      $("btnHistory").classList.remove("active");
      historyPanel.style.display = "none"; mainContent.style.display = "";
      updateDisplay();
    });
    historyListEl.appendChild(div);
  });
}

/* ── Keyboard support ── */
const keyMap = {
  "0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",
  ".":".","+":"+","-":"−","*":"×","/":"÷","Enter":"=","=":"=","Backspace":"⌫","Escape":"C"
};

function flashKey(label) {
  const btn = document.querySelector('[data-label="' + label + '"]');
  if (!btn) return;
  btn.classList.add("pressed");
  clearTimeout(activeTimeout);
  activeTimeout = setTimeout(() => btn.classList.remove("pressed"), 120);
}

document.addEventListener("keydown", (e) => {
  const label = keyMap[e.key];
  if (label) flashKey(label);

  if (e.key >= "0" && e.key <= "9") handleNumber(e.key);
  else if (e.key === ".") handleNumber(".");
  else if (e.key === "+") handleOperator("+");
  else if (e.key === "-") handleOperator("−");
  else if (e.key === "*") handleOperator("×");
  else if (e.key === "/") { e.preventDefault(); handleOperator("÷"); }
  else if (e.key === "Enter" || e.key === "=") calculate();
  else if (e.key === "Backspace") handleBackspace();
  else if (e.key === "Escape") handleClear();
});
