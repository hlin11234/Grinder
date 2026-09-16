import { useState } from "react";

export function CategorySelect({
  categories,
  value,
  onChange,
}: {
  categories: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [custom, setCustom] = useState(!categories.includes(value) && value !== "");

  if (custom) {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <input
          autoFocus
          value={value}
          placeholder="category name"
          onChange={(e) => onChange(e.target.value)}
        />
        {categories.length > 0 && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setCustom(false);
              onChange(categories[0]);
            }}
          >
            [ list ]
          </button>
        )}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === "__custom__") {
          setCustom(true);
          onChange("");
        } else {
          onChange(e.target.value);
        }
      }}
    >
      {categories.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
      <option value="__custom__">+ new category…</option>
    </select>
  );
}
