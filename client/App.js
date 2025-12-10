import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import * as SplashScreen from 'expo-splash-screen';
import ConfettiCannon from 'react-native-confetti-cannon';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Components
import Lobby from './components/Lobby';
import Game from './components/Game';
import GameOver from './components/GameOver';
import CustomModal from './components/CustomModal';

// Logic & Utils
import { translations } from './translations';
import { calculateScore } from './utils/gameLogic';
import { themes } from './utils/themes';

// REPLACE WITH YOUR LOCAL IP ADDRESS (e.g., 'http://192.168.1.15:3000')
// 'localhost' only works on iOS Simulator, NOT on Android Emulator or physical devices.
const SERVER_URL = 'http://192.168.1.20:3000';
//const SERVER_URL = 'https://dicepokerwithfriends.onrender.com';

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

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => { },
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Cancel'
  });

  const showModal = (title, message, type = 'info', onConfirm = () => { }, onCancel = null, confirmText = 'OK', cancelText = 'Cancel') => {
    setModalConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, visible: false }));
        onConfirm();
      },
      onCancel: onCancel ? () => {
        setModalConfig(prev => ({ ...prev, visible: false }));
        onCancel();
      } : null,
      confirmText,
      cancelText
    });
  };

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  const [rollsLeft, setRollsLeft] = useState(3);
  const [currentTurnId, setCurrentTurnId] = useState(null);
  const currentTurnIdRef = useRef(null); // Ref to access latest turn ID in event listener
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    currentTurnIdRef.current = currentTurnId;
  }, [currentTurnId]);

  // Language state and translation function
  const [language, setLanguage] = useState('fr'); // Default to French
  const t = (key) => translations[language][key];

  // Theme state
  const [currentTheme, setCurrentTheme] = useState('forestGreen');
  const theme = themes[currentTheme];

  // XP & Level State
  const [totalXP, setTotalXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpGainedLastGame, setXpGainedLastGame] = useState(0);

  // Rewards State
  const [currentDiceSkin, setCurrentDiceSkin] = useState('standard'); // standard, golden

  // Load saved data (Theme, Language, XP, Skin)
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) setCurrentTheme(savedTheme);

        const savedLang = await AsyncStorage.getItem('language');
        if (savedLang) setLanguage(savedLang);

        const savedXP = await AsyncStorage.getItem('totalXP');
        const savedLevel = await AsyncStorage.getItem('level');
        const savedSkin = await AsyncStorage.getItem('diceSkin');

        if (savedXP) setTotalXP(parseInt(savedXP));
        if (savedLevel) setLevel(parseInt(savedLevel));
        if (savedSkin) setCurrentDiceSkin(savedSkin);
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        SplashScreen.hideAsync();
      }
    };
    loadData();
  }, []);

  const saveXP = async (newXP, newLevel) => {
    try {
      await AsyncStorage.setItem('totalXP', newXP.toString());
      await AsyncStorage.setItem('level', newLevel.toString());
    } catch (e) {
      console.error('Failed to save XP', e);
    }
  };

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

      // Audio - create new sound each time for reliable playback
      let soundFile = null;

      if (type === 'roll') {
        soundFile = require('./assets/dice-roll.mp3');
      } else if (type === 'score') {
        soundFile = require('./assets/score.wav');
      } else if (type === 'bonus' || type === 'yahtzee') {
        soundFile = require('./assets/casino.mp3');
      } else if (type === 'success' || type === 'game_over') {
        soundFile = require('./assets/success.mp3');
      }

      if (soundFile) {
        const { sound } = await Audio.Sound.createAsync(soundFile);

        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.didJustFinish) {
            try {
              await sound.unloadAsync();
            } catch (error) {
              console.log('Error unloading sound:', error);
            }
          }
        });

        await sound.playAsync();
      }
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

  // Load theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme && themes[savedTheme]) {
          setCurrentTheme(savedTheme);
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference when it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem('theme', currentTheme);
      } catch (error) {
        console.log('Error saving theme:', error);
      }
    };
    saveTheme();
  }, [currentTheme]);

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

      // Play sound only if it's my turn (using ref to get latest value)
      if (currentTurnIdRef.current === newSocket.id) {
        playSound('roll');
      }

      runDiceAnimation(keptIndicesRef.current); // Use ref to get latest kept indices
    });

    newSocket.on('turn_updated', ({ currentTurn, dice, rollsLeft, players }) => {
      // Play score sound for the player who just finished their turn (scored)
      // This happens when turn changes, so the previous player scored
      playSound('score');

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
      setGameState('finished');
      playSound('success');
      if (confettiRef.current) confettiRef.current.start();

      // Find my player to get XP data
      const myPlayer = players.find(p => p.id === newSocket.id);
      if (myPlayer && myPlayer.xpGained) {
        setXpGainedLastGame(myPlayer.xpGained);

        // Update local total safely using functional state update
        setTotalXP(prevXP => {
          const newTotal = prevXP + myPlayer.xpGained;
          const newLevel = Math.floor(newTotal / 1000) + 1;

          setLevel(prevLevel => {
            if (newLevel > prevLevel) {
              // Level Up! Could trigger a special animation sound here
              showModal("LEVEL UP! 🎉", `Congratulations! You reached Level ${newLevel}!`, 'success', () => { }, null, "Awesome!");
            }
            // Save to storage
            saveXP(newTotal, newLevel);
            return newLevel;
          });

          return newTotal;
        });
      }
    });

    newSocket.on('player_left', ({ playerName, players, currentTurn, dice, rollsLeft }) => {
      console.log(`${playerName} has left the game`);
      setPlayers(players);

      // If game is in progress, update game state
      if (currentTurn) {
        setCurrentTurnId(currentTurn);
        setDice(dice);
        setRollsLeft(rollsLeft);
        setKeptIndices([]);
        keptIndicesRef.current = [];
      }
    });

    newSocket.on('error', (msg) => {
      showModal(t('error'), msg, 'error');
    });

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        // Artificially delay for 2 seconds to simulate a "splash" duration
        // This ensures the user sees the branding even if the app loads instantly
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  const createRoom = () => {
    if (!playerName) return showModal(t('error'), t('enterNameFirst'), 'error');
    socket.emit('create_room', playerName);
  };

  const joinRoom = () => {
    if (!playerName || !roomCode) return showModal(t('error'), t('enterNameAndCode'), 'error');
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
    showModal(
      t('confirmScore'),
      t('scorePointsFor').replace('{score}', potentialScore).replace('{category}', categoryName),
      'confirm',
      () => {
        // Sound will be played via turn_updated event for the scoring player

        // Check for Yahtzee Animation
        if (category === 'yahtzee' && potentialScore === 50) {
          if (confettiRef.current) confettiRef.current.start();
          playSound('yahtzee');
        }

        // Check for Bonus Animation (Upper Section >= 63)
        const UPPER_SECTION = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
        if (UPPER_SECTION.includes(category)) {
          const myPlayer = players.find(p => p.id === myId);
          const myScorecard = myPlayer?.scorecard || {};

          let currentUpperSum = 0;
          UPPER_SECTION.forEach(cat => {
            if (myScorecard[cat] !== undefined) currentUpperSum += myScorecard[cat];
          });

          // If we weren't at 63 yet, and this move puts us over
          if (currentUpperSum < 63 && (currentUpperSum + potentialScore) >= 63) {
            if (confettiRef.current) confettiRef.current.start();
            playSound('bonus');
            // Optional: Show a "Bonus Unlocked" modal after a slight delay
            setTimeout(() => {
              showModal("BONUS! 🌟", "+35 Points!", 'success');
            }, 500);
          }
        }

        socket.emit('submit_score', { roomCode: currentRoom, category });
      },
      () => { }, // On cancel do nothing
      t('validate'),
      t('cancel')
    );
  };

  const saveSkin = async (skin) => {
    try {
      setCurrentDiceSkin(skin);
      await AsyncStorage.setItem('diceSkin', skin);
    } catch (e) {
      console.error('Failed to save skin', e);
    }
  };

  const playAgain = () => {
    socket.emit('start_game', currentRoom);
  };

  const leaveGame = () => {
    socket.emit('leave_game', { roomCode: currentRoom });
    resetGame(); // Then reset local state
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      {gameState === 'lobby' && (
        <Lobby
          language={language}
          setLanguage={setLanguage}
          currentTheme={currentTheme}
          setCurrentTheme={setCurrentTheme}
          currentDiceSkin={currentDiceSkin}
          setCurrentDiceSkin={saveSkin}
          theme={theme}
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
          level={level}
          totalXP={totalXP}
          showModal={showModal}
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
          resetGame={leaveGame}
          currentDiceSkin={currentDiceSkin}
          showModal={showModal}
        />
      )}

      {gameState === 'finished' && (
        <GameOver
          t={t}
          players={players}
          resetGame={resetGame}
          playAgain={playAgain}
          currentTheme={currentTheme}
          myId={myId}
          xpGainedLastGame={xpGainedLastGame}
        />
      )}

      <CustomModal
        {...modalConfig}
        theme={theme}
      />

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
    backgroundColor: themes.darkBlue.primary, // Will be overridden by inline style
    padding: 20,
  },
});
