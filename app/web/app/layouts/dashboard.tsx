import { Outlet } from 'react-router';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../contexts/SidebarContext';
import Icon from '../components/Icon';
import Logo from '../components/Logo';

export default function Layout() {
	const { toggleMobile } = useSidebar();

	return (
		<div className="flex min-h-screen">
			<header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-dark/10 flex items-center px-4 z-50">
				<button
					type="button"
					onClick={toggleMobile}
					className="p-2 hover:bg-accent/20 rounded-md transition-colors"
					aria-label="Toggle menu"
				>
					<Icon name="menu" className="size-6 text-white" />
				</button>
				<div className="absolute left-1/2 transform -translate-x-1/2">
					<Logo size="md" showText />
				</div>
			</header>

			<Sidebar />
			<div className="flex-1 flex flex-col">
				<main className="flex-1 p-4 transition-all duration-300 md:pt-4 pt-20">
					<Outlet />
				</main>
				<Footer />
			</div>
		</div>
	);
}
