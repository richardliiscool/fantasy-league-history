"use client";

export type SegmentOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type SegmentedControlProps<TValue extends string> = {
  label: string;
  value: TValue;
  options: SegmentOption<TValue>[];
  onChange: (value: TValue) => void;
};

export function SegmentedControl<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<TValue>) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase text-[#66707a]">
        {label}
      </span>
      <div className="inline-flex flex-wrap gap-1 rounded-lg border border-[#d9dee4] bg-[#f8f9fb] p-1">
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(option.value)}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                isSelected
                  ? "bg-[#2f6f50] text-white shadow-sm"
                  : "text-[#58606a] hover:bg-white hover:text-[#17191f]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
