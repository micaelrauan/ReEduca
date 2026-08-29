import { Package, Users, MapPin } from 'lucide-react';

type StatsBarProps = {
	listingsCount: number;
	usersCount: number;
};

export function StatsBar({ listingsCount, usersCount }: StatsBarProps) {
	const stats = [
		{ icon: Package, value: listingsCount, label: 'Anúncios ativos' },
		{ icon: Users, value: usersCount, label: 'Estudantes' },
		{ icon: MapPin, value: 27, label: 'Estados' },
	];

	return (
		<section className="border-b border-border bg-muted/30">
			<div className="mx-auto flex w-full max-w-6xl flex-wrap justify-center gap-8 px-4 py-6 md:justify-around">
				{stats.map((stat) => (
					<div key={stat.label} className="flex items-center gap-3 text-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<stat.icon className="h-5 w-5 text-primary" />
						</div>
						<div className="text-left">
							<p className="font-display text-2xl font-extrabold text-foreground">
								{stat.value.toLocaleString('pt-BR')}+
							</p>
							<p className="text-xs text-muted-foreground">{stat.label}</p>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
