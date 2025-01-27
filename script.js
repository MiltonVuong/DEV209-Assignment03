const difficultySelect = document.getElementById('difficulty');
const colorThemeSelect = document.getElementById('color-theme');
const newGameButton = document.getElementById('new-game');
const gameBoard = document.getElementById('game-board');
const movesElement = document.getElementById('moves');
const timerElement = document.getElementById('timer');
const gameOverElement = document.getElementById('game-over');

let timer;
let moves = 0;
let startTime;
let shuffledCards = [];
let selectedCards = [];
let difficulty = 2;

difficultySelect.addEventListener('change', resetGame);
colorThemeSelect.addEventListener('change', updateColorTheme);
newGameButton.addEventListener('click', resetGame);
gameBoard.addEventListener('click', startTimerOnce);

function resetGame() {
    difficulty = parseInt(difficultySelect.value);
    shuffledCards = shuffle(generateCards(difficulty));
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${difficulty}, 1fr)`;

    gameBoard.className = 'grid-container';
    if (difficulty === 2) {
        gameBoard.classList.add('grid-2x2');
    } else if (difficulty === 4) {
        gameBoard.classList.add('grid-4x4');
    } else if (difficulty === 6) {
        gameBoard.classList.add('grid-6x6');
    }

    shuffledCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card', 'hidden');
        cardElement.dataset.value = card;
        cardElement.addEventListener('click', flipCard);
        gameBoard.appendChild(cardElement);
    });
    moves = 0;
    movesElement.textContent = 'Moves: 0';
    clearInterval(timer);
    timerElement.textContent = 'Time: 0m 0s';
    startTime = null;
    gameOverElement.style.display = 'none';
    gameBoard.addEventListener('click', startTimerOnce);
    updateColorTheme();
}

function updateColorTheme() {
    document.body.className = colorThemeSelect.value;

    const themeColorClass = `theme-color-${colorThemeSelect.value}`;
    document.body.classList.remove('theme-color-blue', 'theme-color-green', 'theme-color-black');
    document.body.classList.add(themeColorClass);

    if (!colorThemeSelect.value) {
        document.body.className = 'black';
    }
}

function startTimerOnce() {
    if (!startTime) {
        startTime = Date.now();
        timer = setInterval(updateTimer, 1000);
    }
    gameBoard.removeEventListener('click', startTimerOnce);
}

function updateTimer() {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    timerElement.textContent = `Time: ${minutes}m ${seconds}s`;
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function generateCards(size) {
    const cards = [];
    const numPairs = (size * size) / 2;
    for (let i = 0; i < numPairs; i++) {
        cards.push(String.fromCharCode(65 + i));
        cards.push(String.fromCharCode(65 + i));
    }
    return cards;
}

function flipCard(event) {
    const cardElement = event.target;
    if (selectedCards.length < 2 && !cardElement.classList.contains('matched') && !cardElement.classList.contains('shown')) {
        cardElement.classList.remove('hidden');
        cardElement.classList.add('shown');
        cardElement.textContent = cardElement.dataset.value;
        selectedCards.push(cardElement);

        if (selectedCards.length === 2) {
            checkMatch();
        }
    }
}

function checkMatch() {
    const [card1, card2] = selectedCards;
    if (card1.dataset.value === card2.dataset.value) {
        card1.classList.add('matched');
        card2.classList.add('matched');
    } else {
        setTimeout(() => {
            card1.classList.add('hidden');
            card1.classList.remove('shown');
            card1.textContent = '';

            card2.classList.add('hidden');
            card2.classList.remove('shown');
            card2.textContent = '';
        }, 1000);
    }
    selectedCards = [];
    updateMoves();
    checkGameOver();
}

function updateMoves() {
    moves++;
    movesElement.textContent = `Moves: ${moves}`;
}

function checkGameOver() {
    const matchedCards = document.querySelectorAll('.matched');
    if (matchedCards.length === shuffledCards.length) {
        clearInterval(timer);
        gameOverElement.style.display = 'block';
    }
}

resetGame();
