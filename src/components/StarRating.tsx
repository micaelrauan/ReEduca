import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type StarRatingProps = {
	value?: number;
	onChange?: (n: number) => void;
	size?: string;
	className?: string;
};

export function StarRating({ value = 0, onChange, size = 'h-4 w-4', className }: StarRatingProps) {
	return (
		<div
			className={cn('flex items-center gap-0.5', className)}
			role={onChange ? 'radiogroup' : 'img'}
			aria-label={onChange ? 'Avaliação' : `${value} de 5 estrelas`}
		>
			{[1, 2, 3, 4, 5].map((n) => {
				const filled = n <= Math.round(value);
				const star = (
					<Star
						className={cn(
							size,
							filled ? 'fill-secondary text-secondary' : 'text-muted-foreground',
						)}
						strokeWidth={1.8}
						aria-hidden="true"
					/>
				);
				return onChange ? (
					<button
						key={n}
						type="button"
						role="radio"
						aria-checked={n === Math.round(value)}
						aria-label={`${n} estrela${n !== 1 ? 's' : ''}`}
						onClick={() => onChange(n)}
						className="p-1 transition-transform active:scale-90"
					>
						{star}
					</button>
				) : (
					<span key={n}>{star}</span>
				);
			})}
		</div>
	);
}
