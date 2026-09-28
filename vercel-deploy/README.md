# Racik Rimpang - Vercel

Folder ini adalah salinan statis yang siap dijadikan root deployment Vercel. Tidak memerlukan build command atau dependency install.

Di Vercel, pilih Framework Preset `Other`, kosongkan Build Command, dan gunakan `.` sebagai Output Directory. Semua halaman memakai route folder: `/`, `/login/`, `/seller/`, dan `/admin/`.

Data produk, ulasan, dan akun demo ada di `data/`. Perubahan JSON tersedia setelah deployment selesai; importer membaca data tanpa cache dan menyinkronkan record contoh ke IndexedDB browser.

Penyimpanan akun, produk seller, cart, dan wishlist tetap lokal pada browser. Untuk data bersama lintas pengunjung, hubungkan aplikasi ke backend/database sebelum penggunaan produksi. Kredensial demo di `data/demo-accounts.json` bersifat publik.