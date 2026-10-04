/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 📘 Reducer Strategy Library
 *
 * A dictionary of pure reducer functions that can be referenced by string name
 * from JSON configuration. Each strategy takes:
 *   - currentState: the current value of the session key
 *   - payload: the incoming data (e.g. the product being added)
 *   - methodConfig: the method_config object from the session JSON
 *
 * The engine maps `method: "array_upsert"` → `strategies.array_upsert(...)`.
 *
 * This file is designed to be extractable as part of a standalone npm package.
 */

// ─── Strategy Types ──────────────────────────────────────────────────────────

export type ReducerStrategy = (
  currentState: any,
  payload: any,
  methodConfig: Record<string, any>
) => any;

// ─── Field Mapping Utility ───────────────────────────────────────────────────

/**
 * Extracts and renames fields from a source entity based on a mapping config.
 *
 * Example mapping: { "unit_price": "price", "name": "name" }
 * Source entity:   { id: 1, name: "Apple", price: 1.99, description: "..." }
 * Result:          { unit_price: 1.99, name: "Apple" }
 */
export function mapFields(
  entity: Record<string, any>,
  mapping: Record<string, string>
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [targetKey, sourcePath] of Object.entries(mapping)) {
    const value = getNestedValue(entity, sourcePath);
    if (value === undefined) {
      console.warn(`[mapFields] "${sourcePath}" → "${targetKey}" resolved to undefined`);
    }
    result[targetKey] = value;
  }
  return result;
}

/**
 * Resolves a dot-separated path to a nested value.
 * e.g. getNestedValue({ a: { b: 3 } }, "a.b") => 3
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

// ─── Reducer Strategies ──────────────────────────────────────────────────────

/**
 * array_upsert — Insert or update an item in an array by match_key.
 *
 * Config:
 *   match_key: string       — field to match on (e.g. "id")
 *   on_match: "increment" | "set" | "replace"  — what to do when matched
 *   increment_field: string — which field to increment on match (e.g. "qty")
 *   default_fields: object  — default values for new items (e.g. { qty: 1 })
 */
const array_upsert: ReducerStrategy = (rawCurrent, payload, config) => {
  const current = Array.isArray(rawCurrent) ? rawCurrent : [];
  const matchKey = config.match_key || "id";
  const incrementField = config.increment_field || "qty";
  const onMatch = payload._operation || config.on_match || "increment";
  const defaults = config.default_fields || {};

  const cleanPayload = { ...payload };
  delete cleanPayload._operation;

  const matchValue = cleanPayload[matchKey];
  if (matchValue === undefined || matchValue === null) return current;

  const existing = current.find((item: any) => item && item[matchKey] === matchValue);

  if (existing) {
    return current.map((item: any) => {
      if (!item || item[matchKey] !== matchValue) return item;

      switch (onMatch) {
        case "increment":
          return { ...item, [incrementField]: (item[incrementField] || 0) + 1 };
        case "decrement": {
          const newVal = (item[incrementField] || 0) - 1;
          // Return null to signal removal (filtered below)
          return newVal > 0 ? { ...item, [incrementField]: newVal } : null;
        }
        case "remove":
          return null;
        case "set":
          return { ...item, ...cleanPayload };
        case "replace":
          return cleanPayload;
        default:
          return { ...item, [incrementField]: (item[incrementField] || 0) + 1 };
      }
    }).filter(Boolean);
  }

  // If decrementing/removing a non-existent item, do nothing
  if (onMatch === "decrement" || onMatch === "remove") return current;

  // New item — merge defaults
  return [...current, { ...defaults, ...cleanPayload }];
};

/**
 * array_toggle — Toggle an item's presence in an array.
 *
 * If the item exists (matched by match_key), remove it.
 * If it doesn't exist, append it.
 *
 * For simple ID arrays: payload can be a string, stored as-is.
 * For object arrays: payload is an object matched by match_key.
 */
const array_toggle: ReducerStrategy = (rawCurrent, payload, config) => {
  const current = Array.isArray(rawCurrent) ? rawCurrent : [];
  const matchKey = config.match_key || "id";

  // Simple string/number toggle (e.g. wishlist of IDs)
  if (typeof payload === "string" || typeof payload === "number") {
    return current.includes(payload)
      ? current.filter((x: any) => x !== payload)
      : [...current, payload];
  }

  // Object toggle
  const matchValue = payload[matchKey];
  if (matchValue === undefined) return current;

  const exists = current.some((item: any) =>
    typeof item === "object" && item !== null ? item[matchKey] === matchValue : item === matchValue
  );

  if (exists) {
    return current.filter((item: any) =>
      typeof item === "object" && item !== null ? item[matchKey] !== matchValue : item !== matchValue
    );
  }

  return [...current, payload];
};

/**
 * array_remove — Remove an item from an array by match_key.
 */
const array_remove: ReducerStrategy = (rawCurrent, payload, config) => {
  const current = Array.isArray(rawCurrent) ? rawCurrent : [];
  const matchKey = config.match_key || "id";
  const matchValue = typeof payload === "object" && payload !== null ? payload[matchKey] : payload;
  return current.filter((item: any) =>
    typeof item === "object" && item !== null ? item[matchKey] !== matchValue : item !== matchValue
  );
};

/**
 * array_prepend_unique — Prepend an item to the front of an array.
 * Removes duplicates and trims to max_size.
 * Useful for "recently viewed" lists.
 */
const array_prepend_unique: ReducerStrategy = (rawCurrent, payload, config) => {
  const current = Array.isArray(rawCurrent) ? rawCurrent : [];
  const matchKey = config.match_key || "id";
  const maxSize = config.max_size || 20;
  const matchValue = typeof payload === "object" && payload !== null ? payload[matchKey] : payload;

  // Remove existing match
  const filtered = current.filter((item: any) =>
    typeof item === "object" && item !== null ? item[matchKey] !== matchValue : item !== matchValue
  );

  // Prepend and trim
  const result = [payload, ...filtered];
  return result.slice(0, maxSize);
};

/**
 * replace — Directly replace the current value.
 */
const replace: ReducerStrategy = (_current, payload, _config) => {
  return payload;
};

/**
 * merge — Shallow merge payload into current object.
 */
const merge: ReducerStrategy = (current = {}, payload, _config) => {
  return { ...current, ...payload };
};

// ─── Strategy Registry ───────────────────────────────────────────────────────

const strategies: Record<string, ReducerStrategy> = {
  array_upsert,
  array_toggle,
  array_remove,
  array_prepend_unique,
  replace,
  merge,
};

/**
 * Resolves a strategy string name to its function.
 * Returns undefined if the strategy is not found.
 *
 * Usage:
 *   const reducer = resolveReducer("array_upsert");
 *   const newState = reducer(currentState, payload, methodConfig);
 */
export function resolveReducer(method: string): ReducerStrategy | undefined {
  return strategies[method];
}

/**
 * Builds a useGenericState-compatible method function from a session config.
 *
 * Session config example:
 *   { method: "array_upsert", method_config: { match_key: "id", ... } }
 *
 * Returns a function with signature: (currentValue, inputValue, currentState) => newValue
 * This is the exact signature useGenericState.methods expects.
 */
export function buildMethodFromSession(
  session: { method: string; method_config?: Record<string, any> }
): ((currentValue: any, inputValue: any, currentState: Record<string, any>) => any) | undefined {
  const strategy = resolveReducer(session.method);
  if (!strategy) {
    console.warn(`[Reducers] Unknown strategy: "${session.method}"`);
    return undefined;
  }

  const config = session.method_config || {};

  // Return a closure that matches the useGenericState.methods signature
  return (currentValue: any, inputValue: any, _currentState: Record<string, any>) => {
    return strategy(currentValue, inputValue, config);
  };
}

// Global registry of session-backed entity names
const registeredSessions = new Map<string, { match_key: string }>();

export function registerSession(name: string, config: { match_key: string }): void {
  registeredSessions.set(name, config);
}

export function isRegisteredSession(name: string): boolean {
  return registeredSessions.has(name);
}

export function getSessionMatchKey(name: string): string {
  return registeredSessions.get(name)?.match_key || "id";
}

/**
 * Processes an array of session definitions and returns:
 *   - persistentKeys: string[] of session names that should persist
 *   - methods: Record<string, fn> of reducer methods keyed by session name
 *
 * This output can be passed directly to useGenericState.configure().
 */
export function buildConfigFromSessions(
  sessions: Array<{
    name: string;
    persist?: boolean;
    method: string;
    method_config?: Record<string, any>;
  }>
): {
  persistentKeys: string[];
  methods: Record<string, (currentValue: any, inputValue: any, currentState: Record<string, any>) => any>;
} {
  const persistentKeys: string[] = [];
  const methods: Record<string, (currentValue: any, inputValue: any, currentState: Record<string, any>) => any> = {};

  for (const session of sessions) {
    // Register the session name globally so useEntity can detect it
    registerSession(session.name, {
      match_key: session.method_config?.match_key || "id",
    });

    if (session.persist) {
      persistentKeys.push(session.name);
    }

    const method = buildMethodFromSession(session);
    if (method) {
      methods[session.name] = method;
    }
  }

  return { persistentKeys, methods };
}
