import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Alert, Animated, Easing, Dimensions } from 'react-native';
import io from 'socket.io-client';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import ConfettiCannon from 'react-native-confetti-cannon';

// Components
import Lobby from './components/Lobby';
import Game from './components/Game';
import GameOver from './components/GameOver';

// Logic & Utils
import { translations } from './translations';
import { calculateScore } from './utils/gameLogic';

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
  const [gameState, setGameState] = useState('lobby'); // lobby, playing, finished
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
  const diceAnimValues = useRef([0, 0, 0, 0, 0].map(() => new Animated.Value(0))).current;
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
      setPlayers(players);
    });

    newSocket.on('game_over', ({ players, winner }) => {
      setPlayers(players);
      setGameState('finished');
      playSound('game_over');
      if (confettiRef.current) confettiRef.current.start();
    });

    newSocket.on('error', (msg) => {
      Alert.alert(t('error'), msg);
    });

    return () => newSocket.disconnect();
  }, []);

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
  };

  const toggleDie = (index) => {
    if (dice[index] === 0) return;
    playSound('select');
    let newKept;
    if (keptIndices.includes(index)) {
      newKept = keptIndices.filter(i => i !== index);
    } else {
      newKept = [...keptIndices, index];
    }
    setKeptIndices(newKept);
    keptIndicesRef.current = newKept;
  };

  const rollDice = () => {
    playSound('roll');
    socket.emit('roll_dice', { roomCode: currentRoom, keptIndices });
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

  return (
    <View style={styles.container}>
      {gameState === 'lobby' && (
        <Lobby
          language={language}
          setLanguage={setLanguage}
          t={t}
          isConnected={isConnected}
          currentRoom={currentRoom}
          playerName={playerName}
          setPlayerName={setPlayerName}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          createRoom={createRoom}
          joinRoom={joinRoom}
          startGame={startGame}
          players={players}
        />
      )}

      {gameState === 'playing' && (
        <Game
          t={t}
          currentRoom={currentRoom}
          players={players}
          currentTurnId={currentTurnId}
          myId={myId}
          dice={dice}
          rollsLeft={rollsLeft}
          diceAnimValues={diceAnimValues.current ? diceAnimValues.current : diceAnimValues} // Handle legacy ref access check
          keptIndices={keptIndices}
          toggleDie={toggleDie}
          rollDice={rollDice}
          submitScore={submitScore}
        />
      )}

      {gameState === 'finished' && (
        <GameOver
          t={t}
          players={players}
          resetGame={resetGame}
        />
      )}

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
});
