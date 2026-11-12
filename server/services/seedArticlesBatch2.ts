import type { EditorialArticle, EditorialAuthor } from './types.ts';

/**
 * Batch 2: sourced guides. Every factual claim is tied to a linked source in the "Sources" list.
 * No invented numbers or quotes. AI-assisted flag is set honestly.
 */
const author: EditorialAuthor = {
  id: 'author-factinfolive',
  name: 'FactInfoLive',
  role: 'Editorial team (AI-assisted, human-reviewed)',
  bio: 'Articles are researched from linked sources with AI assistance and reviewed by a person before publishing.',
};

const PUBLISHED = '2026-11-12T09:00:00.000Z';

export const BATCH_2_ARTICLES: EditorialArticle[] = [
  {
    id: 'art-b2-lateral-reading',
    slug: 'lateral-reading-how-fact-checkers-check-a-website',
    type: 'guide',
    title: 'Lateral Reading: The Trick Professional Fact-Checkers Use to Judge a Website',
    subtitle: 'Stop reading the site itself. Open new tabs and see what others say about it. A Stanford study found this beat historians and students.',
    content: `### The short answer
Lateral reading means leaving an unfamiliar website quickly and opening new browser tabs to find out who is behind it and what other sources say about it, instead of judging it only by how it looks or what its own "About" page claims.

### What the Stanford study found
In 2017, Sam Wineburg and Sarah McGrew of the Stanford History Education Group studied how 45 people judged live websites: 10 historians with PhDs, 10 professional fact-checkers and 25 Stanford undergraduates. According to the paper's summary, historians and students often fell for easy-to-fake features such as official-looking logos and domain names and read "vertically", staying on the site. The fact-checkers read laterally, left the site after a quick look, and reached more warranted conclusions in a fraction of the time.

One task asked participants to compare two websites about bullying: one from the American Academy of Pediatrics and one from the American College of Pediatricians. A university library guide that summarises the study reports that all of the fact-checkers identified the reliable site, compared with half of the historians and 20 percent of the undergraduates. The researchers suggest the fact-checkers succeeded because they searched for information about each group elsewhere instead of staying on its pages.

### How to do it in 3 steps
1. Get your bearings first. Before reading a page closely, open a new tab and search for the name of the site or organization.
2. Read what other trusted sources say about it. One teaching guide suggests checking several independent sources and then deciding whether the original is trustworthy.
3. Go back and read with context. Only after you know who is behind it and how others describe it, return to the article and judge its claims.

### Another habit: click restraint
A Stanford curriculum also teaches "click restraint": do not just click the first search result. Scan several results before deciding which to open.

### Limits
Lateral reading tells you about a source's reputation and who is behind it. It does not prove that a particular claim is true. For that, look for the original evidence the claim rests on.

### Sources
Wineburg, S. and McGrew, S., "Lateral Reading: Reading Less and Learning More When Evaluating Digital Information" (Stanford History Education Group, 2017): https://ssrn.com/abstract=3048994
Social Science Research Council summary of the same paper: https://mediawell.ssrc.org/citations/lateral-reading-reading-less-and-learning-more-when-evaluating-digital-information/
Indiana University library guide, web evaluation skills (summarises the study results): https://iu.pressbooks.pub/infolit/?p=134
University of Iowa open textbook, "Evaluating Online Information: Lateral Reading": https://pressbooks.uiowa.edu/ssresearchmethodscommunicationonline/chapter/evaluating-online-information-lateral-reading/
EdSource on the Stanford curriculum and click restraint: https://edsource.org/terms/stanford-history-education-group`,
    author,
    category: 'technology',
    tags: ['lateral reading', 'fact-checking', 'media literacy', 'website credibility', 'Stanford'],
    status: 'published',
    publishedAt: PUBLISHED,
    updatedAt: PUBLISHED,
    readingTimeMinutes: 4,
    isAiAssisted: true,
    seoMetadata: {
      seoTitle: 'Lateral Reading: How Fact-Checkers Judge a Website (Stanford Study)',
      metaDescription: 'Lateral reading means opening new tabs to check who is behind a site. A Stanford study found fact-checkers using it beat historians and students. Steps and sources.',
      focusKeyword: 'lateral reading how to check a website',
      schemaType: 'HowTo',
    },
  },
  {
    id: 'art-b2-ai-image-check',
    slug: 'how-to-check-if-an-image-is-ai-generated-synthid-content-credentials',
    type: 'guide',
    title: 'How to Check if an Image Is AI-Generated: SynthID and Content Credentials Explained',
    subtitle: 'Two provenance signals can help, but neither can prove an image is real. Here is what each one tells you and where it falls short.',
    content: `### The short answer
There is no single test that proves an image is real. Two signals can give positive evidence that an image came from AI or was edited: Google's SynthID watermark and C2PA Content Credentials. If neither is found, that tells you little.

### SynthID
SynthID is an invisible watermark that Google adds to content made with its AI tools. Google says users can upload an image to the Gemini app and ask whether it is AI-generated. A report on the feature notes that it only works for images made with Google's AI, so Gemini cannot say whether another platform made an image. A security-company guide adds that SynthID now also covers images made with ChatGPT through a partnership announced in 2026, so check current coverage before relying on it.

### Content Credentials (C2PA)
C2PA is a standard from the Coalition for Content Provenance and Authenticity. It attaches a signed record to a file that describes how it was created or edited. Popular Science reports it is supported by companies including OpenAI, Adobe and Google. You can inspect a credential with the official Content Credentials verify tool at contentcredentials.org/verify.

### Why a negative result proves little
Images made with open-source models often carry no watermark at all, according to one security writer. Metadata can also be lost: a blog guide notes that a screenshot removes a file's metadata, including Content Credentials. And a credential is provenance, not a truth certificate: you still need to judge whether the signer or source is trustworthy.

### A practical order of checks
1. Ask Gemini or use Google's SynthID Detector if you suspect Google-made AI.
2. Drop the file into the Content Credentials verify site and see if it carries a signed history.
3. Look for the platform's own AI label.
4. Run a reverse image search to find the earliest copy and the original source (see our reverse image search guide).
5. Only then look at the picture itself for odd details, and treat that as weak evidence.

### Sources
Digital Camera World, on Gemini and SynthID: https://www.digitalcameraworld.com/tech/artificial-intelligence/googles-ai-will-now-both-create-fake-images-and-help-detect-them-as-gemini-gains-the-ability-to-detect-some-ai-generated-images
Popular Science, "How to really spot AI-generated images, with Google's help": https://www.popsci.com/technology/how-to-spot-ai-generated-images/
Malwarebytes, "How to tell if an image is AI-generated": https://www.malwarebytes.com/blog/news/how-to-tell-if-an-image-is-ai-generated
Malwarebytes, SynthID coverage update (2026): https://www.malwarebytes.com/?p=433207
Memx, "How to Spot an AI-Generated Image in 2026": https://memx.app/blog/how-to-spot-ai-generated-image/
Alejandro Rioja, "How to Tell If an Image Is AI-Generated: 6 Checks": https://alejandrorioja.com/how-to-tell-if-an-image-is-ai-generated/
Macmyths, on Content Credentials as provenance, not proof: https://macmyths.com/how-to-check-whether-images-on-a-website-are-ai-generated/`,
    author,
    category: 'technology',
    tags: ['AI images', 'SynthID', 'Content Credentials', 'C2PA', 'deepfakes', 'fact-checking'],
    status: 'published',
    publishedAt: PUBLISHED,
    updatedAt: PUBLISHED,
    readingTimeMinutes: 4,
    isAiAssisted: true,
    seoMetadata: {
      seoTitle: 'How to Check if an Image Is AI-Generated: SynthID & Content Credentials',
      metaDescription: 'What SynthID and C2PA Content Credentials can and cannot tell you about an AI-generated image, plus a simple order of checks. Sourced guide.',
      focusKeyword: 'how to check if an image is AI generated',
      schemaType: 'HowTo',
    },
  },
  {
    id: 'art-b2-phishing',
    slug: 'how-to-spot-a-phishing-email-and-what-to-do-ftc-advice',
    type: 'guide',
    title: 'How to Spot a Phishing Email and What to Do Next (FTC Advice)',
    subtitle: 'The common warning signs, how to check a message safely, and where to report it.',
    content: `### The short answer
Phishing emails and texts pretend to be a company you know, like a bank or a utility, and try to get you to click a link or open an attachment. The US Federal Trade Commission says they often tell a story to trick you.

### Warning signs
Consumer guidance from the FTC, as summarised by a state consumer site, says phishing messages often claim the company noticed suspicious activity. Other signs listed in guides that quote the FTC include a generic greeting and incorrect email addresses or links, such as a misspelled company name. The Better Business Bureau adds that scare tactics, a sense of urgency and too-good-to-be-true rewards are common.

### How to check safely
Do not use the links or phone numbers in the message. CISA's advice, as quoted by one guide, is to go to the company's verified website to find contact details and then contact them through that channel.

### How to report it
The FTC says to forward phishing emails to the Anti-Phishing Working Group at reportphishing@apwg.org, report the attempt to the FTC at ReportFraud.ftc.gov, and then delete the message. For phishing text messages, forward them to SPAM (7726), according to a Vermont state consumer page citing the FTC.

### Why it matters
The BBB cites the FBI's 2025 Internet Crime Report as showing phishing and spoofing were the most reported internet crime in 2025. Those figures are US reports, so they show reported crime, not the whole picture.

### Limits
This guide gives US reporting steps. If you live elsewhere, report to your national consumer or cyber-security authority. If you already clicked or entered a password, change that password and contact the real company through its official site.

### Sources
FTC Consumer Alert, "Protect yourself from phishing scams" (2025): https://consumer.ftc.gov/consumer-alerts/2025/04/protect-yourself-phishing-scams
FTC Consumer Alert, "Phishing scams can be hard to spot" (2024): https://consumer.ftc.gov/consumer-alerts/2024/12/phishing-scams-can-be-hard-spot
Vermont consumer site summarising FTC tips and SPAM 7726: https://mymoney.vermont.gov/node/221
Better Business Bureau, "How to spot a scam email": https://www.bbb.org/scams/spot-a-scam/scam-emails
State of Surveillance, guide quoting FTC and CISA: https://stateofsurveillance.org/guides/basic/how-to-spot-a-phishing-email/`,
    author,
    category: 'technology',
    tags: ['phishing', 'scams', 'email security', 'FTC', 'online safety'],
    status: 'published',
    publishedAt: PUBLISHED,
    updatedAt: PUBLISHED,
    readingTimeMinutes: 3,
    isAiAssisted: true,
    seoMetadata: {
      seoTitle: 'How to Spot a Phishing Email and Report It (FTC Advice)',
      metaDescription: 'Warning signs of phishing emails and texts, how to check a message safely, and where to report it, based on FTC, CISA and BBB guidance.',
      focusKeyword: 'how to spot a phishing email',
      schemaType: 'HowTo',
    },
  },
];
