import type { EditorialArticle, EditorialAuthor } from './types.ts';

/**
 * Batch 1: original explainers written from primary sources.
 * Rules for this batch: every factual claim is tied to a linked source in the "Sources" list,
 * no invented numbers, no invented quotes, and the AI-assisted flag is set honestly.
 */
const author: EditorialAuthor = {
  id: 'author-factinfolive',
  name: 'FactInfoLive',
  role: 'Editorial team (AI-assisted, human-reviewed)',
  bio: 'Articles are researched from linked sources with AI assistance and reviewed by a person before publishing.',
};

const PUBLISHED = '2026-11-11T09:00:00.000Z';

export const BATCH_1_ARTICLES: EditorialArticle[] = [
  {
    id: 'art-b1-mcp-explained',
    slug: 'what-is-model-context-protocol-mcp-explained',
    type: 'explainer',
    title: 'What Is the Model Context Protocol (MCP)? A Plain-Language Explainer',
    subtitle: 'The open standard that lets AI assistants connect to your files, apps and tools, and why people compare it to a universal plug.',
    content: `### The short answer
The Model Context Protocol, usually shortened to MCP, is an open standard for connecting AI assistants to the systems where data and tools live, such as document stores, business apps and developer environments. Anthropic announced and open-sourced it on 25 November 2024.

### The problem it solves
Before a shared standard, every connection between an AI model and an outside system needed its own custom code. If you have several AI apps and several tools, the number of one-off connections multiplies. Anthropic's announcement describes MCP as a single protocol that replaces these fragmented integrations, so developers build against one standard instead of a separate connector for each data source.

### How it works, in simple terms
MCP uses a client-server design. An MCP server exposes some data or abilities, for example access to a folder, a database or a messaging app. An MCP client is the AI application that connects to those servers. Because both sides follow the same rules, a server built once can work with any compatible client.

According to the project's overview, servers can offer three kinds of things: tools (actions the model can request, with clearly defined inputs), resources (data the model can read) and prompts (reusable templates).

### What shipped at launch
Anthropic's launch post listed three parts: the specification with software development kits, support for local MCP servers in the Claude Desktop apps, and an open-source repository of example servers. Pre-built servers were announced for systems such as Google Drive, Slack, GitHub, Git, Postgres and Puppeteer.

### Who created it, and who uses it now
Anthropic says MCP was created by David Soria Parra and Justin Spahr-Summers. According to the Wikipedia article on MCP, OpenAI adopted the standard in March 2025, and in December 2025 Anthropic donated it to the Agentic AI Foundation, a fund under the Linux Foundation co-founded by Anthropic, Block and OpenAI. These later points come from a secondary source, so check the project's own site for the latest status.

### Why it matters to normal users
You do not need to write code to benefit. When an AI app says it can "connect" to your calendar, files or notes, an MCP server is often what sits between them. The practical questions to ask are the same as for any app: what data can it see, can it change things, and who made the server. Only connect tools you trust.

### Limits and honest caveats
MCP is a way to connect things, not a guarantee of safety or accuracy. A connected AI can still make mistakes, and giving it write access means mistakes can have real effects. Treat each connection like a permission you are granting.

### Sources
Anthropic, "Introducing the Model Context Protocol" (25 Nov 2024): https://www.anthropic.com/news/model-context-protocol
Wikipedia, "Model Context Protocol": https://en.wikipedia.org/wiki/Model_Context_Protocol
Model Context Protocol official site: https://modelcontextprotocol.io`,
    author,
    category: 'technology',
    tags: ['MCP', 'Model Context Protocol', 'AI tools', 'Anthropic', 'AI explained'],
    status: 'published',
    publishedAt: PUBLISHED,
    updatedAt: PUBLISHED,
    readingTimeMinutes: 4,
    isAiAssisted: true,
    seoMetadata: {
      seoTitle: 'What Is the Model Context Protocol (MCP)? Plain-Language Explainer',
      metaDescription: 'MCP is an open standard, introduced by Anthropic in November 2024, for connecting AI assistants to data and tools. Here is how it works, in simple terms, with sources.',
      focusKeyword: 'what is MCP model context protocol',
      schemaType: 'TechArticle',
    },
  },
  {
    id: 'art-b1-reverse-image-search',
    slug: 'how-to-reverse-image-search-check-if-photo-is-real',
    type: 'guide',
    title: 'How to Reverse Image Search: Check Where a Photo Really Came From',
    subtitle: 'A step-by-step guide using Google Lens, TinEye and Google\'s "About this image" to spot old, reused or misleading pictures.',
    content: `### Why this works
A viral photo is often real but old, or real but from another place. Reverse image search starts with a picture instead of words and shows where else that picture appears online, which helps you find its earlier appearances and original context. It cannot prove a picture is true on its own, but it quickly catches many recycled images.

### Step 1: Search with Google
On a phone, open the Google app or Chrome and tap the Google Lens icon in the search bar, then choose or take a photo. For an image on a web page, touch and hold it and choose the option to search the image with Google Lens. On a desktop computer in Chrome, right-click the image and choose the Google Lens search option. Google notes that in Chrome this option appears when Google is your default search engine.

### Step 2: Cross-check with a second engine
Different engines index different pages. TinEye is a dedicated reverse image search engine focused on finding matches of the same image, and it is reported to be free for non-commercial use (check its help pages for current terms). Bing and Yandex also offer image search. If one tool finds nothing, try another before drawing any conclusion.

### Step 3: Use "About this image"
Google says its "About this image" tool can show an image's history, including when it or similar images may have first been seen by Search, how other sites use and describe it (including news and fact-checking sites), and metadata where available. You can reach it from the three dots next to an image in Google Images results.

### Step 4: Look for the earliest and the most reliable source
Open the results and compare dates, captions and credits. Look for the earliest appearance, and for results from news agencies or fact-checking organisations. If the same photo appears years earlier than the claim being made, the claim is probably misleading. Do not trust a screenshot timestamp by itself, because it is easy to fake.

### Step 5: Check whether someone has already fact-checked it
Google's Fact Check Explorer lets you search for claims that independent fact-checking organisations have already reviewed, and Google has said it can now also help find fact checks about an image. The results come from fact-checking publishers, not from Google.

### Step 6: Be honest about the limits
No result does not mean fake. A brand-new photo may have no earlier copies. Cropping, filters and mirroring can hide a match, so try cropping to a key detail. Reverse image search also says nothing about whether an image was edited or generated by AI, so combine it with other checks such as the place, the weather and independent reports.

### A quick checklist
- Search the image in at least two engines.
- Find the earliest date it appears.
- Check who published it first and whether it has a credit.
- Search Fact Check Explorer for the claim.
- Look for independent reports of the same event.

### Sources
Google blog, "4 ways to use Search to check facts, images and sources online" (2 Apr 2024): https://blog.google/products-and-platforms/products/search/google-search-fact-checking-resources/
Google blog, "Check the facts with these Google features": https://blog.google/products/news/fact-checking-tips/
Tactical Tech / Data Detox Kit, "Verify a Photo's Origins": https://datadetoxkit.org/en/misinformation/reversesearch/
Snopes, "A Guide To Performing Reverse Image Searches": https://www.snopes.com/articles/400681/how-to-perform-reverse-image-searches/
TinEye: https://tineye.com`,
    author,
    category: 'fact-checks',
    tags: ['Reverse image search', 'Fact-checking', 'Media literacy', 'Google Lens', 'TinEye'],
    status: 'published',
    publishedAt: PUBLISHED,
    updatedAt: PUBLISHED,
    readingTimeMinutes: 5,
    isAiAssisted: true,
    guideTemplate: {
      templateType: 'how-to',
      difficulty: 'beginner',
      estimatedMinutes: 5,
      prerequisites: ['A phone or computer with a web browser', 'The photo or its web address'],
    },
    seoMetadata: {
      seoTitle: 'How to Reverse Image Search: Check If a Photo Is Real or Reused',
      metaDescription: 'Step-by-step: use Google Lens, TinEye and Google\'s About this image to find where a photo first appeared and spot misleading, reused pictures.',
      focusKeyword: 'how to reverse image search',
      schemaType: 'BlogPosting',
    },
  },
  {
    id: 'art-b1-how-to-judge-fact-checkers',
    slug: 'how-to-tell-if-a-fact-checker-is-trustworthy-ifcn-principles',
    type: 'guide',
    title: 'How to Tell If a Fact-Checker Is Trustworthy: The IFCN Code of Principles',
    subtitle: 'Five public commitments you can use to judge any fact-checking site, including ours.',
    content: `### Why this matters
Anyone can put "fact check" on a web page. A useful test is whether the organisation follows public standards that others can inspect. The best-known standard is the Code of Principles of the International Fact-Checking Network (IFCN), run at the Poynter Institute.

### The five commitments
The code consists of five commitments that fact-checking organisations must follow to become verified signatories:
1. Nonpartisanship and fairness: the same standard is applied to every claim, whoever made it.
2. Transparency of sources: sources are shown so readers can check the evidence themselves.
3. Transparency of funding and organisation: who pays for the work and who runs it is public.
4. Transparency of methodology: how claims are chosen, researched and rated is explained.
5. Open and honest corrections: mistakes are corrected publicly under a clear policy.

Poynter describes three of these as being about transparency (funding, methodology and sources), one about nonpartisanship and fairness, and one about honest corrections.

### How to check an organisation
- Look for the IFCN badge, then confirm the organisation is on the official list of verified signatories on the Code of Principles website. A badge alone is not proof, because the IFCN states that any organisation holding the badge that is not on its list is not a signatory.
- Read the "About" and "Methodology" pages. Do they explain how claims are rated?
- Check that articles link to their evidence.
- Find the corrections policy and look for real corrections.
- See who funds the organisation.

### Use fact checks without blind trust
Google's Fact Check Explorer collects fact checks from many publishers, and you can search it for a claim. Its results come from the fact-checkers, so you should still judge each source. For claims that affect health, money or elections, compare more than one fact-check.

### Where FactInfoLive stands
FactInfoLive is a new independent site and is not an IFCN signatory. We link the sources used in our articles so you can verify them yourself, and we label AI-assisted articles. If you find a mistake, tell us and we will correct it.

### Sources
IFCN Code of Principles, "The commitments": https://ifcncodeofprinciples.poynter.org/the-commitments
Poynter, on the updated Code of Principles: https://poynter.org/?p=706408
Google blog, "4 ways to use Search to check facts, images and sources online": https://blog.google/products-and-platforms/products/search/google-search-fact-checking-resources/
Android Police, guide to Google Fact Check Explorer: https://www.androidpolice.com/google-fact-check-explorer-guide/`,
    author,
    category: 'fact-checks',
    tags: ['IFCN', 'Fact-checking', 'Media literacy', 'Misinformation'],
    status: 'published',
    publishedAt: PUBLISHED,
    updatedAt: PUBLISHED,
    readingTimeMinutes: 4,
    isAiAssisted: true,
    guideTemplate: {
      templateType: 'checklist',
      difficulty: 'beginner',
      estimatedMinutes: 5,
      checklistItems: [
        { id: 'ifcn-1', category: 'Standards', text: 'Confirm the organisation is on the official IFCN verified-signatory list, not just showing a badge.', critical: true },
        { id: 'ifcn-2', category: 'Transparency', text: 'Find the methodology page and read how claims are rated.', critical: true },
        { id: 'ifcn-3', category: 'Evidence', text: 'Check that the article links to its sources.', critical: true },
        { id: 'ifcn-4', category: 'Accountability', text: 'Find the corrections policy and look for real published corrections.', critical: false },
        { id: 'ifcn-5', category: 'Funding', text: 'See who funds and runs the organisation.', critical: false },
      ],
    },
    seoMetadata: {
      seoTitle: 'How to Tell If a Fact-Checker Is Trustworthy (IFCN Code of Principles)',
      metaDescription: 'The IFCN Code of Principles has five public commitments. Use them to judge whether any fact-checking website is trustworthy.',
      focusKeyword: 'is a fact checker trustworthy IFCN',
      schemaType: 'BlogPosting',
    },
  },
];
