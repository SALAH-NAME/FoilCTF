import { Link } from 'react-router';
import type { Route } from './+types/terms-of-service';
import {
	LegalDocument,
	Section,
	Subsection,
	Paragraph,
	List,
} from '../components/LegalDocument';

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
		<LegalDocument title="Terms of Service" lastUpdated="February 6, 2026">
			<Section id="acceptance" title="Acceptance of Terms">
				<Paragraph className="mb-4">
					Welcome to FoilCTF, a Capture The Flag (CTF) platform designed for
					cybersecurity education and competition. By accessing or using FoilCTF
					("the Platform," "we," "our," or "us"), you agree to be bound by these
					Terms of Service ("Terms").
				</Paragraph>
				<Paragraph>
					If you do not agree to these Terms, you may not access or use the
					Platform. We reserve the right to modify these Terms at any time, and
					your continued use of the Platform constitutes acceptance of any
					changes.
				</Paragraph>
			</Section>

			<Section id="eligibility" title="Eligibility">
				<Paragraph className="mb-3">To use FoilCTF, you must:</Paragraph>
				<List
					items={[
						'Be at least 13 years of age',
						'Have the legal capacity to enter into binding agreements in your jurisdiction',
						'Not be prohibited from using the Platform under applicable laws',
						'Comply with all local, state, national, and international laws and regulations',
					]}
				/>
			</Section>

			<Section id="account" title="Account Registration and Security">
				<Subsection title="Account Creation">
					<Paragraph className="mb-4">
						You may create an account by providing accurate and complete
						information. You can register using your email address or through
						OAuth providers (such as 42 School). You are responsible for
						maintaining the confidentiality of your account credentials.
					</Paragraph>
				</Subsection>

				<Subsection title="Account Responsibilities">
					<List
						items={[
							'Provide accurate, current, and complete information during registration',
							'Maintain and promptly update your account information',
							'Keep your password secure and confidential',
							'Notify us immediately of any unauthorized access to your account',
							'Accept responsibility for all activities that occur under your account',
							'Use only one account per person',
						]}
					/>
				</Subsection>
			</Section>

			<Section id="acceptable-use" title="Acceptable Use Policy">
				<Paragraph className="mb-3">
					You agree to use FoilCTF for lawful purposes only. The following
					activities are strictly prohibited:
				</Paragraph>

				<Subsection title="Prohibited Activities" className="mt-6">
					<List
						items={[
							<>
								<strong>Unauthorized Access:</strong> Attempting to access,
								modify, or interfere with other users' accounts, data, or
								systems outside of designated challenge environments
							</>,
							<>
								<strong>Platform Attacks:</strong> Attacking, exploiting, or
								attempting to compromise the FoilCTF infrastructure, services,
								or other users' systems
							</>,
							<>
								<strong>Cheating:</strong> Sharing challenge solutions, using
								unauthorized tools, or collaborating when individual work is
								required
							</>,
							<>
								<strong>Multiple Accounts:</strong> Creating multiple accounts
								to gain unfair advantages or manipulate scoreboards
							</>,
							<>
								<strong>Resource Abuse:</strong> Excessive use of sandbox
								containers, API abuse, or any activity that degrades platform
								performance
							</>,
							<>
								<strong>Malicious Content:</strong> Uploading malware, viruses,
								or any malicious code outside of designated challenge contexts
							</>,
							<>
								<strong>Harassment:</strong> Harassing, threatening, or abusing
								other users through chat, submissions, or any platform feature
							</>,
							<>
								<strong>Illegal Activities:</strong> Using the Platform for any
								illegal purpose or in violation of local, state, or
								international laws
							</>,
							<>
								<strong>Impersonation:</strong> Impersonating other users,
								administrators, or any third parties
							</>,
							<>
								<strong>Spam and Advertising:</strong> Posting unsolicited
								advertisements, spam, or promotional content
							</>,
						]}
					/>
				</Subsection>

				<Subsection title="Scope of Activities" className="mt-6">
					<Paragraph>
						All hacking, penetration testing, and security research activities
						must be conducted solely within the provided sandbox environments
						and challenge contexts. Any testing or exploitation of the FoilCTF
						platform itself, other users' systems, or external systems is
						strictly prohibited and may result in legal action.
					</Paragraph>
				</Subsection>
			</Section>

			<Section id="challenges" title="CTF Challenges and Competitions">
				<Subsection title="Rules">
					<List
						className="mb-4"
						items={[
							'Challenges must be solved individually unless explicitly marked as team challenges',
							'Sharing flags, solutions, or writeups during active events is prohibited',
							'Automated solution tools or brute-force attacks may be prohibited for specific challenges',
							'All submissions are logged and may be reviewed for compliance',
							'Points and rankings are calculated based on challenge difficulty, solve time, and competition rules',
						]}
					/>
				</Subsection>

				<Subsection title="Sandbox Environments">
					<Paragraph className="mb-3">
						Challenge instances run in isolated container environments:
					</Paragraph>
					<List
						items={[
							'Sandbox instances are temporary and may be terminated after inactivity',
							'Resource limits apply to prevent abuse',
							'Do not use sandbox environments for purposes other than solving the associated challenge',
							'All activities within sandboxes are monitored for security and performance',
						]}
					/>
				</Subsection>
			</Section>

			<Section id="intellectual-property" title="Intellectual Property">
				<Subsection title="Platform Content">
					<Paragraph className="mb-4">
						All content, features, and functionality of FoilCTF, including but
						not limited to text, graphics, logos, software, challenges, and
						documentation, are owned by FoilCTF or its licensors and are
						protected by copyright, trademark, and other intellectual property
						laws.
					</Paragraph>
				</Subsection>

				<Subsection title="User Content">
					<Paragraph className="mb-3">
						By submitting content to FoilCTF (including challenge submissions,
						chat messages, and profile information), you grant us:
					</Paragraph>
					<List
						items={[
							'A worldwide, non-exclusive, royalty-free license to use, reproduce, and display your content',
							'The right to use your username and statistics for scoreboards and rankings',
							'Permission to showcase your achievements and solutions (after event completion) for educational purposes',
						]}
					/>
				</Subsection>

				<Subsection title="Writeups and Solutions" className="mt-6">
					<Paragraph>
						You may publish writeups and solutions after events have concluded,
						but you must not share solutions during active competitions. We
						encourage educational content that helps others learn.
					</Paragraph>
				</Subsection>
			</Section>

			<Section id="privacy" title="Privacy and Data Collection">
				<Paragraph>
					Your use of FoilCTF is also governed by our{' '}
					<Link
						to="/privacy-policy"
						className="text-primary hover:underline font-semibold"
					>
						Privacy Policy
					</Link>
					. We collect and process data as described in the Privacy Policy to
					provide and improve our services.
				</Paragraph>
			</Section>

			<Section id="termination" title="Termination and Suspension">
				<Paragraph className="mb-3">
					We reserve the right to suspend or terminate your account and access
					to FoilCTF at our sole discretion, without notice, for conduct that we
					believe:
				</Paragraph>
				<List
					className="mb-4"
					items={[
						'Violates these Terms of Service',
						'Is harmful to other users, us, or third parties',
						'Violates applicable laws or regulations, or exposes us to legal liability',
					]}
				/>
				<Paragraph>
					You may delete your account at any time through your profile settings.
					Upon termination, your right to access the Platform ceases
					immediately.
				</Paragraph>
			</Section>

			<Section id="disclaimers" title="Disclaimers and Limitations">
				<Subsection title="Service Availability">
					<Paragraph className="mb-4">
						FoilCTF is provided "as is" and "as available" without warranties of
						any kind. We do not guarantee that the Platform will be
						uninterrupted, secure, or error-free. We reserve the right to modify
						or discontinue the Platform at any time without notice.
					</Paragraph>
				</Subsection>

				<Subsection title="Educational Purpose">
					<Paragraph className="mb-4">
						FoilCTF is an educational platform designed to teach cybersecurity
						concepts in a legal and controlled environment. The skills and
						knowledge gained should be used ethically and legally. We are not
						responsible for any misuse of knowledge or skills acquired through
						our Platform.
					</Paragraph>
				</Subsection>

				<Subsection title="Limitation of Liability">
					<Paragraph>
						To the maximum extent permitted by law, FoilCTF and its operators
						shall not be liable for any indirect, incidental, special,
						consequential, or punitive damages resulting from your use or
						inability to use the Platform. This includes but is not limited to
						loss of data, loss of profits, or any other losses.
					</Paragraph>
				</Subsection>
			</Section>

			<Section id="indemnification" title="Indemnification">
				<Paragraph>
					You agree to indemnify, defend, and hold harmless FoilCTF, its
					operators, affiliates, and their respective officers, directors,
					employees, and agents from any claims, liabilities, damages, losses,
					and expenses (including reasonable attorneys' fees) arising from:
				</Paragraph>
				<List
					className="mt-3"
					items={[
						'Your use of the Platform',
						'Your violation of these Terms',
						'Your violation of any rights of another party',
						'Any content you submit or transmit through the Platform',
					]}
				/>
			</Section>

			<Section id="dispute-resolution" title="Dispute Resolution">
				<Paragraph>
					In the event of any dispute arising from or relating to these Terms or
					your use of FoilCTF, you agree to first attempt to resolve the dispute
					informally by contacting us. If the dispute cannot be resolved
					informally, it shall be resolved through binding arbitration or in the
					courts of the jurisdiction where FoilCTF operates.
				</Paragraph>
			</Section>

			<Section id="general" title="General Provisions">
				<Subsection title="Entire Agreement">
					<Paragraph className="mb-4">
						These Terms, together with our Privacy Policy, constitute the entire
						agreement between you and FoilCTF regarding your use of the
						Platform.
					</Paragraph>
				</Subsection>

				<Subsection title="Severability">
					<Paragraph className="mb-4">
						If any provision of these Terms is found to be unenforceable or
						invalid, that provision will be limited or eliminated to the minimum
						extent necessary, and the remaining provisions will remain in full
						force and effect.
					</Paragraph>
				</Subsection>

				<Subsection title="Waiver">
					<Paragraph className="mb-4">
						No waiver of any term of these Terms shall be deemed a further or
						continuing waiver of such term or any other term.
					</Paragraph>
				</Subsection>

				<Subsection title="Assignment">
					<Paragraph>
						You may not assign or transfer these Terms or your rights and
						obligations hereunder without our prior written consent. We may
						assign these Terms without restriction.
					</Paragraph>
				</Subsection>
			</Section>

			<Section id="changes-terms" title="Changes to Terms">
				<Paragraph>
					We reserve the right to modify these Terms at any time. We will notify
					users of material changes by posting a notice on the Platform or
					sending an email notification. Your continued use of FoilCTF after
					such modifications constitutes your acceptance of the updated Terms.
				</Paragraph>
			</Section>

			<Section id="contact-terms" title="Contact Information">
				<Paragraph>
					If you have questions or concerns about these Terms of Service, please
					contact us.
				</Paragraph>
			</Section>

			<div className="mt-10 pt-6 border-t border-dark/10">
				<p className="text-dark/60 text-sm">
					By using FoilCTF, you acknowledge that you have read, understood, and
					agree to be bound by these Terms of Service.
				</p>
			</div>
		</LegalDocument>
	);
}
