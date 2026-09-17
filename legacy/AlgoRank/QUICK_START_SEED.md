# 🚀 Quick Start: Seeding Your Database

## One-Command Setup

```bash
cd backend
npm run seed
```

Done! 🎉

---

## What Happens

The script will:
1. ✅ Create admin user (if doesn't exist)
2. ✅ Add 30+ DSA problems
3. ✅ Categorize by company, difficulty, and topic
4. ✅ Show statistics

---

## Expected Output

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
Tags: Amazon, Apple, Array, Backtracking, Basics, ... (25 total)
```

---

## 🔥 Next Steps

### **Test the API**

#### Get All Tags
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/problems/tags
```

#### Filter by Company
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/problems/filter?tags=Amazon"
```

#### Filter by Difficulty
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/problems/filter?difficulty=EASY"
```

#### Combined Filter
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/problems/filter?tags=Amazon,Easy&difficulty=EASY"
```

---

## 📱 Try in Frontend

```javascript
// Get Amazon problems
const response = await axios.get('/api/problems/filter', {
  params: { tags: 'Amazon' }
});
console.log(response.data.problems);
```

---

## 🎯 Problems Seeded

### **Top Companies (25 problems)**
- Amazon: 8 problems
- Google: 3 problems
- Microsoft: 2 problems
- Meta: 2 problems
- Apple: 3 problems

### **By Difficulty**
- Easy: 12 problems
- Medium: 12 problems
- Hard: 6 problems

### **Topics Covered**
- Arrays
- Strings
- Linked Lists
- Trees
- Graphs
- Dynamic Programming
- Backtracking
- Sliding Window
- Hash Maps
- And more...

---

## ✨ Features

Each problem includes:
- ✅ Full description
- ✅ Example test cases
- ✅ Constraints
- ✅ Helpful hints
- ✅ Code templates (JavaScript, Python, Java)
- ✅ Multiple test cases

---

## 🔑 Admin Credentials

**Email:** admin@algorank.com  
**Password:** admin123

⚠️ Change this before production!

---

## 📚 Documentation

- [SEEDING_GUIDE.md](./SEEDING_GUIDE.md) - Complete guide
- [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) - Code examples
- [SEEDING_SUMMARY.md](./SEEDING_SUMMARY.md) - Overview

---

## 🆘 Troubleshooting

**Problem: Nothing seeded?**
- Check: Is admin user in DB? 
- Run: `npm run seed` again

**Problem: Connection error?**
- Check: Is PostgreSQL running?
- Check: DATABASE_URL in .env correct?

**Problem: Duplicates?**
- It's fine! Script skips existing problems

---

## 🎊 You're All Set!

Your database now has 30+ quality DSA problems ready to use.

Start building your UI filters! 🚀
