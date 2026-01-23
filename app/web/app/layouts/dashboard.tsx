import { Outlet } from 'react-router';
import Sidebar from '../components/Sidebar.tsx';

export default function Layout() {
	return (
		<div>
			<Sidebar />
			<main>
				<Outlet />
			</main>
			<footer></footer>
		</div>
   );
}
