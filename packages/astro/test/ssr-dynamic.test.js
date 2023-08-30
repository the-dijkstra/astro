import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Dynamic pages in SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-dynamic/',
			output: 'server',
			integrations: [
				{
					name: 'inject-routes',
					hooks: {
						'astro:config:setup': ({ injectRoute }) => {
							injectRoute({
								pattern: '/path-alias/[id]',
								entryPoint: './src/pages/api/products/[id].js',
							});
						},
					},
				},
			],
			adapter: testAdapter(),
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	async function matchRoute(path) {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('https://example.com' + path);
		return app.match(request);
	}

	async function fetchHTML(path) {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com' + path);
		const response = await app.render(request);
		const html = await response.text();
		return html;
	}

	async function fetchJSON(path) {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com' + path);
		const response = await app.render(request);
		const json = await response.json();
		return json;
	}

	it('Do not have to implement getStaticPaths', async () => {
		const html = await fetchHTML('/123');
		const $ = cheerioLoad(html);
		expect($('h1').text()).to.equal('Item 123');
	});

	it('Includes page styles', async () => {
		const html = await fetchHTML('/123');
		const $ = cheerioLoad(html);
		expect($('link').length).to.equal(1);
	});

	it('Dynamic API routes work', async () => {
		const json = await fetchJSON('/api/products/33');
		expect(json.id).to.equal('33');
	});

	it('Injected route work', async () => {
		const json = await fetchJSON('/path-alias/33');
		expect(json.id).to.equal('33');
	});

	it('Public assets take priority', async () => {
		const favicon = await matchRoute('/favicon.ico');
		expect(favicon).to.equal(undefined);
	});
});
