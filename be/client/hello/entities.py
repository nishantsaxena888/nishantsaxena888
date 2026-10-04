# be/client/hello/entities.py
# Entity DSL — the single source of truth (same shape as nishify clients/*/entities.py)

ENTITIES_ORDER = ["overview", "todo"]

entities = {
    # Admin landing screen — OPTIONS returns `config` (Definition[]) instead
    # of a table/form schema, so DashboardControl renders the client's own
    # hello-overview component rather than the generic grid. The entity is
    # never CRUD'd; fields/sample_data are nominal.
    "overview": {
        "source": "json",
        "fields": {"id": {"type": "int", "primary_key": True}},
        "ui": {},
        "config": [
            {
                "id": "hello-overview-1",
                "type": "hello-overview",
                "properties": {
                    "level": "base",
                    "type": "dynamic",
                    "action": [
                        {"key": "todos", "endpoint": "todo", "method": "GET",
                         "queryParams": {"size": 100}},
                    ],
                },
                "content": {},
            },
        ],
        "sample_data": [],
    },

    "todo": {
        "source": "json",   # implementation is secondary — swap sources freely
        # RBAC demo: anyone (incl. anonymous) reads, only the "admin" role
        # writes. Roles are declared in configuration.json "roles".
        "rbac": {"read": "*", "write": ["admin"]},
        # Row-level rule filter: viewers only see pending todos; admin sees
        # everything. Caller params merge UNDER the scope (can't escape it).
        "filter": {"viewer": {"done__eq": "false"}},
        # Field-level ACL: created_at hidden from viewers (stripped from
        # rows AND the OPTIONS schema); still usable for scoping.
        "field_acl": {"viewer": ["created_at"]},
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
