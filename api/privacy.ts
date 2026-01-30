import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Daily Bag</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f9fafb;
        }
        h1 { color: #1e3a5f; margin-bottom: 10px; }
        h2 { color: #1e3a5f; margin-top: 30px; margin-bottom: 15px; font-size: 1.3em; }
        p { margin-bottom: 15px; }
        ul { margin-left: 20px; margin-bottom: 15px; }
        li { margin-bottom: 8px; }
        .last-updated { color: #666; font-size: 0.9em; margin-bottom: 30px; }
        .contact { background: #e8f4f8; padding: 20px; border-radius: 8px; margin-top: 30px; }
    </style>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p class="last-updated">Last updated: January 29, 2025</p>

    <p>Daily Bag ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.</p>

    <h2>Information We Collect</h2>
    <p>We collect information you provide directly to us:</p>
    <ul>
        <li><strong>Account Information:</strong> Email address and display name when you create an account</li>
        <li><strong>Household Data:</strong> Chore lists, points earned, and household member information you choose to add</li>
        <li><strong>Usage Data:</strong> How you interact with the app, including chores completed and features used</li>
    </ul>

    <h2>How We Use Your Information</h2>
    <p>We use the information we collect to:</p>
    <ul>
        <li>Provide, maintain, and improve our services</li>
        <li>Track your chores, points, and achievements</li>
        <li>Enable household features and leaderboards</li>
        <li>Send you notifications about your activity (if enabled)</li>
        <li>Respond to your comments and questions</li>
    </ul>

    <h2>Information Sharing</h2>
    <p>We do not sell, trade, or rent your personal information to third parties. We may share information:</p>
    <ul>
        <li>With other members of your household (chore completion, points, rankings)</li>
        <li>With service providers who assist in operating our app (e.g., hosting, analytics)</li>
        <li>If required by law or to protect our rights</li>
    </ul>

    <h2>Data Storage and Security</h2>
    <p>Your data is stored securely using industry-standard encryption. We use Convex for our backend database, which provides real-time synchronization and secure data storage. We implement appropriate technical and organizational measures to protect your personal information.</p>

    <h2>Your Rights</h2>
    <p>You have the right to:</p>
    <ul>
        <li>Access your personal data</li>
        <li>Correct inaccurate data</li>
        <li>Delete your account and associated data</li>
        <li>Export your data</li>
        <li>Opt out of marketing communications</li>
    </ul>

    <h2>Children's Privacy</h2>
    <p>Daily Bag is designed as a family-friendly app. Children under 13 may use the app under parental supervision. We do not knowingly collect personal information from children under 13 without parental consent.</p>

    <h2>Third-Party Services</h2>
    <p>Our app may use third-party services that collect information:</p>
    <ul>
        <li><strong>Authentication:</strong> Google Sign-In, GitHub (optional)</li>
        <li><strong>Payments:</strong> Stripe (for premium subscriptions)</li>
        <li><strong>Analytics:</strong> Anonymous usage statistics</li>
    </ul>

    <h2>Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>

    <div class="contact">
        <h2>Contact Us</h2>
        <p>If you have questions about this Privacy Policy or our practices, please contact us at:</p>
        <p><strong>Email:</strong> privacy@daily-bag.app</p>
    </div>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html')
  res.status(200).send(html)
}
