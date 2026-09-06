'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
	key: string;
	label: string;
	render?: (item: T) => ReactNode;
	className?: string;
}

interface DataTableProps<T> {
	columns: Column<T>[];
	data: T[];
	emptyMessage?: string;
	onRowClick?: (item: T) => void;
}

export function DataTable<T extends { id: string }>({
	columns,
	data,
	emptyMessage = 'Nenhum registro encontrado.',
	onRowClick,
}: DataTableProps<T>) {
	if (data.length === 0) {
		return (
			<div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
				{emptyMessage}
			</div>
		);
	}

	return (
		<div className="overflow-x-auto rounded-xl border border-border">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-border bg-muted/50">
						{columns.map((col) => (
							<th
								key={col.key}
								className={cn('px-4 py-3 text-left font-medium text-muted-foreground', col.className)}
							>
								{col.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{data.map((item) => (
						<tr
							key={item.id}
							className={cn(
								'border-b border-border last:border-0',
								onRowClick && 'cursor-pointer hover:bg-muted/50',
							)}
							onClick={() => onRowClick?.(item)}
						>
							{columns.map((col) => (
								<td key={col.key} className={cn('px-4 py-3', col.className)}>
									{col.render
										? col.render(item)
										: String((item as Record<string, unknown>)[col.key] ?? '-')}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
