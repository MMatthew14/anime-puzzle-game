// DOM Elements
const puzzleContainer = document.querySelector('.puzzle-container');
const puzzleGrid = document.querySelector('.puzzle-grid');
const difficultySelect = document.getElementById('difficulty');
const startButton = document.getElementById('start-game');
const showOriginalButton = document.getElementById('show-original');
const timerDisplay = document.querySelector('.timer');
const successMessage = document.querySelector('.success-message');
const completionTimeDisplay = document.getElementById('completion-time');

// Game variables
let puzzlePieces = [];
let gridSize = parseInt(difficultySelect.value);
let images = [
    SakurajimaMai.jpg
    annayanami.webp
];
let currentImageIndex = 0;
let timerInterval;
let seconds = 0;
let draggedPiece = null;
let offsetX, offsetY;
let originalImageShowing = false;
let gameActive = false;

// Initialize the game
function initGame() {
    // Reset variables
    puzzlePieces = [];
    seconds = 0;
    originalImageShowing = false;
    gameActive = true;
    clearInterval(timerInterval);
    timerDisplay.textContent = 'Time: 00:00';

    // Clear existing pieces
    puzzleContainer.querySelectorAll('.puzzle-piece').forEach(piece => piece.remove());

    // Set up puzzle grid
    gridSize = parseInt(difficultySelect.value);
    puzzleGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    puzzleGrid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

    // Choose a random image
    currentImageIndex = Math.floor(Math.random() * images.length);

    // Create the puzzle pieces
    createPuzzlePieces();

    // Start the timer
    startTimer();

    // Hide success message
    successMessage.style.display = 'none';
}

// Create puzzle pieces
function createPuzzlePieces() {
    const containerWidth = puzzleContainer.clientWidth;
    const containerHeight = puzzleContainer.clientHeight;
    const pieceWidth = containerWidth / gridSize;
    const pieceHeight = containerHeight / gridSize;

    // Create a temporary image element to get the full image
    const img = new Image();
    img.src = images[currentImageIndex];

    img.onload = () => {
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                // Create a piece
                const piece = document.createElement('div');
                piece.className = 'puzzle-piece';
                piece.style.width = `${pieceWidth}px`;
                piece.style.height = `${pieceHeight}px`;

                // Position the background image to show only the relevant part
                piece.style.backgroundImage = `url(${images[currentImageIndex]})`;
                piece.style.backgroundSize = `${containerWidth}px ${containerHeight}px`;
                piece.style.backgroundPosition = `-${col * pieceWidth}px -${row * pieceHeight}px`;

                // Store the original position data
                piece.dataset.row = row;
                piece.dataset.col = col;

                // Randomly position the piece within the container
                const randomTop = Math.floor(Math.random() * (containerHeight - pieceHeight));
                const randomLeft = Math.floor(Math.random() * (containerWidth - pieceWidth));
                piece.style.top = `${randomTop}px`;
                piece.style.left = `${randomLeft}px`;

                // Add the piece to the puzzle container
                puzzleContainer.appendChild(piece);

                // Add event listeners for dragging
                piece.addEventListener('mousedown', startDrag);
                piece.addEventListener('touchstart', startDrag, { passive: false });

                puzzlePieces.push(piece);
            }
        }
    };
}

// Start dragging a piece
function startDrag(e) {
    if (!gameActive) return;

    // Prevent default to stop scrolling on touch devices
    if (e.type === 'touchstart') {
        e.preventDefault();
    }

    draggedPiece = this;
    draggedPiece.classList.add('dragging');

    // Get the initial position of the piece
    const rect = draggedPiece.getBoundingClientRect();

    // Calculate the offset from the mouse/touch position to the corner of the piece
    if (e.type === 'mousedown') {
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    } else {
        offsetX = e.touches[0].clientX - rect.left;
        offsetY = e.touches[0].clientY - rect.top;
    }

    // Move the piece to the top layer
    puzzleContainer.appendChild(draggedPiece);

    // Add the move events for dragging
    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('touchmove', moveDrag, { passive: false });

    // Add the end events for dropping
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
}

// Move the dragged piece
function moveDrag(e) {
    if (!draggedPiece) return;

    e.preventDefault();

    const containerRect = puzzleContainer.getBoundingClientRect();
    let clientX, clientY;

    if (e.type === 'mousemove') {
        clientX = e.clientX;
        clientY = e.clientY;
    } else {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }

    let newLeft = clientX - containerRect.left - offsetX;
    let newTop = clientY - containerRect.top - offsetY;

    // Keep the piece within the container
    const pieceWidth = parseInt(draggedPiece.style.width);
    const pieceHeight = parseInt(draggedPiece.style.height);

    newLeft = Math.max(0, Math.min(newLeft, containerRect.width - pieceWidth));
    newTop = Math.max(0, Math.min(newTop, containerRect.height - pieceHeight));

    // Update the position
    draggedPiece.style.left = `${newLeft}px`;
    draggedPiece.style.top = `${newTop}px`;
}

// End dragging and check if the piece is in the correct position
function endDrag() {
    if (!draggedPiece) return;

    // Remove the move and end events
    document.removeEventListener('mousemove', moveDrag);
    document.removeEventListener('touchmove', moveDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchend', endDrag);

    // Check if the piece is close to its correct position
    const containerWidth = puzzleContainer.clientWidth;
    const containerHeight = puzzleContainer.clientHeight;
    const pieceWidth = containerWidth / gridSize;
    const pieceHeight = containerHeight / gridSize;

    const row = parseInt(draggedPiece.dataset.row);
    const col = parseInt(draggedPiece.dataset.col);

    const correctLeft = col * pieceWidth;
    const correctTop = row * pieceHeight;

    const currentLeft = parseInt(draggedPiece.style.left);
    const currentTop = parseInt(draggedPiece.style.top);

    // Define a threshold for "close enough" (10% of piece size)
    const threshold = Math.min(pieceWidth, pieceHeight) * 0.1;

    if (
        Math.abs(currentLeft - correctLeft) < threshold &&
        Math.abs(currentTop - correctTop) < threshold
    ) {
        // Snap to the correct position
        draggedPiece.style.left = `${correctLeft}px`;
        draggedPiece.style.top = `${correctTop}px`;
        draggedPiece.classList.add('placed');

        // Check if the puzzle is complete
        checkPuzzleCompletion();
    }

    draggedPiece.classList.remove('dragging');
    draggedPiece = null;
}

// Check if all pieces are in the correct position
function checkPuzzleCompletion() {
    const allPlaced = puzzlePieces.every(piece => piece.classList.contains('placed'));

    if (allPlaced) {
        // Stop the timer
        clearInterval(timerInterval);
        gameActive = false;

        // Show the success message
        successMessage.style.display = 'block';
        completionTimeDisplay.textContent = formatTime(seconds);
    }
}

// Format time as MM:SS
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Start the timer
function startTimer() {
    seconds = 0;
    timerDisplay.textContent = 'Time: 00:00';

    timerInterval = setInterval(() => {
        seconds++;
        timerDisplay.textContent = `Time: ${formatTime(seconds)}`;
    }, 1000);
}

// Show or hide the original image
function toggleOriginalImage() {
    if (!gameActive) return;

    originalImageShowing = !originalImageShowing;

    if (originalImageShowing) {
        // Show the original image
        puzzleContainer.style.backgroundImage = `url(${images[currentImageIndex]})`;
        puzzleContainer.style.backgroundSize = 'cover';

        // Hide the pieces temporarily
        puzzlePieces.forEach(piece => {
            piece.style.opacity = '0';
        });

        // Set a timeout to automatically hide the original image after 2 seconds
        setTimeout(() => {
            puzzleContainer.style.backgroundImage = 'none';
            puzzlePieces.forEach(piece => {
                piece.style.opacity = '1';
            });
            originalImageShowing = false;
        }, 2000);
    }
}

// Event listeners
startButton.addEventListener('click', initGame);
showOriginalButton.addEventListener('click', toggleOriginalImage);

// Make the container responsive
window.addEventListener('resize', () => {
    if (puzzlePieces.length === 0) return;

    const containerWidth = puzzleContainer.clientWidth;
    const containerHeight = puzzleContainer.clientHeight;
    const pieceWidth = containerWidth / gridSize;
    const pieceHeight = containerHeight / gridSize;

    puzzlePieces.forEach(piece => {
        // Update piece size
        piece.style.width = `${pieceWidth}px`;
        piece.style.height = `${pieceHeight}px`;

        // Update background size and position
        piece.style.backgroundSize = `${containerWidth}px ${containerHeight}px`;

        const row = parseInt(piece.dataset.row);
        const col = parseInt(piece.dataset.col);
        piece.style.backgroundPosition = `-${col * pieceWidth}px -${row * pieceHeight}px`;

        // If piece is placed, update its position
        if (piece.classList.contains('placed')) {
            piece.style.left = `${col * pieceWidth}px`;
            piece.style.top = `${row * pieceHeight}px`;
        }
    });
});

// Initialize the game when the page loads
window.addEventListener('load', initGame);
