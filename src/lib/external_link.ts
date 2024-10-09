import { request as httpsRequest } from 'node:https'; // For HTTPS requests
import { request as httpRequest } from 'node:http'; // For HTTP requests
import { URL } from 'url';

export async function checkLink(url: string): Promise<true> {
	return new Promise((resolve, reject) => {
		// Parse the URL to determine if it's HTTP or HTTPS
		const parsedUrl = new URL(url);
		const request = parsedUrl.protocol === 'https:' ? httpsRequest : httpRequest;

		const options = {
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
				'Accept-Encoding': 'gzip, deflate, br, zstd',
				'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
				'Cache-Control': 'no-cache',
				'Pragma': 'no-cache',
				Referer: url,
				'Sec-Fetch-Dest': 'document',
				'Sec-Fetch-Mode': 'navigate',
				'Sec-Fetch-Site': 'same-origin',
				'Sec-Fetch-User': '?1',
				'Upgrade-Insecure-Requests': '1',
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
				'downlink': '10',
				'dpr': '2',
				'sec-ch-ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
				'sec-ch-ua-mobile': '?0',
				'sec-ch-ua-platform': '"macOS"',
				'viewport-width': '1337',
			},
		};


		const req = request(url, options, (res) => {
			switch (res.statusCode) {
				case 200:
				case 301:
				case 302:
				case 307:
					resolve(true);
					break;
				default:
					reject(new Error(`got status code: ${res.statusCode}`));
			}
			req.destroy();
		});

		req.on('error', (e) => {
			reject(new Error(`Request failed: ${e.message}`));
		});

		req.end();
	});
}
