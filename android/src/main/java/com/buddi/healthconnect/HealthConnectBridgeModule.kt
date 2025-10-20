package com.buddi.healthconnect

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.time.temporal.ChronoUnit

@ReactModule(name = HealthConnectBridgeModule.NAME)
class HealthConnectBridgeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        const val NAME = "HealthConnectBridge"
    }
    
    private var healthConnectClient: HealthConnectClient? = null
    private val coroutineScope = CoroutineScope(Dispatchers.Main)
    
    override fun getName(): String {
        return NAME
    }
    
    init {
        // Inizializza il client Health Connect
        try {
            healthConnectClient = HealthConnectClient.getOrCreate(reactContext)
        } catch (e: Exception) {
            // Health Connect non disponibile
            healthConnectClient = null
        }
    }
    
    /**
     * Verifica se Health Connect è disponibile sul dispositivo
     */
    @ReactMethod
    fun isHealthConnectAvailable(promise: Promise) {
        try {
            val isAvailable = healthConnectClient != null
            promise.resolve(isAvailable)
        } catch (e: Exception) {
            promise.reject("HEALTH_CONNECT_ERROR", "Errore durante la verifica di Health Connect: ${e.message}", e)
        }
    }
    
    /**
     * Richiede i permessi necessari per Health Connect
     */
    @ReactMethod
    fun requestPermissions(promise: Promise) {
        try {
            if (healthConnectClient == null) {
                promise.reject("HEALTH_CONNECT_UNAVAILABLE", "Health Connect non è disponibile su questo dispositivo")
                return
            }
            
            val permissions = setOf(
                HealthPermission.getReadPermission(StepsRecord::class),
                HealthPermission.getReadPermission(HeartRateRecord::class),
                HealthPermission.getReadPermission(SleepSessionRecord::class)
            )
            
            coroutineScope.launch {
                try {
                    val grantedPermissions = healthConnectClient!!.permissionController.getGrantedPermissions()
                    
                    if (permissions.all { it in grantedPermissions }) {
                        // Tutti i permessi sono già stati concessi
                        promise.resolve(createPermissionResult(true, "Tutti i permessi sono già stati concessi"))
                    } else {
                        // Richiedi i permessi mancanti
                        val permissionContract = PermissionController.createRequestPermissionResultContract()
                        val currentActivity = reactApplicationContext.currentActivity
                        
                        if (currentActivity == null) {
                            promise.reject("NO_ACTIVITY", "Nessuna activity corrente disponibile")
                            return@launch
                        }
                        
                        // Avvia la richiesta di permessi
                        val intent = permissionContract.createIntent(reactApplicationContext, permissions)
                        currentActivity.startActivity(intent)
                        
                        // Nota: Il risultato verrà gestito in checkPermissionStatus
                        promise.resolve(createPermissionResult(false, "Richiesta permessi avviata"))
                    }
                } catch (e: Exception) {
                    promise.reject("PERMISSION_ERROR", "Errore durante la richiesta permessi: ${e.message}", e)
                }
            }
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", "Errore durante la richiesta permessi: ${e.message}", e)
        }
    }
    
    /**
     * Verifica lo stato attuale dei permessi
     */
    @ReactMethod
    fun checkPermissionStatus(promise: Promise) {
        try {
            if (healthConnectClient == null) {
                promise.reject("HEALTH_CONNECT_UNAVAILABLE", "Health Connect non è disponibile")
                return
            }
            
            coroutineScope.launch {
                try {
                    val grantedPermissions = healthConnectClient!!.permissionController.getGrantedPermissions()
                    
                    val result = Arguments.createMap()
                    result.putBoolean("steps", HealthPermission.getReadPermission(StepsRecord::class) in grantedPermissions)
                    result.putBoolean("heartRate", HealthPermission.getReadPermission(HeartRateRecord::class) in grantedPermissions)
                    result.putBoolean("sleep", HealthPermission.getReadPermission(SleepSessionRecord::class) in grantedPermissions)
                    
                    promise.resolve(result)
                } catch (e: Exception) {
                    promise.reject("PERMISSION_CHECK_ERROR", "Errore durante il controllo permessi: ${e.message}", e)
                }
            }
        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", "Errore durante il controllo permessi: ${e.message}", e)
        }
    }
    
    /**
     * Legge i dati dei passi per un periodo specificato
     */
    @ReactMethod
    fun readStepsData(startDateMillis: Double, endDateMillis: Double, promise: Promise) {
        try {
            if (healthConnectClient == null) {
                promise.reject("HEALTH_CONNECT_UNAVAILABLE", "Health Connect non è disponibile")
                return
            }
            
            coroutineScope.launch {
                try {
                    val startTime = Instant.ofEpochMilli(startDateMillis.toLong())
                    val endTime = Instant.ofEpochMilli(endDateMillis.toLong())
                    
                    val request = ReadRecordsRequest(
                        recordType = StepsRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                    )
                    
                    val response = healthConnectClient!!.readRecords(request)
                    val stepsArray = Arguments.createArray()
                    
                    for (record in response.records) {
                        val stepData = Arguments.createMap()
                        stepData.putDouble("count", record.count.toDouble())
                        stepData.putDouble("startTime", record.startTime.toEpochMilli().toDouble())
                        stepData.putDouble("endTime", record.endTime.toEpochMilli().toDouble())
                        stepsArray.pushMap(stepData)
                    }
                    
                    promise.resolve(stepsArray)
                } catch (e: Exception) {
                    promise.reject("STEPS_READ_ERROR", "Errore durante la lettura dei passi: ${e.message}", e)
                }
            }
        } catch (e: Exception) {
            promise.reject("STEPS_READ_ERROR", "Errore durante la lettura dei passi: ${e.message}", e)
        }
    }
    
    /**
     * Legge i dati del battito cardiaco per un periodo specificato
     */
    @ReactMethod
    fun readHeartRateData(startDateMillis: Double, endDateMillis: Double, promise: Promise) {
        try {
            if (healthConnectClient == null) {
                promise.reject("HEALTH_CONNECT_UNAVAILABLE", "Health Connect non è disponibile")
                return
            }
            
            coroutineScope.launch {
                try {
                    val startTime = Instant.ofEpochMilli(startDateMillis.toLong())
                    val endTime = Instant.ofEpochMilli(endDateMillis.toLong())
                    
                    val request = ReadRecordsRequest(
                        recordType = HeartRateRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                    )
                    
                    val response = healthConnectClient!!.readRecords(request)
                    val heartRateArray = Arguments.createArray()
                    
                    for (record in response.records) {
                        for (sample in record.samples) {
                            val heartRateData = Arguments.createMap()
                            heartRateData.putDouble("beatsPerMinute", sample.beatsPerMinute.toDouble())
                            heartRateData.putDouble("time", sample.time.toEpochMilli().toDouble())
                            heartRateArray.pushMap(heartRateData)
                        }
                    }
                    
                    promise.resolve(heartRateArray)
                } catch (e: Exception) {
                    promise.reject("HEART_RATE_READ_ERROR", "Errore durante la lettura del battito cardiaco: ${e.message}", e)
                }
            }
        } catch (e: Exception) {
            promise.reject("HEART_RATE_READ_ERROR", "Errore durante la lettura del battito cardiaco: ${e.message}", e)
        }
    }
    
    /**
     * Legge i dati del sonno per un periodo specificato
     */
    @ReactMethod
    fun readSleepData(startDateMillis: Double, endDateMillis: Double, promise: Promise) {
        try {
            if (healthConnectClient == null) {
                promise.reject("HEALTH_CONNECT_UNAVAILABLE", "Health Connect non è disponibile")
                return
            }
            
            coroutineScope.launch {
                try {
                    val startTime = Instant.ofEpochMilli(startDateMillis.toLong())
                    val endTime = Instant.ofEpochMilli(endDateMillis.toLong())
                    
                    val request = ReadRecordsRequest(
                        recordType = SleepSessionRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                    )
                    
                    val response = healthConnectClient!!.readRecords(request)
                    val sleepArray = Arguments.createArray()
                    
                    for (record in response.records) {
                        val sleepData = Arguments.createMap()
                        sleepData.putDouble("startTime", record.startTime.toEpochMilli().toDouble())
                        sleepData.putDouble("endTime", record.endTime.toEpochMilli().toDouble())
                        sleepData.putString("title", record.title ?: "Sessione di sonno")
                        sleepData.putString("notes", record.notes ?: "")
                        
                        // Calcola la durata del sonno in ore
                        val durationHours = ChronoUnit.HOURS.between(record.startTime, record.endTime).toDouble()
                        sleepData.putDouble("durationHours", durationHours)
                        
                        sleepArray.pushMap(sleepData)
                    }
                    
                    promise.resolve(sleepArray)
                } catch (e: Exception) {
                    promise.reject("SLEEP_READ_ERROR", "Errore durante la lettura dei dati del sonno: ${e.message}", e)
                }
            }
        } catch (e: Exception) {
            promise.reject("SLEEP_READ_ERROR", "Errore durante la lettura dei dati del sonno: ${e.message}", e)
        }
    }
    
    /**
     * Apre le impostazioni di Health Connect
     */
    @ReactMethod
    fun openHealthConnectSettings() {
        try {
            val intent = Intent().apply {
                action = "androidx.health.ACTION_HEALTH_CONNECT_SETTINGS"
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            if (intent.resolveActivity(reactApplicationContext.packageManager) != null) {
                reactApplicationContext.startActivity(intent)
            } else {
                // Fallback: apri le impostazioni generali
                val settingsIntent = Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.fromParts("package", reactApplicationContext.packageName, null)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactApplicationContext.startActivity(settingsIntent)
            }
        } catch (e: Exception) {
            // Silently fail - non è critico
        }
    }
    
    private fun createPermissionResult(granted: Boolean, message: String): WritableMap {
        val result = Arguments.createMap()
        result.putBoolean("granted", granted)
        result.putString("message", message)
        return result
    }
}