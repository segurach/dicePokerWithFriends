import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import Die from './Die';
import ScoreRow from './ScoreRow';
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
    submitScore
}) {
    const isMyTurn = currentTurnId === myId;
    const myPlayer = players.find(p => p.id === myId);
    const myScorecard = myPlayer?.scorecard || {};

    const CATEGORIES = [
        'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
        'three_of_a_kind', 'four_of_a_kind', 'full_house',
        'small_straight', 'large_straight', 'chance', 'yahtzee'
    ];

    return (
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
}

const styles = StyleSheet.create({
    scrollContent: {
        alignItems: 'center',
        paddingBottom: 40,
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
    separator: {
        height: 30,
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
    rollButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    diceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
        marginTop: 10,
    },
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
