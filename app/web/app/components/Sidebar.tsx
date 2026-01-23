import { Link } from 'react-router';

export default function Component() {
	return (
		<aside>
			<nav>
				<Link to="/challenges">Challenges</Link>
				<Link to="/challenges">Instances</Link>
			</nav>
		</aside>
	);
}
