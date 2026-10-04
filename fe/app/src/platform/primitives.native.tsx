// Platform primitives — React Native impl (Metro resolves this over
// primitives.tsx). Same contract as the web version so shared components
// don't change:
//
//   View      → RN View      (`as` is ignored — no semantic tags natively)
//   Text      → RN Text
//   Pressable → RN Pressable (onPress native; `to` → navTo, `href` → Linking)
//   Image     → RN Image     (src → source={{uri}})
//   TextInput → RN TextInput (onChangeText is native already)
//   ScrollView→ RN ScrollView
//   Anchor    → Pressable + navTo / Linking.openURL
//
// className passes straight through — install NativeWind in the host app
// for the same utility classes, or map className→styles in your theme
// layer. style accepts RN style objects.
import React from "react";
import {
  View as RNView,
  Text as RNText,
  Pressable as RNPressable,
  Image as RNImage,
  TextInput as RNTextInput,
  ScrollView as RNScrollView,
  Linking,
} from "react-native";
import { navTo } from "./navigation";

type Base = {
  className?: string;
  style?: any;
  children?: React.ReactNode;
  id?: string;
  role?: string;
  "aria-label"?: string;
  "data-testid"?: string;
};

export const View = ({ as: _as, ...rest }: Base & { as?: string; [k: string]: any }) => (
  <RNView {...rest} />
);

export const Text = ({ as: _as, ...rest }: Base & { as?: string; [k: string]: any }) => (
  <RNText {...rest} />
);

export const Pressable = ({
  to,
  href,
  onPress,
  disabled,
  type: _type,
  ...rest
}: Base & {
  to?: string;
  href?: string;
  onPress?: (e?: any) => void;
  disabled?: boolean;
  type?: string;
  title?: string;
  onMouseEnter?: () => void; // no-op on native — web-only hooks
  onMouseLeave?: () => void;
}) => {
  const press = () => {
    onPress?.();
    if (to) navTo(to);
    else if (href) Linking.openURL(href).catch(() => {});
  };
  return <RNPressable onPress={press} disabled={disabled} {...rest} />;
};

export const Anchor = ({
  to,
  external,
  onPress,
  ...rest
}: Base & { to: string; external?: boolean; onPress?: () => void }) => (
  <RNPressable
    onPress={() => {
      onPress?.();
      if (external) Linking.openURL(to).catch(() => {});
      else navTo(to);
    }}
    {...rest}
  />
);

export const Image = ({
  src,
  alt: _alt,
  ...rest
}: Base & { src?: string; alt?: string; loading?: "lazy" | "eager" }) => (
  <RNImage source={src ? { uri: src } : undefined} {...rest} />
);

export const TextInput = ({
  onChangeText,
  type: _type,
  onKeyDown: _onKeyDown,
  ...rest
}: Base & {
  value?: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  type?: string; // web-only — use keyboardType/secureTextEntry natively
  name?: string;
  disabled?: boolean;
  required?: boolean;
  onKeyDown?: (e: any) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  secureTextEntry?: boolean;
  keyboardType?: string;
}) => (
  <RNTextInput
    editable={!rest.disabled}
    onChangeText={onChangeText}
    {...rest}
  />
);

export const ScrollView = (props: Base & { [k: string]: any }) => (
  <RNScrollView {...props} />
);
