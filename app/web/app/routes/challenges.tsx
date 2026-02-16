import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import type { Route } from './+types/index';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Challenges' }];
}

export default function Page() {
	const [dialogCreate, setDialogCreate] = useState<boolean>(false);
	return (
		<PageHeader
			title="Challenges"
			action={
				<Button onClick={() => setDialogCreate(true)}>+ New Challenge</Button>
			}
		/>
	);
}
