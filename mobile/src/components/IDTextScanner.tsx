import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { COLORS } from '../theme';

interface IDTextScannerProps {
  onExtract: (data: { name?: string; rut?: string }) => void;
  onClose: () => void;
}

export default function IDTextScanner({ onExtract, onClose }: IDTextScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const parseRutFromText = (text: string) => {
    const cleaned = text.replace(/\./g, ' ').replace(/RUN|RUT/gi, ' ');
    const match = cleaned.match(/(\d{6,9})[-\s]?([\dkK])/);
    if (!match) return undefined;
    return `${match[1]}-${match[2].toUpperCase()}`;
  };

  const parseNameFromText = (blocks: string[]) => {
    const uppers = blocks.filter((b) => /^[A-ZÁÉÍÓÚÑ\s]+$/.test(b.trim()) && b.trim().length > 4);
    if (uppers.length) {
      return uppers.sort((a, b) => b.length - a.length)[0].trim();
    }
    return blocks.sort((a, b) => b.length - a.length)[0]?.trim();
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      const result = await TextRecognition.recognize(photo.uri);
      const blocks = result?.blocks?.map((b) => b.text) || [];
      const joined = blocks.join(' ');
      const rut = parseRutFromText(joined);
      const name = parseNameFromText(blocks);
      onExtract({ rut, name });
      onClose();
    } catch (e) {
      console.error('ID OCR error', e);
      Alert.alert('Error', 'No se pudo leer la cédula. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;
  }
  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.text }}>Sin acceso a cámara</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={Camera.Constants.Type.back}
      />
      <View style={styles.overlay}>
        <TouchableOpacity style={[styles.controlButton, { backgroundColor: COLORS.primary }]} onPress={handleCapture} disabled={isProcessing}>
          {isProcessing ? <ActivityIndicator color="white" /> : <Text style={styles.controlText}>Capturar</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={onClose}>
          <Text style={styles.controlText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
  },
  controlButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  controlText: {
    color: 'white',
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
  },
});
