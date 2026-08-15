import { Column } from "@tanstack/react-table"
import { ChevronDownIcon, ChevronUpIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-3 h-8 flex items-center space-x-1 px-3 hover:bg-gray-200 rounded-md transition-colors"
      >
        <span>{title}</span>
        {column.getIsSorted() === "desc" ? (
          <ChevronDownIcon className="h-4 w-4" />
        ) : column.getIsSorted() === "asc" ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronUpDownIcon className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
