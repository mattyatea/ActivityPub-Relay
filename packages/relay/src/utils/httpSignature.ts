import { createHash, createSign, createVerify } from 'node:crypto';
import type { Bindings } from '@/server.ts';
import { fetchActor } from '@/utils/activityPub.ts';

export function parseHeader(request: Request): { [key: string]: string } {
	const signatureHeader = request.headers.get('Signature');
	if (!signatureHeader) {
		throw new Error('Request not signed: no Signature header');
	}

	const params: { [key: string]: string } = {};
	const paramList = signatureHeader.split(',');

	// biome-ignore lint/suspicious/noExplicitAny: 実際にどんな値が入っていてもおかしくないはず。
	paramList.forEach((param: any) => {
		const parts = param.split('=', 2);
		if (parts.length !== 2 || !param) {
			throw new Error(`Invalid Signature`);
		}

		const key = parts[0].trim();
		let value = parts[1].trim();

		if (key === 'signature') {
			const regex = /signature="([^"]+)"/;
			const match = param.match(regex);
			if (!match) {
				throw new Error('Invalid Signature format');
			}
			value = match[1];
		}

		if (value.startsWith('"')) {
			if (!value.endsWith('"')) {
				throw new Error(`Invalid Signature`);
			}

			try {
				value = value.slice(1, -1).replace(/\\"/g, '"');
			} catch {
				throw new Error(`Invalid Signature`);
			}
		}

		params[key] = value;
	});

	return params;
}

export async function verifySignature(req: Request) {
	const header = parseHeader(req);
	const keyId = header.keyId;
	const signature = header.signature;
	const headers = header.headers.split(' ');

	const actor = await fetchActor(keyId);
	const publicKey = actor.publicKey?.publicKeyPem;
	if (!publicKey) {
		throw new Error('Actor public key missing');
	}

	let signingString = '';
	headers.forEach((headerName) => {
		if (headerName === '(request-target)') {
			signingString += `(request-target): ${req.method.toLowerCase()} ${new URL(req.url).pathname}\n`;
		} else {
			signingString += `${headerName.toLowerCase()}: ${req.headers.get(headerName.toLowerCase())}\n`;
		}
	});
	signingString = signingString.trim();
	const verifier = createVerify('RSA-SHA256');
	verifier.update(signingString);
	verifier.end();
	return verifier.verify(publicKey, signature, 'base64');
}

export function signHeaders(body: string, strInbox: string, env: Bindings) {
	let privateKeyPem = env.PRIVATEKEY;
	privateKeyPem = privateKeyPem?.split('\\n').join('\n');
	if (privateKeyPem?.startsWith('"')) privateKeyPem = privateKeyPem.slice(1);
	if (privateKeyPem?.endsWith('"')) privateKeyPem = privateKeyPem.slice(0, -1);
	const PRIVATE_KEY = privateKeyPem;
	if (!PRIVATE_KEY) throw new Error('No private key found');
	const strTime = new Date().toUTCString();
	const s256 = createHash('sha256').update(body).digest('base64');
	const signingString = [
		`(request-target): post ${new URL(strInbox).pathname}`,
		`host: ${new URL(strInbox).hostname}`,
		`date: ${strTime}`,
		`digest: SHA-256=${s256}`,
	].join('\n');

	const sig = createSign('RSA-SHA256');
	sig.update(signingString);
	sig.end();
	const b64 = sig.sign(PRIVATE_KEY, 'base64');

	return {
		Host: new URL(strInbox).hostname,
		Date: strTime,
		Digest: `SHA-256=${s256}`,
		Signature: [
			`keyId="https://${env.HOSTNAME}/actor#main-key"`,
			'algorithm="rsa-sha256"',
			'headers="(request-target) host date digest"',
			`signature="${b64}"`,
		].join(','),
		Accept: 'application/json',
		'Cache-Control': 'max-age=0',
		'Content-Type': 'application/activity+json',
		'User-Agent': `nanasi-apps.xyz Relay Service`,
	};
}
