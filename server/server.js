const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for dev
        methods: ["GET", "POST"]
    }
});

// Store rooms and game state
const rooms = new Map();

// Helper to generate room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Helper to roll dice
function generateRandomDice(currentDice, keptIndices) {
    return currentDice.map((val, idx) => {
        return keptIndices.includes(idx) ? val : Math.ceil(Math.random() * 6);
    });
}

// Calculate score based on category and dice
function calculateScore(category, dice) {
    const counts = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
    const sum = dice.reduce((a, b) => a + b, 0);
    const uniqueDice = [...new Set(dice)].sort((a, b) => a - b);

    // Helper for straights
    const isConsecutive = (arr) => {
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i + 1] !== arr[i] + 1) return false;
        }
        return true;
    };

    // Check for small straight (4 consecutive)
    let hasSmallStraight = false;
    if (uniqueDice.length >= 4) {
        // Check subsets of 4
        for (let i = 0; i <= uniqueDice.length - 4; i++) {
            if (isConsecutive(uniqueDice.slice(i, i + 4))) hasSmallStraight = true;
        }
    }

    const hasLargeStraight = uniqueDice.length === 5 && isConsecutive(uniqueDice);

    switch (category) {
        case 'ones': return (counts[1] || 0) * 1;
        case 'twos': return (counts[2] || 0) * 2;
        case 'threes': return (counts[3] || 0) * 3;
        case 'fours': return (counts[4] || 0) * 4;
        case 'fives': return (counts[5] || 0) * 5;
        case 'sixes': return (counts[6] || 0) * 6;

        case 'three_of_a_kind':
            return Object.values(counts).some(c => c >= 3) ? sum : 0;

        case 'four_of_a_kind':
            return Object.values(counts).some(c => c >= 4) ? sum : 0;

        case 'full_house':
            const values = Object.values(counts);
            return (values.includes(3) && values.includes(2)) || values.includes(5) ? 25 : 0;

        case 'small_straight':
            return hasSmallStraight ? 30 : 0;

        case 'large_straight':
            return hasLargeStraight ? 40 : 0;

        case 'chance': return sum;
        case 'yahtzee': return Object.values(counts).includes(5) ? 50 : 0;
        default: return 0;
    }
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create a new room
    socket.on('create_room', (playerName) => {
        const roomCode = generateRoomCode();
        rooms.set(roomCode, {
            players: [{ id: socket.id, name: playerName, score: 0 }],
            gameState: 'waiting', // waiting, playing, finished
            currentTurn: 0,
        });
        socket.join(roomCode);
        socket.emit('room_created', roomCode);
        console.log(`Room ${roomCode} created by ${playerName}`);
    });

    // Join an existing room
    socket.on('join_room', ({ roomCode, playerName }) => {
        const room = rooms.get(roomCode);
        if (room && room.gameState === 'waiting') {
            room.players.push({ id: socket.id, name: playerName, score: 0 });
            socket.join(roomCode);
            io.to(roomCode).emit('player_joined', room.players);
            console.log(`${playerName} joined room ${roomCode}`);
        } else {
            socket.emit('error', 'Room not found or game already started');
        }
    });

    // Start the game
    socket.on('start_game', (roomCode) => {
        const room = rooms.get(roomCode);
        if (room && room.players.length > 0) {
            room.gameState = 'playing';
            room.currentTurn = 0; // Index of player whose turn it is
            // Initial dice state (empty)
            room.dice = [0, 0, 0, 0, 0];
            room.rollsLeft = 3;

            io.to(roomCode).emit('game_started', {
                currentTurn: room.players[0].id,
                dice: room.dice,
                rollsLeft: room.rollsLeft
            });
            console.log(`Game started in room ${roomCode}`);
        }
    });

    // Roll dice
    socket.on('roll_dice', ({ roomCode, keptIndices }) => {
        const room = rooms.get(roomCode);
        if (room && room.gameState === 'playing' && room.rollsLeft > 0) {
            // Check if it's this player's turn
            const currentPlayer = room.players[room.currentTurn];
            if (socket.id !== currentPlayer.id) return;

            room.dice = generateRandomDice(room.dice, keptIndices);
            room.rollsLeft--;

            io.to(roomCode).emit('dice_updated', {
                dice: room.dice,
                rollsLeft: room.rollsLeft
            });
        }
    });

    // Submit Score
    socket.on('submit_score', ({ roomCode, category }) => {
        const room = rooms.get(roomCode);
        if (room && room.gameState === 'playing') {
            const currentPlayer = room.players[room.currentTurn];
            if (socket.id !== currentPlayer.id) return;

            // Prevent scoring without rolling
            if (room.rollsLeft === 3) {
                socket.emit('error', 'You must roll the dice first!');
                return;
            }

            // Calculate and record score
            const score = calculateScore(category, room.dice);
            // Initialize scorecard if missing
            if (!currentPlayer.scorecard) currentPlayer.scorecard = {};

            if (currentPlayer.scorecard[category] !== undefined) {
                socket.emit('error', 'Category already filled');
                return;
            }

            currentPlayer.scorecard[category] = score;
            currentPlayer.score += score;

            // Next turn
            room.currentTurn = (room.currentTurn + 1) % room.players.length;
            // Reset dice for next player
            room.dice = [0, 0, 0, 0, 0];
            room.rollsLeft = 3;

            io.to(roomCode).emit('turn_updated', {
                currentTurn: room.players[room.currentTurn].id,
                dice: room.dice,
                rollsLeft: room.rollsLeft,
                players: room.players // Send full player data to update scores
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // TODO: Handle player disconnect (remove from room, etc.)
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
