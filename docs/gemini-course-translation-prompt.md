# Gemini Prompt — Course Content Translation (en → es, de, bn)

Copy the prompt below into Gemini (2.5 Pro / Deep Think recommended for long
JSON). Feed it **one chapter record at a time** (the full `chapter` list is
~444 records / several MB — too big for one shot). Source file:

```
fe/client/uday/mock/en/chapter/GET/success.json        ← { items: [...444] }
fe/client/uday/mock/en/course/GET/success.json         ← { items: [...] }
fe/client/uday/mock/en/category/GET/success.json
fe/client/uday/mock/en/translations/GET/success.json   ← UI chrome strings
```

Output lands at `fe/client/uday/mock/<lang>/<endpoint>/GET/success.json`
(`<lang>` = `es`, `de`, `bn`). The mock layer falls back to `en` per endpoint,
so partial trees are safe — add languages incrementally.

---

## THE PROMPT (paste this)

```
You are a localization engineer + native-level technical writer working on a
JSON-driven e-learning platform (AWS Production Masterclass — a hands-on cloud
engineering course). I will paste one JSON object = one "chapter" record.

TASK: Translate it into THREE languages and output THREE complete JSON objects:
1. es — Spanish
2. de — German
3. bn — Bengali

TONE — this is the most important part:
- Write the way a senior engineer friend explains things while pairing —
  natural, spoken, a little informal. NOT textbook prose, NOT overly formal.
- Spanish: use "tú" (never "usted"), everyday words ("vas a", "básicamente",
  "esto es lo que pasa"), contractions where natural.
- German: use "du" (never "Sie"), natural spoken phrasing ("schau dir",
  "im Grunde", "das heißt").
- Bengali: conversational modern Bengali — mix English technical terms
  naturally the way real Bengali developers speak (Banglish-style inside
  Bengali script, e.g. "bucket এ store হয়", "deploy করার আগে"). Don't use
  heavy/shuddho literary Bengali.
- Keep the teaching voice: encouraging, direct, concrete. Keep light humor
  if the source has any.
- Do NOT make sentences longer than needed — match the source's rhythm.

TRANSLATE (human-facing strings only):
- Top level: "title", "subtitle", "description", "intro", "duration"
  (localize the unit: "90 min" → "90 Min." de / "90 মিনিট" bn — keep number),
  every string in "objectives[]" and "prerequisites[]".
- Each object in "sections[]": "title" — and inside its "content" object,
  every human-readable string: "text", "title", "subtitle", "description",
  "label", "hint", "question", "explanation", "explanation_*" fields,
  "items[]"/"points[]"/"steps[]" strings and their nested "text"/"title",
  quiz "options[].text" + "explanation", lab "steps[]" text, challenge
  "instructions"/"hints", interview "q"/"a", table cell text.
- Keep markdown markup inside strings intact (**bold**, `code`, [links](url),
  # headings, bullet markers). Translate the prose, not the syntax.
- Keep embedded HTML tags untouched; translate only the text nodes.

DO NOT TRANSLATE / DO NOT MODIFY:
- JSON keys, "id", "slug", "type", "order", "course_id", "icon" (emoji),
  "color", "color_bg", "published_revision_id", numbers, booleans, nulls.
- Code blocks ("code", "commands[]", "language", filenames, shell commands,
  CLI flags, JSON/YAML snippets) — translate ONLY human comments inside them
  if the source comments are prose; never change runnable syntax.
- Expected terminal/command "output" strings (they must match what a real
  AWS CLI prints — always English).
- AWS/service/product names and acronyms: S3, EC2, Lambda, VPC, IAM, RDS,
  CloudWatch, bucket, pre-signed URL, NAT Gateway, ENI — keep as-is
  (Bengali: keep in Latin script, do not transliterate).
- Placeholder tokens like {n}, {a}, {b}, :id — keep verbatim.
- "correctId"/option "id" values — never touch.
- Structural fields: "width", "height", "x", "y" (diagram coords).

HARD RULES:
- Output must be byte-identical JSON structure — same keys, same order,
  same array lengths, same nesting. Only string VALUES change.
- If a field is ambiguous whether it's UI text or a system value, keep it
  in English — never break the contract.
- Escape properly: \" inside strings, \n newlines, UTF-8 for accents/
  Devanagari/Bengali script.
- Output EXACTLY three fenced code blocks, in order, each prefixed with a
  one-line header:  === es ===  /  === de ===  /  === bn ===
- No commentary, no explanations — just the three blocks.

Here is the chapter record:

<PASTE ONE CHAPTER JSON OBJECT HERE>
```

---

## Batching plan (47 modules + extras)

```
Batch 1: course/GET/success.json          (all courses — small)
Batch 2: category/GET/success.json        (categories — small)
Batch 3-49: chapter items one by one      (module-01 … module-47 — each ~40KB)
Batch 50: translations/GET/success.json   (32 UI keys — tiny)
Extras:   doc chapters (id 1000-series)   — only if you want them localized
```

For each language collect the translated chapter objects, then assemble:

```bash
# wrap into the list envelope per language:
python3 - << 'PY'
import json
items = [json.load(open(f)) for f in sorted(glob_mod_files)]   # keep order!
json.dump({"items": items, "page":1, "size":len(items), "total":len(items)},
          open('fe/client/uday/mock/es/chapter/GET/success.json','w'),
          indent=2, ensure_ascii=False)
PY
# repeat for de, bn
```

## Verification after each language lands

```bash
# 1. valid JSON
python3 -c "import json; d=json.load(open('fe/client/uday/mock/es/chapter/GET/success.json')); print(len(d['items']))"
# 2. structural parity — same keys/order as en
python3 - << 'PY'
import json
def keys(o,p=''):
    out=set()
    if isinstance(o,dict):
        for k,v in o.items(): out|={f'{p}.{k}'}|keys(v,f'{p}.{k}')
    elif isinstance(o,list) and o: out|=keys(o[0],p+'[]')
    return out
en=json.load(open('fe/client/uday/mock/en/chapter/GET/success.json'))['items'][0]
es=json.load(open('fe/client/uday/mock/es/chapter/GET/success.json'))['items'][0]
print('missing in es:', keys(en)-keys(es)); print('extra in es:', keys(es)-keys(en))
PY
# 3. mock tree check
cd fe/app && node scripts/check-mocks.mjs
# 4. browser: switch language in the header picker → Spanish/German/Bengali
#    chapter should render localized content; missing pieces fall back to en.
```

## Notes

- UI language list is config-driven (`be/client/<c>/configuration.json`
  `language[]`) — `es`, `de`, `bn` are already added for uday + skillom.
- The `hi` tree exists already (chrome translations only). Hindi content can
  reuse this exact prompt — swap the tone block to "Hinglish": Hindi in
  Devanagari with English tech terms/code-switching, casual spoken register.
- Same prompt works for skillom — its mock tree is
  `fe/client/skillom/mock/<lang>/...` with the same shape.
