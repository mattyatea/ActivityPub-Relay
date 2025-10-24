import { createHash, createSign, createVerify } from 'node:crypto';
import type { APActor } from '@/types/activityPubTypes.ts';
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

export async function verifySignature(
	req: Request,
): Promise<{ isValid: boolean; actor: APActor }> {
	const header = parseHeader(req);
	const keyId = header.keyId;
	const signature = header.signature;
	const headers = header.headers?.split(' ') ?? [];

	if (headers.length === 0) {
		throw new Error('Signature headers missing');
	}

	const actor = await fetchActor(keyId);
	const publicKey = actor.publicKey?.publicKeyPem;
	if (!publicKey) {
		throw new Error('Actor public key missing');
	}

	// URL parsing once
	const url = new URL(req.url);
	const method = req.method.toLowerCase();

	// Build signing string with array join (faster than string concatenation)
	const signingParts: string[] = [];
	for (const headerName of headers) {
		if (headerName === '(request-target)') {
			signingParts.push(`(request-target): ${method} ${url.pathname}`);
		} else {
			const headerValue = req.headers.get(headerName.toLowerCase());
			signingParts.push(`${headerName.toLowerCase()}: ${headerValue}`);
		}
	}
	const signingString = signingParts.join('\n');

	const verifier = createVerify('RSA-SHA256');
	verifier.update(signingString);
	verifier.end();
	const isValid = verifier.verify(publicKey, signature, 'base64');

	return {
		isValid,
		actor,
	};
}

// Cache for normalized private key to avoid repeated string operations
let normalizedPrivateKey: string | null = null;
let lastPrivateKeyRaw: string | undefined = undefined;

function getNormalizedPrivateKey(env: Env): string {
	// Return cached key if env.PRIVATEKEY hasn't changed
	if (normalizedPrivateKey && lastPrivateKeyRaw === env.PRIVATEKEY) {
		return normalizedPrivateKey;
	}

	let privateKeyPem = env.PRIVATEKEY;
	if (!privateKeyPem) throw new Error('No private key found');

	privateKeyPem = privateKeyPem.split('\\n').join('\n');
	if (privateKeyPem.startsWith('"')) privateKeyPem = privateKeyPem.slice(1);
	if (privateKeyPem.endsWith('"')) privateKeyPem = privateKeyPem.slice(0, -1);

	normalizedPrivateKey = privateKeyPem;
	lastPrivateKeyRaw = env.PRIVATEKEY;
	return normalizedPrivateKey;
}

export function signHeaders(body: string, strInbox: string, env: Env) {
	const PRIVATE_KEY = getNormalizedPrivateKey(env);
	const strTime = new Date().toUTCString();
	const s256 = createHash('sha256').update(body).digest('base64');

	// Parse URL once and reuse
	const inboxUrl = new URL(strInbox);
	const pathname = inboxUrl.pathname;
	const hostname = inboxUrl.hostname;

	const signingString = [
		`(request-target): post ${pathname}`,
		`host: ${hostname}`,
		`date: ${strTime}`,
		`digest: SHA-256=${s256}`,
	].join('\n');

	const sig = createSign('RSA-SHA256');
	sig.update(signingString);
	sig.end();
	const b64 = sig.sign(PRIVATE_KEY, 'base64');

	return {
		Host: hostname,
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
