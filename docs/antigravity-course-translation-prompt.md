# Antigravity Agent Task — Course Content Translation (en → es, de, bn)

This repo is a JSON-driven learning platform. Course content lives in
client-owned mock files; languages resolve per-endpoint with `en` fallback —
so translated trees can land incrementally.

Source of truth for content (English):

```
fe/client/uday/mock/en/chapter/GET/success.json        ← {items:[444]} — main
fe/client/uday/mock/en/course/GET/success.json
fe/client/uday/mock/en/category/GET/success.json
fe/client/uday/mock/en/translations/GET/success.json   ← UI chrome strings
```

Output trees (create these dirs):

```
fe/client/uday/mock/es/<endpoint>/GET/success.json
fe/client/uday/mock/de/<endpoint>/GET/success.json
fe/client/uday/mock/bn/<endpoint>/GET/success.json
```

Languages `es`, `de`, `bn` are already registered in
`be/client/{uday,skillom}/configuration.json` → `language[]`; the
LanguageSwitcher shows them automatically. Nothing else to wire.

---

## TASK PROMPT (give this to the Antigravity agent)

```
Translate this repo's English course content into Spanish (es), German (de),
and Bengali (bn). Work file-by-file; keep every output file valid JSON that
mirrors the source structure exactly.

SOURCE FILES → OUTPUT FILES
  fe/client/uday/mock/en/category/GET/success.json
      → fe/client/uday/mock/{es,de,bn}/category/GET/success.json
  fe/client/uday/mock/en/course/GET/success.json
      → fe/client/uday/mock/{es,de,bn}/course/GET/success.json
  fe/client/uday/mock/en/translations/GET/success.json
      → fe/client/uday/mock/{es,de,bn}/translations/GET/success.json
  fe/client/uday/mock/en/chapter/GET/success.json   (~444 items, ~40KB each)
      → fe/client/uday/mock/{es,de,bn}/chapter/GET/success.json
      Translate EVERY item; write one success.json per language with the same
      {items:[...], page, size, total} envelope and the same item order.

TONE — most important:
- Natural spoken register, like a senior engineer friend explaining while
  pairing. Not textbook prose.
- es: "tú" never "usted"; everyday phrasing ("vas a", "básicamente").
- de: "du" never "Sie"; natural spoken German ("schau dir", "im Grunde").
- bn: conversational modern Bengali in Bengali script with English tech
  terms naturally mixed (Banglish) — e.g. "bucket এ store হয়" — never heavy
  literary/shuddho Bengali; keep ALL technical terms in Latin script.
- Keep the source's rhythm; don't expand sentences.

TRANSLATE (human-facing strings):
- Top level: title, subtitle, description, intro, duration (localize unit:
  "90 min" → "90 Min." de / "90 মিনিট" bn; keep the number),
  objectives[], prerequisites[].
- sections[]: "title", and inside "content" every human-readable string —
  text, title, subtitle, description, label, hint, question, explanation,
  items[]/points[]/steps[] nested text/title, quiz options[].text +
  explanation, lab steps[] text, challenge instructions/hints, interview
  q/a, table cell text.
- Keep markdown syntax inside strings intact (**bold**, `code`, links,
  headings). Keep HTML tags untouched; translate text nodes only.

DO NOT TOUCH:
- JSON keys, id, slug, type, order, course_id, icon (emoji), color,
  color_bg, published_revision_id, numbers, booleans, nulls.
- Code blocks, commands, filenames, shell commands, CLI flags, JSON/YAML
  snippets (translate only human comments if they are prose).
- Expected terminal/command "output" — must stay English (real AWS CLI
  output is English).
- AWS/service/product names and acronyms: S3, EC2, Lambda, VPC, IAM, RDS,
  CloudWatch, NAT Gateway, ENI, pre-signed URL — verbatim, Latin script.
- Placeholder tokens {n}, {a}, {b}, :id.
- correctId and option "id" values.
- Diagram coords: width, height, x, y.

HARD RULES:
- Byte-identical structure: same keys, order, array lengths, nesting.
  Only string VALUES change.
- Ambiguous field → leave English. Never break the contract.
- Valid JSON: escaped quotes, \n, UTF-8 for accents/Devanagari/Bengali.
- No commentary in output files — pure JSON.

PROCESS:
1. Start with translations, category, course (small files) for all 3 langs.
2. Then chapter/GET — iterate items in order; to keep files manageable you
   may write per-chapter objects to a scratch dir first, then assemble the
   final {items:[...]} success.json preserving source order (match on "id").
3. After each file: `python3 -c "import json; json.load(open('<path>'))"`.
4. After a language completes: run the parity check below, fix any diff.

PARITY CHECK (run per language, fix before finishing):
  python3 - << 'PY'
  import json
  def keys(o,p=''):
      out=set()
      if isinstance(o,dict):
          for k,v in o.items(): out|={f'{p}.{k}'}|keys(v,f'{p}.{k}')
      elif isinstance(o,list) and o: out|=keys(o[0],p+'[]')
      return out
  en=json.load(open('fe/client/uday/mock/en/chapter/GET/success.json'))['items']
  xx=json.load(open('fe/client/uday/mock/LANG/chapter/GET/success.json'))['items']
  assert len(en)==len(xx), f'item count {len(en)} vs {len(xx)}'
  d=keys(en[0])^keys(xx[0]); print('key diff:', d or 'none')
  assert [i['id'] for i in en]==[i['id'] for i in xx], 'order/id mismatch'
  PY

Then: cd fe/app && node scripts/check-mocks.mjs
```

---

## Notes for the human driving this

- One agent run per language is the safest chunking; chapter/GET alone is
  multi-MB in English — expect the agent to take a while on it.
- Hindi (`hi`) content can reuse the same prompt — swap the tone block to
  "Hinglish": Devanagari Hindi, English tech terms/code-switching, casual.
- Same prompt works for `fe/client/skillom/mock/en/...` (same shape) if you
  want Skillom localized too.
- After files land, verify in browser: header language picker → es/de/bn →
  chapter renders localized; anything missing falls back to English by
  design.
