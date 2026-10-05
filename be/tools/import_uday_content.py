#!/usr/bin/env python3
"""Import a markdown-course repo (Uday_AWS shape) into skillom seed files.

Reads the source repo's registries — src/data/docsRegistry.json
(categories → courses → chapters with md file paths) and
src/data/courseRegistry.json (47-module masterclass) — plus the md files
they reference, and writes be/client/skillom/seed/{category,course,
chapter,revision}.json.

Seed files override inline entities.py sample_data in gen_mocks, so the
full catalog is served by the same generic read path (no engine change).

    python be/tools/import_uday_content.py ../Uday_AWS [skillom|uday]
    python be/tools/gen_mocks.py <client>

Id offsets keep hand-authored seed stable (categories 1-6, courses 1-9,
chapters 1-99): imported rows start at 10/100/1000/5000 respectively.
Idempotent — re-running regenerates the same seed files.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CLIENT_DIR = None  # set in main
SEED = None


def load_base_sample(entity):
    """Inline sample_data from entities.py — kept as the head of each seed."""
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "skillom_entities", CLIENT_DIR / "entities.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return list(mod.entities.get(entity, {}).get("sample_data") or [])


def read_md(repo: Path, content_base: str, filename: str) -> str | None:
    base = (content_base or "").strip("/")
    for cand in (
        repo / "public" / base / filename,
        repo / base.lstrip("/") / filename,
        repo / filename,
    ):
        if cand.exists():
            return cand.read_text(encoding="utf-8", errors="replace")
    return None


def import_repo(repo: Path):
    docs = json.loads((repo / "src/data/docsRegistry.json").read_text())
    master = json.loads((repo / "src/data/courseRegistry.json").read_text())

    categories = load_base_sample("category")
    courses = load_base_sample("course")
    chapters = load_base_sample("chapter")
    revisions = load_base_sample("revision")
    seen_codes = {c["code"] for c in categories}
    cat_ids = {c["code"]: c["id"] for c in categories}

    cat_id = 10
    course_id = 100
    chapter_id = 1000
    skipped = []

    for cat in docs.get("categories", []):
        code = cat["id"]
        if code not in seen_codes:
            categories.append({
                "id": cat_id, "name": cat.get("title", code),
                "code": code, "icon": cat.get("icon", ""), "order": cat_id,
            })
            seen_codes.add(code)
            cat_ids[code] = cat_id
            cat_id += 1
        cid = cat_ids[code]

        for course in cat.get("courses", []):
            courses.append({
                "id": course_id,
                "category_id": cid,
                "title": course.get("title", course["id"]),
                "code": f"{code}/{course['id']}",
                "status": "published",
                "description": course.get("description", cat.get("subtitle", "")),
            })
            base = course.get("contentBase") or cat.get("contentBase") or "/"
            for n, ch in enumerate(course.get("chapters", []), 1):
                md = read_md(repo, base, ch.get("file", ""))
                if md is None:
                    skipped.append(f"{code}/{course['id']}/{ch.get('file')}")
                    continue
                chapters.append({
                    "id": chapter_id,
                    "course_id": course_id,
                    "title": ch.get("title", ch["id"]),
                    "order": n,
                    "content_base": base,
                    "published_revision_id": chapter_id,
                })
                revisions.append({
                    "id": chapter_id,
                    "chapter_id": chapter_id,
                    "version_no": 1,
                    "author": "import",
                    "status": "published",
                    "md_content": md,
                })
                chapter_id += 1
            course_id += 1

    # ---- masterclass: 47 modules → one course ---------------------------
    mc_cat = cat_ids.get("aws-masterclass", 5)
    courses.append({
        "id": course_id,
        "category_id": mc_cat,
        "title": master.get("title", "AWS Production Masterclass"),
        "code": "aws-production-masterclass",
        "status": "published",
        "description": master.get("description", ""),
    })
    mc_course = course_id
    for n, mod in enumerate(master.get("modules", []), 1):
        num = mod.get("number") or str(n).zfill(2)
        md = None
        for folder in (repo / "public/chapters", repo / "chapters", repo):
            hits = sorted(folder.glob(f"Chapter_{num}_*.md")) if folder.exists() else []
            if hits:
                md = hits[0].read_text(encoding="utf-8", errors="replace")
                break
        if md is None:
            skipped.append(f"masterclass/{mod['id']}")
            continue
        chapters.append({
            "id": chapter_id,
            "course_id": mc_course,
            "title": mod.get("title", mod["id"]),
            "order": n,
            "content_base": "/chapters/",
            "published_revision_id": chapter_id,
        })
        revisions.append({
            "id": chapter_id,
            "chapter_id": chapter_id,
            "version_no": 1,
            "author": "import",
            "status": "published",
            "md_content": md,
        })
        chapter_id += 1

    SEED.mkdir(parents=True, exist_ok=True)
    for name, rows in (
        ("category", categories),
        ("course", courses),
        ("chapter", chapters),
        ("revision", revisions),
    ):
        (SEED / f"{name}.json").write_text(json.dumps(rows, indent=1) + "\n")

    print(
        f"seed → {SEED}: {len(categories)} categories, {len(courses)} courses, "
        f"{len(chapters)} chapters, {len(revisions)} revisions"
    )
    if skipped:
        print(f"skipped {len(skipped)} (md not found):")
        for s in skipped[:20]:
            print("  -", s)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python be/tools/import_uday_content.py <uday_repo_path> [client]")
        sys.exit(1)
    client = sys.argv[2] if len(sys.argv) > 2 else "skillom"
    CLIENT_DIR = ROOT / "be" / "client" / client
    SEED = CLIENT_DIR / "seed"
    repo = Path(sys.argv[1]).resolve()
    if not (repo / "src/data/docsRegistry.json").exists():
        sys.exit(f"{repo} does not look like a Uday_AWS checkout")
    import_repo(repo)
