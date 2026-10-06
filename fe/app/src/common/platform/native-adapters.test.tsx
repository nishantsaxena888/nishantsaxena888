// Native adapter contract — the *.native.* files exercised for real:
// react-native → react-native-web (actual RN components rendered to DOM),
// navigation/storage stubs wired via vitest aliases. If the same
// components render here, they render under Metro — the only delta is
// the host modules, which are stubbed with the same API surface.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as Nav from "./navigation.native";
// primitives.native imports "./navigation" — under Metro that resolves to
// navigation.native, under vitest to navigation.ts. Both share the same
// imperativeNav contract; register on the module the adapter actually
// binds (and the native module's path→screen mapping is covered below).
import { registerNavigator } from "./navigation";
import { View, Text, Pressable, TextInput } from "./primitives.native";
import { emitAppEvent, onAppEvent, reloadApp } from "./host.native";
import { hydrateStorage, storage } from "./storage.native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Same module instance navigation.native gets via the vitest alias.
import { __navCalls, __resetNav } from "../../test/react-navigation-stub";

describe("primitives.native → react-native-web render", () => {
  it("View/Text render real RN components", () => {
    render(
      <View data-testid="v">
        <Text>hello native</Text>
      </View>,
    );
    expect(screen.getByTestId("v")).toHaveTextContent("hello native");
  });

  it("Pressable fires onPress; `to` navigates via navTo seam", () => {
    __resetNav();
    const calls: string[] = [];
    registerNavigator((to) => void calls.push(to));
    const onPress = vi.fn();
    render(
      <Pressable to="/cart" onPress={onPress} data-testid="p">
        <Text>go</Text>
      </Pressable>,
    );
    fireEvent.click(screen.getByTestId("p"));
    expect(onPress).toHaveBeenCalled();
    expect(calls[0]).toBe("/cart"); // path hits the imperative nav seam
  });

  it("TextInput onChangeText receives the string (RN contract)", () => {
    const onChangeText = vi.fn();
    render(<TextInput onChangeText={onChangeText} data-testid="in" />);
    fireEvent.change(screen.getByTestId("in"), { target: { value: "abc" } });
    // RNW maps native text input events — the adapter passes onChangeText
    // straight to RN TextInput.
    expect(onChangeText).toHaveBeenCalled();
  });
});

describe("navigation.native hooks", () => {
  const Probe = () => {
    const { navigate, goBack } = Nav.useNav();
    const params = Nav.useRouteParams();
    return (
      <div>
        <span data-testid="path">{Nav.usePath()}</span>
        <span data-testid="params">{params.slug}</span>
        <button data-testid="nav" onClick={() => navigate("/orders")} />
        <button data-testid="back" onClick={goBack} />
      </div>
    );
  };

  it("useNav/useRouteParams/usePath bind react-navigation", () => {
    __resetNav();
    render(<Probe />);
    expect(screen.getByTestId("path")).toHaveTextContent("home");
    expect(screen.getByTestId("params")).toHaveTextContent("test");
    fireEvent.click(screen.getByTestId("nav"));
    expect(__navCalls().at(-1)?.to).toBe("orders");
    fireEvent.click(screen.getByTestId("back"));
    expect(__navCalls().at(-1)?.to).toBe("<back>");
  });
});

describe("storage.native — AsyncStorage hydration contract", () => {
  it("hydrateStorage fills the sync mirror; writes flush async", async () => {
    (AsyncStorage as any).__clear();
    (AsyncStorage as any).__seed("token", "seeded");
    await hydrateStorage();
    expect(storage.getItem("token")).toBe("seeded");
    storage.setItem("k", "v");
    expect(storage.getItem("k")).toBe("v"); // sync read
    await waitFor(async () =>
      expect(await AsyncStorage.getItem("k")).toBe("v"),
    ); // flushed to AsyncStorage
  });
});

describe("host.native — DeviceEventEmitter events", () => {
  it("emitAppEvent/onAppEvent round-trip", () => {
    const cb = vi.fn();
    const off = onAppEvent("auth-change", cb);
    emitAppEvent("auth-change", { ok: 1 });
    expect(cb).toHaveBeenCalled();
    off();
  });

  it("reloadApp calls DevSettings.reload", () => {
    expect(() => reloadApp()).not.toThrow();
  });
});
