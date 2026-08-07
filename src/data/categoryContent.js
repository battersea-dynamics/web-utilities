// Prose for the category hub pages.
//
// Why this file exists: the hubs used to be an H1, a one-line blurb and a
// grid of cards — 47 to 186 words of body text. That is a page with nothing
// on it to judge, for a reader or a crawler. Each category now explains what
// it covers, who it's for, and which tool to pick.
//
// Why the prose lives here and not in tools.json: tools.json is structural
// data that several pages derive from, and multi-paragraph text inside JSON
// is miserable to edit. This keeps the source of truth for *structure* in
// one place and the source of truth for *words* in another.
//
// The `choosing` entries are deliberately not padding. Each one links to a
// real tool, so the section doubles as internal linking and genuinely helps
// someone who doesn't yet know which page they want.
//
// Every slug referenced here is checked against tools.json by the test
// suite, so a renamed or unpublished tool fails the build rather than
// quietly producing a dead link.

export const categoryContent = {
  finance: {
    intro: [
      `These are the money calculations that decide something — what a mortgage
       actually costs once fees are counted, what lands in your account after
       tax, what a house purchase adds up to before you commit. Each one shows
       the figures behind the answer rather than just the answer, because a
       number you can't check is a number you can't argue with.`,
      `The tax bands, thresholds and reliefs behind these tools come from HMRC,
       Revenue Scotland and the Welsh Revenue Authority, and each calculator
       links to the source it uses. Rates change, usually in April, so the
       verification date is published alongside the figures.`,
    ],
    choosing: [
      { when: 'Work out the monthly payment on one mortgage', slug: 'mortgage-calculator' },
      { when: 'Decide between two or three deals, fees included', slug: 'mortgage-comparison-calculator' },
      { when: 'See what paying extra each month would save you', slug: 'mortgage-overpayment-calculator' },
      { when: 'Find the stamp duty on a purchase, anywhere in the UK', slug: 'stamp-duty-calculator' },
      { when: 'Turn a salary into actual take-home pay', slug: 'take-home-pay-calculator' },
      { when: 'Project how savings or investments grow over time', slug: 'compound-interest-calculator' },
    ],
    note: `These calculators are for working things out, not for advice. For
           anything you're relying on — a mortgage offer, a tax position — check
           the figure against the lender or the official source before acting on it.`,
    // Rendered as a linked call-out, separate from the disclaimer above — a
    // note about liability is the wrong place to advertise. The finance hub is
    // the best spot on the site for this: brokers, conveyancers and
    // accountants land here, and they are exactly who embeds a calculator.
    offer: {
      lead: 'Run a website?',
      text: 'Put any of these calculators on it, free — one line of HTML, no sign-up, and it updates itself when tax rates change.',
      href: '/embed',
      cta: 'See how',
    },
  },

  health: {
    intro: [
      `Health numbers are often quoted in whichever unit the person quoting them
       happens to use, which is how you end up with a reading in mmol/L and a
       target in mg/dL. These tools convert between the common measures and
       explain what the result actually describes.`,
      `Each one shows the formula it applies and where the thresholds come from,
       so you can see whether a figure is a firm clinical boundary or a rough
       population guide. Several of them are the latter, and the pages say so.`,
    ],
    choosing: [
      { when: 'Work out BMI and see where it sits on the standard scale', slug: 'bmi-calculator' },
      { when: 'Convert blood sugar between mmol/L, mg/dL and HbA1c units', slug: 'blood-sugar-converter' },
    ],
    note: `Nothing here is medical advice or a diagnosis. These are reference
           conversions and general population measures — a doctor interpreting your
           results has context that a calculator does not.`,
  },

  text: {
    intro: [
      `Two kinds of tool live here. Some are for word games — feed in a rack of
       letters and get back every word you can make from them, with definitions
       a click away. The rest are the small text jobs that come up constantly
       and that no one wants to open a text editor for: counting words, fixing
       capitalisation, stripping duplicate lines, comparing two versions.`,
      `Everything runs in your browser as you type. Nothing is uploaded, so
       pasting in a draft, a client list or anything else you'd rather not send
       to a server is fine.`,
    ],
    choosing: [
      { when: 'Find every word hidden in a set of letters', slug: 'word-unscrambler' },
      { when: 'Find words that use all your letters exactly', slug: 'anagram-solver' },
      { when: 'Search for words by prefix, suffix, or length', slug: 'words-starting-with' },
      { when: 'Find the highest-scoring play from your Scrabble tiles', slug: 'scrabble-word-finder' },
      { when: 'Find the best Words With Friends play, scored', slug: 'words-with-friends-word-finder' },
      { when: 'Count words, characters and reading time', slug: 'word-counter' },
      { when: 'Switch text between upper, lower, title and sentence case', slug: 'case-converter' },
      { when: 'See exactly what changed between two versions', slug: 'text-diff-checker' },
      { when: 'Strip repeated lines out of a list', slug: 'duplicate-line-remover' },
      { when: 'Clean up doubled spaces and stray whitespace', slug: 'remove-extra-spaces' },
      { when: 'Generate placeholder text for a layout', slug: 'lorem-ipsum-generator' },
      { when: 'Reverse text, or the order of its words', slug: 'text-reverser' },
    ],
  },

  developer: {
    intro: [
      `The reference conversions you need three times a week and never remember
       the syntax for. Decode a token to see what's inside it, hash a string to
       check it matches, tidy a wall of JSON into something you can read, work
       out what a Unix timestamp means in human time.`,
      `All of it runs locally in the browser. That matters more here than
       elsewhere on the site: pasting a real token, an API response or a
       customer record into a website that processes it server-side is a
       genuine risk, and a habit worth not forming. Nothing you paste here
       leaves the machine.`,
    ],
    choosing: [
      { when: 'Generate MD5, SHA-1, SHA-256 or SHA-512 hashes', slug: 'hash-generator' },
      { when: 'Create random UUIDs', slug: 'uuid-generator' },
      { when: 'Encode or decode Base64, including UTF-8 text', slug: 'base64-encoder' },
      { when: 'Percent-encode a URL or query string', slug: 'url-encoder' },
      { when: 'Format, indent and validate JSON', slug: 'json-formatter' },
      { when: 'Convert Unix timestamps to dates and back', slug: 'timestamp-converter' },
      { when: 'Convert between binary, octal, decimal and hex', slug: 'number-base-converter' },
    ],
  },

  pdf: {
    intro: [
      `Merge, split, rotate, reorder, number, watermark — the PDF jobs that
       shouldn't require installing anything or creating an account, and
       certainly shouldn't require handing your document to a stranger.`,
      `That last part is the whole point of these tools. Every operation here
       happens inside your browser using your own computer's processing. Your
       file is never uploaded, never sits on someone else's disk, and never
       needs deleting afterwards, because it was never anywhere else. Most
       online PDF services work the opposite way: you upload, they process,
       they promise to delete it later. For a contract, a payslip or a medical
       letter, that difference is worth caring about.`,
    ],
    choosing: [
      { when: 'Join several PDFs into one file', slug: 'merge-pdf' },
      { when: 'Break one PDF into separate files', slug: 'split-pdf' },
      { when: 'Remove pages you don’t want', slug: 'delete-pdf-pages' },
      { when: 'Fix pages that scanned in sideways', slug: 'rotate-pdf' },
      { when: 'Put pages back in the right order', slug: 'reorder-pdf-pages' },
      { when: 'Turn photos or scans into a single PDF', slug: 'images-to-pdf' },
      { when: 'Add page numbers to a finished document', slug: 'add-page-numbers' },
      { when: 'Stamp a document as draft or confidential', slug: 'watermark-pdf' },
    ],
    note: `Because everything runs locally, very large files are limited by your
           own device's memory rather than an upload cap. On a phone, a few hundred
           pages is a realistic ceiling.`,
  },
};

export const contentFor = (slug) => categoryContent[slug] || null;
