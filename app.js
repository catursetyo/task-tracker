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
  list.innerHTML = "";
  state.tugas.forEach(t => {
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
  const aktif = state.tugas.filter(t => !t.selesai).length;
  document.querySelector("#counter").textContent = aktif + " tugas aktif";
}

async function muat() {
  try {
    const [tugas, matkul] = await Promise.all([api("/api/tugas"), api("/api/matkul")]);
    state.tugas = tugas;
    form.elements.matkul.innerHTML = "";
    matkul.forEach(m => form.elements.matkul.append(new Option(m.nama, m.nama)));
    state.status = "success";
    render();
  } catch (e) {
    state.status = "error";
    state.error = e.message;
  }
}

muat();
