// Projects drawn from your public repositories. Descriptions summarize what the code does;
// no ranks or scores are claimed. Add results only once you can link to proof.
export interface Project {
  slug: string;
  title: string;
  context: string; // competition or purpose
  year: string;
  summary: string;
  approach: string[];
  stack: string[];
  repo: string;
  result: string | null; // verified outcome, with proof, or null
  featured: boolean;
}

export const projects: Project[] = [
  {
    slug: "aimo-progress-prize-3",
    title: "Tool-integrated reasoning for olympiad math",
    context: "AI Mathematical Olympiad — Progress Prize 3 (Kaggle)",
    year: "2026",
    summary:
      "An inference pipeline that has Qwen3-32B reason in thinking mode, write and run Python mid-solution, and vote across samples to settle on an answer — all inside a five-hour, single-GPU budget.",
    approach: [
      "Qwen3-32B in thinking mode with tool-integrated reasoning: the model writes code, a sandbox runs it, results feed back into the solve",
      "Majority voting across 8 samples per problem",
      "Adaptive time budget that moves unused time from easy problems to hard ones",
      "Answer extraction with three fallback levels",
    ],
    stack: ["Python", "PyTorch", "Transformers", "SymPy", "Qwen3-32B"],
    repo: "https://github.com/sysdx/kaggle_notebooks",
    result: null,
    featured: true,
  },
  {
    slug: "march-machine-learning-mania-2026",
    title: "NCAA tournament outcome forecasting",
    context: "March Machine Learning Mania 2026 (Kaggle)",
    year: "2026",
    summary:
      "Predicts win probabilities for every possible men's and women's tournament matchup, optimized for Brier score, from Elo ratings, team efficiency and Massey consensus rankings fed into XGBoost.",
    approach: [
      "Elo ratings computed from game history",
      "Team efficiency features from detailed box scores (men's 2003–2026, women's 2010–2026)",
      "Consensus of Massey ranking systems available before the tournament",
      "XGBoost trained on tournament games, evaluated on Brier score",
    ],
    stack: ["Python", "XGBoost", "pandas"],
    repo: "https://github.com/sysdx/kaggle_notebooks",
    result: null,
    featured: true,
  },
  {
    slug: "rna-3d-folding",
    title: "RNA 3D structure prediction by template search",
    context: "RNA 3D folding (Kaggle)",
    year: "2026",
    summary:
      "Template-based modeling: builds a k-mer index over PDB structures, aligns each target sequence against it, and assembles five candidate 3D structures per target from the best templates.",
    approach: [
      "Parses PDB/mmCIF files into a searchable structure database",
      "K-mer index for fast candidate template retrieval",
      "Sequence alignment to score and map templates onto targets",
      "Five predicted structures per target for submission",
    ],
    stack: ["Python", "Bioinformatics", "mmCIF parsing"],
    repo: "https://github.com/sysdx/kaggle_notebooks",
    result: null,
    featured: true,
  },
  {
    slug: "heart-disease-ensemble",
    title: "Heart disease prediction ensemble",
    context: "Kaggle tabular competition",
    year: "2026",
    summary:
      "A full tabular pipeline: EDA with chi-square tests, feature engineering and selection, tuned XGBoost, CatBoost and LightGBM models plus a neural network, combined into an ensemble.",
    approach: [
      "Target, numerical and categorical analysis with chi-square tests",
      "Feature engineering and selection",
      "Optuna hyperparameter search for XGBoost, CatBoost and LightGBM",
      "Neural network as an additional ensemble member",
    ],
    stack: ["Python", "XGBoost", "CatBoost", "LightGBM", "Optuna", "TensorFlow"],
    repo: "https://github.com/sysdx/kaggle_notebooks",
    result: null,
    featured: false,
  },
  {
    slug: "password-audit-tool",
    title: "Password breach checker",
    context: "Security practice",
    year: "2025",
    summary:
      "Checks whether a password appears in known data breaches without ever sending it: only the first five characters of its SHA-1 hash leave the machine (k-anonymity), plus a strength score.",
    approach: ["SHA-1 hashing with k-anonymity range lookups", "Strength scoring", "No full password or full hash is transmitted"],
    stack: ["Python"],
    repo: "https://github.com/sysdx/cybersecurity_practice_scripts",
    result: null,
    featured: false,
  },
  {
    slug: "eda-template",
    title: "EDA template for tabular problems",
    context: "Reusable tooling",
    year: "2026",
    summary:
      "A structured exploratory-analysis notebook and checklist run before every model: problem framing, leakage detection, distributions and early signal discovery.",
    approach: ["Problem framing checklist", "Data leakage detection", "Feature distribution analysis", "Early signal discovery"],
    stack: ["Python", "Jupyter"],
    repo: "https://github.com/sysdx/eda-template",
    result: null,
    featured: false,
  },
];

export const playbooks = [
  { title: "Feature engineering playbook", repo: "https://github.com/sysdx/feature-engineering-playbook", detail: "Numeric transforms, categorical encodings, time-based signals and interactions, each with its reasoning." },
  { title: "Unsupervised pattern discovery", repo: "https://github.com/sysdx/unsupervised-pattern-discovery", detail: "Clustering, dimensionality reduction and visualization, with a focus on interpretation." },
  { title: "Quant research", repo: "https://github.com/sysdx/quant-research", detail: "Monte Carlo, portfolio optimization, risk modeling, time series, options and market microstructure." },
  { title: "Probability & statistics", repo: "https://github.com/sysdx/probability-statistics", detail: "Probability theory, statistical inference, stochastic processes and simulation." },
  { title: "Mathematics", repo: "https://github.com/sysdx/mathematics", detail: "Algebra, calculus, linear algebra, discrete math, combinatorics, number theory and olympiad problems." },
];

// Last-known public repos, used when the GitHub API can't be reached.
export const fallbackRepos = [
  { name: "quant-journey", description: "Master dashboard for quantitative progression", pushedAt: "2026-09-08" },
  { name: "mathematics", description: "Mathematics progression", pushedAt: "2026-09-08" },
  { name: "probability-statistics", description: "Probability, inference and stochastic processes", pushedAt: "2026-09-08" },
  { name: "machine-learning", description: "Classical ML, deep learning, PyTorch and Kaggle", pushedAt: "2026-09-08" },
  { name: "quant-research", description: "Quantitative research projects", pushedAt: "2026-09-08" },
  { name: "ai-projects", description: "Tutors, research assistants and quant research tools", pushedAt: "2026-09-08" },
  { name: "portfolio", description: "Portfolio of projects and quantitative work", pushedAt: "2026-09-08" },
  { name: "competitive-programming", description: "Competitive programming practice", pushedAt: "2026-09-08" },
  { name: "kaggle_notebooks", description: "Kaggle competition notebooks", pushedAt: "2026-03-15" },
  { name: "eda-template", description: "EDA template for tabular ML problems", pushedAt: "2026-02-27" },
  { name: "unsupervised-pattern-discovery", description: "Structure in unlabeled data", pushedAt: "2026-01-21" },
  { name: "feature-engineering-playbook", description: "Repeatable feature engineering strategies", pushedAt: "2026-01-21" },
  { name: "cybersecurity_practice_scripts", description: "Security practice scripts", pushedAt: "2025-12-30" },
  { name: "ml-projects", description: "Machine learning walkthroughs", pushedAt: "2025-12-16" },
];
