// md-sections parser contract — lives next to the lib (vitest includes
// ../client/** so client code tests itself without crossing the boundary).
import { describe, expect, it } from "vitest";
import { evalLiteral, mdAnchor, parseMd } from "./md-sections";

describe("evalLiteral", () => {
  it("parses arrays, objects, scalars without eval", () => {
    expect(evalLiteral('["a","b",3]')).toEqual(["a", "b", 3]);
    expect(evalLiteral("{title: 'Hi', n: 2, ok: true}")).toEqual({
      title: "Hi",
      n: 2,
      ok: true,
    });
    expect(evalLiteral('"quoted"')).toBe("quoted");
    expect(evalLiteral("true")).toBe(true);
    expect(evalLiteral("null")).toBe(null);
    expect(evalLiteral("undefined")).toBe(undefined);
  });

  it("handles nested + escaped strings", () => {
    expect(evalLiteral("{hotspots: [{x: 1, tip: 'a\\'b'}]}")).toEqual({
      hotspots: [{ x: 1, tip: "a'b" }],
    });
  });
});

describe("parseMd — blocks", () => {
  it("headings, paragraphs, code, lists, images", () => {
    const md = [
      "# Title",
      "",
      "Some intro text.",
      "",
      "## Section 1",
      "",
      "```bash",
      "aws s3 ls",
      "```",
      "",
      "- one",
      "- two",
      "",
      "1. first",
      "2. second",
      "",
      "![cap](img-1.png)",
    ].join("\n");
    const { sections } = parseMd(md);
    const types = sections.map((s) => s.type);
    expect(types).toEqual([
      "heading",
      "paragraph",
      "heading",
      "code",
      "list",
      "list",
      "image",
    ]);
    expect(sections[2]).toMatchObject({ level: 2, text: "Section 1" });
    expect(sections[3]).toMatchObject({ lang: "bash", code: "aws s3 ls" });
    expect(sections[4]).toMatchObject({ ordered: false, items: ["one", "two"] });
    expect(sections[5]).toMatchObject({ ordered: true });
    expect(sections[6]).toMatchObject({ src: "img-1.png", alt: "cap" });
  });

  it("blockquote → callout with bold title", () => {
    const { sections } = parseMd("> **Remember**\n> line one\n> line two");
    expect(sections[0]).toMatchObject({
      type: "callout",
      variant: "quote",
      title: "Remember",
      body: "line one\nline two",
    });
  });
});

describe("parseMd — directives", () => {
  it("extracts Quiz widget in-place", () => {
    const md = [
      "Intro para.",
      "",
      '<Quiz question="2+2?" options={["3","4"]} answerIndex={1} explanation="math" />',
      "",
      "After quiz.",
    ].join("\n");
    const { sections } = parseMd(md);
    expect(sections.map((s) => s.type)).toEqual([
      "paragraph",
      "quiz",
      "paragraph",
    ]);
    const q = sections[1];
    expect(q).toMatchObject({
      question: "2+2?",
      options: ["3", "4"],
      answerIndex: 1,
      explanation: "math",
    });
  });

  it("paired card tag → callout keeping position", () => {
    const md = "before\n\n<InfoCard title=\"Note\">inner **md**</InfoCard>\n\nafter";
    const { sections } = parseMd(md);
    expect(sections.map((s) => s.type)).toEqual([
      "paragraph",
      "callout",
      "paragraph",
    ]);
    expect(sections[1]).toMatchObject({
      variant: "info",
      title: "Note",
      body: "inner **md**",
    });
  });

  it("VideoSection + unknown widget fallback", () => {
    const md = [
      '<VideoSection youtubeId="abc123" title="Demo" />',
      '<FancyWidget title="Thing" description="does stuff" />',
    ].join("\n");
    const { sections } = parseMd(md);
    expect(sections[0]).toMatchObject({ type: "video", youtubeId: "abc123" });
    expect(sections[1]).toMatchObject({
      type: "widget",
      tag: "FancyWidget",
      title: "Thing",
    });
  });

  it("plain HTML lines pass through / skipped", () => {
    const { sections } = parseMd("text\n<div>\nmore text");
    expect(sections.map((s) => s.type)).toEqual(["paragraph", "paragraph"]);
  });

  it("widget sections carry raw attrs for `md-<tag>` custom renderers", () => {
    const md = [
      '<GitHubExplorer repo="acme/repo" ref="nishant" files={["a.ts","b.ts"]} />',
      '<FlowDiagram title="Flow" description="a→b" />',
    ].join("\n");
    const { sections } = parseMd(md);
    expect(sections[0]).toMatchObject({
      type: "widget",
      tag: "GitHubExplorer",
      attrs: { repo: "acme/repo", ref: "nishant", files: ["a.ts", "b.ts"] },
    });
    expect(sections[1]).toMatchObject({
      type: "widget",
      tag: "FlowDiagram",
      attrs: { title: "Flow" },
    });
  });
});

describe("mdAnchor", () => {
  it("numbered sections → dash anchors (concept-id convention)", () => {
    expect(mdAnchor("3.9 Deployments")).toBe("3-9");
    expect(mdAnchor("12.4.1 Nested")).toBe("12-4-1");
  });
  it("plain headings slugify; empty → section", () => {
    expect(mdAnchor("Getting Started!")).toBe("getting-started");
    expect(mdAnchor("")).toBe("section");
  });
});

it("parses GFM tables into header+rows", () => {
  const md = "| Name | Use |\n| --- | --- |\n| VPC | network |\n| NAT | egress |\n\ntail";
  const t = parseMd(md).sections.find((s) => s.type === "table");
  expect(t).toMatchObject({
    header: ["Name", "Use"],
    rows: [["VPC", "network"], ["NAT", "egress"]],
  });
});
