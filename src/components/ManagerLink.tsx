import Link from "next/link";

type ManagerLinkProps = {
  managerId: string;
  managerName: string;
  isActive: boolean;
  className?: string;
  linkClassName?: string;
  showInactiveBadge?: boolean;
};

export function ManagerLink({
  managerId,
  managerName,
  isActive,
  className = "",
  linkClassName = "",
  showInactiveBadge = true,
}: ManagerLinkProps) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <Link
        href={`/managers/${managerId}`}
        className={`font-semibold underline-offset-4 hover:text-[#2f6f50] hover:underline ${
          isActive ? "text-[#17191f]" : "text-[#7a828c]"
        } ${linkClassName}`}
      >
        {managerName}
      </Link>
      {showInactiveBadge && !isActive && (
        <span className="rounded-md bg-[#eceff3] px-2 py-1 text-xs font-semibold text-[#7a828c]">
          Inactive
        </span>
      )}
    </span>
  );
}
