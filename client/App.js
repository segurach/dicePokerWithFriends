import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, TouchableOpacity, ScrollView, Animated, Easing, Dimensions } from 'react-native';
import io from 'socket.io-client';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import ConfettiCannon from 'react-native-confetti-cannon';
import Die from './components/Die';
import ScoreRow from './components/ScoreRow';
import { translations } from './translations';

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
  const keptIndicesRef = useRef([]); // Ref to access latest state in event listener
  const playerNameRef = useRef(''); // Ref to access latest player name in listener

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  const [rollsLeft, setRollsLeft] = useState(3);
  const [currentTurnId, setCurrentTurnId] = useState(null);
  const [myId, setMyId] = useState(null);

  // Language state and translation function
  const [language, setLanguage] = useState('fr'); // Default to French
  const t = (key) => translations[language][key];

  // Animation values
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const diceAnimValues = useRef(dice.map(() => new Animated.Value(0))).current;
  const confettiRef = useRef(null);

  // Sound & Haptics Helper
  const playSound = async (type) => {
    try {
      // Haptics
      if (type === 'roll') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (type === 'select') {
        Haptics.selectionAsync();
      } else if (type === 'score') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'game_over') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Audio
      const { sound } = await Audio.Sound.createAsync(
        type === 'roll' ? require('./assets/dice-roll.mp3') :
          type === 'score' ? require('./assets/score.wav') :
            type === 'game_over' ? require('./assets/score.wav') : null
      );
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing sound/haptics:', error);
    }
  };

  const runDiceAnimation = (indicesToSkip = []) => {
    const animations = diceAnimValues.map((animValue, index) => {
      if (!indicesToSkip.includes(index)) {
        animValue.setValue(0);
        return Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: 100, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: -1, duration: 100, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: 100, easing: Easing.linear, useNativeDriver: true }),
        ]);
      }
      return Animated.timing(animValue, { toValue: 0, duration: 0, useNativeDriver: true });
    });

    Animated.parallel(animations).start();
  };

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
      setPlayers([{ name: playerNameRef.current, id: newSocket.id }]);
    });

    // ... (other listeners)
    newSocket.on('player_joined', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    newSocket.on('game_started', ({ currentTurn, dice, rollsLeft }) => {
      setGameState('playing');
      setCurrentTurnId(currentTurn);
      setDice(dice);
      setRollsLeft(rollsLeft);
      setKeptIndices([]);
      keptIndicesRef.current = [];
    });

    newSocket.on('dice_updated', ({ dice, rollsLeft }) => {
      setDice(dice);
      setRollsLeft(rollsLeft);
      runDiceAnimation(keptIndicesRef.current); // Use ref to get latest kept indices
    });

    newSocket.on('turn_updated', ({ currentTurn, dice, rollsLeft, players }) => {
      setCurrentTurnId(currentTurn);
      setDice(dice);
      setRollsLeft(rollsLeft);
      setKeptIndices([]);
      keptIndicesRef.current = [];
      setPlayers(players); // Update scores
      // No animation here, as dice are reset for new turn
    });

    newSocket.on('game_over', ({ players, winner }) => {
      setPlayers(players);
      setGameState('finished');
      playSound('game_over');
      if (confettiRef.current) confettiRef.current.start();
      // Alert removed, handled by UI
    });

    newSocket.on('error', (msg) => {
      Alert.alert(t('error'), msg);
    });

    return () => newSocket.disconnect();
  }, []); // Empty dependency array to connect only once

  const createRoom = () => {
    if (!playerName) return Alert.alert(t('error'), t('enterNameFirst'));
    socket.emit('create_room', playerName);
  };

  const joinRoom = () => {
    if (!playerName || !roomCode) return Alert.alert(t('error'), t('enterNameAndCode'));
    socket.emit('join_room', { roomCode, playerName });
    setCurrentRoom(roomCode);
  };

  const startGame = () => {
    socket.emit('start_game', currentRoom);
  };

  const resetGame = () => {
    setGameState('lobby');
    setCurrentRoom(null);
    setPlayers([]);
    setRoomCode('');
    // Note: In a real app, we'd probably want a 'play again' feature in the same room
  };

  const toggleDie = (index) => {
    if (dice[index] === 0) return; // Can't select empty die
    playSound('select');
    let newKept;
    if (keptIndices.includes(index)) {
      newKept = keptIndices.filter(i => i !== index);
    } else {
      newKept = [...keptIndices, index];
    }
    setKeptIndices(newKept);
    keptIndicesRef.current = newKept; // Update ref
  };

  const rollDice = () => {
    playSound('roll');
    socket.emit('roll_dice', { roomCode: currentRoom, keptIndices });
  };

  // Helper to calculate score locally for preview
  const calculateScore = (category, currentDice) => {
    // ... (score calculation)
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
    const categoryName = t(category);
    Alert.alert(
      t('confirmScore'),
      t('scorePointsFor').replace('{score}', potentialScore).replace('{category}', categoryName),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('validate'),
          onPress: () => {
            playSound('score');
            if (category === 'yahtzee' && potentialScore === 50) {
              if (confettiRef.current) confettiRef.current.start();
            }
            socket.emit('submit_score', { roomCode: currentRoom, category });
          }
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
      <Text style={styles.title}>{t('room')}: {currentRoom}</Text>
      <Text style={styles.subtitle}>
        {isMyTurn ? t('itsYourTurn') : t('waitingForPlayer').replace('{player}', players.find(p => p.id === currentTurnId)?.name || 'player')}
      </Text>

      <View style={styles.diceContainer}>
        {dice.map((value, index) => {
          const rotation = diceAnimValues[index].interpolate({
            inputRange: [-1, 0, 1],
            outputRange: ['-15deg', '0deg', '15deg']
          });

          return (
            <Die
              key={index}
              value={value}
              isKept={keptIndices.includes(index)}
              isEmpty={value === 0}
              onPress={() => isMyTurn && toggleDie(index)}
              disabled={value === 0}
              animStyle={{ transform: [{ rotate: rotation }] }}
            />
          );
        })}
      </View>

      <Text style={styles.info}>{t('rollsLeft')}: {rollsLeft}</Text>

      {isMyTurn && (
        <TouchableOpacity
          style={[styles.rollButton, rollsLeft === 0 && styles.rollButtonDisabled]}
          onPress={rollDice}
          disabled={rollsLeft === 0}
        >
          <Text style={styles.rollButtonText}>
            {rollsLeft > 0 ? t('rollDice') : t('selectScore')}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.separator} />
      <Text style={styles.subtitle}>{t('scorecard')}</Text>
      <View style={styles.scorecard}>
        {CATEGORIES.map(cat => {
          const isFilled = myScorecard[cat] !== undefined;
          const showPreview = isMyTurn && !isFilled && rollsLeft < 3;
          const previewScore = showPreview ? calculateScore(cat, dice) : null;

          return (
            <ScoreRow
              key={cat}
              label={t(cat)}
              score={myScorecard[cat]}
              previewScore={previewScore}
              isFilled={isFilled}
              onPress={() => isMyTurn && !isFilled && submitScore(cat)}
              disabled={!isMyTurn || isFilled || rollsLeft === 3}
            />
          );
        })}
        <ScoreRow
          label={t('total')}
          score={myPlayer?.score || 0}
          isFilled={true}
          isTotal={true}
          disabled={true}
        />
      </View>
    </ScrollView>
  );
  const renderLobby = () => (
    <View style={styles.centerContent}>
      <TouchableOpacity
        style={styles.langButton}
        onPress={() => setLanguage(l => l === 'fr' ? 'en' : 'fr')}
      >
        <Text style={styles.langButtonText}>{language === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('title')}</Text>
      <Text style={{ color: isConnected ? '#4caf50' : '#f44336', marginBottom: 20, fontWeight: 'bold' }}>
        {isConnected ? t('connectedToServer') : t('disconnected')}
      </Text>

      {!currentRoom ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('yourName')}
            placeholderTextColor="#999"
            value={playerName}
            onChangeText={setPlayerName}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={createRoom}>
            <Text style={styles.buttonText}>{t('createRoom')}</Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TextInput
            style={styles.input}
            placeholder={t('roomCode')}
            placeholderTextColor="#999"
            value={roomCode}
            onChangeText={setRoomCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.secondaryButton} onPress={joinRoom}>
            <Text style={styles.buttonText}>{t('joinRoom')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ width: '100%', alignItems: 'center' }}>
          <Text style={styles.roomCode}>{t('room')}: {currentRoom}</Text>
          <Text style={styles.subtitle}>{t('players')}</Text>
          {players.map((p, i) => (
            <Text key={i} style={styles.player}>{p.name}</Text>
          ))}
          <View style={styles.separator} />
          <TouchableOpacity style={styles.primaryButton} onPress={startGame}>
            <Text style={styles.buttonText}>{t('startGame')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderGameOver = () => (
    <View style={styles.centerContent}>
      <Text style={styles.title}>{t('gameOver')}</Text>
      <Text style={styles.subtitle}>{t('finalScores')}</Text>
      {players
        .sort((a, b) => b.score - a.score)
        .map((p, i) => (
          <View key={i} style={{ marginBottom: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 24, color: i === 0 ? '#ffeb3b' : '#fff', fontWeight: 'bold' }}>
              {i === 0 ? '👑 ' : ''}{p.name}: {p.score}
            </Text>
          </View>
        ))}
      <View style={styles.separator} />
      <TouchableOpacity style={styles.primaryButton} onPress={resetGame}>
        <Text style={styles.buttonText}>{t('backToLobby')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {gameState === 'lobby' && renderLobby()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'finished' && renderGameOver()}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, pointerEvents: 'none' }}>
        <ConfettiCannon
          count={200}
          origin={{ x: Dimensions.get('window').width / 2, y: -10 }}
          autoStart={false}
          ref={confettiRef}
          fadeOut={true}
          fallSpeed={3000}
        />
      </View>
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
  rollButtonDisabled: {
    backgroundColor: '#bdbdbd', // Grey
    elevation: 0,
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
});
