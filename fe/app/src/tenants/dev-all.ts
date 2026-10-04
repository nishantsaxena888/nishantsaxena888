// GENERATED — do not edit by hand.
// `npm run client <name>` rewrites this file. Dev only: imported under
// import.meta.env.DEV so prod builds drop it completely.
import grocery_site from "@clients/grocery/site/tenant";
import grocery_admin from "@clients/grocery/admin/tenant";
import "@clients/grocery/site/styles.css";
import "@clients/grocery/admin/styles.css";
import hello_site from "@clients/hello/site/tenant";
import hello_admin from "@clients/hello/admin/tenant";
import "@clients/hello/site/styles.css";
import "@clients/hello/admin/styles.css";
import uday_site from "@clients/uday/site/tenant";
import uday_admin from "@clients/uday/admin/tenant";
import "@clients/uday/site/styles.css";
import "@clients/uday/admin/styles.css";

export const allClients = {
  grocery: { site: grocery_site, admin: grocery_admin },
  hello: { site: hello_site, admin: hello_admin },
  uday: { site: uday_site, admin: uday_admin },
};

export const mockGlobs = {
  grocery: import.meta.glob("../../../client/grocery/mock/**/*.json", { eager: true }),
  hello: import.meta.glob("../../../client/hello/mock/**/*.json", { eager: true }),
  uday: import.meta.glob("../../../client/uday/mock/**/*.json", { eager: true }),
};
