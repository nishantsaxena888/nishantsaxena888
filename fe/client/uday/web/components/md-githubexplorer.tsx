// uday md++ widget — renders <GitHubExplorer repo=… ref=… files=[…] />
// directives as a repo card. Registered as "md-githubexplorer" in the
// site tenant: any markdown directive whose tag lowercases to that name
// resolves here (generic fallback is an attr callout). This is the
// client extension point for md++ — a custom widget needs only this
// file + one line in tenant.ts.
import { Anchor, Text, View } from "@/platform/primitives";

export default function MdGitHubExplorer({ section, attrs }: any) {
  const repo = attrs.repo || "";
  const ref = attrs.ref;
  const files = Array.isArray(attrs.files) ? attrs.files : [];
  return (
    <View className="github-explorer rounded-lg border p-4 space-y-2">
      <Text as="p" className="font-medium">
        {section?.title || "Code explorer"}
      </Text>
      {repo ? (
        <Anchor to={`https://github.com/${repo}`} external>
          {repo}
          {ref ? ` @ ${ref}` : ""}
        </Anchor>
      ) : null}
      {files.map((f: any, i: number) => {
        const path = typeof f === "string" ? f : f?.path || f?.file;
        if (!path) return null;
        return (
          <Anchor
            key={i}
            className="block text-sm text-muted-foreground hover:text-foreground"
            to={`https://github.com/${repo}/blob/${ref || "main"}/${path}`}
            external
          >
            {path}
          </Anchor>
        );
      })}
    </View>
  );
}
