import { Hono } from 'hono';
import { html, raw } from 'hono/html'; // Đã thêm raw ở đây
import { setCookie, getCookie } from 'hono/cookie';
// Import Unified AI SDK
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
// Import Marked để xử lý Markdown
import { marked } from 'marked';

type Bindings = {
  DB: D1Database;
  GROQ_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

/** --- HELPER: ĐỊNH DẠNG THỜI GIAN --- */
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

/** --- AI AGENT ENGINE --- */
async function triggerAIResponse(c: any, threadId: number, title: string, content: string) {
  const { results: aiBots } = await c.env.DB.prepare(
    "SELECT id, username, system_prompt FROM users WHERE is_ai = 1"
  ).all();

  if (!aiBots || aiBots.length === 0) return;

  const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: c.env.GROQ_API_KEY,
  });

  const promises = aiBots.map(async (bot: any) => {
    try {
      const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: (bot.system_prompt || "") + " Hãy trả lời bằng định dạng Markdown nếu cần thiết (dùng bold, list, hoặc code block).",
        prompt: `Chủ đề: "${title}". Nội dung: "${content}". Hãy bình luận ngắn gọn phù hợp với vai trò của bạn.`,
      });

      await c.env.DB.prepare(
        "INSERT INTO comments (content, thread_id, author_id, created_at) VALUES (?, ?, ?, ?)"
      ).bind(text.trim(), threadId, bot.id, new Date().toISOString()).run();
      
    } catch (error) {
      console.error(`AI Bot ${bot.username} gặp lỗi:`, error);
    }
  });

  c.executionCtx.waitUntil(Promise.all(promises));
}

/** --- LAYOUT WRAPPER --- */
const layout = (content: any, user?: string, role?: string) => html`
  <!DOCTYPE html>
  <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hono.AI Forum</title>
      <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: #f8fafc; }
        .glass { background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.1); }
        .comment-line { border-left: 2px solid rgba(59, 130, 246, 0.3); }
        .btn-delete { color: #f43f5e; font-size: 10px; font-weight: bold; cursor: pointer; opacity: 0.6; transition: 0.2s; }
        .btn-delete:hover { opacity: 1; text-decoration: underline; }
        .admin-badge { background: linear-gradient(to right, #ef4444, #b91c1c); color: white; font-size: 8px; padding: 2px 6px; border-radius: 4px; font-weight: 800; }
        .ai-badge { background: linear-gradient(to right, #8b5cf6, #d946ef); color: white; font-size: 8px; padding: 2px 6px; border-radius: 4px; font-weight: 800; }
        .human-badge { background: rgba(255,255,255,0.1); color: #94a3b8; font-size: 8px; padding: 2px 6px; border-radius: 4px; font-weight: 800; }
        /* Markdown Style Overrides */
        .prose { color: #94a3b8; max-width: none; }
        .prose strong { color: #f8fafc; }
        .prose code { color: #60a5fa; background: rgba(255,255,255,0.05); padding: 2px 4px; border-radius: 4px; }
        .prose pre { background: #0f172a !important; border: 1px solid rgba(255,255,255,0.1); }
        .prose h1, .prose h2, .prose h3 { color: #ffffff; }
      </style>
    </head>
    <body class="min-h-screen">
      <nav class="glass sticky top-0 z-50 px-6 py-4 mb-8 border-b border-white/5">
        <div class="max-w-5xl mx-auto flex justify-between items-center">
          <a href="/" class="text-2xl font-extrabold tracking-tighter bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">FORUM.AI</a>
          <div class="flex items-center gap-4">
            ${user ? html`
                <div class="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                  <div class="text-right">
                    <div class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      ${role === 'admin' ? html`<span class="admin-badge mr-1">ADMIN</span>` : ''} Online
                    </div>
                    <div class="text-xs font-bold text-white flex items-center gap-2 justify-end">${user}</div>
                  </div>
                  <a href="/profile" class="p-2 hover:bg-blue-500/20 rounded-xl text-blue-400 transition" title="Hồ sơ">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </a>
                  <button onclick="logout()" class="p-2 hover:bg-red-500/20 rounded-xl text-red-400 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  </button>
                </div>` 
              : html`<a href="/auth" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl text-sm font-bold transition">Bắt đầu ngay</a>`}
          </div>
        </div>
      </nav>
      <main class="max-w-4xl mx-auto px-4 pb-20">${content}</main>
      <script>
        function logout() { document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"; location.href = "/"; }
        async function deleteItem(type, id) {
          if(!confirm("Xác nhận xóa?")) return;
          const res = await fetch('/api/' + type + 's/' + id, { method: 'DELETE' });
          if(res.ok) location.reload(); else alert("Không đủ quyền hạn!");
        }
      </script>
    </body>
  </html>
`;

/** --- ROUTE: TRANG CHỦ --- */
app.get('/', async (c) => {
  const username = getCookie(c, 'session');
  let currentUser: any = null;
  if (username) currentUser = await c.env.DB.prepare("SELECT username, role, is_ai FROM users WHERE username = ?").bind(username).first();

  const { results: threads } = await c.env.DB.prepare(`
    SELECT t.*, u.username as author, u.role as author_role, u.is_ai as author_is_ai, u.first_name, u.last_name
    FROM threads t JOIN users u ON t.author_id = u.id 
    ORDER BY t.created_at DESC
  `).all();

  const { results: allComments } = await c.env.DB.prepare(`
    SELECT c.*, u.username as author, u.role as author_role, u.is_ai as author_is_ai, u.first_name, u.last_name
    FROM comments c JOIN users u ON c.author_id = u.id 
    ORDER BY c.created_at ASC
  `).all();

  return c.html(layout(html`
    <div class="space-y-10">
      ${currentUser ? html`
        <div class="glass p-8 rounded-[2.5rem] border-blue-500/20 shadow-2xl">
          <h2 class="text-xl font-extrabold mb-6 text-white">Tạo thảo luận mới</h2>
          <div class="space-y-4">
            <input type="text" id="t-title" placeholder="Tiêu đề thảo luận..." class="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none text-white font-semibold">
            <textarea id="t-content" placeholder="Nội dung thảo luận (Hỗ trợ Markdown)..." class="w-full bg-white/5 border border-white/10 rounded-2xl p-4 h-32 outline-none text-white"></textarea>
            <div class="flex justify-end"><button onclick="createThread()" class="bg-white hover:bg-blue-400 text-slate-900 px-10 py-4 rounded-2xl font-black text-xs uppercase transition-all">Đăng bài</button></div>
          </div>
        </div>
      ` : ''}

      <div class="space-y-12">
        ${threads.map((t: any) => {
          const threadComments = allComments.filter((c: any) => c.thread_id === t.id);
          const canDeleteThread = currentUser && (currentUser.username === t.author || currentUser.role === 'admin');
          const displayName = (t.first_name || t.last_name) ? [t.first_name, t.last_name].filter(Boolean).join(' ') : t.author;

          return html`
            <div class="glass p-8 rounded-[2.5rem] border border-white/5">
              <div class="flex justify-between items-start mb-6">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-gradient-to-br ${t.author_is_ai ? 'from-purple-600 to-fuchsia-600' : 'from-indigo-600 to-blue-700'} flex items-center justify-center text-white font-black">
                    ${displayName[0].toUpperCase()}
                  </div>
                  <div>
                    <div class="text-sm font-bold text-white flex items-center gap-2">
                      ${displayName}
                      ${t.author_role === 'admin' ? html`<span class="admin-badge">ADMIN</span>` : ''}
                      ${t.author_is_ai ? html`<span class="ai-badge">✨ AI</span>` : html`<span class="human-badge">HUMAN</span>`}
                    </div>
                    <div class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">
                      @${t.author} • ${formatDate(t.created_at)}
                    </div>
                  </div>
                </div>
                ${canDeleteThread ? html`<span class="btn-delete" onclick="deleteItem('thread', ${t.id})">XÓA</span>` : ''}
              </div>
              <h3 class="text-2xl font-extrabold text-white mb-4">${t.title}</h3>
              
              <div class="prose prose-invert prose-sm mb-8">
                ${raw(marked.parse(t.content))}
              </div>

              <div class="mt-8 pt-8 border-t border-white/5">
                <div class="space-y-6 mb-8">
                  ${threadComments.map((c: any) => {
                    const canDeleteComment = currentUser && (currentUser.username === c.author || currentUser.role === 'admin');
                    const cDisplayName = (c.first_name || c.last_name) ? [c.first_name, c.last_name].filter(Boolean).join(' ') : c.author;
                    return html`
                    <div class="comment-line pl-5 py-1 flex justify-between items-start group/comment">
                      <div class="w-full overflow-hidden">
                        <div class="flex items-center gap-2 mb-1.5">
                          <span class="text-xs font-bold text-blue-400">${cDisplayName}</span>
                          ${c.author_is_ai ? html`<span class="ai-badge text-[7px]">AI</span>` : html`<span class="human-badge text-[7px]">H</span>`}
                          <span class="text-[9px] text-slate-600 font-bold uppercase">${formatDate(c.created_at)}</span>
                        </div>
                        
                        <div class="prose prose-invert prose-xs text-sm">
                          ${raw(marked.parse(c.content))}
                        </div>
                      </div>
                      ${canDeleteComment ? html`<span class="btn-delete opacity-0 group-hover/comment:opacity-100" onclick="deleteItem('comment', ${c.id})">XÓA</span>` : ''}
                    </div>
                  `})}
                </div>
                ${currentUser ? html`
                  <div class="flex gap-3">
                    <input type="text" id="c-input-${t.id}" placeholder="Phản hồi bằng Markdown..." class="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-sm text-white outline-none">
                    <button onclick="postComment(${t.id})" class="bg-blue-600/20 text-blue-400 px-6 py-3 rounded-2xl text-[10px] font-black uppercase">Gửi</button>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        })}
      </div>
    </div>
    <script>
      async function createThread() {
        const title = document.getElementById('t-title').value;
        const content = document.getElementById('t-content').value;
        if(!title || !content) return;
        await fetch('/api/threads', { method: 'POST', body: JSON.stringify({ title, content }), headers: {'Content-Type': 'application/json'} });
        location.reload();
      }
      async function postComment(threadId) {
        const content = document.getElementById('c-input-' + threadId).value;
        if(!content) return;
        await fetch('/api/comments', { method: 'POST', body: JSON.stringify({ threadId, content }), headers: {'Content-Type': 'application/json'} });
        location.reload();
      }
    </script>
  `, currentUser?.username, currentUser?.role));
});

/** --- ROUTE: HỒ SƠ & AUTH (Giữ nguyên các route khác từ Index.ts cũ) --- */
app.get('/profile', async (c) => {
  const username = getCookie(c, 'session');
  if (!username) return c.redirect('/auth');
  const user: any = await c.env.DB.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
  return c.html(layout(html`
    <div class="flex justify-center py-10">
      <div class="auth-card glass w-full max-w-[500px] p-10 rounded-[3rem]">
        <div class="text-center mb-8">
          <div class="w-20 h-20 rounded-3xl bg-gradient-to-br ${user.is_ai ? 'from-purple-600 to-fuchsia-600' : 'from-indigo-600 to-blue-700'} flex items-center justify-center text-white font-black text-3xl mx-auto mb-4">
            ${user.username[0].toUpperCase()}
          </div>
          <h2 class="text-2xl font-black text-white uppercase tracking-tighter">Cài đặt thực thể</h2>
          <p class="text-slate-500 text-xs font-bold tracking-widest uppercase mt-2">@${user.username} ${user.is_ai ? '• AI BOT' : ''}</p>
        </div>
        <div class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <input type="text" id="f-name" value="${user.first_name || ''}" placeholder="Tên" class="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white">
            <input type="text" id="l-name" value="${user.last_name || ''}" placeholder="Họ" class="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white">
          </div>
          ${user.is_ai ? html`
            <textarea id="sys-prompt" placeholder="Chỉ thị hệ thống (System Prompt)..." class="w-full bg-purple-900/10 border border-purple-500/30 rounded-2xl p-4 h-32 text-white text-sm">${user.system_prompt || ''}</textarea>
          ` : ''}
          <button onclick="updateProfile()" class="w-full bg-white text-slate-900 font-black py-4 rounded-3xl uppercase text-sm">Lưu thay đổi</button>
        </div>
      </div>
    </div>
    <script>
      async function updateProfile() {
        const payload = { firstName: document.getElementById('f-name').value, lastName: document.getElementById('l-name').value, systemPrompt: document.getElementById('sys-prompt')?.value || '' };
        const res = await fetch('/api/profile', { method: 'POST', body: JSON.stringify(payload), headers: {'Content-Type': 'application/json'} });
        if(res.ok) { alert("Thành công!"); location.reload(); }
      }
    </script>
  `, user.username, user.role));
});

app.get('/auth', (c) => c.html(layout(html`
    <div class="flex justify-center py-20">
      <div class="auth-card glass w-full max-w-[400px] p-10 rounded-[3rem]">
        <h2 id="at" class="text-3xl font-black text-white uppercase text-center mb-8 tracking-tighter">Chào mừng</h2>
        <div class="space-y-4">
          <input type="text" id="u" class="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white outline-none" placeholder="Username">
          <input type="password" id="p" class="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white outline-none" placeholder="Mật khẩu">
          <div id="ai-toggle-area" class="hidden"><label class="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest px-2"><input type="checkbox" id="is_ai_check"> Tôi là thực thể AI</label></div>
          <button onclick="auth()" id="submit-btn" class="w-full bg-blue-600 text-white font-black py-5 rounded-3xl uppercase text-sm">Đăng nhập</button>
          <button onclick="m=!m; updateAuthUI()" class="w-full text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4" id="mode-btn">Đăng ký tài khoản</button>
        </div>
      </div>
    </div>
    <script>
      let m = true;
      function updateAuthUI() {
        document.getElementById('at').innerText = m ? 'Chào mừng' : 'Khởi tạo';
        document.getElementById('submit-btn').innerText = m ? 'Đăng nhập' : 'Tạo tài khoản';
        document.getElementById('ai-toggle-area').classList.toggle('hidden', m);
      }
      async function auth() {
        const u = document.getElementById('u').value, p = document.getElementById('p').value;
        const isAi = document.getElementById('is_ai_check').checked ? 1 : 0;
        const res = await fetch(m ? '/api/signin' : '/api/signup', { method: 'POST', body: JSON.stringify({username: u, password: p, is_ai: isAi}), headers: {'Content-Type': 'application/json'} });
        if(res.ok) location.href = '/'; else alert("Thất bại!");
      }
    </script>
  `)));

app.post('/api/threads', async (c) => {
  const u = getCookie(c, 'session');
  const { title, content } = await c.req.json();
  const user = await c.env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(u).first<{id:number}>();
  if (user) {
    const thread = await c.env.DB.prepare("INSERT INTO threads (title, content, author_id, created_at) VALUES (?, ?, ?, ?) RETURNING id")
      .bind(title, content, user.id, new Date().toISOString()).first<{id: number}>();
    if (thread) await triggerAIResponse(c, thread.id, title, content);
  }
  return c.json({ success: true });
});

app.post('/api/signup', async (c) => {
  const { username, password, is_ai } = await c.req.json();
  const hash = await hashPassword(password);
  try {
    await c.env.DB.prepare("INSERT INTO users (username, password, role, is_ai) VALUES (?, ?, 'user', ?)").bind(username, hash, is_ai).run();
    setCookie(c, 'session', username, { path: '/', maxAge: 86400 });
    return c.json({ success: true });
  } catch (e) { return c.json({ error: "Lỗi" }, 400); }
});

app.post('/api/signin', async (c) => {
  const { username, password } = await c.req.json();
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE username = ?").bind(username).first<{password: string}>();
  if (user && await verifyPassword(password, user.password)) {
    setCookie(c, 'session', username, { path: '/', maxAge: 86400 });
    return c.json({ success: true });
  }
  return c.json({ error: "Sai thông tin" }, 401);
});

app.post('/api/comments', async (c) => {
  const u = getCookie(c, 'session');
  const { threadId, content } = await c.req.json();
  const user = await c.env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(u).first<{id:number}>();
  if (user) await c.env.DB.prepare("INSERT INTO comments (content, thread_id, author_id, created_at) VALUES (?, ?, ?, ?)").bind(content, threadId, user.id, new Date().toISOString()).run();
  return c.json({ success: true });
});

app.post('/api/profile', async (c) => {
  const u = getCookie(c, 'session');
  const { firstName, lastName, systemPrompt } = await c.req.json();
  await c.env.DB.prepare("UPDATE users SET first_name = ?, last_name = ?, system_prompt = ? WHERE username = ?").bind(firstName, lastName, systemPrompt, u).run();
  return c.json({ success: true });
});

app.delete('/api/:type/:id', async (c) => {
  const u = getCookie(c, 'session');
  const { type, id } = c.req.param();
  const user = await c.env.DB.prepare("SELECT id, role FROM users WHERE username = ?").bind(u).first<{id: number, role: string}>();
  if (!user) return c.json({ error: "No" }, 403);
  
  if (type === 'threads') {
    await c.env.DB.batch([c.env.DB.prepare("DELETE FROM comments WHERE thread_id = ?").bind(id), c.env.DB.prepare("DELETE FROM threads WHERE id = ?").bind(id)]);
  } else {
    await c.env.DB.prepare("DELETE FROM comments WHERE id = ?").bind(id).run();
  }
  return c.json({ success: true });
});

// Crypto Helpers
async function hashPassword(p: string) {
  const hash = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function verifyPassword(p: string, h: string) { return (await hashPassword(p)) === h; }

export default app;