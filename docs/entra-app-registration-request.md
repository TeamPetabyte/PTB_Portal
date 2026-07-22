# คำขอ: สร้าง App Registration ใน Microsoft Entra ID

ส่งให้: ผู้ดูแล Microsoft 365 / Microsoft Entra ID (Azure AD) ของบริษัท
สำหรับ: เว็บภายในบริษัท **"Petabyte Portal"** (ใช้ login ด้วยบัญชีพนักงาน)

---

## สิ่งที่ขอให้ช่วยทำ

รบกวนสร้าง **App Registration** ใน Microsoft Entra ID ตามนี้ แล้วส่งค่ากลับมาให้ทีมพัฒนา

### 1. ค่าที่ขอให้ส่งกลับมา
| รายการ | ที่อยู่ใน Azure | เอาไปใส่ตัวแปร |
|--------|-----------------|----------------|
| **Directory (tenant) ID** | Overview | `MS_TENANT_ID` |
| **Application (client) ID** | Overview | `MS_CLIENT_ID` |
| **Client secret** (ค่า + วันหมดอายุ) | Certificates & secrets → New client secret | `MS_CLIENT_SECRET` |

> ⚠️ Client secret ส่งผ่านช่องทางที่ปลอดภัย (เช่น password manager / secret vault) อย่าส่งผ่านแชตธรรมดา และแจ้งวันหมดอายุด้วยจะได้ตั้งเตือนต่ออายุ

### 2. Account types
เลือก **Single tenant** — ให้เฉพาะบัญชีพนักงาน `@petabyte.co.th` เท่านั้นที่ login ได้

### 3. Redirect URI (Web) — ใส่ได้หลายอัน ขอให้ใส่ทั้ง 2 บรรทัด
```
http://localhost:3000/api/auth/callback/microsoft-entra-id        ← ใช้ตอนพัฒนา
https://<โดเมนจริงในอนาคต>/api/auth/callback/microsoft-entra-id   ← ใช้ตอนขึ้นจริง
```
- path ท้าย `/api/auth/callback/microsoft-entra-id` ต้องตรงเป๊ะ
- ของ production ต้องเป็น **https** (Entra อนุญาต http เฉพาะ localhost)
- ตอนนี้ยังไม่มีโดเมนจริงก็ใส่แค่ localhost ไปก่อนได้ พอมีโดเมนค่อยเพิ่มอีกบรรทัด (ไม่ต้องลบของเดิม)

### 4. API permissions (Delegated — Microsoft Graph)
แค่ระดับ sign-in พื้นฐาน:
```
openid, profile, email, User.Read
```

---

## คำถามเพิ่มเติม (ไว้วางแผนระบบแบ่งสิทธิในอนาคต)

ตอนนี้ยังไม่ต้องตั้งค่า แค่อยากทราบข้อมูลเพื่อวางแผน:

1. บริษัทมีการจัด **security group / กลุ่มตามแผนก** ใน Entra ID อยู่แล้วหรือยัง?
   (ถ้ามี เราจะเอามาใช้แบ่งสิทธิว่าใครเข้าแอปไหนได้ โดยไม่ต้องสร้างระบบเก็บสิทธิเองใหม่)
2. ถ้าจะแบ่งสิทธิตามกลุ่ม สะดวกให้เปิด **groups claim** หรือทำ **App Roles** ใน App Registration นี้ไหม?

---

*หมายเหตุสำหรับทีมพัฒนา: ค่าที่ได้กลับมาใส่ในไฟล์ `.env.local` (ดู `.env.example`). ระบบเชื่อมกับ **Entra ID** ซึ่งเป็นชั้นตัวตนเดียวกับที่ Microsoft Teams / Outlook / 365 ใช้ — ไม่ได้เชื่อมกับ Teams โดยตรง*
