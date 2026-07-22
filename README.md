# Petabyte Portal

เว็บ portal ภายในบริษัท — "ประตูเดียวเข้าทุกเครื่องมือภายใน" พนักงาน login ครั้งเดียวด้วยบัญชี Microsoft ของบริษัท แล้วเห็น catalog ของแอปภายในทั้งหมดที่ตัวเองมีสิทธิ์ใช้ ค้นหา/ปักหมุด/เปิดได้จากที่เดียว

| | |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Auth | Auth.js / NextAuth v5 (beta) + Microsoft Entra ID (single tenant) |
| Database | PostgreSQL + Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Font / Design | Hanken Grotesk · accent `#2f80d8` · ต้นแบบอยู่ใน `design/portal.html` |
| Deploy target | `output: "standalone"` — เตรียมไว้สำหรับ Docker / Google Cloud Run |

---

## โมเดลสิทธิ์ "C+A"

- **C (corporate)** — login ได้เฉพาะอีเมลโดเมนพนักงาน (`EMPLOYEE_DOMAINS` เช่น `petabyte.co.th`) เช็คใน `signIn` callback (`auth.ts` → `access/policy.ts`) ถ้าไม่ตั้งค่าโดเมนไว้เลยระบบจะ **fail closed** (ไม่ให้ใครเข้า)
- **A (authorization)** — สิทธิ์รายแอปตาม Entra security group ผ่านตาราง `tbl_AccessGroup` / `tbl_AppAccess` — **ยังไม่ได้ wire** (ดู "งานที่เหลือ" ข้อ 1) ตอนนี้ทุกคนที่ผ่าน C เห็นทุกแอปที่ active
- **Owner** — อีเมลใน `OWNER_EMAILS` เห็นทุกแอป + เข้า **Access Manager** (`/dashboard/access-manager`) เพื่อจัดการ catalog ได้

## Flow การทำงาน

1. `/` (หน้า login) → กด "Continue with Microsoft Entra ID" → `signIn("microsoft-entra-id")`
2. Microsoft redirect กลับมาที่ `/api/auth/callback/microsoft-entra-id` → callback เช็คโดเมน (C)
3. Session เป็น JWT · `middleware.ts` กันทุก path ใต้ `/dashboard/*` ถ้ายังไม่ login
4. `/dashboard` ดึงแอปจาก Postgres (`prisma.app.findMany({ where: { active: true }})`) แล้ว render `PortalApp`
5. Owner จัดการแอป (เพิ่ม/แก้/ซ่อน) ผ่าน Server Actions ใน `app/dashboard/access-manager/actions.ts`

## โครงสร้างโปรเจกต์

```
portalptb/
├── app/
│   ├── page.tsx                        # หน้า login (/)
│   ├── layout.tsx                      # root layout + โหลดฟอนต์
│   ├── globals.css                     # CSS ทั้งหมด (port มาจาก design/portal.html)
│   ├── dashboard/page.tsx              # portal หลัก — ดึง catalog จาก DB
│   ├── dashboard/access-manager/       # หน้า admin (owner เท่านั้น) + Server Actions
│   └── api/auth/[...nextauth]/route.ts # NextAuth handlers
├── components/
│   ├── LoginScreen.tsx                 # UI หน้า login
│   ├── PortalApp.tsx                   # UI dashboard (search ⌘K, favorites, recent, toast)
│   ├── AccessManagerClient.tsx         # UI ตารางจัดการแอป
│   ├── icons.tsx                       # SVG icon sprite (จากดีไซน์เดิม)
│   └── portal-data.ts                  # type `App` + mapping หมวดหมู่ → label/icon
├── access/policy.ts                    # กติกา C+A (pure function — เขียนไว้ให้ unit test ได้)
├── auth.ts                             # config NextAuth + Entra ID
├── middleware.ts                       # กัน /dashboard/* ก่อน login
├── db.ts                               # Prisma client (cache บน globalThis กัน hot-reload เปิด pool ซ้ำ)
├── prisma/schema.prisma                # tbl_App · tbl_AccessGroup · tbl_AppAccess
├── prisma/migrations/                  # migration 2 ชุด (init, rename เป็น tbl_ prefix)
├── scripts/db-check.mjs                # เช็คการเชื่อม DB + นับ row ทุกตาราง
├── design/                             # ⭐ ต้นแบบดีไซน์ = source of truth (อ่าน design/README.md)
├── docs/entra-app-registration-request.md  # เอกสารขอ App Registration จากแอดมิน M365
├── docs/deployment.md                  # คู่มือ deploy (ตามแนวทาง PetabyteAi + Cloudflare Tunnel)
└── .env.example                        # template ตัวแปรทั้งหมด
```

## Database (PostgreSQL)

| ตาราง | ใช้ทำอะไร |
|---|---|
| `tbl_App` | แอป 1 แถวต่อ 1 แอปใน catalog — name, category (`eng/fin/data/ops/ppl/sec`), icon, url, `openInNewTab`, `authType` (`sso`/`own-login`), `active`, `sortOrder` |
| `tbl_AccessGroup` | map กับ Entra security group (เตรียมไว้สำหรับ "A" — ยังไม่ใช้) |
| `tbl_AppAccess` | join table แอป↔กลุ่ม — แอปไหนไม่มีแถว = ทุกคนเห็น (ยังไม่ใช้) |

## วิธีรันบนเครื่อง

ต้องมี: **Node 20.6+**, เข้าถึง Postgres ภายในบริษัทได้ (ค่าอยู่ใน `.env.local` — ห้าม commit)

```bash
npm install
cp .env.example .env.local   # แล้วกรอกค่าจริง (ทีมมี .env.local อยู่แล้ว)
npx prisma generate
npm run dev                  # → http://localhost:3000
```

### ⚠️ เรื่อง port

- Dev server รันที่ **port 3000** (ค่า default ของ `next dev`)
- **ห้ามใช้ port 3001** — บนเครื่อง dev มีแอปอื่น (`onlyopenai` server) จองอยู่แล้ว
- Port 3000 **ผูกกับ Microsoft login**: ทั้ง `AUTH_URL=http://localhost:3000` ใน `.env.local` และ Redirect URI ที่ลงทะเบียนใน Azure (`http://localhost:3000/api/auth/callback/microsoft-entra-id`) ถ้าจะย้าย port ต้องทำ 3 อย่างพร้อมกัน: `next dev -p <PORT>` + แก้ `AUTH_URL` + เพิ่ม Redirect URI ใหม่ใน Azure ไม่งั้น login Microsoft จะพัง (redirect_uri mismatch)

### Scripts

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | dev server (port 3000) |
| `npm run build` / `npm start` | production build (standalone) / รัน |
| `npm run db:check` | เช็คว่าต่อ DB ติดไหม + นับ row ทุกตาราง |
| `npm run db:studio` | เปิด Prisma Studio ดู/แก้ข้อมูล |
| `npx prisma migrate dev` | สร้าง/รัน migration (ตอนแก้ schema) |

## สถานะงาน

### ✅ เสร็จแล้ว

- Login ด้วย Microsoft Entra ID + กันโดเมน (C) แบบ fail-closed
- หน้า login แบบ hero ตาม design ล่าสุดของ Winn (2026-07-22, `design/login.html`): heading พิมพ์ทีละตัวอักษร + caret, โลโก้ HD ลอย (`public/petabyte-mark-hd.png`) + icon chips, parallax/spotlight ตามเมาส์, ปุ่ม Microsoft แบบ magnetic — รองรับ `prefers-reduced-motion`
- ปิดปุ่ม Next.js dev tools ตอนรัน dev แล้ว (`devIndicators: false` ใน next.config.js)
- Middleware กัน `/dashboard/*` · JWT session
- Dashboard: catalog จาก DB, ค้นหา (⌘K), filter หมวด/favorites/recent, toast, user menu, sign out
- Access Manager (owner เท่านั้น): เพิ่ม / แก้ / ซ่อน-แสดงแอป ผ่าน Server Actions
- Prisma schema + migrations · script `db:check`
- เอกสารขอ App Registration (`docs/`) · ดีไซน์ต้นแบบครบ (`design/`)

### ⬜ งานที่เหลือ (ไว้แบ่งกันทำ)

1. **[Auth/Backend] wire "A" — สิทธิ์รายแอปตามกลุ่ม Entra** — เปิด groups claim (หรือ App Roles) ใน App Registration, อ่าน group จาก token, query `tbl_AppAccess` ตอน render dashboard แทนที่จะโชว์ทุกแอป (ตอนนี้ schema รองรับแล้วแต่ยังไม่มีโค้ดใช้) — มีคำถามค้างกับแอดมิน M365 ท้ายไฟล์ `docs/entra-app-registration-request.md`
2. ~~**[Frontend] greeting hardcode "Jordan"**~~ ✅ แก้แล้ว (2026-07-22): ทักด้วยชื่อจริง (ชื่อแรก) ของ user จาก session
3. ~~**[Frontend] favorites / recently-used ไม่ persist**~~ ✅ แก้แล้ว (2026-07-22): เก็บใน localStorage แยกตามอีเมลผู้ใช้ (คีย์ `ptb_favs_v1:<email>` / `ptb_recent_v1:<email>`), กรอง id ที่ไม่มีอยู่จริงใน catalog ออกตอนโหลด, ลบค่า default ปลอมแล้ว — ถ้าวันหน้าอยากให้ข้ามเครื่องได้ค่อยย้ายไปเก็บ DB
4. **[Frontend] ปุ่มที่ยังเป็น UI เปล่า** — กระดิ่งแจ้งเตือน, Your profile, Settings, การ์ด "Request access" ยังกดแล้วไม่เกิดอะไร — ตัดสินใจว่าจะทำหรือถอดออกก่อน launch
5. ~~**[Frontend] ข้อความ footer หน้า login** — เคลม "SOC 2 Type II · ISO 27001" มาจาก mockup~~ ✅ เอาออกแล้ว (2026-07-22 พร้อมงานเปลี่ยนหน้า login เป็นโลโก้ animation)
6. **[Admin] Access Manager ยังขาด** — ลบแอป, จัดลำดับ (`sortOrder`), แก้ `openInNewTab` / `authType` จากฟอร์มไม่ได้
7. **[Quality] tests** — `npm test` (node --test) ตั้งไว้แล้วแต่ยังไม่มีไฟล์ test เลย เริ่มจาก `access/policy.ts` ที่เขียนเป็น pure function รอไว้แล้ว
8. **[Quality] ESLint** — ยังไม่มี config (`npm run lint` จะถามตั้งค่าครั้งแรก)
9. ~~**[Infra] git** — โฟลเดอร์นี้ยังไม่ได้ `git init` / ยังไม่มี remote repo~~ ✅ เรียบร้อย (2026-07-22): repo อยู่ที่ https://github.com/TeamPetabyte/PTB_Portal.git
10. **[Infra] deployment** — ✍️ แนวทางตัดสินใจแล้ว (2026-07-22): ใช้วิธีเดียวกับ PetabyteAi (onlyopenai) คือรันเป็น service บนเครื่องบริษัท + Cloudflare Tunnel (HTTPS) + Postgres ตัวเดิม — **คู่มือทีละขั้นอยู่ที่ [docs/deployment.md](docs/deployment.md)** เหลือลงมือจริง: git init ก่อน (ข้อ 9), เพิ่ม hostname ใน tunnel, เพิ่ม Redirect URI production ใน Azure, ตั้ง service
11. **[Quality] error handling** — ถ้า DB ล่ม `/dashboard` จะ error ทั้งหน้า ยังไม่มี error boundary / หน้า fallback
12. **[Docs] design/README.md ล้าสมัยบางส่วน** — หมายเหตุ "Not yet wired: Auth / App catalog" ตอนนี้ทำไปแล้ว ควรอัปเดต

## กติกาเรื่องดีไซน์

UI ทั้งหมด port มาจากต้นแบบใน `design/` — dashboard จาก `portal.html`, หน้า login จาก `login.html` (design ล่าสุด) — **ถ้าจะแก้ดีไซน์ ให้แก้ที่ไฟล์ต้นแบบก่อนแล้วค่อย port เข้า React** รายละเอียด mapping อยู่ใน [design/README.md](design/README.md)

## Secrets

ค่า credentials ทั้งหมด (Entra client secret, `AUTH_SECRET`, `DATABASE_URL`) อยู่ใน `.env.local` ซึ่งถูก ignore จาก git แล้ว — ห้าม commit, ห้ามส่งผ่านแชต ตอนขึ้น production ให้ใช้ Secret Manager
