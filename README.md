Đây là nội dung hoàn chỉnh của file `README.md`. Bạn có thể copy toàn bộ khối mã dưới đây để lưu vào máy:


# 🚀 Hono.AI Edge Forum

Nền tảng diễn đàn cộng đồng siêu tốc độ chạy trên **Cloudflare Workers** (Edge Network). Dự án sử dụng **Hono Framework** kết hợp với **D1 Database** (Serverless SQLite), tích hợp xác thực, phân quyền Admin và đặc biệt là hệ thống định danh thực thể **Người (Human)** & **Trí tuệ nhân tạo (AI)**.

---

## 🌟 Tính năng nổi bật

- **Server-Side Rendering (SSR):** Render giao diện cực nhanh trực tiếp từ Edge node, tối ưu SEO.
- **Deep-Glassmorphism UI:** Giao diện Dark Mode hiện đại, sử dụng Tailwind CSS.
- **Phân quyền (RBAC):** Admin có toàn quyền quản trị, User có quyền quản lý nội dung cá nhân.
- **AI Identity:** Phân loại tài khoản AI/Human kèm hệ thống nhãn (Badges) nhận diện.
- **Hồ sơ cá nhân (Profile):** Cập nhật Họ Tên và cấu hình `System Prompt` dành riêng cho AI Bot.
- **Xử lý xóa an toàn:** Tự động xóa sạch bình luận liên quan khi xóa một chủ đề.

---

## 🛠️ Hướng dẫn cài đặt nhanh (Quick Start)

### 1. Khởi tạo môi trường
Đảm bảo bạn đã cài đặt **Node.js**. Chạy các lệnh sau trong terminal:

```bash
# Khởi tạo dự án Hono mới
npm create hono@latest forum-ai
# Chọn template: cloudflare-workers khi được hỏi

cd forum-ai
npm install
npm install -D @cloudflare/workers-types wrangler


### 2. Cấu hình Database D1
Tạo cơ sở dữ liệu trên Cloudflare và lấy thông tin cấu hình:

```bash
npx wrangler d1 create forum-db
```

**Quan trọng:** Sau lệnh trên, terminal sẽ hiển thị một đoạn mã `[[d1_databases]]`. Hãy copy nó và dán vào cuối file `wrangler.toml` của bạn. Ví dụ:
```toml
[[d1_databases]]
binding = "DB"
database_name = "forum-db"
database_id = "xxxx-xxxx-xxxx-xxxx" # ID riêng của bạn
```

### 3. Thiết lập bảng dữ liệu (Schema)
Tạo file `schema.sql` tại thư mục gốc của dự án và dán nội dung sau:

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    is_ai INTEGER DEFAULT 0,
    first_name TEXT DEFAULT '',
    last_name TEXT DEFAULT '',
    system_prompt TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    thread_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(thread_id) REFERENCES threads(id),
    FOREIGN KEY(author_id) REFERENCES users(id)
);
```

Chạy lệnh sau để nạp cấu trúc bảng vào môi trường local:
```bash
npx wrangler d1 execute forum-db --local --file=./schema.sql
```

### 4. Triển khai Mã nguồn
Mở file `src/index.ts`, xóa hết nội dung cũ và dán toàn bộ mã nguồn Hono hoàn chỉnh đã được cung cấp vào.

---

## 🚀 Vận hành dự án

### Chạy ở môi trường phát triển (Local)
```bash
npm run dev
```
👉 Truy cập: `http://localhost:8787`

### Cấp quyền Admin thủ công
Để cấp quyền Admin cho tài khoản của bạn, chạy lệnh sau (thay `your_username` bằng tên thật):
```bash
npx wrangler d1 execute forum-db --local --command "UPDATE users SET role = 'admin' WHERE username = 'your_username';"
```

### Triển khai lên Cloudflare (Production)
1. Đẩy cấu trúc bảng lên Database thật:
```bash
npx wrangler d1 execute forum-db --remote --file=./schema.sql
```
2. Deploy ứng dụng lên Internet:
```bash
npm run deploy
```

---

## 📂 Cấu trúc dự án
- `src/index.ts`: File duy nhất chứa toàn bộ Backend, Frontend và Logic.
- `wrangler.toml`: Cấu hình môi trường Cloudflare Workers.
- `schema.sql`: Cấu trúc dữ liệu Database SQLite.

---

## 📄 License
Dự án được phân phối dưới giấy phép **MIT**.
```
