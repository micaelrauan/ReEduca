'use client';

import { useEffect, useState } from 'react';
import { fetchCitiesByState } from '@/lib/ibge';
import { cn } from '@/lib/utils';

type BrazilCitySelectProps = {
	stateCode: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	className?: string;
};

export function BrazilCitySelect({
	stateCode,
	value,
	onChange,
	disabled,
	className,
}: BrazilCitySelectProps) {
	const [cities, setCities] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!stateCode) {
			setCities([]);
			onChange('');
			return;
		}

		let cancelled = false;
		setLoading(true);

		fetchCitiesByState(stateCode).then((data) => {
			if (!cancelled) {
				setCities(data);
				setLoading(false);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [stateCode, onChange]);

	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			disabled={disabled || !stateCode || loading}
			className={cn(
				'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring',
				className,
			)}
		>
			<option value="">
				{!stateCode
					? 'Selecione o estado primeiro'
					: loading
						? 'Carregando cidades...'
						: 'Selecione a cidade'}
			</option>
			{cities.map((city) => (
				<option key={city} value={city}>
					{city}
				</option>
			))}
		</select>
	);
}
