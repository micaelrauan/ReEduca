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
		<div className={cn('flex items-center gap-0.5', className)}>
			{[1, 2, 3, 4, 5].map((n) => {
				const filled = n <= Math.round(value);
				const star = (
					<Star
						className={cn(
							size,
							filled ? 'fill-secondary text-secondary' : 'text-muted-foreground',
						)}
						strokeWidth={1.8}
					/>
				);
				return onChange ? (
					<button
						key={n}
						type="button"
						aria-label={`${n} estrelas`}
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
