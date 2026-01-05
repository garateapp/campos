import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { initDB, resetLocalData } from './src/db/database';
import { syncData } from './src/services/sync';
import { COLORS, globalStyles } from './src/theme';

// Screens
import AssignmentScreen from './src/screens/AssignmentScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import HarvestScreen from './src/screens/HarvestScreen';
import LoginScreen from './src/screens/LoginScreen';
import CropsScreen from './src/screens/CropsScreen';
import PlantingsScreen from './src/screens/PlantingsScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import DirectCostsScreen from './src/screens/DirectCostsScreen';
import LaborPlanningScreen from './src/screens/LaborPlanningScreen';
import ProfitabilityScreen from './src/screens/ProfitabilityScreen';
import TasksScreen from './src/screens/TasksScreen';
import HarvestScoreScreen from './src/screens/HarvestScoreScreen';
import CardAssignmentsScreen from './src/screens/CardAssignmentsScreen';
import AttendanceListScreen from './src/screens/AttendanceListScreen';
import WorkersScreen from './src/screens/WorkersScreen';

const LOGO = require('./assets/logo.png');

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [currentScreen, setCurrentScreen] = useState<
    | 'home'
    | 'assignment'
    | 'attendance'
    | 'harvest'
    | 'crops'
    | 'plantings'
    | 'inventory'
    | 'directCosts'
    | 'labor'
    | 'profitability'
    | 'tasks'
    | 'harvestScore'
    | 'cardAssignments'
    | 'attendanceList'
    | 'workers'
  >('home');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuOptions: { key: typeof currentScreen; label: string; accent?: 'primary' | 'secondary' }[] = [
    { key: 'assignment', label: 'Asignar Tarjetas', accent: 'primary' },
    { key: 'attendance', label: 'Asistencia', accent: 'primary' },
    { key: 'harvest', label: 'Cosecha', accent: 'primary' },
    { key: 'tasks', label: 'Tareas' },
    { key: 'harvestScore', label: 'Score de Cosecha' },
    { key: 'cardAssignments', label: 'Tarjetas Asignadas' },
    { key: 'attendanceList', label: 'Listado de Asistencia' },
    { key: 'workers', label: 'Jornaleros' },
    { key: 'crops', label: 'Cultivos' },
    { key: 'plantings', label: 'Siembras' },
    { key: 'inventory', label: 'Inventario de Insumos' },
    { key: 'directCosts', label: 'Costos Directos' },
    { key: 'labor', label: 'Planificación Laboral' },
    { key: 'profitability', label: 'Rentabilidad por Sector' },
  ];

  useEffect(() => {
    const prepare = async () => {
      await initDB();
      await loadSession();
    };
    prepare();
  }, []);

  const loadSession = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userStr = await SecureStore.getItemAsync('auth_user');
      if (token) {
        setAuthToken(token);
        if (userStr) setCurrentUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.error('Failed to load session', e);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLoginSuccess = async (token: string, user: any) => {
    // Cambiar de usuario/compañía: limpiar BD local para no mezclar datos.
    await resetLocalData();
    setAuthToken(token);
    setCurrentUser(user);
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    setAuthToken(null);
    setCurrentUser(null);
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
  };

  const handleSync = async () => {
    if (!authToken) return;
    setIsSyncing(true);
    setSyncStatus('Sincronizando...');
    try {
      const result = await syncData(authToken);
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

  const handleNavigate = (screen: typeof currentScreen) => {
    setCurrentScreen(screen);
    setIsMenuOpen(false);
  };

  if (isLoadingAuth) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!authToken) {
    return (
      <SafeAreaView style={styles.container}>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'assignment':
        return <AssignmentScreen onBack={() => setCurrentScreen('home')} />;
      case 'attendance':
        return <AttendanceScreen onBack={() => setCurrentScreen('home')} />;
      case 'harvest':
        return <HarvestScreen onBack={() => setCurrentScreen('home')} />;
      case 'crops':
        return <CropsScreen onBack={() => setCurrentScreen('home')} />;
      case 'plantings':
        return <PlantingsScreen onBack={() => setCurrentScreen('home')} />;
      case 'inventory':
        return <InventoryScreen onBack={() => setCurrentScreen('home')} />;
      case 'directCosts':
        return <DirectCostsScreen onBack={() => setCurrentScreen('home')} />;
      case 'labor':
        return <LaborPlanningScreen onBack={() => setCurrentScreen('home')} />;
      case 'profitability':
        return <ProfitabilityScreen onBack={() => setCurrentScreen('home')} />;
      case 'tasks':
        return <TasksScreen onBack={() => setCurrentScreen('home')} />;
      case 'harvestScore':
        return <HarvestScoreScreen onBack={() => setCurrentScreen('home')} />;
      case 'cardAssignments':
        return <CardAssignmentsScreen onBack={() => setCurrentScreen('home')} />;
      case 'attendanceList':
        return <AttendanceListScreen onBack={() => setCurrentScreen('home')} />;
      case 'workers':
        return <WorkersScreen onBack={() => setCurrentScreen('home')} />;
      default:
        return (
          <View style={[globalStyles.container, styles.menuContainer]}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => setIsMenuOpen(true)} style={styles.iconButton}>
                <Text style={styles.iconText}>☰</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={styles.greetingTitle}>Panel Operaciones</Text>
                <Text style={styles.greetingSubtitle}>Bienvenido, {currentUser?.name || 'Usuario'}</Text>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutPill}>
                <Text style={styles.logoutText}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.heroCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroLabel}>Sincronización</Text>
                <Text style={styles.heroTitle}>{isSyncing ? 'Sincronizando...' : 'Datos en terreno'}</Text>
                <Text style={styles.heroSubtitle}>
                  Asegure la información local sincronizando antes y después de operar en campo.
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.primaryButton, isSyncing && { opacity: 0.7 }]}
                    onPress={handleSync}
                    disabled={isSyncing}
                  >
                    <Text style={styles.primaryButtonText}>{isSyncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR'}</Text>
                  </TouchableOpacity>
                  {syncStatus ? (
                    <View style={[styles.syncBadge, { marginLeft: 8 }]}>
                      <Text style={[styles.syncBadgeText, { color: syncStatus.includes('Error') ? COLORS.error : COLORS.success }]}>
                        {syncStatus}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Image source={LOGO} style={styles.heroLogo} resizeMode="contain" />
            </View>

            <View style={styles.menuGrid}>
              {menuOptions.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.menuCard,
                    item.accent === 'primary' && { backgroundColor: COLORS.primary },
                    item.accent === 'primary' && { borderColor: COLORS.primary },
                  ]}
                  onPress={() => handleNavigate(item.key)}
                >
                  <Text
                    style={[
                      styles.menuCardText,
                      item.accent === 'primary' && { color: COLORS.white },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={[styles.menuCardArrow, item.accent === 'primary' && { color: COLORS.white }]}>→</Text>
                </TouchableOpacity>
              ))}
            </View>

            {isMenuOpen && (
              <>
                <TouchableOpacity style={styles.drawerOverlay} onPress={() => setIsMenuOpen(false)} />
                <View style={styles.drawer}>
                  <View style={styles.drawerHeader}>
                    <Text style={styles.drawerTitle}>Menú</Text>
                    <TouchableOpacity onPress={() => setIsMenuOpen(false)}>
                      <Text style={styles.drawerClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.drawerUser}>
                    <Text style={styles.drawerUserName}>{currentUser?.name || 'Usuario'}</Text>
                    <Text style={styles.drawerUserRole}>Operaciones</Text>
                  </View>
                  {menuOptions.map((item) => (
                    <TouchableOpacity key={item.key} style={styles.drawerItem} onPress={() => handleNavigate(item.key)}>
                      <Text style={styles.drawerItemText}>{item.label}</Text>
                      <Text style={styles.drawerItemArrow}>→</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={handleLogout} style={[styles.drawerItem, { marginTop: 12 }]}>
                    <Text style={[styles.drawerItemText, { color: COLORS.error }]}>Cerrar Sesión</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  logoutPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: 'bold',
  },
  greetingTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroLabel: {
    color: '#D9F2E1',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  heroSubtitle: {
    color: '#EAF6ED',
    marginTop: 6,
    lineHeight: 18,
  },
  heroLogo: {
    width: 90,
    height: 90,
    marginLeft: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  syncBadge: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
  },
  syncBadgeText: {
    fontWeight: '700',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  menuCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  menuCardText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuCardArrow: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '72%',
    backgroundColor: COLORS.white,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  drawerClose: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  drawerUser: {
    marginBottom: 12,
  },
  drawerUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  drawerUserRole: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  drawerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerItemText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  drawerItemArrow: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});
