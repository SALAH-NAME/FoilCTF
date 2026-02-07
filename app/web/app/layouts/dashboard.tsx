import { Outlet } from 'react-router';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';

export default function Layout() {
	return (
		<div className="flex min-h-screen">
			<Sidebar />
			<div className="flex-1 flex flex-col">
				<main className={`flex-1 p-4  transition-all duration-300 `}>
					<Outlet />
				</main>
				<Footer />
			</div>
		</div>
	);
}
