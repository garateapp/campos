import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS } from '../theme';

// Use logo asset
const LOGO = require('../../assets/logo.png');

interface ScreenHeaderProps {
    title: string;
    onBack?: () => void;
}

export default function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
    return (
        <SafeAreaView style={{ backgroundColor: COLORS.background }}>
            <View style={styles.container}>
                <View style={styles.topRow}>
                    {onBack && (
                        <TouchableOpacity onPress={onBack} style={styles.backButton}>
                            <Text style={styles.backText}>← Volver</Text>
                        </TouchableOpacity>
                    )}
                    <View style={styles.logoContainer}>
                        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
                        <Text style={styles.appTitle}>Gestión de Campos Greenex</Text>
                    </View>
                    {onBack && <View style={{ width: 60 }} />}
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.screenTitle}>{title}</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    logoContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
    },
    logo: {
        width: 120, // Smaller logo for header
        height: 40,
    },
    appTitle: {
        fontSize: 10,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 5,
        width: 60,
    },
    backText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    titleContainer: {
        alignItems: 'center',
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    }
});
