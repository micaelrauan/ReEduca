'use client';

import { useState } from 'react';
import { CheckCircle, Clock, RotateCcw } from 'lucide-react';
import type { StatusValue } from '@/lib/reeduca';

type StatusTransitionButtonProps = {
	listingId: string;
	currentStatus: StatusValue;
};

const transitions: Record<StatusValue, { label: string; target: StatusValue; icon: typeof Clock }[]> = {
	ativo: [
		{ label: 'Reservar', target: 'reservado', icon: Clock },
		{ label: 'Concluir', target: 'concluido', icon: CheckCircle },
	],
	reservado: [
		{ label: 'Reativar', target: 'ativo', icon: RotateCcw },
		{ label: 'Concluir', target: 'concluido', icon: CheckCircle },
	],
	concluido: [
		{ label: 'Reativar', target: 'ativo', icon: RotateCcw },
	],
};

export function StatusTransitionButton({ listingId, currentStatus }: StatusTransitionButtonProps) {
	const [status, setStatus] = useState(currentStatus);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const options = transitions[status] || [];

	const changeStatus = async (target: StatusValue) => {
		setLoading(true);
		setError('');
		try {
			const res = await fetch(`/api/listings/${listingId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: target }),
			});
			if (res.ok) {
				setStatus(target);
			} else {
				const data = await res.json();
				setError(data.error || 'Não foi possível alterar o status.');
			}
		} catch {
			setError('Erro ao alterar status.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap gap-2">
				{options.map((opt) => (
					<button
						key={opt.target}
						type="button"
						onClick={() => changeStatus(opt.target)}
						disabled={loading}
						className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50"
					>
						<opt.icon className="h-4 w-4" />
						{opt.label}
					</button>
				))}
			</div>
			{error && (
				<p className="text-xs text-destructive">{error}</p>
			)}
		</div>
	);
}
