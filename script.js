const STORAGE_KEY = "tripExpenseSplitter_v2";

let state = {
  trip: {
    name: "",
    location: "",
    dates: "",
  },
  friends: [],
  expenses: [],
};

// Trip elements
const tripForm = document.getElementById("trip-form");
const tripNameInput = document.getElementById("trip-name");
const tripLocationInput = document.getElementById("trip-location");
const tripDatesInput = document.getElementById("trip-dates");
const tripSavedText = document.getElementById("trip-saved-text");
const currentTripLine = document.getElementById("current-trip-line");

// Friends
const friendForm = document.getElementById("friend-form");
const friendNameInput = document.getElementById("friend-name");
const friendsList = document.getElementById("friends-list");
const friendsEmpty = document.getElementById("friends-empty");
const friendsCountBadge = document.getElementById("friends-count-badge");

// Expenses
const expenseForm = document.getElementById("expense-form");
const expenseTitleInput = document.getElementById("expense-title");
const expenseAmountInput = document.getElementById("expense-amount");
const expensePayerSelect = document.getElementById("expense-payer");
const splitFriendsContainer = document.getElementById("split-friends");
const expensesList = document.getElementById("expenses-list");
const expensesEmpty = document.getElementById("expenses-empty");
const expensesCountBadge = document.getElementById("expenses-count-badge");

// Summary & stats
const summaryTotals = document.getElementById("summary-totals");
const summarySettlements = document.getElementById("summary-settlements");
const statFriends = document.getElementById("stat-friends");
const statExpenses = document.getElementById("stat-expenses");
const statTotal = document.getElementById("stat-total");

const resetBtn = document.getElementById("reset-btn");

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed) return;

    state.trip = parsed.trip || state.trip;
    state.friends = Array.isArray(parsed.friends) ? parsed.friends : [];
    state.expenses = Array.isArray(parsed.expenses) ? parsed.expenses : [];
  } catch (err) {
    console.error("Failed to load state", err);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save state", err);
  }
}

function initialsFromName(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Trip rendering
function renderTrip() {
  const { name, location, dates } = state.trip || {};

  tripNameInput.value = name || "";
  tripLocationInput.value = location || "";
  tripDatesInput.value = dates || "";

  if (name || location || dates) {
    tripSavedText.textContent = "Trip details saved.";
  } else {
    tripSavedText.textContent = "Trip details not saved yet.";
  }

  const parts = [];
  if (name) parts.push(name);
  if (location) parts.push(location);
  if (dates) parts.push(dates);

  if (parts.length) {
    currentTripLine.textContent = "Current trip: " + parts.join(" · ");
  } else {
    currentTripLine.textContent =
      "No trip saved yet. Start by naming your trip below.";
  }
}

// Friends rendering
function renderFriends() {
  friendsList.innerHTML = "";
  splitFriendsContainer.innerHTML = "";
  expensePayerSelect.innerHTML = '<option value="">Paid by</option>';

  state.friends.forEach((friend) => {
    const li = document.createElement("li");
    li.className = "friend-pill";

    const span = document.createElement("span");
    const avatar = document.createElement("div");
    avatar.className = "friend-avatar";
    avatar.textContent = friend.initials || initialsFromName(friend.name);

    const nameSpan = document.createElement("span");
    nameSpan.textContent = friend.name;

    const totalExpenses = state.expenses.filter((e) =>
      e.includedFriendIds.includes(friend.id)
    ).length;

    const meta = document.createElement("small");
    meta.textContent = totalExpenses
      ? `${totalExpenses} expense${totalExpenses > 1 ? "s" : ""}`
      : "No expenses yet";

    span.appendChild(avatar);
    span.appendChild(nameSpan);

    li.appendChild(span);
    li.appendChild(meta);

    friendsList.appendChild(li);

    const option = document.createElement("option");
    option.value = friend.id;
    option.textContent = friend.name;
    expensePayerSelect.appendChild(option);

    const chip = document.createElement("label");
    chip.className = "chip";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = friend.id;
    checkbox.checked = true;

    const chipName = document.createElement("span");
    chipName.textContent = friend.name;

    chip.appendChild(checkbox);
    chip.appendChild(chipName);
    splitFriendsContainer.appendChild(chip);
  });

  friendsEmpty.style.display = state.friends.length ? "none" : "block";
  friendsCountBadge.textContent = state.friends.length;
}

// Expenses rendering
function renderExpenses() {
  expensesList.innerHTML = "";

  state.expenses.forEach((expense) => {
    const payer = state.friends.find((f) => f.id === expense.payerId);
    const includedNames = expense.includedFriendIds
      .map((id) => state.friends.find((f) => f.id === id)?.name)
      .filter(Boolean);

    const li = document.createElement("li");
    li.className = "expense-card";

    const title = document.createElement("div");
    title.className = "expense-title";
    title.textContent = expense.title;

    const meta = document.createElement("div");
    meta.className = "expense-meta";
    meta.textContent = payer ? `${payer.name} paid` : "Unknown payer";

    const amount = document.createElement("div");
    amount.className = "expense-amount";
    amount.textContent = `₹${expense.amount.toFixed(2)}`;

    const included = document.createElement("div");
    included.className = "expense-included";
    included.textContent =
      includedNames.length === state.friends.length
        ? "Split between everyone"
        : "Split: " + includedNames.join(", ");

    li.appendChild(title);
    li.appendChild(amount);
    li.appendChild(meta);
    li.appendChild(included);

    expensesList.appendChild(li);
  });

  expensesEmpty.style.display = state.expenses.length ? "none" : "block";
  expensesCountBadge.textContent = state.expenses.length;
}

// Totals & stats
function computeTotals() {
  const balances = {};
  state.friends.forEach((f) => {
    balances[f.id] = 0;
  });

  state.expenses.forEach((expense) => {
    const includedCount = expense.includedFriendIds.length || 1;
    const share = expense.amount / includedCount;

    if (balances.hasOwnProperty(expense.payerId)) {
      balances[expense.payerId] += expense.amount;
    }

    expense.includedFriendIds.forEach((fid) => {
      if (balances.hasOwnProperty(fid)) {
        balances[fid] -= share;
      }
    });
  });

  return balances;
}

function computeTotalAmount() {
  return state.expenses.reduce((sum, e) => sum + e.amount, 0);
}

function renderStats() {
  statFriends.textContent = state.friends.length;
  statExpenses.textContent = state.expenses.length;
  statTotal.textContent = computeTotalAmount().toFixed(2);
}

function renderSummary() {
  const balances = computeTotals();
  summaryTotals.innerHTML = "";
  summarySettlements.innerHTML = "";

  const rows = [];
  Object.entries(balances).forEach(([id, amount]) => {
    const friend = state.friends.find((f) => f.id === id);
    if (!friend) return;

    rows.push({
      friend,
      amount,
    });
  });

  if (!rows.length) {
    summaryTotals.innerHTML =
      '<p class="empty-state">Totals will appear here after you add expenses.</p>';
    summarySettlements.innerHTML =
      '<p class="empty-state">Suggested “who pays whom” will show here.</p>';
    return;
  }

  rows.forEach(({ friend, amount }) => {
    const row = document.createElement("div");
    row.className = "summary-row";

    const label = document.createElement("span");
    label.className = "label";
    const avatar = document.createElement("div");
    avatar.className = "friend-avatar";
    avatar.textContent = friend.initials || initialsFromName(friend.name);

    const nameSpan = document.createElement("span");
    nameSpan.textContent = friend.name;

    const status = document.createElement("small");

    if (amount < -0.01) {
      row.classList.add("owes");
      status.textContent = "owes";
    } else if (amount > 0.01) {
      row.classList.add("gets");
      status.textContent = "gets back";
    } else {
      status.textContent = "settled";
    }

    label.appendChild(avatar);
    label.appendChild(nameSpan);

    const amountSpan = document.createElement("span");
    amountSpan.className = "pill-amount";
    amountSpan.textContent = `₹${Math.abs(amount).toFixed(2)}`;

    const right = document.createElement("span");
    right.style.display = "inline-flex";
    right.style.flexDirection = "column";
    right.style.alignItems = "flex-end";
    right.appendChild(amountSpan);
    right.appendChild(status);

    row.appendChild(label);
    row.appendChild(right);

    summaryTotals.appendChild(row);
  });

  const debtors = [];
  const creditors = [];

  Object.entries(balances).forEach(([id, amount]) => {
    if (Math.abs(amount) < 0.01) return;
    const friend = state.friends.find((f) => f.id === id);
    if (!friend) return;

    if (amount < 0) {
      debtors.push({ friend, amount: -amount });
    } else if (amount > 0) {
      creditors.push({ friend, amount });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  if (!debtors.length && !creditors.length) {
    summarySettlements.innerHTML =
      '<p class="empty-state">Everyone is perfectly settled. 🎉</p>';
    return;
  }

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const payAmount = Math.min(debtor.amount, creditor.amount);

    const row = document.createElement("div");
    row.className = "settlement-row";

    const left = document.createElement("div");
    left.innerHTML = `<strong>${debtor.friend.name}</strong> pays <strong>${creditor.friend.name}</strong>`;

    const right = document.createElement("span");
    right.className = "pill-amount";
    right.textContent = `₹${payAmount.toFixed(2)}`;

    row.appendChild(left);
    row.appendChild(right);
    summarySettlements.appendChild(row);

    debtor.amount -= payAmount;
    creditor.amount -= payAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }
}

function renderAll() {
  renderTrip();
  renderFriends();
  renderExpenses();
  renderStats();
  renderSummary();
}

// Events
tripForm.addEventListener("submit", (e) => {
  e.preventDefault();
  state.trip.name = tripNameInput.value.trim();
  state.trip.location = tripLocationInput.value.trim();
  state.trip.dates = tripDatesInput.value.trim();
  saveState();
  renderTrip();
});

friendForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = friendNameInput.value.trim();
  if (!name) return;

  const id = Date.now().toString(36) + Math.random().toString(16).slice(2);
  const friend = {
    id,
    name,
    initials: initialsFromName(name),
  };

  state.friends.push(friend);
  friendNameInput.value = "";
  saveState();
  renderAll();
});

expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!state.friends.length) {
    alert("Add at least one friend first.");
    return;
  }

  const title = expenseTitleInput.value.trim();
  const amount = parseFloat(expenseAmountInput.value);
  const payerId = expensePayerSelect.value;

  if (!title || !amount || amount <= 0 || !payerId) {
    return;
  }

  const checked = Array.from(
    splitFriendsContainer.querySelectorAll("input[type='checkbox']")
  ).filter((c) => c.checked);

  let includedIds = checked.map((c) => c.value);
  if (!includedIds.length) {
    includedIds = state.friends.map((f) => f.id);
  }

  const expense = {
    id: Date.now().toString(36) + Math.random().toString(16).slice(2),
    title,
    amount,
    payerId,
    includedFriendIds: includedIds,
  };

  state.expenses.push(expense);
  expenseTitleInput.value = "";
  expenseAmountInput.value = "";
  expensePayerSelect.value = "";

  saveState();
  renderAll();
});

resetBtn.addEventListener("click", () => {
  const sure = confirm("Reset all friends, expenses, and trip details?");
  if (!sure) return;
  state = {
    trip: { name: "", location: "", dates: "" },
    friends: [],
    expenses: [],
  };
  saveState();
  renderAll();
});

// Init
loadState();
renderAll();
