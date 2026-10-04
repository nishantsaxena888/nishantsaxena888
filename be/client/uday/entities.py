# be/client/uday/entities.py
# Entity DSL — the single source of truth (same shape as nishify clients/*/entities.py)
# Learning-platform client (Uday_AWS model). Sample data is temporary
# scaffolding for testing — swap the source once real content exists.

ENTITIES_ORDER = ["overview", "course", "lesson", "quiz"]

entities = {
    # Admin landing screen — OPTIONS returns `config` (Definition[]) so the
    # client's uday-overview component renders instead of default-admin.
    "overview": {
        "source": "json",
        "fields": {"id": {"type": "int", "primary_key": True}},
        "ui": {},
        "config": [
            {
                "id": "uday-overview-1",
                "type": "uday-overview",
                "properties": {
                    "level": "base",
                    "type": "dynamic",
                    "action": [
                        {"key": "courses", "endpoint": "course", "method": "GET",
                         "queryParams": {"size": 100}},
                        {"key": "lessons", "endpoint": "lesson", "method": "GET",
                         "queryParams": {"size": 100}},
                        {"key": "quizzes", "endpoint": "quiz", "method": "GET",
                         "queryParams": {"size": 100}},
                    ],
                },
                "content": {},
            },
        ],
        "sample_data": [],
    },

    "course": {
        "source": "json",
        "fields": {
            "id":          {"type": "int", "primary_key": True},
            "title":       {"type": "str", "required": True},
            "description": {"type": "str"},
            "level":       {"type": "str", "default": "beginner",
                            "options": ["beginner", "intermediate", "advanced"]},
            "lessons":     {"type": "int", "default": 0},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",      "label": "ID",      "sortable": True},
                    {"key": "title",   "label": "Title",   "searchable": True},
                    {"key": "level",   "label": "Level",   "type": "badge",
                     "variants": {"beginner": "secondary", "intermediate": "default",
                                  "advanced": "destructive"}},
                    {"key": "lessons", "label": "Lessons", "sortable": True},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "title",       "componentType": "TextInput",
                     "required": True, "colSpan": 2, "label": "Title"},
                    {"name": "description", "componentType": "TextInput",
                     "colSpan": 2, "label": "Description"},
                    {"name": "level",       "componentType": "Select",
                     "options": ["beginner", "intermediate", "advanced"],
                     "default": "beginner", "label": "Level"},
                    {"name": "lessons",     "componentType": "TextInput",
                     "default": "0", "label": "Lessons"},
                ]
            },
        },
        "sample_data": [
            {"id": 1, "title": "AWS Lambda Masterclass", "description": "47-module serverless deep dive.",
             "level": "advanced", "lessons": 47},
            {"id": 2, "title": "Python Fundamentals",    "description": "Variables to classes in one course.",
             "level": "beginner", "lessons": 12},
            {"id": 3, "title": "Networking Basics",      "description": "TCP/IP, DNS and load balancers.",
             "level": "intermediate", "lessons": 9},
        ],
    },

    "lesson": {
        "source": "json",
        "fields": {
            "id":        {"type": "int", "primary_key": True},
            "course":    {"type": "str", "required": True},
            "title":     {"type": "str", "required": True},
            "content":   {"type": "str"},
            "order":     {"type": "int", "default": 0},
            "duration":  {"type": "str", "default": "10 min"},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",       "label": "ID",       "sortable": True},
                    {"key": "course",   "label": "Course",   "searchable": True},
                    {"key": "title",    "label": "Title",    "searchable": True},
                    {"key": "order",    "label": "Order",    "sortable": True},
                    {"key": "duration", "label": "Duration"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "course",   "componentType": "TextInput",
                     "required": True, "label": "Course"},
                    {"name": "title",    "componentType": "TextInput",
                     "required": True, "colSpan": 2, "label": "Title"},
                    {"name": "content",  "componentType": "TextInput",
                     "colSpan": 2, "label": "Content"},
                    {"name": "order",    "componentType": "TextInput",
                     "default": "0", "label": "Order"},
                    {"name": "duration", "componentType": "TextInput",
                     "default": "10 min", "label": "Duration"},
                ]
            },
        },
        "sample_data": [
            {"id": 1, "course": "AWS Lambda Masterclass", "title": "What is serverless?",
             "order": 1, "duration": "12 min",
             "content": "# What is serverless?\n\nServerless means you deploy **functions**, not servers.\n\n- No provisioning\n- Pay per invocation\n- Scales to zero\n\n```\naws lambda create-function --runtime python3.11\n```"},
            {"id": 2, "course": "AWS Lambda Masterclass", "title": "Your first function",
             "order": 2, "duration": "18 min",
             "content": "# Your first function\n\nA Lambda handler takes an **event** and a **context**.\n\n```python\ndef handler(event, context):\n    return {'statusCode': 200}\n```\n\nDeploy it with the console or the CLI."},
            {"id": 3, "course": "Python Fundamentals", "title": "Variables & types",
             "order": 1, "duration": "10 min",
             "content": "# Variables & types\n\nPython is dynamically typed.\n\n- `int`, `float`, `str`, `bool`\n- `list`, `dict`, `set`, `tuple`\n\n```python\nx = 42\nname = \"ada\"\n```"},
        ],
    },

    "quiz": {
        "source": "json",
        "fields": {
            "id":       {"type": "int", "primary_key": True},
            "lesson":   {"type": "str", "required": True},
            "question": {"type": "str", "required": True},
            "options":  {"type": "str"},
            "answer":   {"type": "int", "default": 0},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",       "label": "ID",       "sortable": True},
                    {"key": "lesson",   "label": "Lesson",   "searchable": True},
                    {"key": "question", "label": "Question", "searchable": True},
                    {"key": "answer",   "label": "Answer"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "lesson",   "componentType": "TextInput",
                     "required": True, "label": "Lesson"},
                    {"name": "question", "componentType": "TextInput",
                     "required": True, "colSpan": 2, "label": "Question"},
                    {"name": "options",  "componentType": "TextInput",
                     "colSpan": 2, "label": "Options (| separated)"},
                    {"name": "answer",   "componentType": "TextInput",
                     "default": "0", "label": "Answer index"},
                ]
            },
        },
        "sample_data": [
            {"id": 1, "lesson": "What is serverless?",
             "question": "What does 'scales to zero' mean?",
             "options": "No servers ever|No cost when idle|Zero latency|Free tier only",
             "answer": 1},
        ],
    },
}
