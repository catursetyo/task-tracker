const state = { status: "loading", tugas: [], error: null, filter: "semua" };
const form = document.querySelector("#form");
const list = document.querySelector("#list");
const info = document.querySelector("#info");

async function api(url, opsi) {
  opsi = opsi || {};
  const init = { method: opsi.method || "GET" };
  if (opsi.body) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(opsi.body);
  }
  const res = await fetch(url, init);
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error || "HTTP " + res.status);
  }
  return res.status === 204 ? null : res.json();
}

function render() {
  const aktif = state.tugas.filter(t => !t.selesai).length;
  document.querySelector("#counter").textContent = state.status === "success" ? aktif + " tugas aktif" : "";
  info.className = "info";
  info.textContent = "";
  list.innerHTML = "";

  if (state.status === "loading") {
    info.textContent = "⏳ Memuat tugas dari server…";
    list.innerHTML = '<li class="skel"></li><li class="skel"></li><li class="skel"></li>';
    return;
  }

  if (state.status === "error") {
    info.className = "info err2";
    info.textContent = "Gagal memuat: " + state.error;
    const b = document.createElement("button");
    b.id = "ulang";
    b.type = "button";
    b.textContent = "↻ Coba lagi";
    info.append(b);
    return;
  }

  const data = state.tugas
    .filter(t => state.filter === "semua" || (state.filter === "aktif" ? !t.selesai : t.selesai))
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

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
}

async function muat() {
  state.status = "loading";
  render();
  try {
    const [tugas, matkul] = await Promise.all([api("/api/tugas"), api("/api/matkul")]);
    state.tugas = tugas;
    form.elements.matkul.innerHTML = "";
    matkul.forEach(m => form.elements.matkul.append(new Option(m.nama, m.nama)));
    state.status = "success";
  } catch (e) {
    state.status = "error";
    state.error = e.message;
  }
  render();
}

info.addEventListener("click", e => {
  if (e.target.id === "ulang") muat();
});

document.querySelector("#filter").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  state.filter = b.dataset.f;
  document.querySelectorAll("#filter button").forEach(x => x.classList.toggle("on", x === b));
  render();
});

muat();
