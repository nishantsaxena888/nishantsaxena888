// Platform primitives — the RN-shaped component contract rendered on DOM
// here. Components that want to port to React Native use THESE instead of
// raw HTML tags; the RN build resolves `primitives.native.tsx` (Metro
// platform extension) to react-native's real primitives + NativeWind
// className, so shared components don't change.
//
//   View      → <div>/<section>/<article>/<header>/<footer> (as prop)
//   Text      → <span> (as prop for h1-h6/p/strong/em/s/mark/label)
//   Pressable → <button>, or <a> when `to`/`href` is given (router-aware)
//   Image     → <img>
//   TextInput → <input> (onChangeText → onChange)
//   ScrollView→ overflow div
//
// Keep props RN-compatible: onPress (not onClick), style/className only,
// no DOM events, no form semantics — those live in web-only comps.
import React from "react";
import { Link } from "react-router-dom";

type Base = {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  id?: string;
  role?: string;
  "aria-label"?: string;
  "data-testid"?: string;
};

type AsTag = keyof React.JSX.IntrinsicElements;

export const View = ({
  as: Tag = "div",
  ...rest
}: Base & { as?: AsTag } & React.HTMLAttributes<HTMLElement>) =>
  React.createElement(Tag as any, rest);

export const Text = ({
  as: Tag = "span",
  ...rest
}: Base & { as?: AsTag } & React.HTMLAttributes<HTMLElement>) =>
  React.createElement(Tag as any, rest);

// Pressable: button semantics on web; `to` renders a router Link (SPA
// nav), `href` a plain anchor (external). onPress → onClick.
export const Pressable = ({
  to,
  href,
  onPress,
  disabled,
  type = "button",
  ...rest
}: Base & {
  to?: string;
  href?: string;
  onPress?: (e?: any) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  title?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) => {
  if (to) {
    return (
      <Link to={to} onClick={onPress} aria-disabled={disabled} {...rest}>
        {rest.children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} onClick={onPress} {...rest}>
        {rest.children}
      </a>
    );
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onPress}
      {...rest}
    />
  );
};

// Router-aware anchor — the common case for nav links.
export const Anchor = ({
  to,
  external,
  ...rest
}: Base & {
  to: string;
  external?: boolean;
  onPress?: () => void;
  onMouseEnter?: () => void;
}) =>
  external ? (
    <a href={to} target="_blank" rel="noopener noreferrer" {...rest} />
  ) : (
    <Link to={to} {...rest} />
  );

export const Image = ({
  src,
  alt = "",
  ...rest
}: Base & { src?: string; alt?: string; loading?: "lazy" | "eager" }) => (
  <img src={src} alt={alt} {...rest} />
);

export const TextInput = ({
  value,
  onChangeText,
  ...rest
}: Base & {
  value?: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  type?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  onKeyDown?: (e: any) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) => (
  <input
    value={value}
    onChange={(e) => onChangeText?.(e.target.value)}
    {...rest}
  />
);

export const ScrollView = (props: Base & React.HTMLAttributes<HTMLElement>) => (
  <View style={{ overflow: "auto", ...(props.style || {}) }} {...props} />
);
