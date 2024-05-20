// https://en.wikipedia.org/wiki/Minesweeper_(video_game)

/*
 Gameplay
 Minesweeper is a puzzle video game.
 In the game, mines (that resemble naval mines in the classic theme) are scattered throughout a board, which is divided into cells.
 1) Cells have three states: unopened, opened and flagged.
 2) An unopened cell is blank and clickable, while an opened cell is exposed.
 3) Flagged cells are those marked by the player to indicate a potential mine location.

 A player selects a cell to open it.
 If a player opens a mined cell, the game ends.
 Otherwise, the opened cell displays either a number, indicating the number of mines diagonally and/or adjacent to it, or a blank tile (or "0"), and all adjacent non-mined cells will automatically be opened.
 Players can also flag a cell, visualised by a flag being put on the location, to denote that they believe a mine to be in that place.
 Flagged cells are still considered unopened, and a player can click on them to open them.
 In some versions of the game when the number of adjacent mines is equal to the number of adjacent flagged cells, all adjacent non-flagged unopened cells will be opened, a process known as chording.
 */

/*
 Objective and strategy
 A game of Minesweeper begins when the player first selects a cell on a board.
 In some variants the first click is guaranteed to be safe, and some further guarantee that all adjacent cells are safe as well.
 During the game, the player uses information given from the opened cells to deduce further cells that are safe to open, iteratively gaining more information to solve the board.
 The player is also given the number of remaining mines in the board, known as the mine count, which is calculated as the total number of mines subtracted by the number of flagged cells (thus the mine count can be negative if too many flags have been placed).

 To win a game of Minesweeper, all non-mine cells must be opened without opening a mine.
 There is no score, but there is a timer recording the time taken to finish the game.
 Difficulty can be increased by adding mines or starting with a larger grid.
 Most variants of Minesweeper that are not played on a fixed board offer three default board configurations, usually known as Beginner, Intermediate, and Expert, in order of increasing difficulty.
 Beginner is usually on an 8x8 or 9x9 board containing 10 mines, Intermediate is usually on a 16x16 board with 40 mines and expert is usually on a 30x16 board with 99 mines; however, there is usually an option to customise board size and mine count.
 */

// Must install prompt-sync module before running the code
// npm install prompt-sync
const prompt = require("prompt-sync")();

// Game difficulty levels
class Difficulty {
    static #_BEGINNER = new Difficulty("Beginner", 8, 8, 10);
    static #_INTERMEDIATE = new Difficulty("Intermediate", 16, 16, 40);
    static #_EXPERT = new Difficulty("Expert", 30, 16, 99);

    #_name;
    #_rows;
    #_cols;
    #_mines;

    constructor(name, rows, cols, mines) {
        this.#_name = name;
        this.#_rows = rows;
        this.#_cols = cols;
        this.#_mines = mines;
    }

    static get BEGINNER() { return this.#_BEGINNER; }

    static get INTERMEDIATE() { return this.#_INTERMEDIATE; }

    static get EXPERT() { return this.#_EXPERT; }

    get name() { return this.#_name; }

    get rows() { return this.#_rows; }

    get cols() { return this.#_cols; }

    get mines() { return this.#_mines; }
}

// Cell State
class CellState {
    static UNOPENED = "X";
    static FLAGGED = "\x1b[33mF\x1b[0m";
    static MINE = "\x1b[31mM\x1b[0m";
    static NO_ADJACENT = " ";
    static ADJACENT = "\x1b[34m{0}\x1b[0m";
    #_isMine;
    #_isFlagged;
    #_isOpened;
    #_adjacentMines;
    #_currentState;
    #_defaultState;

    constructor() {
        this.#_isMine = false;
        this.#_isFlagged = false;
        this.#_isOpened = false;
        this.#_adjacentMines = 0;
        this.#_currentState = CellState.UNOPENED;
        this.#_defaultState = CellState.NO_ADJACENT;
    }

    get isMine() { return this.#_isMine; }

    set isMine(value) {
        this.#_isMine = value;

        if (this.#_isMine) {
            this.#_defaultState = CellState.MINE;
        } else {
            this.#_defaultState = CellState.NO_ADJACENT;
        }

        this.#_currentState = CellState.UNOPENED;
        this.#_adjacentMines = 0;
        this.#_isOpened = false;
        this.#_isFlagged = false;
    }

    get isFlagged() { return this.#_isFlagged; }

    set isFlagged(value) {
        if (this.#_isOpened) { return; }

        this.#_isFlagged = value;

        if (this.#_isFlagged) {
            this.#_currentState = CellState.FLAGGED;
        } else {
            this.#_currentState = CellState.UNOPENED;
        }
    }

    get isOpened() { return this.#_isOpened; }

    set isOpened(value) {
        this.#_isOpened = value;

        if (this.#_isOpened) {
            this.#_currentState = this.#_defaultState;
        } else {
            this.#_currentState = CellState.UNOPENED;
        }
    }

    get adjacentMines() { return this.#_adjacentMines; }

    set adjacentMines(value) {
        if (this.#_isMine) { return; }
        if (value < 0) { return; }

        this.#_adjacentMines = value;

        if (this.#_adjacentMines > 0) {
            this.#_defaultState = CellState.#formatAdjacent(CellState.ADJACENT, value);
        } else {
            this.#_defaultState = CellState.NO_ADJACENT;
        }

        if (this.#_isOpened) { this.#_currentState = this.#_defaultState; }
    }

    get currentState() { return this.#_currentState; }

    static #formatAdjacent = (template, ...args) => template.replace(/{(\d+)}/g, (match, index) => args[index]);
}

// Cell
class Cell {
    #_row;
    #_col;
    #_state;

    constructor(row, col) {
        this.#_row = row;
        this.#_col = col;
        this.#_state = new CellState();
    }

    get row() { return this.#_row; }

    get col() { return this.#_col; }

    get state() { return this.#_state; }
}

// The game board is a grid of cells with mines placed randomly except the initial cell
class Board {

    // 8 directions: top-left, top, top-right, left, right, bottom-left, bottom, bottom-right
    static #_directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    // Game board properties
    #_difficulty;
    #_rows;
    #_cols;
    #_mines;
    #_cells;
    #_minesList;
    #_flags;
    #_openedCells;
    #_isGameOver;
    #_isGameWon;
    #_startTime;
    #_endTime;

    // Initialize the board with a difficulty level
    constructor(difficulty) {
        this.#_difficulty = difficulty.name;
        this.#_rows = difficulty.rows;
        this.#_cols = difficulty.cols;
        this.#_mines = difficulty.mines;
        this.reset();
    }

    get rows() { return this.#_rows; }

    get cols() { return this.#_cols; }

    get difficulty() { return this.#_difficulty; }

    // Return the board columns indices
    static #getColumnIndices(length) {
        let line = "    ";

        for (let col = 1; col <= length; col++) {
            line += `${ col }`.padEnd(6, " ");
        }
        return line
    }

    // Return the board row line
    static #getRowLine(length) {
        let line = "  ";

        for (let j = 0; j < length; j++) {
            line += "-----";
            if (j < length - 1) { line += "+"; }
        }
        return line;
    }

    // Start the game
    startGame(row, col) {
        if (row < 0 || row >= this.#_rows || col < 0 || col >= this.#_cols) {
            throw new RangeError(`Invalid cell position: row: ${ row }, col: ${ col }`);
        }

        this.reset();
        this.#placeMines(row, col);
        this.#_startTime = new Date();
    }

    // Restart the game
    reset() {
        this.#_cells = [];
        this.#_minesList = [];
        this.#_flags = 0;
        this.#_openedCells = 0;
        this.#_isGameOver = false;
        this.#_isGameWon = false;
        this.#_startTime = null;
        this.#_endTime = null;
        this.#init();
    }

    // Initialize the board
    #init() {
        for (let row = 0; row < this.#_rows; row++) {
            this.#_cells[row] = [];

            for (let col = 0; col < this.#_cols; col++) {
                this.#_cells[row][col] = new Cell(row, col);
            }
        }
    }

    #getAdjacentCells(row, col) {
        let adjacentCells = [];
        for (let [dirRow, dirCol] of Board.#_directions) {
            let newRow = row + dirRow;
            let newCol = col + dirCol;

            if (newRow < 0 || newRow >= this.#_rows) { continue; }
            if (newCol < 0 || newCol >= this.#_cols) { continue; }

            adjacentCells.push([newRow, newCol]);
        }
        return adjacentCells;
    }

    static #shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    #buildCellsListWithoutMines(excludeCells) {
        let cellsList = [];

        for (let row = 0; row < this.#_rows; row++) {
            for (let col = 0; col < this.#_cols; col++) {
                let strCell = `${ row },${ col }`;

                if (excludeCells.has(strCell)) { continue; }
                cellsList.push([row, col]);
            }
        }
        return cellsList;
    }

    // Place mines randomly except the initial cell
    #placeMines(initialRow, initialCol) {
        let mines = this.#_mines;

        // Exclude the initial cell and its adjacent cells
        let adjacentCells = this.#getAdjacentCells(initialRow, initialCol);

        Board.#shuffleArray(adjacentCells);
        let numberOfAdjacentCells = Math.floor(Math.random() * adjacentCells.length) + 1;
        adjacentCells = adjacentCells.slice(0, numberOfAdjacentCells);
        let excludeCells = new Set([`${ initialRow },${ initialCol }`, ...adjacentCells.map(([row, col]) => `${ row },${ col }`)]);

        let cellList = this.#buildCellsListWithoutMines(new Set(excludeCells));
        Board.#shuffleArray(cellList);

        for (let i = 0; i < mines; i++) {
            let [row, col] = cellList[i];
            let cell = this.#_cells[row][col];
            cell.state.isMine = true;
            this.#_minesList.push([row, col]);
        }

        this.#calculateAdjacentMines();
    }

    // Calculate adjacent mines for each cell
    #calculateAdjacentMines() {
        for (let [row, col] of this.#_minesList) {
            for (let [dirRow, dirCol] of Board.#_directions) {
                let newRow = row + dirRow;
                let newCol = col + dirCol;

                if (newRow < 0 || newRow >= this.#_rows) { continue;}
                if (newCol < 0 || newCol >= this.#_cols) { continue; }

                let cell = this.#_cells[newRow][newCol];
                if (cell.state.isMine) { continue; }
                cell.state.adjacentMines++;
            }
        }
    }

    // Open a cell
    openCell(row, col) {
        if (this.#_isGameOver || this.#_isGameWon) { return; }
        if (row < 0 || row >= this.#_rows || col < 0 || col >= this.#_cols) {
            throw new RangeError(`Invalid cell position: row: ${ row }, col: ${ col }`);
        }

        let cell = this.#_cells[row][col];
        if (cell.state.isOpened) { return; }

        if (cell.state.isMine) {
            this.#_isGameOver = true;
            this.#_endTime = new Date();
            this.#openAllMines();
            return;
        }

        cell.state.isOpened = true;
        this.#_openedCells++;

        if (cell.state.adjacentMines === 0) {
            this.#openAdjacentCells(row, col);
        }

        if (this.#_openedCells === (this.#_rows * this.#_cols) - this.#_mines) {
            this.#_isGameWon = true;
        }
    }

    // Open adjacent cells
    #openAdjacentCells(row, col) {
        if (row < 0 || row >= this.#_rows) { return; }
        if (col < 0 || col >= this.#_cols) { return; }

        for (let [dirRow, dirCol] of Board.#_directions) {
            let newRow = row + dirRow;
            let newCol = col + dirCol;

            if (newRow < 0 || newRow >= this.#_rows) { continue; }
            if (newCol < 0 || newCol >= this.#_cols) { continue; }

            let cell = this.#_cells[newRow][newCol];
            if (cell.state.isOpened || cell.state.isFlagged) { continue; }
            if (cell.state.isMine) { continue; }

            this.openCell(newRow, newCol);
        }
    }

    // Toggle flag on a cell
    toggleFlag(row, col) {
        if (row < 0 || row >= this.#_rows || col < 0 || col >= this.#_cols) {
            throw new RangeError(`Invalid cell position: row: ${ row }, col: ${ col }`);
        }

        if (this.#_isGameOver || this.#_isGameWon) { return; }

        let cell = this.#_cells[row][col];
        if (cell.state.isOpened) { return; }

        cell.state.isFlagged = !cell.state.isFlagged;
        this.#_flags += cell.state.isFlagged ? 1 : -1;
    }

    // Open all mines
    #openAllMines() {
        this.#_minesList.forEach(([row, col]) => this.#_cells[row][col].state.isOpened = true);
    }

    // Get game status
    #getGameStatus = () => ({
        isGameOver: this.#_isGameOver,
        isGameWon:  this.#_isGameWon
    });

    // Get game board
    getGameBoard() {
        let board = [];

        for (let row = 0; row < this.#_rows; row++) {
            board[row] = [];

            for (let col = 0; col < this.#_cols; col++) {
                board[row][col] = this.#_cells[row][col].state;
            }
        }
        return board;
    }

    // Get game time in seconds
    #gameTimeInSecond() {
        if (this.#_startTime === null) { return 0; }

        let endTime = this.#_endTime === null ? new Date() : this.#_endTime;
        return Math.floor((endTime.getTime() - this.#_startTime.getTime()) / 1000);
    }

    #getRemainingMines() { return this.#_mines - this.#_flags; }

    // Get game stats
    #getGameStats = () => ({
        flags:            this.#_flags,
        openedCells:      this.#_openedCells,
        remainingMines:   this.#getRemainingMines(),
        gameTimeInSecond: this.#gameTimeInSecond()
    });

    // Get game info
    getGameInfo = () => ({
        difficulty: this.#_difficulty,
        status:     this.#getGameStatus(),
        stats:      this.#getGameStats(),
        board:      this.getGameBoard()
    });

    // numbers for opened cells with adjacent mines - blue
    toString() {
        let board = this.getGameBoard();
        let rows = board.length;
        let cols = board[0].length;
        let stringArray = [];

        stringArray.push(Board.#getColumnIndices(cols));
        stringArray.push(Board.#getRowLine(cols));

        for (let row = 0; row < rows; row++) {
            let line = `${ row + 1 }`.padEnd(3, " ");

            for (let col = 0; col < cols; col++) {
                line += ` ${ board[row][col].currentState }`;

                if (col < cols - 1) { line += "  | "; }
            }
            stringArray.push(line);
            if (row < rows - 1) { stringArray.push(Board.#getRowLine(cols));}
        }
        return stringArray.join("\n");
    }

    // Print game info
    printGameInfo() {
        let info = this.getGameInfo();
        console.log("Difficulty:", info.difficulty);
        console.log("Game Status:",
                    info.status.isGameOver ? "Game Over" : (info.status.isGameWon ? "Game Won" : "In Progress"));

        console.log("Game Time:", info.stats.gameTimeInSecond, "seconds");
        console.log("Opened Cells:", info.stats.openedCells);
        console.log("Remaining Mines:", info.stats.remainingMines);
        console.log("Flags:", info.stats.flags);
    }
}

// Start the Minesweeper game
function start() {

    while (true) {
        let exit = false;
        let board = null;

        console.clear();
        while (!exit) {
            console.log("Welcome to Minesweeper Game\n");
            console.log("Choose a difficulty level:");
            console.log("1. Beginner");
            console.log("2. Intermediate");
            console.log("3. Expert");
            console.log("4. Exit");

            let choice = parseInt(prompt("Enter your choice: "), 10);

            switch (choice) {
                case 1:
                    board = new Board(Difficulty.BEGINNER);
                    exit = true;
                    break;
                case 2:
                    board = new Board(Difficulty.INTERMEDIATE);
                    exit = true;
                    break;
                case 3:
                    board = new Board(Difficulty.EXPERT);
                    exit = true;
                    break;
                case 4:
                    console.log("\nExiting Minesweeper Game...");
                    return;
                default:
                    console.clear();
                    console.log("Invalid choice. Please try again.\n");
            }
        }

        console.clear();
        let gameInfo = board.getGameInfo();
        let gameWon = gameInfo.status.isGameWon;
        let gameOver = gameInfo.status.isGameOver;
        let firstMove = true;

        while (!gameWon && !gameOver) {
            console.clear();
            board.printGameInfo();
            console.log("\n\n" + board.toString() + "\n");

            let row = parseInt(prompt("Enter row number: ")) - 1;
            let col = parseInt(prompt("Enter column number: ")) - 1;
            let action = parseInt(prompt("Enter action (1: Open, 2: Flag): "));

            if (row < 0 || row >= board.rows || col < 0 || col >= board.cols) {
                console.log("Invalid cell position. Please try again.");
                continue;
            }

            if (firstMove) {
                board.startGame(row, col);
                firstMove = false;
            }

            if (action === 1) {
                board.openCell(row, col);
            } else if (action === 2) {
                board.toggleFlag(row, col);
            } else {
                console.log("Invalid action. Please try again.");
            }

            let gameInfo = board.getGameInfo();
            gameWon = gameInfo.status.isGameWon;
            gameOver = gameInfo.status.isGameOver;
        }

        console.clear();
        board.printGameInfo();
        console.log("\n\n" + board.toString());
        console.log("\n");
        console.log(gameWon ? "Congratulations! You won the game." : "Game Over! You lost the game.");
        let playAgain = prompt("Do you want to play again? (Y/N): ");
        if (playAgain.toLowerCase() !== "y") {
            console.log("\nExiting Minesweeper Game...");
            return;
        }
    }
}

// Start the Minesweeper game
start();