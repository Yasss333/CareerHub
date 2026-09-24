import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { buildRunnable, safeRunCodeWithPiston, getLanguageConfig } from '../libs/piston.js';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Optional auth: attaches user when a valid token is present, never rejects.
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      // ignore invalid tokens for public endpoints
    }
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const isValidDifficulty = (value) => ['EASY', 'MEDIUM', 'HARD'].includes(String(value || '').toUpperCase());

// Recompute a user's ranking statistics after each accepted submission.
// Logic preserved from legacy `legacy/AlgoRank/backend/src/utils/rankingUtils.js`.
const updateUserRankingStats = async (userId) => {
  try {
    const totalSolved = await prisma.problemSolved.count({ where: { userID: userId } });
    const totalSubmissions = await prisma.submission.count({ where: { userID: userId } });
    const acceptedSubmissions = await prisma.submission.count({
      where: { userID: userId, status: 'Accepted' }
    });

    const acceptanceRate = totalSubmissions > 0 ? (acceptedSubmissions / totalSubmissions) * 100 : 0;

    const accepted = await prisma.submission.findMany({
      where: { userID: userId, status: 'Accepted' },
      select: {
        createdAt: true,
        problem: { select: { id: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    let totalSolveTime = 0;
    let solveTimeCount = 0;
    const problemFirstSubmissions = {};

    accepted.forEach((submission) => {
      const problemId = submission.problem.id;
      if (!problemFirstSubmissions[problemId]) {
        problemFirstSubmissions[problemId] = submission.createdAt;
      } else {
        const solveTime = (new Date(submission.createdAt) - new Date(problemFirstSubmissions[problemId])) / 1000;
        if (solveTime > 0 && solveTime < 3600) {
          totalSolveTime += solveTime;
          solveTimeCount++;
        }
      }
    });

    const averageSolveTime = solveTimeCount > 0 ? totalSolveTime / solveTimeCount : null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastSolvedDate: true, currentStreak: true, longestStreak: true }
    });

    let currentStreak = user?.currentStreak || 0;
    let longestStreak = user?.longestStreak || 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastSolved = user?.lastSolvedDate ? new Date(user.lastSolvedDate) : null;
    lastSolved?.setHours(0, 0, 0, 0);

    if (lastSolved) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastSolved.getTime() === yesterday.getTime()) {
        currentStreak++;
      } else if (lastSolved.getTime() === today.getTime()) {
        // already solved today, keep streak
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    const normalizedProblems = Math.min(totalSolved / 100, 1) * 50;
    const normalizedAcceptance = (acceptanceRate / 100) * 25;
    const normalizedStreak = Math.min(currentStreak / 30, 1) * 15;
    const normalizedSpeed = averageSolveTime ? Math.max(0, 1 - averageSolveTime / 1800) * 10 : 0;
    const rankingScore = normalizedProblems + normalizedAcceptance + normalizedStreak + normalizedSpeed;

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalProblemsSolved: totalSolved,
        acceptanceRate,
        averageSolveTime,
        currentStreak,
        longestStreak,
        lastSolvedDate: new Date(),
        rankingScore
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user ranking stats:', error);
    return { success: false, error: error.message };
  }
};

const buildPagination = (page, limit) => {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
};

// ============================================
// PROBLEM MANAGEMENT
// ============================================

const problemListQuery = async (req, res) => {
  try {
    const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);
    const { difficulty, tag, search } = req.query;

    const where = {};
    if (difficulty && isValidDifficulty(difficulty)) {
      where.difficulty = String(difficulty).toUpperCase();
    }
    if (tag) {
      where.tags = { has: String(tag) };
    }
    if (search) {
      where.title = { contains: String(search), mode: 'insensitive' };
    }

    const [totalCount, problems] = await Promise.all([
      prisma.problem.count({ where }),
      prisma.problem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { likes: true, comments: true, submissions: true } }
        }
      })
    ]);

    let solvedSet = new Set();
    if (req.user?.id) {
      const solved = await prisma.problemSolved.findMany({
        where: { userID: req.user.id },
        select: { problemID: true }
      });
      solvedSet = new Set(solved.map((s) => s.problemID));
    }

    const items = problems.map((p) => ({ ...p, solved: solvedSet.has(p.id) }));

    res.json({
      success: true,
      problems: items,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalProblems: totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error listing problems:', error);
    res.status(500).json({ message: 'Failed to fetch problems', error: error.message });
  }
};

// Public: list problems with pagination/filtering/search
router.get('/problems', optionalAuth, problemListQuery);

// Public: filter alias (legacy compatibility)
router.get('/problems/filter', optionalAuth, problemListQuery);

// Public: all unique tags
router.get('/problems/tags', async (req, res) => {
  try {
    const problems = await prisma.problem.findMany({ select: { tags: true } });
    const tags = [...new Set(problems.flatMap((p) => p.tags || []))].sort();
    res.json({ success: true, tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Failed to fetch tags', error: error.message });
  }
});

// Public: problem detail
router.get('/problems/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        _count: { select: { likes: true, comments: true, submissions: true } }
      }
    });

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    let solved = false;
    let liked = false;
    if (req.user?.id) {
      const [ps, like] = await Promise.all([
        prisma.problemSolved.findUnique({
          where: { userID_problemID: { userID: req.user.id, problemID: id } }
        }),
        prisma.likes.findUnique({
          where: { userID_problemID: { userID: req.user.id, problemID: id } }
        })
      ]);
      solved = !!ps;
      liked = !!like;
    }

    res.json({ success: true, problem: { ...problem, solved, liked } });
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ message: 'Failed to fetch problem', error: error.message });
  }
});

// Admin: create problem
router.post('/problems', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      hints,
      editorial,
      testcases,
      codeSnippets,
      refrenceSolutions
    } = req.body;

    if (!title || !description || !isValidDifficulty(difficulty)) {
      return res.status(400).json({ message: 'Title, description and a valid difficulty are required' });
    }
    if (!Array.isArray(testcases) || testcases.length === 0) {
      return res.status(400).json({ message: 'At least one testcase is required' });
    }

    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        difficulty: String(difficulty).toUpperCase(),
        tags: Array.isArray(tags) ? tags : [],
        examples: examples || {},
        constraints: constraints || '',
        hints: hints || null,
        editorial: editorial || null,
        testcases,
        codeSnippets: codeSnippets || null,
        refrenceSolutions: refrenceSolutions || null,
        userID: req.user.id
      }
    });

    res.status(201).json({ success: true, message: 'Problem created successfully', problem });
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(500).json({ message: 'Failed to create problem', error: error.message });
  }
});

// Admin: update problem
router.put('/problems/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      hints,
      editorial,
      testcases,
      codeSnippets,
      refrenceSolutions
    } = req.body;

    const existing = await prisma.problem.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (difficulty !== undefined) {
      if (!isValidDifficulty(difficulty)) {
        return res.status(400).json({ message: 'Invalid difficulty' });
      }
      data.difficulty = String(difficulty).toUpperCase();
    }
    if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : [];
    if (examples !== undefined) data.examples = examples;
    if (constraints !== undefined) data.constraints = constraints;
    if (hints !== undefined) data.hints = hints;
    if (editorial !== undefined) data.editorial = editorial;
    if (testcases !== undefined) data.testcases = testcases;
    if (codeSnippets !== undefined) data.codeSnippets = codeSnippets;
    if (refrenceSolutions !== undefined) data.refrenceSolutions = refrenceSolutions;

    const problem = await prisma.problem.update({ where: { id }, data });
    res.json({ success: true, message: 'Problem updated successfully', problem });
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({ message: 'Failed to update problem', error: error.message });
  }
});

// Admin: delete problem
router.delete('/problems/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.problem.delete({ where: { id } });
    res.json({ success: true, message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Error deleting problem:', error);
    res.status(500).json({ message: 'Failed to delete problem', error: error.message });
  }
});

// ============================================
// CODE EXECUTION (DRY RUN) + SUBMISSIONS
// ============================================

// Dry run against a single stdin input. No DB writes.
router.post('/execute', authenticate, async (req, res) => {
  const { sourceCode, languageKey, stdin } = req.body;

  try {
    if (!sourceCode || !languageKey) {
      return res.status(400).json({ message: 'Missing source code or language' });
    }
    if (!getLanguageConfig(languageKey)) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    const runnable = buildRunnable({ language: languageKey.toUpperCase(), sourceCode });
    if (!runnable.ok) {
      return res.status(400).json({ message: runnable.reason });
    }

    const result = await safeRunCodeWithPiston({
      language: languageKey,
      sourceCode: runnable.source,
      stdin: stdin || ''
    });

    const success = result.exitCode === 0;
    const memKB = typeof result.memory === 'number' && result.memory >= 0 ? (result.memory / 1024).toFixed(2) : null;
    const timeSec =
      typeof result.cpuTime === 'number' && result.cpuTime >= 0 ? (result.cpuTime / 1000).toFixed(3) : null;

    res.json({
      success: true,
      result: {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        exitCode: result.exitCode,
        status: {
          id: success ? 3 : 11,
          description: success ? 'Accepted' : 'Runtime Error'
        },
        memory: memKB !== null ? memKB : null,
        time: timeSec !== null ? timeSec : null
      }
    });
  } catch (error) {
    console.error('Execution error:', error);
    res.status(error.status || 500).json({
      message: 'Execution failed',
      error: error.message
    });
  }
});

// Submit solution: grades against the problem's stored testcases.
router.post('/submissions', authenticate, async (req, res) => {
  const { problemId, sourceCode, languageKey, testcases } = req.body;
  const userID = req.user.id;

  try {
    if (!sourceCode || !languageKey || !problemId) {
      return res.status(400).json({ message: 'Missing source code, language, or problemId' });
    }
    if (!getLanguageConfig(languageKey)) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    const problem = await prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Prefer authoritative testcases stored on the problem; fall back to client-provided ones.
    const problemTestcases = Array.isArray(problem.testcases) ? problem.testcases : [];
    const sourceTestcases = Array.isArray(testcases) ? testcases : [];
    const cases = (problemTestcases.length > 0 ? problemTestcases : sourceTestcases).map((tc) => ({
      input: String(tc?.input ?? ''),
      expected: String(tc?.output ?? '').trim()
    }));

    if (cases.length === 0) {
      return res.status(400).json({ message: 'No test cases available for this problem' });
    }

    const langKey = String(languageKey || '').toUpperCase();

    const runnable = buildRunnable({ language: langKey, sourceCode });
    if (!runnable.ok) {
      return res.status(400).json({ message: runnable.reason });
    }
    const runnableSource = runnable.source;

    let allPassed = true;
    const memoryArr = [];
    const timeArr = [];
    const testCaseResults = [];

    for (let i = 0; i < cases.length; i++) {
      const { input, expected } = cases[i];

      let result;
      try {
        result = await safeRunCodeWithPiston({
          language: langKey,
          sourceCode: runnableSource,
          stdin: input
        });
      } catch (err) {
        testCaseResults.push({
          testCase: i + 1,
          passed: false,
          stdout: '',
          expected,
          stderr: err.message || String(err),
          status: 'Piston Error',
          memory: '',
          time: ''
        });
        allPassed = false;
        continue;
      }

      const passed = result.exitCode === 0 && (result.stdout || '').trim() === expected;

      const memKB = typeof result.memory === 'number' && result.memory >= 0 ? (result.memory / 1024).toFixed(2) : null;
      const timeSec =
        typeof result.cpuTime === 'number' && result.cpuTime >= 0 ? (result.cpuTime / 1000).toFixed(3) : null;

      testCaseResults.push({
        testCase: i + 1,
        passed,
        stdout: result.stdout || '',
        expected,
        stderr: result.stderr || '',
        status: result.exitCode === 0 ? 'Accepted' : 'Runtime Error',
        memory: memKB !== null ? memKB : '',
        time: timeSec !== null ? timeSec : ''
      });

      if (memKB !== null) memoryArr.push(memKB);
      if (timeSec !== null) timeArr.push(timeSec);
      if (!passed) allPassed = false;
    }

    const submission = await prisma.submission.create({
      data: {
        userID,
        problemID: problemId,
        sourceCode,
        language: languageKey,
        stdin: cases.map((c) => c.input).join('\n') || '',
        stdout: JSON.stringify(testCaseResults.map((r) => r.stdout)),
        stderr: testCaseResults.some((r) => r.stderr)
          ? JSON.stringify(testCaseResults.map((r) => r.stderr))
          : null,
        status: allPassed ? 'Accepted' : 'Wrong Answer',
        memory: memoryArr.length > 0 ? JSON.stringify(memoryArr) : '[]',
        time: timeArr.length > 0 ? JSON.stringify(timeArr) : '[]'
      }
    });

    if (testCaseResults.length > 0) {
      await prisma.testcases.createMany({
        data: testCaseResults.map((r) => ({
          submissionID: submission.id,
          testCase: r.testCase,
          passed: r.passed,
          stdout: r.stdout,
          expected: r.expected,
          stderr: r.stderr,
          status: r.status,
          memory: r.memory,
          time: r.time
        }))
      });
    }

    if (allPassed) {
      await prisma.problemSolved.upsert({
        where: { userID_problemID: { userID, problemID: problemId } },
        update: {},
        create: { userID, problemID: problemId }
      });
      await updateUserRankingStats(userID);
    }

    const finalSubmission = await prisma.submission.findUnique({
      where: { id: submission.id },
      include: { testcases: true }
    });

    res.json({
      success: true,
      message: 'Code submitted successfully',
      submission: finalSubmission,
      testCaseResults
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(error.status || 500).json({
      message: 'Submission failed',
      error: error.message || String(error)
    });
  }
});

// User's own submissions
router.get('/submissions', authenticate, async (req, res) => {
  try {
    const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);

    const where = { userID: req.user.id };
    const [totalCount, submissions] = await Promise.all([
      prisma.submission.count({ where }),
      prisma.submission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          problem: { select: { id: true, title: true, difficulty: true, tags: true } },
          _count: { select: { testcases: true } }
        }
      })
    ]);

    res.json({
      success: true,
      submissions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalSubmissions: totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Failed to fetch submissions', error: error.message });
  }
});

// Submission count for a problem (own)
router.get('/submissions/count/:problemId', authenticate, async (req, res) => {
  try {
    const { problemId } = req.params;
    const count = await prisma.submission.count({
      where: { userID: req.user.id, problemID: problemId }
    });
    res.json({ count });
  } catch (error) {
    console.error('Error counting submissions:', error);
    res.status(500).json({ message: 'Failed to count submissions', error: error.message });
  }
});

// User's submissions for a specific problem
router.get('/problems/:id/submissions', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const submissions = await prisma.submission.findMany({
      where: { userID: req.user.id, problemID: id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, submissions });
  } catch (error) {
    console.error('Error fetching problem submissions:', error);
    res.status(500).json({ message: 'Failed to fetch submissions', error: error.message });
  }
});

// Specific submission (own or admin)
router.get('/submissions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        problem: { select: { id: true, title: true, difficulty: true } },
        testcases: true
      }
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    if (submission.userID !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ success: true, submission });
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ message: 'Failed to fetch submission', error: error.message });
  }
});

// ============================================
// PLAYLIST MANAGEMENT
// ============================================

router.post('/playlists', authenticate, async (req, res) => {
  const { title, description } = req.body;

  try {
    if (!title) {
      return res.status(400).json({ message: 'Playlist title is required' });
    }

    const playlist = await prisma.playlist.create({
      data: { title, description: description || null, userID: req.user.id }
    });

    res.status(201).json({ success: true, message: 'Playlist created successfully', playlist });
  } catch (error) {
    console.error('Error creating playlist:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'A playlist with this title already exists' });
    }
    res.status(500).json({ message: 'Failed to create playlist', error: error.message });
  }
});

router.get('/playlists', authenticate, async (req, res) => {
  try {
    const playlists = await prisma.playlist.findMany({
      where: { userID: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        problems: {
          include: {
            problem: { select: { id: true, title: true, difficulty: true, tags: true } }
          }
        }
      }
    });

    res.json({ success: true, playlists });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ message: 'Failed to fetch playlists', error: error.message });
  }
});

router.get('/playlists/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        problems: {
          include: {
            problem: {
              select: { id: true, title: true, difficulty: true, tags: true, description: true }
            }
          }
        }
      }
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    if (playlist.userID !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ success: true, playlist });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ message: 'Failed to fetch playlist', error: error.message });
  }
});

router.delete('/playlists/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await prisma.playlist.deleteMany({
      where: { id, userID: req.user.id }
    });

    if (result.count === 0) {
      return res.status(404).json({ message: 'Playlist not found or no access' });
    }

    res.json({ success: true, message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({ message: 'Failed to delete playlist', error: error.message });
  }
});

router.post('/playlists/:id/problems', authenticate, async (req, res) => {
  const { id } = req.params;
  const { problemIds } = req.body;

  try {
    if (!Array.isArray(problemIds) || problemIds.length === 0) {
      return res.status(400).json({ message: 'problemIds should be a non-empty array' });
    }

    const playlist = await prisma.playlist.findFirst({
      where: { id, userID: req.user.id }
    });
    if (!playlist) {
      return res.status(403).json({ message: 'No access to this playlist' });
    }

    const data = problemIds.map((problemID) => ({ playlistID: id, problemID }));
    await prisma.problemsInPlaylist.createMany({ data, skipDuplicates: true });

    res.json({ success: true, message: 'Problems added successfully', addedProblems: problemIds });
  } catch (error) {
    console.error('Error adding problems to playlist:', error);
    res.status(500).json({ message: 'Failed to add problems', error: error.message });
  }
});

router.delete('/playlists/:id/problems/:problemId', authenticate, async (req, res) => {
  const { id, problemId } = req.params;

  try {
    const playlist = await prisma.playlist.findFirst({
      where: { id, userID: req.user.id }
    });
    if (!playlist) {
      return res.status(403).json({ message: 'No access to this playlist' });
    }

    const result = await prisma.problemsInPlaylist.deleteMany({
      where: { playlistID: id, problemID: problemId }
    });

    if (result.count === 0) {
      return res.status(404).json({ message: 'Problem not in playlist' });
    }

    res.json({ success: true, message: 'Problem removed from playlist' });
  } catch (error) {
    console.error('Error removing problem from playlist:', error);
    res.status(500).json({ message: 'Failed to remove problem', error: error.message });
  }
});

// ============================================
// COMMUNITY FEATURES (COMMENTS + LIKES)
// ============================================

router.get('/comments/:problemId', optionalAuth, async (req, res) => {
  try {
    const { problemId } = req.params;
    const comments = await prisma.comments.findMany({
      where: { problemID: problemId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, image: true, avatar: true } },
        nestedComment: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, name: true, image: true, avatar: true } } }
        }
      }
    });

    res.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
});

router.post('/comments', authenticate, async (req, res) => {
  const { problemId, content } = req.body;

  try {
    if (!problemId || !content?.trim()) {
      return res.status(400).json({ message: 'problemId and content are required' });
    }

    const problem = await prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const comment = await prisma.comments.create({
      data: { problemID: problemId, userID: req.user.id, content: content.trim() },
      include: { user: { select: { id: true, name: true, image: true, avatar: true } } }
    });

    res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
});

router.post('/comments/:id/replies', authenticate, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const parent = await prisma.comments.findUnique({ where: { id } });
    if (!parent) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const reply = await prisma.nestedComments.create({
      data: { commentID: id, userID: req.user.id, content: content.trim() },
      include: { user: { select: { id: true, name: true, image: true, avatar: true } } }
    });

    res.status(201).json({ success: true, reply });
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ message: 'Failed to add reply', error: error.message });
  }
});

router.delete('/comments/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await prisma.comments.findUnique({ where: { id } });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (comment.userID !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.comments.delete({ where: { id } });
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
});

// Like/unlike a problem (toggle)
router.post('/likes', authenticate, async (req, res) => {
  const { problemId } = req.body;

  try {
    if (!problemId) {
      return res.status(400).json({ message: 'problemId is required' });
    }

    const problem = await prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const existing = await prisma.likes.findUnique({
      where: { userID_problemID: { userID: req.user.id, problemID: problemId } }
    });

    if (existing) {
      await prisma.likes.delete({ where: { id: existing.id } });
    } else {
      await prisma.likes.create({ data: { userID: req.user.id, problemID: problemId } });
    }

    const count = await prisma.likes.count({ where: { problemID: problemId } });
    res.json({ success: true, liked: !existing, count });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Failed to toggle like', error: error.message });
  }
});

router.get('/likes/:problemId', optionalAuth, async (req, res) => {
  try {
    const { problemId } = req.params;
    const count = await prisma.likes.count({ where: { problemID: problemId } });

    let liked = false;
    if (req.user?.id) {
      const existing = await prisma.likes.findUnique({
        where: { userID_problemID: { userID: req.user.id, problemID: problemId } }
      });
      liked = !!existing;
    }

    res.json({ success: true, count, liked });
  } catch (error) {
    console.error('Error fetching like count:', error);
    res.status(500).json({ message: 'Failed to fetch likes', error: error.message });
  }
});

// ============================================
// LEADERBOARD + RANKING
// ============================================

const leaderboardSortFields = ['rankingScore', 'totalProblemsSolved', 'acceptanceRate', 'currentStreak', 'longestStreak'];

router.get('/leaderboard', optionalAuth, async (req, res) => {
  try {
    const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);
    const sortBy = req.query.sortBy && leaderboardSortFields.includes(req.query.sortBy) ? req.query.sortBy : 'rankingScore';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const totalCount = await prisma.user.count({ where: { role: 'USER' } });

    const leaderboard = await prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        totalProblemsSolved: true,
        acceptanceRate: true,
        averageSolveTime: true,
        currentStreak: true,
        longestStreak: true,
        rankingScore: true,
        createdAt: true
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit
    });

    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: skip + index + 1
    }));

    res.json({
      success: true,
      leaderboard: rankedLeaderboard,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalUsers: totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard', error: error.message });
  }
});

router.get('/ranking/user/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        totalProblemsSolved: true,
        acceptanceRate: true,
        averageSolveTime: true,
        currentStreak: true,
        longestStreak: true,
        rankingScore: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const usersWithHigherScore = await prisma.user.count({
      where: { role: 'USER', rankingScore: { gt: user.rankingScore } }
    });

    const userRank = usersWithHigherScore + 1;

    const nearbyUsers = await prisma.user.findMany({
      where: { role: 'USER', id: { not: userId } },
      select: {
        id: true,
        name: true,
        image: true,
        totalProblemsSolved: true,
        acceptanceRate: true,
        currentStreak: true,
        rankingScore: true
      },
      orderBy: { rankingScore: 'desc' },
      take: 5
    });

    res.json({
      success: true,
      user: { ...user, rank: userRank },
      nearbyUsers
    });
  } catch (error) {
    console.error('Error fetching user ranking:', error);
    res.status(500).json({ message: 'Failed to fetch user ranking', error: error.message });
  }
});

router.get('/ranking/stats/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const solvedProblems = await prisma.problemSolved.findMany({
      where: { userID: userId },
      include: { problem: { select: { id: true, title: true, difficulty: true, tags: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const submissions = await prisma.submission.findMany({
      where: { userID: userId },
      select: {
        id: true,
        status: true,
        language: true,
        createdAt: true,
        problem: { select: { id: true, title: true, difficulty: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const difficultyStats = { EASY: 0, MEDIUM: 0, HARD: 0 };
    solvedProblems.forEach(({ problem }) => {
      if (problem && problem.difficulty && difficultyStats[problem.difficulty] !== undefined) {
        difficultyStats[problem.difficulty]++;
      }
    });

    const topicStats = {};
    solvedProblems.forEach(({ problem }) => {
      if (problem && problem.tags) {
        problem.tags.forEach((tag) => {
          topicStats[tag] = (topicStats[tag] || 0) + 1;
        });
      }
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await prisma.problemSolved.count({
      where: { userID: userId, createdAt: { gte: sevenDaysAgo } }
    });

    res.json({
      success: true,
      stats: {
        totalSolved: solvedProblems.length,
        difficultyBreakdown: difficultyStats,
        topicBreakdown: topicStats,
        recentActivity,
        recentSubmissions: submissions.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching ranking stats:', error);
    res.status(500).json({ message: 'Failed to fetch ranking stats', error: error.message });
  }
});

router.get('/ranking/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        totalProblemsSolved: true,
        acceptanceRate: true,
        averageSolveTime: true,
        currentStreak: true,
        longestStreak: true,
        rankingScore: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const usersWithHigherScore = await prisma.user.count({
      where: { role: 'USER', rankingScore: { gt: user.rankingScore } }
    });

    res.json({
      success: true,
      user: { ...user, rank: usersWithHigherScore + 1 }
    });
  } catch (error) {
    console.error('Error fetching my ranking:', error);
    res.status(500).json({ message: 'Failed to fetch ranking', error: error.message });
  }
});

// Recalculate streaks across all users (admin only)
router.post('/ranking/recalculate-streaks', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({ where: { role: 'USER' }, select: { id: true } });
    let updatedCount = 0;

    for (const user of users) {
      const solvedProblems = await prisma.problemSolved.findMany({
        where: { userID: user.id },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' }
      });

      if (solvedProblems.length === 0) continue;

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = solvedProblems.length - 1; i >= 0; i--) {
        const solveDate = new Date(solvedProblems[i].createdAt);
        solveDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today - solveDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0 || daysDiff === tempStreak) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else if (daysDiff === tempStreak + 1) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 1;
        }
      }

      currentStreak = tempStreak;

      await prisma.user.update({
        where: { id: user.id },
        data: { currentStreak, longestStreak }
      });

      updatedCount++;
    }

    res.json({ success: true, message: 'Streaks recalculated successfully', updatedCount });
  } catch (error) {
    console.error('Error recalculating streaks:', error);
    res.status(500).json({ message: 'Failed to recalculate streaks', error: error.message });
  }
});

export default router;