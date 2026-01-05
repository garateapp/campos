import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { CameraView, Camera } from 'expo-camera';

interface ScannerProps {
    onScanned: (data: string, type?: string) => void;
    onClose: () => void;
    showDebug?: boolean;
}

export default function Scanner({ onScanned, onClose, showDebug = false }: ScannerProps) {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [last, setLast] = useState<{ data: string; type?: string } | null>(null);

    useEffect(() => {
        const getPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };
        getPermissions();
    }, []);

    if (hasPermission === null) {
        return <Text>Requesting for camera permission</Text>;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{
                    barcodeTypes: ['pdf417', 'qr', 'code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e'],
                }}
                onBarcodeScanned={({ data, type }) => {
                    if (showDebug) {
                        console.log('[Scanner] barcode type:', type, 'data:', data);
                        setLast({ data, type });
                    }
                    onScanned(data, type);
                }}
            />
            <View style={styles.overlay}>
                <Button title="Close Scanner" onPress={onClose} />
                {showDebug && last ? (
                    <View style={styles.debugBox}>
                        <Text style={{ color: 'white', fontSize: 12 }}>Last: {last.type || 'n/a'}</Text>
                        <Text style={{ color: 'white', fontSize: 12 }}>{last.data}</Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        padding: 20,
    },
    debugBox: {
        marginTop: 8,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 8,
    },
});
