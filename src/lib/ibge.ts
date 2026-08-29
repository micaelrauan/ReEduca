export type BrazilianState = {
	code: string;
	name: string;
	uf: string;
};

export const BRAZILIAN_STATES: BrazilianState[] = [
	{ code: '11', name: 'Rondônia', uf: 'RO' },
	{ code: '12', name: 'Acre', uf: 'AC' },
	{ code: '13', name: 'Amazonas', uf: 'AM' },
	{ code: '14', name: 'Roraima', uf: 'RR' },
	{ code: '15', name: 'Pará', uf: 'PA' },
	{ code: '16', name: 'Amapá', uf: 'AP' },
	{ code: '17', name: 'Tocantins', uf: 'TO' },
	{ code: '21', name: 'Maranhão', uf: 'MA' },
	{ code: '22', name: 'Piauí', uf: 'PI' },
	{ code: '23', name: 'Ceará', uf: 'CE' },
	{ code: '24', name: 'Rio Grande do Norte', uf: 'RN' },
	{ code: '25', name: 'Paraíba', uf: 'PB' },
	{ code: '26', name: 'Pernambuco', uf: 'PE' },
	{ code: '27', name: 'Alagoas', uf: 'AL' },
	{ code: '28', name: 'Sergipe', uf: 'SE' },
	{ code: '29', name: 'Bahia', uf: 'BA' },
	{ code: '31', name: 'Minas Gerais', uf: 'MG' },
	{ code: '32', name: 'Espírito Santo', uf: 'ES' },
	{ code: '33', name: 'Rio de Janeiro', uf: 'RJ' },
	{ code: '35', name: 'São Paulo', uf: 'SP' },
	{ code: '41', name: 'Paraná', uf: 'PR' },
	{ code: '42', name: 'Santa Catarina', uf: 'SC' },
	{ code: '43', name: 'Rio Grande do Sul', uf: 'RS' },
	{ code: '50', name: 'Mato Grosso do Sul', uf: 'MS' },
	{ code: '51', name: 'Mato Grosso', uf: 'MT' },
	{ code: '52', name: 'Goiás', uf: 'GO' },
	{ code: '53', name: 'Distrito Federal', uf: 'DF' },
];

export async function fetchCitiesByState(stateCode: string): Promise<string[]> {
	const res = await fetch(
		`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateCode}/municipios`,
		{ next: { revalidate: 86400 } },
	);
	if (!res.ok) return [];
	const data = await res.json();
	return (data as { nome: string }[])
		.map((c) => c.nome)
		.sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
