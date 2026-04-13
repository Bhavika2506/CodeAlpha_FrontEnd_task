const display = document.getElementById("display");

let currentInput = "";

// Update display
function updateDisplay() {
  display.textContent = currentInput || "0";
}

// Append value
function appendValue(value) {
  if (value === "." && currentInput.split(/[\+\-\*\/]/).pop().includes(".")) return;
  currentInput += value;
  updateDisplay();
}

// Clear
function clearDisplay() {
  currentInput = "";
  updateDisplay();
}

// Backspace
function backspace() {
  currentInput = currentInput.slice(0, -1);
  updateDisplay();
}

// Calculate
function calculate() {
  try {
    if (!currentInput) return;

    let result = eval(currentInput);

    if (!isFinite(result)) {
      display.textContent = "Error";
      currentInput = "";
    } else {
      currentInput = result.toString();
      updateDisplay();
    }
  } catch {
    display.textContent = "Error";
    currentInput = "";
  }
}

// Button handling
document.querySelectorAll(".btn").forEach(button => {
  button.addEventListener("click", () => {
    const value = button.textContent;

    if (value === "C") clearDisplay();
    else if (value === "⌫") backspace();
    else if (value === "=") calculate();
    else appendValue(value);
  });
});

// Keyboard support
document.addEventListener("keydown", (e) => {
  const key = e.key;

  if (!isNaN(key) || "+-*/.".includes(key)) appendValue(key);
  else if (key === "Enter") calculate();
  else if (key === "Backspace") backspace();
  else if (key === "Escape") clearDisplay();
});