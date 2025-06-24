// Quiz data
const quiz = [
  {
    question: "What term describes the ratio of charge stored to the potential difference across a capacitor?",
    answer: "CAPACITANCE"
  },
  {
    question: "What imaginary surface is used to apply Gauss's Law effectively?",
    answer: "GAUSSIAN"
  },
  {
    question: "What insulating material is inserted between the plates of a capacitor to increase its capacitance?",
    answer: "DIELECTRIC"
  },
  {
    question: "What quantity measures the number of electric field lines passing through a surface?",
    answer: "FLUX"
  },
  {
    question: "What branch of physics deals with electric charges at rest?",
    answer: "ELECTROSTATICS"
  },
  {
    question: "What is the SI unit of electric flux?",
    answer: "NEWTON"
  },
  {
    question: "What property of a dielectric reduces the effective electric field within the capacitor?",
    answer: "POLARIZATION"
  },
  {
    question: "What device stores electric charge and energy in an electric field?",
    answer: "CAPACITOR"
  },
  {
    question: "What law relates the electric flux through a closed surface to the net enclosed charge?",
    answer: "GAUSS"
  },
  {
    question: "What fundamental force is described by Coulomb's Law in this field?",
    answer: "ELECTRIC"
  }
];

// DOM elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const questionNumber = document.getElementById('question-number');
const questionText = document.getElementById('question-text');
const wordleGrid = document.getElementById('wordle-grid');
const keyboard = document.getElementById('keyboard');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const finalScoreEl = document.getElementById('final-score');

// Game state
let currentQuestion = 0;
let score = 0;
let attempt = 0;
let grid = [];
let currentInput = '';
let timer = null;
let timeLeft = 60;
let gameActive = false;
let keyboardState = {};
let playerName = '';
let gameStartTime = null;
let tabSwitchDetected = false;
let allResults = []; // Store all results in memory

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['↵','Z','X','C','V','B','N','M','⌫']
];

// COOKIE MANAGEMENT FUNCTIONS
function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function hasUserTakenQuiz() {
  return getCookie('quiz_taken') === 'true';
}

function markQuizAsTaken() {
  // Set cookie for 365 days (1 year)
  setCookie('quiz_taken', 'true', 365);
  // Also set a backup cookie with timestamp
  setCookie('quiz_timestamp', Date.now().toString(), 365);
}

function checkQuizAccess(name) {
  // Admin bypass
  if (name.toUpperCase() === 'ADMIN') {
    console.log('Admin access granted - bypassing quiz restrictions');
    return true;
  }
  
  // Check if user has already taken the quiz
  if (hasUserTakenQuiz()) {
    console.log('User has already taken the quiz - access denied');
    return false;
  }
  
  return true;
}

function redirectToEndScreen(reason = 'already_taken') {
  showScreen(endScreen);
  
  if (reason === 'already_taken') {
    finalScoreEl.innerHTML = `
      <div style="color: #ff6b6b; font-size: 1.2em; margin-bottom: 10px;">
        ⚠️ ACCESS DENIED
      </div>
      <div>You have already completed this quiz.</div>
      <div style="font-size: 0.9em; color: #666; margin-top: 10px;">
        Each user can only take the quiz once.
      </div>
    `;
  }
  
  // Hide restart button for non-admin users
  restartBtn.style.display = 'none';
}

// Anti-cheating: Tab focus detection
let isTabActive = true;

function handleVisibilityChange() {
  if (document.hidden) {
    isTabActive = false;
    if (gameActive && !tabSwitchDetected) {
      tabSwitchDetected = true;
      handleCheatingDetected();
    }
  } else {
    isTabActive = true;
  }
}

function handleCheatingDetected() {
  console.log('Tab switching detected - ending quiz');
  gameActive = false;
  tabSwitchDetected = true;
  
  // Clear any running timers
  if (timer) {
    clearInterval(timer);
  }
  
  // Set score to 0
  score = 0;
  
  // Mark quiz as taken (prevent retries)
  markQuizAsTaken();
  
  // Save cheating attempt
  saveResult(playerName, score, true);
  
  // Show end screen immediately
  showScreen(endScreen);
  finalScoreEl.innerHTML = `
    <div style="color: #ff6b6b; font-size: 1.2em; margin-bottom: 10px;">
      ⚠️ QUIZ TERMINATED
    </div>
    <div>Tab switching detected</div>
    <div>Your Score: 0 / ${quiz.length}</div>
    <div style="font-size: 0.9em; color: #666; margin-top: 10px;">
      You cannot retake this quiz.
    </div>
  `;
  
  // Hide restart button for cheaters
  restartBtn.style.display = 'none';
}

// Add event listeners for tab focus detection
document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('blur', () => {
  if (gameActive && !tabSwitchDetected) {
    tabSwitchDetected = true;
    handleCheatingDetected();
  }
});

function showScreen(screen) {
  // Hide all screens
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('end-screen').style.display = 'none';
  // Show only the requested screen
  screen.style.display = '';
}

// Generate reference ID
function generateReferenceId(name) {
  const year = '2025';
  const reversedName = name.split('').reverse().join('').toLowerCase();
  
  // Generate random string (mix of letters and numbers)
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 8; i++) {
    randomString += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${year}${randomString}${reversedName}`;
}

// Native JavaScript result saving function
function saveResult(name, score, cheated = false) {
  const timestamp = new Date().toISOString();
  const completionTime = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
  const status = cheated ? 'CHEATED' : 'COMPLETED';
  const referenceId = generateReferenceId(name);
  
  // Create result object
  const result = {
    timestamp: timestamp,
    name: name,
    score: score,
    totalQuestions: quiz.length,
    status: status,
    completionTime: completionTime,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    referenceId: referenceId
  };
  
  // Add to results array
  allResults.push(result);
  
  // Save to console and file only (no visible overlays)
  saveToConsole(result);
  saveToLocalFile(result);
  
  console.log('Result saved:', result);
}

// Method 1: Save to console (you can see in browser dev tools)
function saveToConsole(result) {
  console.log('=== QUIZ RESULT ===');
  console.log(`Timestamp: ${result.timestamp}`);
  console.log(`Name: ${result.name}`);
  console.log(`Score: ${result.score}/${result.totalQuestions}`);
  console.log(`Status: ${result.status}`);
  console.log(`Completion Time: ${result.completionTime}s`);
  console.log(`Reference ID: ${result.referenceId}`);
  console.log('==================');
}

// Method 2: Automatically download results file
function saveToLocalFile(result) {
  // Generate cumulative results content
  let content = 'QUIZ RESULTS LOG\n';
  content += '================\n\n';
  
  allResults.forEach(r => {
    content += `${r.timestamp} - ${r.name}: ${r.score}/${r.totalQuestions} - ${r.status} - Time: ${r.completionTime}s - Ref: ${r.referenceId}\n`;
  });
  
  content += '\n--- DETAILED RESULTS ---\n';
  allResults.forEach((r, index) => {
    content += `\nResult #${index + 1}:\n`;
    content += `  Name: ${r.name}\n`;
    content += `  Score: ${r.score}/${r.totalQuestions}\n`;
    content += `  Status: ${r.status}\n`;
    content += `  Date: ${r.date}\n`;
    content += `  Time: ${r.time}\n`;
    content += `  Completion Time: ${r.completionTime} seconds\n`;
    content += `  Reference ID: ${r.referenceId}\n`;
  });
  
  // Create and download file
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'results.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function startGame() {
  const nameInput = document.getElementById('player-name');
  playerName = nameInput ? nameInput.value.trim() : '';
  if (!playerName) {
    nameInput.classList.add('input-error');
    nameInput.focus();
    return;
  }
  nameInput.classList.remove('input-error');
  
  // Check quiz access (cookie-based restriction)
  if (!checkQuizAccess(playerName)) {
    redirectToEndScreen('already_taken');
    return;
  }
  
  // Reset game state
  currentQuestion = 0;
  score = 0;
  tabSwitchDetected = false;
  gameStartTime = Date.now();
  
  showScreen(document.getElementById('game-screen'));
  nextQuestion();
}

function endGame() {
  gameActive = false;
  if (timer) clearInterval(timer);
  
  // Mark quiz as taken (only for non-admin users)
  if (playerName.toUpperCase() !== 'ADMIN') {
    markQuizAsTaken();
  }
  
  // Save final result (only if not already saved due to cheating)
  if (!tabSwitchDetected) {
    saveResult(playerName, score, false);
  }
  
  showScreen(document.getElementById('end-screen'));
  finalScoreEl.textContent = `Your Score: ${score} / ${quiz.length}`;
  
  // Show/hide restart button based on admin status
  if (playerName.toUpperCase() === 'ADMIN') {
    restartBtn.style.display = '';
    restartBtn.textContent = 'Start New Quiz (Admin)';
  } else {
    restartBtn.style.display = 'none';
  }
}

function nextQuestion() {
  if (timer) clearInterval(timer);
  if (currentQuestion >= quiz.length) {
    endGame();
    return;
  }
  
  // Check if cheating was detected
  if (tabSwitchDetected) {
    return;
  }
  
  attempt = 0;
  currentInput = '';
  keyboardState = {};
  timeLeft = 60;
  updateTimer();
  renderKeyboard();
  renderGrid();
  questionNumber.textContent = `QUESTION ${currentQuestion + 1}`;
  questionText.textContent = quiz[currentQuestion].question;
  scoreEl.textContent = `Score: ${score}`;
  gameActive = true;
  
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      markIncorrect();
    }
  }, 1000);
}

function updateTimer() {
  timerEl.textContent = `${timeLeft} s`;
}

function renderGrid() {
  const answerLen = quiz[currentQuestion].answer.length;
  grid = Array.from({length: 3}, () => Array(answerLen).fill(''));
  wordleGrid.innerHTML = '';
  for (let row = 0; row < 3; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'wordle-row';
    for (let col = 0; col < answerLen; col++) {
      const box = document.createElement('div');
      box.className = 'wordle-box';
      if (grid[row][col]) {
        box.textContent = grid[row][col];
        box.classList.add('filled');
      }
      // Animate selection for current input row
      if (row === attempt) {
        box.classList.add('selected');
      }
      rowDiv.appendChild(box);
    }
    wordleGrid.appendChild(rowDiv);
  }
}

function renderKeyboard() {
  keyboard.innerHTML = '';
  KEYBOARD_ROWS.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'keyboard-row';
    row.forEach(key => {
      const keyBtn = document.createElement('button');
      keyBtn.className = 'key';
      if (key === '↵' || key === '⌫') keyBtn.classList.add('wide');
      keyBtn.textContent = key;
      if (keyboardState[key]) keyBtn.classList.add(keyboardState[key]);
      keyBtn.onclick = () => handleKey(key);
      rowDiv.appendChild(keyBtn);
    });
    keyboard.appendChild(rowDiv);
  });
}

function handleKey(key) {
  if (!gameActive || tabSwitchDetected) return;
  
  const answerLen = quiz[currentQuestion].answer.length;
  if (key === '↵') {
    if (currentInput.length === answerLen) {
      submitAttempt();
    }
    return;
  }
  if (key === '⌫') {
    if (currentInput.length > 0) {
      currentInput = currentInput.slice(0, -1);
      updateCurrentRow();
    }
    return;
  }
  if (/^[A-Z]$/.test(key) && currentInput.length < answerLen) {
    currentInput += key;
    updateCurrentRow();
  }
}

function updateCurrentRow() {
  const answerLen = quiz[currentQuestion].answer.length;
  grid[attempt] = Array(answerLen).fill('');
  for (let i = 0; i < currentInput.length; i++) {
    grid[attempt][i] = currentInput[i];
  }
  // Re-render only current row
  const rowDivs = wordleGrid.querySelectorAll('.wordle-row');
  const rowDiv = rowDivs[attempt];
  if (rowDiv) {
    for (let col = 0; col < answerLen; col++) {
      const box = rowDiv.children[col];
      box.textContent = grid[attempt][col];
      box.classList.toggle('filled', !!grid[attempt][col]);
      box.classList.add('selected');
    }
  }
}

function submitAttempt() {
  if (tabSwitchDetected) return;
  
  const answer = quiz[currentQuestion].answer;
  const guess = currentInput.toUpperCase();
  const answerArr = answer.split('');
  const guessArr = guess.split('');
  const result = Array(answer.length).fill('absent');
  const answerUsed = Array(answer.length).fill(false);

  // First pass: correct
  for (let i = 0; i < answer.length; i++) {
    if (guessArr[i] === answerArr[i]) {
      result[i] = 'correct';
      answerUsed[i] = true;
    }
  }
  // Second pass: present
  for (let i = 0; i < answer.length; i++) {
    if (result[i] === 'correct') continue;
    for (let j = 0; j < answer.length; j++) {
      if (!answerUsed[j] && guessArr[i] === answerArr[j]) {
        result[i] = 'present';
        answerUsed[j] = true;
        break;
      }
    }
  }
  // Animate and color boxes
  const rowDivs = wordleGrid.querySelectorAll('.wordle-row');
  const rowDiv = rowDivs[attempt];
  for (let i = 0; i < answer.length; i++) {
    const box = rowDiv.children[i];
    box.classList.add(result[i]);
    // Animate flip
    setTimeout(() => {
      box.classList.add('flip');
    }, i * 150);
    // Update keyboard
    const letter = guessArr[i];
    if (!keyboardState[letter] || keyboardState[letter] === 'present' && result[i] === 'correct' || keyboardState[letter] === 'absent' && (result[i] === 'present' || result[i] === 'correct')) {
      keyboardState[letter] = result[i];
    }
  }
  renderKeyboard();
  
  // Check win/lose
  if (guess === answer) {
    score++;
    scoreEl.textContent = `Score: ${score}`;
    gameActive = false;
    setTimeout(() => {
      currentQuestion++;
      nextQuestion();
    }, 1200);
    clearInterval(timer);
    return;
  }
  attempt++;
  if (attempt >= 3) {
    markIncorrect();
    return;
  }
  currentInput = '';
}

function markIncorrect() {
  gameActive = false;
  // Show correct answer
  const answer = quiz[currentQuestion].answer;
  const rowDivs = wordleGrid.querySelectorAll('.wordle-row');
  const lastRow = rowDivs[attempt >= 3 ? 2 : attempt];
  for (let i = 0; i < answer.length; i++) {
    if (lastRow && !lastRow.children[i].textContent) {
      lastRow.children[i].textContent = answer[i];
      lastRow.children[i].classList.add('absent');
    }
    lastRow && lastRow.children[i].classList.add('reveal');
  }
  clearInterval(timer);
  setTimeout(() => {
    currentQuestion++;
    nextQuestion();
  }, 1500);
}

// Keyboard input
window.addEventListener('keydown', (e) => {
  if (!gameActive || tabSwitchDetected) return;
  
  let key = e.key.toUpperCase();
  if (key === 'BACKSPACE') key = '⌫';
  if (key === 'ENTER') key = '↵';
  if (key === '↵' || key === '⌫' || (/^[A-Z]$/.test(key) && key.length === 1)) {
    handleKey(key);
    e.preventDefault();
  }
});

// Update event listeners
startBtn.onclick = startGame;
restartBtn.onclick = () => {
  // Reset cheating detection
  tabSwitchDetected = false;
  gameActive = false;
  if (timer) clearInterval(timer);
  showScreen(document.getElementById('start-screen'));
  
  // Reset restart button text
  restartBtn.textContent = 'Try Again';
  restartBtn.style.display = '';
};

// INITIAL PAGE LOAD CHECK
window.addEventListener('DOMContentLoaded', () => {
  // Check if user has already taken the quiz on page load
  if (hasUserTakenQuiz()) {
    console.log('User has already taken quiz - redirecting to end screen');
    redirectToEndScreen('already_taken');
  } else {
    showScreen(document.getElementById('start-screen'));
  }
});

// Additional anti-cheating measures
window.addEventListener('beforeunload', (e) => {
  if (gameActive && !tabSwitchDetected) {
    // Mark quiz as taken and save incomplete attempt
    if (playerName.toUpperCase() !== 'ADMIN') {
      markQuizAsTaken();
    }
    saveResult(playerName, score, true);
  }
});

// Disable right-click context menu during game
document.addEventListener('contextmenu', (e) => {
  if (gameActive) {
    e.preventDefault();
  }
});

// Disable common keyboard shortcuts during game
window.addEventListener('keydown', (e) => {
  if (gameActive) {
    // Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'U')) {
      e.preventDefault();
      handleCheatingDetected();
    }
  }
});
