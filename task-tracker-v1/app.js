const STORAGE_KEY = "task-tracker-v1";

function muatPenyimpanan() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return [
    { id: 1, judul: "Lab 10 event delegation", matkul: "Pemrograman Web", deadline: "2026-10-08", selesai: false },
    { id: 2, judul: "ERD sistem perpustakaan", matkul: "Basis Data", deadline: "2026-10-12", selesai: true }
  ];
}

function simpanPenyimpanan() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tugas));
  } catch (e) {}
}

let tugas = muatPenyimpanan();
let nextId = tugas.reduce((m, t) => Math.max(m, t.id), 0) + 1;
let filter = "semua";

const list = document.querySelector("#list");
const counter = document.querySelector("#counter");
const form = document.querySelector("#form");
const err = document.querySelector("#err");
const filterEl = document.querySelector("#filter");

function render() {
  const data = tugas
    .filter(t => filter === "semua" || (filter === "aktif" ? !t.selesai : t.selesai))
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  list.innerHTML = "";
  if (!data.length) {
    list.innerHTML = '<li class="kosong">Tidak ada tugas di sini 🎉</li>';
  }
  data.forEach(t => {
    const li = document.createElement("li");
    li.dataset.id = t.id;
    if (t.selesai) {
      li.classList.add("done");
    }
    li.innerHTML = '<input type="checkbox" class="cek"><div class="isi"><div class="judul"></div><div class="meta"></div></div><button type="button" class="hapus">✕</button>';
    li.querySelector(".cek").checked = t.selesai;
    li.querySelector(".judul").textContent = t.judul;
    li.querySelector(".meta").textContent = t.matkul + " · deadline " + t.deadline;
    list.append(li);
  });
  const aktif = tugas.filter(t => !t.selesai).length;
  counter.textContent = aktif + " tugas aktif";
  simpanPenyimpanan();
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const judul = form.elements.judul.value.trim();
  const deadline = form.elements.deadline.value;
  if (judul.length < 3) {
    err.textContent = "Judul minimal 3 karakter.";
    return;
  }
  if (!deadline) {
    err.textContent = "Deadline wajib diisi.";
    return;
  }
  err.textContent = "";
  tugas.push({
    id: nextId++,
    judul,
    matkul: form.elements.matkul.value,
    deadline,
    selesai: false
  });
  form.reset();
  render();
});

list.addEventListener("click", e => {
  const li = e.target.closest("li[data-id]");
  if (!li) return;
  const id = Number(li.dataset.id);
  if (e.target.closest(".hapus")) {
    tugas = tugas.filter(t => t.id !== id);
  } else if (e.target.closest(".cek")) {
    tugas = tugas.map(t => t.id === id ? { ...t, selesai: !t.selesai } : t);
  } else {
    return;
  }
  render();
});

filterEl.addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  filter = b.dataset.f;
  filterEl.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
  render();
});

render();
