const MASCOT_IMAGE =
	'https://horizons-cdn.hostinger.com/68916bdf-834c-489f-bc0a-bdde2c321f3f/9c8a8fb3e5f06b8823a7cdbe51c46125.png';

type DukinhaProps = {
	className?: string;
	title?: string;
};

export function Dukinha({
	className = 'w-24 h-24',
	title = 'Mascote cachorro do ReEduca',
}: DukinhaProps) {
	return <img src={MASCOT_IMAGE} className={className} role="img" aria-label={title} alt={title} />;
}
