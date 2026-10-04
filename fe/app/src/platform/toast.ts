// Platform toast — web impl delegates to sonner. Shared code imports
// `@/lib/toast` (or this module); the native variant maps the same
// surface to Alert/host events — components never import sonner directly.
export { toast } from "sonner";
