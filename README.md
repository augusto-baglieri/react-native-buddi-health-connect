# React Native Buddi Health Connect

[![npm version](https://badge.fury.io/js/react-native-buddi-health-connect.svg)](https://badge.fury.io/js/react-native-buddi-health-connect)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Platform](https://img.shields.io/badge/platform-android-green.svg)](https://github.com/augusto-baglieri/react-native-buddi-health-connect)

A comprehensive React Native bridge for Android Health Connect, originally developed for the **Buddi Life OS** project. This library provides seamless access to health and fitness data including steps, heart rate, and sleep sessions with full permission management.

## ✨ Features

- 🏥 **Health Connect Integration**: Full support for Android Health Connect API
- 📊 **Multiple Data Types**: Steps, Heart Rate, Sleep Sessions
- 🔐 **Permission Management**: Complete permission request and status checking
- 📱 **TypeScript Support**: Fully typed interfaces and comprehensive IntelliSense
- 🛡️ **Error Handling**: Robust error management with meaningful error messages
- ⚡ **Performance Optimized**: Efficient native bridge implementation
- 🔧 **Easy Integration**: Simple setup with autolinking support

## 📋 Requirements

- **React Native**: 0.70.0 or higher
- **Android API Level**: 26 (Android 8.0) or higher
- **Health Connect**: Must be installed on the device
- **Target SDK**: Recommended 34 or higher

## 🚀 Installation

### Step 1: Install the package

```bash
npm install react-native-buddi-health-connect
# or
yarn add react-native-buddi-health-connect
```

### Step 2: Android Configuration

Add the following permissions to your `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.health.READ_STEPS" />
<uses-permission android:name="android.permission.health.READ_HEART_RATE" />
<uses-permission android:name="android.permission.health.READ_SLEEP" />

<!-- Health Connect Intent -->
<queries>
  <package android:name="com.google.android.apps.healthdata" />
</queries>
```

### Step 3: Verify Autolinking (React Native 0.60+)

The library should autolink automatically. If you encounter issues, try:

```bash
npx react-native unlink react-native-buddi-health-connect
npx react-native link react-native-buddi-health-connect
```

## 📖 Usage

### Basic Setup

```typescript
import { HealthConnectManager } from 'react-native-buddi-health-connect';

// Initialize Health Connect
const initializeHealthConnect = async () => {
  try {
    const isAvailable = await HealthConnectManager.initialize();
    if (isAvailable) {
      console.log('Health Connect is available!');
      return true;
    } else {
      console.log('Health Connect is not available on this device');
      return false;
    }
  } catch (error) {
    console.error('Error initializing Health Connect:', error);
    return false;
  }
};
```

### Permission Management

```typescript
// Check current permission status
const checkPermissions = async () => {
  try {
    const hasPermissions = await HealthConnectManager.hasAllPermissions();
    console.log('Has all permissions:', hasPermissions);
    return hasPermissions;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

// Request permissions from user
const requestPermissions = async () => {
  try {
    const granted = await HealthConnectManager.requestAllPermissions();
    if (granted) {
      console.log('All permissions granted!');
    } else {
      console.log('Some permissions were denied');
    }
    return granted;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};
```

### Reading Health Data

```typescript
// Get today's step count
const getTodaySteps = async () => {
  try {
    const steps = await HealthConnectManager.getTodaySteps();
    console.log(`Steps today: ${steps}`);
    return steps;
  } catch (error) {
    console.error('Error reading steps:', error);
    return 0;
  }
};

// Get last night's sleep hours
const getLastNightSleep = async () => {
  try {
    const sleepHours = await HealthConnectManager.getLastNightSleep();
    console.log(`Sleep last night: ${sleepHours} hours`);
    return sleepHours;
  } catch (error) {
    console.error('Error reading sleep data:', error);
    return 0;
  }
};

// Get latest heart rate
const getLatestHeartRate = async () => {
  try {
    const heartRate = await HealthConnectManager.getLatestHeartRate();
    console.log(`Latest heart rate: ${heartRate} bpm`);
    return heartRate;
  } catch (error) {
    console.error('Error reading heart rate:', error);
    return 0;
  }
};
```

### Complete Example Component

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { HealthConnectManager } from 'react-native-buddi-health-connect';

const HealthDashboard = () => {
  const [healthData, setHealthData] = useState({
    steps: 0,
    sleepHours: 0,
    heartRate: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Initialize Health Connect
    const initialized = await HealthConnectManager.initialize();
    setIsInitialized(initialized);

    if (initialized) {
      // Check permissions
      const permissions = await HealthConnectManager.hasAllPermissions();
      setHasPermissions(permissions);

      if (permissions) {
        loadHealthData();
      }
    }
  };

  const requestPermissions = async () => {
    const granted = await HealthConnectManager.requestAllPermissions();
    setHasPermissions(granted);
    
    if (granted) {
      loadHealthData();
    } else {
      Alert.alert('Permissions Required', 'Health Connect permissions are needed to show your health data.');
    }
  };

  const loadHealthData = async () => {
    try {
      const [steps, sleepHours, heartRate] = await Promise.all([
        HealthConnectManager.getTodaySteps(),
        HealthConnectManager.getLastNightSleep(),
        HealthConnectManager.getLatestHeartRate(),
      ]);

      setHealthData({ steps, sleepHours, heartRate });
    } catch (error) {
      console.error('Error loading health data:', error);
    }
  };

  const openSettings = () => {
    HealthConnectManager.openSettings();
  };

  if (!isInitialized) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Health Connect is not available on this device</Text>
      </View>
    );
  }

  if (!hasPermissions) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Health Connect permissions are required</Text>
        <Button title="Grant Permissions" onPress={requestPermissions} />
        <Button title="Open Settings" onPress={openSettings} />
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Health Dashboard</Text>
      
      <View style={{ marginTop: 20 }}>
        <Text>Steps Today: {healthData.steps.toLocaleString()}</Text>
        <Text>Sleep Last Night: {healthData.sleepHours.toFixed(1)} hours</Text>
        <Text>Latest Heart Rate: {healthData.heartRate || 'N/A'} bpm</Text>
      </View>
      
      <Button title="Refresh Data" onPress={loadHealthData} />
    </View>
  );
};

export default HealthDashboard;
```

## 🔧 API Reference

### HealthConnectManager

#### Methods

##### `initialize(): Promise<boolean>`
Initializes Health Connect and checks availability.

**Returns:** `Promise<boolean>` - `true` if Health Connect is available

##### `hasAllPermissions(): Promise<boolean>`
Checks if all required permissions are granted.

**Returns:** `Promise<boolean>` - `true` if all permissions are granted

##### `requestAllPermissions(): Promise<boolean>`
Requests all required Health Connect permissions from the user.

**Returns:** `Promise<boolean>` - `true` if all permissions were granted

##### `getTodaySteps(): Promise<number>`
Gets the total step count for today.

**Returns:** `Promise<number>` - Total steps for today

##### `getLastNightSleep(): Promise<number>`
Gets the sleep duration for the last night in hours.

**Returns:** `Promise<number>` - Sleep duration in hours

##### `getLatestHeartRate(): Promise<number>`
Gets the most recent heart rate measurement.

**Returns:** `Promise<number>` - Heart rate in beats per minute

##### `openSettings(): void`
Opens the Health Connect settings screen.

### Types

```typescript
interface StepsData {
  count: number;
  startTime: number;
  endTime: number;
}

interface HeartRateData {
  beatsPerMinute: number;
  time: number;
}

interface SleepData {
  startTime: number;
  endTime: number;
  title: string;
  notes: string;
  durationHours: number;
}

interface PermissionStatus {
  steps: boolean;
  heartRate: boolean;
  sleep: boolean;
}
```

## 🛠️ Troubleshooting

### Common Issues

#### Health Connect Not Available
- Ensure the device is running Android 8.0+ (API level 26)
- Verify that Health Connect is installed on the device
- Check that your app targets SDK 26 or higher

#### Permissions Not Working
- Verify the correct permissions are declared in AndroidManifest.xml
- Make sure the Health Connect package is included in the `<queries>` section
- Try clearing the app data and requesting permissions again

#### No Data Returned
- Ensure permissions have been granted
- Check that there is actual data in Health Connect for the requested time period
- Verify the device has health data to read

### Debug Mode

Enable debug logging by adding this to your app:

```typescript
// Add debug logging
console.log('Health Connect Debug Mode Enabled');
```

## 🧪 Testing

The library includes a comprehensive test suite. To run tests in your own app:

```typescript
import { HealthConnectManager } from 'react-native-buddi-health-connect';

const runTests = async () => {
  console.log('🧪 Testing Health Connect Bridge...');
  
  // Test availability
  const isAvailable = await HealthConnectManager.initialize();
  console.log('Available:', isAvailable);
  
  // Test permissions
  const hasPermissions = await HealthConnectManager.hasAllPermissions();
  console.log('Has Permissions:', hasPermissions);
  
  // Test data reading
  const steps = await HealthConnectManager.getTodaySteps();
  console.log('Steps:', steps);
};
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the example app: `npm run example`

### Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation for API changes
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

- **Author**: Augusto Baglieri
- **Original Project**: Buddi Life OS
- **Inspired by**: The need for seamless health data integration in React Native applications

## 🔗 Related Projects

- [Buddi Life OS](https://github.com/augusto-baglieri/buddi) - The main project this library was developed for
- [Android Health Connect](https://developer.android.com/health-and-fitness/guides/health-connect) - Official Android Health Connect documentation

## 📞 Support

For support, please:

1. Check the [troubleshooting section](#-troubleshooting)
2. Search existing [issues](https://github.com/augusto-baglieri/react-native-buddi-health-connect/issues)
3. Create a new issue with detailed information

---

**Made with ❤️ for the React Native community**