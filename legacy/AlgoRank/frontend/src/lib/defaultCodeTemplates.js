/**
 * Default code templates for Monaco editor
 * Used when problem code snippets are missing or for new languages
 */

export const DEFAULT_CODE_TEMPLATES = {
  JAVASCRIPT: `/**
 * Solution function
 * @param {string} input - Input from stdin
 * @return {string} - Output to stdout
 */
function solve(input) {
    // Write your solution here
    // Process the input and return the result
    return input;
}

// Read from stdin and call solve
process.stdin.resume();
process.stdin.setEncoding('utf8');
let input = '';
process.stdin.on('data', (chunk) => {
    input += chunk;
});
process.stdin.on('end', () => {
    console.log(solve(input.trim()));
});`,

  PYTHON: `import sys

def solve(input_data):
    """
    Solution function
    @param input_data: Input from stdin
    @return: Output to stdout
    """
    # Write your solution here
    # Process the input and return the result
    return input_data

if __name__ == "__main__":
    input_data = sys.stdin.read().strip()
    print(solve(input_data))`,

  JAVA: `import java.util.*;

public class Main {
    public static String solve(String input) {
        // Write your solution here
        // Process the input and return the result
        return input;
    }
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String input = scanner.hasNextLine() ? scanner.nextLine() : "";
        System.out.println(solve(input));
        scanner.close();
    }
}`,

  CPP: `#include <iostream>
#include <string>
#include <vector>
using namespace std;

string solve(string input) {
    // Write your solution here
    // Process the input and return the result
    return input;
}

int main() {
    string input;
    getline(cin, input);
    cout << solve(input) << endl;
    return 0;
}`,

  C: `#include <stdio.h>
#include <string.h>

char* solve(char* input) {
    // Write your solution here
    // Process the input and return the result
    return input;
}

int main() {
    char input[10000];
    fgets(input, sizeof(input), stdin);
    input[strcspn(input, "\\n")] = 0;
    printf("%s\\n", solve(input));
    return 0;
}`,

  TYPESCRIPT: `/**
 * Solution function
 * @param {string} input - Input from stdin
 * @return {string} - Output to stdout
 */
function solve(input: string): string {
    // Write your solution here
    // Process the input and return the result
    return input;
}

// Read from stdin and call solve
process.stdin.resume();
process.stdin.setEncoding('utf8');
let input = '';
process.stdin.on('data', (chunk) => {
    input += chunk;
});
process.stdin.on('end', () => {
    console.log(solve(input.trim()));
});`,

  CSHARP: `using System;

class Program {
    public static string Solve(string input) {
        // Write your solution here
        // Process the input and return the result
        return input;
    }
    
    public static void Main(string[] args) {
        string input = Console.ReadLine() ?? "";
        Console.WriteLine(Solve(input));
    }
}`,

  PHP: `<?php
function solve($input) {
    // Write your solution here
    // Process the input and return the result
    return $input;
}

$input = trim(fgets(STDIN));
echo solve($input);
?>`,

  RUBY: `def solve(input)
    # Write your solution here
    # Process the input and return the result
    input
end

input = gets.chomp
puts solve(input)`,

  GO: `package main

import (
    "bufio"
    "fmt"
    "os"
    "strings"
)

func solve(input string) string {
    // Write your solution here
    // Process the input and return the result
    return input
}

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    scanner.Scan()
    input := scanner.Text()
    fmt.Println(solve(strings.TrimSpace(input)))
}`,

  RUST: `use std::io::{self, BufRead};

fn solve(input: &str) -> String {
    // Write your solution here
    // Process the input and return the result
    input.to_string()
}

fn main() {
    let stdin = self::stdin();
    let mut input = String::new();
    stdin.lock().read_line(&mut input).unwrap();
    println!("{}", solve(input.trim()));
}`,

  KOTLIN: `fun solve(input: String): String {
    // Write your solution here
    // Process the input and return the result
    return input
}

fun main() {
    val input = readlnOrNull() ?: ""
    println(solve(input))
}`,

  SWIFT: `import Foundation

func solve(_ input: String) -> String {
    // Write your solution here
    // Process the input and return the result
    return input
}

let input = readLine() ?? ""
print(solve(input))`
};

/**
 * Get default code template for a language
 * @param {string} language - Language key
 * @return {string} - Default code template
 */
export const getDefaultCodeTemplate = (language) => {
  const langKey = language?.toUpperCase();
  return DEFAULT_CODE_TEMPLATES[langKey] || DEFAULT_CODE_TEMPLATES.JAVASCRIPT;
};

/**
 * Check if a language has a default template
 * @param {string} language - Language key
 * @return {boolean} - Whether template exists
 */
export const hasDefaultTemplate = (language) => {
  const langKey = language?.toUpperCase();
  return DEFAULT_CODE_TEMPLATES.hasOwnProperty(langKey);
};