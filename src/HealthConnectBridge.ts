// HealthConnectBridge.ts - Interfaccia TypeScript per il modulo nativo Health Connect

import { NativeModules } from 'react-native';

// Tipizzazioni per i dati Health Connect
export interface StepsData {
  count: number;
  startTime: number;
  endTime: number;
}

export interface HeartRateData {
  beatsPerMinute: number;
  time: number;
}

export interface SleepData {
  startTime: number;
  endTime: number;
  title: string;
  notes: string;
  durationHours: number;
}

export interface PermissionStatus {
  steps: boolean;
  heartRate: boolean;
  sleep: boolean;
}

export interface PermissionResult {
  granted: boolean;
  message: string;
}

// Interfaccia del modulo nativo
interface HealthConnectBridgeInterface {
  /**
   * Verifica se Health Connect è disponibile sul dispositivo
   */
  isHealthConnectAvailable(): Promise<boolean>;
  
  /**
   * Richiede i permessi necessari per Health Connect
   */
  requestPermissions(): Promise<PermissionResult>;
  
  /**
   * Verifica lo stato attuale dei permessi
   */
  checkPermissionStatus(): Promise<PermissionStatus>;
  
  /**
   * Legge i dati dei passi per un periodo specificato
   * @param startDateMillis Data di inizio in millisecondi
   * @param endDateMillis Data di fine in millisecondi
   */
  readStepsData(startDateMillis: number, endDateMillis: number): Promise<StepsData[]>;
  
  /**
   * Legge i dati del battito cardiaco per un periodo specificato
   * @param startDateMillis Data di inizio in millisecondi
   * @param endDateMillis Data di fine in millisecondi
   */
  readHeartRateData(startDateMillis: number, endDateMillis: number): Promise<HeartRateData[]>;
  
  /**
   * Legge i dati del sonno per un periodo specificato
   * @param startDateMillis Data di inizio in millisecondi
   * @param endDateMillis Data di fine in millisecondi
   */
  readSleepData(startDateMillis: number, endDateMillis: number): Promise<SleepData[]>;
  
  /**
   * Apre le impostazioni di Health Connect
   */
  openHealthConnectSettings(): void;
}

// Ottieni il modulo nativo
const HealthConnectBridge: HealthConnectBridgeInterface = NativeModules.HealthConnectBridge;

// Classe wrapper per facilitare l'uso
export class HealthConnectManager {
  
  /**
   * Inizializza Health Connect e verifica la disponibilità
   */
  static async initialize(): Promise<boolean> {
    try {
      const isAvailable = await HealthConnectBridge.isHealthConnectAvailable();
      if (!isAvailable) {
        console.warn('Health Connect non è disponibile su questo dispositivo');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Errore durante l\'inizializzazione di Health Connect:', error);
      return false;
    }
  }
  
  /**
   * Richiede tutti i permessi necessari
   */
  static async requestAllPermissions(): Promise<boolean> {
    try {
      const result = await HealthConnectBridge.requestPermissions();
      console.log('Risultato richiesta permessi:', result.message);
      return result.granted;
    } catch (error) {
      console.error('Errore durante la richiesta permessi:', error);
      return false;
    }
  }
  
  /**
   * Verifica se tutti i permessi sono stati concessi
   */
  static async hasAllPermissions(): Promise<boolean> {
    try {
      const status = await HealthConnectBridge.checkPermissionStatus();
      return status.steps && status.heartRate && status.sleep;
    } catch (error) {
      console.error('Errore durante il controllo permessi:', error);
      return false;
    }
  }
  
  /**
   * Ottiene i dati dei passi per oggi
   */
  static async getTodaySteps(): Promise<number> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      const stepsData = await HealthConnectBridge.readStepsData(
        startOfDay.getTime(),
        endOfDay.getTime()
      );
      
      return stepsData.reduce((total, record) => total + record.count, 0);
    } catch (error) {
      console.error('Errore durante la lettura dei passi di oggi:', error);
      return 0;
    }
  }
  
  /**
   * Ottiene le ore di sonno della notte scorsa
   */
  static async getLastNightSleep(): Promise<number> {
    try {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12); // Fino a mezzogiorno di oggi
      
      const sleepData = await HealthConnectBridge.readSleepData(
        startOfYesterday.getTime(),
        endOfToday.getTime()
      );
      
      return sleepData.reduce((total, record) => total + record.durationHours, 0);
    } catch (error) {
      console.error('Errore durante la lettura del sonno della notte scorsa:', error);
      return 0;
    }
  }
  
  /**
   * Ottiene la frequenza cardiaca media degli ultimi dati disponibili
   */
  static async getLatestHeartRate(): Promise<number> {
    try {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      const heartRateData = await HealthConnectBridge.readHeartRateData(
        twoHoursAgo.getTime(),
        now.getTime()
      );
      
      if (heartRateData.length === 0) return 0;
      
      const average = heartRateData.reduce((sum, record) => sum + record.beatsPerMinute, 0) / heartRateData.length;
      return Math.round(average);
    } catch (error) {
      console.error('Errore durante la lettura della frequenza cardiaca:', error);
      return 0;
    }
  }
  
  /**
   * Apre le impostazioni di Health Connect
   */
  static openSettings(): void {
    HealthConnectBridge.openHealthConnectSettings();
  }
}

export default HealthConnectBridge;