import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import HealthConnectBridge from 'react-native-buddi-health-connect';

export default function ExampleApp() {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [permissions, setPermissions] = useState<any>({});
  const [stepsData, setStepsData] = useState<any[]>([]);
  const [heartRateData, setHeartRateData] = useState<any[]>([]);
  const [sleepData, setSleepData] = useState<any[]>([]);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      const available = await HealthConnectBridge.isHealthConnectAvailable();
      setIsAvailable(available);
      if (available) {
        checkPermissions();
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  };

  const checkPermissions = async () => {
    try {
      const perms = await HealthConnectBridge.checkPermissionStatus();
      setPermissions(perms);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const result = await HealthConnectBridge.requestPermissions();
      Alert.alert('Permissions', result.message);
      // Check permissions again after request
      setTimeout(checkPermissions, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to request permissions');
      console.error('Error requesting permissions:', error);
    }
  };

  const readStepsData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      
      const data = await HealthConnectBridge.readStepsData(
        startDate.getTime(),
        endDate.getTime()
      );
      setStepsData(data);
      Alert.alert('Success', `Found ${data.length} step records`);
    } catch (error) {
      Alert.alert('Error', 'Failed to read steps data');
      console.error('Error reading steps:', error);
    }
  };

  const readHeartRateData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
      
      const data = await HealthConnectBridge.readHeartRateData(
        startDate.getTime(),
        endDate.getTime()
      );
      setHeartRateData(data);
      Alert.alert('Success', `Found ${data.length} heart rate records`);
    } catch (error) {
      Alert.alert('Error', 'Failed to read heart rate data');
      console.error('Error reading heart rate:', error);
    }
  };

  const readSleepData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      
      const data = await HealthConnectBridge.readSleepData(
        startDate.getTime(),
        endDate.getTime()
      );
      setSleepData(data);
      Alert.alert('Success', `Found ${data.length} sleep records`);
    } catch (error) {
      Alert.alert('Error', 'Failed to read sleep data');
      console.error('Error reading sleep:', error);
    }
  };

  const openSettings = () => {
    HealthConnectBridge.openHealthConnectSettings();
  };

  const renderButton = (title: string, onPress: () => void, disabled = false) => (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>React Native Buddi Health Connect</Text>
        <Text style={styles.subtitle}>Example App</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Text style={styles.statusText}>
            Health Connect Available: {isAvailable ? '✅ Yes' : '❌ No'}
          </Text>
          
          {isAvailable && (
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionTitle}>Permissions:</Text>
              <Text style={styles.permissionText}>
                Steps: {permissions.steps ? '✅' : '❌'}
              </Text>
              <Text style={styles.permissionText}>
                Heart Rate: {permissions.heartRate ? '✅' : '❌'}
              </Text>
              <Text style={styles.permissionText}>
                Sleep: {permissions.sleep ? '✅' : '❌'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          {renderButton('Request Permissions', requestPermissions, !isAvailable)}
          {renderButton('Open Health Connect Settings', openSettings, !isAvailable)}
          {renderButton('Read Steps Data', readStepsData, !isAvailable || !permissions.steps)}
          {renderButton('Read Heart Rate Data', readHeartRateData, !isAvailable || !permissions.heartRate)}
          {renderButton('Read Sleep Data', readSleepData, !isAvailable || !permissions.sleep)}
        </View>

        {stepsData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Steps Data</Text>
            {stepsData.slice(0, 3).map((step, index) => (
              <Text key={index} style={styles.dataText}>
                {step.count} steps on {new Date(step.startTime).toLocaleDateString()}
              </Text>
            ))}
          </View>
        )}

        {heartRateData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Heart Rate Data</Text>
            {heartRateData.slice(0, 3).map((hr, index) => (
              <Text key={index} style={styles.dataText}>
                {hr.beatsPerMinute} BPM at {new Date(hr.time).toLocaleTimeString()}
              </Text>
            ))}
          </View>
        )}

        {sleepData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Sleep Data</Text>
            {sleepData.slice(0, 3).map((sleep, index) => (
              <Text key={index} style={styles.dataText}>
                {sleep.durationHours.toFixed(1)}h sleep on {new Date(sleep.startTime).toLocaleDateString()}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  permissionContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  permissionText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#999',
  },
  dataText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
  },
});