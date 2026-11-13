# Downloadable skills

วันที่: 2026-11-13 (Asia/Bangkok)

Fellow Skill Compass มี skill ดาวน์โหลด 6 รายการ เวอร์ชัน `1.0.0` ใน branch นี้ เปิด **Find your skills** ที่ `/discover` เพื่อตอบ survey ดูคำแนะนำ และดาวน์โหลด ZIP เว็บไซต์ production ยังไม่ได้รับการ deploy feature นี้

Skill คือคำสั่งที่ AI เรียกใช้ซ้ำได้ ระบุว่าเมื่อไรควรใช้ ทำงานอย่างไร และให้ผลลัพธ์แบบไหน ทั้งหกชุดใช้ข้อมูลที่ผู้ใช้เตรียมเป็นข้อความและให้ผลแบบข้อความ ไม่มีสคริปต์ connector หรือบริการภายนอกของตัวเอง การอ่าน attachment และสิทธิ์ติดตั้งขึ้นอยู่กับเครื่องมือปลายทาง

## เลือก skill

| Skill / คำสั่งต้นฉบับ | สิ่งที่เตรียม | ผลลัพธ์และแบบฝึก |
| --- | --- | --- |
| [Research Evidence Brief](../content/skills/fellow-research-evidence-brief/SKILL.md) | คำถามและ source excerpts หรือบันทึกที่อ้างกลับได้ | Evidence brief แยกข้อค้นพบ ความเห็นต่าง และข้อจำกัด; [ตัวอย่าง onboarding](../content/skills/fellow-research-evidence-brief/references/example.md) |
| [Decision Brief](../content/skills/fellow-decision-brief/SKILL.md) | ตัวเลือก ข้อมูลที่มี และเกณฑ์หรือข้อจำกัด | Comparison และคำแนะนำแบบมีเงื่อนไข แยก unknown จากไม่ผ่าน; [ตัวอย่างเปรียบเทียบราคา](../content/skills/fellow-decision-brief/references/example.md) |
| [Presentation Storyline](../content/skills/fellow-presentation-storyline/SKILL.md) | ข้อเท็จจริง ผู้ฟัง และสิ่งที่อยากให้เข้าใจหรือตัดสินใจ | Storyboard พร้อมข้อความหลัก evidence และ speaker notes; [ตัวอย่าง pilot](../content/skills/fellow-presentation-storyline/references/example.md) ไม่มีการสร้างไฟล์สไลด์ |
| [Meeting Follow-through](../content/skills/fellow-meeting-follow-through/SKILL.md) | บันทึกหรือ transcript; วันที่และผู้รับถ้าทราบ | Recap ข้อตกลง ตารางงาน คำถามค้าง และร่างติดตามที่ยังไม่ส่ง; [ตัวอย่างประชุม](../content/skills/fellow-meeting-follow-through/references/example.md) |
| [Workflow Improvement](../content/skills/fellow-workflow-improvement/SKILL.md) | ขั้นตอน บทบาท ปัญหา และข้อจำกัดปัจจุบัน | Current-state map และข้อเสนอทดลองปรับจุดเล็ก ๆ; [ตัวอย่างเบิกค่าใช้จ่าย](../content/skills/fellow-workflow-improvement/references/example.md) ไม่อ้าง savings ที่ไม่ได้วัด |
| [Reusable Workflow Blueprint](../content/skills/fellow-reusable-workflow-blueprint/SKILL.md) | ตัวอย่างที่เคยทำ runbook หรือรายละเอียดงานซ้ำ พร้อมผลที่ต้องการ | Blueprint ของ inputs, decisions, outputs และ acceptance cases; [ตัวอย่างรายงาน support](../content/skills/fellow-reusable-workflow-blueprint/references/example.md) ไม่มีการติดตั้งหรือรัน automation |

แต่ละโฟลเดอร์มี `references/output-template.md` ที่ออกแบบตามงานนั้น เช่น decision brief แสดงการเทียบ constraint และต้นทุน ส่วน meeting แยก confirmed decisions กับ agreed actions ตัวอย่างใน `references/example.md` มี input และผลที่คาดหวังครบ พร้อมจุดที่ตรวจได้ ไม่ใช่ placeholder ให้เติมเองทั้งหมด

## ภายใน ZIP และการสร้าง distribution

แต่ละ ZIP มีโฟลเดอร์ชื่อ skill เป็นชั้นแรก รวมเพียง 3 ไฟล์ ไม่รวมคู่มือนี้ คำตอบ survey หรือข้อมูลผู้ใช้:

```text
fellow-meeting-follow-through-1.0.0.zip
└── fellow-meeting-follow-through/
    ├── SKILL.md
    └── references/
        ├── output-template.md
        └── example.md
```

สร้างทั้งหก ZIP จาก repository root หลัง `npm ci`:

```sh
npm run build:skills
```

คำสั่งอ่าน `src/data/skills.json` และต้นฉบับใน `content/skills/` ตรวจชื่อ เวอร์ชัน โครงสร้างและ reference แล้วสร้าง:

- `public/downloads/skills/<skill-id>-1.0.0.zip`: static assets ที่ไม่เก็บใน Git แต่รวมไปกับ production build
- `src/data/skill-downloads.json`: manifest ที่เก็บใน Git มีชื่อไฟล์ URL ขนาด รายการไฟล์ และ SHA-256 ของแต่ละ ZIP

เนื้อหาต้นฉบับและ metadata เดิมให้ distribution เดิม การเปลี่ยนคำสั่งหรือ reference ต้อง build ใหม่และทบทวน manifest ทุกครั้ง แก้ต้นฉบับใน `content/skills/` ไม่แก้ ZIP โดยตรง `predev`, `pretest` และ `prebuild` เรียกคำสั่งนี้ให้อัตโนมัติ; เมื่อ dev server เปิดอยู่แล้วต้องสั่ง build ใหม่หลังแก้ skill

ในหน้าผลกด Download skill แล้วตรวจรายการไฟล์หรือ SHA-256 ได้จากแผงคู่มือ การดาวน์โหลดให้ไฟล์แก่ผู้ใช้ ไม่ได้ติดตั้งให้เอง

## ใช้กับ ChatGPT / Codex (OpenAI)

Survey รวม ChatGPT และ Codex เป็นตัวเลือกเดียว เพราะทั้งคู่รองรับ skills ในกลุ่มเครื่องมือ OpenAI ตาม [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills) วิธีนำเข้าและใช้งานขึ้นกับแอป โดย ZIP ของโครงการนี้เป็น standalone skill folder ไม่ใช่ plugin package

ใน ChatGPT desktop เปิด Skills ใน sidebar เพื่อดู skills ที่มี ส่วน skills ที่แจกผ่าน plugins ใช้ได้ใน ChatGPT บนเว็บ desktop และ mobile เส้นทางติดตั้ง ZIP ที่ตรวจจริงในโครงการนี้คือ local Codex ตามขั้นตอนต่อไปนี้ ยังไม่ได้ทดสอบการนำเข้าใน ChatGPT desktop

แตก ZIP แล้ววางโฟลเดอร์ชื่อ skill ใน `.agents/skills/` ของโปรเจกต์ที่ต้องการใช้ หรือ `~/.agents/skills/` สำหรับใช้ส่วนตัวข้ามโปรเจกต์ ตรวจให้เส้นทางลงท้ายด้วย `<skill-id>/SKILL.md` อย่าเขียนทับ skill เดิมโดยไม่ตรวจเวอร์ชัน

เปิด Codex ในโปรเจกต์นั้น ตรวจว่าพบ skill แล้วเรียกใช้ด้วยชื่อ พร้อมวางข้อความหรือแนบข้อมูลที่เครื่องมืออ่านได้ ตัวอย่าง:

```text
Use $fellow-meeting-follow-through to summarize these meeting notes in Thai.
Extract confirmed decisions and agreed actions, then prepare an internal follow-up draft.

Internal meeting, 13 November 2026, Asia/Bangkok.
1. Narin agreed to send the test checklist by 16 November.
2. Pim proposed a 20 November launch, but no launch date was agreed.
3. The team agreed to keep the pilot internal until the security review is complete.
4. The customer FAQ has no assigned owner or agreed deadline.
```

ผลควรแยกข้อเสนอวัน launch ออกจากข้อตกลง รักษาเจ้าของและวันส่ง checklist ไม่แต่งเจ้าของ FAQ และไม่ส่งข้อความให้ใคร อ้างอิงรูปแบบและเส้นทางจาก [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills)

## ใช้กับ Claude หรือแชตอื่น

ตาม [Claude: Use skills](https://support.claude.com/en/articles/12512180-use-skills-in-claude) ให้เปิดความสามารถที่จำเป็นตามบัญชี/องค์กร แล้วไป Customize → Skills เลือกอัปโหลด skill นำเข้า ZIP และเปิดใช้ จากนั้นส่งข้อมูลพร้อมระบุชื่อ skill โครงแพ็กเกจอ้างอิง [Claude: Create custom skills](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills) หากไม่มีเมนูอัปโหลดให้ตรวจสิทธิ์และการตั้งค่าองค์กร คู่มือนี้ยังไม่ใช่ผลทดสอบ import ใน Claude

หากต้องการลองงานในแชตก่อนติดตั้ง skill กด **Copy sample task** ได้ การคัดลอกข้อความหรือแนบ ZIP เข้าไปในบทสนทนาไม่ได้ลงทะเบียน skill ให้ระบบ

## สิ่งที่ตรวจแล้วและยังไม่ตรวจ

- ทั้ง 6 skill ผ่านตัวตรวจ `quick_validate.py` และการตรวจแพ็กเกจว่ามี 3 ไฟล์ตามต้นฉบับ reference ครบ และ checksum ตรง
- มี instruction-guided trial ด้วยโจทย์จำลองใหม่อย่างละหนึ่งงาน โดย agent ที่ไม่ได้เขียน skill แต่เป็นผู้ตรวจผลของตัวเอง จึงไม่ใช่ blinded evaluation หรือผลรับรองความเสถียรจากการรันซ้ำ
- Native Codex ในโปรเจกต์ชั่วคราวค้นพบทั้ง 6 skill และเรียก Meeting Follow-through โดยระบุชื่อสำเร็จ ผลภาษาไทยแยกข้อเสนอ ข้อตกลง และงานที่ยังไม่มีเจ้าของได้ ไม่แก้ไฟล์ skill ที่ผู้ใช้ติดตั้งไว้
- ยังไม่ได้ตรวจ automatic triggering, native invocation ของอีก 5 skill หรือ Claude import/invocation และไม่ได้ทดสอบทุกเวอร์ชันหรือสิทธิ์บัญชี
- เว็บไซต์ branch นี้มีหน้า Download แล้ว แต่ยังไม่เผยแพร่สู่ production

หลักฐาน native อยู่ที่ `/private/tmp/fellow-native-skill-check/summary.md` และ instruction-guided trials อยู่ที่ `/private/tmp/fellow-skill-quality/` เป็นหลักฐานชั่วคราวบนเครื่องนี้ ดู [QA](qa.md) สำหรับผล browser checks, ข้อสังเกตจาก trials และข้อจำกัดล่าสุด การดาวน์โหลดสำเร็จไม่ยืนยันว่าติดตั้ง เรียกใช้ หรือทำงานเสร็จแล้ว
