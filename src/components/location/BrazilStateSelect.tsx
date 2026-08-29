'use client';

import { BRAZILIAN_STATES } from '@/lib/ibge';
import { cn } from '@/lib/utils';

type BrazilStateSelectProps = {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	className?: string;
};

export function BrazilStateSelect({
	value,
	onChange,
	disabled,
	className,
}: BrazilStateSelectProps) {
	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			disabled={disabled}
			className={cn(
				'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring',
				className,
			)}
		>
			<option value="">Selecione o estado</option>
			{BRAZILIAN_STATES.map((s) => (
				<option key={s.code} value={s.code}>
					{s.uf} — {s.name}
				</option>
			))}
		</select>
	);
}
