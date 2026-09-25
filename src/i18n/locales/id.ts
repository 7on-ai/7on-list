import type { Dictionary } from "../types";

export const id: Dictionary = {
  meta: {
    title: "7on ARC — Jadilah yang pertama memiliki Sunday",
    description: "7on ARC, AI ke mana pun kamu pergi. Dapatkan spesifikasi awal rumah bagi Sunday, AI Agent yang selalu aktif.",
    ogLine: "Sunday tinggal di 7on ARC.",
  },
  hero: {
    headline: ["Jadilah yang pertama", "memiliki Sunday."],
    sub: "AI pribadi yang tinggal di ARC, mesin milikmu sendiri, dan menyelesaikan berbagai hal selagi kamu menjalani harimu.",
    placeholder: "Email kamu",
    cta: "Dapatkan spesifikasi ARC",
    note: "Tanpa spam. Spesifikasinya sekarang, dan satu email lagi saat ARC-mu siap.",
  },
  form: {
    success: "Kamu sudah terdaftar. Spesifikasinya sedang dikirim ke email kamu.",
    invalid: "Email itu sepertinya tidak benar.",
    required: "Masukkan email kamu.",
    error: "Terjadi kesalahan. Silakan coba lagi.",
    sending: "Mengirim…",
    emailLabel: "Alamat email",
  },
  orbit: {
    headline: ["Satu Agent.", "Semua di sekitarmu."],
    sub: "Telepon, email, kalender, rumah, keuangan — diurus dari satu tempat.",
  },
  day: {
    eyebrow: "Hari pertamamu",
    headline: "Hari ARC-mu tiba",
    moments: [
      {
        time: "07:00",
        tag: "Fajar",
        title: "Pagi, beres",
        line: "Selamat pagi. Cerah, 24°, dan rapat jam 9 sudah pindah ke jam 10.",
      },
      {
        time: "11:30",
        tag: "Selagi kamu bekerja",
        title: "Kotak masuk, bersih",
        line: "Tiga email yang cukup dijawab “ya” sudah kubalas. Dua butuh kamu — sudah kusematkan.",
      },
      {
        time: "16:45",
        tag: "Di perjalanan",
        title: "Urusan, selesai",
        line: "Paketmu dijadwalkan ulang ke besok. Sudah masuk kalender.",
      },
      {
        time: "22:10",
        tag: "Lampu padam",
        title: "Rumah, tertidur",
        line: "Pintu terkunci, lampu mati, alarm jam 6:30. Selamat tidur.",
      },
    ],
  },
  machine: {
    tagline: "AI ke mana pun kamu pergi",
    headline: ["Sungguh milikmu."],
    body: "Sunday mengenalmu. Tidak ada yang lain. Datamu tidak pernah dipakai untuk melatih model siapa pun.",
    cta: "Dapatkan spesifikasi ARC",
  },
  prefs: {
    title: "Preferensi email",
    /* {email} is replaced with the address */
    intro: "Pilih email yang kami kirim ke {email}.",
    options: {
      updates: { label: "Kabar terbaru", description: "Sesekali kabar tentang Sunday dan ARC, plus email saat ARC-mu siap." },
      launch: { label: "Hanya peluncuran", description: "Satu email saat ARC-mu siap. Tidak ada yang lain." },
      none: { label: "Tidak ada", description: "Tidak ada email lagi dari 7on." },
    },
    current: "Saat ini",
    choose: "Pilih",
    confirm: "Ya, kabari saya",
    saved: "Tersimpan.",
    invalid: "Tautan ini tidak berfungsi. Gunakan tautan di email terbaru dari 7on.",
    back: "Kembali ke ARC",
  },
  invite: {
    invited: "Temanmu mengundangmu",
    title: "Mau dapat lebih cepat?",
    body: "Setiap teman yang mendapatkan spesifikasi lewat tautanmu akan memajukan antreanmu.",
    copy: "Salin tautan",
    copied: "Tersalin",
    share: "Bagikan",
    shareText: "Sunday tinggal di ARC. Dapatkan spesifikasinya:",
    pageTitle: "Posisimu di antrean",
    place: "Posisimu",
    friends: "Teman yang bergabung",
    how: "Saat ARC siap, kami mengirim email sesuai urutan antrean. Teman dihitung setelah email spesifikasinya sampai.",
    out: "Alamat ini sudah menonaktifkan email dari 7on, jadi tidak ada di antrean.",
    manage: "Preferensi email",
  },
  footer: "Dibuat untuk selalu menyala.",
};
