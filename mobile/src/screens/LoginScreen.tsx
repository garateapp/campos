import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import axios from 'axios';
import { COLORS, globalStyles } from '../theme';

// Hardcode API URL here or import from config
// Note: This needs to match the backend IP
const API_URL = 'https://campos.appgreenex.cl/api';

interface LoginScreenProps {
    onLoginSuccess: (token: string, user: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/login`, {
                email,
                password
            });

            const { token, user } = response.data;
            onLoginSuccess(token, user);
        } catch (error) {
            console.error(error);
            Alert.alert('Login Failed', 'Invalid credentials or server error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[globalStyles.container, { justifyContent: 'center' }]}>
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
                <Image source={require('../../assets/logo.png')} style={{ width: 200, height: 100 }} resizeMode="contain" />
                <Text style={[globalStyles.title, { marginTop: 20 }]}>Greenex Mobile</Text>
            </View>

            <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>Email</Text>
                <TextInput
                    style={globalStyles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="correo@greenex.cl"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Text style={globalStyles.subtitle}>Contraseña</Text>
                <TextInput
                    style={globalStyles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="********"
                    secureTextEntry
                />

                <TouchableOpacity
                    style={[globalStyles.button, { marginTop: 20 }, isLoading && { opacity: 0.7 }]}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={globalStyles.buttonText}>INICIAR SESIÓN</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
