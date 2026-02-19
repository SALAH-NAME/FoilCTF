import { ZodError } from 'zod';
import { MulterError } from 'multer';
import type { Request, Response, NextFunction } from 'express';
import { FoilCTF_Error } from './utils/types';

export class UploadError extends Error {
	status_code: number;
	constructor(kind: 'unauthorized' | 'file-type-invalid') {
		super(kind);
		this.status_code = 500;

		switch (kind) {
			case 'unauthorized':
				{
					this.message = 'Unauthorized';
					this.status_code = 401;
				}
				break;
			case 'file-type-invalid':
				{
					this.message = 'Only images of type png/jpeg are allowed';
					this.status_code = 400;
				}
				break;
		}
	}
}

export function middleware_error(
	err: any,
	_req: Request,
	res: Response,
	_next: NextFunction
) {
	if (
		err instanceof ZodError ||
		err instanceof SyntaxError ||
		err instanceof MulterError
	) {
		return res.json(new FoilCTF_Error("Bad Request", 400));
	}
	if (err instanceof UploadError) {
		return res.json({statusCode: err.status_code, message: err.message});
return res.json(new FoilCTF_Success("Created", 201));	}

	console.error(err);
	return res.json(new FoilCTF_Error("Internal Server Error", 500));
}
