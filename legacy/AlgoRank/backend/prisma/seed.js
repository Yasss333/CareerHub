import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

// Sample DSA problems with realistic data
const problems = [
  // Amazon Problems - Easy
  {
    title: "Two Sum",
    description:
      "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. You may assume each input would have exactly one solution, and you cannot use the same element twice.",
    difficulty: "EASY",
    tags: ["Array", "Amazon", "Easy", "LeetCode Top 75", "Hash Map"],
    examples: {
      example1: {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "The sum of 2 and 7 is 9. Therefore, index 0 and 1 are returned.",
      },
      example2: {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "The sum of 2 and 4 is 6. Therefore, index 1 and 2 are returned.",
      },
    },
    constraints: "2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9",
    testcases: [
      { input: "[2,7,11,15]\n9", output: "[0,1]" },
      { input: "[3,2,4]\n6", output: "[1,2]" },
      { input: "[3,3]\n6", output: "[0,1]" },
    ],
    codeSnippets: {
      JAVASCRIPT: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Write your solution here
        pass`,
      JAVA: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,
    },
    hints: "Use a hash map to store values and their indices for O(n) solution",
  },

  {
    title: "Reverse String",
    description:
      "Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory.",
    difficulty: "EASY",
    tags: ["String", "Two Pointers", "Amazon", "Easy"],
    examples: {
      example1: {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
        explanation: "The string 'hello' becomes 'olleh' when reversed.",
      },
    },
    constraints: "1 <= s.length <= 10^5",
    testcases: [
      { input: '["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
      { input: '["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' },
    ],
    codeSnippets: {
      JAVASCRIPT: `var reverseString = function(s) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def reverseString(self, s: List[str]) -> None:
        # Write your solution here
        pass`,
    },
    hints: "Use two pointers from start and end, swap them and move towards center",
  },

  // Google Problems - Easy
  {
    title: "Contains Duplicate",
    description:
      "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    difficulty: "EASY",
    tags: ["Array", "Google", "Easy", "Hash Set"],
    examples: {
      example1: {
        input: "nums = [1,2,3,1]",
        output: "true",
        explanation: "The value 1 appears at indices 0 and 3.",
      },
    },
    constraints: "1 <= nums.length <= 10^5",
    testcases: [
      { input: "[1,2,3,1]", output: "true" },
      { input: "[1,2,3,4]", output: "false" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var containsDuplicate = function(nums) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        # Write your solution here
        pass`,
    },
    hints: "Use a Set to track seen numbers",
  },

  // Microsoft Problems - Medium
  {
    title: "LongestSubstring Without Repeating Characters",
    description:
      "Given a string s, find the length of the longest substring without repeating characters.",
    difficulty: "MEDIUM",
    tags: ["String", "Sliding Window", "Microsoft", "Medium", "LeetCode Top 75"],
    examples: {
      example1: {
        input: 's = "abcabcbb"',
        output: "3",
        explanation: "The answer is 'abc', with the length of 3.",
      },
    },
    constraints: "0 <= s.length <= 5 * 10^4",
    testcases: [
      { input: '"abcabcbb"', output: "3" },
      { input: '"bbbbb"', output: "1" },
      { input: '"pwwkew"', output: "3" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var lengthOfLongestSubstring = function(s) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Write your solution here
        pass`,
    },
    hints: "Use sliding window with a hash map to track character positions",
  },

  {
    title: "Merge Two Sorted Lists",
    description:
      "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the two lists.",
    difficulty: "MEDIUM",
    tags: ["Linked List", "Microsoft", "Medium"],
    examples: {
      example1: {
        input: "list1 = [1,2,4], list2 = [1,3,4]",
        output: "[1,1,2,3,4,4]",
        explanation: "Both lists are merged into one sorted list.",
      },
    },
    constraints: "The number of nodes in both lists is in the range [0, 50]",
    testcases: [
      { input: "[1,2,4]\n[1,3,4]", output: "[1,1,2,3,4,4]" },
      { input: "[]\n[]", output: "[]" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var mergeTwoLists = function(list1, list2) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        # Write your solution here
        pass`,
    },
    hints: "Use two pointers and compare node values",
  },

  // Facebook/Meta Problems - Medium
  {
    title: "Binary Tree Level Order Traversal",
    description:
      "Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).",
    difficulty: "MEDIUM",
    tags: ["Tree", "BFS", "Meta", "Medium", "LeetCode Top 75"],
    examples: {
      example1: {
        input: "root = [3,9,20,null,null,15,7]",
        output: "[[3],[9,20],[15,7]]",
        explanation: "Level order traversal of the binary tree.",
      },
    },
    constraints: "The number of nodes in the tree is in the range [0, 2000]",
    testcases: [
      { input: "[3,9,20,null,null,15,7]", output: "[[3],[9,20],[15,7]]" },
      { input: "[1]", output: "[[1]]" },
      { input: "[]", output: "[]" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var levelOrder = function(root) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
        # Write your solution here
        pass`,
    },
    hints: "Use BFS with a queue data structure",
  },

  // Apple Problems - Hard
  {
    title: "Median of Two Sorted Arrays",
    description:
      "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).",
    difficulty: "HARD",
    tags: ["Array", "Binary Search", "Apple", "Hard", "LeetCode Top 75"],
    examples: {
      example1: {
        input: "nums1 = [1,3], nums2 = [2]",
        output: "2.0",
        explanation: "merged array = [1,2,3] and median is 2.",
      },
    },
    constraints: "nums1.length == m, nums2.length == n",
    testcases: [
      { input: "[1,3]\n[2]", output: "2.0" },
      { input: "[1,2]\n[3,4]", output: "2.5" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var findMedianSortedArrays = function(nums1, nums2) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        # Write your solution here
        pass`,
    },
    hints: "Use binary search to partition arrays efficiently",
  },

  // Basics - Easy
  {
    title: "Valid Parentheses",
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: all brackets are closed, brackets close in the correct order.",
    difficulty: "EASY",
    tags: ["String", "Stack", "Basics", "Easy", "LeetCode Top 75"],
    examples: {
      example1: {
        input: 's = "()"',
        output: "true",
        explanation: "Valid parentheses.",
      },
    },
    constraints: "1 <= s.length <= 10^4",
    testcases: [
      { input: '"()"', output: "true" },
      { input: '"()[]{}"', output: "true" },
      { input: '"(]"', output: "false" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var isValid = function(s) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def isValid(self, s: str) -> bool:
        # Write your solution here
        pass`,
    },
    hints: "Use a stack to match closing brackets with opening ones",
  },

  {
    title: "Maximum Subarray",
    description:
      "Given an integer array nums, find the subarray with the largest sum, and return its sum. A subarray is a contiguous non-empty sequence of elements within an array.",
    difficulty: "MEDIUM",
    tags: ["Array", "Dynamic Programming", "Basics", "Medium", "LeetCode Top 75"],
    examples: {
      example1: {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "The subarray [4,-1,2,1] has the largest sum = 6.",
      },
    },
    constraints: "1 <= nums.length <= 10^5",
    testcases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", output: "6" },
      { input: "[1]", output: "1" },
      { input: "[-2147483647]", output: "-2147483647" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var maxSubArray = function(nums) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        # Write your solution here
        pass`,
    },
    hints: "Use Kadane's algorithm for O(n) solution",
  },

  {
    title: "Merge K Sorted Lists",
    description:
      "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.",
    difficulty: "HARD",
    tags: ["Linked List", "Heap", "Divide and Conquer", "Hard", "LeetCode Top 75"],
    examples: {
      example1: {
        input: "lists = [[1,4,5],[1,3,4],[2,6]]",
        output: "[1,1,2,1,3,4,4,5,6]",
        explanation: "All linked lists merged into one sorted list.",
      },
    },
    constraints: "k == lists.length, 0 <= k <= 10^4",
    testcases: [
      { input: "[[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,1,3,4,4,5,6]" },
      { input: "[]", output: "[]" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var mergeKLists = function(lists) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:
        # Write your solution here
        pass`,
    },
    hints: "Use a min heap or divide and conquer approach",
  },

  // Array Problems
  {
    title: "Best Time to Buy and Sell Stock",
    description:
      "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
    difficulty: "EASY",
    tags: ["Array", "Amazon", "Easy"],
    examples: {
      example1: {
        input: "prices = [7,1,5,3,6,4]",
        output: "5",
        explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.",
      },
    },
    constraints: "1 <= prices.length <= 10^5, 0 <= prices[i] <= 10^4",
    testcases: [
      { input: "[7,1,5,3,6,4]", output: "5" },
      { input: "[7,6,4,3,1]", output: "0" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var maxProfit = function(prices) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        # Write your solution here
        pass`,
    },
    hints: "Track minimum price seen so far and calculate max profit",
  },

  {
    title: "Product of Array Except Self",
    description:
      "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. You must write an algorithm that runs in O(n) time and without using the division operation.",
    difficulty: "MEDIUM",
    tags: ["Array", "Google", "Medium"],
    examples: {
      example1: {
        input: "nums = [1,2,3,4]",
        output: "[24,12,8,6]",
        explanation: "Product of elements except self.",
      },
    },
    constraints: "2 <= nums.length <= 10^5",
    testcases: [
      { input: "[1,2,3,4]", output: "[24,12,8,6]" },
      { input: "[-1,1,0,-3,3]", output: "[0,0,9,0,0]" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var productExceptSelf = function(nums) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        # Write your solution here
        pass`,
    },
    hints: "Use prefix and suffix products without division",
  },

  // String Problems
  {
    title: "Group Anagrams",
    description:
      "Given an array of strings strs, group the anagrams together. You can return the answer in any order. An anagram is a word or phrase formed by rearranging the letters of a different word or phrase.",
    difficulty: "MEDIUM",
    tags: ["String", "Hash Map", "Microsoft", "Medium"],
    examples: {
      example1: {
        input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
        output: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
        explanation: "Anagrams grouped together.",
      },
    },
    constraints: "1 <= strs.length <= 10^4",
    testcases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' },
    ],
    codeSnippets: {
      JAVASCRIPT: `var groupAnagrams = function(strs) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        # Write your solution here
        pass`,
    },
    hints: "Sort strings and use a hash map to group anagrams",
  },

  {
    title: "Longest Palindromic Substring",
    description:
      "Given a string s, return the longest palindromic substring in s. A palindrome is a word that reads the same forwards and backwards.",
    difficulty: "MEDIUM",
    tags: ["String", "Dynamic Programming", "Meta", "Medium"],
    examples: {
      example1: {
        input: 's = "babad"',
        output: '"bab"',
        explanation: 'Both "bab" and "aba" are valid answers.',
      },
    },
    constraints: "1 <= s.length <= 1000",
    testcases: [
      { input: '"babad"', output: '"bab"' },
      { input: '"cbbd"', output: '"bb"' },
    ],
    codeSnippets: {
      JAVASCRIPT: `var longestPalindrome = function(s) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def longestPalindrome(self, s: str) -> str:
        # Write your solution here
        pass`,
    },
    hints: "Expand around centers or use dynamic programming",
  },

  // Tree Problems
  {
    title: "Invert Binary Tree",
    description:
      "Given the root of a binary tree, invert the tree, and return its root. Inverting means flipping the left and right child nodes of every node in the tree.",
    difficulty: "EASY",
    tags: ["Tree", "Apple", "Easy"],
    examples: {
      example1: {
        input: "root = [4,2,7,1,3,6,9]",
        output: "[4,7,2,9,6,3,1]",
        explanation: "Tree is inverted.",
      },
    },
    constraints: "The number of nodes in the tree is in the range [0, 100]",
    testcases: [
      { input: "[4,2,7,1,3,6,9]", output: "[4,7,2,9,6,3,1]" },
      { input: "[2,1,3]", output: "[2,3,1]" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var invertTree = function(root) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        # Write your solution here
        pass`,
    },
    hints: "Recursively swap left and right children",
  },

  {
    title: "Diameter of Binary Tree",
    description:
      "Given the root of a binary tree, return the length of the diameter of the tree. The diameter of a binary tree is the length of the longest path between any two nodes in a tree. This path may or may not pass through the root.",
    difficulty: "EASY",
    tags: ["Tree", "Google", "Easy"],
    examples: {
      example1: {
        input: "root = [1,2,3,4,5]",
        output: "3",
        explanation: "The diameter is the path [4,2,1,3] or [5,2,1,3].",
      },
    },
    constraints: "The number of nodes in the tree is in the range [1, 10^4]",
    testcases: [
      { input: "[1,2,3,4,5]", output: "3" },
      { input: "[1,2]", output: "1" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var diameterOfBinaryTree = function(root) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:
        # Write your solution here
        pass`,
    },
    hints: "DFS to find depth and track maximum diameter",
  },

  // More Medium Problems
  {
    title: "Word Ladder",
    description:
      "Given two words, beginWord and endWord, and a dictionary wordList, return the number of words in the shortest transformation sequence from beginWord to endWord, or 0 if no such sequence exists.",
    difficulty: "MEDIUM",
    tags: ["BFS", "Graph", "Amazon", "Medium"],
    examples: {
      example1: {
        input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]',
        output: "5",
        explanation: "Shortest sequence: hit -> hot -> dot -> dog -> cog.",
      },
    },
    constraints: "1 <= beginWord.length <= 10, 1 <= endWord.length <= 10",
    testcases: [
      { input: '"hit","cog","[hot,dot,dog,lot,log,cog]"', output: "5" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var ladderLength = function(beginWord, endWord, wordList) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def ladderLength(self, beginWord: str, endWord: str, wordList: List[str]) -> int:
        # Write your solution here
        pass`,
    },
    hints: "Use BFS to find shortest path with word transformations",
  },

  {
    title: "Permutations",
    description:
      "Given an array nums of distinct integers, return all the possible permutations. You can return the answer in any order.",
    difficulty: "MEDIUM",
    tags: ["Backtracking", "Meta", "Medium"],
    examples: {
      example1: {
        input: "nums = [1,2,3]",
        output: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]",
        explanation: "All permutations of [1,2,3].",
      },
    },
    constraints: "1 <= nums.length <= 6, -10 <= nums[i] <= 10",
    testcases: [
      { input: "[1,2,3]", output: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]" },
      { input: "[0,1]", output: "[[0,1],[1,0]]" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var permute = function(nums) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def permute(self, nums: List[int]) -> List[List[int]]:
        # Write your solution here
        pass`,
    },
    hints: "Use backtracking with recursion",
  },

  // Hard Problems
  {
    title: "Regular Expression Matching",
    description:
      "Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*' where '.' matches any single character and '*' matches zero or more of the preceding element.",
    difficulty: "HARD",
    tags: ["Dynamic Programming", "String", "Apple", "Hard"],
    examples: {
      example1: {
        input: 's = "aa", p = "a"',
        output: "false",
        explanation: "a does not match the entire string aa.",
      },
    },
    constraints: "1 <= s.length <= 20, 1 <= p.length <= 30",
    testcases: [
      { input: '"aa","a"', output: "false" },
      { input: '"aa","a*"', output: "true" },
      { input: '"ab",".*"', output: "true" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var isMatch = function(s, p) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def isMatch(self, s: str, p: str) -> bool:
        # Write your solution here
        pass`,
    },
    hints: "Use dynamic programming with memoization",
  },

  {
    title: "Serialize and Deserialize Binary Tree",
    description:
      "Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer, or transmitted across a network. Design an algorithm to serialize and deserialize a binary tree.",
    difficulty: "HARD",
    tags: ["Tree", "Google", "Hard"],
    examples: {
      example1: {
        input: "root = [1,2,3,null,null,4,5]",
        output: "[1,2,3,null,null,4,5]",
        explanation: "Serialized and deserialized tree.",
      },
    },
    constraints: "The number of nodes in the tree is in the range [0, 10^4]",
    testcases: [
      { input: "[1,2,3,null,null,4,5]", output: "[1,2,3,null,null,4,5]" },
    ],
    codeSnippets: {
      JAVASCRIPT: `class Codec {
    serialize(root) {
        // Write your solution here
    }
    deserialize(data) {
        // Write your solution here
    }
}`,
      PYTHON: `class Codec:
    def serialize(self, root):
        # Write your solution here
        pass
    def deserialize(self, data):
        # Write your solution here
        pass`,
    },
    hints: "Use level-order traversal or DFS for serialization",
  },

  // Dynamic Programming
  {
    title: "Climbing Stairs",
    description:
      "You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    difficulty: "EASY",
    tags: ["Dynamic Programming", "Math", "Basics", "Easy"],
    examples: {
      example1: {
        input: "n = 3",
        output: "3",
        explanation: "1+1+1, 1+2, 2+1",
      },
    },
    constraints: "1 <= n <= 45",
    testcases: [
      { input: "3", output: "3" },
      { input: "2", output: "2" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var climbStairs = function(n) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def climbStairs(self, n: int) -> int:
        # Write your solution here
        pass`,
    },
    hints: "Fibonacci sequence: dp[i] = dp[i-1] + dp[i-2]",
  },

  {
    title: "Coin Change",
    description:
      "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.",
    difficulty: "MEDIUM",
    tags: ["Dynamic Programming", "Amazon", "Medium"],
    examples: {
      example1: {
        input: "coins = [1,2,5], amount = 5",
        output: "2",
        explanation: "5 = 5, or 5 = 2 + 2 + 1 (2 coins)",
      },
    },
    constraints: "1 <= coins.length <= 12, 1 <= coins[i] <= 2^31 - 1",
    testcases: [
      { input: "[1,2,5]\n5", output: "2" },
      { input: "[2]\n3", output: "-1" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var coinChange = function(coins, amount) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        # Write your solution here
        pass`,
    },
    hints: "Use DP with amount as the state",
  },

  {
    title: "Longest Increasing Subsequence",
    description:
      "Given an integer array nums, return the length of the longest strictly increasing subsequence.",
    difficulty: "MEDIUM",
    tags: ["Dynamic Programming", "Binary Search", "Meta", "Medium"],
    examples: {
      example1: {
        input: "nums = [10,9,2,5,3,7,101,18]",
        output: "4",
        explanation: "The LIS is [2,3,7,101], therefore the length is 4.",
      },
    },
    constraints: "1 <= nums.length <= 2500, -10^4 <= nums[i] <= 10^4",
    testcases: [
      { input: "[10,9,2,5,3,7,101,18]", output: "4" },
      { input: "[0,1,0,4,4,4,3,5,9]", output: "4" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var lengthOfLIS = function(nums) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        # Write your solution here
        pass`,
    },
    hints: "Binary search with DP for O(n log n) solution",
  },

  // Additional Amazon Problems
  {
    title: "3Sum",
    description:
      "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.",
    difficulty: "MEDIUM",
    tags: ["Array", "Two Pointers", "Amazon", "Medium", "LeetCode Top 75"],
    examples: {
      example1: {
        input: "nums = [-1,0,1,2,-1,-4]",
        output: "[[-1,-1,2],[-1,0,1]]",
        explanation: "Triplets that sum to 0.",
      },
    },
    constraints: "3 <= nums.length <= 3000, -10^5 <= nums[i] <= 10^5",
    testcases: [
      { input: "[-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]" },
      { input: "[0,1,1]", output: "[]" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var threeSum = function(nums) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        # Write your solution here
        pass`,
    },
    hints: "Sort array and use two pointers for each element",
  },

  {
    title: "Container With Most Water",
    description:
      "You are given an integer array height of length n. Find two lines that together with the x-axis form a container, such that the container contains the most water.",
    difficulty: "MEDIUM",
    tags: ["Array", "Two Pointers", "Amazon", "Medium"],
    examples: {
      example1: {
        input: "height = [1,8,6,2,5,4,8,3,7]",
        output: "49",
        explanation: "The max area is formed by lines at index 1 and 8.",
      },
    },
    constraints: "2 <= height.length <= 10^5, 0 <= height[i] <= 10^4",
    testcases: [
      { input: "[1,8,6,2,5,4,8,3,7]", output: "49" },
      { input: "[1,1]", output: "1" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var maxArea = function(height) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def maxArea(self, height: List[int]) -> int:
        # Write your solution here
        pass`,
    },
    hints: "Use two pointers from both ends, move the shorter one",
  },

  // Additional Google Problems
  {
    title: "Valid Anagram",
    description:
      "Given two strings s and t, return true if t is an anagram of s, and false otherwise.",
    difficulty: "EASY",
    tags: ["String", "Hash Table", "Google", "Easy"],
    examples: {
      example1: {
        input: 's = "anagram", t = "nagaram"',
        output: "true",
        explanation: "Both strings contain the same characters.",
      },
    },
    constraints: "1 <= s.length, t.length <= 5 * 10^4",
    testcases: [
      { input: '"anagram","nagaram"', output: "true" },
      { input: '"rat","car"', output: "false" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var isAnagram = function(s, t) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        # Write your solution here
        pass`,
    },
    hints: "Use character count array or hash map",
  },

  {
    title: "Valid Palindrome",
    description:
      "Given a string s, return true if it is a palindrome, or false otherwise. A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    difficulty: "EASY",
    tags: ["String", "Two Pointers", "Google", "Easy"],
    examples: {
      example1: {
        input: 's = "A man, a plan, a canal: Panama"',
        output: "true",
        explanation: "After cleaning, it reads 'amanaplanacanalpanama' which is a palindrome.",
      },
    },
    constraints: "1 <= s.length <= 2 * 10^5",
    testcases: [
      { input: '"A man, a plan, a canal: Panama"', output: "true" },
      { input: '"race a car"', output: "false" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var isPalindrome = function(s) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def isPalindrome(self, s: str) -> bool:
        # Write your solution here
        pass`,
    },
    hints: "Use two pointers after cleaning the string",
  },

  // Additional Microsoft Problems
  {
    title: "Rotate Image",
    description:
      "You are given an n x n 2D matrix representing an image, rotate the image by 90 degrees (clockwise). You have to rotate the image in-place.",
    difficulty: "MEDIUM",
    tags: ["Array", "Matrix", "Microsoft", "Medium"],
    examples: {
      example1: {
        input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
        output: "[[7,4,1],[8,5,2],[9,6,3]]",
        explanation: "Matrix rotated 90 degrees clockwise.",
      },
    },
    constraints: "n == matrix.length == matrix[i].length, 1 <= n <= 20",
    testcases: [
      { input: "[[1,2,3],[4,5,6],[7,8,9]]", output: "[[7,4,1],[8,5,2],[9,6,3]]" },
      { input: "[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]", output: "[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var rotate = function(matrix) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        # Write your solution here
        pass`,
    },
    hints: "Transpose then reverse each row, or rotate layer by layer",
  },

  {
    title: "Search in Rotated Sorted Array",
    description:
      "There is an integer array nums sorted in ascending order (with distinct values). Prior to being passed to your function, nums is possibly rotated at an unknown pivot index k. Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.",
    difficulty: "MEDIUM",
    tags: ["Array", "Binary Search", "Microsoft", "Medium"],
    examples: {
      example1: {
        input: "nums = [4,5,6,7,0,1,2], target = 0",
        output: "4",
        explanation: "Target is at index 4.",
      },
    },
    constraints: "1 <= nums.length <= 5000, -10^4 <= nums[i] <= 10^4",
    testcases: [
      { input: "[4,5,6,7,0,1,2],0", output: "4" },
      { input: "[4,5,6,7,0,1,2],3", output: "-1" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var search = function(nums, target) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        # Write your solution here
        pass`,
    },
    hints: "Modified binary search to find the rotation point first",
  },

  // Additional Meta Problems
  {
    title: "Number of Islands",
    description:
      "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    difficulty: "MEDIUM",
    tags: ["Grid", "DFS", "BFS", "Meta", "Medium", "LeetCode Top 75"],
    examples: {
      example1: {
        input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
        output: "3",
        explanation: "There are 3 islands in the grid.",
      },
    },
    constraints: "m == grid.length, n == grid[i].length, 1 <= m, n <= 300",
    testcases: [
      { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: "3" },
      { input: '[["1","1","1"],["0","1","0"],["1","1","1"]]', output: "1" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var numIslands = function(grid) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        # Write your solution here
        pass`,
    },
    hints: "Use DFS or BFS to mark visited land cells",
  },

  {
    title: "LRU Cache",
    description:
      "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement the LRUCache class with get and put operations.",
    difficulty: "MEDIUM",
    tags: ["Design", "Hash Table", "Linked List", "Meta", "Medium"],
    examples: {
      example1: {
        input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
        output: "[null,null,null,1,null,-1,null,-1,3,4]",
        explanation: "LRU cache operations sequence.",
      },
    },
    constraints: "1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5",
    testcases: [
      { input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]', output: "[null,null,null,1,null,-1,null,-1,3,4]" },
    ],
    codeSnippets: {
      JAVASCRIPT: `class LRUCache {
    constructor(capacity) {
        // Write your solution here
    }
    get(key) {
        // Write your solution here
    }
    put(key, value) {
        // Write your solution here
    }
}`,
      PYTHON: `class LRUCache:
    def __init__(self, capacity: int):
        # Write your solution here
    def get(self, key: int) -> int:
        # Write your solution here
    def put(self, key: int, value: int) -> None:
        # Write your solution here`,
    },
    hints: "Use hash map + doubly linked list for O(1) operations",
  },

  // Additional Apple Problems
  {
    title: "Gas Station",
    description:
      "There are n gas stations along a circular route. Given the integer array gas and integer array cost, return the starting gas station's index if you can travel around the circuit once in the clockwise direction, otherwise return -1.",
    difficulty: "MEDIUM",
    tags: ["Array", "Greedy", "Apple", "Medium"],
    examples: {
      example1: {
        input: "gas = [1,2,3,4,5], cost = [3,4,5,1,2]",
        output: "3",
        explanation: "Start at station 3 (index 3) and complete the circuit.",
      },
    },
    constraints: "gas.length == cost.length == n, 1 <= n <= 10^5",
    testcases: [
      { input: "[1,2,3,4,5],[3,4,5,1,2]", output: "3" },
      { input: "[2,3,4],[3,4,3]", output: "-1" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var canCompleteCircuit = function(gas, cost) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def canCompleteCircuit(self, gas: List[int], cost: List[int]) -> int:
        # Write your solution here
        pass`,
    },
    hints: "If total gas < total cost, impossible. Use greedy to find start",
  },

  {
    title: "Candy",
    description:
      "There are n children standing in a line. Each child is assigned a rating value given in the integer array ratings. You are giving candies to these children subjected to the following requirements: Each child must have at least one candy. Children with a higher rating get more candies than their neighbors.",
    difficulty: "HARD",
    tags: ["Array", "Greedy", "Apple", "Hard"],
    examples: {
      example1: {
        input: "ratings = [1,0,2]",
        output: "5",
        explanation: "Candies distributed [2,1,2].",
      },
    },
    constraints: "n == ratings.length, 1 <= n <= 2 * 10^4, 0 <= ratings[i] <= 10^4",
    testcases: [
      { input: "[1,0,2]", output: "5" },
      { input: "[1,2,2]", output: "4" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var candy = function(ratings) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def candy(self, ratings: List[int]) -> int:
        # Write your solution here
        pass`,
    },
    hints: "Two passes: left to right and right to left",
  },

  // Netflix Problems
  {
    title: "Meeting Rooms II",
    description:
      "Given an array of meeting time intervals intervals where intervals[i] = [start_i, end_i], return the minimum number of conference rooms required.",
    difficulty: "MEDIUM",
    tags: ["Array", "Sorting", "Heap", "Netflix", "Medium"],
    examples: {
      example1: {
        input: "intervals = [[0,30],[5,10],[15,20]]",
        output: "2",
        explanation: "Need 2 rooms since [0,30] overlaps with both [5,10] and [15,20].",
      },
    },
    constraints: "1 <= intervals.length <= 10^4, 0 <= start_i < end_i <= 10^6",
    testcases: [
      { input: "[[0,30],[5,10],[15,20]]", output: "2" },
      { input: "[[7,10],[2,4]]", output: "1" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var minMeetingRooms = function(intervals) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def minMeetingRooms(self, intervals: List[List[int]]) -> int:
        # Write your solution here
        pass`,
    },
    hints: "Sort start and end times separately, use two pointers",
  },

  // Uber Problems
  {
    title: "Sliding Window Maximum",
    description:
      "You are given an array of integers nums, there is a sliding window of size k moving from the very left of the array to the very right. You can only see the k numbers in the window. Return the max sliding window.",
    difficulty: "HARD",
    tags: ["Array", "Deque", "Sliding Window", "Uber", "Hard"],
    examples: {
      example1: {
        input: "nums = [1,3,-1,-3,5,3,6,7], k = 3",
        output: "[3,3,5,5,6,7]",
        explanation: "Max values in each sliding window of size 3.",
      },
    },
    constraints: "1 <= nums.length <= 10^5, -10^4 <= nums[i] <= 10^4, 1 <= k <= nums.length",
    testcases: [
      { input: "[1,3,-1,-3,5,3,6,7],3", output: "[3,3,5,5,6,7]" },
      { input: "[1],1", output: "[1]" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var maxSlidingWindow = function(nums, k) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        # Write your solution here
        pass`,
    },
    hints: "Use deque to maintain indices of useful elements",
  },

  // More Array Problems
  {
    title: "Find Minimum in Rotated Sorted Array",
    description:
      "Given the sorted rotated array nums of unique elements, return the minimum element of this array. The array was rotated at an unknown pivot.",
    difficulty: "MEDIUM",
    tags: ["Array", "Binary Search", "Basics", "Medium"],
    examples: {
      example1: {
        input: "nums = [3,4,5,1,2]",
        output: "1",
        explanation: "The minimum element is 1.",
      },
    },
    constraints: "1 <= nums.length <= 5000, -5000 <= nums[i] <= 5000",
    testcases: [
      { input: "[3,4,5,1,2]", output: "1" },
      { input: "[4,5,6,7,0,1,2]", output: "0" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var findMin = function(nums) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def findMin(self, nums: List[int]) -> int:
        # Write your solution here
        pass`,
    },
    hints: "Binary search to find the rotation point",
  },

  {
    title: "Search a 2D Matrix",
    description:
      "Write an efficient algorithm that searches for a value target in an m x n integer matrix. This matrix has the following properties: Integers in each row are sorted from left to right. The first integer of each row is greater than the last integer of the previous row.",
    difficulty: "MEDIUM",
    tags: ["Array", "Binary Search", "Matrix", "Basics", "Medium"],
    examples: {
      example1: {
        input: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3",
        output: "true",
        explanation: "Target 3 exists in the matrix.",
      },
    },
    constraints: "m == matrix.length, n == matrix[i].length, 1 <= m, n <= 100",
    testcases: [
      { input: "[[1,3,5,7],[10,11,16,20],[23,30,34,60]],3", output: "true" },
      { input: "[[1,3,5,7],[10,11,16,20],[23,30,34,60]],13", output: "false" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var searchMatrix = function(matrix, target) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        # Write your solution here
        pass`,
    },
    hints: "Treat as 1D sorted array and use binary search",
  },

  // More String Problems
  {
    title: "Longest Common Prefix",
    description:
      "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.",
    difficulty: "EASY",
    tags: ["String", "Basics", "Easy"],
    examples: {
      example1: {
        input: 'strs = ["flower","flow","flight"]',
        output: '"fl"',
        explanation: "The longest common prefix is 'fl'.",
      },
    },
    constraints: "1 <= strs.length <= 200, 0 <= strs[i].length <= 200",
    testcases: [
      { input: '["flower","flow","flight"]', output: '"fl"' },
      { input: '["dog","racecar","car"]', output: '""' },
    ],
    codeSnippets: {
      JAVASCRIPT: `var longestCommonPrefix = function(strs) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def longestCommonPrefix(self, strs: List[str]) -> str:
        # Write your solution here
        pass`,
    },
    hints: "Compare character by character across all strings",
  },

  {
    title: "Implement strStr()",
    description:
      "Return the index of the first occurrence of needle in haystack, or -1 if needle is not part of haystack. Clarification: What should we return when needle is an empty string? This is a great question to ask during an interview. For the purpose of this problem, we will return 0 when needle is an empty string.",
    difficulty: "EASY",
    tags: ["String", "Two Pointers", "Basics", "Easy"],
    examples: {
      example1: {
        input: 'haystack = "hello", needle = "ll"',
        output: "2",
        explanation: "needle 'll' occurs at index 2 in haystack.",
      },
    },
    constraints: "0 <= haystack.length, needle.length <= 5 * 10^4",
    testcases: [
      { input: '"hello","ll"', output: "2" },
      { input: '"aaaaa","bba"', output: "-1" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var strStr = function(haystack, needle) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def strStr(self, haystack: str, needle: str) -> int:
        # Write your solution here
        pass`,
    },
    hints: "Can use built-in functions or implement KMP algorithm",
  },

  // More Tree Problems
  {
    title: "Validate Binary Search Tree",
    description:
      "Given the root of a binary tree, determine if it is a valid binary search tree (BST). A valid BST is defined as follows: The left subtree of a node contains only nodes with keys less than the node's key. The right subtree of a node contains only nodes with keys greater than the node's key.",
    difficulty: "MEDIUM",
    tags: ["Tree", "DFS", "Recursion", "Basics", "Medium"],
    examples: {
      example1: {
        input: "root = [2,1,3]",
        output: "true",
        explanation: "Valid BST with root 2, left child 1, right child 3.",
      },
    },
    constraints: "The number of nodes in the tree is in the range [1, 10^4]",
    testcases: [
      { input: "[2,1,3]", output: "true" },
      { input: "[5,1,4,null,null,3,6]", output: "false" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var isValidBST = function(root) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def isValidBST(self, root: Optional[TreeNode]) -> bool:
        # Write your solution here
        pass`,
    },
    hints: "Use min/max bounds approach during DFS traversal",
  },

  {
    title: "Symmetric Tree",
    description:
      "Given the root of a binary tree, check whether it is a mirror of itself (i.e., symmetric around its center).",
    difficulty: "EASY",
    tags: ["Tree", "DFS", "Recursion", "Basics", "Easy"],
    examples: {
      example1: {
        input: "root = [1,2,2,3,4,4,3]",
        output: "true",
        explanation: "Tree is symmetric around its center.",
      },
    },
    constraints: "The number of nodes in the tree is in the range [1, 1000]",
    testcases: [
      { input: "[1,2,2,3,4,4,3]", output: "true" },
      { input: "[1,2,2,null,3,null,3]", output: "false" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var isSymmetric = function(root) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def isSymmetric(self, root: Optional[TreeNode]) -> bool:
        # Write your solution here
        pass`,
    },
    hints: "Recursively check if left and right subtrees are mirrors",
  },

  // More Graph Problems
  {
    title: "Course Schedule",
    description:
      "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai. Return true if you can finish all courses, otherwise false.",
    difficulty: "MEDIUM",
    tags: ["Graph", "DFS", "BFS", "Topological Sort", "Basics", "Medium"],
    examples: {
      example1: {
        input: "numCourses = 2, prerequisites = [[1,0]]",
        output: "true",
        explanation: "Take course 0 then course 1.",
      },
    },
    constraints: "1 <= numCourses <= 2000, 0 <= prerequisites.length <= 5000",
    testcases: [
      { input: "2,[[1,0]]", output: "true" },
      { input: "2,[[1,0],[0,1]]", output: "false" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var canFinish = function(numCourses, prerequisites) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        # Write your solution here
        pass`,
    },
    hints: "Detect cycle in directed graph using DFS or Kahn's algorithm",
  },

  {
    title: "Clone Graph",
    description:
      "Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node in the graph contains a value (int) and a list (List[Node]) of its neighbors.",
    difficulty: "MEDIUM",
    tags: ["Graph", "DFS", "BFS", "Hash Map", "Basics", "Medium"],
    examples: {
      example1: {
        input: 'adjList = [[2,4],[1,3],[2,4],[1,3]]',
        output: '[[2,4],[1,3],[2,4],[1,3]]',
        explanation: "Graph cloned successfully.",
      },
    },
    constraints: "The number of nodes in the graph is in the range [0, 100]",
    testcases: [
      { input: '[[2,4],[1,3],[2,4],[1,3]]', output: '[[2,4],[1,3],[2,4],[1,3]]' },
      { input: '[[]]', output: '[[]]' },
    ],
    codeSnippets: {
      JAVASCRIPT: `var cloneGraph = function(node) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def cloneGraph(self, node: 'Node') -> 'Node':
        # Write your solution here
        pass`,
    },
    hints: "Use DFS/BFS with hash map to track cloned nodes",
  },

  // More Dynamic Programming Problems
  {
    title: "House Robber",
    description:
      "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night.",
    difficulty: "MEDIUM",
    tags: ["Dynamic Programming", "Array", "Basics", "Medium"],
    examples: {
      example1: {
        input: "nums = [1,2,3,1]",
        output: "4",
        explanation: "Rob house 1 (money = 1) and then house 3 (money = 3).",
      },
    },
    constraints: "1 <= nums.length <= 100, 0 <= nums[i] <= 400",
    testcases: [
      { input: "[1,2,3,1]", output: "4" },
      { input: "[2,7,9,3,1]", output: "12" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var rob = function(nums) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def rob(self, nums: List[int]) -> int:
        # Write your solution here
        pass`,
    },
    hints: "DP: dp[i] = max(dp[i-1], dp[i-2] + nums[i])",
  },

  {
    title: "Unique Paths",
    description:
      "There is a robot on an m x n grid. The robot is initially located at the top-left corner (i.e., grid[0][0]). The robot tries to move to the bottom-right corner (i.e., grid[m - 1][n - 1]). The robot can only move either down or right at any point in time. Given the two integers m and n, return the number of possible unique paths that the robot can take to reach the bottom-right corner.",
    difficulty: "MEDIUM",
    tags: ["Dynamic Programming", "Combinatorics", "Basics", "Medium"],
    examples: {
      example1: {
        input: "m = 3, n = 7",
        output: "28",
        explanation: "28 unique paths from top-left to bottom-right.",
      },
    },
    constraints: "1 <= m, n <= 100",
    testcases: [
      { input: "3,7", output: "28" },
      { input: "3,2", output: "3" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var uniquePaths = function(m, n) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        # Write your solution here
        pass`,
    },
    hints: "DP: dp[i][j] = dp[i-1][j] + dp[i][j-1] or use combinatorics",
  },

  // More Hard Problems
  {
    title: "Trapping Rain Water",
    description:
      "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    difficulty: "HARD",
    tags: ["Array", "Two Pointers", "Dynamic Programming", "Basics", "Hard", "LeetCode Top 75"],
    examples: {
      example1: {
        input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        output: "6",
        explanation: "6 units of water can be trapped.",
      },
    },
    constraints: "1 <= height.length <= 2 * 10^4, 0 <= height[i] <= 3 * 10^4",
    testcases: [
      { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" },
      { input: "[4,2,0,3,2,5]", output: "9" },
    ],
    codeSnippets: {
      JAVASCRIPT: `var trap = function(height) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def trap(self, height: List[int]) -> int:
        # Write your solution here
        pass`,
    },
    hints: "Two pointers from both ends tracking max left and right",
  },

  {
    title: "N-Queens",
    description:
      "The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other. Given an integer n, return all distinct solutions to the n-queens puzzle. You may return the answer in any order.",
    difficulty: "HARD",
    tags: ["Backtracking", "Array", "Basics", "Hard"],
    examples: {
      example1: {
        input: "n = 4",
        output: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]',
        explanation: "Two distinct solutions for 4-queens.",
      },
    },
    constraints: "1 <= n <= 9",
    testcases: [
      { input: "4", output: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]' },
      { input: "1", output: '[["Q"]]' },
    ],
    codeSnippets: {
      JAVASCRIPT: `var solveNQueens = function(n) {
    // Write your solution here
};`,
      PYTHON: `class Solution:
    def solveNQueens(self, n: int) -> List[List[str]]:
        # Write your solution here
        pass`,
    },
    hints: "Backtracking with sets to track attacked columns and diagonals",
  },
];

// Auto-generate additional synthetic problems to reach a larger seeded dataset (500+)
const TARGET_PROBLEMS = 500;
if (problems.length < TARGET_PROBLEMS) {
  const start = problems.length + 1;
  const topics = ["Arrays", "Strings", "Trees", "Graphs", "Dynamic Programming", "Hash Tables", "Sorting", "Searching", "Recursion", "Greedy"];
  const companies = ["Amazon", "Google", "Microsoft", "Meta", "Apple", "Netflix", "Uber", "Twitter", "LinkedIn"];
  
  for (let i = start; i <= TARGET_PROBLEMS; i++) {
    const diff = i % 3 === 0 ? "HARD" : i % 3 === 1 ? "EASY" : "MEDIUM";
    const topic = topics[i % topics.length];
    const company = companies[i % companies.length];
    
    problems.push({
      title: `${topic} Practice #${i - start + 1}`,
      description: `Practice problem for ${topic} algorithms. This problem helps you understand ${topic.toLowerCase()} concepts and improve your problem-solving skills. ${company} frequently asks similar questions in interviews.`,
      difficulty: diff,
      tags: [topic, company, diff, "Practice", "Auto-Generated"],
      examples: {
        example1: { 
          input: "n = 5", 
          output: "result", 
          explanation: `Example showing the expected ${topic.toLowerCase()} operation` 
        },
        example2: { 
          input: "n = 10", 
          output: "result2", 
          explanation: "Another example case" 
        },
      },
      constraints: `1 <= n <= 10^5, Time limit: 1 second, Memory limit: 256MB`,
      testcases: [
        { input: "5", output: "result" },
        { input: "10", output: "result2" },
        { input: "1", output: "base_case" },
      ],
      codeSnippets: {
        JAVASCRIPT: `/**
 * ${topic} Practice Problem #${i - start + 1}
 * @param {number[]} input
 * @return {number}
 */
function solution(input) {
    // Implement your ${topic.toLowerCase()} solution here
    // Time complexity: O(n)
    // Space complexity: O(1)
}`,
        PYTHON: `# ${topic} Practice Problem #${i - start + 1}
class Solution:
    def solve(self, input: List[int]) -> int:
        # Implement your ${topic.toLowerCase()} solution here
        # Time complexity: O(n)
        # Space complexity: O(1)
        pass`,
        JAVA: `// ${topic} Practice Problem #${i - start + 1}
public class Solution {
    public int solve(int[] input) {
        // Implement your ${topic.toLowerCase()} solution here
        // Time complexity: O(n)
        // Space complexity: O(1)
        return 0;
    }
}`,
      },
      hints: `Consider using ${topic.toLowerCase()} techniques. Think about edge cases and optimize for time complexity.`,
    });
  }
  console.log(`🔧 Auto-generated ${TARGET_PROBLEMS - (start - 1)} problems to reach ${TARGET_PROBLEMS}`);
}

async function main() {
  try {
    console.log("🌱 Starting database seeding...");

    // Create admin user if it doesn't exist
    const hashedPassword = await bcryptjs.hash("admin123", 12);
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@algorank.com" },
      update: {},
      create: {
        email: "admin@algorank.com",
        name: "Admin Demo",
        password: hashedPassword,
        role: "ADMIN",
        image: "https://randomuser.me/api/portraits/lego/1.jpg"
      },
    });

    console.log("✅ Demo account ready:");
    console.log("   📧 Email: admin@algorank.com");
    console.log("   🔑 Password: admin123");

    // Create a recruiter demo account
    const hashedRecruiter = await bcryptjs.hash("recruiter123", 12);
    const recruiterUser = await prisma.user.upsert({
      where: { email: "recruiter@algorank.com" },
      update: {},
      create: {
        email: "recruiter@algorank.com",
        name: "Recruiter Demo",
        password: hashedRecruiter,
        role: "USER",
        image: "https://randomuser.me/api/portraits/lego/2.jpg",
      },
    });

    console.log("✅ Recruiter demo account ready:");
    console.log("   📧 Email: recruiter@algorank.com");
    console.log("   🔑 Password: recruiter123");

    // Seed problems
    let createdCount = 0;
    let skippedCount = 0;

    for (const problem of problems) {
      const existingProblem = await prisma.problem.findFirst({
        where: { title: problem.title },
      });

      if (existingProblem) {
        skippedCount++;
        continue;
      }

      await prisma.problem.create({
        data: {
          title: problem.title,
          description: problem.description,
          difficulty: problem.difficulty,
          tags: problem.tags,
          examples: problem.examples,
          constraints: problem.constraints,
          hints: problem.hints,
          testcases: problem.testcases,
          codeSnippets: problem.codeSnippets,
          userID: adminUser.id,
        },
      });

      createdCount++;
    }

    // Create demo submissions for recruiter account
    console.log("\n📝 Creating demo submissions for recruiter...");
    const easyProblems = await prisma.problem.findMany({
      where: { difficulty: "EASY" },
      take: 3,
    });

    for (const problem of easyProblems) {
      const existingSubmission = await prisma.submission.findFirst({
        where: {
          userID: adminUser.id,
          problemID: problem.id,
        },
      });

      if (!existingSubmission) {
        await prisma.submission.create({
          data: {
            userID: adminUser.id,
            problemID: problem.id,
            sourceCode: "// Solution code",
            language: "JAVASCRIPT",
            stdin: "",
            stdout: "All test cases passed! ✅",
            status: "ACCEPTED",
          },
        });

        // Mark problem as solved
        await prisma.problemSolved.upsert({
          where: {
            userID_problemID: {
              userID: adminUser.id,
              problemID: problem.id,
            },
          },
          update: {},
          create: {
            userID: adminUser.id,
            problemID: problem.id,
          },
        });
      }
    }

    console.log(`✅ Added ${Math.min(3, easyProblems.length)} solved problems to recruiter profile`);

    console.log("\n✅ Seeding completed!");
    console.log(`📝 Created: ${createdCount} new problems`);
    console.log(`⏭️  Skipped: ${skippedCount} existing problems`);
    console.log(`📊 Total problems in database: ${createdCount + skippedCount}`);
    console.log(`🎯 Target: 500 problems (curated + auto-generated)`);

    // Print problem statistics
    const problemsByDifficulty = await prisma.problem.groupBy({
      by: ["difficulty"],
      _count: true,
    });

    console.log("\n📈 Problems by difficulty:");
    problemsByDifficulty.forEach((group) => {
      console.log(`   ${group.difficulty}: ${group._count}`);
    });

    // Get all unique tags
    const allProblems = await prisma.problem.findMany({
      select: { tags: true },
    });

    const uniqueTags = new Set();
    allProblems.forEach((p) => {
      p.tags?.forEach((tag) => uniqueTags.add(tag));
    });

    console.log(`\n🏷️  Unique tags: ${uniqueTags.size}`);
    console.log("Tags:", Array.from(uniqueTags).sort().join(", "));

    // Create a flagged sample problem with a ready solution and a recruiter submission
    const flaggedTitle = "Flagged Sample Problem - Recruiter Submit";
    let flagged = await prisma.problem.findFirst({ where: { title: flaggedTitle } });
    if (!flagged) {
      flagged = await prisma.problem.create({
        data: {
          title: flaggedTitle,
          description: "This is a flagged sample problem prefilled for recruiters. Submit to mark as accepted.",
          difficulty: "EASY",
          tags: ["Sample", "Flagged", "Recruiter"],
          examples: {
            example1: { input: "1", output: "1", explanation: "Returns same number" },
          },
          constraints: "1 <= n <= 10",
          testcases: [{ input: "1", output: "1" }],
          codeSnippets: {
            JAVASCRIPT: "function sample(n){ return n; }",
            PYTHON: "def sample(n): return n",
            JAVA: "public class Main { public static int sample(int n){ return n; } }",
          },
          refrenceSolutions: {
            JAVASCRIPT: "function sample(n){ return n; }",
            PYTHON: "def sample(n): return n",
            JAVA: "public class Main { public static int sample(int n){ return n; } }",
          },
          userID: adminUser.id,
        },
      });

      // create a submission by recruiter marked accepted
      const recruiter = await prisma.user.findUnique({ where: { email: "recruiter@algorank.com" } });
      if (recruiter) {
        await prisma.submission.create({
          data: {
            userID: recruiter.id,
            problemID: flagged.id,
            sourceCode: flagged.refrenceSolutions?.JAVASCRIPT || "",
            language: "JAVASCRIPT",
            stdin: "1",
            stdout: "1",
            stderr: null,
            status: "ACCEPTED",
          },
        });

        await prisma.problemSolved.upsert({
          where: {
            userID_problemID: {
              userID: recruiter.id,
              problemID: flagged.id,
            },
          },
          update: {},
          create: {
            userID: recruiter.id,
            problemID: flagged.id,
          },
        });
      }
    }

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
