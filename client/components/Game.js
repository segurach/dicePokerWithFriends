import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Die from './Die';
import ScoreRow from './ScoreRow';
import Leaderboard from './Leaderboard';
import PlayerScorecard from './PlayerScorecard';
import { calculateScore } from '../utils/gameLogic';

export default function Game({
    t,
    currentRoom,
    players,
    currentTurnId,
    myId,
    dice,
    rollsLeft,
    diceAnimValues,
    keptIndices,
    toggleDie,
    rollDice,
    submitScore,
    resetGame,
    currentDiceSkin = 'standard'
}) {
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [scorecardVisible, setScorecardVisible] = useState(false);

    const isMyTurn = currentTurnId === myId;
    const myPlayer = players.find(p => p.id === myId);
    const myScorecard = myPlayer?.scorecard || {};

    const CATEGORIES = [
        'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
        'three_of_a_kind', 'four_of_a_kind', 'full_house',
        'small_straight', 'large_straight', 'chance', 'yahtzee'
    ];

    const handlePlayerPress = (player) => {
        setSelectedPlayer(player);
        setScorecardVisible(true);
    };

    const handleCloseScorecard = () => {
        setScorecardVisible(false);
        setSelectedPlayer(null);
    };

    const handleQuitGame = () => {
        Alert.alert(
            t('quitGame'),
            t('quitGameConfirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('quit'),
                    style: 'destructive',
                    onPress: resetGame
                }
            ]
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerContainer}>
                <Text
                    style={styles.title}
                    accessible={true}
                    accessibilityRole="header"
                >
                    {t('room')}: {currentRoom}
                </Text>

                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleQuitGame}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t('quit')}
                    accessibilityHint="Quits the game and returns to lobby"
                >
                    <Ionicons name="log-out-outline" size={28} color="#fff" />
                </TouchableOpacity>
            </View>

            <Leaderboard
                players={players}
                currentTurnId={currentTurnId}
                myId={myId}
                onPlayerPress={handlePlayerPress}
                t={t}
            />

            <Text
                style={styles.subtitle}
                accessible={true}
                accessibilityRole="text"
                accessibilityLiveRegion="polite"
            >
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

            <Text
                style={styles.info}
                accessible={true}
                accessibilityRole="text"
                accessibilityLiveRegion="polite"
            >
                {t('rollsLeft')}: {rollsLeft}
            </Text>

            {isMyTurn && (
                <TouchableOpacity
                    style={[styles.rollButton, rollsLeft === 0 && styles.rollButtonDisabled]}
                    onPress={rollDice}
                    disabled={rollsLeft === 0}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={rollsLeft > 0 ? t('rollDice') : t('selectScore')}
                    accessibilityHint={rollsLeft > 0 ? `${rollsLeft} rolls remaining` : "Choose a category to score"}
                    accessibilityState={{ disabled: rollsLeft === 0 }}
                >
                    <Text style={styles.rollButtonText}>
                        {rollsLeft > 0 ? t('rollDice') : t('selectScore')}
                    </Text>
                </TouchableOpacity>
            )}

            <View style={styles.separator} />
            <Text
                style={styles.subtitle}
                accessible={true}
                accessibilityRole="header"
            >
                {t('scorecard')}
            </Text>
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

            <PlayerScorecard
                player={selectedPlayer}
                visible={scorecardVisible}
                onClose={handleCloseScorecard}
                t={t}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 10,
        position: 'relative',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    headerButton: {
        position: 'absolute',
        right: 20,
        top: 10,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#e8eaf6',
        marginBottom: 8,
        textAlign: 'center',
    },
    info: {
        fontSize: 14,
        color: '#c5cae9',
        marginBottom: 8,
        textAlign: 'center',
    },
    separator: {
        height: 15,
    },
    rollButton: {
        backgroundColor: '#ff6f00',
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 30,
        alignSelf: 'center',
        elevation: 5,
        marginBottom: 10,
    },
    rollButtonDisabled: {
        backgroundColor: '#bdbdbd',
        elevation: 0,
    },
    rollButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    diceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 12,
        marginTop: 8,
    },
    scorecard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 8,
        borderRadius: 10,
    },
});
