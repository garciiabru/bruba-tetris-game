class Tetris {
    constructor() {
        this.canvas = document.getElementById('tetris');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPiece');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.BLOCK_SIZE = 30;
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        
        this.colors = [
            null,
            '#FF0D72', // I
            '#0DC2FF', // J
            '#0DFF72', // L
            '#F538FF', // O
            '#FF8E0D', // S
            '#FFE138', // T
            '#3877FF'  // Z
        ];
        
        this.pieces = [
            null,
            [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
            [[2, 0, 0], [2, 2, 2], [0, 0, 0]],                         // J
            [[0, 0, 3], [3, 3, 3], [0, 0, 0]],                         // L
            [[0, 4, 4], [0, 4, 4], [0, 0, 0]],                         // O
            [[0, 5, 5], [5, 5, 0], [0, 0, 0]],                         // S
            [[0, 6, 0], [6, 6, 6], [0, 0, 0]],                         // T
            [[7, 7, 0], [0, 7, 7], [0, 0, 0]]                          // Z
        ];
        
        this.player = {
            pos: {x: 0, y: 0},
            matrix: null,
            score: 0
        };
        
        this.nextPiece = null;
        
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        
        this.init();
    }
    
    init() {
        this.createPiece();
        this.updateScore();
        this.update();
        this.addEventListeners();
    }
    
    createPiece() {
        const piece = Math.floor(Math.random() * 7) + 1;
        this.player.matrix = this.pieces[piece];
        this.player.pos.y = 0;
        this.player.pos.x = Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.player.matrix[0].length / 2);
        
        if (this.nextPiece === null) {
            this.nextPiece = Math.floor(Math.random() * 7) + 1;
        }
        
        this.drawNextPiece();
        
        if (this.collide()) {
            this.gameOver = true;
            this.showGameOver();
        }
    }
    
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        const matrix = this.pieces[this.nextPiece];
        const offset = (this.nextCanvas.width - matrix[0].length * this.BLOCK_SIZE) / 2;
        
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.nextCtx.fillStyle = this.colors[value];
                    this.nextCtx.fillRect(
                        offset + x * this.BLOCK_SIZE,
                        y * this.BLOCK_SIZE,
                        this.BLOCK_SIZE,
                        this.BLOCK_SIZE
                    );
                }
            });
        });
    }
    
    collide() {
        const matrix = this.player.matrix;
        const pos = this.player.pos;
        
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < matrix[y].length; ++x) {
                if (matrix[y][x] !== 0 &&
                    (this.board[y + pos.y] === undefined ||
                     this.board[y + pos.y][x + pos.x] === undefined ||
                     this.board[y + pos.y][x + pos.x] !== 0)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    merge() {
        this.player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.board[y + this.player.pos.y][x + this.player.pos.x] = value;
                }
            });
        });
    }
    
    rotate() {
        const matrix = this.player.matrix;
        const N = matrix.length;
        
        // Transpose the matrix
        for (let y = 0; y < N; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        
        // Reverse each row
        matrix.forEach(row => row.reverse());
    }
    
    playerDrop() {
        this.player.pos.y++;
        if (this.collide()) {
            this.player.pos.y--;
            this.merge();
            this.createPiece();
            this.clearLines();
        }
        this.dropCounter = 0;
    }
    
    playerMove(dir) {
        this.player.pos.x += dir;
        if (this.collide()) {
            this.player.pos.x -= dir;
        }
    }
    
    playerRotate() {
        const pos = this.player.pos.x;
        let offset = 1;
        this.rotate();
        while (this.collide()) {
            this.player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.player.matrix[0].length) {
                this.rotate();
                this.rotate();
                this.rotate();
                this.player.pos.x = pos;
                return;
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        outer: for (let y = this.board.length - 1; y >= 0; --y) {
            for (let x = 0; x < this.board[y].length; ++x) {
                if (this.board[y][x] === 0) {
                    continue outer;
                }
            }
            
            const row = this.board.splice(y, 1)[0].fill(0);
            this.board.unshift(row);
            ++y;
            linesCleared++;
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateScore();
        }
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawMatrix(this.board, {x: 0, y: 0});
        this.drawMatrix(this.player.matrix, this.player.pos);
    }
    
    drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.ctx.fillStyle = this.colors[value];
                    this.ctx.fillRect(
                        (x + offset.x) * this.BLOCK_SIZE,
                        (y + offset.y) * this.BLOCK_SIZE,
                        this.BLOCK_SIZE,
                        this.BLOCK_SIZE
                    );
                }
            });
        });
    }
    
    update(time = 0) {
        if (this.gameOver) return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.playerDrop();
        }
        
        this.draw();
        requestAnimationFrame(this.update.bind(this));
    }
    
    showGameOver() {
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
    }
    
    reset() {
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.dropInterval = 1000;
        this.nextPiece = null;
        document.getElementById('gameOver').classList.add('hidden');
        this.createPiece();
        this.updateScore();
    }
    
    addEventListeners() {
        document.addEventListener('keydown', event => {
            if (this.gameOver) return;
            
            switch (event.keyCode) {
                case 37: // Left arrow
                    this.playerMove(-1);
                    break;
                case 39: // Right arrow
                    this.playerMove(1);
                    break;
                case 40: // Down arrow
                    this.playerDrop();
                    break;
                case 38: // Up arrow
                    this.playerRotate();
                    break;
                case 32: // Space
                    while (!this.collide()) {
                        this.player.pos.y++;
                    }
                    this.player.pos.y--;
                    this.merge();
                    this.createPiece();
                    this.clearLines();
                    break;
            }
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.reset();
        });
    }
}

// Start the game
const game = new Tetris(); 