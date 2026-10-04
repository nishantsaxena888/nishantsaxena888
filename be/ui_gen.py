# ui_gen.py — derive a usable OPTIONS ui block from an entity's field DSL
# when the client hasn't declared an explicit "ui" (or only part of it).
#
# Contract: the OPTIONS response's content/ui drives the FE default-admin
# screen (table.columns + form.fields). Explicit ui entries always win —
# this only fills what's missing, so a zero-config entity still gets a
# working CRUD screen and a partial ui stays authoritative where declared.

_DEFAULT_ACTIONS = ["open_form", "confirm_delete"]


def _label(key: str) -> str:
    return key.replace("_", " ").strip().title()


def _component_type(spec: dict) -> str:
    """DSL field type/options → FE componentType (form-render strips the
    "Input" suffix and lowercases, so e.g. "NumberInput" → "number")."""
    t = str(spec.get("type") or "str").lower()
    if t in ("int", "float", "decimal"):
        return "NumberInput"
    if t == "bool":
        return "Checkbox"
    if t in ("datetime", "date"):
        return "DateTime"
    if isinstance(spec.get("options") or spec.get("choices"), list):
        return "Select"
    return "TextInput"


def _column(key: str, spec: dict) -> dict:
    col = {"key": key, "label": _label(key)}
    if spec.get("primary_key") or str(spec.get("type", "")).lower() in ("int", "float", "decimal"):
        col["sortable"] = True
    if str(spec.get("type", "")).lower() == "str" and not spec.get("primary_key"):
        col["searchable"] = True
    if spec.get("type") == "bool":
        col["type"] = "status"
    return col


def _form_field(key: str, spec: dict) -> dict:
    field = {
        "name": key,
        "componentType": _component_type(spec),
        "label": _label(key),
    }
    if spec.get("required"):
        field["required"] = True
    if spec.get("default") is not None:
        field["default"] = spec["default"]
    options = spec.get("options") or spec.get("choices")
    if isinstance(options, list):
        field["options"] = options
    return field


def derive_ui(cfg: dict) -> dict:
    """Return a complete ui dict for an entity cfg — explicit ui sections
    win; anything missing is synthesized from fields (pk excluded from
    forms, first in columns)."""
    fields = cfg.get("fields") or {}
    explicit = cfg.get("ui") or {}

    derived = {
        "table": {
            "columns": [_column(k, s) for k, s in fields.items()],
            "actions": list(_DEFAULT_ACTIONS),
        },
        "form": {
            "fields": [
                _form_field(k, s)
                for k, s in fields.items()
                if not s.get("primary_key")
            ],
        },
    }

    ui = dict(explicit)
    for section in ("table", "form"):
        if not isinstance(ui.get(section), dict):
            ui[section] = derived[section]
            continue
        merged = dict(derived[section])
        merged.update(ui[section])
        ui[section] = merged
    return ui
