"use client";

export type SelectOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type SelectControlProps<TValue extends string> = {
  label: string;
  value: TValue;
  options: SelectOption<TValue>[];
  onChange: (value: TValue) => void;
};

export function SelectControl<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: SelectControlProps<TValue>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase text-[#66707a]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TValue)}
        className="min-h-10 rounded-lg border border-[#d9dee4] bg-[#f8f9fb] px-3 py-2 text-sm font-semibold text-[#17191f] outline-none transition hover:bg-white focus:border-[#2f6f50] focus:bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
