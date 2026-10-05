# be/client/skillom/entities.py
# Skillom — skill-development platform (courses/labs/quizzes, Uday_AWS
# markdown-content model on the shared entity engine).
#
# CMS workflow model:
#   category → course → chapter → revision (md content, versioned)
#   revision status: draft → in_review → published (reviewer approves)
#   comment on a revision anchored to a section slug ("3-9")
#   course_release = point-in-time snapshot {chapter: revision} — a user
#   can export or roll back to it (rollback = new draft from old md,
#   history never rewritten).

ENTITIES_ORDER = [
    "overview", "category", "course", "chapter", "revision", "comment",
    "course_release", "enrollment", "progress", "lab_note",
    "quiz_submission", "review-queue",
]

entities = {
    "overview": {
        "source": "json",
        "fields": {"id": {"type": "int", "primary_key": True}},
        "ui": {},
        "config": [
            {
                "id": "skillom-overview-1",
                "type": "skillom-overview",
                "properties": {
                    "level": "base",
                    "type": "dynamic",
                    "action": [
                        {"key": "courses", "endpoint": "course", "method": "GET",
                         "queryParams": {"size": 100}},
                        {"key": "chapters", "endpoint": "chapter", "method": "GET",
                         "queryParams": {"size": 100}},
                        {"key": "revisions", "endpoint": "revision", "method": "GET",
                         "queryParams": {"size": 100}},
                        {"key": "enrollments", "endpoint": "enrollment", "method": "GET",
                         "queryParams": {"size": 100}},
                    ],
                },
                "content": {},
            },
        ],
        "sample_data": [],
    },

    "category": {
        "source": "json",
        "fields": {
            "id":    {"type": "int", "primary_key": True},
            "name":  {"type": "str", "required": True},
            "code":  {"type": "str", "unique": True},
            "icon":  {"type": "str"},
            "order": {"type": "int", "default": 0},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",    "label": "ID",   "sortable": True},
                    {"key": "order", "label": "Order", "sortable": True},
                    {"key": "name",  "label": "Name", "searchable": True},
                    {"key": "code",  "label": "Code"},
                    {"key": "icon",  "label": "Icon"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "name", "componentType": "TextInput",
                     "required": True, "colSpan": 2, "label": "Name"},
                    {"name": "code", "componentType": "TextInput",
                     "required": True, "label": "Code"},
                    {"name": "icon", "componentType": "TextInput", "label": "Icon"},
                    {"name": "order", "componentType": "NumberInput", "label": "Order"},
                ]
            },
        },
        "sample_data": [
            {
                        "id": 1,
                        "name": "AWS AgentCore",
                        "code": "agentcore",
                        "icon": "cpu",
                        "order": 1
            },
            {
                        "id": 2,
                        "name": "Linux",
                        "code": "linux",
                        "icon": "terminal",
                        "order": 2
            },
            {
                        "id": 3,
                        "name": "Docker",
                        "code": "docker",
                        "icon": "box",
                        "order": 3
            },
            {
                        "id": 4,
                        "name": "Bedrock to Production",
                        "code": "bedrock-prod",
                        "icon": "sparkles",
                        "order": 4
            },
            {
                        "id": 5,
                        "name": "AWS Masterclass",
                        "code": "aws-masterclass",
                        "icon": "cloud",
                        "order": 5
            },
            {
                        "id": 6,
                        "name": "Kubernetes",
                        "code": "k8s",
                        "icon": "ship",
                        "order": 6
            }
],
    },

    "course": {
        "source": "json",
        "fields": {
            "id":          {"type": "int", "primary_key": True},
            "category_id": {"type": "int", "required": True},
            "title":       {"type": "str", "required": True},
            "code":        {"type": "str", "unique": True},
            "description": {"type": "str"},
            "status":      {"type": "str", "default": "draft",
                            "options": ["draft", "published", "archived"]},
            "created_at":  {"type": "datetime"},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",          "label": "ID",    "sortable": True},
                    {"key": "title",       "label": "Title", "searchable": True},
                    {"key": "code",        "label": "Code"},
                    {"key": "category_id", "label": "Category"},
                    {"key": "status",      "label": "Status", "type": "badge"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "title",       "componentType": "TextInput",
                     "required": True, "colSpan": 2, "label": "Title"},
                    {"name": "code",        "componentType": "TextInput",
                     "required": True, "label": "Code"},
                    {"name": "category_id", "componentType": "Select",
                     "required": True, "label": "Category",
                     "options": ["1", "2", "3", "4"]},
                    {"name": "description", "componentType": "TextInput",
                     "colSpan": 2, "label": "Description"},
                    {"name": "status",      "componentType": "Select",
                     "label": "Status",
                     "options": ["draft", "published", "archived"]},
                ]
            },
        },
        "sample_data": [
            {
                        "id": 1,
                        "category_id": 1,
                        "title": "AWS AgentCore \u2014 Complete Series",
                        "code": "agentcore-series",
                        "status": "published",
                        "description": "12-episode Show & Tell series \u2014 intro to episodic memory.",
                        "created_at": "2024-11-01T09:00:00Z"
            },
            {
                        "id": 2,
                        "category_id": 4,
                        "title": "Bedrock to Production",
                        "code": "bedrock-to-production",
                        "status": "published",
                        "description": "20-chapter course \u2014 GenAI foundations to production capstone.",
                        "created_at": "2024-12-10T09:00:00Z"
            },
            {
                        "id": 3,
                        "category_id": 2,
                        "title": "Linux Foundations",
                        "code": "linux-foundations",
                        "status": "published",
                        "description": "Shell, filesystem, permissions \u2014 the AWS admin base layer.",
                        "created_at": "2025-01-05T09:00:00Z"
            },
            {
                        "id": 4,
                        "category_id": 3,
                        "title": "Docker \u2014 Containers & Compose",
                        "code": "docker-compose",
                        "status": "published",
                        "description": "Images, containers, networks, compose stacks.",
                        "created_at": "2025-01-12T09:00:00Z"
            },
            {
                        "id": 5,
                        "category_id": 5,
                        "title": "AWS Production Masterclass",
                        "code": "aws-masterclass",
                        "status": "published",
                        "description": "47-module production curriculum \u2014 IAM to GenAI.",
                        "created_at": "2024-10-01T09:00:00Z"
            },
            {
                        "id": 6,
                        "category_id": 6,
                        "title": "Kubernetes \u2014 Containers to Production",
                        "code": "k8s-production",
                        "status": "draft",
                        "description": "Pods, services, deployments, operators.",
                        "created_at": "2025-02-01T09:00:00Z"
            }
],
    },

    "chapter": {
        "source": "json",
        "fields": {
            "id":        {"type": "int", "primary_key": True},
            "course_id": {"type": "int", "required": True},
            "title":     {"type": "str", "required": True},
            "order":     {"type": "int", "default": 0},
            # media base for relative asset refs inside md_content
            # (imported md references e.g. "image-1.png" — resolves to
            # content_base + src when serving)
            "content_base": {"type": "str"},
            # current published revision — read path serves this
            "published_revision_id": {"type": "int"},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",        "label": "ID",       "sortable": True},
                    {"key": "order",     "label": "Order",    "sortable": True},
                    {"key": "title",     "label": "Title",    "searchable": True},
                    {"key": "course_id", "label": "Course"},
                    {"key": "published_revision_id", "label": "Published Rev"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "title",     "componentType": "TextInput",
                     "required": True, "colSpan": 2, "label": "Title"},
                    {"name": "course_id", "componentType": "Select",
                     "required": True, "label": "Course",
                     "options": ["1", "2"]},
                    {"name": "order",     "componentType": "NumberInput",
                     "label": "Order"},
                ]
            },
        },
        "sample_data": [
            {
                        "id": 1,
                        "course_id": 2,
                        "order": 1,
                        "title": "Introduction to Amazon Bedrock",
                        "published_revision_id": 1
            },
            {
                        "id": 2,
                        "course_id": 2,
                        "order": 2,
                        "title": "AgentCore Production-Ready Agents",
                        "published_revision_id": 3
            },
            {
                        "id": 3,
                        "course_id": 1,
                        "order": 1,
                        "title": "Welcome & Series Map",
                        "published_revision_id": 4
            },
            {
                        "id": 4,
                        "course_id": 1,
                        "order": 2,
                        "title": "AgentCore Runtime Deep-Dive",
                        "published_revision_id": 5
            },
            {
                        "id": 5,
                        "course_id": 3,
                        "order": 1,
                        "title": "Shell & Filesystem",
                        "published_revision_id": 6
            },
            {
                        "id": 6,
                        "course_id": 3,
                        "order": 2,
                        "title": "Permissions & Users",
                        "published_revision_id": 7
            },
            {
                        "id": 7,
                        "course_id": 4,
                        "order": 1,
                        "title": "Images & Containers",
                        "published_revision_id": 8
            },
            {
                        "id": 8,
                        "course_id": 4,
                        "order": 2,
                        "title": "Docker Compose Stacks",
                        "published_revision_id": 9
            },
            {
                        "id": 9,
                        "course_id": 5,
                        "order": 1,
                        "title": "IAM \u2014 Accounts, Roles, Policies",
                        "published_revision_id": 10
            },
            {
                        "id": 10,
                        "course_id": 5,
                        "order": 2,
                        "title": "Amazon S3 \u2014 Buckets & Storage Classes",
                        "published_revision_id": 11
            }
],
    },

    # Versioned markdown content — draft → in_review → published.
    # Rollback = create a new draft revision copying an old version's md;
    # published history is immutable.
    "revision": {
        "source": "json",
        "fields": {
            "id":           {"type": "int", "primary_key": True},
            "chapter_id":   {"type": "int", "required": True},
            "version_no":   {"type": "int", "required": True},
            "md_content":   {"type": "str", "required": True},
            "author":       {"type": "str"},
            "status":       {"type": "str", "default": "draft",
                             "options": ["draft", "in_review", "published", "rejected"]},
            "review_note":  {"type": "str"},
            "created_at":   {"type": "datetime"},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",         "label": "ID",       "sortable": True},
                    {"key": "chapter_id", "label": "Chapter"},
                    {"key": "version_no", "label": "Version",  "sortable": True},
                    {"key": "author",     "label": "Author",   "searchable": True},
                    {"key": "status",     "label": "Status",   "type": "badge"},
                    {"key": "created_at", "label": "Created"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "chapter_id",  "componentType": "Select",
                     "required": True, "label": "Chapter",
                     "options": ["1", "2", "3"]},
                    {"name": "version_no",  "componentType": "NumberInput",
                     "required": True, "label": "Version No"},
                    {"name": "md_content",  "componentType": "TextInput",
                     "required": True, "colSpan": 2, "label": "Markdown Content"},
                    {"name": "author",      "componentType": "TextInput", "label": "Author"},
                    {"name": "status",      "componentType": "Select",
                     "label": "Status",
                     "options": ["draft", "in_review", "published", "rejected"]},
                    {"name": "review_note", "componentType": "TextInput",
                     "colSpan": 2, "label": "Review Note"},
                ]
            },
        },
        "sample_data": [
            {
                        "id": 1,
                        "chapter_id": 1,
                        "version_no": 1,
                        "author": "deepti",
                        "status": "published",
                        "md_content": "# Introduction to Amazon Bedrock\n\nAmazon Bedrock is a fully managed service that offers foundation models from Amazon and leading AI companies through a single API.\n\n<VideoSection youtubeId=\"f-rl_4Pd8dw\" title=\"Bedrock overview\" />\n\n## What Bedrock gives you\n\n- Unified API across model providers\n- No infrastructure to manage\n- Knowledge bases, agents, guardrails\n\n```python\nimport boto3\nclient = boto3.client(\"bedrock-runtime\")\nresponse = client.invoke_model(modelId=\"anthropic.claude-3\", body=payload)\n```\n\n<InfoCard title=\"Key idea\">You pay per token \u2014 no GPU provisioning, no model hosting.</InfoCard>\n\n## Quick check\n\n<Quiz question=\"What does Bedrock manage for you?\" options={[\"Your GPU clusters\",\"Foundation model access via API\",\"Your training data\"]} answerIndex={1} explanation=\"Bedrock is a managed API over foundation models.\" />\n\n> **Remember** \u2014 Bedrock \u2260 training platform. It serves *inference + orchestration*.\n",
                        "created_at": "2024-12-12T10:00:00Z"
            },
            {
                        "id": 2,
                        "chapter_id": 1,
                        "version_no": 2,
                        "author": "deepti",
                        "status": "in_review",
                        "md_content": "# Introduction to Amazon Bedrock\n\nv2 \u2014 adds model explorer walkthrough\n\n## New section\n\nWork in progress.",
                        "created_at": "2024-12-20T15:30:00Z"
            },
            {
                        "id": 3,
                        "chapter_id": 2,
                        "version_no": 1,
                        "author": "nishant",
                        "status": "published",
                        "md_content": "# AgentCore Production-Ready Agents\n\nRuntime, sessions, memory, gateway \u2014 the production checklist.\n\n<InfoCard title=\"Scope\">Everything below is deploy-day material.</InfoCard>",
                        "created_at": "2024-12-14T09:00:00Z"
            },
            {
                        "id": 4,
                        "chapter_id": 3,
                        "version_no": 1,
                        "author": "nishant",
                        "status": "published",
                        "md_content": "# Welcome & Series Map\n\nTwelve episodes from prototype to episodic memory.\n\n- Episodes 1-4: foundations\n- Episodes 5-9: tools, memory, eval\n- Episodes 10-12: production\n",
                        "created_at": "2025-01-02T11:00:00Z"
            },
            {
                        "id": 5,
                        "chapter_id": 4,
                        "version_no": 1,
                        "author": "nishant",
                        "status": "published",
                        "md_content": "# AgentCore Runtime \u2014 Deploy & Invoke\n\nThe Runtime hosts your agent container and exposes a session-based invoke API.\n\n## Deploy flow\n\n1. Build container with your agent\n2. `agentcore deploy` pushes to Runtime\n3. Invoke with a session id \u2014 memory persists per session\n\n<WarningCard title=\"Cold starts\">First invoke can take 10-20s \u2014 warm with a ping for demos.</WarningCard>\n\n<Quiz question=\"What keeps per-user conversation state?\" options={[\"The container\",\"Session id\",\"The gateway\"]} answerIndex={1} explanation=\"Runtime keys memory to the session id you pass.\" />\n",
                        "created_at": "2025-01-03T09:00:00Z"
            },
            {
                        "id": 6,
                        "chapter_id": 5,
                        "version_no": 1,
                        "author": "uday",
                        "status": "published",
                        "md_content": "# Linux Foundations \u2014 Shell & Filesystem\n\nEverything in Linux is a file \u2014 devices, processes, sockets.\n\n## Core commands\n\n```bash\nls -la\npwd\ncd /var/log\ncat syslog | tail -20\n```\n\n<TipCard title=\"Muscle memory\">Learn `ls -lah` and `cd -` early \u2014 you'll use them hundreds of times a day.</TipCard>\n\n1. pwd \u2014 where am I\n2. ls \u2014 what is here\n3. cd \u2014 go somewhere\n4. cat / less \u2014 read files\n\n<Quiz question=\"Which command shows the current directory?\" options={[\"ls\",\"pwd\",\"cd\",\"whoami\"]} answerIndex={1} />\n",
                        "created_at": "2025-01-06T09:00:00Z"
            },
            {
                        "id": 7,
                        "chapter_id": 6,
                        "version_no": 1,
                        "author": "uday",
                        "status": "published",
                        "md_content": "# Permissions & Users\n\n`chmod`, `chown`, groups \u2014 the permission model in 20 minutes.\n\n```bash\nchmod 640 app.conf\nchown app:ops app.conf\n```\n\n<Quiz question=\"What does chmod 640 give the group?\" options={[\"read\",\"write\",\"execute\"]} answerIndex={0} />\n",
                        "created_at": "2025-01-07T09:00:00Z"
            },
            {
                        "id": 8,
                        "chapter_id": 7,
                        "version_no": 1,
                        "author": "uday",
                        "status": "published",
                        "md_content": "# Images & Containers\n\nAn image is a layered filesystem; a container is a running instance.\n\n```bash\ndocker build -t app:v1 .\ndocker run -p 8080:80 app:v1\n```\n",
                        "created_at": "2025-01-13T09:00:00Z"
            },
            {
                        "id": 9,
                        "chapter_id": 8,
                        "version_no": 1,
                        "author": "uday",
                        "status": "published",
                        "md_content": "# Docker Compose Stacks\n\nMulti-service apps in one YAML.\n\n```yaml\nservices:\n  web:\n    image: app:v1\n    ports: [\"8080:80\"]\n  db:\n    image: postgres:15\n```\n",
                        "created_at": "2025-01-14T09:00:00Z"
            },
            {
                        "id": 10,
                        "chapter_id": 9,
                        "version_no": 1,
                        "author": "nishant",
                        "status": "published",
                        "md_content": "# IAM \u2014 Accounts, Roles, Policies\n\nIdentity is the perimeter. Roles over keys, always.\n\n<WarningCard title=\"Never\">Long-lived access keys in code. Use roles / instance profiles.</WarningCard>\n\n<Quiz question=\"Best practice for EC2 \u2192 S3 access?\" options={[\"Access keys in env\",\"IAM instance role\",\"Hardcode in AMI\"]} answerIndex={1} />\n",
                        "created_at": "2024-10-02T09:00:00Z"
            },
            {
                        "id": 11,
                        "chapter_id": 10,
                        "version_no": 1,
                        "author": "nishant",
                        "status": "published",
                        "md_content": "# Amazon S3 \u2014 Buckets & Storage Classes\n\nObject storage: STANDARD \u2192 INTELLIGENT \u2192 GLACIER.\n\n```bash\naws s3 mb s3://my-bucket\naws s3 cp file.txt s3://my-bucket/\n```\n",
                        "created_at": "2024-10-03T09:00:00Z"
            },
            {
                        "id": 12,
                        "chapter_id": 4,
                        "version_no": 2,
                        "author": "nishant",
                        "status": "draft",
                        "md_content": "# AgentCore Runtime Deep-Dive\n\nv2 draft \u2014 adds observability section (WIP).",
                        "created_at": "2025-01-10T09:00:00Z"
            }
],
    },

    # Reviewer comments — anchored to a chapter section slug ("3-9") so the
    # note survives markdown edits that keep section numbers stable.
    "comment": {
        "source": "json",
        "fields": {
            "id":          {"type": "int", "primary_key": True},
            "chapter_id":  {"type": "int", "required": True},
            "revision_id": {"type": "int"},
            "anchor":      {"type": "str"},   # section slug e.g. "3-9"
            "author":      {"type": "str"},
            "body":        {"type": "str", "required": True},
            "resolved":    {"type": "bool", "default": False},
            "created_at":  {"type": "datetime"},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",         "label": "ID",       "sortable": True},
                    {"key": "chapter_id", "label": "Chapter"},
                    {"key": "anchor",     "label": "Section"},
                    {"key": "author",     "label": "Author",   "searchable": True},
                    {"key": "body",       "label": "Comment",  "searchable": True},
                    {"key": "resolved",   "label": "Resolved", "type": "status"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "chapter_id",  "componentType": "Select",
                     "required": True, "label": "Chapter",
                     "options": ["1", "2", "3"]},
                    {"name": "revision_id", "componentType": "NumberInput",
                     "label": "Revision"},
                    {"name": "anchor",      "componentType": "TextInput",
                     "label": "Section Anchor"},
                    {"name": "author",      "componentType": "TextInput", "label": "Author"},
                    {"name": "body",        "componentType": "TextInput",
                     "required": True, "colSpan": 2, "label": "Comment"},
                    {"name": "resolved",    "componentType": "Checkbox", "label": "Resolved"},
                ]
            },
        },
        "sample_data": [
            {"id": 1, "chapter_id": 1, "revision_id": 2, "anchor": "1-4",
             "author": "nishant", "resolved": False,
             "body": "Add a model-comparison table before the catalog section.",
             "created_at": "2024-12-21T09:10:00Z"},
            {"id": 2, "chapter_id": 1, "revision_id": 2, "anchor": "quiz",
             "author": "uday", "resolved": True,
             "body": "Q2 distractor C is too obvious — rewrite.",
             "created_at": "2024-12-21T12:40:00Z"},
        ],
    },

    # Point-in-time course snapshot — {chapter_id: revision_id} map.
    # Users can export a release or roll the course back to it.
    "course_release": {
        "source": "json",
        "fields": {
            "id":          {"type": "int", "primary_key": True},
            "course_id":   {"type": "int", "required": True},
            "version_no":  {"type": "int", "required": True},
            "snapshot":    {"type": "str"},   # JSON: {"1": 2, "2": 1, …}
            "label":       {"type": "str"},
            "created_by":  {"type": "str"},
            "created_at":  {"type": "datetime"},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",         "label": "ID",      "sortable": True},
                    {"key": "course_id",  "label": "Course"},
                    {"key": "version_no", "label": "Version", "sortable": True},
                    {"key": "label",      "label": "Label",   "searchable": True},
                    {"key": "created_by", "label": "By"},
                    {"key": "created_at", "label": "Created"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "course_id",  "componentType": "Select",
                     "required": True, "label": "Course", "options": ["1", "2"]},
                    {"name": "version_no", "componentType": "NumberInput",
                     "required": True, "label": "Version No"},
                    {"name": "label",      "componentType": "TextInput", "label": "Label"},
                    {"name": "snapshot",   "componentType": "TextInput",
                     "colSpan": 2, "label": "Snapshot (chapter→revision JSON)"},
                ]
            },
        },
        "sample_data": [
            {"id": 1, "course_id": 2, "version_no": 1, "label": "v1 — chapters 1-6 live",
             "snapshot": "{\"1\": 1, \"2\": 3}", "created_by": "nishant",
             "created_at": "2025-01-05T18:00:00Z"},
        ],
    },

    "enrollment": {
        "source": "json",
        "fields": {
            "id":           {"type": "int", "primary_key": True},
            "user_id":      {"type": "str", "required": True},
            "course_id":    {"type": "int", "required": True},
            "status":       {"type": "str", "default": "active",
                             "options": ["active", "completed", "dropped"]},
            "enrolled_at":  {"type": "datetime"},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",          "label": "ID",      "sortable": True},
                    {"key": "user_id",     "label": "User",    "searchable": True},
                    {"key": "course_id",   "label": "Course"},
                    {"key": "status",      "label": "Status",  "type": "badge"},
                    {"key": "enrolled_at", "label": "Enrolled"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "user_id",   "componentType": "TextInput",
                     "required": True, "label": "User"},
                    {"name": "course_id", "componentType": "Select",
                     "required": True, "label": "Course", "options": ["1", "2"]},
                    {"name": "status",    "componentType": "Select",
                     "label": "Status",
                     "options": ["active", "completed", "dropped"]},
                ]
            },
        },
        "sample_data": [
            {"id": 1, "user_id": "deepti", "course_id": 2, "status": "active",
             "enrolled_at": "2025-01-03T08:00:00Z"},
            {"id": 2, "user_id": "uday",   "course_id": 1, "status": "completed",
             "enrolled_at": "2024-11-15T08:00:00Z"},
        ],
    },

    # Per-user section completion — the cart-equivalent session entity when
    # running anonymous; rows here once logged in.
    "progress": {
        "source": "json",
        "fields": {
            "id":         {"type": "int", "primary_key": True},
            "user_id":    {"type": "str", "required": True},
            "chapter_id": {"type": "int", "required": True},
            "section":    {"type": "str"},   # section slug e.g. "3-9"
            "completed":  {"type": "bool", "default": False},
            "updated_at": {"type": "datetime"},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",         "label": "ID",       "sortable": True},
                    {"key": "user_id",    "label": "User",     "searchable": True},
                    {"key": "chapter_id", "label": "Chapter"},
                    {"key": "section",    "label": "Section"},
                    {"key": "completed",  "label": "Done",     "type": "status"},
                    {"key": "updated_at", "label": "Updated"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "user_id",    "componentType": "TextInput",
                     "required": True, "label": "User"},
                    {"name": "chapter_id", "componentType": "Select",
                     "required": True, "label": "Chapter", "options": ["1", "2", "3"]},
                    {"name": "section",    "componentType": "TextInput", "label": "Section"},
                    {"name": "completed",  "componentType": "Checkbox", "label": "Completed"},
                ]
            },
        },
        "sample_data": [
            {"id": 1, "user_id": "deepti", "chapter_id": 1, "section": "1-1",
             "completed": True, "updated_at": "2025-01-04T10:00:00Z"},
            {"id": 2, "user_id": "deepti", "chapter_id": 1, "section": "1-2",
             "completed": True, "updated_at": "2025-01-04T10:20:00Z"},
        ],
    },

    "lab_note": {
        "source": "json",
        "fields": {
            "id":         {"type": "int", "primary_key": True},
            "user_id":    {"type": "str", "required": True},
            "chapter_id": {"type": "int", "required": True},
            "content":    {"type": "str"},
            "updated_at": {"type": "datetime"},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",         "label": "ID",      "sortable": True},
                    {"key": "user_id",    "label": "User",    "searchable": True},
                    {"key": "chapter_id", "label": "Chapter"},
                    {"key": "updated_at", "label": "Updated"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "user_id",    "componentType": "TextInput",
                     "required": True, "label": "User"},
                    {"name": "chapter_id", "componentType": "Select",
                     "required": True, "label": "Chapter", "options": ["1", "2", "3"]},
                    {"name": "content",    "componentType": "TextInput",
                     "colSpan": 2, "label": "Notes"},
                ]
            },
        },
        "sample_data": [
            {"id": 1, "user_id": "deepti", "chapter_id": 1,
             "content": "Remember: Bedrock = managed FMs via API, no GPU ops.",
             "updated_at": "2025-01-04T10:30:00Z"},
        ],
    },

    "quiz_submission": {
        "source": "json",
        "fields": {
            "id":           {"type": "int", "primary_key": True},
            "user_id":      {"type": "str", "required": True},
            "chapter_id":   {"type": "int", "required": True},
            "quiz_id":      {"type": "str"},
            "score":        {"type": "int", "default": 0},
            "total":        {"type": "int", "default": 0},
            "submitted_at": {"type": "datetime"},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",         "label": "ID",      "sortable": True},
                    {"key": "user_id",    "label": "User",    "searchable": True},
                    {"key": "chapter_id", "label": "Chapter"},
                    {"key": "score",      "label": "Score"},
                    {"key": "total",      "label": "Total"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "user_id",    "componentType": "TextInput",
                     "required": True, "label": "User"},
                    {"name": "chapter_id", "componentType": "Select",
                     "required": True, "label": "Chapter", "options": ["1", "2", "3"]},
                    {"name": "quiz_id",    "componentType": "TextInput", "label": "Quiz"},
                    {"name": "score",      "componentType": "NumberInput", "label": "Score"},
                    {"name": "total",      "componentType": "NumberInput", "label": "Total"},
                ]
            },
        },
        "sample_data": [
            {"id": 1, "user_id": "deepti", "chapter_id": 1, "quiz_id": "ch1-quick-quiz",
             "score": 3, "total": 3, "submitted_at": "2025-01-04T10:45:00Z"},
        ],
    },

    # Review board — OPTIONS serves a `config` def so /admin/review-queue
    # renders the skillom "revision-pipeline" component: status columns
    # plus lazy write actions (transition = PUT revision/:rid,
    # rollback = POST revision copying old md into a new draft).
    "review-queue": {
        "source": "json",
        "fields": {"id": {"type": "int", "primary_key": True}},
        "config": [{
            "id": "revision-pipeline",
            "type": "revision-pipeline",
            "properties": {
                "level": "base",
                "type": "dynamic",
                "action": [
                    {"key": "revisions", "endpoint": "revision",
                     "method": "GET", "queryParams": {"size": 500}},
                    {"key": "transition", "endpoint": "revision/:rid",
                     "method": "PUT", "lazy": True,
                     "payload": {"status": ":status"}},
                    {"key": "rollback", "endpoint": "revision",
                     "method": "POST", "lazy": True,
                     "payload": {"chapter_id": ":chapter_id",
                                 "version_no": ":version_no",
                                 "md_content": ":md_content",
                                 "author": ":author",
                                 "status": "draft"}},
                ],
            },
            "content": {"title": "Review Pipeline"},
        }],
        "sample_data": [],
    },
}
