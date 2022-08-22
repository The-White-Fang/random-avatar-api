import * as cheerio from 'cheerio';
import request from 'request';

export const getRandom = async () => {
	const random = Math.ceil(Math.random() * 10000);
	const page = Math.ceil(random / 30);
	const imgNum = random % 30;

	const url = `https://avatars.alphacoders.com/avatars/popular?page=${page}&quickload=1`;

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
		el.name === 'img' && !el.attribs['src']?.endsWith('gif') && images.push(el.attribs['src']);
	});

	const img = images[imgNum - (images.length - 30)] ?? images[0];

	return img;
};
