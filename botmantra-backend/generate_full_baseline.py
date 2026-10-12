import csv
import os
import re
import glob
from collections import defaultdict

ROOT = r"d:\React App\Yuvaan-v1\botmantra-backend"
TABLES_CSV = os.path.join(ROOT, "Tables + columns.csv")
INDEXES_CSV = os.path.join(ROOT, "Indexes.csv")
FKS_CSV = os.path.join(ROOT, "Foreign keys detail.csv")

MIGRATION_DIRS = [
    os.path.join(ROOT, "supabase", "migrations"),
    os.path.join(ROOT, "db-migrations"),
    os.path.join(ROOT, "migrations"),
]

OUTPUT = os.path.join(ROOT, "supabase", "migrations", "20260206_full_schema_baseline.sql")

CREATE_TABLE_RE = re.compile(r"CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(?P<name>[\w\"\.]+)", re.IGNORECASE)


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def normalize_table_name(name):
    return name.strip('"')


def collect_existing_tables():
    tables = set()
    for base in MIGRATION_DIRS:
        for path in glob.glob(os.path.join(base, "**", "*.sql"), recursive=True):
            with open(path, encoding="utf-8", errors="ignore") as f:
                content = f.read()
            for m in CREATE_TABLE_RE.finditer(content):
                name = normalize_table_name(m.group("name"))
                if "." in name:
                    schema, table = name.split(".", 1)
                    if schema != "public":
                        continue
                    tables.add(table)
                else:
                    tables.add(name)
    return tables


def parse_pkey_indexes(index_rows):
    pk_map = {}
    for row in index_rows:
        if row.get("schemaname") != "public":
            continue
        indexname = row.get("indexname", "")
        if not indexname.endswith("_pkey"):
            continue
        table = row.get("tablename")
        indexdef = row.get("indexdef", "")
        m = re.search(r"\((.+)\)", indexdef)
        if not m:
            continue
        cols = [c.strip().strip('"') for c in m.group(1).split(",")]
        pk_map[table] = cols
    return pk_map


def map_column_type(col_name, data_type):
    dt = data_type.strip().lower()
    if dt == "array":
        return "text[]"
    if dt == "user-defined":
        if "embedding" in col_name.lower():
            return "vector(1536)"
        return "text"
    return data_type


def build():
    table_rows = read_csv(TABLES_CSV)
    index_rows = read_csv(INDEXES_CSV)
    fk_rows = read_csv(FKS_CSV)

    existing = collect_existing_tables()
    pkeys = parse_pkey_indexes(index_rows)

    public_cols = defaultdict(list)
    for row in table_rows:
        if row["table_schema"] != "public":
            continue
        table = row["table_name"]
        if table.startswith("v_"):
            # views will be handled separately
            continue
        public_cols[table].append(row)

    fk_map = defaultdict(list)
    for row in fk_rows:
        if row["table_schema"] != "public":
            continue
        fk_map[row["table_name"]].append(row)

    tables_to_create = [t for t in sorted(public_cols.keys()) if t not in existing]

    with open(OUTPUT, "w", encoding="utf-8") as out:
        out.write("-- ═══════════════════════════════════════════════════════════════════════════════\n")
        out.write("-- Full baseline schema for public tables missing in migrations\n")
        out.write("-- Created: 2026-02-06\n")
        out.write("-- Source: Tables + columns.csv, Indexes.csv, Foreign keys detail.csv\n")
        out.write("-- Note: Views (v_*) are excluded and must be created separately.\n")
        out.write("-- ═══════════════════════════════════════════════════════════════════════════════\n\n")

        for table in tables_to_create:
            rows = public_cols[table]
            out.write(f"-- Table: {table}\n")
            out.write(f"CREATE TABLE IF NOT EXISTS public.{table} (\n")
            col_lines = []
            for r in rows:
                col = r["column_name"]
                dtype = map_column_type(col, r["data_type"])
                nullable = r["is_nullable"].strip().upper() == "YES"
                default = r["column_default"]
                line = f"  {col} {dtype}"
                if not nullable:
                    line += " NOT NULL"
                if default and default.lower() != "null":
                    line += f" DEFAULT {default}"
                col_lines.append(line)

            if table in pkeys:
                pk_cols = ", ".join(pkeys[table])
                col_lines.append(f"  ,PRIMARY KEY ({pk_cols})")

            out.write(",\n".join(col_lines))
            out.write("\n);\n")

            # Foreign keys
            for fk in fk_map.get(table, []):
                col = fk["column_name"]
                ref_schema = fk["foreign_table_schema"]
                ref_table = fk["foreign_table_name"]
                ref_col = fk["foreign_column_name"]
                cname = fk["constraint_name"]
                out.write(
                    f"ALTER TABLE public.{table}\n"
                    f"  ADD CONSTRAINT {cname} FOREIGN KEY ({col})\n"
                    f"  REFERENCES {ref_schema}.{ref_table} ({ref_col});\n"
                )

            out.write("\n")

    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    build()
