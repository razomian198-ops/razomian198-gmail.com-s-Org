import type { EditorialArticle, EditorialAuthor } from './types.ts';

/**
 * Batch 3: sourced explainers (AI security, AI-text detectors, fact-check search).
 * Same rules as batches 1 and 2: every factual claim is tied to a linked source in the
 * "Sources" list, no invented numbers or quotes, and the AI-assisted flag is set honestly.
 */
const author: EditorialAuthor = {
  id: 'author-factinfolive',
  name: 'FactInfoLive',
  role: 'Editorial team (AI-assisted, human-reviewed)',
  bio: 'Articles are researched from linked sources with AI assistance and reviewed by a person before publishing.',
};

const PUBLISHED = '2026-11-12T09:00:00.000Z';

export const BATCH_3_ARTICLES: EditorialArticle[] = [
  {
    id: 'art-b3-prompt-injection',
    slug: 'what-is-prompt-injection-ai-security-explained',
    type: 'explainer',
    title: 'What Is Prompt Injection? How AI Assistants Can Be Tricked, and Why It Is Hard to Fix',
    subtitle: 'A plain-language look at the attack OWASP lists as LLM01 in its 2025 risk list, with what the UK NCSC and OWASP say about defending against it.',
    content: `### The short answer
Prompt injection is a way of getting an AI language model to do something its builders did not intend by putting instructions into the text it reads. OWASP, the security community behind the Gen AI Security Project, defines a prompt injection vulnerability as one that "occurs when user prompts alter the LLM's behavior or output in unintended ways." It also notes that these inputs do not need to be visible or readable by a human.

### Where the name comes from
In a post dated 12 September 2022, the developer Simon Willison described how people were getting GPT-3 to ignore its earlier directions by typing new ones into the input. He wrote that this was not just an academic trick but a form of security exploit, and proposed the name "prompt injection." He explained the cause as prompts being built by concatenating strings, so the developer's instructions and the user's text end up in one block.

### Direct and indirect injection
OWASP separates two forms. In direct injection, a user's own input changes how the model behaves, whether on purpose or by accident. In indirect injection, the model accepts input from external sources such as websites or files, and that content carries instructions that change its behavior.

The UK National Cyber Security Centre (NCSC) gives an everyday example of the indirect kind: a recruiter's AI tool processes a CV that contains hidden instructions. The attacker never touches the AI system directly; they only write something that ends up being processed. The NCSC says this is commonly called indirect prompt injection.

### Why it is not like SQL injection
Many people compare it to SQL injection, an older attack on databases. An NCSC blog post from December 2025 argues the comparison can mislead. SQL injection can be properly mitigated with parameterised queries, which keep commands and data apart. The NCSC says current language models "simply do not enforce a security boundary between instructions and data inside a prompt."

Willison made a similar point in 2022 when he wished he could call the model with two separate parameters, one for instructions and one for data. In a 13 April 2023 update to his post he wrote that this fix looks extremely difficult, if not impossible, on the current architecture of large language models.

### What defenders are advised to do
OWASP's page lists several mitigation measures, including constraining model behavior, filtering inputs and outputs, enforcing least-privilege access, requiring human approval for high-risk actions, and separating external content from trusted instructions. It also recommends adversarial testing.

The NCSC stresses design that does not rely on the model behaving: using deterministic, non-LLM safeguards that limit what the system can do, plus monitoring and logging. It says "make it harder" tricks, such as marking data sections or wrapping external content in tags, can help but should not be treated as a guarantee. It specifically warns against trying to block phrases like "ignore previous instructions."

### Can it be fully prevented?
Both sources are cautious. OWASP says that, given the way models work, it is unclear whether fool-proof prevention methods exist, and that its measures can mitigate the impact. The NCSC says prompt injection will remain a residual risk that cannot be fully mitigated with a product or appliance, and that it may never be totally mitigated.

### What this means for ordinary users
This section is our own plain reading of the sources, not additional research. If an AI tool can read web pages, emails or files for you, then text in those places may influence it. The risk grows with what the tool is allowed to do. A tool that can only summarise has less to lose than one that can send messages or change files. The measures OWASP lists, such as approval before high-risk actions, apply to users as well as developers: be wary of granting broad permissions, and check actions before they are carried out.

### Limits of this article
This is a summary of public guidance, not a security audit, and the field changes quickly. We did not test any product. Developers building AI features should read the OWASP and NCSC pages in full.

### Sources
OWASP Gen AI Security Project, "LLM01:2025 Prompt Injection": https://genai.owasp.org/llmrisk/llm01-prompt-injection/
UK National Cyber Security Centre, Dave Chismon, "Prompt injection is not SQL injection (it may be worse)" (8 Dec 2025): https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection
Simon Willison, "Prompt injection attacks against GPT-3" (12 Sep 2022, updated 2023): https://simonwillison.net/2022/Sep/12/prompt-injection/`,
    author,
    category: 'technology',
    tags: ['prompt injection', 'AI security', 'OWASP', 'NCSC', 'AI tools', 'AI explained'],
    status: 'published',
    publishedAt: PUBLISHED,
    updatedAt: PUBLISHED,
    readingTimeMinutes: 4,
    isAiAssisted: true,
    seoMetadata: {
      seoTitle: 'What Is Prompt Injection? AI Security Explained With Sources',
      metaDescription: 'What prompt injection is, the difference between direct and indirect attacks, and what OWASP and the UK NCSC say about defending against it. Sourced explainer.',
      focusKeyword: 'what is prompt injection',
      schemaType: 'TechArticle',
    },
  },
  {
    id: 'art-b3-ai-detectors',
    slug: 'do-ai-text-detectors-work-what-openai-and-researchers-say',
    type: 'explainer',
    title: 'Do AI Text Detectors Work? What OpenAI and Researchers Have Said',
    subtitle: 'OpenAI withdrew its own detector for low accuracy, and a published study reported that detectors can wrongly flag non-native English writing.',
    content: `### The short answer
Based on the sources below, AI-text detectors should not be treated as proof. OpenAI withdrew its own detector in 2023 because of a low rate of accuracy, and a peer-reviewed-journal study reported that such tools can misjudge writing by non-native English speakers. This article summarises those sources; it is not a test of any current detector.

### What OpenAI's detector did
On 31 January 2023, OpenAI published a post introducing an "AI classifier" meant to indicate AI-written text. In its own evaluation on a "challenge set" of English texts, OpenAI reported that the classifier correctly identified 26% of AI-written text as "likely AI-written," while labelling human-written text as AI-written 9% of the time. The post also listed limits: it was very unreliable on texts under 1,000 characters, it was recommended for English only, and OpenAI said it should not be used as a primary decision-making tool.

### Why it was withdrawn
A note added at the top of the same page says that as of 20 July 2023 the classifier was no longer available due to its low rate of accuracy. It adds that OpenAI was researching more effective provenance techniques for text. TechCrunch reported the shutdown on 25 July 2023 and said the author had asked OpenAI about the timing and reasoning; the article does not report a reply.

### What OpenAI says now
OpenAI's help-centre page for educators asks "Do AI detectors work?" and begins its answer with "In short, no, not in our experience." It says OpenAI found its own detector labelled human-written text, including the Declaration of Independence and Shakespeare, as AI-generated. It also says there were indications that detection could disproportionately affect students who were learning English as a second language, and that students can make small edits to evade detection. The page is marked as updated over a year ago, so check it for newer wording.

### The bias study
A paper by Weixin Liang, Mert Yuksekgonul, Yining Mao, Eric Wu and James Zou, first submitted to arXiv in April 2023 and later published in the journal Patterns, examined several GPT detectors. The abstract states that the detectors consistently misclassified non-native English writing samples as AI-generated, while native samples were accurately identified. It also says simple prompting strategies could mitigate this bias and effectively bypass the detectors, and it calls for caution in using detectors in evaluative or educational settings.

### What the sources do not tell us
The sources here are a few documents, not a full survey of the field. Other researchers or vendors may report different results, and we have not tried to review them. Readers who need a firm answer for a policy decision should look for recent independent evaluations.

These findings are from 2023, and detection tools have changed since. We did not find or test current commercial detectors for this article, so we cannot say how any specific product performs today. The OpenAI numbers describe one tool on one test set, not detectors in general. TechCrunch also recorded its own small test, in which one detector identified five of seven generated snippets correctly and OpenAI's classifier only one; seven snippets is too few to draw broad conclusions from.

### A cautious way to use a detector result
This section is our own reasoning from the sources, not a finding. If a detector flags a piece of writing, treat the result as one weak signal, not a verdict. OpenAI's educator page suggests other approaches, such as asking students to share their ChatGPT conversations and building information and AI literacy and accountability. Talking to the writer, looking at drafts and version history, and checking whether the claims and citations hold up are more informative than a percentage score. Be especially careful before accusing anyone, given the reported risk for non-native English writers.

### Sources
OpenAI, "New AI classifier for indicating AI-written text" (31 Jan 2023, updated 20 Jul 2023): https://openai.com/index/new-ai-classifier-for-indicating-ai-written-text/
TechCrunch, Devin Coldewey, "OpenAI scuttles AI-written text detector over 'low rate of accuracy'" (25 Jul 2023): https://techcrunch.com/2023/07/25/openai-scuttles-ai-written-text-detector-over-low-rate-of-accuracy/
Liang et al., "GPT detectors are biased against non-native English writers" (arXiv, 2023): https://arxiv.org/abs/2304.02819
OpenAI Help Center, "How can educators respond to students presenting AI-generated content as their own?": https://help.openai.com/en/articles/8313351-how-can-educators-respond-to-students-presenting-ai-generated-content-as-their-own`,
    author,
    category: 'technology',
    tags: ['AI detectors', 'AI-generated text', 'OpenAI', 'education', 'AI literacy', 'AI explained'],
    status: 'published',
    publishedAt: PUBLISHED,
    updatedAt: PUBLISHED,
    readingTimeMinutes: 4,
    isAiAssisted: true,
    seoMetadata: {
      seoTitle: 'Do AI Text Detectors Work? What OpenAI and Researchers Say',
      metaDescription: 'OpenAI withdrew its AI text classifier over low accuracy, and researchers found detectors can misjudge non-native English writing. A sourced summary with limits.',
      focusKeyword: 'do AI detectors work',
      schemaType: 'TechArticle',
    },
  },
  {
    id: 'art-b3-fact-check-explorer',
    slug: 'how-to-use-google-fact-check-explorer-to-check-a-claim',
    type: 'guide',
    title: 'How to Use Google Fact Check Explorer to See if a Claim Was Already Checked',
    subtitle: 'A step-by-step guide to the free search tool for published fact checks, and the limits you should know before relying on it.',
    content: `### The short answer
Google Fact Check Explorer is a search tool for fact checks that other organisations have already published. The Google News Initiative describes it as "a search engine for fact checks." It does not check claims itself. If a claim has not been fact-checked by a participating publisher, the tool will have nothing to show.

### What it searches
According to the Google News Initiative, the tools let you search for stories and images that have already been debunked. Gizmodo's guide explains that the Explorer draws on the fact-check markup that Google makes available to publishers, and that the fact checks are not carried out or verified by Google; Google indexes them. That is a secondary description, so check the Google page above for the official wording.

### Step by step
Following the Google News Initiative's lesson:

1. Go to toolbox.google.com/factcheck/explorer.
2. Type a keyword to see the latest fact checks tagged with it, or, according to Google's lesson, upload an image to see whether it has been fact-checked before. Gizmodo's article describes image search as still being in the pipeline, so this feature may differ by when and where you use it.
3. Results are listed by recency and show the publishing organisation and its rating, such as "false" or "incorrect."
4. Click the link to read the full fact check. Read it rather than relying on the rating label alone.
5. To see all topics, click "Recent fact checks." To search one publisher, Google says to use the site: modifier with its URL plus a keyword.

### Who gets listed
Google's developer documentation says publishers mark up their articles with ClaimReview structured data. Its eligibility guidelines include having several pages marked up, a clear corrections policy or way for users to report errors, and analysis that is traceable and transparent about sources and methods with references to primary sources. Political entities such as campaigns, parties and elected officials are not eligible, and the claim must come from an origin separate from the site. Gizmodo summarises the effect: you cannot run a check on any claim you like, because it must have been published by a source Google accepts and picked up.

### One recent change to know about
The same developer page says Google is phasing out support for ClaimReview markup in Google Search, though the markup remains supported by the Fact Check Explorer. We did not find details of what this means in practice, so the situation may change.

### Limits and how to work around them
Gizmodo notes results tend to appear for claims that are contentious, disputed and widely circulated, so a new or local rumour may return nothing. An empty result does not mean a claim is true; it only means no indexed fact check was found. Ratings also come from different publishers with their own scales (Google's documentation shows an example scale from "False" to "True" but publishers may use their own wording).

If the Explorer returns nothing, try different wording of the claim, search for the source of the image or quote, and use other verification methods such as lateral reading, which we cover in a separate guide. Compare more than one fact check when you can, and look at the date of each, since facts can change.

### What this guide does not cover
We did not test the tool ourselves for this article; the steps are taken from Google's lesson and a news-site guide. Interface details can change. The official toolbox "about" page we tried to read contained little text, so we did not rely on it.

### Sources
Google News Initiative, "Google Fact Check Tools": https://newsinitiative.withgoogle.com/resources/lessons/google-fact-check-tools/
Google Search Central, "Fact Check (ClaimReview) structured data": https://developers.google.com/search/docs/appearance/structured-data/factcheck
Gizmodo, "How to Use Google's Fact Check Explorer to Verify Claims on the Web": https://gizmodo.com/how-to-use-googles-fact-check-to-verify-claims-1851166049`,
    author,
    category: 'technology',
    tags: ['fact checking', 'Google Fact Check Explorer', 'ClaimReview', 'media literacy', 'verification'],
    status: 'published',
    publishedAt: PUBLISHED,
    updatedAt: PUBLISHED,
    readingTimeMinutes: 4,
    isAiAssisted: true,
    seoMetadata: {
      seoTitle: 'How to Use Google Fact Check Explorer: Step-by-Step Guide and Limits',
      metaDescription: 'How to search for already-published fact checks with Google Fact Check Explorer, who gets listed, and what an empty result does and does not mean. Sourced guide.',
      focusKeyword: 'google fact check explorer',
      schemaType: 'TechArticle',
    },
  },
];
