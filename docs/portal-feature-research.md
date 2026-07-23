# Research: Web Portal ในองค์กรควรมีอะไรบ้าง

> สรุปจาก best practices ปี 2026 (intranet/employee portal + SSO app launcher)
> เทียบกับสถานะ Petabyte Portal · อัปเดต 2026-07-23

Portal ของเราอยู่ในประเภท **"SSO App Launcher"** (ประตูเดียวเข้าแอปทั้งหมด แบบ Okta dashboard / Microsoft My Apps) ซึ่งโตต่อเป็น **intranet เต็มรูปแบบ** ได้ในอนาคต — งานวิจัยแบ่งฟีเจอร์เป็น 2 ชั้นตามนี้

---

## ชั้นที่ 1 — หัวใจของ App Launcher Portal

| ฟีเจอร์ | มาตรฐานตลาด | Petabyte Portal |
|---------|-------------|-----------------|
| One-click SSO เข้าทุกแอป | เข้าแอปจากหน้าแรกคลิกเดียว login ครั้งเดียว | ✅ มีแล้ว (Entra ID) |
| App catalog + จัดการโดยแอดมิน | เพิ่ม/ซ่อน/จัดลำดับแอปจากหน้าจอเดียว | ✅ มีแล้ว (Access Manager + โลโก้) |
| สิทธิ์รายแอปตาม role/group | ผู้ใช้เห็นเฉพาะแอปที่มีสิทธิ์ | 🔜 roadmap ข้อ 7 (รอแอดมิน M365) |
| ค้นหาเร็ว | ช่อง search เด่น ทุกหน้า มี shortcut | ✅ มีแล้ว (⌘K) · เสริมได้ด้วย command palette จาก design |
| Personalization | favorites, recent, ปรับ density | ✅ มีแล้วครบสามตัว |
| Mobile-first / responsive | ใช้บนมือถือได้ลื่น touch-friendly | ⚠️ ได้บางส่วน — ควรทดสอบจริงบนมือถือ (sidebar ถูกซ่อนที่จอเล็ก ยังไม่มีเมนูทดแทน) |
| สถานะแอป (up/degraded/down) | ผู้ใช้รู้ก่อนคลิกว่าแอปล่มไหม | 🔜 มี spec ใน design แล้ว (status dots) |
| Usage analytics | รู้ว่าแอปไหนถูกใช้มาก/ไม่ถูกใช้ | ❌ ยังไม่มี — **น่าทำ**: log ตอนกดเปิดแอปลง DB ตารางเดียว ได้ข้อมูลตัดสินใจว่าควรซื้อ/เลิก license อะไร |

## ชั้นที่ 2 — ฟีเจอร์ Intranet เต็มรูปแบบ (โตทีหลังได้)

| ฟีเจอร์ | คุ้มไหมสำหรับเรา | หมายเหตุ |
|---------|------------------|----------|
| **ประกาศ/ข่าวบริษัท (announcements)** | 💡 **คุ้มสุดในกลุ่มนี้** | ตาราง announcement เล็ก ๆ + แสดงบน dashboard — และทำให้**กระดิ่งแจ้งเตือนมีของจริง**ทันที |
| Notification center | 💡 ต่อยอดจากประกาศ | โครง UI (กระดิ่ง+แผง) ทำรอไว้แล้ว |
| People directory / org chart | 💡 น่าสนใจ | ข้อมูลมีอยู่แล้วใน Entra — ค่อยดึงผ่าน Graph ภายหลัง |
| ภาษาไทย/อังกฤษ (multilingual) | 💡 พิจารณา | ทีมเป็นคนไทย ตอนนี้ UI อังกฤษล้วน — i18n ควรตัดสินใจก่อนเพิ่มหน้าจอเยอะกว่านี้ |
| Accessibility (WCAG) | 💡 ทำต่อเนื่อง | เริ่มแล้ว (reduced-motion) — เพิ่ม keyboard nav / contrast check |
| Dark mode | 🔜 อยู่ใน design แล้ว | spec CSS ครบใน `design/login.html` |
| Knowledge base / เอกสารกลาง | ⏸ ยังไม่ต้อง | ลิงก์เป็น "แอป" ใน catalog ไปก่อนได้ (เช่น DocsHub) |
| Social feed / comments / recognition | ❌ ข้ามไปก่อน | เหมาะองค์กรใหญ่ ทีมเราใช้ Teams อยู่แล้ว ซ้ำซ้อน |
| Enterprise search ข้ามระบบ / AI assistant | ⏸ อนาคต | เทรนด์ 2026 คือฝัง AI — ของเรามี PetabyteAi อยู่แล้ว เพิ่มเป็นแอปเด่นใน catalog ก่อน แล้วค่อยคิดเรื่องฝังลึก |

---

## ข้อเสนอลำดับถัดไป (เรียงตามคุ้มค่า/แรงที่ลง)

1. **Announcements + notification feed** — S–M · ปิดจุดอ่อนกระดิ่งว่าง + เป็นก้าวแรกสู่ intranet
2. **Usage logging (app open events)** — S · ตารางเดียว ได้ insight ยาว ๆ
3. **ทดสอบ + เก็บ mobile experience** — S–M · เพิ่มเมนูมือถือแทน sidebar ที่ถูกซ่อน
4. **Status dots** — M · spec มีแล้ว รอเชื่อม health check จริง (PetabyteAi มี `/api/health` เป็นตัวอย่าง)
5. **Dark mode** — M · spec มีแล้ว
6. **ตัดสินใจเรื่องสองภาษา** — ก่อน UI โตกว่านี้

แหล่งอ้างอิงหลัก: Reworked (10 In-Demand Intranet Features 2026), Sociabble (Top 15 Intranet Features), Happeo (Intranet Employee Portal Guide 2026), Oak Engage, ServiceNow App Launcher, Oloid (Enterprise SSO Best Practices)
