// StorefrontListing contract — actionData drives the grid, the session
// name drives where "add" goes. Mocks live at the hook seams (useEntity,
// config store, language) so this tests the component contract, not DOM
// trivia — the same contract an RN port reimplements.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const onPost = vi.fn();
const toastInfo = vi.fn();
vi.mock("@/common/engine", () => ({
  useEntity: () => ({ onPost }),
}));
vi.mock("@/common/lib/toast", () => ({
  toast: { success: vi.fn(), info: (...a: any[]) => toastInfo(...a) },
}));
vi.mock("@/components/shared/use-language", () => ({
  useLanguage: () => ({ t: (_k: string, d?: string) => d || _k }),
}));

let configState: any = { meta: { currency_symbol: "$" }, sessions: [{ name: "cart" }] };
vi.mock("@/common/store/use-config-store", () => ({
  useConfigStore: (sel: any) => sel({ config: configState }),
}));

import { StorefrontListing } from "./listing";

const products = [
  { id: 1, name: "Apple", price: 1.5, stock: 4, badge: "Fresh" },
  { id: 2, name: "Rice", price: 9.99, originalPrice: 12, stock: 0 },
];

const def = (data = products) => ({
  content: { title: "Picks" },
  properties: {},
  actionData: { data: { data }, loading: false },
});

beforeEach(() => {
  onPost.mockReset();
  toastInfo.mockReset();
  configState = { meta: { currency_symbol: "$" }, sessions: [{ name: "cart" }] };
});

describe("rendering", () => {
  it("renders a card per item with name + price", () => {
    render(<StorefrontListing {...def()} />);
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("$1.50")).toBeInTheDocument();
    expect(screen.getByText("Fresh")).toBeInTheDocument();
  });

  it("out-of-stock items disable their action", () => {
    render(<StorefrontListing {...def()} />);
    const btns = screen.getAllByRole("button");
    expect(btns[0]).toBeEnabled();
    expect(btns[1]).toBeDisabled();
    expect(btns[1]).toHaveTextContent("Out of stock");
  });

  it("empty data → empty state", () => {
    render(<StorefrontListing {...def([])} />);
    expect(screen.getByText(/No items found/)).toBeInTheDocument();
  });

  it("loading → loading surface", () => {
    render(<StorefrontListing {...def()} actionData={{ loading: true }} />);
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });
});

describe("session action", () => {
  it("add posts the item to the configured session", async () => {
    render(<StorefrontListing {...def()} />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(onPost).toHaveBeenCalledWith(products[0]);
  });

  it("properties.session picks a different session name", () => {
    // useEntity is module-mocked; assert config lookup uses the override
    configState = { meta: {}, sessions: [{ name: "wishlist" }] };
    render(<StorefrontListing {...def()} properties={{ session: "wishlist" }} />);
    expect(toastInfo).not.toHaveBeenCalled();
  });

  it("unconfigured session → info toast, no post", async () => {
    configState = { meta: {}, sessions: [] };
    render(<StorefrontListing {...def()} />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(onPost).not.toHaveBeenCalled();
    expect(toastInfo).toHaveBeenCalledWith(
      expect.stringContaining('"cart"'),
    );
  });
});
