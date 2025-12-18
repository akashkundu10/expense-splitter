// Quick Split Calculator
const quickForm = document.getElementById("quick-form");
const quickTotalInput = document.getElementById("quick-total");
const quickPeopleInput = document.getElementById("quick-people");
const quickTipInput = document.getElementById("quick-tip");
const quickResult = document.getElementById("quick-result");
const quickClearBtn = document.getElementById("quick-clear");

quickForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const total = parseFloat(quickTotalInput.value);
  const people = parseInt(quickPeopleInput.value, 10);
  const tipPercent = parseFloat(quickTipInput.value || "0");

  if (!total || total <= 0 || !people || people <= 0) {
    quickResult.innerHTML =
      '<p class="empty-state">Please enter a valid total and number of people.</p>';
    return;
  }

  const tipAmount = total * (isNaN(tipPercent) ? 0 : tipPercent / 100);
  const grandTotal = total + tipAmount;
  const perPerson = grandTotal / people;

  quickResult.innerHTML = `
    <p>Total: <strong>₹${total.toFixed(2)}</strong> ${
      tipPercent ? `+ tip ${tipPercent.toFixed(0)}% (₹${tipAmount.toFixed(2)})` : ""
    }</p>
    <p>Grand total: <strong>₹${grandTotal.toFixed(2)}</strong></p>
    <p>Each person pays: <strong>₹${perPerson.toFixed(2)}</strong></p>
  `;
});

quickClearBtn.addEventListener("click", () => {
  quickTotalInput.value = "";
  quickPeopleInput.value = "";
  quickTipInput.value = "";
  quickResult.innerHTML =
    '<p class="empty-state">Enter total + people to see per‑person share.</p>';
});

// Sample Trips mock breakdowns with modal
const sampleButtons = document.querySelectorAll(".sample-btn");
const sampleModal = document.getElementById("sample-modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");

const sampleBreakdowns = {
  goa: {
    title: "Goa Friends Getaway · Mock breakdown",
    lines: [
      "Day 1 Airbnb: A & B paid, everyone shares equally.",
      "Cabs & bikes: C pays, split between all 5 friends.",
      "Club entry: D pays only for the 4 who went to the club.",
    ],
  },
  roommates: {
    title: "Roommates Monthly Bills · Mock breakdown",
    lines: [
      "Rent top‑up: Owner pays full, all 3 share evenly.",
      "Wi‑Fi & electricity: One pays the bill, all 3 split.",
      "Groceries: Multiple small expenses tracked across the month.",
    ],
  },
  office: {
    title: "Office Team Dinner · Mock breakdown",
    lines: [
      "Restaurant bill: Manager pays, split between 8 teammates.",
      "Cabs home: 3 people pay for different routes, shared by riders.",
      "Dessert: Paid by one person, only dessert‑eaters share.",
    ],
  },
};

function openSampleModal(key) {
  const data = sampleBreakdowns[key];
  if (!data) return;

  modalTitle.textContent = data.title;
  modalBody.innerHTML = "";

  const ul = document.createElement("ul");
  data.lines.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    ul.appendChild(li);
  });

  modalBody.appendChild(ul);
  sampleModal.classList.add("show");
}

function closeSampleModal() {
  sampleModal.classList.remove("show");
}

sampleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.trip;
    openSampleModal(key);
  });
});

modalClose.addEventListener("click", closeSampleModal);
sampleModal.addEventListener("click", (e) => {
  if (e.target === sampleModal) closeSampleModal();
});
