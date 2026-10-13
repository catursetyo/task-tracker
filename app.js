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

form.addEventListener("submit", async e => {
  e.preventDefault();
  const err = document.querySelector("#err");
  const btn = document.querySelector("#simpan");
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
  btn.disabled = true;
  btn.textContent = "Menyimpan…";

  try {
    const baru = await api("/api/tugas", {
      method: "POST",
      body: { judul, matkul: form.elements.matkul.value, deadline }
    });
    state.tugas.push(baru);
    form.elements.judul.value = "";
    form.elements.deadline.value = "";
    render();
  } catch (e2) {
    err.textContent = "Gagal menyimpan: " + e2.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Tambah";
  }
});

list.addEventListener("click", async e => {
  const li = e.target.closest("li[data-id]");
  if (!li) return;
  const id = Number(li.dataset.id);
  const isHapus = e.target.closest(".hapus");
  const isCek = e.target.closest(".cek");
  if (!isHapus && !isCek) return;

  const err = document.querySelector("#err");
  err.textContent = "";
  li.classList.add("proses");

  if (isHapus) {
    const idx = state.tugas.findIndex(x => x.id === id);
    if (idx === -1) return;
    const [hapus] = state.tugas.splice(idx, 1);
    render();
    try {
      await api("/api/tugas/" + id, { method: "DELETE" });
    } catch (e2) {
      state.tugas.splice(idx, 0, hapus);
      render();
      err.textContent = "Gagal menghapus: " + e2.message;
    }
  } else if (isCek) {
    const t = state.tugas.find(x => x.id === id);
    if (!t) return;
    t.selesai = !t.selesai;
    render();
    try {
      const updated = await api("/api/tugas/" + id, {
        method: "PATCH",
        body: { selesai: t.selesai }
      });
      Object.assign(t, updated);
    } catch (e2) {
      t.selesai = !t.selesai;
      render();
      err.textContent = "Gagal memperbarui: " + e2.message;
    }
  }
});

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
