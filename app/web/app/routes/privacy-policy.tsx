import type { Route } from './+types/privacy-policy';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'FoilCTF - Privacy Policy' },
		{
			name: 'description',
			content: 'Privacy Policy for FoilCTF platform',
		},
	];
}

export default function Page() {
	return (
		<div className="h-full bg-background p-4 md:p-8 overflow-auto">
			<div className="max-w-4xl mx-auto bg-white rounded-md p-6 md:p-10 border border-dark/10">
				<h1 className="text-4xl font-bold text-dark mb-2">Privacy Policy</h1>
				<p className="text-dark/60 mb-8">Last updated: February 6, 2026</p>

				<section className="mb-8" aria-labelledby="introduction">
					<h2 id="introduction" className="text-2xl font-bold text-dark mb-4">
						Introduction
					</h2>
					<p className="text-dark/80 leading-relaxed mb-4">
						Welcome to FoilCTF ("we," "our," or "us"). We are committed to
						protecting your privacy and ensuring the security of your personal
						information. This Privacy Policy explains how we collect, use,
						disclose, and safeguard your information when you use our Capture
						The Flag (CTF) platform.
					</p>
					<p className="text-dark/80 leading-relaxed">
						By accessing or using FoilCTF, you agree to the terms outlined in
						this Privacy Policy. If you do not agree with our policies and
						practices, please do not use our platform.
					</p>
				</section>

				<section className="mb-8" aria-labelledby="information-collection">
					<h2
						id="information-collection"
						className="text-2xl font-bold text-dark mb-4"
					>
						Information We Collect
					</h2>
					<h3 className="text-xl font-semibold text-dark mb-3">
						Personal Information
					</h3>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed mb-4 space-y-2">
						<li>
							<strong>Account Information:</strong> Username, email address, and
							password when you register for an account
						</li>
						<li>
							<strong>Profile Information:</strong> Optional information you
							provide such as bio, avatar, and social media links
						</li>
						<li>
							<strong>OAuth Information:</strong> If you sign in using OAuth
							providers (such as 42 School), we receive your basic profile
							information from those services
						</li>
					</ul>

					<h3 className="text-xl font-semibold text-dark mb-3">
						Activity Information
					</h3>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed mb-4 space-y-2">
						<li>Challenge submissions and solutions</li>
						<li>Participation in events and competitions</li>
						<li>Scoreboard rankings and points earned</li>
						<li>Chat messages and communications within the platform</li>
						<li>Team memberships and collaborations</li>
					</ul>

					<h3 className="text-xl font-semibold text-dark mb-3">
						Technical Information
					</h3>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed space-y-2">
						<li>IP address and device information</li>
						<li>Browser type and operating system</li>
						<li>Access times and referring URLs</li>
						<li>
							Container and sandbox usage logs for security and performance
							monitoring
						</li>
					</ul>
				</section>

				<section className="mb-8" aria-labelledby="information-use">
					<h2
						id="information-use"
						className="text-2xl font-bold text-dark mb-4"
					>
						How We Use Your Information
					</h2>
					<p className="text-dark/80 leading-relaxed mb-3">
						We use the information we collect for the following purposes:
					</p>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed space-y-2">
						<li>
							<strong>Platform Operations:</strong> To provide, maintain, and
							improve our CTF platform services
						</li>
						<li>
							<strong>User Experience:</strong> To personalize your experience
							and display relevant challenges and events
						</li>
						<li>
							<strong>Security:</strong> To detect, prevent, and address
							technical issues, fraud, and security vulnerabilities
						</li>
						<li>
							<strong>Communication:</strong> To send you important updates,
							notifications about events, and respond to your inquiries
						</li>
						<li>
							<strong>Analytics:</strong> To analyze usage patterns and improve
							our platform features
						</li>
						<li>
							<strong>Competitions:</strong> To track progress, calculate
							rankings, and award points in CTF events
						</li>
					</ul>
				</section>

				<section className="mb-8" aria-labelledby="information-sharing">
					<h2
						id="information-sharing"
						className="text-2xl font-bold text-dark mb-4"
					>
						Information Sharing and Disclosure
					</h2>
					<p className="text-dark/80 leading-relaxed mb-3">
						We do not sell your personal information. We may share your
						information in the following circumstances:
					</p>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed space-y-2">
						<li>
							<strong>Public Information:</strong> Your username, scoreboard
							rankings, and challenge completion statistics are publicly visible
							to other users
						</li>
						<li>
							<strong>Legal Requirements:</strong> When required by law or to
							respond to legal processes
						</li>
						<li>
							<strong>Platform Security:</strong> To protect the rights,
							property, and safety of FoilCTF, our users, or the public
						</li>
						<li>
							<strong>Service Providers:</strong> With trusted third-party
							service providers who assist in operating our platform, subject to
							confidentiality agreements
						</li>
					</ul>
				</section>

				<section className="mb-8" aria-labelledby="data-security">
					<h2 id="data-security" className="text-2xl font-bold text-dark mb-4">
						Data Security
					</h2>
					<p className="text-dark/80 leading-relaxed mb-3">
						We implement industry-standard security measures to protect your
						personal information:
					</p>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed space-y-2">
						<li>Encrypted data transmission using HTTPS/TLS protocols</li>
						<li>Secure password hashing using modern algorithms</li>
						<li>
							Containerized sandbox environments to isolate user activities
						</li>
						<li>Regular security audits and monitoring</li>
						<li>Access controls and authentication mechanisms</li>
					</ul>
					<p className="text-dark/80 leading-relaxed mt-4">
						However, no method of transmission over the Internet is 100% secure.
						While we strive to protect your information, we cannot guarantee
						absolute security.
					</p>
				</section>

				<section className="mb-8" aria-labelledby="data-retention">
					<h2 id="data-retention" className="text-2xl font-bold text-dark mb-4">
						Data Retention
					</h2>
					<p className="text-dark/80 leading-relaxed">
						We retain your personal information for as long as your account is
						active or as needed to provide you services. You may request account
						deletion at any time through your profile settings. Upon deletion,
						your personal information will be removed, though some data may be
						retained for legal compliance, fraud prevention, or dispute
						resolution purposes.
					</p>
				</section>

				<section className="mb-8" aria-labelledby="your-rights">
					<h2 id="your-rights" className="text-2xl font-bold text-dark mb-4">
						Your Rights and Choices
					</h2>
					<p className="text-dark/80 leading-relaxed mb-3">
						You have the following rights regarding your personal information:
					</p>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed space-y-2">
						<li>
							<strong>Access:</strong> Request a copy of the personal
							information we hold about you
						</li>
						<li>
							<strong>Correction:</strong> Update or correct your account
							information through your profile settings
						</li>
						<li>
							<strong>Deletion:</strong> Request deletion of your account and
							associated data
						</li>
						<li>
							<strong>Opt-Out:</strong> Unsubscribe from promotional
							communications
						</li>
						<li>
							<strong>Data Portability:</strong> Request an export of your data
							in a structured format
						</li>
					</ul>
				</section>

				<section className="mb-8" aria-labelledby="cookies">
					<h2 id="cookies" className="text-2xl font-bold text-dark mb-4">
						Cookies and Tracking Technologies
					</h2>
					<p className="text-dark/80 leading-relaxed mb-3">
						We use cookies and similar tracking technologies to enhance your
						experience:
					</p>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed space-y-2">
						<li>
							<strong>Essential Cookies:</strong> Required for authentication
							and platform functionality
						</li>
						<li>
							<strong>Preference Cookies:</strong> Remember your settings and
							preferences
						</li>
						<li>
							<strong>Analytics Cookies:</strong> Help us understand how users
							interact with our platform
						</li>
					</ul>
					<p className="text-dark/80 leading-relaxed mt-4">
						You can control cookies through your browser settings, though
						disabling cookies may affect platform functionality.
					</p>
				</section>

				<section className="mb-8" aria-labelledby="third-party">
					<h2 id="third-party" className="text-2xl font-bold text-dark mb-4">
						Third-Party Services
					</h2>
					<p className="text-dark/80 leading-relaxed">
						Our platform may integrate with third-party services (such as OAuth
						providers, monitoring tools, and CDN services). These services have
						their own privacy policies, and we encourage you to review them. We
						are not responsible for the privacy practices of third-party
						services.
					</p>
				</section>

				<section className="mb-8" aria-labelledby="children">
					<h2 id="children" className="text-2xl font-bold text-dark mb-4">
						Children's Privacy
					</h2>
					<p className="text-dark/80 leading-relaxed">
						FoilCTF is intended for users aged 13 and older. We do not knowingly
						collect personal information from children under 13. If you believe
						we have collected information from a child under 13, please contact
						us immediately, and we will take steps to delete such information.
					</p>
				</section>

				<section className="mb-8" aria-labelledby="international">
					<h2 id="international" className="text-2xl font-bold text-dark mb-4">
						International Data Transfers
					</h2>
					<p className="text-dark/80 leading-relaxed">
						Your information may be transferred to and processed in countries
						other than your country of residence. We ensure appropriate
						safeguards are in place to protect your information in compliance
						with applicable data protection laws.
					</p>
				</section>

				<section className="mb-8" aria-labelledby="changes">
					<h2 id="changes" className="text-2xl font-bold text-dark mb-4">
						Changes to This Privacy Policy
					</h2>
					<p className="text-dark/80 leading-relaxed">
						We may update this Privacy Policy from time to time. We will notify
						you of any significant changes by posting a notice on our platform
						or sending you an email. Your continued use of FoilCTF after changes
						are posted constitutes your acceptance of the updated policy.
					</p>
				</section>

				<section aria-labelledby="contact">
					<h2 id="contact" className="text-2xl font-bold text-dark mb-4">
						Contact Us
					</h2>
					<p className="text-dark/80 leading-relaxed mb-3">
						If you have questions, concerns, or requests regarding this Privacy
						Policy or our data practices, please contact us.
					</p>
				</section>
			</div>
		</div>
	);
}
