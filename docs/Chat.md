Bạn là Senior Fullstack Architect (Spring Boot + WebSocket STOMP + React Native + React-Admin) + DevOps production-ish.
Tôi cần bạn triển khai module CHAT theo 3 bước rõ ràng cho dự án e-commerce của tôi. Bạn phải trả lời bằng hướng dẫn “từng thao tác” (step-by-step) để tôi làm theo và chạy được end-to-end.
(1) Có ADMIN online:

- User ↔ Admin chat realtime qua WebSocket STOMP (không reload).
- User gửi message -> /app/chat.send
- Backend lưu DB
- Nếu session đã assigned admin và admin online -> push tới admin qua /topic/admin/{adminId}
- Admin reply -> /app/admin.send
- Backend lưu DB và broadcast về user qua /topic/session/{sessionId}

(2) KHÔNG có admin online (hoặc session chưa assigned):

- Backend fallback sang AI trả lời ngay.
- AI dùng RAG từ dữ liệu trong project (products/categories/faq/policy):
  - Retrieve topK documents (VectorStore hoặc in-memory demo)
  - Build prompt + context
  - Generate answer
- Lưu AI message vào DB
- # Broadcast về user qua /topic/session/{sessionId}
  # BỐI CẢNH STACK
- Backend: Spring Boot 3.x, Java 21, MySQL, Spring Security JWT
- Mobile: React Native (Expo) + TypeScript
- Admin: React-admin
- Realtime: WebSocket STOMP + SockJS
- AI: Step 2 dùng AI trả lời đơn giản; Step 3 nâng cấp RAG dùng Gemini

ASSUMPTIONS (nếu thiếu thì dùng mặc định):

- package backend: com.flower.manager
- port: 8080
- base API prefix: /api
- JWT: header Authorization: Bearer <token>
- roles: ROLE_ADMIN, ROLE_USER
- Product fields: id, name, description, price, category_id
- Category fields: id, name

========================
YÊU CẦU CHUNG (BẮT BUỘC)
========================

1. Bạn phải chia output thành 3 phần lớn: STEP 1, STEP 2, STEP 3.
2. Mỗi STEP phải có:
   - (A) Mục tiêu
   - (B) Kiến trúc/flow
   - (C) Danh sách file cần tạo/sửa (đường dẫn + tên file)
   - (D) Code đầy đủ để copy-paste (backend + RN + react-admin nếu có)
   - (E) Checklist thao tác chạy/test: “Step 01... Step 02...”
   - (F) Test cases (có input/output mong đợi)
3. Không hỏi lại câu nào. Nếu thiếu thông tin, ghi rõ “ASSUMPTION” và vẫn triển khai.

========================
STEP 1 — HOÀN THIỆN CHAT REALTIME CHUẨN (KHÔNG AI)
========================
MỤC TIÊU

- ✔️ chat_session
- ✔️ chat_message
- ✔️ Admin claim session
- ✔️ Admin online presence
- ✔️ Routing User → Admin realtime

YÊU CẦU TRIỂN KHAI BACKEND (STEP 1)

1. DB (MySQL)

- Tạo 2 bảng:
  chat_session(id, user_id, assigned_admin_id NULL, status OPEN/ASSIGNED/CLOSED, last_message_at, created_at)
  chat_message(id, session_id, sender_type USER/ADMIN, sender_id NULL, content TEXT, created_at, metadata JSON NULL)
- Xuất:
  - SQL migration file
  - JPA Entities + enums + repositories

2. REST APIs (STEP 1)
   USER:

- POST /api/chat/sessions
  => tạo session OPEN (nếu đã có session OPEN thì trả session đó)
- GET /api/chat/sessions/{id}/messages
  ADMIN:
- GET /api/admin/chat/sessions?status=OPEN|ASSIGNED|CLOSED
- POST /api/admin/chat/sessions/{id}/claim (set assigned_admin_id + status=ASSIGNED)
- POST /api/admin/chat/sessions/{id}/close (status=CLOSED)
- GET /api/admin/chat/sessions/{id}/messages

3. WebSocket STOMP (STEP 1)

- Endpoint: /ws (SockJS)
- App prefix: /app
- Broker: /topic, /queue
- Destinations:
  - /app/chat.send (user gửi)
  - /app/admin.send (admin gửi)
  - /topic/session/{sessionId} (broadcast chat)
  - /topic/admin/{adminId} (notify admin có message mới)

4. JWT Auth cho WebSocket CONNECT (STEP 1)

- ChannelInterceptor:
  - đọc Authorization header
  - parse JWT -> set Principal
- Validate roles:
  - chỉ user/admin auth mới connect + gửi

5. Presence admin online (STEP 1)

- AdminPresenceService: onlineAdmins Set<Long>
- Listener connect/disconnect:
  - nếu role ADMIN -> markOnline(adminId)
  - disconnect -> markOffline(adminId)

6. Routing realtime (STEP 1)

- Khi user gửi /app/chat.send:
  - save USER message
  - broadcast /topic/session/{sessionId} (USER)
  - Nếu session.assigned_admin_id != null và admin online:
    - gửi notify /topic/admin/{adminId} để admin biết có tin mới
- Khi admin gửi /app/admin.send:
  - save ADMIN message
  - broadcast /topic/session/{sessionId} (ADMIN)

YÊU CẦU FRONTEND (STEP 1)
A) React Native (User)

- Cài sockjs-client + @stomp/stompjs
- ChatScreen:
  - gọi POST /api/chat/sessions lấy sessionId
  - gọi GET messages load lịch sử
  - connect STOMP + subscribe /topic/session/{sessionId}
  - gửi message publish /app/chat.send

B) React-admin (Admin)

- LiveChat page:
  - list sessions OPEN/ASSIGNED
  - claim session
  - mở session -> subscribe /topic/session/{sessionId}
  - subscribe /topic/admin/{adminId} -> badge “new”
  - gửi message publish /app/admin.send

OUTPUT BẮT BUỘC STEP 1

- Full code skeleton + checklist thao tác chạy/test end-to-end:
  - test user gửi -> admin nhận realtime
  - test admin reply -> user nhận realtime
  - test admin offline -> user vẫn gửi được nhưng không có AI (step 1)

========================
STEP 2 — THÊM FALLBACK AI (CHƯA RAG)
========================
MỤC TIÊU

- ✔️ Khi admin offline → AI trả lời đơn giản
- ✔️ Lưu AI message vào DB
- ✔️ WebSocket push về user

YÊU CẦU TRIỂN KHAI (STEP 2)

1. Bổ sung sender_type = AI trong chat_message enum
2. AiResponderService:

- Nếu admin offline hoặc session chưa assigned:
  - gọi aiResponder.replySimple(userText)
  - trả về câu trả lời ngắn theo template (rule-based hoặc gọi model đơn giản)

3. Routing:

- Trong handleIncomingUserMessage:
  - nếu không route được admin => gọi AI async
  - save AI message
  - broadcast /topic/session/{sessionId} (AI)

4. UI:

- RN hiển thị message AI khác style (bubble AI)
- Admin vẫn xem được lịch sử, gồm cả AI messages

OUTPUT BẮT BUỘC STEP 2

- Code đầy đủ + checklist test:
  - admin offline -> user gửi -> AI trả lời
  - admin online + claim -> user gửi -> ưu tiên admin
  - admin disconnect -> fallback AI

========================
STEP 3 — NÂNG CẤP AI → RAG (TÍCH HỢP GEMINI)
========================
MỤC TIÊU

- ✔️ Index product/category
- ✔️ Similarity search
- ✔️ Context-aware answer
- ✔️ Reindex admin

YÊU CẦU TRIỂN KHAI (STEP 3)

1. Gemini integration

- Dùng Gemini API key từ ENV: GEMINI_API_KEY AIzaSyAH5G_ZPnNMUlkFJoKjpiKK0mn0Nw7EHAo
- Tạo GeminiClient (HTTP client) gọi model text (ví dụ gemini-1.5/2.0 tùy)
- Có cấu hình timeout + retry cơ bản

2. RAG pipeline
   A) Mode demo (không vector DB):

- In-memory documents:
  - build documents từ DB product/category (id, name, description, price)
- Retrieve topK:
  - keyword scoring/tfidf nhẹ
- Prompt:
  - SYSTEM: trợ lý bán hàng shop
  - CONTEXT: topK snippets
  - USER: question
- Call Gemini -> answer

B) Mode production-ish (vector store):

- Chọn 1: pgvector (Postgres) hoặc Qdrant
- Tạo EmbeddingService + store + similaritySearch topK
- Indexing job:
  - endpoint POST /api/admin/rag/reindex
  - hoặc run on startup

3. Lưu sources

- chat_message.metadata lưu:
  - sources: [{type:'product', id:..., name:...}, ...]
  - rag_mode: 'in_memory' or 'vector'
  - retrieved_topK: N

4. UI admin

- Admin xem message AI kèm “sources” (optional)
- Có nút “Reindex” trong admin panel gọi /api/admin/rag/reindex

OUTPUT BẮT BUỘC STEP 3

- Code đầy đủ + checklist thao tác:
  - set env GEMINI_API_KEY
  - run reindex
  - hỏi sản phẩm -> AI trả lời dựa trên dữ liệu product/category
  - update product -> reindex -> hỏi lại -> trả lời cập nhật

========================
PHẦN CHECKLIST THAO TÁC (BẮT BUỘC)
========================
Bạn phải viết checklist thật chi tiết theo format:

- Step 01: Tạo file ... tại path ...
- Step 02: Dán code ...
- Step 03: Thêm dependency ... (pom.xml / package.json)
- Step 04: Chạy lệnh ... (mvn / npm)
- Step 05: Test REST ... (Postman curl)
- Step 06: Test WebSocket flow ... (mở app, login user/admin, gửi tin)
- Step 07: Verify DB rows ... (SQL select)
  … tiếp tục cho đến khi hoàn thiện cả 3 STEP.

BẮT ĐẦU TRẢ LỜI NGAY:

1. STEP 1 (tất cả output bắt buộc)
2. STEP 2 (tất cả output bắt buộc)
3. STEP 3 (tất cả output bắt buộc)
