# Database Seeding Guide - AlgoRank

This guide explains how to populate the AlgoRank database with 30+ carefully curated DSA problems categorized by companies, difficulty levels, and topics.

## 📊 What Gets Seeded

The seed script populates your database with:

### **By Company**
- **Amazon** - 8 problems
- **Google** - 3 problems
- **Microsoft** - 2 problems
- **Meta (Facebook)** - 2 problems
- **Apple** - 3 problems

### **By Difficulty**
- **Easy** - 12 problems
- **Medium** - 12 problems
- **Hard** - 6 problems

### **By Topic**
- Arrays, Strings, Linked Lists, Trees, Graphs, Dynamic Programming, Backtracking, Sliding Window, Hash Maps, BFS/DFS, Two Pointers, Heaps, and more.

### **Features Included**
- ✅ Full problem descriptions
- ✅ Example test cases
- ✅ Constraints for each problem
- ✅ Hints for solving
- ✅ Code snippets in JavaScript, Python, and Java
- ✅ Multiple test cases with expected outputs

---

## 🚀 Quick Start

### **1. Install Dependencies**
```bash
cd backend
npm install
```

### **2. Set Up Database**
```bash
# Create or reset your PostgreSQL database
# Update DATABASE_URL in .env file
```

### **3. Run Migrations**
```bash
npx prisma migrate dev
```

### **4. Run the Seed Script**
```bash
npm run seed
```

### **Expected Output**
```
🌱 Starting database seeding...
✅ Admin user ready: admin@algorank.com

✅ Seeding completed!
📝 Created: 30 new problems
⏭️  Skipped: 0 existing problems
📊 Total problems in database: 30

📈 Problems by difficulty:
   EASY: 12
   MEDIUM: 12
   HARD: 6

🏷️  Unique tags: 25
Tags: Amazon, Apple, Array, BFS, Backtracking, Basics, Binary Search, Dynamic Programming, Easy, Google, Graph, Hash Map, Hash Set, Hard, Heap, LeetCode Top 75, Linked List, Math, Medium, Meta, Sliding Window, Stack, String, Tree, Two Pointers
```

---

## 📌 Important Notes

### **About the Admin Account**
- **Email:** `admin@algorank.com`
- **Password:** `admin123` (default, change in seed.js for production)
- Only admins can create new problems

### **Idempotent Seeding**
- The script is **safe to run multiple times**
- It checks if problems already exist by title
- Won't create duplicates
- Shows how many were skipped

### **For Production**
1. Change the admin password in the seed script:
   ```javascript
   const hashedPassword = await bcryptjs.hash("your-strong-password", 12);
   ```

2. Or run after seeding:
   ```javascript
   // Update admin password manually via API or database
   ```

---

## 🔍 Using the Seeded Data

### **API Endpoints**

#### **Get All Problems**
```bash
GET /api/problems/get-all-problems
```

#### **Filter by Tags**
```bash
GET /api/problems/filter?tags=Amazon,Easy&difficulty=EASY

# Query Parameters:
# - tags: comma-separated list (e.g., "Amazon,LeetCode,Medium")
# - difficulty: EASY, MEDIUM, HARD
# - search: search in title and description
```

Example:
```bash
# Get all Amazon Easy problems
GET /api/problems/filter?tags=Amazon&difficulty=EASY

# Get all Dynamic Programming problems
GET /api/problems/filter?tags=Dynamic%20Programming

# Search for specific problem
GET /api/problems/filter?search=two%20sum
```

#### **Get All Available Tags**
```bash
GET /api/problems/tags

Response:
{
  "success": true,
  "message": "Tags fetched successfully",
  "tags": [
    { "name": "Amazon", "count": 8 },
    { "name": "Array", "count": 5 },
    { "name": "Easy", "count": 12 },
    ...
  ],
  "totalTags": 25
}
```

---

## 🎯 Problems Included

### **Top Tier Problems**

#### **Amazon**
1. Two Sum - Easy
2. Reverse String - Easy
3. Best Time to Buy and Sell Stock - Easy
4. Product of Array Except Self - Medium
5. Word Ladder - Medium
6. Maximum Subarray - Medium
7. Merge K Sorted Lists - Hard
8. Coin Change - Medium

#### **Google**
1. Contains Duplicate - Easy
2. Group Anagrams - Medium
3. Diameter of Binary Tree - Easy

#### **Microsoft**
1. Longest Substring Without Repeating Characters - Medium
2. Merge Two Sorted Lists - Medium

#### **Meta (Facebook)**
1. Binary Tree Level Order Traversal - Medium
2. Permutations - Medium

#### **Apple**
1. Median of Two Sorted Arrays - Hard
2. Invert Binary Tree - Easy
3. Serialize and Deserialize Binary Tree - Hard

#### **Basics / LeetCode Top 75**
1. Valid Parentheses - Easy
2. Climbing Stairs - Easy
3. Longest Increasing Subsequence - Medium
4. Longest Palindromic Substring - Medium
5. Regular Expression Matching - Hard

---

## 🎨 Frontend Integration

### **Display Problems by Tags**

```jsx
import { useEffect, useState } from 'react';

function ProblemsFilter() {
  const [tags, setTags] = useState([]);
  const [problems, setProblems] = useState([]);

  // Fetch available tags
  useEffect(() => {
    fetch('/api/problems/tags', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTags(data.tags));
  }, []);

  // Filter problems by tag
  const filterByTag = (tag) => {
    fetch(`/api/problems/filter?tags=${tag}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setProblems(data.problems));
  };

  return (
    <div>
      {tags.map(tag => (
        <button key={tag.name} onClick={() => filterByTag(tag.name)}>
          {tag.name} ({tag.count})
        </button>
      ))}
      {/* Display filtered problems */}
    </div>
  );
}
```

---

## 🔧 Customizing Seeds

### **To Add More Problems**

Edit `backend/prisma/seed.js` and add to the `problems` array:

```javascript
{
  title: "Your Problem Title",
  description: "Detailed description...",
  difficulty: "EASY", // EASY, MEDIUM, HARD
  tags: ["Amazon", "Array", "Easy"], // Add relevant tags
  examples: {
    example1: {
      input: "...",
      output: "...",
      explanation: "..."
    }
  },
  constraints: "1 <= n <= 10^5",
  testcases: [
    { input: "test1", output: "expected1" },
    { input: "test2", output: "expected2" }
  ],
  codeSnippets: {
    JAVASCRIPT: "// code here",
    PYTHON: "# code here",
    JAVA: "// code here"
  },
  hints: "Helpful hint for solving"
}
```

Then re-run:
```bash
npm run seed
```

---

## 🐛 Troubleshooting

### **Error: "Column doesn't exist"**
- Run migrations: `npx prisma migrate dev`

### **Error: "Unique constraint failed"**
- Problems with same title already exist
- Delete them first or change titles in seed.js

### **Error: "Connection refused"**
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running

### **Error: "ENOENT: no such file or directory"**
- Make sure you're in the `backend` directory
- Check prisma/seed.js file exists

### **Database is empty after seeding**
- Check output for errors
- Verify admin user was created
- Check DATABASE_URL points to correct database

---

## 📈 Data Statistics

After seeding, you'll have:
- **30 problems** total
- **25 unique tags**
- **3 difficulty levels** (Easy, Medium, Hard)
- **5 company-specific categories** (Amazon, Google, Microsoft, Meta, Apple)
- **3 language code snippets** per problem (JavaScript, Python, Java)
- **2-3 test cases** per problem

---

## 🔐 Security Notes

1. **Change default admin password** before deployment
2. The seed script is idempotent (safe to run multiple times)
3. Only admins can create/edit problems
4. User submissions don't affect seeded problems

---

## 🚀 Deployment

### **On Railway (or similar platform)**

1. Set `DATABASE_URL` environment variable
2. Before first deploy, seed the database:
   ```bash
   npm run seed
   ```
3. Or add to post-deploy script in Railway

### **On Vercel (Frontend)**
- No changes needed; data is on backend

---

## 📚 What's Next?

After seeding:
1. ✅ Test problems on the platform
2. ✅ Add more problems gradually
3. ✅ Update problem solutions and hints
4. ✅ Gather user feedback
5. ✅ Create company-specific problem sheets

---

## 💡 Tips

- Use tags like `LeetCode Top 75` to create curated collections
- Add company tags (`Amazon`, `Google`) for targeted prep
- Update hints based on user feedback
- Create seasonal sheets (e.g., "Interview Prep 2026")

---

**Happy Learning! 🚀**
