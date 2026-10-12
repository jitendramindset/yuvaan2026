import csv
import os
import re
from collections import defaultdict, OrderedDict

base = r"D:\React App\Yuvaan-v1\botmantra-backend"
file_tables = os.path.join(base, "Tables + columns.csv")
file_indexes = os.path.join(base, "Indexes.csv")
file_fks = os.path.join(base, "Foreign keys detail.csv")

rows = []
with open(file_tables, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows.append(row)

public_rows = [
    r
    for r in rows
    if r["table_schema"] == "public" and not r["table_name"].startswith("v_")
]

seen_tables = []
for r in public_rows:
    t = r["table_name"]
    if t not in seen_tables:
        seen_tables.append(t)

columns_by_table = OrderedDict((t, []) for t in seen_tables)
for r in public_rows:
    columns_by_table[r["table_name"]].append(r)

enum_values = defaultdict(set)
column_enum = {}

enum_pattern = re.compile(r"'([^']*)'::([a-zA-Z0-9_\.]+)")
for r in public_rows:
    if r["data_type"] == "USER-DEFINED":
        default = (r.get("column_default") or "").strip()
        if default and default.lower() != "null":
            m = enum_pattern.search(default)
            if m:
                val, enum_full = m.group(1), m.group(2)
                enum_name = enum_full.split(".")[-1]
                enum_values[enum_name].add(val)
                column_enum[(r["table_name"], r["column_name"])] = enum_name

seq_pattern = re.compile(r"nextval\('([^']+)'::regclass\)")
sequences = OrderedDict()
for r in public_rows:
    default = (r.get("column_default") or "").strip()
    if default and default.lower() != "null":
        m = seq_pattern.search(default)
        if m:
            seq_full = m.group(1)
            seq_full_clean = seq_full.replace('"', "")
            if "." in seq_full_clean:
                schema, name = seq_full_clean.split(".", 1)
            else:
                schema, name = "public", seq_full_clean
            sequences[f"{schema}.{name}"] = (schema, name)

embedding_keywords = ("embedding", "vec_embedding", "query_embedding")


def map_type(r):
    data_type = r["data_type"]
    col_name = r["column_name"]
    if data_type == "ARRAY":
        return "text[]"
    if data_type == "USER-DEFINED":
        lower_name = col_name.lower()
        if any(k in lower_name for k in embedding_keywords):
            return "vector"
        enum_name = column_enum.get((r["table_name"], r["column_name"]))
        if enum_name:
            return enum_name
        return "text"
    return data_type

create_tables = []
for table, cols in columns_by_table.items():
    lines = []
    for c in cols:
        col_parts = [c["column_name"], map_type(c)]
        if c["is_nullable"] == "NO":
            col_parts.append("NOT NULL")
        default = (c.get("column_default") or "").strip()
        if default and default.lower() != "null":
            col_parts.append(f"DEFAULT {default}")
        lines.append("  " + " ".join(col_parts))
    stmt = (
        f"CREATE TABLE IF NOT EXISTS public.{table} (\n"
        + ",\n".join(lines)
        + "\n);"
    )
    create_tables.append(stmt)

pks = []
with open(file_indexes, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row["schemaname"] != "public":
            continue
        if not row["indexname"].endswith("_pkey"):
            continue
        table = row["tablename"]
        if table.startswith("v_"):
            continue
        indexdef = row["indexdef"]
        m = re.search(r"USING\s+\w+\s*\(([^)]+)\)", indexdef)
        if not m:
            continue
        cols = m.group(1)
        constraint = row["indexname"]
        pks.append(
            f"ALTER TABLE public.{table} ADD CONSTRAINT {constraint} PRIMARY KEY ({cols});"
        )

fks = []
with open(file_fks, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row["table_schema"] != "public":
            continue
        if row["table_name"].startswith("v_"):
            continue
        if row["foreign_table_schema"] != "public":
            continue
        table = row["table_name"]
        col = row["column_name"]
        ft = row["foreign_table_name"]
        fc = row["foreign_column_name"]
        constraint = row["constraint_name"]
        fks.append(
            f"ALTER TABLE public.{table} ADD CONSTRAINT {constraint} FOREIGN KEY ({col}) REFERENCES public.{ft}({fc});"
        )

lines = []
lines.append("BEGIN;")
lines.append("CREATE EXTENSION IF NOT EXISTS vector;")

for enum_name in sorted(enum_values.keys()):
    values = sorted(enum_values[enum_name])
    vals = ", ".join([f"'{v}'" for v in values])
    lines.append(
        "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{0}') THEN CREATE TYPE {0} AS ENUM ({1}); END IF; END $$;".format(
            enum_name, vals
        )
    )

for _, (schema, name) in sequences.items():
    lines.append(f"CREATE SEQUENCE IF NOT EXISTS {schema}.{name};")

for stmt in create_tables:
    lines.extend(stmt.splitlines())

lines.extend(pks)
lines.extend(fks)
lines.append("COMMIT;")

segments = []
seg = []
for line in lines:
    if len(seg) >= 200:
        segments.append(seg)
        seg = []
    seg.append(line)
if seg:
    segments.append(seg)

out_path = os.path.join(base, "baseline_public_migration.sql")
with open(out_path, "w", encoding="utf-8") as out:
    for i, seg in enumerate(segments, 1):
        out.write(f"---SEGMENT {i}---\n")
        for l in seg:
            out.write(l + "\n")

print(out_path)
