import type { Route } from './+types/terms-of-service';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'FoilCTF - Terms of Service' },
		{
			name: 'description',
			content: 'Terms of Service for FoilCTF platform',
		},
	];
}

export default function Page() {
	return (
		<div className="h-full bg-background p-4 md:p-8 overflow-auto">
			<div className="max-w-4xl mx-auto bg-white rounded-md p-6 md:p-10 border border-dark/10">
				<h1 className="text-4xl font-bold text-dark mb-2">Terms of Service</h1>
				<p className="text-dark/60 mb-8">Last updated: February 6, 2026</p>

				<section className="mb-8" aria-labelledby="acceptance">
					<h2 id="acceptance" className="text-2xl font-bold text-dark mb-4">
						Acceptance of Terms
					</h2>
					<p className="text-dark/80 leading-relaxed mb-4">
						Welcome to FoilCTF, a Capture The Flag (CTF) platform designed for
						cybersecurity education and competition. By accessing or using
						FoilCTF ("the Platform," "we," "our," or "us"), you agree to be
						bound by these Terms of Service ("Terms").
					</p>
					<p className="text-dark/80 leading-relaxed">
						If you do not agree to these Terms, you may not access or use the
						Platform. We reserve the right to modify these Terms at any time,
						and your continued use of the Platform constitutes acceptance of any
						changes.
					</p>
				</section>

				<section className="mb-8" aria-labelledby="eligibility">
					<h2 id="eligibility" className="text-2xl font-bold text-dark mb-4">
						Eligibility
					</h2>
					<p className="text-dark/80 leading-relaxed mb-3">
						To use FoilCTF, you must:
					</p>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed space-y-2">
						<li>Be at least 13 years of age</li>
						<li>
							Have the legal capacity to enter into binding agreements in your
							jurisdiction
						</li>
						<li>
							Not be prohibited from using the Platform under applicable laws
						</li>
						<li>
							Comply with all local, state, national, and international laws and
							regulations
						</li>
					</ul>
				</section>

				<section className="mb-8" aria-labelledby="account">
					<h2 id="account" className="text-2xl font-bold text-dark mb-4">
						Account Registration and Security
					</h2>
					<h3 className="text-xl font-semibold text-dark mb-3">
						Account Creation
					</h3>
					<p className="text-dark/80 leading-relaxed mb-4">
						You may create an account by providing accurate and complete
						information. You can register using your email address or through
						OAuth providers (such as 42 School). You are responsible for
						maintaining the confidentiality of your account credentials.
					</p>

					<h3 className="text-xl font-semibold text-dark mb-3">
						Account Responsibilities
					</h3>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed space-y-2">
						<li>
							Provide accurate, current, and complete information during
							registration
						</li>
						<li>Maintain and promptly update your account information</li>
						<li>Keep your password secure and confidential</li>
						<li>
							Notify us immediately of any unauthorized access to your account
						</li>
						<li>
							Accept responsibility for all activities that occur under your
							account
						</li>
						<li>Use only one account per person</li>
					</ul>
				</section>

				<section className="mb-8" aria-labelledby="acceptable-use">
					<h2 id="acceptable-use" className="text-2xl font-bold text-dark mb-4">
						Acceptable Use Policy
					</h2>
					<p className="text-dark/80 leading-relaxed mb-3">
						You agree to use FoilCTF for lawful purposes only. The following
						activities are strictly prohibited:
					</p>

					<h3 className="text-xl font-semibold text-dark mb-3 mt-6">
						Prohibited Activities
					</h3>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed space-y-2">
						<li>
							<strong>Unauthorized Access:</strong> Attempting to access,
							modify, or interfere with other users' accounts, data, or systems
							outside of designated challenge environments
						</li>
						<li>
							<strong>Platform Attacks:</strong> Attacking, exploiting, or
							attempting to compromise the FoilCTF infrastructure, services, or
							other users' systems
						</li>
						<li>
							<strong>Cheating:</strong> Sharing challenge solutions, using
							unauthorized tools, or collaborating when individual work is
							required
						</li>
						<li>
							<strong>Multiple Accounts:</strong> Creating multiple accounts to
							gain unfair advantages or manipulate scoreboards
						</li>
						<li>
							<strong>Resource Abuse:</strong> Excessive use of sandbox
							containers, API abuse, or any activity that degrades platform
							performance
						</li>
						<li>
							<strong>Malicious Content:</strong> Uploading malware, viruses, or
							any malicious code outside of designated challenge contexts
						</li>
						<li>
							<strong>Harassment:</strong> Harassing, threatening, or abusing
							other users through chat, submissions, or any platform feature
						</li>
						<li>
							<strong>Illegal Activities:</strong> Using the Platform for any
							illegal purpose or in violation of local, state, or international
							laws
						</li>
						<li>
							<strong>Impersonation:</strong> Impersonating other users,
							administrators, or any third parties
						</li>
						<li>
							<strong>Spam and Advertising:</strong> Posting unsolicited
							advertisements, spam, or promotional content
						</li>
					</ul>

					<h3 className="text-xl font-semibold text-dark mb-3 mt-6">
						Scope of Activities
					</h3>
					<p className="text-dark/80 leading-relaxed">
						All hacking, penetration testing, and security research activities
						must be conducted solely within the provided sandbox environments
						and challenge contexts. Any testing or exploitation of the FoilCTF
						platform itself, other users' systems, or external systems is
						strictly prohibited and may result in legal action.
					</p>
				</section>

				<section className="mb-8" aria-labelledby="challenges">
					<h2 id="challenges" className="text-2xl font-bold text-dark mb-4">
						CTF Challenges and Competitions
					</h2>
					<h3 className="text-xl font-semibold text-dark mb-3">Rules</h3>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed mb-4 space-y-2">
						<li>
							Challenges must be solved individually unless explicitly marked as
							team challenges
						</li>
						<li>
							Sharing flags, solutions, or writeups during active events is
							prohibited
						</li>
						<li>
							Automated solution tools or brute-force attacks may be prohibited
							for specific challenges
						</li>
						<li>
							All submissions are logged and may be reviewed for compliance
						</li>
						<li>
							Points and rankings are calculated based on challenge difficulty,
							solve time, and competition rules
						</li>
					</ul>

					<h3 className="text-xl font-semibold text-dark mb-3">
						Sandbox Environments
					</h3>
					<p className="text-dark/80 leading-relaxed mb-3">
						Challenge instances run in isolated container environments:
					</p>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed space-y-2">
						<li>
							Sandbox instances are temporary and may be terminated after
							inactivity
						</li>
						<li>Resource limits apply to prevent abuse</li>
						<li>
							Do not use sandbox environments for purposes other than solving
							the associated challenge
						</li>
						<li>
							All activities within sandboxes are monitored for security and
							performance
						</li>
					</ul>
				</section>

				<section className="mb-8" aria-labelledby="intellectual-property">
					<h2
						id="intellectual-property"
						className="text-2xl font-bold text-dark mb-4"
					>
						Intellectual Property
					</h2>
					<h3 className="text-xl font-semibold text-dark mb-3">
						Platform Content
					</h3>
					<p className="text-dark/80 leading-relaxed mb-4">
						All content, features, and functionality of FoilCTF, including but
						not limited to text, graphics, logos, software, challenges, and
						documentation, are owned by FoilCTF or its licensors and are
						protected by copyright, trademark, and other intellectual property
						laws.
					</p>

					<h3 className="text-xl font-semibold text-dark mb-3">User Content</h3>
					<p className="text-dark/80 leading-relaxed mb-3">
						By submitting content to FoilCTF (including challenge submissions,
						chat messages, and profile information), you grant us:
					</p>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed space-y-2">
						<li>
							A worldwide, non-exclusive, royalty-free license to use,
							reproduce, and display your content
						</li>
						<li>
							The right to use your username and statistics for scoreboards and
							rankings
						</li>
						<li>
							Permission to showcase your achievements and solutions (after
							event completion) for educational purposes
						</li>
					</ul>

					<h3 className="text-xl font-semibold text-dark mb-3 mt-6">
						Writeups and Solutions
					</h3>
					<p className="text-dark/80 leading-relaxed">
						You may publish writeups and solutions after events have concluded,
						but you must not share solutions during active competitions. We
						encourage educational content that helps others learn.
					</p>
				</section>

				<section className="mb-8" aria-labelledby="privacy">
					<h2 id="privacy" className="text-2xl font-bold text-dark mb-4">
						Privacy and Data Collection
					</h2>
					<p className="text-dark/80 leading-relaxed">
						Your use of FoilCTF is also governed by our{' '}
						<a
							href="/privacy-policy"
							className="text-primary hover:underline font-semibold"
						>
							Privacy Policy
						</a>
						. We collect and process data as described in the Privacy Policy to
						provide and improve our services.
					</p>
				</section>

				<section className="mb-8" aria-labelledby="termination">
					<h2 id="termination" className="text-2xl font-bold text-dark mb-4">
						Termination and Suspension
					</h2>
					<p className="text-dark/80 leading-relaxed mb-3">
						We reserve the right to suspend or terminate your account and access
						to FoilCTF at our sole discretion, without notice, for conduct that
						we believe:
					</p>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed mb-4 space-y-2">
						<li>Violates these Terms of Service</li>
						<li>Is harmful to other users, us, or third parties</li>
						<li>
							Violates applicable laws or regulations, or exposes us to legal
							liability
						</li>
					</ul>
					<p className="text-dark/80 leading-relaxed">
						You may delete your account at any time through your profile
						settings. Upon termination, your right to access the Platform ceases
						immediately.
					</p>
				</section>

				<section className="mb-8" aria-labelledby="disclaimers">
					<h2 id="disclaimers" className="text-2xl font-bold text-dark mb-4">
						Disclaimers and Limitations
					</h2>
					<h3 className="text-xl font-semibold text-dark mb-3">
						Service Availability
					</h3>
					<p className="text-dark/80 leading-relaxed mb-4">
						FoilCTF is provided "as is" and "as available" without warranties of
						any kind. We do not guarantee that the Platform will be
						uninterrupted, secure, or error-free. We reserve the right to modify
						or discontinue the Platform at any time without notice.
					</p>

					<h3 className="text-xl font-semibold text-dark mb-3">
						Educational Purpose
					</h3>
					<p className="text-dark/80 leading-relaxed mb-4">
						FoilCTF is an educational platform designed to teach cybersecurity
						concepts in a legal and controlled environment. The skills and
						knowledge gained should be used ethically and legally. We are not
						responsible for any misuse of knowledge or skills acquired through
						our Platform.
					</p>

					<h3 className="text-xl font-semibold text-dark mb-3">
						Limitation of Liability
					</h3>
					<p className="text-dark/80 leading-relaxed">
						To the maximum extent permitted by law, FoilCTF and its operators
						shall not be liable for any indirect, incidental, special,
						consequential, or punitive damages resulting from your use or
						inability to use the Platform. This includes but is not limited to
						loss of data, loss of profits, or any other losses.
					</p>
				</section>

				<section className="mb-8" aria-labelledby="indemnification">
					<h2
						id="indemnification"
						className="text-2xl font-bold text-dark mb-4"
					>
						Indemnification
					</h2>
					<p className="text-dark/80 leading-relaxed">
						You agree to indemnify, defend, and hold harmless FoilCTF, its
						operators, affiliates, and their respective officers, directors,
						employees, and agents from any claims, liabilities, damages, losses,
						and expenses (including reasonable attorneys' fees) arising from:
					</p>
					<ul className="list-disc list-inside text-dark/80 leading-relaxed mt-3 space-y-2">
						<li>Your use of the Platform</li>
						<li>Your violation of these Terms</li>
						<li>Your violation of any rights of another party</li>
						<li>Any content you submit or transmit through the Platform</li>
					</ul>
				</section>

				<section className="mb-8" aria-labelledby="dispute-resolution">
					<h2
						id="dispute-resolution"
						className="text-2xl font-bold text-dark mb-4"
					>
						Dispute Resolution
					</h2>
					<p className="text-dark/80 leading-relaxed mb-4">
						In the event of any dispute arising from or relating to these Terms
						or your use of FoilCTF, you agree to first attempt to resolve the
						dispute informally by contacting us. If the dispute cannot be
						resolved informally, it shall be resolved through binding
						arbitration or in the courts of the jurisdiction where FoilCTF
						operates.
					</p>
				</section>

				<section className="mb-8" aria-labelledby="general">
					<h2 id="general" className="text-2xl font-bold text-dark mb-4">
						General Provisions
					</h2>
					<h3 className="text-xl font-semibold text-dark mb-3">
						Entire Agreement
					</h3>
					<p className="text-dark/80 leading-relaxed mb-4">
						These Terms, together with our Privacy Policy, constitute the entire
						agreement between you and FoilCTF regarding your use of the
						Platform.
					</p>

					<h3 className="text-xl font-semibold text-dark mb-3">Severability</h3>
					<p className="text-dark/80 leading-relaxed mb-4">
						If any provision of these Terms is found to be unenforceable or
						invalid, that provision will be limited or eliminated to the minimum
						extent necessary, and the remaining provisions will remain in full
						force and effect.
					</p>

					<h3 className="text-xl font-semibold text-dark mb-3">Waiver</h3>
					<p className="text-dark/80 leading-relaxed mb-4">
						No waiver of any term of these Terms shall be deemed a further or
						continuing waiver of such term or any other term.
					</p>

					<h3 className="text-xl font-semibold text-dark mb-3">Assignment</h3>
					<p className="text-dark/80 leading-relaxed">
						You may not assign or transfer these Terms or your rights and
						obligations hereunder without our prior written consent. We may
						assign these Terms without restriction.
					</p>
				</section>

				<section className="mb-8" aria-labelledby="changes-terms">
					<h2 id="changes-terms" className="text-2xl font-bold text-dark mb-4">
						Changes to Terms
					</h2>
					<p className="text-dark/80 leading-relaxed">
						We reserve the right to modify these Terms at any time. We will
						notify users of material changes by posting a notice on the Platform
						or sending an email notification. Your continued use of FoilCTF
						after such modifications constitutes your acceptance of the updated
						Terms.
					</p>
				</section>

				<section aria-labelledby="contact-terms">
					<h2 id="contact-terms" className="text-2xl font-bold text-dark mb-4">
						Contact Information
					</h2>
					<p className="text-dark/80 leading-relaxed mb-3">
						If you have questions or concerns about these Terms of Service,
						please contact us.
					</p>
					{/* <div className="bg-background p-4 rounded-md border border-dark/10">
						<p className="text-dark/80">
							<strong>Email:</strong> 
						</p>
					</div> */}
				</section>

				<div className="mt-10 pt-6 border-t border-dark/10">
					<p className="text-dark/60 text-sm">
						By using FoilCTF, you acknowledge that you have read, understood,
						and agree to be bound by these Terms of Service.
					</p>
				</div>
			</div>
		</div>
	);
}
