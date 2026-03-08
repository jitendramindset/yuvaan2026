"use client";
/** Table widget — renders a list of row objects as a scrollable table. */
import React from "react";

interface TableProps {
  config: Record<string, unknown>;
  data?:  Record<string, unknown>;
}

export function Table({ config, data = {} }: TableProps): React.ReactElement {
  const title   = String(config["title"] ?? "Table");
  const rows    = Array.isArray(data["rows"])   ? (data["rows"] as Record<string, unknown>[])   : [];
  const columns = Array.isArray(data["columns"]) ? (data["columns"] as string[]) : rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div className="h-full flex flex-col rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-4 py-2 text-xs font-semibold text-white/60 border-b border-white/10">
        {title}
      </div>
      <div className="overflow-auto flex-1">
        {rows.length === 0 ? (
          <div className="p-4 text-xs text-white/30 text-center">No data</div>
        ) : (
          <table className="w-full text-xs text-white/80">
            <thead>
              <tr className="sticky top-0 bg-black/40">
                {columns.map((col) => (
                  <th key={col} className="text-left px-3 py-2 font-medium text-white/50 capitalize">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2">
                      {String(row[col] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
