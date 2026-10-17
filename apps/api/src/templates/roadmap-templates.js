// Predefined career role roadmap templates
// These serve as the base structure that can be enhanced with AI personalization

const roadmapTemplates = {
  frontend: {
    title: "Frontend Developer",
    description: "Build beautiful, interactive web applications and user interfaces",
    milestones: [
      {
        title: "HTML & CSS Fundamentals",
        order: 1,
        description: "Master the building blocks of web pages",
        topics: [
          "HTML5 Semantics & Document Structure",
          "CSS Box Model & Layout",
          "Flexbox & CSS Grid",
          "Responsive Design & Media Queries",
          "CSS Variables & Custom Properties",
          "Accessibility (ARIA, Semantic HTML)"
        ]
      },
      {
        title: "JavaScript Essentials",
        order: 2,
        description: "Learn the language of the web",
        topics: [
          "Variables, Data Types & Operators",
          "Functions & Scope",
          "DOM Manipulation",
          "Event Handling",
          "ES6+ Features (Arrow Functions, Destructuring, Spread)",
          "Async/Await & Promises",
          "Modules & Import/Export"
        ]
      },
      {
        title: "Git & Version Control",
        order: 3,
        description: "Collaborate and track changes",
        topics: [
          "Git Basics (init, add, commit, push, pull)",
          "Branching & Merging",
          "GitHub Workflow",
          "Pull Requests & Code Review",
          "Git Ignore & Best Practices"
        ]
      },
      {
        title: "React Framework",
        order: 4,
        description: "Build modern single-page applications",
        topics: [
          "React Components & JSX",
          "State Management (useState, useReducer)",
          "Props & Component Composition",
          "Hooks (useEffect, useContext, useMemo, useCallback)",
          "React Router",
          "Form Handling",
          "API Integration (fetch, axios)"
        ]
      },
      {
        title: "TypeScript",
        order: 5,
        description: "Add type safety to your JavaScript",
        topics: [
          "Basic Types & Interfaces",
          "Type Inference",
          "Generics",
          "Type Safety in React",
          "Utility Types"
        ]
      },
      {
        title: "State Management",
        order: 6,
        description: "Manage complex application state",
        topics: [
          "Context API",
          "Redux Toolkit",
          "Zustand",
          "State Design Patterns"
        ]
      },
      {
        title: "Testing",
        order: 7,
        description: "Ensure code quality",
        topics: [
          "Unit Testing (Jest, Vitest)",
          "Component Testing (React Testing Library)",
          "E2E Testing (Playwright, Cypress)",
          "Testing Best Practices"
        ]
      },
      {
        title: "Build Tools & Performance",
        order: 8,
        description: "Optimize production builds",
        topics: [
          "Webpack / Vite",
          "Code Splitting",
          "Lazy Loading",
          "Performance Optimization",
          "SEO Fundamentals"
        ]
      }
    ]
  },
  backend: {
    title: "Backend Developer",
    description: "Build robust server-side applications and APIs",
    milestones: [
      {
        title: "Server-side Programming",
        order: 1,
        description: "Choose your backend language",
        topics: [
          "Node.js / Python / Java / Go",
          "REST API Design",
          "Authentication & Authorization",
          "HTTP Methods & Status Codes",
          "API Documentation (Swagger/OpenAPI)"
        ]
      },
      {
        title: "Databases",
        order: 2,
        description: "Store and manage data",
        topics: [
          "SQL Basics (PostgreSQL / MySQL)",
          "NoSQL (MongoDB / Redis)",
          "ORM / Query Builders (Prisma / Sequelize / TypeORM)",
          "Database Design & Normalization",
          "Indexing & Performance",
          "Migrations"
        ]
      },
      {
        title: "API Security",
        order: 3,
        description: "Secure your applications",
        topics: [
          "JWT Authentication",
          "OAuth 2.0",
          "CORS Configuration",
          "Input Validation & Sanitization",
          "Rate Limiting",
          "SQL Injection Prevention",
          "XSS Prevention"
        ]
      },
      {
        title: "API Architecture",
        order: 4,
        description: "Design scalable APIs",
        topics: [
          "RESTful API Best Practices",
          "GraphQL",
          "Microservices vs Monolith",
          "API Versioning",
          "Error Handling",
          "Logging & Monitoring"
        ]
      },
      {
        title: "Caching",
        order: 5,
        description: "Improve performance",
        topics: [
          "Redis Basics",
          "Caching Strategies",
          "CDN Integration",
          "Browser Caching"
        ]
      },
      {
        title: "Message Queues",
        order: 6,
        description: "Handle async tasks",
        topics: [
          "RabbitMQ / Kafka",
          "Background Jobs",
          "Worker Queues",
          "Event-Driven Architecture"
        ]
      },
      {
        title: "Testing & CI/CD",
        order: 7,
        description: "Automate testing and deployment",
        topics: [
          "Unit Testing",
          "Integration Testing",
          "GitHub Actions",
          "Docker Containerization",
          "CI/CD Pipelines"
        ]
      }
    ]
  },
  fullstack: {
    title: "Full Stack Developer",
    description: "Build complete web applications from front to back",
    milestones: [
      {
        title: "Frontend Fundamentals",
        order: 1,
        description: "Master HTML, CSS, and JavaScript",
        topics: [
          "HTML5 & CSS3",
          "JavaScript ES6+",
          "DOM Manipulation",
          "Responsive Design",
          "Git & GitHub"
        ]
      },
      {
        title: "Frontend Framework",
        order: 2,
        description: "React or Vue.js",
        topics: [
          "React Components & Hooks",
          "State Management",
          "Routing",
          "TypeScript"
        ]
      },
      {
        title: "Backend Development",
        order: 3,
        description: "Node.js or Python",
        topics: [
          "Node.js / Express",
          "REST APIs",
          "Authentication",
          "Error Handling"
        ]
      },
      {
        title: "Databases",
        order: 4,
        description: "PostgreSQL and MongoDB",
        topics: [
          "SQL & NoSQL",
          "ORM (Prisma / Mongoose)",
          "Database Design",
          "Relationships"
        ]
      },
      {
        title: "API Integration",
        order: 5,
        description: "Connect frontend to backend",
        topics: [
          "REST API Consumption",
          "Axios / Fetch",
          "Error Handling",
          "Data Fetching Patterns"
        ]
      },
      {
        title: "Authentication",
        order: 6,
        description: "Secure your applications",
        topics: [
          "JWT Authentication",
          "OAuth 2.0",
          "Session Management",
          "Role-Based Access Control"
        ]
      },
      {
        title: "DevOps Basics",
        order: 7,
        description: "Deploy your applications",
        topics: [
          "Docker",
          "CI/CD",
          "Cloud Platforms (AWS / Vercel / Netlify)",
          "Environment Variables"
        ]
      },
      {
        title: "Testing",
        order: 8,
        description: "Ensure quality",
        topics: [
          "Unit Testing",
          "Integration Testing",
          "E2E Testing",
          "Test-Driven Development"
        ]
      }
    ]
  },
  devops: {
    title: "DevOps Engineer",
    description: "Automate deployment, scaling, and infrastructure management",
    milestones: [
      {
        title: "Linux & Command Line",
        order: 1,
        description: "Master the terminal",
        topics: [
          "Linux Basics",
          "Shell Scripting (Bash)",
          "File System Operations",
          "Process Management",
          "Permissions & Users"
        ]
      },
      {
        title: "Version Control",
        order: 2,
        description: "Git mastery",
        topics: [
          "Advanced Git",
          "Branching Strategies",
          "Git Workflows",
          "GitHub Actions",
          "GitLab CI"
        ]
      },
      {
        title: "Containerization",
        order: 3,
        description: "Docker & Kubernetes",
        topics: [
          "Docker Basics",
          "Docker Compose",
          "Dockerfile Best Practices",
          "Kubernetes Fundamentals",
          "Kubernetes Deployments",
          "Helm Charts"
        ]
      },
      {
        title: "CI/CD Pipelines",
        order: 4,
        description: "Automate everything",
        topics: [
          "GitHub Actions",
          "GitLab CI",
          "Jenkins",
          "Pipeline Design",
          "Automated Testing",
          "Deployment Strategies"
        ]
      },
      {
        title: "Cloud Platforms",
        order: 5,
        description: "AWS, GCP, Azure",
        topics: [
          "AWS Fundamentals",
          "EC2, S3, RDS",
          "IAM & Security",
          "Load Balancing",
          "Auto Scaling"
        ]
      },
      {
        title: "Infrastructure as Code",
        order: 6,
        description: "Terraform & Ansible",
        topics: [
          "Terraform Basics",
          "Terraform Modules",
          "Ansible Playbooks",
          "Configuration Management",
          "State Management"
        ]
      },
      {
        title: "Monitoring & Logging",
        order: 7,
        description: "Observe your systems",
        topics: [
          "Prometheus",
          "Grafana",
          "ELK Stack",
          "Logging Best Practices",
          "Alerting",
          "Incident Response"
        ]
      }
    ]
  },
  data_science: {
    title: "Data Scientist",
    description: "Extract insights from data using statistics and machine learning",
    milestones: [
      {
        title: "Python for Data Science",
        order: 1,
        description: "Master Python and data libraries",
        topics: [
          "Python Basics",
          "NumPy",
          "Pandas",
          "Matplotlib / Seaborn",
          "Jupyter Notebooks"
        ]
      },
      {
        title: "Statistics & Probability",
        order: 2,
        description: "Foundational math for data science",
        topics: [
          "Descriptive Statistics",
          "Probability Theory",
          "Distributions",
          "Hypothesis Testing",
          "Statistical Significance"
        ]
      },
      {
        title: "Data Visualization",
        order: 3,
        description: "Tell stories with data",
        topics: [
          "Matplotlib",
          "Seaborn",
          "Plotly",
          "Tableau",
          "Data Storytelling"
        ]
      },
      {
        title: "SQL & Databases",
        order: 4,
        description: "Query and manipulate data",
        topics: [
          "SQL Basics",
          "Advanced Queries",
          "PostgreSQL",
          "Database Design",
          "Performance Optimization"
        ]
      },
      {
        title: "Machine Learning Basics",
        order: 5,
        description: "Build predictive models",
        topics: [
          "Scikit-learn",
          "Supervised Learning",
          "Unsupervised Learning",
          "Model Evaluation",
          "Feature Engineering"
        ]
      },
      {
        title: "Deep Learning",
        order: 6,
        description: "Neural networks and AI",
        topics: [
          "TensorFlow / PyTorch",
          "Neural Network Basics",
          "CNNs for Images",
          "RNNs for Sequences",
          "Transfer Learning"
        ]
      },
      {
        title: "Big Data",
        order: 7,
        description: "Handle large-scale data",
        topics: [
          "Apache Spark",
          "Hadoop",
          "Data Engineering",
          "ETL Pipelines",
          "Data Warehousing"
        ]
      }
    ]
  }
};

export default roadmapTemplates;
