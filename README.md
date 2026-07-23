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
- **A (authorization)** — สิทธิ์รายแอปตาม Entra security group ผ่านตาราง `tbl_AccessGroup` / `tbl_AppAccess` — **ยังไม่ได้ wire** (ดู roadmap ข้อ 7 — วางไว้รองสุดท้าย รอประสานแอดมิน M365) ตอนนี้ทุกคนที่ผ่าน C เห็นทุกแอปที่ active
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
| `tbl_App` | แอป 1 แถวต่อ 1 แอปใน catalog — name, category (`eng/fin/data/ops/ppl/sec`), icon, `logo` (data URI, nullable), url, `openInNewTab`, `authType` (`sso`/`own-login`), `active`, `sortOrder` |
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
- อัปโหลด**โลโก้ของแอป**ได้ใน Access Manager (เก็บเป็น data URI ในคอลัมน์ `logo`, จำกัด 200KB + validate ฝั่ง server) — การ์ดใน dashboard และตารางแอดมินโชว์โลโก้จริง ไม่ใส่ก็ fallback เป็น icon เดิม
- **Categories ซ่อนไว้ชั่วคราว** (ตัดสินใจ 2026-07-22: ยังไม่รู้ taxonomy จริง) — เอาออกจาก sidebar, ฟอร์ม, ตาราง และป้ายบนการ์ดแล้ว แต่คอลัมน์ `category` ยังอยู่ใน DB (แอปใหม่ได้ค่า default `data`) เปิดกลับมาได้โดยไม่ต้อง migrate
- Greeting ทักด้วยชื่อจริงของ user · favorites/recently-used persist ต่อผู้ใช้ (localStorage แยกตามอีเมล)
- ปุ่ม **"Manage apps"** ใน sidebar เป็นปุ่ม CTA สีชัดเจน (เดิมกลืนไปกับเมนู)
- Git repo บน GitHub (`TeamPetabyte/PTB_Portal`) + tag **v1.1** พร้อม release notes
- ใบขอสำหรับแอดมิน M365 ครบ 2 ฉบับ: App Registration (`docs/entra-app-registration-request.md`) และ groups claim (`docs/entra-groups-claim-request.md` — พร้อมส่ง)
- Prisma schema + migrations · script `db:check`
- เอกสารขอ App Registration (`docs/`) · ดีไซน์ต้นแบบครบ (`design/`)

### ⬜ งานที่เหลือ — roadmap (เรียงลำดับที่ตกลงกัน 2026-07-23)

> **ข้อ 7 (สิทธิ์รายแอป) จงใจวางรองสุดท้าย** — ต้องรอประสานแอดมิน M365 · **ข้อ 8 (deploy) เป็นขั้นสุดท้าย** เริ่มเมื่อ Winn สั่ง — ทั้งนี้ส่งใบขอ groups claim ให้แอดมินได้ตั้งแต่วันนี้ การรอคำตอบไม่ block งานข้ออื่น

1. **[Admin] Access Manager ส่วนที่ขาด** — ลบแอป, จัดลำดับ (`sortOrder`), แก้ `openInNewTab` / `authType` จากฟอร์ม (M)
2. **[Frontend] ปุ่มที่ยังเป็น UI เปล่า** — กระดิ่งแจ้งเตือน, Your profile, Settings, การ์ด "Request access" — ตัดสินใจทำจริงหรือถอดออกก่อนเปิดใช้ (S–M)
3. **[Quality] Error boundary** — กัน `/dashboard` พังทั้งหน้าเมื่อ DB ล่ม + หน้า fallback (M)
4. **[Quality] Tests + ESLint** — เริ่มเทสต์จาก `access/policy.ts` (pure function รอไว้แล้ว) + ตั้งค่า ESLint (S–M)
5. **[Frontend·เสริม] ฟีเจอร์จาก design ล่าสุด** (เลือกทำเป็นชิ้นได้) — dark mode, ⌘K command palette, จุดสถานะแอป, ลาก favorites จัดลำดับ, card tilt — spec CSS/logic มีแล้วใน `design/login.html` (M–L)
6. **[Docs] เก็บตก design/README.md** — หมายเหตุ "Not yet wired" ล้าสมัย (auth/catalog ต่อเสร็จแล้ว) (S)
7. **[Auth·รองสุดท้าย] Wire "A" — สิทธิ์รายแอปตาม Entra groups** — รอแอดมิน M365 ทำตามใบขอ [docs/entra-groups-claim-request.md](docs/entra-groups-claim-request.md) → แล้วต่อโค้ด: อ่าน groups จาก token → กรองแอปด้วย `tbl_AppAccess` → UI ผูกกลุ่มใน Access Manager (~1–2 วัน) (L)
8. **[Infra·สุดท้าย] Deployment** — ตามคู่มือ [docs/deployment.md](docs/deployment.md): เพิ่ม hostname ใน Cloudflare Tunnel เดิม + Redirect URI production ใน Azure + ตั้ง service บนเครื่องบริษัท (L)

## กติกาเรื่องดีไซน์

UI ทั้งหมด port มาจากต้นแบบใน `design/` — dashboard จาก `portal.html`, หน้า login จาก `login.html` (design ล่าสุด) — **ถ้าจะแก้ดีไซน์ ให้แก้ที่ไฟล์ต้นแบบก่อนแล้วค่อย port เข้า React** รายละเอียด mapping อยู่ใน [design/README.md](design/README.md)

## Secrets

ค่า credentials ทั้งหมด (Entra client secret, `AUTH_SECRET`, `DATABASE_URL`) อยู่ใน `.env.local` ซึ่งถูก ignore จาก git แล้ว — ห้าม commit, ห้ามส่งผ่านแชต ตอนขึ้น production ให้ใช้ Secret Manager
