import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, TouchableOpacity, ScrollView } from 'react-native';
import io from 'socket.io-client';

// REPLACE WITH YOUR LOCAL IP ADDRESS (e.g., 'http://192.168.1.15:3000')
// 'localhost' only works on iOS Simulator, NOT on Android Emulator or physical devices.
const SERVER_URL = 'http://192.168.1.20:3000';

// Visual Die Component
const Die = ({ value, isKept, isEmpty, onPress, disabled }) => {
  const getDots = (v) => {
    switch (v) {
      case 1: return [<View key="c" style={styles.dotCenter} />];
      case 2: return [<View key="tl" style={styles.dotTL} />, <View key="br" style={styles.dotBR} />];
      case 3: return [<View key="tl" style={styles.dotTL} />, <View key="c" style={styles.dotCenter} />, <View key="br" style={styles.dotBR} />];
      case 4: return [<View key="tl" style={styles.dotTL} />, <View key="tr" style={styles.dotTR} />, <View key="bl" style={styles.dotBL} />, <View key="br" style={styles.dotBR} />];
      case 5: return [<View key="tl" style={styles.dotTL} />, <View key="tr" style={styles.dotTR} />, <View key="c" style={styles.dotCenter} />, <View key="bl" style={styles.dotBL} />, <View key="br" style={styles.dotBR} />];
      case 6: return [
        <View key="tl" style={styles.dotTL} />, <View key="tr" style={styles.dotTR} />,
        <View key="ml" style={styles.dotML} />, <View key="mr" style={styles.dotMR} />,
        <View key="bl" style={styles.dotBL} />, <View key="br" style={styles.dotBR} />
      ];
      default: return [];
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.die,
        isKept && styles.dieKept,
        isEmpty && styles.dieEmpty
      ]}
    >
      {isEmpty ? (
        <Text style={styles.dieText}>?</Text>
      ) : (
        <View style={styles.dieInner}>
          {getDots(value)}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState('lobby'); // lobby, playing
  const [dice, setDice] = useState([0, 0, 0, 0, 0]);
  const [keptIndices, setKeptIndices] = useState([]);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [currentTurnId, setCurrentTurnId] = useState(null);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    console.log('Attempting to connect to:', SERVER_URL);
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setMyId(newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('room_created', (code) => {
      setCurrentRoom(code);
      setPlayers([{ name: playerName, id: newSocket.id }]);
    });

    newSocket.on('player_joined', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    newSocket.on('game_started', ({ currentTurn, dice, rollsLeft }) => {
      setGameState('playing');
      setCurrentTurnId(currentTurn);
      setDice(dice);
      setRollsLeft(rollsLeft);
      setKeptIndices([]);
    });

    newSocket.on('dice_updated', ({ dice, rollsLeft }) => {
      setDice(dice);
      setRollsLeft(rollsLeft);
    });

    newSocket.on('turn_updated', ({ currentTurn, dice, rollsLeft, players }) => {
      setCurrentTurnId(currentTurn);
      setDice(dice);
      setRollsLeft(rollsLeft);
      setKeptIndices([]);
      setPlayers(players); // Update scores
    });

    newSocket.on('error', (msg) => {
      Alert.alert('Error', msg);
    });

    return () => newSocket.disconnect();
  }, [playerName]); // Re-run if playerName changes (though mostly for initial setup)

  const createRoom = () => {
    if (!playerName) return Alert.alert('Error', 'Enter name first');
    socket.emit('create_room', playerName);
  };

  const joinRoom = () => {
    if (!playerName || !roomCode) return Alert.alert('Error', 'Enter name and code');
    socket.emit('join_room', { roomCode, playerName });
    setCurrentRoom(roomCode);
  };

  const startGame = () => {
    socket.emit('start_game', currentRoom);
  };

  const toggleDie = (index) => {
    // if (rollsLeft === 0) return; // Allow selection even after last roll for visual clarity
    if (dice[index] === 0) return; // Can't select empty die
    if (keptIndices.includes(index)) {
      setKeptIndices(keptIndices.filter(i => i !== index));
    } else {
      setKeptIndices([...keptIndices, index]);
    }
  };

  const rollDice = () => {
    socket.emit('roll_dice', { roomCode: currentRoom, keptIndices });
  };

  // Helper to calculate score locally for preview
  const calculateScore = (category, currentDice) => {
    const counts = {};
    currentDice.forEach(d => counts[d] = (counts[d] || 0) + 1);
    const sum = currentDice.reduce((a, b) => a + b, 0);
    const uniqueDice = [...new Set(currentDice)].sort((a, b) => a - b);

    const isConsecutive = (arr) => {
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i + 1] !== arr[i] + 1) return false;
      }
      return true;
    };

    let hasSmallStraight = false;
    if (uniqueDice.length >= 4) {
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
      case 'three_of_a_kind': return Object.values(counts).some(c => c >= 3) ? sum : 0;
      case 'four_of_a_kind': return Object.values(counts).some(c => c >= 4) ? sum : 0;
      case 'full_house':
        const values = Object.values(counts);
        return (values.includes(3) && values.includes(2)) || values.includes(5) ? 25 : 0;
      case 'small_straight': return hasSmallStraight ? 30 : 0;
      case 'large_straight': return hasLargeStraight ? 40 : 0;
      case 'chance': return sum;
      case 'yahtzee': return Object.values(counts).includes(5) ? 50 : 0;
      default: return 0;
    }
  };

  const submitScore = (category) => {
    const potentialScore = calculateScore(category, dice);
    Alert.alert(
      "Confirmer le score",
      `Marquer ${potentialScore} points pour ${category.toUpperCase().replace(/_/g, ' ')} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Valider",
          onPress: () => socket.emit('submit_score', { roomCode: currentRoom, category })
        }
      ]
    );
  };

  const isMyTurn = currentTurnId === myId;
  const myPlayer = players.find(p => p.id === myId);
  const myScorecard = myPlayer?.scorecard || {};

  const CATEGORIES = [
    'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
    'three_of_a_kind', 'four_of_a_kind', 'full_house',
    'small_straight', 'large_straight', 'chance', 'yahtzee'
  ];

  const renderGame = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Room: {currentRoom}</Text>
      <Text style={styles.subtitle}>
        {isMyTurn ? "It's YOUR turn!" : `Waiting for ${players.find(p => p.id === currentTurnId)?.name}...`}
      </Text>

      <View style={styles.diceContainer}>
        {dice.map((value, index) => (
          <Die
            key={index}
            value={value}
            isKept={keptIndices.includes(index)}
            isEmpty={value === 0}
            onPress={() => isMyTurn && toggleDie(index)}
            disabled={value === 0}
          />
        ))}
      </View>

      <Text style={styles.info}>Rolls left: {rollsLeft}</Text>

      {isMyTurn && rollsLeft > 0 && (
        <TouchableOpacity style={styles.rollButton} onPress={rollDice}>
          <Text style={styles.rollButtonText}>ROLL DICE 🎲</Text>
        </TouchableOpacity>
      )}

      <View style={styles.separator} />
      <Text style={styles.subtitle}>Scorecard</Text>
      <View style={styles.scorecard}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.scoreRow,
              myScorecard[cat] !== undefined && styles.scoreRowFilled
            ]}
            onPress={() => isMyTurn && myScorecard[cat] === undefined && submitScore(cat)}
            disabled={!isMyTurn || myScorecard[cat] !== undefined || rollsLeft === 3}
          >
            <Text style={styles.scoreLabel}>{cat.toUpperCase().replace(/_/g, ' ')}</Text>
            <Text style={styles.scoreValue}>
              {myScorecard[cat] !== undefined ? myScorecard[cat] : '-'}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={[styles.scoreRow, styles.totalRow]}>
          <Text style={[styles.scoreLabel, { fontWeight: 'bold' }]}>TOTAL</Text>
          <Text style={[styles.scoreValue, { fontWeight: 'bold' }]}>{myPlayer?.score || 0}</Text>
        </View>
      </View>
    </ScrollView>
  );
  const renderLobby = () => (
    <View style={styles.centerContent}>
      <Text style={styles.title}>Yahtzee Friends</Text>
      <Text style={{ color: isConnected ? '#4caf50' : '#f44336', marginBottom: 20, fontWeight: 'bold' }}>
        {isConnected ? '● Connected to Server' : '● Disconnected'}
      </Text>

      {!currentRoom ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            placeholderTextColor="#999"
            value={playerName}
            onChangeText={setPlayerName}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={createRoom}>
            <Text style={styles.buttonText}>Create Room</Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TextInput
            style={styles.input}
            placeholder="Room Code"
            placeholderTextColor="#999"
            value={roomCode}
            onChangeText={setRoomCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.secondaryButton} onPress={joinRoom}>
            <Text style={styles.buttonText}>Join Room</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ width: '100%', alignItems: 'center' }}>
          <Text style={styles.roomCode}>Room: {currentRoom}</Text>
          <Text style={styles.subtitle}>Players:</Text>
          {players.map((p, i) => (
            <Text key={i} style={styles.player}>{p.name}</Text>
          ))}
          <View style={styles.separator} />
          <TouchableOpacity style={styles.primaryButton} onPress={startGame}>
            <Text style={styles.buttonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {gameState === 'lobby' ? renderLobby() : renderGame()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a237e', // Dark Blue
    padding: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e8eaf6',
    marginBottom: 10,
    textAlign: 'center',
  },
  info: {
    fontSize: 16,
    color: '#c5cae9',
    marginBottom: 10,
    textAlign: 'center',
  },
  player: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 5,
  },
  roomCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffeb3b', // Yellow
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 300,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  separator: {
    height: 30,
  },
  // Buttons
  primaryButton: {
    backgroundColor: '#ff6f00', // Amber/Orange
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: '#5c6bc0', // Lighter Blue
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  rollButton: {
    backgroundColor: '#ff6f00',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignSelf: 'center',
    elevation: 5,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rollButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  // Dice
  diceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    marginTop: 10,
  },
  die: {
    width: 50,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dieInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  dieKept: {
    backgroundColor: '#b2dfdb', // Light Teal
    borderColor: '#00bfa5', // Teal
    borderWidth: 3,
    transform: [{ scale: 0.95 }], // Slight shrink effect
  },
  dieEmpty: {
    backgroundColor: '#cfd8dc', // Blue Grey
    borderColor: '#90a4ae',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dieText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#757575',
  },
  // Dots (Adjusted for 50x50 die)
  dotCenter: { position: 'absolute', top: 19, left: 19, width: 10, height: 10, borderRadius: 5, backgroundColor: 'black' },
  dotTL: { position: 'absolute', top: 6, left: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: 'black' },
  dotTR: { position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: 'black' },
  dotML: { position: 'absolute', top: 19, left: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: 'black' },
  dotMR: { position: 'absolute', top: 19, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: 'black' },
  dotBL: { position: 'absolute', bottom: 6, left: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: 'black' },
  dotBR: { position: 'absolute', bottom: 6, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: 'black' },
  // Scorecard
  scorecard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glassmorphism effect
    padding: 10,
    borderRadius: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '48%',
    marginBottom: 6,
    elevation: 2,
  },
  scoreRowFilled: {
    backgroundColor: '#e0e0e0',
    opacity: 0.8,
  },
  totalRow: {
    width: '100%',
    backgroundColor: '#ffeb3b', // Yellow for total
    marginTop: 10,
    borderWidth: 0,
    elevation: 4,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a237e',
  },
});
