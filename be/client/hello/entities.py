# be/client/hello/entities.py
# Entity DSL — the single source of truth (same shape as nishify clients/*/entities.py)

ENTITIES_ORDER = ["todo"]

entities = {
    "todo": {
        "source": "json",   # implementation is secondary — swap sources freely
        "fields": {
            "id":        {"type": "int", "primary_key": True},
            "title":     {"type": "str", "required": True},
            "done":      {"type": "bool", "default": False},
            "priority":  {"type": "str", "default": "medium",
                          "options": ["low", "medium", "high"]},
            "created_at": {"type": "datetime"},
        },
        # OPTIONS/UI meta — drives the admin screen (kind/ref/ui hints)
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",       "label": "ID",       "sortable": True},
                    {"key": "title",    "label": "Title",    "searchable": True},
                    {"key": "done",     "label": "Done",     "type": "status"},
                    {"key": "priority", "label": "Priority", "type": "badge",
                     "variants": {"low": "secondary", "medium": "default", "high": "destructive"}},
                    {"key": "created_at", "label": "Created"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "title",    "componentType": "TextInput",
                     "required": True, "colSpan": 2, "label": "Title"},
                    {"name": "priority", "componentType": "Select",
                     "options": ["low", "medium", "high"],
                     "default": "medium", "label": "Priority"},
                    {"name": "done",     "componentType": "Checkbox",
                     "default": False, "label": "Done"},
                ]
            },
        },
        "sample_data": [
            {"id": 1, "title": "Hello world — first todo", "done": True,  "priority": "low"},
            {"id": 2, "title": "Wire the OPTIONS-driven grid", "done": False, "priority": "high"},
            {"id": 3, "title": "Ship offline mode", "done": False, "priority": "medium"},
        ],
    },
}
