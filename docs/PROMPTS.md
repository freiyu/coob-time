# CubeTime — Prompt Cheat Sheet (for OpenCode)

Use one phase per session. Open a fresh session per phase; AGENTS.md and docs/CODEMAP.md carry the context.
The PRD's own phase prompts are in PRD_CUBETIME.md Section 14. These versions add the agent workflow.
Pattern for every phase: [plan agent] ask for a short plan → approve → [build agent] do the phase → review → approve or revise.

## Phase 1 — Validate and plan
Plan agent:
```text
Baca PRD_CUBETIME.md sampai habis (sekali ini saja). Jangan implementasi apa pun.
Validasi stack, terutama dukungan library scramble untuk 2x2, 3x3, 4x4, 5x5, 6x6, 7x7, Megaminx, Square-1, Pyraminx, dan Skewb.
Beri rencana implementasi singkat, risiko teknis, arsitektur komponen dan data, dan daftar acceptance test.
```
Build agent (hanya untuk scratch/spike kalau perlu membuktikan library):
```text
Kerjakan Phase 1 saja. Buat tabel dukungan scramble per puzzle (fungsi library, gaya output, status verified atau tidak)
dan jalankan spike kecil untuk membuktikannya. Kalau ada puzzle yang tidak didukung, berhenti dan tanya aku. Jangan bangun aplikasinya.
```

## Phase 2 — Prototype
```text
Phase 1 acc. Kerjakan Phase 2 saja: prototype visual dengan data contoh yang realistis.
Fokus: layout timer, selector puzzle, panel scramble, sesi/riwayat, kartu statistik, tema dark dan light.
Ikuti docs/DESIGN.md. Jangan klaim timer, scramble, atau penyimpanan sudah berfungsi.
Jalankan @tester, @reviewer, @anti-slop, lalu laporan phase dan berhenti.
```

## Phase 3 — Frontend
```text
Prototype acc. Kerjakan Phase 3 saja: implementasi UI di Next.js, TypeScript, dan Tailwind.
Logika timer, scramble, statistik, dan storage ada di belakang interface yang jelas dan belum diisi.
Jalankan lint dan typecheck, lalu @tester, @reviewer, @anti-slop, laporan phase, dan berhenti.
```

## Phase 4 — Timer and scramble engine
```text
Frontend acc. Kerjakan Phase 4 saja: timer engine pakai performance.now(), kontrol keyboard dan sentuh, penalti,
dan adapter scramble per puzzle yang terverifikasi. Tes semua puzzle yang diminta. Jangan memalsukan scramble.
Dokumentasikan keterbatasan library. Jalankan checks phase ini, lalu laporan dan berhenti.
```

## Phase 5 — Local persistence and portability
```text
Phase 4 acc. Kerjakan Phase 5 saja: persistensi IndexedDB untuk solve, sesi, dan pengaturan, plus backup JSON berversi,
import dengan validasi Zod dan preview, dan ekspor CSV. Tes persistensi setelah refresh dan penanganan konflik.
Jangan tambah database remote atau autentikasi. Laporan dan berhenti.
```

## Phase 6 — Statistics and integration
```text
Phase 5 acc. Kerjakan Phase 6 saja: best single, mean, Ao5, Ao12, penalti, dan grafik tren.
Statistik hanya per puzzle dan sesi, dengan aturan DNF yang terdokumentasi dan tes untuk edge case.
Integrasikan semua fitur yang sudah di-acc. Laporan dan berhenti.
```

## Phase 7 — Verification and bug fixing
```text
Phase 6 acc. Kerjakan Phase 7 saja sebagai verifier independen: lint, typecheck, unit test, E2E, dan production build.
Uji alur keyboard dan sentuh, scramble setiap puzzle, DNF dan +2, persistensi setelah refresh, import dan ekspor backup,
UI responsif, dan dasar aksesibilitas. Perbaiki bug yang bisa direproduksi dalam scope, ulangi check yang gagal,
dan laporkan buktinya. Jangan deploy.
```
Optional TestSprite (aktifkan dulu `enabled: true` di opencode.json dan set `TESTSPRITE_API_KEY`):
```text
Panggil @testsprite-runner untuk tes frontend. Fokus ke alur: mulai dan hentikan solve, riwayat, DNF dan +2, sesi, tema setelah refresh, dan backup.
```

## Phase 8 — Deploy
```text
Aplikasi sudah acc. Kerjakan Phase 8 saja: siapkan repo GitHub, pastikan production build lolos, dan tulis README
(setup, tes, deploy, perilaku data lokal, rekomendasi backup). Jangan jalankan perintah vercel; aku yang import repo di Vercel.
Setelah aku bilang sudah deploy, smoke-test URL live dan laporkan hanya hasil yang benar-benar diamati.
```

## Prompt di luar jalur
Revisi di phase yang sama:
```text
Masih Phase 3. Ubah panel scramble: teks lebih besar di mobile dan tombol New Scramble dan Copy Scramble pakai label teks. Jangan ubah yang lain.
```
Batasi scope:
```text
Kerjakan Phase 4 hanya untuk 3x3 dan 2x2 dulu. Puzzle lain nanti. Berhenti setelah itu.
```
Balik ke phase sebelumnya:
```text
Balik ke Phase 3. Sebelum mengubah apa pun, sebutkan pekerjaan di phase 4 dan 5 yang akan terdampak.
```
Agent melebar:
```text
Stop. Kamu keluar dari scope Phase N. Kembalikan perubahan di luar scope, lalu laporkan apa yang kamu ubah.
```
Acc dan catat nilai (agar project-manager mengisi REVIEW-LOG):
```text
Phase 3 acc. Skor: Visual 4, Mobile 3, Aksesibilitas 4. Catatan: scramble 6x6 terpotong di layar sempit. Lanjut Phase 4.
```
