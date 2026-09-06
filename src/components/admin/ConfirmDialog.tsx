'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: 'danger' | 'default';
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel = 'Confirmar',
	cancelLabel = 'Cancelar',
	variant = 'default',
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	}, [open]);

	return (
		<dialog
			ref={dialogRef}
			className="backdrop:bg-black/60 rounded-xl border border-border bg-background p-0 shadow-lg backdrop:backdrop-blur-sm"
			onCancel={onCancel}
		>
			<div className="p-6">
				<div className="mb-4 flex items-center gap-3">
					<AlertTriangle className={cn('h-5 w-5', variant === 'danger' ? 'text-destructive' : 'text-primary')} />
					<h2 className="font-display text-lg font-bold">{title}</h2>
				</div>
				<p className="mb-6 text-sm text-muted-foreground">{description}</p>
				<div className="flex justify-end gap-3">
					<button
						type="button"
						onClick={onCancel}
						className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
					>
						{cancelLabel}
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className={cn(
							'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
							variant === 'danger' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90',
						)}
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</dialog>
	);
}
