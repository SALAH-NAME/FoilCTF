import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';

import { Outlet } from 'react-router';

export default function Layout() {
	return (
		<div className="grid grid-cols-[auto_1fr] grid-rows-[1fr_auto] min-h-screen">
			<Sidebar />
			<main className="h-full">
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}
