// hello client — own component (client-specific, lives in fe/client/hello).
// Rendered by RenderEngine when a Definition has type: "hello-banner".

export const HelloBanner = ({ content }: any) => {
  return (
    <div className="hello-banner m-4 rounded-xl border border-border bg-muted/50 p-4">
      <h2 className="text-lg font-semibold text-foreground">
        {content?.title || "Hello Client"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {content?.subtitle || "This component ships inside fe/client/hello."}
      </p>
    </div>
  );
};

export default HelloBanner;
