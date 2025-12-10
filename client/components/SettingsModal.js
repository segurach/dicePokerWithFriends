import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themes, themeKeys, getButtonTextColor } from '../utils/themes';

export default function SettingsModal({
    visible,
    onClose,
    theme,
    language,
    setLanguage,
    isMusicEnabled,
    toggleMusic,
    currentDiceSkin,
    setCurrentDiceSkin,
    currentTheme,
    setCurrentTheme,
    level,
    t,
    showModal
}) {
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.primary }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('settings') || "Settings"}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalBody}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                            {/* Language */}
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.sectionLabel}>{t('language') || "Language"}:</Text>
                                <TouchableOpacity
                                    style={styles.modalLangButton}
                                    onPress={() => setLanguage(l => l === 'fr' ? 'en' : 'fr')}
                                >
                                    <Text style={styles.langButtonText}>{language === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Music */}
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.sectionLabel}>{t('music') || "Music"}:</Text>
                                <TouchableOpacity
                                    style={[styles.modalLangButton, { backgroundColor: isMusicEnabled ? theme.accent : theme.secondary }]}
                                    onPress={toggleMusic}
                                >
                                    <Text style={[styles.langButtonText, { color: isMusicEnabled ? getButtonTextColor(theme.accent, currentTheme) : getButtonTextColor(theme.secondary, currentTheme) }]}>
                                        {isMusicEnabled ? (t('musicOn') || "ON") : (t('musicOff') || "OFF")}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.separator} />

                        {/* Dice Skins */}
                        <Text style={styles.sectionLabel}>{t('diceStyle')}:</Text>
                        <View style={styles.modalSkinRow}>
                            {['standard', 'golden'].map((skin) => {
                                const isLocked = skin === 'golden' && level < 10;
                                const skinColor = skin === 'golden' ? '#ffd700' : '#ffffff';
                                return (
                                    <TouchableOpacity
                                        key={skin}
                                        style={[
                                            styles.themeCircle,
                                            { backgroundColor: skinColor },
                                            currentDiceSkin === skin && styles.selectedTheme,
                                            isLocked && styles.lockedTheme
                                        ]}
                                        onPress={() => {
                                            if (isLocked) showModal(t('lockedTitle'), t('lockedMessage').replace('{level}', 10), 'error');
                                            else setCurrentDiceSkin(skin);
                                        }}
                                    >
                                        {currentDiceSkin === skin && !isLocked && <Text style={[styles.checkmark, { color: skin === 'standard' ? '#000' : '#fff' }]}>✓</Text>}
                                        {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={styles.separator} />

                        {/* Themes */}
                        <Text style={styles.sectionLabel}>{t('theme') || "Theme"}:</Text>
                        <View style={styles.modalThemeGrid}>
                            {themeKeys.map((themeKey) => {
                                const themeObj = themes[themeKey];
                                const isLocked = (themeObj.requiredLevel || 1) > level;
                                return (
                                    <TouchableOpacity
                                        key={themeKey}
                                        style={[
                                            styles.themeCircle,
                                            { backgroundColor: themeObj.primary, marginBottom: 10 },
                                            currentTheme === themeKey && styles.selectedTheme,
                                            isLocked && styles.lockedTheme
                                        ]}
                                        onPress={() => {
                                            if (isLocked) showModal(t('lockedTitle'), t('lockedMessage').replace('{level}', themeObj.requiredLevel), 'error');
                                            else setCurrentTheme(themeKey);
                                        }}
                                    >
                                        {currentTheme === themeKey && !isLocked && <Text style={styles.checkmark}>✓</Text>}
                                        {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalBody: {
        paddingBottom: 20,
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginVertical: 20,
    },
    sectionLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
        marginTop: 10,
    },
    modalLangButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 10,
        height: 60,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSkinRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 10,
        justifyContent: 'center',
    },
    modalThemeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        justifyContent: 'center',
        padding: 5,
    },
    themeCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 5,
    },
    selectedTheme: {
        borderColor: '#00ff00',
        borderWidth: 3,
        transform: [{ scale: 1.2 }],
    },
    lockedTheme: {
        opacity: 0.5,
    },
    checkmark: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 24,
    },
    lockIcon: {
        fontSize: 20,
    },
    langButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
