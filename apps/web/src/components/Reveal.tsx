'use client';

import { motion, useReducedMotion } from 'framer-motion';

type RevealProps = {
	children: React.ReactNode;
	delay?: number;
	y?: number;
	className?: string;
	once?: boolean;
};

export function Reveal({ children, delay = 0, y = 24, className = '', once = true }: RevealProps) {
	const reduceMotion = useReducedMotion();
	const delaySeconds = delay > 10 ? delay / 1000 : delay;

	return (
		<motion.div
			className={className}
			initial={{ opacity: 0, y: reduceMotion ? 0 : y }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once, margin: '-60px' }}
			transition={{ duration: 0.6, delay: delaySeconds, ease: [0.22, 1, 0.36, 1] }}
		>
			{children}
		</motion.div>
	);
}
