import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';

export default function PlayerScorecard({ player, visible, onClose, t }) {
    if (!player) return null;

    const CATEGORIES = [
        'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
        'three_of_a_kind', 'four_of_a_kind', 'full_house',
        'small_straight', 'large_straight', 'chance', 'yahtzee'
    ];

    const scorecard = player.scorecard || {};

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
            accessible={true}
            accessibilityViewIsModal={true}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text
                            style={styles.playerName}
                            accessible={true}
                            accessibilityRole="header"
                        >
                            {player.name}
                        </Text>
                        <Text
                            style={styles.totalScore}
                            accessible={true}
                            accessibilityRole="text"
                        >
                            {t('total')}: {player.score}
                        </Text>
                    </View>

                    <ScrollView style={styles.scrollView}>
                        <View style={styles.categoriesList}>
                            {CATEGORIES.map((category) => {
                                const score = scorecard[category];
                                const isFilled = score !== undefined;

                                return (
                                    <View
                                        key={category}
                                        style={[styles.categoryRow, isFilled && styles.filledRow]}
                                        accessible={true}
                                        accessibilityRole="text"
                                        accessibilityLabel={`${t(category)}: ${isFilled ? score + ' points' : 'not filled'}`}
                                    >
                                        <Text style={styles.categoryLabel} importantForAccessibility="no">{t(category)}</Text>
                                        <Text style={[styles.categoryScore, !isFilled && styles.emptyScore]} importantForAccessibility="no">
                                            {isFilled ? score : t('notFilled')}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t('closeScorecard')}
                        accessibilityHint="Closes the scorecard and returns to the game"
                    >
                        <Text style={styles.closeButtonText}>{t('closeScorecard')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1a237e',
        borderRadius: 15,
        padding: 20,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        borderWidth: 2,
        borderColor: '#5c6bc0',
    },
    header: {
        marginBottom: 15,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#5c6bc0',
        paddingBottom: 10,
    },
    playerName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffeb3b',
        marginBottom: 5,
    },
    totalScore: {
        fontSize: 18,
        color: '#e8eaf6',
        fontWeight: 'bold',
    },
    scrollView: {
        maxHeight: 400,
    },
    categoriesList: {
        gap: 8,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    filledRow: {
        backgroundColor: 'rgba(92, 107, 192, 0.2)',
        borderColor: '#5c6bc0',
    },
    categoryLabel: {
        fontSize: 14,
        color: '#fff',
        flex: 1,
    },
    categoryScore: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4caf50',
        minWidth: 40,
        textAlign: 'right',
    },
    emptyScore: {
        color: '#999',
        fontWeight: 'normal',
    },
    closeButton: {
        backgroundColor: '#ff6f00',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
