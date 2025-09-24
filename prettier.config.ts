import { type Config } from 'prettier';

const config: Config = {
	singleQuote: true,
	trailingComma: 'all',
	plugins: ['@trivago/prettier-plugin-sort-imports'],
	importOrderSeparation: true,
	importOrderSortSpecifiers: true,
	importOrder: ['^node:(.*)$', '^[a-zA-Z].*', '^@/(.*)$', '^[./]'],
};

export default config;
