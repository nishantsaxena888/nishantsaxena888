# be/client/grocery/entities.py
# Entity DSL — the single source of truth (same shape as nishify clients/*/entities.py)
# Sample data is temporary scaffolding for testing ("mocks") — swap the source
# or replace the rows once real data exists.

ENTITIES_ORDER = ["category", "product", "customer", "order"]

entities = {
    "category": {
        "source": "json",
        "fields": {
            "id":   {"type": "int", "primary_key": True},
            "name": {"type": "str", "required": True},
            "code": {"type": "str", "unique": True},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",   "label": "ID",   "sortable": True},
                    {"key": "name", "label": "Name", "searchable": True},
                    {"key": "code", "label": "Code"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "name", "componentType": "TextInput",
                     "required": True, "colSpan": 2, "label": "Name"},
                    {"name": "code", "componentType": "TextInput",
                     "required": True, "label": "Code"},
                ]
            },
        },
        "sample_data": [
            {"id": 1, "name": "Produce",  "code": "PROD"},
            {"id": 2, "name": "Dairy",    "code": "DAIR"},
            {"id": 3, "name": "Bakery",   "code": "BAKE"},
            {"id": 4, "name": "Drinks",   "code": "DRNK"},
        ],
    },

    "product": {
        "source": "json",
        "fields": {
            "id":       {"type": "int", "primary_key": True},
            "name":     {"type": "str", "required": True},
            "category": {"type": "str", "default": "Produce"},
            "price":    {"type": "float", "default": 0.0},
            "stock":    {"type": "int", "default": 0},
            "on_sale":  {"type": "bool", "default": False},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",       "label": "ID",       "sortable": True},
                    {"key": "name",     "label": "Name",     "searchable": True},
                    {"key": "category", "label": "Category", "type": "badge",
                     "variants": {"Produce": "default", "Dairy": "secondary",
                                  "Bakery": "secondary", "Drinks": "secondary"}},
                    {"key": "price",    "label": "Price",    "sortable": True},
                    {"key": "stock",    "label": "Stock",    "sortable": True},
                    {"key": "on_sale",  "label": "On Sale",  "type": "status"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "name",     "componentType": "TextInput",
                     "required": True, "colSpan": 2, "label": "Name"},
                    {"name": "category", "componentType": "Select",
                     "options": ["Produce", "Dairy", "Bakery", "Drinks"],
                     "default": "Produce", "label": "Category"},
                    {"name": "price",    "componentType": "TextInput",
                     "default": "0", "label": "Price"},
                    {"name": "stock",    "componentType": "TextInput",
                     "default": "0", "label": "Stock"},
                    {"name": "on_sale",  "componentType": "Checkbox",
                     "default": False, "label": "On Sale"},
                ]
            },
        },
        "sample_data": [
            {"id": 1, "name": "Apples (1kg)",      "category": "Produce", "price": 3.49,  "stock": 42,  "on_sale": True},
            {"id": 2, "name": "Bananas (1kg)",     "category": "Produce", "price": 1.99,  "stock": 67,  "on_sale": False},
            {"id": 3, "name": "Whole Milk (1L)",   "category": "Dairy",   "price": 2.29,  "stock": 30,  "on_sale": False},
            {"id": 4, "name": "Cheddar (250g)",    "category": "Dairy",   "price": 4.79,  "stock": 18,  "on_sale": True},
            {"id": 5, "name": "Sourdough Loaf",    "category": "Bakery",  "price": 5.20,  "stock": 12,  "on_sale": False},
            {"id": 6, "name": "Croissants (4pk)",  "category": "Bakery",  "price": 3.60,  "stock": 20,  "on_sale": True},
            {"id": 7, "name": "Orange Juice (1L)", "category": "Drinks",  "price": 3.10,  "stock": 25,  "on_sale": False},
            {"id": 8, "name": "Cola (2L)",         "category": "Drinks",  "price": 2.50,  "stock": 40,  "on_sale": False},
        ],
    },

    "customer": {
        "source": "json",
        "fields": {
            "id":    {"type": "int", "primary_key": True},
            "name":  {"type": "str", "required": True},
            "email": {"type": "str"},
            "loyalty_points": {"type": "int", "default": 0},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",    "label": "ID",   "sortable": True},
                    {"key": "name",  "label": "Name", "searchable": True},
                    {"key": "email", "label": "Email"},
                    {"key": "loyalty_points", "label": "Points", "sortable": True},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "name",  "componentType": "TextInput",
                     "required": True, "colSpan": 2, "label": "Name"},
                    {"name": "email", "componentType": "TextInput",
                     "label": "Email"},
                    {"name": "loyalty_points", "componentType": "TextInput",
                     "default": "0", "label": "Loyalty Points"},
                ]
            },
        },
        "sample_data": [
            {"id": 1, "name": "Mina Park",    "email": "mina@example.com",  "loyalty_points": 240},
            {"id": 2, "name": "Theo Alvarez", "email": "theo@example.com",  "loyalty_points": 85},
        ],
    },

    "order": {
        "source": "json",
        "fields": {
            "id":        {"type": "int", "primary_key": True},
            "customer":  {"type": "str", "required": True},
            "total":     {"type": "float", "default": 0.0},
            "status":    {"type": "str", "default": "pending",
                          "options": ["pending", "packed", "delivered", "cancelled"]},
            "created_at": {"type": "datetime"},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",       "label": "ID",       "sortable": True},
                    {"key": "customer", "label": "Customer", "searchable": True},
                    {"key": "total",    "label": "Total",    "sortable": True},
                    {"key": "status",   "label": "Status",   "type": "badge",
                     "variants": {"pending": "default", "packed": "secondary",
                                  "delivered": "secondary", "cancelled": "destructive"}},
                    {"key": "created_at", "label": "Created"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "customer", "componentType": "TextInput",
                     "required": True, "colSpan": 2, "label": "Customer"},
                    {"name": "total",    "componentType": "TextInput",
                     "default": "0", "label": "Total"},
                    {"name": "status",   "componentType": "Select",
                     "options": ["pending", "packed", "delivered", "cancelled"],
                     "default": "pending", "label": "Status"},
                ]
            },
        },
        "sample_data": [
            {"id": 1, "customer": "Mina Park",    "total": 15.38, "status": "packed"},
            {"id": 2, "customer": "Theo Alvarez", "total": 42.10, "status": "pending"},
            {"id": 3, "customer": "Mina Park",    "total": 8.99,  "status": "delivered"},
        ],
    },
}
