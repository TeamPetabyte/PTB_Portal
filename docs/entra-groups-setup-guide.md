# คู่มือแอดมิน: สร้าง Security Groups + เปิด Groups Claim ให้ Petabyte Portal

ส่งให้: ผู้ดูแล Microsoft 365 / Entra ID ของ Team Petabyte
เวลาที่ใช้: **~15–20 นาที** · ทำครั้งเดียวจบ
สิ่งที่ต้องมี: สิทธิ์สร้าง group ใน Entra ID + สิทธิ์แก้ App Registration "Petabyte Portal"

> ฉบับย่อ/บริบทเพิ่มเติมอยู่ที่ `entra-groups-claim-request.md` — ไฟล์นี้คือฉบับลงมือทำทีละคลิก

---

## เป้าหมาย

Petabyte Portal จะใช้ **security group ใน Entra ID เป็นตัวกำหนดว่าพนักงานคนไหนเห็นแอปไหน** — ย้ายคนเข้า/ออกกลุ่มที่เดียว portal อัปเดตเอง ไม่ต้องดูแลรายชื่อสองที่

## โครงกลุ่มที่จะสร้าง (3 กลุ่ม)

| # | ชื่อกลุ่ม | สมาชิก | ผลใน portal |
|---|-----------|--------|--------------|
| 1 | `PTB-ALLACCESS` | ผู้บริหาร + แอดมินระบบ (CEO, IT) | เห็น**ทุกแอป**อัตโนมัติ |
| 2 | `PTB-USER` | พนักงานทุกคน | เห็นแอปทั่วไป *(ดูหมายเหตุ)* |
| 3 | `PTB-Projectlist` | สมาชิกโปรเจกต์เฉพาะ | เห็นแอปทั่วไป + **แอปพิเศษของโปรเจกต์** |

> **หมายเหตุ PTB-USER:** เวอร์ชันแรก แอปทั่วไป (ที่ไม่ผูกกลุ่ม) เปิดให้พนักงาน @petabyte.co.th ทุกคนที่ login ผ่านโดยอัตโนมัติ — กลุ่มนี้จึงยังไม่บังคับใช้งานจริง แต่**ขอให้สร้างและใส่สมาชิกไว้เลย** เพื่อรองรับโหมดเข้มงวดในอนาคตโดยไม่ต้องตั้งค่าใหม่
>
> อนาคตถ้ามีโปรเจกต์/แผนกเพิ่ม สร้างกลุ่มใหม่ตามแพทเทิร์น `PTB-<ชื่อ>` ได้เลย แล้วแจ้งทีมพัฒนาพร้อม Object ID

---

## ขั้นตอนที่ 1 — สร้างกลุ่มทั้ง 3 (~10 นาที)

ทำซ้ำ 3 รอบ (เปลี่ยนชื่อกลุ่มตามตาราง):

1. เข้า **entra.microsoft.com** → เมนูซ้าย **Identity → Groups → All groups**
2. กด **➕ New group**
3. ตั้งค่าดังนี้:
   - **Group type:** `Security` ⚠️ *ต้องเป็น Security เท่านั้น — Microsoft 365 group (แบบที่ Teams สร้าง) ใช้ไม่ได้กับการตั้งค่าในขั้นตอนที่ 2*
   - **Group name:** `PTB-ALLACCESS` (รอบถัดไป: `PTB-USER`, `PTB-Projectlist`)
   - **Group description:** ใส่คำอธิบายสั้น ๆ เช่น "Petabyte Portal — เห็นทุกแอป"
   - **Membership type:** `Assigned`
4. กด **Members → เลือกสมาชิก**:
   - `PTB-ALLACCESS` → CEO + IT admin
   - `PTB-USER` → พนักงานทุกคน
   - `PTB-Projectlist` → สมาชิกโปรเจกต์นั้น
5. กด **Create**

> คนหนึ่งอยู่หลายกลุ่มได้ (เช่น CEO อยู่ทั้ง ALLACCESS และ USER) — ไม่มีปัญหา

---

## ขั้นตอนที่ 2 — เปิด Groups Claim ใน App Registration (~2 นาที)

ให้ token ตอน login แนบรายชื่อกลุ่มของผู้ใช้มาด้วย:

1. เข้า **App registrations** → เลือกแอป **Petabyte Portal**
2. เมนูซ้าย: **Token configuration**
3. กด **➕ Add groups claim**
4. ติ๊กเฉพาะ ✅ **Security groups**
5. ส่วน *Customize token properties by type* → แท็บ **ID** → **Group ID** (ค่า default)
6. กด **Add**

> เทียบเท่า `"groupMembershipClaims": "SecurityGroup"` ใน Manifest
> ❌ ไม่ต้องเพิ่ม API permission · ไม่ต้อง admin consent ใหม่ · ไม่กระทบแอปอื่น

---

## ขั้นตอนที่ 3 — ส่งข้อมูลกลับทีมพัฒนา (~3 นาที)

เปิดหน้า **Overview** ของแต่ละกลุ่ม คัดลอก **Object ID** แล้วกรอกตารางนี้ส่งกลับ:

```
PTB-ALLACCESS   : <Object ID>
PTB-USER        : <Object ID>
PTB-Projectlist : <Object ID>   (แอปพิเศษที่กลุ่มนี้ต้องเห็น: __________)
```

ส่งทางช่องทางปกติได้ (Object ID ไม่ใช่ความลับระดับ secret)

## ✅ Checklist ก่อนตอบกลับ

- [ ] สร้างครบ 3 กลุ่ม ชนิด **Security** / Membership แบบ **Assigned**
- [ ] ใส่สมาชิกครบทุกกลุ่ม (โดยเฉพาะ PTB-USER = พนักงานทุกคน)
- [ ] เปิด **groups claim (Security groups, Group ID)** ใน App Registration "Petabyte Portal" แล้ว
- [ ] ส่ง Object ID ทั้ง 3 กลุ่ม + ระบุชื่อแอปพิเศษของ PTB-Projectlist

---

## คำถามที่พบบ่อย

- **ย้ายคนเข้า/ออกกลุ่มแล้วมีผลเมื่อไหร่?** → ตอน login ครั้งถัดไปของคนนั้น (session เดิมถือข้อมูลกลุ่มชุดเก่าจนกว่าจะ login ใหม่)
- **ใช้กลุ่มที่มีอยู่แล้วแทนได้ไหม?** → ได้ ถ้าเป็นชนิด Security และสมาชิกตรงตามบทบาท — แจ้งชื่อ+Object ID มาแทนได้เลย
- **ทำไมไม่ใช้กลุ่มจาก Teams?** → กลุ่มที่ Teams สร้างเป็นชนิด Microsoft 365 ไม่ถูกส่งมากับ claim แบบ Security groups ที่เราเปิดใช้ (เลือกแบบนี้เพื่อไม่ให้ token บวม)
- **มีเพดานไหม?** → ถ้า user คนใดอยู่เกิน ~200 กลุ่ม token จะไม่แนบรายชื่อ — องค์กรขนาดเราไม่ถึง

---

*โน้ตทีมพัฒนา (ไม่เกี่ยวกับแอดมิน): `PTB-ALLACCESS` จะ implement เป็น all-access bypass ในโค้ด (แบบเดียวกับ `OWNER_EMAILS`) ไม่ผูกรายแอป · `PTB-Projectlist` ผูกผ่าน `tbl_AppAccess` ใน Access Manager · `PTB-USER` สำรองไว้สำหรับโหมดเข้มงวด — แอปทั่วไปยัง default-open ตาม schema (แอปไม่มีแถว AppAccess = ทุกคนเห็น)*
