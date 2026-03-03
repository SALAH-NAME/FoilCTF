import jwt, { type SignOptions } from 'jsonwebtoken';

export type JWT_Payload = { username: string; id: number; role?: string };
export function JWT_verify<Payload = JWT_Payload>(
	token: string,
	secret: string
): Payload | null {
	try {
		return jwt.verify(token, secret) as Payload;
	} catch {
		return null;
	}
}

export function JWT_sign(
	payload: JWT_Payload,
	secret: string,
	options?: SignOptions
): string {
	return jwt.sign(payload, secret, options);
}
