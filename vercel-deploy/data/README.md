# Data Katalog

File JSON di folder ini adalah sumber untuk produk dan ulasan contoh.

- `products.json`: produk contoh. Setiap produk wajib memiliki `id`, `name`, `category`, `price`, `stock`, `sellerName`, `sellerPhone`, `description`, `photos`, dan `createdAt`.
- `reviews.json`: ulasan contoh. Setiap ulasan wajib memiliki `id`, `sellerPhone`, `author`, `rating` (1-5), `comment`, dan `createdAt`.
- `demo-accounts.json`: akun login contoh. Kredensial di dalamnya bersifat publik dan hanya untuk demo.

Produk dan ulasan contoh diimpor otomatis saat aplikasi dibuka. Perubahan pada ID `seed-*` atau `review-[angka]` akan disinkronkan ke IndexedDB saat muat ulang; hapus record dari JSON untuk menghapus data contohnya. Produk seller memakai ID `product-*` dan tidak ditimpa oleh impor katalog.

Akun demo dibuat jika email-nya belum ada di IndexedDB. Mengubah password di `demo-accounts.json` tidak mengganti password yang sudah tersimpan; hapus akun demo terkait dari IndexedDB bila perlu membuat ulang akun dengan password baru.

## Data kolaborasi X TKJ1 dan X RPL
Produk pada `products.json` diisi dari data Markdown kelompok. Beberapa harga yang kosong di Markdown dilengkapi memakai harga pembanding dari sumber online dan ditandai pada field `sourceNote`.
