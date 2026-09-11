"use client";

export type SortDirection = "asc" | "desc";

type SortableHeaderProps<TSortKey extends string> = {
  label: string;
  sortKey: TSortKey;
  activeSortKey: TSortKey;
  direction: SortDirection;
  onSort: (sortKey: TSortKey) => void;
};

export function SortableHeader<TSortKey extends string>({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
}: SortableHeaderProps<TSortKey>) {
  const isActive = sortKey === activeSortKey;

  return (
    <button
      type="button"
      aria-label={`Sort by ${label}`}
      onClick={() => onSort(sortKey)}
      className="inline-flex min-h-8 items-center gap-2 rounded-md px-1 text-left font-semibold underline-offset-4 hover:text-[#17191f] hover:underline"
    >
      <span>{label}</span>
      {isActive && (
        <span className="text-[10px] font-semibold uppercase text-[#2f6f50]">
          {direction}
        </span>
      )}
    </button>
  );
}
