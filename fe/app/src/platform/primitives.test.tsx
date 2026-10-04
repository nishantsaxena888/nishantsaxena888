// Platform primitives — web impl must satisfy the RN-shaped contract:
// onPress→click, `to`→router link, as→semantic tag. The RN port's
// primitives.native.tsx must satisfy this same spec.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Anchor, Pressable, Text, TextInput, View } from "./primitives";

describe("View / Text", () => {
  it("renders div/span by default with className passthrough", () => {
    render(
      <View className="cls" data-testid="v">
        <Text>hi</Text>
      </View>,
    );
    expect(screen.getByTestId("v")).toHaveClass("cls");
    expect(screen.getByText("hi").tagName).toBe("SPAN");
  });

  it("as prop picks the semantic tag", () => {
    render(
      <View as="section" data-testid="s">
        <Text as="h2">T</Text>
      </View>,
    );
    expect(screen.getByTestId("s").tagName).toBe("SECTION");
    expect(screen.getByText("T").tagName).toBe("H2");
  });
});

describe("Pressable", () => {
  it("onPress → click, button semantics, disabled honored", async () => {
    const fn = vi.fn();
    render(<Pressable onPress={fn}>go</Pressable>);
    const btn = screen.getByRole("button");
    await userEvent.click(btn);
    expect(fn).toHaveBeenCalledTimes(1);

    render(<Pressable disabled onPress={fn}>no</Pressable>);
    await userEvent.click(screen.getByText("no"));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("to → router Link", () => {
    render(
      <MemoryRouter>
        <Pressable to="/cart">cart</Pressable>
      </MemoryRouter>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/cart");
  });
});

describe("Anchor", () => {
  it("internal → Link, external → target=_blank anchor", () => {
    render(
      <MemoryRouter>
        <Anchor to="/shop">in</Anchor>
        <Anchor to="https://x.co" external>
          out
        </Anchor>
      </MemoryRouter>,
    );
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/shop");
    expect(links[1]).toHaveAttribute("target", "_blank");
  });
});

describe("TextInput", () => {
  it("onChangeText receives the string value", async () => {
    const fn = vi.fn();
    render(<TextInput onChangeText={fn} placeholder="p" />);
    await userEvent.type(screen.getByPlaceholderText("p"), "ab");
    expect(fn).toHaveBeenCalledWith("a");
    expect(fn).toHaveBeenLastCalledWith("ab");
  });
});
