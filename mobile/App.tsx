import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { initDB } from './src/db/database';
import { syncData } from './src/services/sync';
import { COLORS, globalStyles } from './src/theme';

// Placeholder Screens
import AssignmentScreen from './src/screens/AssignmentScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import HarvestScreen from './src/screens/HarvestScreen';

const LOGO = require('./assets/logo.png');

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'assignment' | 'attendance' | 'harvest'>('home');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  useEffect(() => {
    initDB();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Sincronizando...');
    try {
      const result = await syncData();
      if (result.success) {
        setSyncStatus('Sincronización Completa');
      } else {
        setSyncStatus('Error en Sincronización');
      }
    } catch (e) {
      setSyncStatus('Error');
    } finally {
      setIsSyncing(false);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'assignment':
        return <AssignmentScreen onBack={() => setCurrentScreen('home')} />;
      case 'attendance':
        return <AttendanceScreen onBack={() => setCurrentScreen('home')} />;
      case 'harvest':
        return <HarvestScreen onBack={() => setCurrentScreen('home')} />;
      default:
        return (
          <View style={[globalStyles.container, styles.menuContainer]}>
            <View style={styles.logoContainer}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.appName}>Greenex Mobile</Text>

            <View style={styles.menuItems}>
              <TouchableOpacity style={globalStyles.button} onPress={() => setCurrentScreen('assignment')}>
                <Text style={globalStyles.buttonText}>Asignar Tarjetas</Text>
              </TouchableOpacity>

              <TouchableOpacity style={globalStyles.button} onPress={() => setCurrentScreen('attendance')}>
                <Text style={globalStyles.buttonText}>Asistencia</Text>
              </TouchableOpacity>

              <TouchableOpacity style={globalStyles.button} onPress={() => setCurrentScreen('harvest')}>
                <Text style={globalStyles.buttonText}>Cosecha</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.syncContainer}>
              <TouchableOpacity
                style={[globalStyles.secondaryButton, isSyncing && { opacity: 0.5 }]}
                onPress={handleSync}
                disabled={isSyncing}
              >
                <Text style={globalStyles.secondaryButtonText}>
                  {isSyncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR DATOS'}
                </Text>
              </TouchableOpacity>
              {isSyncing && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 10 }} />}
              {syncStatus ? <Text style={[styles.statusText, { color: syncStatus.includes('Error') ? COLORS.error : COLORS.success }]}>{syncStatus}</Text> : null}
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderScreen()}
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  menuContainer: {
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 100,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 40,
  },
  menuItems: {
    marginBottom: 40,
    gap: 16,
  },
  syncContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 30,
    alignItems: 'center',
  },
  statusText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  }
});
