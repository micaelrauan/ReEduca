'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type GalleryProps = {
	photos: string[];
	title: string;
};

export function Gallery({ photos, title }: GalleryProps) {
	const [active, setActive] = useState(0);

	return (
		<div>
			<div className="overflow-hidden rounded-2xl border border-border bg-muted">
				{photos[active] ? (
					<img
						src={photos[active]}
						alt={title}
						className="aspect-[4/3] w-full object-cover"
					/>
				) : (
					<div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">
						Sem foto
					</div>
				)}
			</div>
			{photos.length > 1 && (
				<div className="mt-3 flex gap-2 overflow-x-auto">
					{photos.map((p, i) => (
						<button
							key={p}
							type="button"
							onClick={() => setActive(i)}
							className={cn(
								'h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2',
								i === active ? 'border-primary' : 'border-transparent',
							)}
						>
							<img src={p} alt="" className="h-full w-full object-cover" />
						</button>
					))}
				</div>
			)}
		</div>
	);
}
