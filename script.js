const els = {
    month: document.getElementById("month"),
    income: document.getElementById("income"),
    savings: document.getElementById("savings"),
    sundayExtra: document.getElementById("sundayExtra"),
    monthLabel: document.getElementById("monthLabel"),
    statIncome: document.getElementById("statIncome"),
    statDaily: document.getElementById("statDaily"),
    statSunday: document.getElementById("statSunday"),
    statRemaining: document.getElementById("statRemaining"),
    usableBudget: document.getElementById("usableBudget"),
    budgetBreakdown: document.getElementById("budgetBreakdown"),
    status: document.getElementById("status"),
    todayDate: document.getElementById("todayDate"),
    debtIn: document.getElementById("debtIn"),
    sundayToday: document.getElementById("sundayToday"),
    spent: document.getElementById("spent"),
    remaining: document.getElementById("remaining"),
    resultText: document.getElementById("resultText"),
    tomorrowBudget: document.getElementById("tomorrowBudget"),
    monthSpent: document.getElementById("monthSpent"),
    history: document.getElementById("history")
};

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

let data = JSON.parse(localStorage.getItem("budgetFlow")) || {
    month: currentMonth,
    income: 10000,
    savings: 0,
    sundayExtra: 500,
    days: []
};

if (!data.month) data.month = currentMonth;
els.month.value = data.month;
els.income.value = data.income;
els.savings.value = data.savings;
els.sundayExtra.value = data.sundayExtra;

function money(n) {
    n = Number(n) || 0;
    return (n < 0 ? "-₹" : "₹") + Math.round(Math.abs(n)).toLocaleString("en-IN");
}

function daysInMonth(monthString) {
    const [year, month] = monthString.split("-").map(Number);
    return new Date(year, month, 0).getDate();
}

function monthName(monthString) {
    const [year, month] = monthString.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleString("en-IN", {
        month: "long",
        year: "numeric"
    });
}

function getSundays(monthString) {
    const total = daysInMonth(monthString);
    const [year, month] = monthString.split("-").map(Number);
    let count = 0;

    for (let day = 1; day <= total; day++) {
        if (new Date(year, month - 1, day).getDay() === 0) count++;
    }

    return count;
}

function dateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSunday(date) {
    return date.getDay() === 0;
}

function baseDailyAllowance() {
    const available = Math.max(0, Number(data.income) - Number(data.savings));
    const totalDays = daysInMonth(data.month);

    // Sunday extras are part of the available spending pool.
    // They are added on Sundays, then the remaining money is distributed
    // evenly across the month as the normal allowance.
    const sundayPool = getSundays(data.month) * Number(data.sundayExtra);
    return Math.max(0, (available - sundayPool) / totalDays);
}

function getTodayRecord() {
    const key = dateKey();
    return data.days.find(d => d.date === key);
}

function getPreviousRecord() {
    if (data.days.length === 0) return null;

    const sorted = [...data.days].sort((a, b) => a.date.localeCompare(b.date));
    const today = dateKey();

    const previous = sorted.filter(d => d.date < today);
    return previous.length ? previous[previous.length - 1] : null;
}

function calculateToday() {
    const today = new Date();
    const base = baseDailyAllowance();
    const sunday = isSunday(today) && data.month === currentMonth ? Number(data.sundayExtra) : 0;

    const previous = getPreviousRecord();
    const debt = previous && previous.remaining < 0 ? Math.abs(previous.remaining) : 0;

    return {
        base,
        sunday,
        debt,
        usable: Math.max(0, base + sunday - debt)
    };
}

function render() {
    const today = new Date();
    const todayRecord = getTodayRecord();
    const calc = calculateToday();
    const typedSpent = Number(els.spent.value) || 0;
    const previewRemaining = todayRecord ? todayRecord.remaining : calc.usable - typedSpent;

    const available = Math.max(0, Number(data.income) - Number(data.savings));
    const sundayCount = getSundays(data.month);
    const sundayPool = sundayCount * Number(data.sundayExtra);
    const totalSpent = data.days.reduce((sum, d) => sum + d.spent, 0);

    els.monthLabel.textContent = monthName(data.month);
    els.statIncome.textContent = money(data.income);
    els.statDaily.textContent = money(calc.base);
    els.statSunday.textContent = money(sundayPool);
    els.statRemaining.textContent = money(available - totalSpent);

    els.usableBudget.textContent = money(calc.usable);
    els.budgetBreakdown.textContent =
        `${money(calc.base)} normal${calc.sunday ? ` + ${money(calc.sunday)} Sunday extra` : ""}${calc.debt ? ` − ${money(calc.debt)} debt` : ""}`;

    els.todayDate.textContent = today.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short"
    });

    els.debtIn.textContent = money(calc.debt);
    els.sundayToday.textContent = money(calc.sunday);
    els.monthSpent.textContent = money(totalSpent);

    els.remaining.textContent = money(previewRemaining);
    els.remaining.className = "big-number " + (previewRemaining < 0 ? "negative" : "positive");

    if (previewRemaining < 0) {
        els.resultText.textContent = `${money(previewRemaining)} becomes tomorrow's debt.`;
        els.status.textContent = "Over budget";
        els.status.className = "status debt";
    } else if (calc.sunday > 0) {
        els.resultText.textContent = `Sunday boost unlocked. You have ${money(previewRemaining)} left today.`;
        els.status.textContent = "Sunday bonus";
        els.status.className = "status neutral";
    } else {
        els.resultText.textContent = `You have ${money(previewRemaining)} left today.`;
        els.status.textContent = "On track";
        els.status.className = "status";
    }

    // Tomorrow's normal amount is previewed without assuming another Sunday.
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowSunday = isSunday(tomorrow) ? Number(data.sundayExtra) : 0;
    const nextDebt = previewRemaining < 0 ? Math.abs(previewRemaining) : 0;
    els.tomorrowBudget.textContent = money(Math.max(0, calc.base + tomorrowSunday - nextDebt));

    renderHistory();
}

function renderHistory() {
    if (!data.days.length) {
        els.history.innerHTML = `<div class="empty">No spending recorded for this month yet. Go make your first entry 👀</div>`;
        return;
    }

    const sorted = [...data.days].sort((a, b) => b.date.localeCompare(a.date));

    els.history.innerHTML = sorted.map(d => `
        <div class="history-row">
            <div>
                <small>${d.displayDate}</small>
                <strong>${d.sunday > 0 ? "☀️ Sunday" : "Daily"}</strong>
            </div>
            <div>
                <small>Usable</small>
                <strong>${money(d.usable)}</strong>
            </div>
            <div>
                <small>Spent</small>
                <strong>${money(d.spent)}</strong>
            </div>
            <div>
                <small>Remaining</small>
                <strong class="${d.remaining < 0 ? "negative" : "positive"}">${money(d.remaining)}</strong>
            </div>
        </div>
    `).join("");
}

function saveData() {
    localStorage.setItem("budgetFlow", JSON.stringify(data));
}

document.getElementById("saveSetupBtn").addEventListener("click", () => {
    data.month = els.month.value || currentMonth;
    data.income = Math.max(0, Number(els.income.value) || 0);
    data.savings = Math.max(0, Number(els.savings.value) || 0);
    data.sundayExtra = Math.max(0, Number(els.sundayExtra.value) || 0);

    // Switching month starts a clean history for that month.
    data.days = data.days.filter(d => d.date.startsWith(data.month));

    saveData();
    els.spent.value = "";
    render();
});

document.getElementById("saveBtn").addEventListener("click", () => {
    if (els.spent.value === "" || Number(els.spent.value) < 0) {
        alert("Enter a valid spending amount.");
        return;
    }

    if (data.month !== currentMonth) {
        alert("Your selected month is not the current month. Select the current month before logging today's spending.");
        return;
    }

    const spent = Number(els.spent.value);
    const calc = calculateToday();
    const key = dateKey();
    const existing = data.days.findIndex(d => d.date === key);

    const record = {
        date: key,
        displayDate: new Date().toLocaleDateString("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric"
        }),
        base: calc.base,
        sunday: calc.sunday,
        debt: calc.debt,
        usable: calc.usable,
        spent,
        remaining: calc.usable - spent
    };

    if (existing >= 0) data.days[existing] = record;
    else data.days.push(record);

    saveData();
    els.spent.value = "";
    render();
});

els.month.addEventListener("change", () => {
    data.month = els.month.value || currentMonth;
    els.income.value = data.income;
    els.savings.value = data.savings;
    els.sundayExtra.value = data.sundayExtra;
    render();
});

document.getElementById("clearHistoryBtn").addEventListener("click", () => {
    if (!confirm("Clear all spending history for this month?")) return;

    data.days = [];
    saveData();
    render();
});

document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Reset BudgetFlow completely?")) return;

    data = {
        month: currentMonth,
        income: 10000,
        savings: 0,
        sundayExtra: 500,
        days: []
    };

    els.month.value = currentMonth;
    els.income.value = data.income;
    els.savings.value = data.savings;
    els.sundayExtra.value = data.sundayExtra;
    els.spent.value = "";

    saveData();
    render();
});

document.getElementById("todayBtn").addEventListener("click", () => {
    els.month.value = currentMonth;
    data.month = currentMonth;
    saveData();
    render();
});

render();
