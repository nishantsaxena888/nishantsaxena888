// uday client — site hero. Rendered by RenderEngine when a Definition
// has type: "uday-hero". Content comes from the page definition JSON.

export const UdayHero = ({ content }: any) => {
  return (
    <div className="m-4 rounded-2xl border border-border bg-primary/10 p-8">
      <h1 className="text-3xl font-bold text-foreground">
        {content?.title || "Learn by building"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {content?.subtitle || "Markdown-driven courses on the generic platform."}
      </p>
    </div>
  );
};

export default UdayHero;
