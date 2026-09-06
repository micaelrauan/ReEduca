import { cn } from '@/lib/utils';

interface StatsCardProps {
	label: string;
	value: number | string;
	className?: string;
}

export function StatsCard({ label, value, className }: StatsCardProps) {
	return (
		<div className={cn('rounded-xl border border-border bg-card p-4', className)}>
			<p className="text-sm text-muted-foreground">{label}</p>
			<p className="mt-1 text-2xl font-bold">{value}</p>
		</div>
	);
}
