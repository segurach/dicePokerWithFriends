import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, TouchableOpacity, ScrollView } from 'react-native';
import io from 'socket.io-client';

// REPLACE WITH YOUR LOCAL IP ADDRESS (e.g., 'http://192.168.1.15:3000')
// 'localhost' only works on iOS Simulator, NOT on Android Emulator or physical devices.
const SERVER_URL = 'http://192.168.1.20:3000';

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
          <TouchableOpacity
            key={index}
            onPress={() => isMyTurn && toggleDie(index)}
            disabled={value === 0}
            style={[
              styles.die,
              keptIndices.includes(index) && styles.dieKept,
              value === 0 && styles.dieEmpty
            ]}
          >
            <Text style={styles.dieText}>{value === 0 ? '?' : value}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.info}>Rolls left: {rollsLeft}</Text>

      {isMyTurn && rollsLeft > 0 && (
        <Button title="Roll Dice" onPress={rollDice} />
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
      <Text style={{ color: isConnected ? 'green' : 'red', marginBottom: 20 }}>
        {isConnected ? 'Connected to Server' : 'Disconnected (Check IP)'}
      </Text>

      {!currentRoom ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            value={playerName}
            onChangeText={setPlayerName}
          />
          <Button title="Create Room" onPress={createRoom} />

          <View style={styles.separator} />

          <TextInput
            style={styles.input}
            placeholder="Room Code"
            value={roomCode}
            onChangeText={setRoomCode}
            autoCapitalize="characters"
          />
          <Button title="Join Room" onPress={joinRoom} />
        </View>
      ) : (
        <View>
          <Text style={styles.roomCode}>Room: {currentRoom}</Text>
          <Text style={styles.subtitle}>Players:</Text>
          {players.map((p, i) => (
            <Text key={i} style={styles.player}>{p.name}</Text>
          ))}
          <View style={styles.separator} />
          <Button title="Start Game" onPress={startGame} />
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
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 300,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  separator: {
    height: 20,
  },
  roomCode: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'blue',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  player: {
    fontSize: 16,
    marginBottom: 5,
  },
  diceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  die: {
    width: 50,
    height: 50,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
  },
  dieKept: {
    backgroundColor: '#add8e6', // Light blue
    borderWidth: 2,
    borderColor: 'blue',
  },
  dieEmpty: {
    backgroundColor: '#e0e0e0',
    borderColor: '#999',
  },
  dieText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  info: {
    fontSize: 16,
    marginBottom: 20,
  },
  scorecard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    width: '48%', // 2 columns
    marginBottom: 8,
  },
  scoreRowFilled: {
    backgroundColor: '#e0e0e0',
  },
  totalRow: {
    width: '100%',
    backgroundColor: '#d0d0d0',
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#333',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
