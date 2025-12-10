import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdModal({ visible, onClose, onReward, t }) {
    const [timeLeft, setTimeLeft] = useState(5);
    const [canClose, setCanClose] = useState(false);

    useEffect(() => {
        if (visible) {
            setTimeLeft(5);
            setCanClose(false);
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [visible]);

    useEffect(() => {
        if (timeLeft === 0 && !canClose && visible) {
            setCanClose(true);
            if (onReward) onReward();
        }
    }, [timeLeft, canClose, visible, onReward]);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => { if (canClose) onClose(); }}
        >
            <View style={styles.overlay}>
                <View style={styles.adContainer}>
                    <View style={styles.header}>
                        <Text style={styles.headerText}>{t('adWatching') || "Watching Ad..."}</Text>
                        {canClose && (
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.content}>
                        {!canClose ? (
                            <>
                                <ActivityIndicator size="large" color="#4caf50" />
                                <Text style={styles.timerText}>{t('adWait') || "Reward in"} {timeLeft}s</Text>
                                <View style={styles.placeholderAd}>
                                    <View style={styles.adIcon}>
                                        <Ionicons name="play-circle" size={50} color="#888" />
                                    </View>
                                    <Text style={styles.adText}>{t('adPlaceholder') || "Simulated Ad Content"}</Text>
                                    <Text style={styles.subAdText}>This supports the developer!</Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.rewardContainer}>
                                <Ionicons name="checkmark-circle" size={60} color="#4caf50" />
                                <Text style={styles.rewardText}>{t('adThankYou') || "Thank you for your support!"}</Text>
                                <TouchableOpacity style={styles.finishButton} onPress={onClose}>
                                    <Text style={styles.finishButtonText}>{t('close') || "Close"}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    adContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
        minHeight: 300,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f5f5f5',
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    content: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    timerText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 20,
        color: '#333',
    },
    placeholderAd: {
        width: '100%',
        height: 150,
        backgroundColor: '#eee',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#ccc',
    },
    adIcon: {
        marginBottom: 10,
    },
    adText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
    },
    subAdText: {
        fontSize: 12,
        color: '#888',
        marginTop: 5,
    },
    rewardContainer: {
        alignItems: 'center',
        padding: 20,
    },
    rewardText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center',
    },
    finishButton: {
        backgroundColor: '#4caf50',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    finishButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
