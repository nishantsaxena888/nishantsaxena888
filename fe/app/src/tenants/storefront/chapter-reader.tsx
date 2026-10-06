// Generic chapter/doc reader — the learning-platform surface. Def
// (usually a `pages/<slug>` detail route like /learn/:id) declares:
//   actions: <doc>/:id (title/meta) + <revision-entity>?<doc>_id=:id
//            + optional <doc> list (sidebar siblings, content.siblings_key)
// The component picks the pinned/latest published revision, parses its
// md_content through ./md-sections, and renders typed sections via
// ./md-render (shared with md-viewer). A sibling sidebar lists the
// course's chapters with completion state; prev/next footers navigate
// content.reader_path (default /learn/:id). Session writes (progress)
// go through the SessionBridge prop — the def's lazy actions handle
// entity writes (e.g. quiz_submission POST).
import { useEffect, useMemo, useState } from "react";
import { useNav } from "@/platform/navigation";
import { useLanguage } from "@/components/shared/use-language";
import { LanguageSwitcher } from "@/components/shared/language-selector/language-switcher";
import { useTheme } from "@/components/shared/use-theme";
import { Pressable, Text, View } from "@/platform/primitives";
import { useRenderEngine } from "@/engine/render-engine/features/render-engine-context";
import { parseMd, type MdSection } from "./md-sections";
import { MdDoc, MdToc } from "./md-render";
import SlideEngine from "./slide-engine";
import RowActions from "./entity-actions";
import { makeTr } from "./utils";

const toItems = (res: any): any[] =>
  Array.isArray(res) ? res : res?.items ?? res?.data ?? [];

export default function ChapterReader({ content, actionData, session }: any) {
  const navigate = useNav().navigate;
  const t = makeTr(useLanguage().t);
  const { theme, setTheme } = useTheme();
  const { componentMap } = useRenderEngine();
  const [popup, setPopup] = useState<"detail" | "notes" | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chapter =
    actionData?.data?.chapter?.data ?? actionData?.data?.chapter;
  const revisions = toItems(actionData?.data?.revisions).filter(
    (r: any) => !chapter?.id || r.chapter_id === chapter.id,
  );
  // Sibling chapters for the sidebar — same course, ordered.
  const siblings = toItems(actionData?.data?.[content?.siblings_key || "chapters"])
    .filter((s: any) => chapter?.course_id != null && s.course_id === chapter.course_id)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  const idx = siblings.findIndex((s: any) => s.id === chapter?.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const readerPath = content?.reader_path || "/learn";

  const progressItems =
    session?.items?.(content?.progress_session || "progress") || [];
  const done = new Set(progressItems.map((p: any) => p.id));
  const pct = siblings.length
    ? Math.round(
        (siblings.filter((s: any) => done.has(`ch-${s.id}`)).length /
          siblings.length) *
          100,
      )
    : 0;

  // Per-module progress — the source tracks section-level reads, so each
  // sidebar row shows its own % (8% = 1 of 13 sections). Section views are
  // recorded as `sec-<chapterId>-<sectionId>` progress items by the
  // scrollspy below.
  const secsDoneByChapter = progressItems.reduce(
    (m: Record<number, Set<string>>, p: any) => {
      const mt = /^sec-(\d+)-(.+)$/.exec(p.id || "");
      if (mt) (m[+mt[1]] ||= new Set()).add(mt[2]);
      return m;
    },
    {},
  );
  const chapterPct = (s: any) => {
    if (done.has(`ch-${s.id}`)) return 100;
    const total = Array.isArray(s.sections) ? s.sections.length : 0;
    if (!total) return 0;
    return Math.round(((secsDoneByChapter[s.id]?.size ?? 0) / total) * 100);
  };

  // Published copy: prefer the chapter's pinned revision, else latest
  // published, else latest anything (draft preview for authors).
  const rev =
    revisions.find((r: any) => r.id === chapter?.published_revision_id) ||
    revisions
      .filter((r: any) => r.status === "published")
      .sort((a: any, b: any) => (b.version_no ?? 0) - (a.version_no ?? 0))[0] ||
    revisions.sort(
      (a: any, b: any) => (b.version_no ?? 0) - (a.version_no ?? 0),
    )[0];

  const parsed = useMemo(
    () =>
      rev?.md_content ? parseMd(rev.md_content) : { sections: [] as MdSection[] },
    [rev],
  );

  // Structured lesson mode: chapters carrying a typed `sections[]` payload
  // render through the slide engine (typed interactive sections); markdown
  // stays available via the "Detailed Chapter" popup. Doc chapters keep
  // rendering markdown inline as before.
  const slides: any[] | null =
    Array.isArray(chapter?.sections) && chapter.sections.length > 0
      ? chapter.sections
      : null;

  // `md-<tag>` tenant components render extended directives (see
  // md-viewer); unregistered tags degrade to attr callouts.
  const resolveWidget = (sec: Extract<MdSection, { type: "widget" }>) => {
    const Comp = componentMap?.[`md-${sec.tag.toLowerCase()}`] as any;
    if (!Comp) return undefined;
    return <Comp section={sec} attrs={sec.attrs || {}} content={content} />;
  };

  const markComplete = () => {
    if (chapter?.id == null) return;
    session?.update(content?.progress_session || "progress", {
      id: `ch-${chapter.id}`,
      chapter_id: chapter.id,
      completed: true,
      at: new Date().toISOString(),
    });
  };

  const openChapter = (ch: any) => {
    session?.update("recent", {
      id: `ch-${ch.id}`,
      name: ch.title,
      kind: "chapter",
      at: new Date().toISOString(),
    });
    navigate(`${readerPath}/${ch.slug || ch.id}`);
  };

  // Scrollspy — the context panel highlights the section in view, same as
  // the source's LessonViewer → ContextPanel wiring. `seen` is tagged with
  // the chapter id so a sibling navigation falls back to the new
  // chapter's first section instead of a stale id.
  const [seen, setSeen] = useState<{ ch: any; id: string } | null>(null);
  const chapterId = chapter?.id;
  const activeSection =
    seen && seen.ch === chapterId ? seen.id : (slides?.[0]?.id ?? null);

  // New chapter mounts = new page in the source — scroll back to top.
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [chapterId]);

  useEffect(() => {
    if (!slides?.length || typeof IntersectionObserver === "undefined") return;
    // highlight zone — narrow band like the source's scroll spy
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setSeen({ ch: chapter?.id, id: e.target.id });
        }
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    // read tracking — a section counts once it scrolls into view
    const seen = new Set<string>();
    const read = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || seen.has(e.target.id)) continue;
          seen.add(e.target.id);
          session?.update(content?.progress_session || "progress", {
            id: `sec-${chapter?.id}-${e.target.id}`,
            chapter_id: chapter?.id,
            section_id: e.target.id,
            at: new Date().toISOString(),
          });
        }
      },
      { rootMargin: "-56px 0px 0px 0px" },
    );
    for (const s of slides) {
      const el = s?.id && document.getElementById(s.id);
      if (el) {
        spy.observe(el);
        read.observe(el);
      }
    }
    return () => {
      spy.disconnect();
      read.disconnect();
    };
    // Re-attach only when the section list itself changes — session/content
    // objects churn on every progress write and must not thrash observers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides]);

  const tb = content?.topbar;

  // Only the very first load shows a spinner — on sibling navigation the
  // previous chapter stays mounted while the refetch is in flight
  // (stale-while-revalidate), otherwise every sidebar click blanks the page.
  if (actionData?.loading && !chapter) {
    return (
      <View as="section" className="chapter-reader p-6">
        <Text>{content?.loading_label || t("common.loading","Loading…")}</Text>
      </View>
    );
  }

  return (
    <View className="reader-page">
      {tb && (
        <View className="reader-topbar">
          <View className="reader-topbar-brand">
            {siblings.length > 0 && (
              <Pressable
                className="topbar-menu-btn"
                aria-label="Toggle navigation"
                onPress={() => setSidebarOpen((o) => !o)}
              >
                ☰
              </Pressable>
            )}
            <Pressable
              className="reader-topbar-logo"
              onPress={() => navigate(tb.home || "/")}
            >
              {tb.logo || ""}
            </Pressable>
            <View className="reader-topbar-divider" />
            <Text className="reader-topbar-title">
              {(tb.title_tpl || "{title}")
                .replace("{no}", String(chapter?.order ?? "").padStart(2, "0"))
                .replace("{title}", chapter?.title || "")}
            </Text>
          </View>
          <View className="reader-topbar-actions">
            <Pressable className="topbar-btn" onPress={() => setPopup("detail")}>
              {tb.details_label || `📄 ${t("popup.detailedChapter","Detailed Chapter")}`}
            </Pressable>
            <Pressable className="topbar-btn" onPress={() => setPopup("notes")}>
              {tb.notes_label || `🧪 ${t("popup.labNotes","Lab Notes")}`}
            </Pressable>
            {chapter && content?.chapter_actions && (
              <RowActions
                entity={content.chapter_entity || "chapter"}
                item={chapter}
                actions={content.chapter_actions}
                reload={() =>
                  actionData?.action?.({ key: "chapter", type: "reload" })
                }
              />
            )}
            {tb.language_picker && (
              <View className="topbar-lang">
                <LanguageSwitcher />
              </View>
            )}
            {tb.theme_toggle !== false && (
              <Pressable
                className="topbar-btn topbar-btn-theme"
                onPress={() =>
                  setTheme(
                    theme === (tb.dark_theme || "dark")
                      ? tb.light_theme || "default"
                      : tb.dark_theme || "dark",
                  )
                }
              >
                {theme === (tb.dark_theme || "dark") ? "☀️" : "🌙"}
              </Pressable>
            )}
            {siblings.length > 0 && (
              <View className="topbar-progress">
                <Text>{pct}%</Text>
                <View className="topbar-progress-bar">
                  <View className="topbar-progress-fill" style={{ width: `${pct}%` }} />
                </View>
              </View>
            )}
          </View>
        </View>
      )}
      <View className="reader-layout">
      {siblings.length > 0 && (
        <View
          as="aside"
          className={`reader-sidebar${sidebarOpen ? " open" : ""}`}
        >
          <Text className="reader-sidebar-label">{t("sidebar.modules","Modules")}</Text>
          {siblings.map((s: any, i: number) => (
            <Pressable
              key={s.id}
              className={`reader-side-item${s.id === chapter?.id ? " active" : ""}`}
              onPress={() => {
                setSidebarOpen(false);
                openChapter(s);
              }}
            >
              <Text className="reader-side-icon">{s.icon || content?.item_icon || "📄"}</Text>
              <Text className="reader-side-title">
                {String(s.order ?? i + 1).padStart(2, "0")}. {s.title}
              </Text>
              {chapterPct(s) >= 100 ? (
                <Text className="reader-side-done">✓</Text>
              ) : (
                chapterPct(s) > 0 && (
                  <Text className="reader-side-pct">{chapterPct(s)}%</Text>
                )
              )}
            </Pressable>
          ))}
          {tb && (
            <View className="reader-sidebar-footer">
              <Pressable
                className="back-link"
                onPress={() =>
                  navigate(
                    `${content?.back_path || "/courses"}/${chapter?.course_id ?? ""}`,
                  )
                }
              >
                {content?.back_label || t("common.backToCourse","← Back to Course")}
              </Pressable>
            </View>
          )}
        </View>
      )}
      <View as="article" className="chapter-reader">
        <View className={slides ? "lesson-container" : undefined}>
        {!tb && (
          <View className="chapter-topbar">
            <Pressable
              className="back-link"
              onPress={() =>
                navigate(
                  `${content?.back_path || "/courses"}/${chapter?.course_id ?? ""}`,
                )
              }
            >
              {content?.back_label || t("common.backToCourse","← Back to Course")}
            </Pressable>
            <View className="chapter-topbar-actions">
              <Pressable className="btn btn-secondary" onPress={() => setPopup("detail")}>
                📄 {t("popup.detailedChapter","Detailed Chapter")}
              </Pressable>
              <Pressable className="btn btn-secondary" onPress={() => setPopup("notes")}>
                📝 {t("popup.labNotes","Lab Notes")}
              </Pressable>
              {siblings.length > 0 && (
                <Text className="reader-side-pct">{pct}%</Text>
              )}
            </View>
          </View>
        )}
        {slides ? (
          <View className="lesson-header">
            <View className="breadcrumbs">
              <Text className="current">{chapter?.subtitle || chapter?.title}</Text>
            </View>
            <View className="lesson-header-meta">
              <Text className={`badge difficulty-${chapter.difficulty || "beginner"}`}>
                {chapter.difficulty || "beginner"}
              </Text>
              {chapter?.duration && (
                <Text className="badge badge-neutral">⏱ {chapter.duration}</Text>
              )}
              {chapter?.prerequisites?.length > 0 && (
                <Text className="badge badge-accent">
                  {(content?.requires_label || t("lesson.requires","Requires:"))}{" "}
                  {chapter.prerequisites.join(", ")}
                </Text>
              )}
            </View>
            <Text as="h1">
              {chapter?.subtitle || chapter?.title || content?.title || t("common.chapter","Chapter")}
            </Text>
            {(chapter?.intro || chapter?.description) && (
              <Text as="p" className="lesson-header-desc">
                {chapter.intro || chapter.description}
              </Text>
            )}
            {chapter?.objectives?.length > 0 && (
              <View className="lesson-objectives">
                <Text as="h4">🎯 {t("lesson.objectives","Learning Objectives")}</Text>
                <View as="ul">
                  {chapter.objectives.map((o: string, i: number) => (
                    <Text as="li" key={i}>{o}</Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : (
          <>
            <View className="chapter-meta-row">
              {chapter?.difficulty && (
                <Text className={`badge difficulty-${chapter.difficulty}`}>
                  {chapter.difficulty}
                </Text>
              )}
              {chapter?.duration && (
                <Text className="chapter-meta-chip">🕐 {chapter.duration}</Text>
              )}
              {rev && (
                <Text className="chapter-meta-chip">
                  v{rev.version_no} · {rev.status}
                </Text>
              )}
            </View>
            <Text as="h1" className="chapter-title">
              {chapter?.title || content?.title || t("common.chapter","Chapter")}
            </Text>
            {chapter?.description && (
              <Text as="p" className="chapter-desc">{chapter.description}</Text>
            )}
          </>
        )}
        {slides ? (
          <SlideEngine
            sections={slides}
            labels={content?.slide_labels}
            onNavigate={(slug: string) => navigate(`${readerPath}/${slug}`)}
            onQuizAnswer={(correct: boolean, i: number) =>
              actionData?.action?.({
                key: content?.quiz_action || "submit_quiz",
                type: "filter",
                data: {
                  chapter_id: chapter?.id,
                  quiz_id: `ch${chapter?.id}-q${i}`,
                  score: correct ? 1 : 0,
                  total: 1,
                },
              })
            }
            onQuizComplete={(sectionId: string, correct: number, total: number) =>
              session?.update(content?.quiz_session || "quizzes", {
                id: `${chapter?.id}-${sectionId}`,
                chapter_id: chapter?.id,
                score: correct,
                total,
                at: new Date().toISOString(),
              })
            }
            onLabComplete={(sectionId: string) =>
              session?.update(content?.lab_session || "labs", {
                id: `${chapter?.id}-${sectionId}`,
                chapter_id: chapter?.id,
                at: new Date().toISOString(),
              })
            }
            onCommand={() =>
              session?.update(content?.command_session || "commands", {
                id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                chapter_id: chapter?.id,
                at: new Date().toISOString(),
              })
            }
          />
        ) : (
          <MdDoc
            sections={parsed.sections}
            base={chapter?.content_base}
            resolveWidget={resolveWidget}
            onQuizAnswer={(correct, i) =>
              actionData?.action?.({
                key: content?.quiz_action || "submit_quiz",
                type: "filter",
                data: {
                  chapter_id: chapter?.id,
                  quiz_id: `ch${chapter?.id}-q${i}`,
                  score: correct ? 1 : 0,
                  total: 1,
                },
              })
            }
          />
        )}
        {!actionData?.loading && !slides && parsed.sections.length === 0 && (
          <Text as="p" className="text-muted-foreground">
            {content?.empty || t("common.emptyContent","No content yet.")}
          </Text>
        )}
        {!slides && (
          <View className="chapter-foot">
            <Pressable className="sf-action-btn" onPress={markComplete}>
              {content?.complete_label || t("lesson.markAsRead","Mark as read")}
            </Pressable>
            <View className="chapter-prevnext">
              {prev && (
                <Pressable
                  className="btn btn-secondary"
                  onPress={() => openChapter(prev)}
                >
                  {t("quiz.previous","← Previous")}
                </Pressable>
              )}
              {next && (
                <Pressable
                  className="btn btn-primary"
                  onPress={() => openChapter(next)}
                >
                  {t("quiz.next","Next →")}
                </Pressable>
              )}
            </View>
          </View>
        )}
        </View>
      </View>

      {content?.toc && (slides ? slides.length > 0 : parsed.sections.length > 0) && (
        <View as="aside" className="reader-toc">
          <Text className="reader-sidebar-label">{t("ctx.onThisPage","On this page")}</Text>
          {slides ? (
            <View className="reader-toc-list">
              {slides
                .filter((s: any) => s.title)
                .map((s: any, i: number) => (
                  <Pressable
                    key={s.id || i}
                    className={`reader-toc-item${s.id === activeSection ? " active" : ""}`}
                    onPress={() =>
                      document
                        .getElementById(s.id)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                  >
                    {s.title}
                  </Pressable>
                ))}
            </View>
          ) : (
            <MdToc sections={parsed.sections} />
          )}
        </View>
      )}

      {popup && (
        <View className="reader-modal-overlay" onClick={() => setPopup(null)}>
          <View
            className="reader-modal"
            onClick={(e: any) => e?.stopPropagation?.()}
          >
            <View className="reader-modal-head">
              <Text className="font-semibold">
                {popup === "detail"
                  ? `📄 ${t("popup.detailedChapter","Detailed Chapter")}`
                  : `📝 ${t("popup.labNotes","Lab Notes")}`}
              </Text>
              <Pressable className="btn btn-secondary" onPress={() => setPopup(null)}>
                {t("common.close","Close")}
              </Pressable>
            </View>
            {popup === "detail" ? (
              <View className="reader-modal-body">
                <MdDoc
                  sections={parsed.sections}
                  base={chapter?.content_base}
                  resolveWidget={resolveWidget}
                />
              </View>
            ) : (
              <View className="reader-modal-body space-y-3">
                <textarea
                  className="reader-notes-input"
                  rows={10}
                  placeholder={t("popup.personalNotes","Personal notes…")}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                />
                <Pressable
                  className="btn btn-primary"
                  onPress={() => {
                    // lazy write action when the def declares one (lab_note
                    // POST); the session keeps a local copy either way.
                    actionData?.action?.({
                      key: content?.notes_action || "save_notes",
                      type: "filter",
                      data: { chapter_id: chapter?.id, body: noteDraft },
                    });
                    session?.update("recent", {
                      id: `note-${chapter?.id}`,
                      name: `Note — ${chapter?.title}`,
                      kind: "lab_note",
                      at: new Date().toISOString(),
                    });
                    setPopup(null);
                  }}
                >
                  {t("popup.saveClose","Save & close")}
                </Pressable>
              </View>
            )}
          </View>
        </View>
      )}
      </View>
    </View>
  );
}
