# คำขอ: เปิด Groups Claim + จัด Security Groups สำหรับ Petabyte Portal

> 📘 **มีคู่มือฉบับลงมือทำทีละคลิกแล้ว** (พร้อมโครงกลุ่มที่ตกลงกัน 3 กลุ่ม: `PTB-ALLACCESS` / `PTB-USER` / `PTB-Projectlist` + checklist ส่งกลับ): **[entra-groups-setup-guide.md](entra-groups-setup-guide.md)** — แนะนำส่งไฟล์นั้นให้แอดมิน ไฟล์นี้เก็บไว้เป็นบริบท/เหตุผลประกอบ

ส่งให้: ผู้ดูแล Microsoft 365 / Microsoft Entra ID ของบริษัท
เกี่ยวกับ: App Registration **"Petabyte Portal"** (ตัวเดียวกับที่สร้างตามคำขอก่อนหน้า)
เวลาที่ใช้โดยประมาณ: **10–15 นาที**

---

## ทำไปเพื่ออะไร

Portal ภายในจะ**แบ่งสิทธิ์ว่าใครเห็นแอปไหน**ตามทีม/แผนก โดยอิงจาก security group ใน Entra ID ที่บริษัทดูแลอยู่แล้ว — พนักงานย้ายทีม แค่ย้ายกลุ่มใน Microsoft ที่เดียว portal ก็เห็นผลเอง ไม่ต้องดูแลรายชื่อซ้ำสองที่

สิ่งที่ระบบต้องการคือ ตอนพนักงาน login ให้ Microsoft **แนบรายชื่อกลุ่มของคนนั้นมากับ token** ด้วย (ฟีเจอร์มาตรฐานของ Entra เรียกว่า *groups claim* — เป็นการตั้งค่า ไม่ใช่การเขียนโค้ด)

---

## ขั้นที่ 1 — เช็ค/สร้าง Security Groups ตามทีม (~5–10 นาที)

เข้า **entra.microsoft.com** → Identity → **Groups** → All groups

**กรณีมีกลุ่มตามแผนกอยู่แล้ว:** เช็คว่าเป็นชนิด **Security** (ดูคอลัมน์ Group type) ถ้าใช่ ใช้ต่อได้เลย ข้ามไปขั้นที่ 2

**กรณียังไม่มี:** สร้างใหม่ — New group →
- **Group type: Security** (สำคัญ — อย่าเลือก Microsoft 365)
- ตั้งชื่อให้สื่อ เช่น `PTB-Finance`, `PTB-Engineering`, `PTB-IT`, `PTB-HR` (ตามโครงทีมจริงของบริษัท)
- Members: ใส่พนักงานของทีมนั้น

> ⚠️ **ข้อควรระวัง:** กลุ่มที่เกิดจากการสร้างทีมใน Microsoft Teams เป็นชนิด *Microsoft 365 group* ไม่ใช่ *Security group* — เอามาใช้ตรง ๆ ไม่ได้กับการตั้งค่าในขั้นที่ 2 (ที่เลือกเฉพาะ Security groups เพื่อไม่ให้ token บวม) แนะนำสร้าง Security group แยกสำหรับคุมสิทธิ์โดยเฉพาะ

---

## ขั้นที่ 2 — เปิด Groups Claim ใน App Registration (~2 นาที)

1. เข้า **App registrations** → เลือกแอป **Petabyte Portal**
2. เมนูซ้าย: **Token configuration**
3. กด **➕ Add groups claim**
4. เลือก ✅ **Security groups** (อย่างเดียวพอ)
5. ส่วน *Customize token properties by type* → แท็บ **ID** → เลือก **Group ID** (ค่า default อยู่แล้ว)
6. กด **Add / Save**

> เทียบเท่าการตั้งค่าใน Manifest: `"groupMembershipClaims": "SecurityGroup"`
> ผล: token ตอน login จะมี field `groups` เป็นรายการ Object ID ของกลุ่มที่ user สังกัด

---

## ขั้นที่ 3 — ส่งข้อมูลกลับมาให้ทีมพัฒนา (~3 นาที)

ขอ**ชื่อกลุ่ม + Object ID** ของทุกกลุ่มที่จะใช้คุมสิทธิ์ (Object ID ดูได้ในหน้า Overview ของแต่ละกลุ่ม) ตามฟอร์มนี้:

| ชื่อกลุ่ม | Object ID | ทีม/แผนก |
|-----------|-----------|----------|
| PTB-Finance | `00000000-0000-0000-0000-000000000000` | บัญชี/การเงิน |
| PTB-Engineering | `...` | ทีมพัฒนา |
| … | … | … |

ส่งกลับผ่านช่องทางปกติได้เลย (ไม่ใช่ข้อมูลลับระดับ secret)

---

## สิ่งที่ **ไม่ต้อง** ทำ

- ❌ ไม่ต้องเพิ่ม API permission / ไม่ต้อง admin consent ใหม่ — ใช้ claim ใน token เดิม ระบบไม่เรียก Microsoft Graph เพิ่ม
- ❌ ไม่ต้องแตะ Redirect URI หรือ client secret — ใช้ของเดิมทั้งหมด
- ❌ ไม่กระทบระบบ/แอปอื่น — การตั้งค่านี้จำกัดอยู่แค่ App Registration ของ Portal ตัวเดียว

## ข้อจำกัดที่ควรรู้ (แจ้งเพื่อทราบ)

- ถ้า user คนใดสังกัดเกิน **~200 กลุ่ม** token จะไม่แนบรายชื่อ (Entra ส่งเป็น "overage" ให้ไปเรียก Graph แทน) — องค์กรขนาดเราปกติไม่ถึง แจ้งไว้เผื่ออนาคต
- การย้ายคนเข้า/ออกกลุ่ม **มีผลตอน login ครั้งถัดไป** ของคนนั้น (session เดิมยังถือกลุ่มชุดเก่าจนกว่าจะ login ใหม่)

---

*หมายเหตุทีมพัฒนา: เมื่อได้ Object ID กลับมาแล้ว ฝั่งโค้ดจะ (1) อ่าน `groups` จาก token ใน jwt callback (2) เก็บลง session (3) กรองแอปด้วย `tbl_AppAccess` ตอน render dashboard (4) เพิ่ม UI ผูกกลุ่มกับแอปใน Access Manager — ดูโครงตารางใน `prisma/schema.prisma` (`tbl_AccessGroup.entraGroupId` รอ map กับ Object ID เหล่านี้)*
