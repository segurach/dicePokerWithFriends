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

            // Reset scores for new game
            room.players.forEach(p => {
                p.score = 0;
                p.scorecard = {};
            });

            room.currentTurn = 0; // Index of player whose turn it is
            // Initial dice state (empty)
            room.dice = [0, 0, 0, 0, 0];
            room.rollsLeft = 3;

            io.to(roomCode).emit('game_started', {
                currentTurn: room.players[0].id,
                dice: room.dice,
                rollsLeft: room.rollsLeft
            });
            // Update players with reset scores
            io.to(roomCode).emit('player_joined', room.players);

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

            // Check for Game Over
            // Game is over if ALL players have filled ALL 13 categories
            const CATEGORIES_COUNT = 13;
            const allPlayersFinished = room.players.every(p =>
                p.scorecard && Object.keys(p.scorecard).length === CATEGORIES_COUNT
            );

            if (allPlayersFinished) {
                room.gameState = 'finished';
                // Determine winner
                const winner = room.players.reduce((prev, current) =>
                    (prev.score > current.score) ? prev : current
                );

                // Calculate XP for each player
                const playersWithXp = room.players.map(p => {
                    let xpGained = 50; // Base participation XP
                    let xpDetails = ['Participation (+50 XP)'];

                    // Win bonus
                    if (p.id === winner.id) {
                        xpGained += 100;
                        xpDetails.push('Winner Bonus (+100 XP) 🏆');
                    }

                    // High score bonus
                    if (p.score >= 200) {
                        xpGained += 50;
                        xpDetails.push('High Score > 200 (+50 XP) 🎯');
                    }

                    // Yahtzee bonus (check if they got a Yahtzee/Five of a Kind)
                    if (p.scorecard && p.scorecard['yahtzee'] === 50) {
                        xpGained += 50;
                        xpDetails.push('Five of a Kind (+50 XP) 🎲');
                    }

                    return { ...p, xpGained, xpDetails };
                });

                io.to(roomCode).emit('game_over', {
                    players: playersWithXp,
                    winner: winner
                });
            } else {
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
        }
    });

    socket.on('leave_game', ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (room) {
            // Find the leaving player's index
            const leavingPlayerIndex = room.players.findIndex(p => p.id === socket.id);

            if (leavingPlayerIndex !== -1) {
                const leavingPlayer = room.players[leavingPlayerIndex];
                console.log(`Player ${leavingPlayer.name} is leaving room ${roomCode}`);

                // Remove player from room
                room.players.splice(leavingPlayerIndex, 1);

                // If no players left, delete the room
                if (room.players.length === 0) {
                    rooms.delete(roomCode);
                    console.log(`Room ${roomCode} deleted (no players left)`);
                    return;
                }

                // If game is in progress, handle turn management
                if (room.gameStarted) {
                    // If it was the leaving player's turn, move to next player
                    if (room.currentTurn >= leavingPlayerIndex) {
                        room.currentTurn = room.currentTurn % room.players.length;
                    }

                    // Reset dice for current player
                    room.dice = [0, 0, 0, 0, 0];
                    room.rollsLeft = 3;

                    // Check if only one player remains
                    if (room.players.length === 1) {
                        // End game, remaining player wins
                        const winner = room.players[0];

                        // Calculate XP (Base + Win bonus)
                        const playerWithXp = {
                            ...winner,
                            xpGained: 150, // 50 base + 100 win
                            xpDetails: ['Forfeit Win (+150 XP) 🏆']
                        };

                        io.to(roomCode).emit('game_over', {
                            players: [playerWithXp],
                            winner: winner
                        });
                        room.gameStarted = false;
                    } else {
                        // Notify remaining players
                        io.to(roomCode).emit('player_left', {
                            playerName: leavingPlayer.name,
                            players: room.players,
                            currentTurn: room.players[room.currentTurn].id,
                            dice: room.dice,
                            rollsLeft: room.rollsLeft
                        });
                    }
                } else {
                    // Game not started, just update player list
                    io.to(roomCode).emit('player_left', {
                        playerName: leavingPlayer.name,
                        players: room.players
                    });
                }
            }
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
