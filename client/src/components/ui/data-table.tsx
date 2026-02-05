import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps {
  data: any[];
  className?: string;
  limit?: number;
}

export function DataTable({ data, className, limit = 10 }: DataTableProps) {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  const displayData = limit ? data.slice(0, limit) : data;

  return (
    <div className={cn("rounded-xl border bg-card shadow-sm overflow-hidden", className)}>
      <div className="bg-muted/50 px-4 py-2 border-b flex justify-between items-center">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Data Preview ({displayData.length} of {data.length} rows)
        </h4>
      </div>
      <ScrollArea className="h-[300px] w-full">
        <div className="min-w-max">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col} className="h-10 text-xs font-bold text-slate-700 uppercase whitespace-nowrap px-4">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, i) => (
                <TableRow key={i} className="hover:bg-muted/50 transition-colors">
                  {columns.map((col) => (
                    <TableCell key={`${i}-${col}`} className="py-2 px-4 text-sm whitespace-nowrap text-slate-600 font-mono">
                      {String(row[col] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}
