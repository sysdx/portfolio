// Everything the public site says about you. Edit freely: nothing here is generated.
export const site = {
  name: "Michael Ayers",
  handle: "sysdx",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  role: "ML, quantitative research and competitive programming",
  summary:
    "I build machine-learning pipelines for Kaggle competitions, study the mathematics underneath them, and keep every result in public repositories.",
  about: [
    "My work sits where mathematics, statistics and code meet. I study the foundations — algebra, calculus, linear algebra, probability and statistical inference — and put them to work in Kaggle competitions and quantitative research.",
    "I keep a public record of that progression on GitHub, from exploratory analysis templates to full competition pipelines. Results appear on this site only after they're verified.",
  ],
  focus: [
    { area: "Machine learning", detail: "Tabular modeling, gradient-boosted ensembles, LLM reasoning pipelines" },
    { area: "Quantitative research", detail: "Monte Carlo methods, portfolio optimization, time series, risk" },
    { area: "Mathematics", detail: "Algebra through number theory and olympiad problems" },
    { area: "Probability & statistics", detail: "Probability theory, inference, stochastic processes" },
    { area: "Competitive programming", detail: "Codeforces and AtCoder practice, solved independently" },
  ],
  // Shown with a pulsing dot in the footer. Set to "" to hide it.
  availability: "Open to competition team-ups and collaborations",
  // Words cycled in the hero: "An ML {word} with the work shown."
  roles: ["researcher", "builder", "competitor", "student"],
  links: {
    github: "https://github.com/sysdx",
    kaggle: "", // add your Kaggle profile URL
    linkedin: "", // add your LinkedIn URL
    email: "", // optional; leave empty to rely on the contact form
  },
};
