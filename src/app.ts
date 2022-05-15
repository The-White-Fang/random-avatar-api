import * as cheerio from 'cheerio';
import express from 'express';
import Jimp from 'jimp';
import NodeCache from 'node-cache';
import request from 'request';
import logging from './logging';

const server = express();

server.use(express.json());

const cache = new NodeCache();

const port = process.env.PORT || 4001;

server.get('/get', async (req, res) => {
	const { query, page = 1, ql = 300 } = req.query;
	if (typeof query !== 'string') {
		return res.status(400).json({
			err_code: 'PRM400',
			err_desc: 'Invalid type for query',
		});
	}

	const spaceEscaped = query.replace(/\s/g, '+');
	const params = `?search=${spaceEscaped}&quickload=${ql}&page=${page}`;

	const cachedUrl = cache.get(spaceEscaped);
	const url = (cachedUrl || `https://avatars.alphacoders.com/searches/view`) + params;

	try {
		const body: string = await new Promise((resolve, reject) =>
			request(url, (error, response, body) => {
				if (error) {
					return reject(error);
				} else if (response.statusCode > 399) {
					return reject(new Error(`Request failed with status code ${response.statusCode}`));
				}
				if (response.request.uri.href !== url) {
					console.log(`Added to cache '${spaceEscaped}'`);
					cache.set(spaceEscaped, response.request.uri.href, 5 * 60 * 1000);

					if (page == 1) {
						return resolve(body);
					}

					return request(response.request.uri.href + params, (error, response, body) => {
						if (error) {
							return reject(error);
						} else if (response.statusCode > 399) {
							return reject(new Error(`Request failed with status code ${response.statusCode}`));
						}
						resolve(body);
					});
				}

				resolve(body);
			})
		);

		const $ = cheerio.load(body);

		const imgTags = $('.img-responsive'),
			images: string[] = [];

		imgTags.each((i, el) => {
			el.name === 'img' && images.push(el.attribs['src']);
		});

		res.json({
			images,
		});
	} catch (error) {
		if (!(error instanceof Error)) {
			throw new Error('SHOULD NEVER HAPPEN');
		}

		logging.error('FETCHIMG', error.message);

		res.status(500).json({
			error_code: 'PROC500',
			error_desc: error.message,
		});
	}
});

server.post('/crop', async (req, res) => {
	const { height, width, url } = req.body;

	if (typeof height !== 'number' || typeof width !== 'number' || typeof url !== 'string') {
		return res.status(400).json({
			error_code: 'REQ400',
			error_desc: 'Invalid params type',
		});
	}

	const image = await Jimp.read(url);
	const cropped = image.cover(width, height);

	const b64 = await cropped.getBase64Async('image/png');

	console.log(b64.length);
	res.end(b64);
});

server.get('/random', async (req, res) => {
	const random = Math.ceil(Math.random() * 2000);
	const page = Math.ceil(random / 30);
	const imgNum = random % 30;

	const url = `https://avatars.alphacoders.com/avatars/popular?page=${page}&quickload=1`;

	try {
		const body: string = await new Promise((resolve, reject) =>
			request(url, (error, response, body) => {
				if (error) {
					return reject(error);
				} else if (response.statusCode > 399) {
					return reject(new Error(`Request failed with status code ${response.statusCode}`));
				}

				resolve(body);
			})
		);

		const $ = cheerio.load(body);

		const imgTags = $('.img-responsive'),
			images: string[] = [];

		imgTags.each((i, el) => {
			el.name === 'img' && images.push(el.attribs['src']);
		});

		res.json({
			image: images[imgNum],
		});
	} catch (error) {
		if (!(error instanceof Error)) {
			throw new Error('SHOULD NEVER HAPPEN');
		}

		logging.error('FETCHIMG', error.message);

		res.status(500).json({
			error_code: 'PROC500',
			error_desc: error.message,
		});
	}
});

server.get('/random/:query', async (req, res) => {
	const { query } = req.params;
	const { image } = req.query;
	if (typeof query !== 'string') {
		return res.status(400).json({
			err_code: 'PRM400',
			err_desc: 'Invalid type for query',
		});
	}

	const random = Math.ceil(Math.random() * 2000);
	const page = Math.ceil(random / 30);
	const imgNum = random % 30;

	const spaceEscaped = query.replace(/\s/g, '+');
	const params = `?search=${spaceEscaped}&quickload=1	&page=${page}`;

	const cachedUrl = cache.get(spaceEscaped);
	const url = (cachedUrl || `https://avatars.alphacoders.com/searches/view`) + params;

	try {
		const body: string = await new Promise((resolve, reject) =>
			request(url, (error, response, body) => {
				if (error) {
					return reject(error);
				} else if (response.statusCode > 399) {
					return reject(new Error(`Request failed with status code ${response.statusCode}`));
				}
				if (response.request.uri.href !== url) {
					console.log(`Added to cache '${spaceEscaped}'`);
					cache.set(spaceEscaped, response.request.uri.href, 5 * 60 * 1000);

					if (page == 1) {
						return resolve(body);
					}

					return request(response.request.uri.href + params, (error, response, body) => {
						if (error) {
							return reject(error);
						} else if (response.statusCode > 399) {
							return reject(new Error(`Request failed with status code ${response.statusCode}`));
						}
						resolve(body);
					});
				}

				resolve(body);
			})
		);

		const $ = cheerio.load(body);

		const imgTags = $('.img-responsive'),
			images: string[] = [];

		imgTags.each((i, el) => {
			el.name === 'img' && images.push(el.attribs['src']);
		});

		res.json({
			image: images[imgNum],
		});
	} catch (error) {
		if (!(error instanceof Error)) {
			throw new Error('SHOULD NEVER HAPPEN');
		}

		logging.error('FETCHIMG', error.message);

		res.status(500).json({
			error_code: 'PROC500',
			error_desc: error.message,
		});
	}
});

server.all('/', (_, res) => res.sendStatus(405));

server.use('*', (_, res) => res.sendStatus(404));

server.listen(4001, () => console.log(`Listening on port: ${port}`));
