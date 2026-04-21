const PIECES = {
    P: "\u2659",
    N: "\u2658",
    B: "\u2657",
    R: "\u2656",
    Q: "\u2655",
    K: "\u2654",
    p: "\u265F",
    n: "\u265E",
    b: "\u265D",
    r: "\u265C",
    q: "\u265B",
    k: "\u265A"
};

const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

class GameState {
    constructor() {
        this.board = [
            ["r", "n", "b", "q", "k", "b", "n", "r"],
            ["p", "p", "p", "p", "p", "p", "p", "p"],
            [".", ".", ".", ".", ".", ".", ".", "."],
            [".", ".", ".", ".", ".", ".", ".", "."],
            [".", ".", ".", ".", ".", ".", ".", "."],
            [".", ".", ".", ".", ".", ".", ".", "."],
            ["P", "P", "P", "P", "P", "P", "P", "P"],
            ["R", "N", "B", "Q", "K", "B", "N", "R"]
        ];

        this.whiteToMove = true;
        this.whiteKingMoved = false;
        this.blackKingMoved = false;
        this.whiteQueenRookMoved = false;
        this.whiteKingRookMoved = false;
        this.blackQueenRookMoved = false;
        this.blackKingRookMoved = false;
    }

    clone() {
        const next = new GameState();
        next.board = this.board.map((row) => row.slice());
        next.whiteToMove = this.whiteToMove;
        next.whiteKingMoved = this.whiteKingMoved;
        next.blackKingMoved = this.blackKingMoved;
        next.whiteQueenRookMoved = this.whiteQueenRookMoved;
        next.whiteKingRookMoved = this.whiteKingRookMoved;
        next.blackQueenRookMoved = this.blackQueenRookMoved;
        next.blackKingRookMoved = this.blackKingRookMoved;
        return next;
    }

    pieceAt(row, col) {
        return this.board[row][col];
    }

    generateLegalMoves() {
        const pseudoMoves = this.generatePseudoMoves(this.whiteToMove);
        return pseudoMoves.filter((move) => {
            const next = this.clone();
            next.applyMove(move);
            return !next.isInCheck(!next.whiteToMove);
        });
    }

    generatePseudoMoves(white) {
        const moves = [];

        for (let row = 0; row < 8; row += 1) {
            for (let col = 0; col < 8; col += 1) {
                const piece = this.board[row][col];
                if (piece === ".") {
                    continue;
                }
                if (white && !this.isWhitePiece(piece)) {
                    continue;
                }
                if (!white && !this.isBlackPiece(piece)) {
                    continue;
                }

                switch (piece.toLowerCase()) {
                    case "p":
                        this.addPawnMoves(moves, row, col, white);
                        break;
                    case "n":
                        this.addKnightMoves(moves, row, col);
                        break;
                    case "b":
                        this.addSlidingMoves(moves, row, col, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
                        break;
                    case "r":
                        this.addSlidingMoves(moves, row, col, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
                        break;
                    case "q":
                        this.addSlidingMoves(moves, row, col, [
                            [-1, -1],
                            [-1, 1],
                            [1, -1],
                            [1, 1],
                            [-1, 0],
                            [1, 0],
                            [0, -1],
                            [0, 1]
                        ]);
                        break;
                    case "k":
                        this.addKingMoves(moves, row, col, white);
                        break;
                }
            }
        }

        return moves;
    }

    applyMove(move) {
        const piece = this.board[move.fromRow][move.fromCol];
        const captured = this.board[move.toRow][move.toCol];

        this.updateCastlingStateForMove(piece, move.fromRow, move.fromCol);
        this.updateCastlingStateForCapture(captured, move.toRow, move.toCol);

        this.board[move.fromRow][move.fromCol] = ".";
        this.board[move.toRow][move.toCol] = piece;

        if ((piece === "K" || piece === "k") && Math.abs(move.toCol - move.fromCol) === 2) {
            this.moveRookForCastle(move);
        }

        if (piece === "P" && move.toRow === 0) {
            this.board[move.toRow][move.toCol] = "Q";
        } else if (piece === "p" && move.toRow === 7) {
            this.board[move.toRow][move.toCol] = "q";
        } else if (move.promotion) {
            this.board[move.toRow][move.toCol] = move.promotion;
        }

        this.whiteToMove = !this.whiteToMove;
    }

    isInCheck(white) {
        const king = white ? "K" : "k";

        for (let row = 0; row < 8; row += 1) {
            for (let col = 0; col < 8; col += 1) {
                if (this.board[row][col] === king) {
                    return this.isSquareAttacked(row, col, !white);
                }
            }
        }

        return false;
    }

    isSquareAttacked(row, col, byWhite) {
        const pawnRow = byWhite ? row + 1 : row - 1;
        if (this.inBounds(pawnRow, col - 1) && this.board[pawnRow][col - 1] === (byWhite ? "P" : "p")) {
            return true;
        }
        if (this.inBounds(pawnRow, col + 1) && this.board[pawnRow][col + 1] === (byWhite ? "P" : "p")) {
            return true;
        }

        const knightOffsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [rowOffset, colOffset] of knightOffsets) {
            const nextRow = row + rowOffset;
            const nextCol = col + colOffset;
            if (this.inBounds(nextRow, nextCol) && this.board[nextRow][nextCol] === (byWhite ? "N" : "n")) {
                return true;
            }
        }

        const bishopDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [rowStep, colStep] of bishopDirections) {
            let nextRow = row + rowStep;
            let nextCol = col + colStep;
            while (this.inBounds(nextRow, nextCol)) {
                const piece = this.board[nextRow][nextCol];
                if (piece !== ".") {
                    if (piece === (byWhite ? "B" : "b") || piece === (byWhite ? "Q" : "q")) {
                        return true;
                    }
                    break;
                }
                nextRow += rowStep;
                nextCol += colStep;
            }
        }

        const rookDirections = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [rowStep, colStep] of rookDirections) {
            let nextRow = row + rowStep;
            let nextCol = col + colStep;
            while (this.inBounds(nextRow, nextCol)) {
                const piece = this.board[nextRow][nextCol];
                if (piece !== ".") {
                    if (piece === (byWhite ? "R" : "r") || piece === (byWhite ? "Q" : "q")) {
                        return true;
                    }
                    break;
                }
                nextRow += rowStep;
                nextCol += colStep;
            }
        }

        for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
            for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
                if (rowOffset === 0 && colOffset === 0) {
                    continue;
                }
                const nextRow = row + rowOffset;
                const nextCol = col + colOffset;
                if (this.inBounds(nextRow, nextCol) && this.board[nextRow][nextCol] === (byWhite ? "K" : "k")) {
                    return true;
                }
            }
        }

        return false;
    }

    inBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    isWhitePiece(piece) {
        return piece >= "A" && piece <= "Z";
    }

    isBlackPiece(piece) {
        return piece >= "a" && piece <= "z";
    }

    sameSide(a, b) {
        if (a === "." || b === ".") {
            return false;
        }
        return (this.isWhitePiece(a) && this.isWhitePiece(b)) ||
            (this.isBlackPiece(a) && this.isBlackPiece(b));
    }

    addPawnMoves(moves, row, col, white) {
        const direction = white ? -1 : 1;
        const startRow = white ? 6 : 1;
        const promotionRow = white ? 0 : 7;
        const nextRow = row + direction;

        if (this.inBounds(nextRow, col) && this.board[nextRow][col] === ".") {
            moves.push({
                fromRow: row,
                fromCol: col,
                toRow: nextRow,
                toCol: col,
                promotion: nextRow === promotionRow ? (white ? "Q" : "q") : ""
            });

            const jumpRow = row + (2 * direction);
            if (row === startRow && this.inBounds(jumpRow, col) && this.board[jumpRow][col] === ".") {
                moves.push({ fromRow: row, fromCol: col, toRow: jumpRow, toCol: col, promotion: "" });
            }
        }

        for (const colOffset of [-1, 1]) {
            const nextCol = col + colOffset;
            if (!this.inBounds(nextRow, nextCol)) {
                continue;
            }
            const target = this.board[nextRow][nextCol];
            if (target !== "." && !this.sameSide(this.board[row][col], target)) {
                moves.push({
                    fromRow: row,
                    fromCol: col,
                    toRow: nextRow,
                    toCol: nextCol,
                    promotion: nextRow === promotionRow ? (white ? "Q" : "q") : ""
                });
            }
        }
    }

    addKnightMoves(moves, row, col) {
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (const [rowOffset, colOffset] of offsets) {
            const nextRow = row + rowOffset;
            const nextCol = col + colOffset;
            if (!this.inBounds(nextRow, nextCol)) {
                continue;
            }
            const target = this.board[nextRow][nextCol];
            if (target === "." || !this.sameSide(this.board[row][col], target)) {
                moves.push({ fromRow: row, fromCol: col, toRow: nextRow, toCol: nextCol, promotion: "" });
            }
        }
    }

    addSlidingMoves(moves, row, col, directions) {
        for (const [rowStep, colStep] of directions) {
            let nextRow = row + rowStep;
            let nextCol = col + colStep;

            while (this.inBounds(nextRow, nextCol)) {
                const target = this.board[nextRow][nextCol];
                if (target === ".") {
                    moves.push({ fromRow: row, fromCol: col, toRow: nextRow, toCol: nextCol, promotion: "" });
                } else {
                    if (!this.sameSide(this.board[row][col], target)) {
                        moves.push({ fromRow: row, fromCol: col, toRow: nextRow, toCol: nextCol, promotion: "" });
                    }
                    break;
                }
                nextRow += rowStep;
                nextCol += colStep;
            }
        }
    }

    addKingMoves(moves, row, col, white) {
        for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
            for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
                if (rowOffset === 0 && colOffset === 0) {
                    continue;
                }
                const nextRow = row + rowOffset;
                const nextCol = col + colOffset;
                if (!this.inBounds(nextRow, nextCol)) {
                    continue;
                }
                const target = this.board[nextRow][nextCol];
                if (target === "." || !this.sameSide(this.board[row][col], target)) {
                    moves.push({ fromRow: row, fromCol: col, toRow: nextRow, toCol: nextCol, promotion: "" });
                }
            }
        }

        this.addCastlingMoves(moves, white);
    }

    addCastlingMoves(moves, white) {
        if (white) {
            if (this.whiteKingMoved || this.board[7][4] !== "K" || this.isInCheck(true)) {
                return;
            }
            if (!this.whiteKingRookMoved &&
                this.board[7][7] === "R" &&
                this.board[7][5] === "." &&
                this.board[7][6] === "." &&
                !this.isSquareAttacked(7, 5, false) &&
                !this.isSquareAttacked(7, 6, false)) {
                moves.push({ fromRow: 7, fromCol: 4, toRow: 7, toCol: 6, promotion: "" });
            }
            if (!this.whiteQueenRookMoved &&
                this.board[7][0] === "R" &&
                this.board[7][1] === "." &&
                this.board[7][2] === "." &&
                this.board[7][3] === "." &&
                !this.isSquareAttacked(7, 3, false) &&
                !this.isSquareAttacked(7, 2, false)) {
                moves.push({ fromRow: 7, fromCol: 4, toRow: 7, toCol: 2, promotion: "" });
            }
            return;
        }

        if (this.blackKingMoved || this.board[0][4] !== "k" || this.isInCheck(false)) {
            return;
        }
        if (!this.blackKingRookMoved &&
            this.board[0][7] === "r" &&
            this.board[0][5] === "." &&
            this.board[0][6] === "." &&
            !this.isSquareAttacked(0, 5, true) &&
            !this.isSquareAttacked(0, 6, true)) {
            moves.push({ fromRow: 0, fromCol: 4, toRow: 0, toCol: 6, promotion: "" });
        }
        if (!this.blackQueenRookMoved &&
            this.board[0][0] === "r" &&
            this.board[0][1] === "." &&
            this.board[0][2] === "." &&
            this.board[0][3] === "." &&
            !this.isSquareAttacked(0, 3, true) &&
            !this.isSquareAttacked(0, 2, true)) {
            moves.push({ fromRow: 0, fromCol: 4, toRow: 0, toCol: 2, promotion: "" });
        }
    }

    updateCastlingStateForMove(piece, fromRow, fromCol) {
        if (piece === "K") {
            this.whiteKingMoved = true;
        } else if (piece === "k") {
            this.blackKingMoved = true;
        } else if (piece === "R" && fromRow === 7 && fromCol === 0) {
            this.whiteQueenRookMoved = true;
        } else if (piece === "R" && fromRow === 7 && fromCol === 7) {
            this.whiteKingRookMoved = true;
        } else if (piece === "r" && fromRow === 0 && fromCol === 0) {
            this.blackQueenRookMoved = true;
        } else if (piece === "r" && fromRow === 0 && fromCol === 7) {
            this.blackKingRookMoved = true;
        }
    }

    updateCastlingStateForCapture(target, toRow, toCol) {
        if (target === "R" && toRow === 7 && toCol === 0) {
            this.whiteQueenRookMoved = true;
        } else if (target === "R" && toRow === 7 && toCol === 7) {
            this.whiteKingRookMoved = true;
        } else if (target === "r" && toRow === 0 && toCol === 0) {
            this.blackQueenRookMoved = true;
        } else if (target === "r" && toRow === 0 && toCol === 7) {
            this.blackKingRookMoved = true;
        }
    }

    moveRookForCastle(move) {
        if (move.toCol === 6) {
            this.board[move.toRow][5] = this.board[move.toRow][7];
            this.board[move.toRow][7] = ".";
            if (move.toRow === 7) {
                this.whiteKingRookMoved = true;
            } else {
                this.blackKingRookMoved = true;
            }
        } else if (move.toCol === 2) {
            this.board[move.toRow][3] = this.board[move.toRow][0];
            this.board[move.toRow][0] = ".";
            if (move.toRow === 7) {
                this.whiteQueenRookMoved = true;
            } else {
                this.blackQueenRookMoved = true;
            }
        }
    }
}

function evaluateBoard(state) {
    let score = 0;
    const centerSquares = new Set(["3,3", "3,4", "4,3", "4,4"]);

    for (let row = 0; row < 8; row += 1) {
        for (let col = 0; col < 8; col += 1) {
            const piece = state.pieceAt(row, col);
            if (piece === ".") {
                continue;
            }

            const value = PIECE_VALUES[piece.toLowerCase()] ?? 0;
            const centerBonus = centerSquares.has(`${row},${col}`) ? 16 : 0;
            const mobilityBonus = piece.toLowerCase() === "p" ? Math.abs((piece === "P" ? 6 : 1) - row) * 3 : 0;

            if (piece === piece.toUpperCase()) {
                score -= value + centerBonus + mobilityBonus;
            } else {
                score += value + centerBonus + mobilityBonus;
            }
        }
    }

    return score;
}

function minimax(state, depth, alpha, beta) {
    const legalMoves = state.generateLegalMoves();

    if (depth === 0 || legalMoves.length === 0) {
        if (legalMoves.length === 0) {
            if (state.isInCheck(state.whiteToMove)) {
                return state.whiteToMove ? 100000 + depth : -100000 - depth;
            }
            return 0;
        }
        return evaluateBoard(state);
    }

    const orderedMoves = legalMoves.slice().sort((left, right) => moveHeuristic(state, right) - moveHeuristic(state, left));

    if (state.whiteToMove) {
        let best = Number.POSITIVE_INFINITY;
        for (const move of orderedMoves) {
            const next = state.clone();
            next.applyMove(move);
            best = Math.min(best, minimax(next, depth - 1, alpha, beta));
            beta = Math.min(beta, best);
            if (beta <= alpha) {
                break;
            }
        }
        return best;
    }

    let best = Number.NEGATIVE_INFINITY;
    for (const move of orderedMoves) {
        const next = state.clone();
        next.applyMove(move);
        best = Math.max(best, minimax(next, depth - 1, alpha, beta));
        alpha = Math.max(alpha, best);
        if (beta <= alpha) {
            break;
        }
    }
    return best;
}

function moveHeuristic(state, move) {
    const target = state.pieceAt(move.toRow, move.toCol);
    const captureValue = target === "." ? 0 : PIECE_VALUES[target.toLowerCase()] ?? 0;
    const promotionValue = move.promotion ? 800 : 0;
    const centerShift = [3, 4].includes(move.toRow) && [3, 4].includes(move.toCol) ? 20 : 0;
    return captureValue + promotionValue + centerShift;
}

function chooseBotMove(state, depth) {
    const legalMoves = state.generateLegalMoves();
    const orderedMoves = legalMoves.slice().sort((left, right) => moveHeuristic(state, right) - moveHeuristic(state, left));
    let bestMove = orderedMoves[0];
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const move of orderedMoves) {
        const next = state.clone();
        next.applyMove(move);
        const score = minimax(next, depth - 1, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

function squareKey(row, col) {
    return `${row},${col}`;
}

function notationForSquare(row, col) {
    return `${String.fromCharCode(97 + col)}${8 - row}`;
}

function moveToText(move) {
    return `${notationForSquare(move.fromRow, move.fromCol)}-${notationForSquare(move.toRow, move.toCol)}`;
}

const boardElement = document.getElementById("board");
const statusLine = document.getElementById("status-line");
const messageLine = document.getElementById("message-line");
const moveList = document.getElementById("move-list");
const difficultySelect = document.getElementById("difficulty");
const newGameButton = document.getElementById("new-game");
const flipBoardButton = document.getElementById("flip-board");
const shareUrlInput = document.getElementById("share-url");
const copyLinkButton = document.getElementById("copy-link");
const shareHint = document.getElementById("share-hint");

let state = new GameState();
let selectedSquare = null;
let orientation = "white";
let moveHistory = [];
let legalMovesCache = state.generateLegalMoves();
let possibleTargets = new Map();
let lastMove = null;
let botThinking = false;
let gameOver = false;

function isLocalPreview() {
    const host = window.location.hostname;
    return window.location.protocol === "file:" ||
        host === "" ||
        host === "localhost" ||
        host === "127.0.0.1";
}

function updateSharePanel() {
    const previewUrl = "https://YOUR_USERNAME.github.io/cpp-chess-bot/";
    const isLocal = isLocalPreview();

    shareUrlInput.value = isLocal ? previewUrl : window.location.href;
    copyLinkButton.disabled = isLocal;
    shareHint.textContent = isLocal
        ? "After GitHub Pages deploy, your live link will look like this. Replace YOUR_USERNAME with your GitHub username."
        : "This is your live website. Copy it and send it to your friend.";
}

async function copyShareLink() {
    if (isLocalPreview()) {
        messageLine.textContent = "Deploy to GitHub Pages first, then this button will copy your public link.";
        return;
    }

    const url = window.location.href;

    if (navigator.share) {
        try {
            await navigator.share({
                title: "Mac Chess Bot",
                text: "Play this chess game against the bot.",
                url
            });
            messageLine.textContent = "Share sheet opened.";
            return;
        } catch (error) {
            if (error && error.name === "AbortError") {
                return;
            }
        }
    }

    try {
        await navigator.clipboard.writeText(url);
        copyLinkButton.textContent = "Copied";
        messageLine.textContent = "Link copied. Send it to your friend.";
        window.setTimeout(() => {
            copyLinkButton.textContent = "Copy Link";
        }, 1200);
    } catch (error) {
        shareUrlInput.focus();
        shareUrlInput.select();
        messageLine.textContent = "Copy the link from the field above.";
    }
}

function setPossibleTargets() {
    possibleTargets = new Map();
    if (!selectedSquare) {
        return;
    }

    for (const move of legalMovesCache) {
        if (move.fromRow === selectedSquare.row && move.fromCol === selectedSquare.col) {
            possibleTargets.set(squareKey(move.toRow, move.toCol), move);
        }
    }
}

function renderBoard() {
    boardElement.innerHTML = "";

    const displayRows = orientation === "white"
        ? [0, 1, 2, 3, 4, 5, 6, 7]
        : [7, 6, 5, 4, 3, 2, 1, 0];
    const displayCols = orientation === "white"
        ? [0, 1, 2, 3, 4, 5, 6, 7]
        : [7, 6, 5, 4, 3, 2, 1, 0];

    displayRows.forEach((row, visualRow) => {
        displayCols.forEach((col, visualCol) => {
            const square = document.createElement("button");
            square.type = "button";
            square.className = `square ${((row + col) % 2 === 0) ? "light" : "dark"}`;
            square.dataset.row = String(row);
            square.dataset.col = String(col);
            square.setAttribute("aria-label", notationForSquare(row, col));

            if (visualCol === 0) {
                square.dataset.rank = String(8 - row);
                const rankLabel = document.createElement("span");
                rankLabel.className = "rank-label";
                rankLabel.textContent = String(8 - row);
                square.append(rankLabel);
            }

            if (visualRow === 7) {
                const fileLabel = document.createElement("span");
                fileLabel.className = "file-label";
                fileLabel.textContent = String.fromCharCode(97 + col);
                square.append(fileLabel);
            }

            if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
                square.classList.add("selected");
            }

            if (lastMove &&
                ((lastMove.fromRow === row && lastMove.fromCol === col) ||
                    (lastMove.toRow === row && lastMove.toCol === col))) {
                square.classList.add("last-move");
            }

            const targetMove = possibleTargets.get(squareKey(row, col));
            if (targetMove) {
                const targetPiece = state.pieceAt(row, col);
                square.classList.add(targetPiece === "." ? "legal" : "capture");
            }

            const piece = state.pieceAt(row, col);
            if (piece !== ".") {
                const pieceSpan = document.createElement("span");
                pieceSpan.className = `piece ${piece === piece.toUpperCase() ? "white" : "black"}`;
                pieceSpan.textContent = PIECES[piece];
                square.append(pieceSpan);
            }

            square.addEventListener("click", onSquareClick);
            boardElement.append(square);
        });
    });
}

function renderMoves() {
    moveList.innerHTML = "";
    moveHistory.forEach((entry) => {
        const item = document.createElement("li");
        item.textContent = entry;
        moveList.append(item);
    });
}

function updateStatus() {
    if (gameOver) {
        return;
    }

    const turnText = state.whiteToMove ? "White to move." : "Black to move.";
    statusLine.textContent = botThinking ? "Black is thinking..." : turnText;

    if (state.isInCheck(state.whiteToMove)) {
        messageLine.textContent = state.whiteToMove
            ? "White is in check."
            : "Black is in check.";
        return;
    }

    messageLine.textContent = selectedSquare
        ? `Selected ${notationForSquare(selectedSquare.row, selectedSquare.col)}.`
        : "Click a piece, then click a highlighted square.";
}

function finishGame() {
    legalMovesCache = state.generateLegalMoves();
    if (legalMovesCache.length > 0) {
        return false;
    }

    gameOver = true;
    const checked = state.isInCheck(state.whiteToMove);
    if (checked) {
        statusLine.textContent = state.whiteToMove ? "Checkmate. Black wins." : "Checkmate. White wins.";
        messageLine.textContent = state.whiteToMove
            ? "The bot found mate."
            : "You checkmated the bot.";
    } else {
        statusLine.textContent = "Stalemate.";
        messageLine.textContent = "No legal moves remain.";
    }
    return true;
}

function syncView() {
    legalMovesCache = state.generateLegalMoves();
    setPossibleTargets();
    renderBoard();
    renderMoves();
    updateStatus();
    finishGame();
}

function addHistoryEntry(move, label) {
    moveHistory.push(`${label}: ${moveToText(move)}`);
}

function applyPlayerMove(move) {
    state.applyMove(move);
    lastMove = move;
    selectedSquare = null;
    addHistoryEntry(move, `White ${Math.ceil((moveHistory.length + 1) / 2)}`);
    syncView();
    triggerBotTurn();
}

function triggerBotTurn() {
    if (gameOver || state.whiteToMove) {
        return;
    }

    botThinking = true;
    updateStatus();

    window.setTimeout(() => {
        const depth = Number(difficultySelect.value);
        const botMove = chooseBotMove(state, depth);
        state.applyMove(botMove);
        lastMove = botMove;
        addHistoryEntry(botMove, `Black ${Math.ceil(moveHistory.length / 2)}`);
        botThinking = false;
        syncView();
    }, 260);
}

function onSquareClick(event) {
    if (botThinking || gameOver || !state.whiteToMove) {
        return;
    }

    const button = event.currentTarget;
    const row = Number(button.dataset.row);
    const col = Number(button.dataset.col);
    const piece = state.pieceAt(row, col);

    if (selectedSquare) {
        const selectedMove = possibleTargets.get(squareKey(row, col));
        if (selectedMove) {
            applyPlayerMove(selectedMove);
            return;
        }
    }

    if (piece !== "." && state.isWhitePiece(piece)) {
        if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
            selectedSquare = null;
        } else {
            selectedSquare = { row, col };
        }
        syncView();
        return;
    }

    selectedSquare = null;
    syncView();
}

function resetGame() {
    state = new GameState();
    selectedSquare = null;
    moveHistory = [];
    legalMovesCache = state.generateLegalMoves();
    possibleTargets = new Map();
    lastMove = null;
    botThinking = false;
    gameOver = false;
    syncView();
}

newGameButton.addEventListener("click", resetGame);
flipBoardButton.addEventListener("click", () => {
    orientation = orientation === "white" ? "black" : "white";
    syncView();
});
difficultySelect.addEventListener("change", updateStatus);
copyLinkButton.addEventListener("click", copyShareLink);

updateSharePanel();
syncView();
