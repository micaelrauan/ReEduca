const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const seeds = [
	{
		title: 'Kit de livros do 2º ano do ensino médio',
		description:
			'Sete livros usados só por um ano. Poucas marcações a lápis, todos com capa inteira. Retirada perto do metrô.',
		category: 'livros',
		deal: 'venda',
		condition: 'seminovo',
		price: 90,
		region: 'São Paulo - Zona Sul',
		name: 'Marina R.',
		rating: 4.8,
		photoUrls: ['https://images.hostinger.com/7493a242-3e3d-406e-9062-a59ec93a8261.png'],
	},
	{
		title: 'Calculadora científica 240 funções',
		description:
			'Usei no cursinho, funcionando perfeitamente, com tampa. Troco por apostilas de exatas.',
		category: 'calculadoras',
		deal: 'troca',
		condition: 'usado',
		wanted: 'Apostilas de matemática ou física',
		region: 'Rio de Janeiro - Tijuca',
		name: 'Diego P.',
		rating: 4.5,
		photoUrls: ['https://images.hostinger.com/7ff44bb4-0afc-4d6d-b775-cf31308e183b.png'],
	},
	{
		title: 'Mochila escolar azul reforçada',
		description:
			'Zíperes todos funcionando, alças firmes. Doo para quem precisar, é só combinar a retirada.',
		category: 'mochilas',
		deal: 'doacao',
		condition: 'usado',
		region: 'Belo Horizonte - Centro',
		name: 'Luana S.',
		rating: 5,
		photoUrls: ['https://images.hostinger.com/9a00e1c2-b0c2-44b3-99e0-893d6cbc71fa.png'],
	},
	{
		title: 'Kit de desenho técnico completo',
		description:
			'Compasso, escalímetro, esquadros e régua. Usei um semestre em Engenharia.',
		category: 'tecnicos',
		deal: 'venda',
		condition: 'seminovo',
		price: 55,
		region: 'Belo Horizonte - Pampulha',
		name: 'Rafael M.',
		rating: 4.7,
		photoUrls: ['https://images.hostinger.com/8d1c50f3-c062-4d71-8bb0-fa07ae11f638.png'],
	},
	{
		title: 'Combo de papelaria: canetas e marca-textos',
		description:
			'Sobrou do ano passado, quase tudo sem uso. Levo até a faculdade se for do mesmo campus.',
		category: 'papelaria',
		deal: 'doacao',
		condition: 'novo',
		region: 'Curitiba - Água Verde',
		name: 'Bia C.',
		rating: 4.9,
		photoUrls: ['https://images.hostinger.com/c685bb05-25cb-492f-b521-abd94bc06c78.png'],
	},
	{
		title: 'Apostilas de preparação para o ENEM',
		description:
			'Coleção com marcações úteis nos resumos. Troco por caderno universitário ou vendo baratinho.',
		category: 'apostilas',
		deal: 'venda',
		condition: 'marcas_de_uso',
		price: 40,
		region: 'Recife - Boa Viagem',
		name: 'Thiago A.',
		rating: 4.3,
		photoUrls: ['https://images.hostinger.com/77e76f56-3d7d-45cf-9920-1813b3a199e8.png'],
	},
];

async function main() {
	for (const s of seeds) {
		const userId = `user_demo_${s.name.split(' ')[0].toLowerCase()}`;
		await prisma.user.upsert({
			where: { id: userId },
			update: {},
			create: {
				id: userId,
				email: `${userId}@demo.reduca.local`,
				name: s.name,
			},
		});
		await prisma.listing.create({
			data: {
				title: s.title,
				description: s.description,
				category: s.category,
				deal: s.deal,
				condition: s.condition,
				price: s.price ?? null,
				wanted: s.wanted ?? null,
				region: s.region,
				status: 'ativo',
				photoUrls: s.photoUrls,
				sellerName: s.name,
				sellerRating: s.rating,
				ownerId: userId,
			},
		});
	}
	console.log(`Seed ok: ${seeds.length} usuários demo + ${seeds.length} anúncios.`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
