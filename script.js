document.addEventListener('DOMContentLoaded', () => {
    const difficultySelect = document.getElementById('difficulty');
    const colorThemeSelect = document.getElementById('color-theme');
    const newGameButton = document.getElementById('new-game');
    const gameBoard = document.getElementById('game-board');
    const movesElement = document.getElementById('moves');
    const totalMovesElement = document.getElementById('total-moves');
    const timerElement = document.getElementById('timer');
    const gameOverElement = document.getElementById('game-over');

    let timer;
    let moves = 0;
    let totalMoves = parseInt(localStorage.getItem('totalMoves'), 10) || 0;
    let startTime;
    let shuffledCards = [];
    let selectedCards = [];
    let difficulty = 2;

    difficultySelect.addEventListener('change', resetGame);
    colorThemeSelect.addEventListener('change', updateColorTheme);
    newGameButton.addEventListener('click', resetGame);
    gameBoard.addEventListener('click', startTimerOnce);
    window.addEventListener('storage', syncMovesAcrossWindows);
    window.addEventListener('beforeunload', handleWindowClose);

    incrementInstanceCounter();
    loadSettings();
    loadState();
    if (!startTime) resetGame();

    function incrementInstanceCounter() {
        const instanceCount = parseInt(localStorage.getItem('instanceCount'), 10) || 0;
        localStorage.setItem('instanceCount', instanceCount + 1);
    }

    function decrementInstanceCounter() {
        const instanceCount = parseInt(localStorage.getItem('instanceCount'), 10) || 0;
        if (instanceCount > 0) {
            localStorage.setItem('instanceCount', instanceCount - 1);
        }
    }

    function handleWindowClose() {
        decrementInstanceCounter();
        const instanceCount = parseInt(localStorage.getItem('instanceCount'), 10) || 0;
        if (instanceCount === 0) {
            localStorage.removeItem('moves');
            localStorage.removeItem('totalMoves');
        }
    }

    function saveState() {
        const gameState = {
            difficulty,
            elapsedTime: Date.now() - startTime,
            shuffledCards: [...gameBoard.children].map(card => ({
                value: card.dataset.value,
                classList: [...card.classList],
                textContent: card.textContent,
            })),
            selectedCards: selectedCards.map(card => card.dataset.value)
        };
        sessionStorage.setItem('gameState', JSON.stringify(gameState));
        localStorage.setItem('moves', moves);
        localStorage.setItem('totalMoves', totalMoves);
    }

    function loadState() {
        const savedState = JSON.parse(sessionStorage.getItem('gameState'));
        if (savedState && savedState.shuffledCards) {
            difficulty = savedState.difficulty;
            moves = parseInt(localStorage.getItem('moves'), 10) || 0;
            startTime = Date.now() - savedState.elapsedTime;
            shuffledCards = savedState.shuffledCards.map(cardData => {
                const cardElement = document.createElement('div');
                cardElement.classList.add('card', ...cardData.classList);
                cardElement.dataset.value = cardData.value;
                cardElement.textContent = cardData.textContent;
                cardElement.addEventListener('click', flipCard);
                return cardElement;
            });
            selectedCards = savedState.selectedCards.map(value => {
                return shuffledCards.find(card => card.dataset.value === value);
            });
            gameBoard.innerHTML = '';
            gameBoard.style.gridTemplateColumns = `repeat(${difficulty}, 1fr)`;
            gameBoard.className = `grid-container grid-${difficulty}x${difficulty}`;
            shuffledCards.forEach(card => gameBoard.appendChild(card));
            movesElement.textContent = `Moves: ${moves}`;
            totalMovesElement.textContent = `Total Moves: ${totalMoves}`;
            timer = setInterval(updateTimer, 1000);
            gameOverElement.style.display = 'none';
        }
    }

    function resetGame() {
        difficulty = parseInt(difficultySelect.value);
        sessionStorage.setItem('selectedDifficulty', difficulty);
        shuffledCards = shuffle(generateCards(difficulty));
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${difficulty}, 1fr)`;
        gameBoard.className = `grid-container grid-${difficulty}x${difficulty}`;
        shuffledCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card', 'hidden');
            cardElement.dataset.value = card;
            cardElement.addEventListener('click', flipCard);
            gameBoard.appendChild(cardElement);
        });
        clearInterval(timer);
        timerElement.textContent = 'Time: 0m 0s';
        startTime = null;
        gameOverElement.style.display = 'none';
        gameBoard.addEventListener('click', startTimerOnce);
        updateColorTheme();
        moves = 0;
        movesElement.textContent = `Moves: ${moves}`;
        totalMovesElement.textContent = `Total Moves: ${totalMoves}`;
        saveState();
    }

    function updateColorTheme() {
        const theme = colorThemeSelect.value;
        document.body.setAttribute('data-theme', theme);
        sessionStorage.setItem('selectedTheme', theme);
        const themeColorClass = `theme-color-${theme}`;
        document.body.classList.remove('theme-color-blue', 'theme-color-green', 'theme-color-purple');
        document.body.classList.add(themeColorClass);
    }

    function startTimerOnce() {
        if (!startTime) {
            startTime = Date.now();
            timer = setInterval(updateTimer, 1000);
        }
        gameBoard.removeEventListener('click', startTimerOnce);
    }

    function updateTimer() {
        const elapsedTime = Date.now() - startTime;
        const minutes = Math.floor(elapsedTime / 60000);
        const seconds = Math.floor((elapsedTime % 60000) / 1000);
        timerElement.textContent = `Time: ${minutes}m ${seconds}s`;
        saveState();
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
            saveState();
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
        totalMoves++;
        movesElement.textContent = `Moves: ${moves}`;
        totalMovesElement.textContent = `Total Moves: ${totalMoves}`;
        saveState();
        localStorage.setItem('moves', moves);
        localStorage.setItem('totalMoves', totalMoves);
    }

    function checkGameOver() {
        const matchedCards = document.querySelectorAll('.matched');
        if (matchedCards.length === shuffledCards.length) {
            clearInterval(timer);
            gameOverElement.style.display = 'block';
            sessionStorage.removeItem('gameState');
        }
    }

    function syncMovesAcrossWindows(event) {
        if (event.key === 'moves') {
            moves = parseInt(localStorage.getItem('moves'), 10) || 0;
            movesElement.textContent = `Moves: ${moves}`;
        }
        if (event.key === 'totalMoves') {
            totalMoves = parseInt(localStorage.getItem('totalMoves'), 10) || 0;
            totalMovesElement.textContent = `Total Moves: ${totalMoves}`;
        }
    }

    function loadSettings() {
        const savedTheme = sessionStorage.getItem('selectedTheme') || 'blue';
        colorThemeSelect.value = savedTheme;
        updateColorTheme();
        const savedDifficulty = sessionStorage.getItem('selectedDifficulty') || 2;
        difficultySelect.value = savedDifficulty;
    }
});