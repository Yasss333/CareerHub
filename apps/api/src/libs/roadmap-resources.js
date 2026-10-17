const makeResource = (title, url, source, description, extra = {}) => ({
  title,
  url,
  source,
  description,
  free: true,
  ...extra
})

const catalog = [
  {
    match: ['html', 'css', 'responsive design', 'accessibility', 'web fundamentals'],
    articles: [
      makeResource('Learn web development', 'https://developer.mozilla.org/en-US/docs/Learn_web_development', 'MDN', 'Free, guided HTML, CSS, and JavaScript lessons.'),
      makeResource('Learn CSS', 'https://web.dev/learn/css/', 'web.dev', 'A free, visual course covering modern CSS.')
    ],
    courses: [
      makeResource('Responsive Web Design', 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', 'freeCodeCamp', 'Free, project-based certification course.', { platform: 'freeCodeCamp' })
    ],
    practice: [
      makeResource('Frontend Mentor challenges', 'https://www.frontendmentor.io/challenges', 'Frontend Mentor', 'Practice building real interfaces; free challenges are available.')
    ]
  },
  {
    match: ['javascript', 'async/await', 'promises', 'dom manipulation', 'es6'],
    articles: [
      makeResource('JavaScript Guide', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', 'MDN', 'The language guide from the browser platform documentation.'),
      makeResource('The Modern JavaScript Tutorial', 'https://javascript.info/', 'javascript.info', 'A free, structured tutorial from fundamentals to browser APIs.')
    ],
    courses: [
      makeResource('JavaScript Algorithms and Data Structures', 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/', 'freeCodeCamp', 'Free lessons and practice projects.', { platform: 'freeCodeCamp' })
    ],
    practice: [
      makeResource('JavaScript exercises', 'https://exercism.org/tracks/javascript', 'Exercism', 'Free JavaScript exercises with community mentoring.')
    ]
  },
  {
    match: ['git', 'github', 'version control', 'pull request', 'code review'],
    articles: [
      makeResource('Pro Git book', 'https://git-scm.com/book/en/v2', 'Git', 'The complete Pro Git book is available free online.'),
      makeResource('GitHub Skills', 'https://skills.github.com/', 'GitHub', 'Free, interactive courses for Git and collaboration.')
    ],
    practice: [
      makeResource('Learn Git Branching', 'https://learngitbranching.js.org/', 'Learn Git Branching', 'Interactive visual exercises for Git workflows.')
    ]
  },
  {
    match: ['react', 'jsx', 'hooks', 'component composition'],
    articles: [
      makeResource('Learn React', 'https://react.dev/learn', 'React', 'The official, free React tutorial and reference.'),
      makeResource('React TypeScript Cheatsheet', 'https://react-typescript-cheatsheet.netlify.app/', 'React TypeScript Cheatsheet', 'Community-maintained patterns for typed React apps.')
    ],
    courses: [
      makeResource('Front End Development Libraries', 'https://www.freecodecamp.org/learn/front-end-development-libraries/', 'freeCodeCamp', 'Free projects and lessons for React and frontend libraries.', { platform: 'freeCodeCamp' })
    ],
    practice: [
      makeResource('React tutorial', 'https://react.dev/learn/tutorial-tic-tac-toe', 'React', 'Build a small interactive app with the official tutorial.')
    ]
  },
  {
    match: ['typescript', 'type inference', 'generics', 'utility types'],
    articles: [
      makeResource('TypeScript Handbook', 'https://www.typescriptlang.org/docs/handbook/intro.html', 'TypeScript', 'The official free guide to the TypeScript type system.'),
      makeResource('TypeScript with React', 'https://react-typescript-cheatsheet.netlify.app/', 'React TypeScript Cheatsheet', 'Practical, free examples for common React types.')
    ],
    practice: [
      makeResource('TypeScript Exercises', 'https://typescript-exercises.github.io/', 'TypeScript Exercises', 'Open exercises that build up TypeScript fluency.')
    ]
  },
  {
    match: ['state management', 'redux', 'zustand', 'context api'],
    articles: [
      makeResource('Managing State', 'https://react.dev/learn/managing-state', 'React', 'Official guide to choosing and structuring React state.'),
      makeResource('Redux Essentials', 'https://redux.js.org/tutorials/essentials/part-1-overview-concepts', 'Redux', 'Free, hands-on Redux Toolkit tutorial.')
    ],
    practice: [
      makeResource('Zustand documentation', 'https://zustand.docs.pmnd.rs/getting-started/introduction', 'Zustand', 'Free documentation and examples for lightweight state.')
    ]
  },
  {
    match: ['testing', 'vitest', 'jest', 'playwright', 'cypress', 'quality assurance'],
    articles: [
      makeResource('Vitest Guide', 'https://vitest.dev/guide/', 'Vitest', 'Free documentation for fast unit and component testing.'),
      makeResource('Testing Library', 'https://testing-library.com/docs/', 'Testing Library', 'Free guides for testing UI through user behavior.')
    ],
    practice: [
      makeResource('Playwright getting started', 'https://playwright.dev/docs/intro', 'Playwright', 'Create and run browser end-to-end tests.')
    ]
  },
  {
    match: ['performance', 'build tools', 'vite', 'webpack', 'seo', 'code splitting', 'lazy loading'],
    articles: [
      makeResource('Vite Guide', 'https://vite.dev/guide/', 'Vite', 'Free guide to modern frontend development and production builds.'),
      makeResource('Learn Performance', 'https://web.dev/learn/performance/', 'web.dev', 'A free course on measuring and improving web performance.')
    ],
    practice: [
      makeResource('Lighthouse documentation', 'https://developer.chrome.com/docs/lighthouse/overview/', 'Chrome for Developers', 'Audit web performance, accessibility, and best practices.')
    ]
  },
  {
    match: ['server-side', 'node.js', 'nodejs', 'express', 'python', 'java', 'golang', 'go language', 'fastapi'],
    articles: [
      makeResource('Node.js Learn', 'https://nodejs.org/en/learn', 'Node.js', 'Free tutorials for building server-side applications.'),
      makeResource('Python Tutorial', 'https://docs.python.org/3/tutorial/', 'Python', 'The official free Python tutorial.')
    ],
    courses: [
      makeResource('Back End Development and APIs', 'https://www.freecodecamp.org/learn/back-end-development-and-apis/', 'freeCodeCamp', 'Free hands-on lessons for Node.js and APIs.', { platform: 'freeCodeCamp' })
    ],
    practice: [
      makeResource('Exercism language tracks', 'https://exercism.org/tracks', 'Exercism', 'Free programming exercises across many backend languages.')
    ]
  },
  {
    match: ['database', 'sql', 'postgres', 'mysql', 'mongodb', 'normalization', 'indexing', 'migrations'],
    articles: [
      makeResource('PostgreSQL tutorial', 'https://www.postgresql.org/docs/current/tutorial.html', 'PostgreSQL', 'Official free introduction to relational databases and SQL.'),
      makeResource('MongoDB getting started', 'https://www.mongodb.com/docs/manual/tutorial/getting-started/', 'MongoDB', 'Free official guide to working with document databases.')
    ],
    practice: [
      makeResource('SQLBolt', 'https://sqlbolt.com/', 'SQLBolt', 'Short, interactive SQL lessons and exercises.')
    ],
    courses: [
      makeResource('Intro to SQL', 'https://www.khanacademy.org/computing/computer-programming/sql', 'Khan Academy', 'Free interactive lessons covering SQL fundamentals.', { platform: 'Khan Academy' })
    ]
  },
  {
    match: ['security', 'jwt', 'oauth', 'cors', 'authentication', 'authorization', 'sql injection', 'xss', 'sanitization'],
    articles: [
      makeResource('OWASP Cheat Sheet Series', 'https://cheatsheetseries.owasp.org/', 'OWASP', 'Free, practical application security guidance.'),
      makeResource('Web Security Academy', 'https://portswigger.net/web-security', 'PortSwigger', 'Free interactive web security lessons and labs.')
    ],
    practice: [
      makeResource('MDN HTTP guide', 'https://developer.mozilla.org/en-US/docs/Web/HTTP', 'MDN', 'Free reference for HTTP, cookies, CORS, and web security.')
    ]
  },
  {
    match: ['api', 'http', 'rest', 'graphql', 'microservices', 'openapi', 'logging', 'monitoring'],
    articles: [
      makeResource('HTTP on MDN', 'https://developer.mozilla.org/en-US/docs/Web/HTTP', 'MDN', 'A free guide to HTTP, requests, responses, and APIs.'),
      makeResource('OpenAPI specification', 'https://learn.openapis.org/', 'OpenAPI Initiative', 'Free guides for describing and documenting APIs.')
    ],
    practice: [
      makeResource('Postman API fundamentals', 'https://academy.postman.com/', 'Postman Academy', 'Free lessons for designing and testing APIs.')
    ]
  },
  {
    match: ['cache', 'caching', 'redis'],
    articles: [
      makeResource('Redis docs', 'https://redis.io/docs/latest/', 'Redis', 'Official, free guides to caching and data structures.'),
      makeResource('HTTP caching', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching', 'MDN', 'Understand browser and intermediary cache behavior.')
    ],
    practice: [
      makeResource('Redis University', 'https://university.redis.io/', 'Redis', 'Free self-paced Redis courses.')
    ]
  },
  {
    match: ['message queue', 'rabbitmq', 'kafka', 'async tasks', 'event-driven'],
    articles: [
      makeResource('RabbitMQ Tutorials', 'https://www.rabbitmq.com/tutorials', 'RabbitMQ', 'Free step-by-step messaging tutorials.'),
      makeResource('Apache Kafka Quickstart', 'https://kafka.apache.org/quickstart', 'Apache Kafka', 'Run through the official free Kafka quickstart.')
    ],
    practice: [
      makeResource('CloudAMQP Learning Center', 'https://www.cloudamqp.com/blog/', 'CloudAMQP', 'Free articles explaining message queues and RabbitMQ.')
    ]
  },
  {
    match: ['linux', 'command line', 'shell', 'bash', 'terminal'],
    articles: [
      makeResource('Linux Journey', 'https://linuxjourney.com/', 'Linux Journey', 'Free lessons on Linux fundamentals and command line.'),
      makeResource('The Missing Semester', 'https://missing.csail.mit.edu/', 'MIT', 'Free practical lessons on shell, tools, and developer workflows.')
    ],
    practice: [
      makeResource('OverTheWire Bandit', 'https://overthewire.org/wargames/bandit/', 'OverTheWire', 'A free terminal-based game for learning shell basics.')
    ]
  },
  {
    match: ['docker', 'container', 'kubernetes', 'orchestration'],
    articles: [
      makeResource('Docker Get Started', 'https://docs.docker.com/get-started/', 'Docker', 'Official free tutorials for building and running containers.'),
      makeResource('Kubernetes tutorials', 'https://kubernetes.io/docs/tutorials/', 'Kubernetes', 'Official hands-on tutorials for Kubernetes.')
    ],
    practice: [
      makeResource('Play with Docker', 'https://labs.play-with-docker.com/', 'Docker Labs', 'Free browser-based Docker practice environment.')
    ]
  },
  {
    match: ['ci/cd', 'cicd', 'continuous integration', 'github actions', 'deployment pipeline'],
    articles: [
      makeResource('GitHub Actions documentation', 'https://docs.github.com/en/actions', 'GitHub', 'Free docs for automating builds, tests, and deployments.'),
      makeResource('GitHub Actions Skills', 'https://github.com/skills/hello-github-actions', 'GitHub Skills', 'A free, hands-on workflow automation course.')
    ],
    practice: [
      makeResource('GitLab CI/CD tutorials', 'https://docs.gitlab.com/ci/quick_start/', 'GitLab', 'Free tutorials for creating CI/CD pipelines.')
    ]
  },
  {
    match: ['cloud', 'aws', 'azure', 'gcp', 'cloud platforms'],
    articles: [
      makeResource('AWS Cloud Practitioner Essentials', 'https://skillbuilder.aws/learn/learning-plans/1523/cloud-practitioner-essentials', 'AWS Skill Builder', 'Free foundational cloud training from AWS.'),
      makeResource('Google Cloud Skills Boost', 'https://www.cloudskillsboost.google/paths', 'Google Cloud', 'Free learning paths and introductory cloud activities.')
    ],
    practice: [
      makeResource('Microsoft Learn: Azure', 'https://learn.microsoft.com/en-us/training/azure/', 'Microsoft Learn', 'Free, self-paced Azure modules and exercises.')
    ]
  },
  {
    match: ['infrastructure as code', 'terraform', 'ansible'],
    articles: [
      makeResource('Terraform tutorials', 'https://developer.hashicorp.com/terraform/tutorials', 'HashiCorp', 'Free, guided Infrastructure as Code tutorials.'),
      makeResource('Ansible getting started', 'https://docs.ansible.com/ansible/latest/getting_started/index.html', 'Ansible', 'Official free automation tutorials.')
    ],
    practice: [
      makeResource('Terraform Associate study guide', 'https://developer.hashicorp.com/terraform/tutorials/certification-003', 'HashiCorp', 'Free exercises for core Terraform skills.')
    ]
  },
  {
    match: ['statistics', 'probability', 'statistical'],
    articles: [
      makeResource('Introductory Statistics', 'https://openstax.org/details/books/introductory-statistics', 'OpenStax', 'A complete, free statistics textbook.'),
      makeResource('Statistics and probability', 'https://www.khanacademy.org/math/statistics-probability', 'Khan Academy', 'Free video lessons and practice exercises.')
    ],
    courses: [
      makeResource('Kaggle Learn: Intro to Statistics', 'https://www.kaggle.com/learn/intro-to-statistics', 'Kaggle', 'Free, hands-on statistics micro-course.', { platform: 'Kaggle Learn' })
    ]
  },
  {
    match: ['visualization', 'matplotlib', 'plotly', 'data visualization'],
    articles: [
      makeResource('Matplotlib tutorials', 'https://matplotlib.org/stable/tutorials/', 'Matplotlib', 'Official examples for charts and visual storytelling.'),
      makeResource('Plotly Python getting started', 'https://plotly.com/python/getting-started/', 'Plotly', 'Free documentation for interactive charts.')
    ],
    practice: [
      makeResource('Kaggle Learn: Data Visualization', 'https://www.kaggle.com/learn/data-visualization', 'Kaggle', 'Free interactive data visualization lessons.')
    ]
  },
  {
    match: ['machine learning', 'scikit-learn', 'regression', 'classification', 'model evaluation'],
    articles: [
      makeResource('Google Machine Learning Crash Course', 'https://developers.google.com/machine-learning/crash-course', 'Google', 'Free lessons, visualizations, and exercises for ML.'),
      makeResource('Scikit-learn getting started', 'https://scikit-learn.org/stable/getting_started.html', 'Scikit-learn', 'Official free tutorials for practical machine learning.')
    ],
    courses: [
      makeResource('Kaggle Learn: Intro to Machine Learning', 'https://www.kaggle.com/learn/intro-to-machine-learning', 'Kaggle', 'Free, notebook-based machine learning course.', { platform: 'Kaggle Learn' })
    ],
    practice: [
      makeResource('Kaggle competitions', 'https://www.kaggle.com/competitions', 'Kaggle', 'Practice data science with free public competitions.')
    ]
  },
  {
    match: ['deep learning', 'neural network', 'pytorch', 'tensorflow'],
    articles: [
      makeResource('PyTorch tutorials', 'https://pytorch.org/tutorials/', 'PyTorch', 'Official free tutorials from tensors through model training.'),
      makeResource('fast.ai Practical Deep Learning', 'https://course.fast.ai/', 'fast.ai', 'A free, project-based deep learning course.')
    ],
    courses: [
      makeResource('TensorFlow tutorials', 'https://www.tensorflow.org/tutorials', 'TensorFlow', 'Free, runnable tutorials for machine learning.', { platform: 'TensorFlow' })
    ]
  },
  {
    match: ['big data', 'spark', 'distributed computing', 'data pipeline'],
    articles: [
      makeResource('Apache Spark Quick Start', 'https://spark.apache.org/docs/latest/quick-start.html', 'Apache Spark', 'Free guide to working with distributed datasets.'),
      makeResource('PySpark getting started', 'https://spark.apache.org/docs/latest/api/python/getting_started/index.html', 'Apache Spark', 'Official Python tutorials and examples.')
    ],
    practice: [
      makeResource('Kaggle Learn: Pandas', 'https://www.kaggle.com/learn/pandas', 'Kaggle', 'Free exercises for manipulating data with Python.')
    ]
  }
]

const emptyResources = () => ({ articles: [], videos: [], practice: [], courses: [] })

export function getFreeResourcesForTopics(topics = []) {
  const query = (Array.isArray(topics) ? topics : [topics])
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  const matches = catalog.filter((entry) => entry.match.some((keyword) => query.includes(keyword)))
  const resources = emptyResources()

  for (const match of matches) {
    for (const type of Object.keys(resources)) {
      resources[type].push(...(match[type] || []))
    }
  }

  if (!matches.length && query) {
    const encodedTopic = encodeURIComponent(query)
    resources.articles.push(
      makeResource(`${query} guide`, `https://www.google.com/search?q=${encodedTopic}+free+official+documentation`, 'Free documentation search', 'Search for official documentation and free tutorials for this topic.'),
      makeResource(`${query} learning path`, `https://www.freecodecamp.org/news/search/?query=${encodedTopic}`, 'freeCodeCamp', 'Search free articles and tutorials for this topic.')
    )
  }

  // YouTube search links are public and do not require a Data API key. Add one
  // whenever curated matches do not already provide a video for this topic.
  if (query && resources.videos.length === 0) {
    const encodedTopic = encodeURIComponent(query)
    resources.videos.push(
      makeResource(`${query} free video lessons`, `https://www.youtube.com/results?search_query=${encodedTopic}+free+tutorial`, 'YouTube', 'Find free video lessons from established educators.')
    )
  }

  const limits = { articles: 3, videos: 2, practice: 2, courses: 2 }
  for (const type of Object.keys(resources)) {
    const seen = new Set()
    resources[type] = resources[type]
      .filter((resource) => {
        if (!resource.url.startsWith('https://') || seen.has(resource.url)) return false
        seen.add(resource.url)
        return true
      })
      .slice(0, limits[type])
  }

  return resources
}
