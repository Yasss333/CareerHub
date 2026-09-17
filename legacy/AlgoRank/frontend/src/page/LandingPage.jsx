import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Code2,
  Zap,
  TrendingUp,
  Users,
  Target,
  Award,
  ChevronRight,
  Sparkles,
  GitBranch,
  Trophy,
  Crown,
  Medal,
} from "lucide-react";

const LandingPage = () => {
  const [topUsers, setTopUsers] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  useEffect(() => {
    // Fetch top 5 users for leaderboard preview
    const fetchTopUsers = async () => {
      setIsLoadingLeaderboard(true);
      try {
        // This would normally call the ranking API
        // For now, we'll use mock data
        const mockTopUsers = [
          { rank: 1, name: "CodeMaster99", totalProblemsSolved: 156, acceptanceRate: 95.2, currentStreak: 45, image: null },
          { rank: 2, name: "AlgorithmNinja", totalProblemsSolved: 142, acceptanceRate: 92.8, currentStreak: 32, image: null },
          { rank: 3, name: "DSAExpert", totalProblemsSolved: 138, acceptanceRate: 89.5, currentStreak: 28, image: null },
          { rank: 4, name: "PythonWizard", totalProblemsSolved: 125, acceptanceRate: 91.2, currentStreak: 21, image: null },
          { rank: 5, name: "JavaChampion", totalProblemsSolved: 118, acceptanceRate: 88.7, currentStreak: 19, image: null },
        ];
        setTopUsers(mockTopUsers);
      } catch (error) {
        console.error("Error fetching top users:", error);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };

    fetchTopUsers();
  }, []);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-semibold text-base-content/60">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-300 overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 navbar bg-base-100/50 backdrop-blur-md shadow-lg border-b border-base-300">
        <div className="flex-1 pl-8">
          <Link to="/" className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AlgoRank
          </Link>
        </div>
        <div className="flex-none gap-2 pr-8">
          <Link to="/login" className="btn btn-ghost">
            Login
          </Link>
          <Link to="/signup" className="btn btn-primary">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block">
                <span className="badge badge-lg badge-primary gap-2">
                  <Sparkles className="w-4 h-4" />
                  Master Coding Interviews
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black leading-tight">
                Master Your Coding{" "}
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Skills
                </span>
              </h1>
              <p className="text-xl text-base-content/70 leading-relaxed max-w-xl">
                AlgoRank is your ultimate platform to prepare for coding interviews and improve your programming skills. Solve challenging problems, track your progress, and compete with other developers.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/signup"
                className="btn btn-primary btn-lg gap-2 group"
              >
                Get Started
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="btn btn-outline btn-lg gap-2" >
                <a href="#">Watch demo </a>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-base-content/60">DSA Problems</div>
              </div>
              {/* <div className="space-y-2">
                <div className="text-3xl font-bold text-secondary">10K+</div>
                <div className="text-sm text-base-content/60">Active Users</div>
              </div> */}
              <div className="space-y-2">
                <div className="text-3xl font-bold text-accent">98%</div>
                <div className="text-sm text-base-content/60">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Right side - Visual */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-base-100 rounded-3xl p-8 border border-base-300 shadow-2xl">
              <div className="space-y-4">
                <div className="h-3 bg-primary/20 rounded w-3/4"></div>
                <div className="h-3 bg-secondary/20 rounded w-5/6"></div>
                <div className="h-3 bg-accent/20 rounded w-4/5"></div>
                <div className="divider my-4"></div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Code2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 h-2 bg-base-300 rounded"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1 h-2 bg-base-300 rounded"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 h-2 bg-base-300 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview Section */}
      <section className="relative z-10 py-16 bg-base-200/50 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Trophy className="w-8 h-8 text-primary" />
              <h2 className="text-4xl font-bold">Top Performers</h2>
            </div>
            <p className="text-lg text-base-content/60 max-w-2xl mx-auto">
              See how you stack up against the best developers on AlgoRank
            </p>
          </div>

          <div className="card bg-base-100 shadow-xl max-w-4xl mx-auto">
            <div className="card-body">
              {isLoadingLeaderboard ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>User</th>
                        <th>Problems Solved</th>
                        <th>Acceptance Rate</th>
                        <th>Current Streak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topUsers.map((user) => (
                        <tr key={user.rank}>
                          <td>
                            <div className="flex items-center gap-2">
                              {getRankIcon(user.rank)}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold">
                                {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                              </div>
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4 text-success" />
                              <span>{user.totalProblemsSolved}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-info" />
                              <span>{user.acceptanceRate.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-warning">{user.currentStreak} days</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="card-actions justify-end mt-6">
                <Link to="/login" className="btn btn-primary gap-2">
                  Join the Competition
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 bg-base-200/50 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose AlgoRank?</h2>
            <p className="text-lg text-base-content/60 max-w-2xl mx-auto">
              Everything you need to succeed in your coding interview journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group card bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 border border-base-300 hover:border-primary">
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Code2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="card-title text-xl">High Value 
                    Problems</h3>
                <p className="text-base-content/60">
                  Carefully curated problems across all difficulty levels covering every DSA topic
                </p>
              </div>
            </div>

            
            {/* Feature 3 */}
            <div className="group card bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 border border-base-300 hover:border-accent">
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <h3 className="card-title text-xl">Progress Tracking</h3>
                <p className="text-base-content/60">
                  Monitor your improvement with detailed analytics and statistics
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group card bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 border border-base-300 hover:border-primary">
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="card-title text-xl">Community (upcoming feature)</h3>
                <p className="text-base-content/60">
                Platform inspired by Leetcode/TUF+
                </p>
              </div>
            </div>

            

            {/* Feature 6 */}
            <div className="group card bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 border border-base-300 hover:border-accent">
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Award className="w-6 h-6 text-accent" />
                </div>
                <h3 className="card-title text-xl">Achievements</h3>
                <p className="text-base-content/60">
                  Earn badges and climb the leaderboard as you solve more problems
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Content Section */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">What's Trending</h2>
            <p className="text-lg text-base-content/60 max-w-2xl mx-auto">
              Stay updated with the latest activity and popular topics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Trending Problems */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h3 className="card-title flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Trending Problems
                </h3>
                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between p-2 bg-base-200 rounded">
                    <span className="text-sm font-medium">Two Sum</span>
                    <span className="badge badge-sm badge-success">Easy</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-base-200 rounded">
                    <span className="text-sm font-medium">Longest Substring</span>
                    <span className="badge badge-sm badge-warning">Medium</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-base-200 rounded">
                    <span className="text-sm font-medium">Binary Tree Level Order</span>
                    <span className="badge badge-sm badge-warning">Medium</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h3 className="card-title flex items-center gap-2">
                  <Users className="w-5 h-5 text-secondary" />
                  Recent Activity
                </h3>
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span>John solved Two Sum</span>
                    <span className="text-xs text-base-content/60">2m ago</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span>Sarah completed 5 problems today</span>
                    <span className="text-xs text-base-content/60">15m ago</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-info"></div>
                    <span>Mike started a 30-day streak</span>
                    <span className="text-xs text-base-content/60">1h ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Topics */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h3 className="card-title flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-accent" />
                  Active Topics
                </h3>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="badge badge-lg badge-primary">Arrays</span>
                  <span className="badge badge-lg badge-secondary">Strings</span>
                  <span className="badge badge-lg badge-accent">Trees</span>
                  <span className="badge badge-lg badge-info">Dynamic Programming</span>
                  <span className="badge badge-lg badge-success">Graphs</span>
                  <span className="badge badge-lg badge-warning">Linked Lists</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-16 bg-base-200/50 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-base-content/60 max-w-2xl mx-auto">
              Start improving your coding skills in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold mx-auto">
                1
              </div>
              <h3 className="text-xl font-bold">Choose a Problem</h3>
              <p className="text-base-content/70">
                Browse through our curated collection of DSA problems across various difficulty levels and topics
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary text-secondary-content flex items-center justify-center text-2xl font-bold mx-auto">
                2
              </div>
              <h3 className="text-xl font-bold">Write & Test Code</h3>
              <p className="text-base-content/70">
                Use our in-browser code editor to write solutions and test them against multiple test cases
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent text-accent-content flex items-center justify-center text-2xl font-bold mx-auto">
                3
              </div>
              <h3 className="text-xl font-bold">Track Progress</h3>
              <p className="text-base-content/70">
                Monitor your improvement with detailed statistics, climb the leaderboard, and compete with others
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl border border-base-300 p-12 text-center space-y-6">
            <h2 className="text-4xl font-bold">Ready to Start Your Journey?</h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              Join thousands of developers preparing for their dream jobs at top tech companies
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="btn btn-primary btn-lg gap-2">
                Get Started Now
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Already Have an Account?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Success Stories</h2>
            <p className="text-lg text-base-content/60 max-w-2xl mx-auto">
              Hear from developers who've improved their skills with AlgoRank
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center text-lg font-bold">
                    JD
                  </div>
                  <div>
                    <div className="font-bold">John Doe</div>
                    <div className="text-sm text-base-content/60">Software Engineer at Google</div>
                  </div>
                </div>
                <p className="text-base-content/80">
                  "AlgoRank helped me crack my Google interview. The structured problem sets and instant feedback were game-changers for my preparation."
                </p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-secondary text-secondary-content flex items-center justify-center text-lg font-bold">
                    SK
                  </div>
                  <div>
                    <div className="font-bold">Sarah Kim</div>
                    <div className="text-sm text-base-content/60">Frontend Developer at Meta</div>
                  </div>
                </div>
                <p className="text-base-content/80">
                  "The leaderboard feature kept me motivated throughout my preparation. I went from solving 5 problems to 150+ in just 3 months!"
                </p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-accent text-accent-content flex items-center justify-center text-lg font-bold">
                    MP
                  </div>
                  <div>
                    <div className="font-bold">Mike Patel</div>
                    <div className="text-sm text-base-content/60">Full Stack Developer at Amazon</div>
                  </div>
                </div>
                <p className="text-base-content/80">
                  "The variety of problems and the streak tracking feature made daily practice addictive. I improved my problem-solving speed significantly."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-base-300 bg-base-100/50 backdrop-blur py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">AlgoRank</h3>
              <p className="text-sm text-base-content/60">
                Master coding interviews and improve your programming skills
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-base-content/60">
                <li><a href="#" className="hover:text-primary transition">Features</a></li>
                {/* <li><a href="#" className="hover:text-primary transition">Pricing</a></li> */}
                <li><a href="#" className="hover:text-primary transition">Problems</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-base-content/60">
                <li><a href="#" className="hover:text-primary transition">About</a></li>
                <li><a href="#" className="hover:text-primary transition">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-base-content/60">
                <li><a href="#" className="hover:text-primary transition">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-base-300 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-base-content/60">
            <p>&copy; 2026 AlgoRank by Yash Mandhare. All rights reserved.</p>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <a href="https://github.com/Yasss333/AlgoRank" className="hover:text-primary transition">GitHub</a>
              <a href="yash.m.code@gmail.com" className="hover:text-primary transition">Mail</a>
              <a href="https://www.linkedin.com/in/yashmandhare1/" className="hover:text-primary transition">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
