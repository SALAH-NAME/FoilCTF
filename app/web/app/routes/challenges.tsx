import { Link } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import type { Route } from './+types/index';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Challenges' }];
}

export default function Page() {
	const [dialogCreate, setDialogCreate] = useState<boolean>(false);
	return (
		<>
			<header>
				<h1>Challenges</h1>
				<button onClick={() => setDialogCreate(true)}>+ New Challenge</button>
			</header>
		</>
	);
}
