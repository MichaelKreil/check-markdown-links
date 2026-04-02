import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';

export async function checkLink(url: string, retries: number = 3): Promise<true> {
	const parsedUrl = new URL(url);
	const request = parsedUrl.protocol === 'https:' ? httpsRequest : httpRequest;
	const options = {
		timeout: 10000,
		headers: {
			Accept:
				'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
			'Accept-Encoding': 'gzip, deflate, br, zstd',
			'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
			'User-Agent':
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
			'sec-ch-ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
			'sec-ch-ua-mobile': '?0',
			'sec-ch-ua-platform': '"macOS"',
		},
	};

	function tryRequest(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const req = request(url, options, (res) => {
				res.resume(); // drain response body to free the socket
				switch (res.statusCode) {
					case 200:
					case 301:
					case 302:
					case 303:
					case 307:
					case 308:
						resolve();
						break;
					default:
						reject(`got status code: ${res.statusCode}`);
				}
			});

			req.on('timeout', () => {
				req.destroy(new Error('Request timed out'));
			});

			req.on('error', (e) => {
				reject(`Request failed: ${e.message}`);
			});

			req.end();
		});
	}

	let errorMsg: string = 'Unknown error';
	for (let i = 0; i < retries; i++) {
		try {
			await tryRequest();
			return true;
		} catch (error) {
			errorMsg = String(error);
		}
		if (i < retries - 1) {
			await new Promise((res) => setTimeout(res, 1000));
		}
	}

	throw new Error(`Link check failed for ${url} after ${retries} attempts: ${errorMsg}`);
}
