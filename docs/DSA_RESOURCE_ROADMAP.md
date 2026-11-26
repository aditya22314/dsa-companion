# DSA in JavaScript: resource roadmap, basic to advanced

This roadmap tells you **what to watch and read, in order**, next to each Namaste DSA module. It covers every Namaste DSA module, from warm-up to graphs.

## How to use it

- **Namaste DSA stays your main course.** Everything else here is a *helper*: watch it **before** a module when that module feels hard, or **after** it when you want a second explanation.
- Do not watch everything. For each stage, do the **★ Must** items. Do the "Optional" items only if a topic still feels shaky.
- Keep the daily routine from `DSA-Daily-Plan.pdf`: try the problem first, watch, then re-solve from memory 1, 3, 7 and 14 days later.
- Timestamps like **@ 26:03** jump straight to the right part of a long video. The links already include them.

## Checked links

Every course, video ID, instructor, language and timestamp below was checked against the course's own page on 26 Nov 2026. The reference sites (MDN, javascript.info, VisuAlgo, MIT, GitHub) are the addresses their own search results list. Most videos are from freeCodeCamp.org, which is free and stays online for years. Namaste DSA lessons are referenced only by their public titles.

**Main free resources used below**

| Short name | What it is | Language | Length |
|---|---|---|---|
| **Namaste JS** | Akshay Saini's *Namaste JavaScript* series (Season 1 [playlist](https://www.youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP), Season 2 [playlist](https://www.youtube.com/playlist?list=PLlasXeu85E9eWOpw9jxHOQyGMRiBZ60aX)). Free notes: [alok722.github.io/namaste-javascript-notes](https://alok722.github.io/namaste-javascript-notes/lectures.html) | JavaScript | short episodes |
| **fCC Big O** | [Big O Notation, Full Course](https://www.youtube.com/watch?v=Mo4vesaut8g) by Giorgio Tunson (freeCodeCamp). [Article with sections](https://www.freecodecamp.org/news/learn-big-o-notation/) | JavaScript | ~2 h |
| **fCC DS in JS** | [Data Structures and Algorithms in JavaScript](https://www.youtube.com/watch?v=t2CEgPsws3U) by Beau Carnes (freeCodeCamp). [Article](https://www.freecodecamp.org/news/data-structures-and-algorithms-in-javascript/) | JavaScript | 1 h 53 m |
| **fCC Patterns** | [DSA Patterns for LeetCode Interviews](https://youtu.be/Z_c4byLrNBU) by Sheldon Chi (freeCodeCamp). [Article with sections](https://www.freecodecamp.org/news/data-structure-and-algorithm-patterns-for-leetcode-interviews/) | language not stated; ideas apply to JS | ~1 h |
| **fCC DP** | [Dynamic Programming, Learn to Solve Algorithmic Problems](https://www.youtube.com/watch?v=oBt53YbR9Kk) by Alvin Zablan (freeCodeCamp). [Article](https://www.freecodecamp.org/news/learn-dynamic-programing-to-solve-coding-challenges/) | JavaScript | ~5 h |
| **fCC Graphs** | [Graph Algorithms for Technical Interviews](https://youtu.be/tWVWeAqZ0WU) by Alvin Zablan (freeCodeCamp). [Article](https://www.freecodecamp.org/news/graph-algorithms-for-technical-interviews/) | JavaScript | ~2.5 h |
| **javascript.info** | Free JS textbook: [Recursion and stack](https://javascript.info/recursion), [Map and Set](https://javascript.info/map-set) | JavaScript | reading |
| **MDN** | [Keyed collections (Map, Set)](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Keyed_collections) | JavaScript | reading |
| **VisuAlgo** | Animated algorithms: [visualgo.net](https://visualgo.net/), e.g. [sorting](https://visualgo.net/sorting), [BST](https://visualgo.net/bst) | visual | interactive |
| **USFCA visualizations** | [Data structure visualizations](https://www.cs.usfca.edu/~galles/visualization/java/visualization.html), e.g. [Heap](https://www.cs.usfca.edu/~galles/visualization/Heap.html) | visual | interactive |
| **trekhleb** | [javascript-algorithms](https://github.com/trekhleb/javascript-algorithms) on GitHub: every data structure and algorithm written in JavaScript, with explanations | JavaScript | reference |
| **Abdul Bari** | [YouTube channel](https://www.youtube.com/channel/UCZCFT11CWBi3MHNlGf019nw): the classic whiteboard explanations of algorithms (greedy, DP, graphs) | theory | various |
| **MIT 6.006** | [Introduction to Algorithms, Spring 2020](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/lecture-notes) (MIT OpenCourseWare): university-level depth | theory | full course |

---

## Stage 0: JavaScript you need before DSA (1 week, alongside Plan Days 1–5)

You are a React developer, so you know JS. These fill the gaps that DSA code leans on.

- ★ Must: **Namaste JS** Ep 10, [Closures](https://www.youtube.com/watch?v=qikxEIxsXco). Then *Higher-Order Functions* and *map, filter & reduce* (Episodes 18–19 in the [Season 1 playlist](https://www.youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP)).
- ★ Must: **javascript.info** [Map and Set](https://javascript.info/map-set). You will use `Map` and `Set` in half of all problems.
- Optional: **Namaste JS** Ep 2, [How JS is executed & Call Stack](https://www.youtube.com/watch?v=iLWTnMzWtj4). This helps a lot with recursion later.

## Stage 1: Warm Up and Complexity (Namaste Modules 1–3 · Plan Days 1–11)

- ★ Must: **fCC Big O**, the first sections: *What Is Big O?*, *O(n^2)*, *O(n^3)* ([video](https://www.youtube.com/watch?v=Mo4vesaut8g)). Watch up to O(log n) now; the rest comes back later.
- Optional: freeCodeCamp's [Big O cheat sheet](https://www.freecodecamp.org/news/big-o-cheat-sheet-time-complexity-chart/) to print and keep.
- Practice: Namaste Module 2 problems (Second Largest, Count Digit, Palindrome, Reverse Integer), then Module 3.

## Stage 2: Arrays and Two Pointers (Namaste Module 4 · Plan Days 12–18)

- ★ Must: **fCC Patterns**, sections *Array*, *Two Pointers* and *Two Pointers practice problems* ([video](https://youtu.be/Z_c4byLrNBU)).
- Optional: **VisuAlgo** [sorting](https://visualgo.net/sorting). Step through one pass of bubble sort to "see" an array being walked.

## Stage 3: Recursion (Namaste Module 5 · Plan Days 19–23)

- ★ Must, before Namaste "Recursion 101": **javascript.info** [Recursion and stack](https://javascript.info/recursion). Read it slowly and trace the examples on paper.
- ★ Must: **fCC Big O**, section *O(2^n) Explanation With Fibonacci* (why naive recursion explodes).
- Optional: re-watch **Namaste JS** Ep 2 (call stack) if recursion feels like magic.

## Stage 4: Searching and Sorting (Namaste Module 6, later Module 21 · Plan Days 24–28)

- ★ Must: **fCC Big O**, sections *O(log n) What Is Binary Search?*, *Coding Binary Search*, *O(n log n) Coding Merge Sort*.
- ★ Must: **VisuAlgo** [sorting](https://visualgo.net/sorting). Watch bubble, selection, insertion and merge sort animate *before* each Namaste lesson.
- Reference: **trekhleb** sorting and search folders, for clean JS versions to compare with yours.

## Stage 5: Strings and Hashing (Namaste Modules 8 and 15 · Plan Days 29–38)

- ★ Must: **fCC Patterns**, sections *String*, *Set*, *Hashmap* and *Hashmap practice problems*.
- ★ Must: **MDN** [Keyed collections](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Keyed_collections). When to use `Map` versus a plain object.
- Optional: **fCC DS in JS** [Hash Tables @ 53:19](https://www.youtube.com/watch?v=t2CEgPsws3U&t=3199s) and [Sets @ 09:03](https://www.youtube.com/watch?v=t2CEgPsws3U&t=543s). These show how a hash table works inside.

## Stage 6: Binary Search, Two Pointers and Sliding Window (Namaste Modules 10–11 · Plan Days 39–55)

- ★ Must: **fCC Patterns**, sections *Binary Search* (+ practice), *Sliding Window* (+ practice).
- ★ Must: **fCC Big O**, the binary search sections again, as a 10-minute refresher before Module 10.

## Stage 7: Linked List (Namaste Module 7)

Namaste puts this before Strings. The Daily Plan moves it here because it is easier after arrays and two pointers.

- ★ Must, before "Introduction to Linked List": **fCC DS in JS** [Linked List @ 1:03:04](https://www.youtube.com/watch?v=t2CEgPsws3U&t=3784s). It builds one from scratch in JavaScript.
- Reference: **trekhleb** linked-list folder (with tests).
- Tip: draw boxes and arrows on paper for every pointer change. Most linked-list bugs are lost `next` pointers.

## Stage 8: Stacks and Queues (Namaste Module 9)

- ★ Must: **fCC DS in JS** [Stacks @ 00:21](https://www.youtube.com/watch?v=t2CEgPsws3U&t=21s) and [Queues & Priority Queues @ 19:24](https://www.youtube.com/watch?v=t2CEgPsws3U&t=1164s).
- Practice idea: in JS, an array with `push`/`pop` is a stack. For a queue, compare `shift()` (O(n)) with a head index (O(1)).

## Stage 9: Binary Trees and BST (Namaste Modules 12–13)

- ★ Must: **fCC DS in JS** [Binary Search Tree @ 26:03](https://www.youtube.com/watch?v=t2CEgPsws3U&t=1563s) and [Traversal & Height @ 39:34](https://www.youtube.com/watch?v=t2CEgPsws3U&t=2374s).
- ★ Must: **fCC Patterns**, sections *Breadth-First Search on Trees*, *Depth-First Search* (+ practice).
- ★ Must: **VisuAlgo** [BST](https://visualgo.net/bst). Insert and delete nodes yourself and watch what happens.

## Stage 10: Heaps and Priority Queues (Namaste Module 14)

- ★ Must: **fCC DS in JS** [Heap @ 1:27:29](https://www.youtube.com/watch?v=t2CEgPsws3U&t=5249s).
- ★ Must: **USFCA** [Heap visualization](https://www.cs.usfca.edu/~galles/visualization/Heap.html). Insert 10 numbers and watch heapify-up and heapify-down.
- Optional: **fCC Patterns**, section *Priority Queue/heap* (+ practice).
- Note: JavaScript has no built-in heap. Write your own once (Namaste covers this), then keep it as a snippet.

## Stage 11: Backtracking (Namaste Module 16)

- ★ Must: **fCC Patterns**, sections *Backtracking* and *Backtracking practice problems*.
- Tip: backtracking is recursion plus "undo". Do Stage 3 again for 15 minutes if this feels hard.

## Stage 12: Greedy (Namaste Module 17)

- ★ Must: **Abdul Bari** [channel](https://www.youtube.com/channel/UCZCFT11CWBi3MHNlGf019nw). Search the channel for "Greedy Method" and watch the introduction and the knapsack video.
- Tip: for every greedy idea, try to find a counter-example before trusting it.

## Stage 13: Dynamic Programming (Namaste Module 18)

- ★ Must: **fCC DP** ([video](https://www.youtube.com/watch?v=oBt53YbR9Kk)). Part 1 (memoization: fib, gridTraveler, canSum, howSum, bestSum) **before** Namaste Module 18. Part 2 (tabulation) after "Top Down & Bottom Up".
- It is in JavaScript, so you can type along. Pause before each solution and try it yourself.
- Optional: **Abdul Bari**, search "Dynamic Programming" on his channel for the theory view.

## Stage 14: Graphs (Namaste Module 19)

- ★ Must: **fCC Graphs** ([video](https://youtu.be/tWVWeAqZ0WU)): graph basics, DFS/BFS, has path, connected components, shortest path, island count. All in JavaScript.
- ★ Must: **fCC DS in JS** [Graphs @ 1:42:07](https://www.youtube.com/watch?v=t2CEgPsws3U&t=6127s) for adjacency list versus matrix, and [BFS @ 1:46:45](https://www.youtube.com/watch?v=t2CEgPsws3U&t=6405s).
- Optional: freeCodeCamp's [8 essential graph algorithms in JavaScript](https://www.freecodecamp.org/news/8-essential-graph-algorithms-in-javascript/) (article). Read it for the ideas, but test the code yourself: its cycle-detection and clone-graph snippets look buggy.
- For Dijkstra, Bellman-Ford, Floyd-Warshall, Prim and Kruskal: **Abdul Bari** (search each name on his channel), then the Namaste lesson.

## Stage 15: Tries (Namaste Module 20)

- ★ Must: **fCC DS in JS** [Trie @ 1:14:59](https://www.youtube.com/watch?v=t2CEgPsws3U&t=4499s).

## Stage 16: Going deeper (after Namaste)

- **MIT 6.006** [lecture notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/lecture-notes) for proofs and depth.
- **trekhleb** [javascript-algorithms](https://github.com/trekhleb/javascript-algorithms) as your JS reference for every structure.
- Mixed practice: solve problems where you are *not* told the topic. That is what interviews are like.

---

## The short version (print this)

| Namaste module | Before / with it, watch | Key link |
|---|---|---|
| 1–2 Warm Up | Namaste JS closures, HOF, map/filter/reduce | [playlist](https://www.youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP) |
| 3 Complexity | fCC Big O, first sections | [video](https://www.youtube.com/watch?v=Mo4vesaut8g) |
| 4 Arrays | fCC Patterns: Array, Two Pointers | [video](https://youtu.be/Z_c4byLrNBU) |
| 5 Recursion | javascript.info Recursion; Big O "O(2^n)" | [read](https://javascript.info/recursion) |
| 6 Search & Sort | VisuAlgo sorting; Big O binary search / merge sort | [visualgo](https://visualgo.net/sorting) |
| 7 Linked List | fCC DS in JS @ 1:03:04 | [video](https://www.youtube.com/watch?v=t2CEgPsws3U&t=3784s) |
| 8 Strings | fCC Patterns: String, Set, Hashmap | [video](https://youtu.be/Z_c4byLrNBU) |
| 9 Stacks & Queues | fCC DS in JS @ 00:21 and @ 19:24 | [video](https://www.youtube.com/watch?v=t2CEgPsws3U&t=21s) |
| 10 Binary Search | fCC Patterns: Binary Search | [video](https://youtu.be/Z_c4byLrNBU) |
| 11 Two Pointers & Window | fCC Patterns: Sliding Window | [video](https://youtu.be/Z_c4byLrNBU) |
| 12–13 Trees & BST | fCC DS in JS @ 26:03, @ 39:34; VisuAlgo BST | [video](https://www.youtube.com/watch?v=t2CEgPsws3U&t=1563s) |
| 14 Heap | fCC DS in JS @ 1:27:29; USFCA heap | [video](https://www.youtube.com/watch?v=t2CEgPsws3U&t=5249s) |
| 15 Hashing | MDN Keyed collections; fCC DS in JS @ 53:19 | [read](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Keyed_collections) |
| 16 Backtracking | fCC Patterns: Backtracking | [video](https://youtu.be/Z_c4byLrNBU) |
| 17 Greedy | Abdul Bari: Greedy Method | [channel](https://www.youtube.com/channel/UCZCFT11CWBi3MHNlGf019nw) |
| 18 DP | fCC DP (Alvin, JavaScript) | [video](https://www.youtube.com/watch?v=oBt53YbR9Kk) |
| 19 Graphs | fCC Graphs (Alvin, JavaScript) | [video](https://youtu.be/tWVWeAqZ0WU) |
| 20 Tries | fCC DS in JS @ 1:14:59 | [video](https://www.youtube.com/watch?v=t2CEgPsws3U&t=4499s) |
| 21 Adv. Sorting | VisuAlgo sorting (counting / radix) | [visualgo](https://visualgo.net/sorting) |

_Not affiliated with NamasteDev, freeCodeCamp or any channel listed. Links checked 26 Nov 2026. If a video ever disappears, search its exact title on YouTube._
