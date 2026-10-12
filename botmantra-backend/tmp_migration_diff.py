import csv, re, os, glob
from collections import defaultdict

root = r"d:\React App\Yuvaan-v1\botmantra-backend"

def read_csv(path):
    with open(path, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))

csv_tables = read_csv(os.path.join(root, "Tables + columns.csv"))

public_cols = defaultdict(list)
for row in csv_tables:
    if row['table_schema'] == 'public':
        public_cols[row['table_name']].append(row['column_name'])

public_tables = set(public_cols)

sql_paths = []
for sub in ["supabase/migrations", "db-migrations", "migrations"]:
    sql_paths.extend(glob.glob(os.path.join(root, sub, "**", "*.sql"), recursive=True))

create_table_re = re.compile(r"CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(?P<name>[\w\"\.]+)\s*\(", re.IGNORECASE)

sql_tables = defaultdict(set)
sql_table_sources = defaultdict(set)

for path in sql_paths:
    with open(path, encoding='utf-8', errors='ignore') as f:
        content = f.read()
    content = re.sub(r"/\*.*?\*/", "", content, flags=re.S)
    content = re.sub(r"--.*?$", "", content, flags=re.M)

    for m in create_table_re.finditer(content):
        start = m.end() - 1
        name = m.group('name').strip('"')
        if '.' in name:
            schema, table = name.split('.', 1)
            if schema.strip('"') != 'public':
                continue
            table = table.strip('"')
        else:
            table = name
        depth = 0
        i = start
        for i in range(start, len(content)):
            ch = content[i]
            if ch == '(':
                depth += 1
            elif ch == ')':
                depth -= 1
                if depth == 0:
                    break
        block = content[start+1:i]
        cols = []
        buf = ''
        depth2 = 0
        in_str = False
        str_char = ''
        for ch in block:
            if in_str:
                buf += ch
                if ch == str_char:
                    in_str = False
                continue
            if ch in ('"', "'"):
                in_str = True
                str_char = ch
                buf += ch
                continue
            if ch == '(':
                depth2 += 1
            elif ch == ')':
                depth2 -= 1
            if ch == ',' and depth2 == 0:
                cols.append(buf.strip())
                buf = ''
            else:
                buf += ch
        if buf.strip():
            cols.append(buf.strip())

        for coldef in cols:
            if not coldef:
                continue
            if re.match(r"^(CONSTRAINT|PRIMARY\s+KEY|UNIQUE|FOREIGN\s+KEY|CHECK)\b", coldef.strip(), re.IGNORECASE):
                continue
            colname = coldef.split()[0].strip('"')
            if colname:
                sql_tables[table].add(colname)
                sql_table_sources[table].add(os.path.relpath(path, root))

missing_tables = sorted(public_tables - set(sql_tables))
missing_cols = {}
for table, cols in public_cols.items():
    if table in sql_tables:
        missing = sorted(set(cols) - sql_tables[table])
        if missing:
            missing_cols[table] = missing

report_path = os.path.join(root, "migration_diff_report.txt")
with open(report_path, 'w', encoding='utf-8') as f:
    f.write(f"Missing tables ({len(missing_tables)}):\n")
    for t in missing_tables:
        f.write(f"- {t}\n")
    f.write("\nMissing columns:\n")
    for t, cols in missing_cols.items():
        f.write(f"- {t}: {', '.join(cols)}\n")
    f.write("\nSQL sources per table:\n")
    for t, sources in sorted(sql_table_sources.items()):
        f.write(f"- {t}: {', '.join(sorted(sources))}\n")

print(f"Wrote {report_path}")
