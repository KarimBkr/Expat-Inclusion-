interface Option {
  id: number;
  name: string;
}

interface CheckboxGroupProps {
  legend: string;
  hint?: string;
  options: Option[];
  selected: number[];
  onChange: (ids: number[]) => void;
  error?: string;
}

export function CheckboxGroup({
  legend,
  hint,
  options,
  selected,
  onChange,
  error,
}: CheckboxGroupProps) {
  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]);
  }

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-ink mb-1.5">{legend}</legend>
      {hint && <p className="text-xs text-subtle mb-2">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              aria-pressed={active}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                active
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-ink border-line hover:border-primary"
              }`}
            >
              {opt.name}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </fieldset>
  );
}
