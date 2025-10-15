import AsyncStorage from '@react-native-async-storage/async-storage'
import messaging, { firebase } from '@react-native-firebase/messaging'
import { PermissionsAndroid, Platform } from 'react-native'
import Toast from 'react-native-toast-message'
import config from '../google-services.json'

export const requestNotificationPermission = async () => {
  if (!firebase.apps.length) {
    await firebase.initializeApp({
      apiKey: config.client[0].api_key[0].current_key,
      appId: config.client[0].client_info.mobilesdk_app_id,
      projectId: config.project_info.project_id,
      messagingSenderId:
        config.client[0].client_info.mobilesdk_app_id.split(':')[1],
      databaseURL: '',
      storageBucket: config.project_info.storage_bucket
    })
  }

  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    )

    if (!hasPermission) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      )

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('Push notification permissions are not granted.')
        return false
      }
    }
  }

  const authStatus = await messaging().requestPermission()
  const isAuthorized =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL

  if (!isAuthorized) {
    console.warn('Push notification permissions are not granted.')
  } else {
    await getToken()

    handleBackgroundNotifications()
    handleForegroundNotification()
  }

  return isAuthorized
}

const getToken = async () => {
  try {
    if (Platform.OS === 'ios') {
      const apnsToken = await messaging().getAPNSToken()
      if (!apnsToken) {
        console.warn('APNs token is null. Check APNs setup.')
        return
      }
      console.log('APNs Token:', apnsToken)
    }

    const fcmToken = await messaging().getToken()

    if (!(await AsyncStorage.getItem('fcmToken'))) {
      await AsyncStorage.setItem('fcmToken', fcmToken)
    }

    console.log('FCM Token:', fcmToken)

    // return fcmToken
  } catch (error) {
    console.error('Error fetching push notification token:', error)
  }
}

const handleForegroundNotification = () => {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log('Foreground message received:', remoteMessage)

    Toast.show({
      type: 'success',
      text1: remoteMessage.notification?.title,
      text2: remoteMessage.notification?.body
    })
  })

  return unsubscribe
}

const handleBackgroundNotifications = async () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message received:', remoteMessage)
  })

  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification opened from background:', remoteMessage)
  })

  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('Notification opened from quit state:', remoteMessage)
      }
    })
}

// export const usePushNotifications = () => {

//   useEffect(() => {
//     let unsubscribe = () => {}

//     ;(async () => {
//       const hasPermission = await requestPermission()

//       if (hasPermission) {

//       }
//     })()

//     return () => {
//       unsubscribe()
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])
// }
