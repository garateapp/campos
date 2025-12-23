import { StyleSheet } from 'react-native';

export const COLORS = {
    primary: '#1B5E20', // Dark Green
    secondary: '#4CAF50', // Light Green
    accent: '#FF9800', // Orange for actions/highlights
    background: '#F5F5F5', // Light Grey
    card: '#FFFFFF',
    text: '#1C1C1E',
    textSecondary: '#757575',
    border: '#E0E0E0',
    success: '#2E7D32',
    error: '#C62828',
    white: '#FFFFFF',
};

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
};

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: SPACING.m,
        marginVertical: SPACING.s,
        marginHorizontal: SPACING.m,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: SPACING.m,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.s,
    },
    text: {
        fontSize: 16,
        color: COLORS.text,
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginVertical: SPACING.s,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginVertical: SPACING.s,
    },
    secondaryButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: SPACING.m,
    }
});
