import { createRoot } from "react-dom/client";
import "./index.css";

import RootProvider from "./components/shared/root-provider.tsx";

createRoot(document.getElementById("root")!).render(<RootProvider />);
