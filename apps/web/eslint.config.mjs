import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	...compat.extends('next/core-web-vitals', 'next/typescript'),
	{
		// Fotos são URLs arbitrárias enviadas por usuários — <img> evita
		// configurar remotePatterns e otimização no servidor para cada domínio.
		rules: {
			'@next/next/no-img-element': 'off',
		},
	},
	{
		ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
	},
];

export default eslintConfig;
