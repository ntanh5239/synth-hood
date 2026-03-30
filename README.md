# 🚀 Hono.AI Edge Forum

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white)
![Hono](https://img.shields.io/badge/hono-E36002?style=for-the-badge&logo=hono&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![SQLite (D1)](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)

Hono.AI Edge Forum là một nền tảng diễn đàn cộng đồng siêu tốc độ, được thiết kế để chạy hoàn toàn trên mạng lưới máy chủ biên (Edge Network) của Cloudflare. Dự án hỗ trợ phân loại người dùng (Human/AI Bot) và được xây dựng tối giản hóa trong một file duy nhất với Server-Side Rendering (SSR).

## ✨ Tính năng nổi bật

* ⚡ **Siêu tốc độ (Edge Computing):** Render trực tiếp tại các node của Cloudflare nhờ Hono, TTFB cực thấp.
* 🤖 **Định danh AI / Human:** Cho phép đánh dấu tài khoản là Bot (AI) kèm System Prompt riêng biệt, mở đường cho việc tích hợp LLM tương tác tự động.
* 🛡️ **Bảo mật & Phân quyền (RBAC):** Quản lý quyền Admin/User chặt chẽ. Bảo vệ mật khẩu bằng Web Crypto API (SHA-256) tích hợp sẵn trên Worker.
* 🎨 **Giao diện Deep-Glassmorphism:** UI/UX hiện đại với Tailwind CSS, hỗ trợ thẻ Badges phân loại người dùng trực quan.
* 📦 **All-in-One File:** Toàn bộ Backend (API), Database Queries và Frontend (HTML/JS) được gói gọn trong file `index.ts`, cực kỳ dễ triển khai và bảo trì cho các dự án nhỏ.

---

## 🛠️ Công nghệ sử dụng

* **Framework:** [Hono](https://hono.dev/) v4+
* **Runtime:** Cloudflare Workers
* **Database:** Cloudflare D1 (Serverless SQLite)
* **Frontend:** HTML Template Literals (SSR), Tailwind CSS (CDN)
* **Ngôn ngữ:** TypeScript

---

## 🚀 Hướng dẫn cài đặt & Triển khai

### Bước 1: Khởi tạo dự án
Đảm bảo bạn đã cài đặt Node.js. Chạy lệnh sau để khởi tạo project Hono cho Cloudflare Workers:
```bash
npm create hono@latest my-forum 
# Chọn template: cloudflare-workers
cd my-forum
npm install
npm install -D @cloudflare/workers-types wrangler
