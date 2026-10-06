# FormRender JSON Configuration Documentation

The `FormRender` system is a highly robust, dynamic, configuration-driven layout and validation engine. This document provides a complete breakdown of every API parameter, schema definition, and configuration node available when constructing forms.

---

## 1. `FormRender` Component Props

The root `<FormRender />` component accepts the following top-level properties:

| Property | Type | Description |
| ---- | ---- | ---- |
| `formSchema` | `object` | (Required) The JSON schema dictating the layout, inputs, logic, and validation. |
| `populateData` | `object` | (Optional) Preset initial values fed directly into the form state. Overrides field-level defaults. |
| `onSubmit` | `function` | (Required) Submission handler. Receives the validated `values` object as its argument. |
| `onCancel` | `function` | (Optional) Click handler triggered when a user taps "Cancel". |
| `styles` | `object` | (Optional) Inline aesthetic overrides for structural spacing and global inputs (see *Styles config*). |
| `themeName` | `string` | (Optional) Appended to specific structural wrappers as a CSS class to assist global theming (e.g., `"dark"`). |
| `labels` | `object` | (Optional) Exposes localization and overrides for standard action buttons. |
| `classNames` | `object` | (Optional) Advanced nested Tailwind/CSS override tree targeting specific layout engines. |

### Styles (`styles`)
```json
{
  "fieldHeight": "44px",
  "fieldBorderRadius": "10px",
  "primaryColor": "hsl(var(--primary))",
  "fontSize": "14px"
}
```

### Labels (`labels`)
Allows renaming default texts natively generated for layout navigation:
```json
{
  "cancel": "Cancel",
  "reset": "Reset",
  "previous": "Previous",
  "next": "Next",
  "submit": "Submit"
}
```

### Granular Class Names (`classNames`)
Provides deep CSS integration inside the rendering abstractions.
```ts
{
  mainContainer: string; // The root wrapper housing the Iterator grids
  buttons: {
    base: string;     // Wrapper around the isolated footer actions
    cancel: string;   
    submit: string;   
    reset: string;    
  };
  block: { // Target configurations specific to `formType: "block"` layouts
    base: string;
    header: { base: string; open: string; close: string; button: string; icon: string; };
    content: { base: string; };
  };
  tabs: { // Target configurations specific to `formType: "tabs"` layouts
    base: string;
    tabHeader: {
       base: string; 
       button: { base: string; active: string; inactive: string; disabled: string; };
    };
    footer: { base: string; previous: string; next: string; submit: string; reset: string; cancel: string; };
  };
}
```

---

## 2. Setting `formSchema` (The Root Object)

The `formSchema` prop is the primary payload that dictates how the generator behaves dynamically.

```json
{
  "title": "Account Settings",
  "description": "Configure your account specifics here.",
  "formType": "tabs",
  "groupLevelValidation": true,
  "inputs": [ ... ] 
}
```

### Layout Types (`formType`)
1. `"default"`: Renders all fields linearly downwards in a standard flat 12-column grid.
2. `"tabs"`: Renders fields wrapped inside `"type": "group"` into a multi-step paging wizard. Footer logic adapts natively into Previous/Next/Reset layouts.
3. `"block"`: Renders fields wrapped inside `"type": "group"` into isolated, expanding collapsible Accordion sections on a singular page.

### Group Level Validation (`groupLevelValidation`)
*(Primarily affects `"tabs"` and `"block"` forms)*. 
- When `true`, users are **prevented from navigating to consecutive tabs** if horizontal inputs currently visible or behind them fail rule validation.
- When `false` (or missing), users can freely move between tabs, and full-form validation happens securely upon clicking 'Submit'. If submission fails natively, it intelligently refocuses precisely on the first tab containing an error!

---

## 3. Inputs Configuration

The `inputs` array accepts either granular `<Input>` objects, or structural `<Group>` abstraction nodes.

### Structural node: Groups
Groups act as semantic wrappers for layouts requesting multi-step pagination (`tabs`) or accordion-stacking (`block`).
```json
{
  "type": "group",
  "name": "security_configurations",
  "label": "Security Configurations",
  "column": { "md": 6 },
  "inputs": [ ...Child Fields... ]
}
```

### Input Field Options
A field definition supports a vast array of HTML-native properties alongside dynamic custom constraints.

```json
{
  "type": "text", 
  "name": "projectName",
  "label": "Project Name",
  "placeholder": "Enter project title...",
  "defaultValue": "My Awesome Project",
  "hidden": false,
  "order": 1,
  "column": { "xs": 12, "sm": 6, "md": 4, "lg": 3, "xl": 2 }
}
```

| Property | Description |
| ---- | ---- |
| `type` | Evaluates what component mounts to handle DOM updates. Supported abstractions naturally include `"text"`, `"email"`, `"number"`, `"password"`, `"switch"`, `"submit"`. |
| `name` | State allocation key. Capable of interpreting complex dot-notation arrays (e.g. `bio.0.name`). |
| `label` | Standard textual label exposed visually beside/above the input UI. |
| `defaultValue` | Native default fallback initializing prior to validation triggers. Ignored if a top-level `populateData` matches the `name`. |
| `hidden` | Force hard-hides the component statically from DOM without validating its content. |
| `nonInput` | System boolean informing engines evaluating states that this specific payload (e.g., standard `submit` buttons) is entirely presentational and should be skipped for state tracking. |
| `order` | Force manually override natural HTML document rendering weight positioning. Useful heavily in conditional configurations to force layout shifting exactly where needed! |
| `column` | Defines CSS Grid span weight (1 through 12). Respects media size breakpoints naturally: `xs`, `sm`, `md`, `lg`, and `xl`. |

---

## 4. Logical Engine

### Validation Rules (`validation`)
Fields safely declare localized constraints passed automatically downstream into the abstract validation engine.

```json
"validation": [
  { "rule": "required", "message": "This field is requested" },
  { "rule": "email", "message": "Missing '@' parameter constraint" },
  { "rule": "minLength", "value": 3, "message": "Min length 3 required." },
  { "rule": "maxLength", "value": 15, "message": "Too long!" },
  { "rule": "pattern", "value": "^[a-z]+$", "message": "Regex mismatch" },
  { "rule": "match", "value": "password", "message": "Passwords must match" }
]
```
*Note: The `match` rule dynamically consumes the value typed precisely pointing to another `name` currently alive in the form state (e.g., confirming "password").*

### Contextual Visibility (`visible`)
Input elements can react natively to the state bindings of sibling or parent inputs. If evaluated `false`, they securely unmount visually from the `Itrator` rendering lifecycle securely avoiding bad validation dependencies!

**Implicit AND Array Evaluator**:
```json
"visible": [
  { "field": "showName", "operator": "===", "value": true },
  { "field": "nameEnabled", "operator": "===", "value": true }
]
```
**Explicit Operator Root Logic**:
```json
"visible": {
  "logic": "OR",
  "conditions": [
    { "field": "showName", "operator": "===", "value": true },
    { "field": "nameEnabled", "operator": "===", "value": false }
  ]
}
```

*Note: Conditional evaluation natively traverses form bounds and correctly triggers reactivity layout adjustments seamlessly dynamically during client runtime operations.*
