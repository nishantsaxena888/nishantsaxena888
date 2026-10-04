// grocery client — site hero. Rendered by RenderEngine when a Definition
// has type: "grocery-hero". Content comes from the page definition JSON.

export const GroceryHero = ({ content }: any) => {
  return (
    <div className="m-4 rounded-2xl border border-border bg-primary/10 p-8">
      <h1 className="text-3xl font-bold text-foreground">
        {content?.title || "Fresh today"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {content?.subtitle || "Same engine, different client."}
      </p>
      {content?.cta && (
        <span className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          {content.cta}
        </span>
      )}
    </div>
  );
};

export default GroceryHero;
