import { Outlet, redirect } from "react-router";

import { getSession } from "~/session.server";
import type { Layout } from "./types";

export async function loader({ request }: Layout.LoaderArgs) {
	// NOTE(xenobas): If these fail, we're in disaster mode obviously.
	const request_uri = URL.parse(request.url)!;
	const signin_uri = URL.parse('signin', request_uri.protocol + '//' + request_uri.host)!;
	signin_uri.searchParams.set('redirect_uri', request_uri.toString());

	const cookie = request.headers.get('Cookie');
	if (!cookie)
		return redirect(signin_uri.toString());

	const session = await getSession(cookie);
	if (!session.has('token_access'))
		return redirect(signin_uri.toString());
}

export default function Layout() {
	return (<Outlet />);
}
