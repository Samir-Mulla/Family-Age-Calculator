document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("memberForm");
  const tableBody = document.querySelector("#dataTable tbody");
  const searchInput = document.getElementById("search");
  const sortSelect = document.getElementById("sort");
  const filterSelect = document.getElementById("filter");

  let members = JSON.parse(localStorage.getItem("familyMembers")) || [];
  members = members.map((member) => ({
    ...member,
    dob: new Date(member.dob),
  }));

  let editIndex = -1;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const dob = new Date(form.dob.value);
    const relationship = form.relationship.value;

    if (!name || isNaN(dob) || !relationship) return;

    const member = {
      name,
      dob: dob.toISOString(),
      relationship,
    };

    if (editIndex !== -1) {
      members[editIndex] = member;
      editIndex = -1;
      form.querySelector("button").textContent = "Add Member";
    } else {
      members.push(member);
    }

    localStorage.setItem("familyMembers", JSON.stringify(members));
    form.reset();
    renderTable();
  });

  searchInput.addEventListener("input", renderTable);
  sortSelect.addEventListener("change", renderTable);
  filterSelect.addEventListener("change", renderTable);

  function calculateAgeUnits(dob) {
    dob = new Date(dob);
    const now = new Date();
    const diffMs = now - dob;

    const ageYears =
      now.getFullYear() -
      dob.getFullYear() -
      (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate())
        ? 1
        : 0);

    const ageMonths = ageYears * 12 + (now.getMonth() - dob.getMonth());
    const ageDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const ageWeeks = Math.floor(ageDays / 7);
    const ageHours = Math.floor(diffMs / (1000 * 60 * 60));
    const ageMinutes = Math.floor(diffMs / (1000 * 60));
    const ageSeconds = Math.floor(diffMs / 1000);

    return {
      age: ageYears,
      units: [
        `${ageYears} -------- years`,
        `${ageMonths} ---------- months`,
        `${ageWeeks} -------- weeks`,
        `${ageDays} ----- days`,
        `${ageHours.toLocaleString()} --- hours`,
        `${ageMinutes.toLocaleString()} --- minutes`,
        `${ageSeconds.toLocaleString()} - seconds`,
      ],
    };
  }

  function renderTable() {
    tableBody.innerHTML = "";
    let filtered = [...members];

    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(searchTerm)
      );
    }

    const filter = filterSelect.value;
    if (filter) {
      const [min, max] = filter.split("-").map(Number);
      filtered = filtered.filter((m) => {
        const { age } = calculateAgeUnits(m.dob);
        return max ? age >= min && age <= max : age >= parseInt(min);
      });
    }

    if (sortSelect.value === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortSelect.value === "age") {
      filtered.sort(
        (a, b) => calculateAgeUnits(b.dob).age - calculateAgeUnits(a.dob).age
      );
    }

    document.getElementById("memberCount").textContent = members.length;

    filtered.forEach((member, index) => {
      const { age, units } = calculateAgeUnits(member.dob);

      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.textContent = member.name;

      const dobCell = document.createElement("td");
      dobCell.textContent = new Date(member.dob).toLocaleDateString();

      const relationshipCell = document.createElement("td");
      relationshipCell.textContent = member.relationship;

      const ageCell = document.createElement("td");
      ageCell.textContent = `${age} years`;

      const unitCell = document.createElement("td");
      const list = document.createElement("ul");
      units.forEach((unit) => {
        const li = document.createElement("li");
        li.textContent = unit;
        list.appendChild(li);
      });
      unitCell.appendChild(list);

      const actionCell = document.createElement("td");

      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.style.marginRight = "10px";
      editBtn.onclick = () => {
        form.name.value = member.name;
        form.dob.value = member.dob.toISOString().split("T")[0];
        form.relationship.value = member.relationship;
        editIndex = index;
        form.querySelector("button").textContent = "Update Member";
      };

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.style.backgroundColor = "red";
      deleteBtn.onclick = () => {
        if (confirm("Are you sure you want to delete this member?")) {
          members.splice(index, 1);
          localStorage.setItem("familyMembers", JSON.stringify(members));
          renderTable();
        }
      };

      actionCell.appendChild(editBtn);
      actionCell.appendChild(deleteBtn);

      row.appendChild(nameCell);
      row.appendChild(dobCell);
      row.appendChild(relationshipCell);
      row.appendChild(ageCell);
      row.appendChild(unitCell);
      row.appendChild(actionCell);

      tableBody.appendChild(row);
    });
  }

  renderTable();
});

// Theme toggle functionality
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const btn = document.getElementById("themeDropdownBtn");
  const dropdown = document.getElementById("themeDropdown");
  const icon = btn.querySelector(".selected-theme-icon");
  const label = btn.querySelector(".selected-theme-text");

  const themes = {
    system: ["🌐", "System Mode"],
    light: ["🌞", "Light Mode"],
    dark: ["⏾", "Dark Mode"],
  };

  let currentTheme = localStorage.getItem("themeMode") || "system";

  const applyTheme = (mode) => {
    body.classList.toggle(
      "dark",
      mode === "dark" ||
        (mode === "system" &&
          matchMedia("(prefers-color-scheme: dark)").matches)
    );
    [icon.textContent, label.textContent] = themes[mode];
    localStorage.setItem("themeMode", mode);
  };

  applyTheme(currentTheme);

  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (currentTheme === "system") applyTheme("system");
  });

  btn.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent bubbling to document
    dropdown.classList.toggle("hidden");
    btn.setAttribute("aria-expanded", !dropdown.classList.contains("hidden"));
  });

  dropdown.addEventListener("click", ({ target }) => {
    const mode = target.dataset.theme;
    if (mode) {
      currentTheme = mode;
      applyTheme(mode);
      dropdown.classList.add("hidden");
      btn.setAttribute("aria-expanded", "false");
    }
  });

  // 🔻 Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add("hidden");
      btn.setAttribute("aria-expanded", "false");
    }
  });
});

// Share functionality for the table data
document.addEventListener("DOMContentLoaded", () => {
  const shareBtn = document.getElementById("shareBtn");

  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      // Get table data: name, dob, age, days only
      const rows = Array.from(document.querySelectorAll("#dataTable tbody tr"));
      let tableText = "Family Members (Name, DOB, Age, Days):\n\n";

      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 5) {
          const name = cells[0].innerText.trim();
          const dob = cells[1].innerText.trim();
          const age = cells[3].innerText.trim();
          // Get days from the units list (4th <li>)
          const daysLi = cells[4].querySelectorAll("li")[3];
          const days = daysLi ? daysLi.innerText.trim() : "";
          // Each member's data on a new line
          tableText += `Name: ${name}\nDOB: ${dob}\nAge: ${age}\nDays: ${days}\n\n`;
        }
      });

      if (tableText.trim() === "Family Members (Name, DOB, Age, Days):") {
        tableText += "\n(No members to share)";
      }

      try {
        if (navigator.share) {
          await navigator.share({
            title: "Family Age Table",
            text: tableText,
          });
        } else {
          await navigator.clipboard.writeText(tableText);
          alert("Table copied to clipboard! Paste it anywhere.");
        }
      } catch (err) {
        alert("Sharing failed or not supported.");
        console.error(err);
      }
    });
  }
});
