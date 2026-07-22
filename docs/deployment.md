# Deployment Guide — Petabyte Portal

> ใช้แนวทางเดียวกับ **PetabyteAi (onlyopenai)**: รันบนเครื่องบริษัทเป็น service ถาวร + เปิด HTTPS ผ่าน **Cloudflare Tunnel** + ใช้ Postgres ตัวเดิมที่ `192.168.69.125`
> อ้างอิงต้นแบบ: `onlyopenai/docs/deployment.md` และ `deployment-windows.md`

---

## 🗺️ ภาพรวม (เหมือน PetabyteAi เป๊ะ ต่างแค่ port กับตัวแอป)

```
   พนักงาน (เบราว์เซอร์, ที่ไหนก็ได้)             เครื่องบริษัท (ตัวเดียวกับ PetabyteAi ได้)
   ┌──────────────────────────────┐            ┌─────────────────────────────────┐
   │ https://portal.<domain>       │ ──HTTPS──▶ │  cloudflared (service เดิม)      │
   │ + login ผ่าน Microsoft         │            │    ├▶ PetabyteAi        :3001    │
   └──────────────────────────────┘            │    └▶ Petabyte Portal   :3000    │
                                               │          └▶ PostgreSQL           │
                                               │             192.168.69.125       │
                                               └─────────────────────────────────┘
```

**ต่างจาก PetabyteAi ข้อเดียวที่สำคัญ:** Portal login ด้วย Microsoft Entra ID ซึ่ง**บังคับใช้ HTTPS + โดเมนจริง** (http อนุญาตเฉพาะ localhost) — ดังนั้นขั้น Cloudflare Tunnel ที่เคยเป็น "optional" ของ PetabyteAi กลายเป็น **ขั้นบังคับ** ของ Portal และต้องเพิ่ม Redirect URI ใน Azure ด้วย (ขั้นที่ 7)

⚠️ **Port:** ใช้ **3000** — ห้าม 3001 เพราะชนกับ PetabyteAi ถ้าอยู่เครื่องเดียวกัน

---

## 📋 Prerequisites

| ของ | รายละเอียด |
|-----|-----------|
| เครื่องที่รัน | เครื่องเดิมที่รัน PetabyteAi ได้เลย (ถึง DB `192.168.69.125` ได้อยู่แล้ว) |
| Node.js | **≥ 20.6** (Portal ใช้ feature ใหม่กว่า PetabyteAi ที่ขอแค่ v18) |
| Cloudflare | บัญชี + tunnel เดิมที่ใช้กับ PetabyteAi เพิ่มแค่ hostname ใหม่ 1 บรรทัด |
| Azure | สิทธิ์แก้ App Registration "Petabyte Portal" (เพิ่ม Redirect URI + ดู `docs/entra-app-registration-request.md`) |

---

## 🚀 ขั้นตอน

### 1) ขึ้นโค้ดไปเครื่อง server (เหมือน PetabyteAi)

```powershell
# Windows
git clone https://github.com/TeamPetabyte/PTB_Portal.git C:\petabyte\portalptb
cd C:\petabyte\portalptb
```
```bash
# Linux
sudo git clone https://github.com/TeamPetabyte/PTB_Portal.git /opt/petabyte-portal && cd /opt/petabyte-portal
```

### 2) Install + Build (จุดที่ต่างจาก PetabyteAi)

PetabyteAi เป็น node ล้วนรันได้เลย แต่ Portal เป็น Next.js **ต้อง build ก่อน**:

```powershell
npm install          # ต้องลง dev deps ด้วย (ใช้ตอน build) — ไม่ใช่ --omit=dev
npx prisma generate
npm run build
```

### 3) ตั้งค่า `.env.local` (production)

สร้างจาก `.env.example` แล้วกรอก:

```bash
MS_TENANT_ID=<เดิม>
MS_CLIENT_ID=<เดิม>
MS_CLIENT_SECRET=<แนะนำออก secret ใหม่แยกจาก dev ใน Azure>
AUTH_SECRET=<gen ใหม่: openssl rand -base64 32 — ห้ามใช้ตัวเดียวกับ dev>
AUTH_URL=https://portal.<domain>          # ← URL จริงจากขั้นที่ 6
EMPLOYEE_DOMAINS=petabyte.co.th
OWNER_EMAILS=potvasin@petabyte.co.th
DATABASE_URL=postgresql://<user>:<pass>@192.168.69.125:5432/PortalPTB?schema=public
```

> แนะนำเหมือนคู่มือ PetabyteAi: สร้าง DB user แยกสำหรับ production แทน superuser `postgres`

### 4) Migrate database

DB `PortalPTB` มีอยู่แล้วบน `192.168.69.125` (ใช้ร่วมกับตอน dev) ถ้าชี้ DB เดิม schema พร้อมแล้ว ข้ามได้ — ถ้าตั้ง DB ใหม่:

```powershell
npx prisma migrate deploy    # apply migration ทั้งหมดแบบ non-interactive
```

> ต่างจาก PetabyteAi ที่ migrate อัตโนมัติตอน boot — ของ Portal ต้องสั่งเองทุกครั้งที่มี migration ใหม่ (ใส่ไว้ใน deploy script ขั้นที่ 8 แล้ว)

### 5) Smoke test

```powershell
npm start            # next start → port 3000
# เปิด http://localhost:3000 บนเครื่องนั้น → ต้องเห็นหน้า login
# ปุ่ม Microsoft จะยังพัง (redirect_uri mismatch) จนกว่าจะทำขั้น 6-7 เสร็จ — ปกติ
```

### 6) Cloudflare Tunnel — เพิ่ม hostname ใหม่ใน tunnel เดิม

ใช้ tunnel ตัวเดียวกับ PetabyteAi เพิ่ม public hostname:

- **Cloudflare Zero Trust → Tunnels → (tunnel เดิม) → Public Hostname → Add**
- Hostname: `portal.<domain>` → Service: `http://localhost:3000`

เสร็จแล้วได้ `https://portal.<domain>` ที่มี HTTPS โดยไม่ต้องยุ่ง cert เลย (จุดแข็งของวิธีนี้)

### 7) Azure — เพิ่ม Redirect URI (ขั้นที่ PetabyteAi ไม่มี)

ใน App Registration "Petabyte Portal" (ผู้ดูแล M365 ทำ ตาม `docs/entra-app-registration-request.md`):

```
https://portal.<domain>/api/auth/callback/microsoft-entra-id
```

- เพิ่มบรรทัดใหม่ **ไม่ต้องลบ** ของ localhost (dev ยังใช้อยู่)
- path ท้ายต้องตรงเป๊ะ · ต้องเป็น https
- แล้วตรวจ `AUTH_URL` ใน `.env.local` ให้ตรงกับ hostname นี้ → restart service

### 8) ทำเป็น service ถาวร

**Windows** (แบบเดียวกับ `onlyopenai/windows/install-services.ps1` — ผ่าน nssm):

```powershell
nssm install PetabytePortal "C:\Program Files\nodejs\npm.cmd" "start"
nssm set PetabytePortal AppDirectory C:\petabyte\portalptb
nssm set PetabytePortal AppStdout C:\petabyte\logs\portal.log
nssm set PetabytePortal AppStderr C:\petabyte\logs\portal-error.log
nssm start PetabytePortal
```

**Linux** — systemd unit แบบเดียวกับของ PetabyteAi เปลี่ยนแค่:

```ini
WorkingDirectory=/opt/petabyte-portal
ExecStart=/usr/bin/npm start
```

### 9) Deploy script — อัปเดตครั้งต่อไปให้จบในคำสั่งเดียว

สร้าง `deploy.ps1` (Windows) ไว้ที่ root ของโปรเจกต์บนเครื่อง server:

```powershell
cd C:\petabyte\portalptb
git pull origin main
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
nssm restart PetabytePortal
```

(Linux: แบบเดียวกัน จบด้วย `sudo systemctl restart petabyte-portal`)

---

## ✅ Post-deploy Checklist

| ตรวจสอบ | วิธี |
|--------|------|
| Service รันอยู่ | `nssm status PetabytePortal` / `systemctl status petabyte-portal` |
| หน้า login ขึ้นผ่าน HTTPS | เปิด `https://portal.<domain>` จากมือถือ (นอก LAN) |
| Microsoft login ผ่าน | login ด้วยบัญชี @petabyte.co.th → ต้องถึง dashboard |
| อีเมลนอกโดเมนถูกกัน | ลองบัญชี Microsoft ส่วนตัว → ต้อง sign-in ไม่ได้ |
| Owner เห็น Access Manager | login ด้วยอีเมลใน `OWNER_EMAILS` → มีเมนู Admin |
| DB ต่อติด | dashboard โหลด catalog ขึ้น (ไม่ error) |
| Auto-restart | kill process → service เด้งกลับเอง |

---

## 🚨 Troubleshooting (เพิ่มจากตาราง PetabyteAi)

| อาการ | สาเหตุ | แก้ |
|------|--------|-----|
| กด login แล้ว Microsoft ฟ้อง `redirect_uri mismatch` | Redirect URI ใน Azure ไม่ตรง / `AUTH_URL` ผิด | เทียบ 3 ค่าให้ตรง: Azure, `AUTH_URL`, hostname จริง |
| Login วนกลับหน้าแรกไม่เข้า dashboard | อีเมลไม่อยู่ใน `EMPLOYEE_DOMAINS` (fail closed) | ตรวจ `EMPLOYEE_DOMAINS` ใน `.env.local` |
| `Configuration` error ตอน start | ไม่มี `AUTH_SECRET` | gen แล้วใส่ `.env.local` |
| dashboard error 500 | ต่อ DB ไม่ได้ | `npm run db:check` บนเครื่อง server |
| build fail `prisma client not generated` | ข้าม generate | `npx prisma generate` ก่อน build |
| port 3000 ชน | มีอย่างอื่นรันอยู่ | `netstat -ano \| findstr :3000` (Win) / `lsof -i :3000` |

---

## ทำไมไม่ใช้วิธีอื่น (บันทึกการตัดสินใจ)

- **Vercel / Cloud Run** — deploy Next.js ง่ายกว่าก็จริง แต่**เข้าไม่ถึง Postgres ใน LAN** (`192.168.69.125`) ต้องเปิด DB สู่ public หรือทำ VPN connector = งานเพิ่มและความเสี่ยงเพิ่ม ไม่คุ้ม
- **Docker** — มี `output: standalone` รองรับอยู่ ถ้าวันหน้าย้ายขึ้น cloud ค่อยทำ Dockerfile (ดูต้นแบบได้จาก `onlyopenai/server/Dockerfile`) ตอนนี้รันตรงบนเครื่องแบบ PetabyteAi ง่ายกว่าและทีมคุ้นแล้ว
- สรุป: **วิธีของ PetabyteAi เหมาะกับ Portal ที่สุดแล้ว** เพราะข้อจำกัดจริงคือ DB อยู่ใน LAN และทีมมี Cloudflare Tunnel รันอยู่แล้ว
