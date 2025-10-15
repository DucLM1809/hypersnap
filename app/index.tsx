import { requestNotificationPermission } from '@/hooks/use-push-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Application from 'expo-application'
import { readAsStringAsync } from 'expo-file-system/legacy'
import {
  RNHVDocsCapture,
  RNHVFaceCapture,
  RNHVNetworkHelper,
  RNHVQRScanCapture,
  RNHyperSnapParams,
  RNHyperSnapSDK
} from 'hypersnapsdk_reactnative'
import { useEffect, useRef } from 'react'
import { PermissionsAndroid, Platform, Text, View } from 'react-native'
import { getUniqueId } from 'react-native-device-info'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView, WebViewMessageEvent } from 'react-native-webview'

export default function HomeScreen() {
  const webviewRef = useRef<WebView>(null)

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestPermission()
    }

    RNHyperSnapSDK.initialize(
      process.env.EXPO_PUBLIC_APP_ID,
      process.env.EXPO_PUBLIC_APP_KEY,
      RNHyperSnapParams.RegionAsiaPacific
    )
  }, [])

  const hvDocs = (type: 'front' | 'back') => {
    RNHyperSnapSDK.startUserSession(`us_${Date.now()}`)

    const closure = async (error: any, result: any) => {
      if (error != null && Object.keys(error).length > 0) {
        console.log('error', error)
      } else {
        try {
          let params = {}
          let headers = {
            transactionId: `txn_${Date.now()}_50c06576-9789-4bf9-927d-cc7e625e2fb0}`
          }

          const docImageUri = result['imageUri']

          const base64 = await readAsStringAsync(`file://${docImageUri}`, {
            encoding: 'base64'
          })

          var closure = (error: any, result: any) => {
            if (error != null && Object.keys(error).length > 0) {
              console.log('error', error)
            } else {
              if (type === 'front') {
                webviewRef.current?.injectJavaScript(`
              if (window.handleCCCDFrontCameraImage) {
                console.log('Sending image URI to React app');
                window.handleCCCDFrontCameraImage(${JSON.stringify(
                  `data:image/jpeg;base64,${base64}`
                )}, ${JSON.stringify(result)});
              }
            `)
              } else {
                webviewRef.current?.injectJavaScript(`
              if (window.handleCCCDBackCameraImage) {
                console.log('Sending image URI to React app');
                window.handleCCCDBackCameraImage(${JSON.stringify(
                  `data:image/jpeg;base64,${base64}`
                )}, ${JSON.stringify(result)});
                }
                `)
              }
            }
          }

          RNHVNetworkHelper.makeOCRCall(
            'https://vnm-docs.hyperverge.co/v2/nationalID',
            docImageUri,
            params,
            headers,
            closure
          )
        } catch (error) {
          console.log('error', error)
        }
      }
    }

    RNHVDocsCapture.setShouldShowReviewScreen(true)
    RNHVDocsCapture.setDocumentType(RNHyperSnapParams.DocumentTypeCard)
    RNHVDocsCapture.setDocCaptureTitle(
      type === 'front' ? 'Chụp hình CCCD mặt trước' : 'Chụp hình CCCD mặt sau'
    )
    RNHVDocsCapture.setDocCaptureSubText('Căn cước công dân')
    RNHVDocsCapture.setDocCaptureDescription(
      'Đặt căn cước công dân của bạn vào trong khung hình và chụp ảnh'
    )
    RNHVDocsCapture.start(closure)
  }

  const hvFaceCapture = () => {
    RNHVFaceCapture.setFaceCaptureTitle(
      'Đặt khuôn mặt của bạn vào trong khung hình'
    )
    RNHVFaceCapture.setLivenessMode(
      RNHyperSnapParams.LivenessModeTextureLiveness
    )
    RNHVFaceCapture.start(async (error: any, result: any) => {
      if (error != null && Object.keys(error).length > 0) {
        console.log('error', error)
      } else {
        const faceImageUri = result['imageUri']

        const base64 = await readAsStringAsync(`file://${faceImageUri}`, {
          encoding: 'base64'
        })

        webviewRef.current?.injectJavaScript(`
              if (window.handleSelfieCameraImage) {
                console.log('Sending image URI to React app');
                window.handleSelfieCameraImage(${JSON.stringify(
                  `data:image/jpeg;base64,${base64}`
                )}, ${JSON.stringify(result)});
              }
            `)

        // try {
        //   let params = {}
        //   let headers = {}
        //   var closure = (error: any, result: any) => {
        //     if (error != null && Object.keys(error).length > 0) {
        //       console.log('error', error)
        //     } else {
        //       console.log('result', result)

        //     }
        //   }

        //   // RNHVNetworkHelper.makeFaceMatchCall(
        //   //   'https://apac.faceid.hyperverge.co/v1/photo/verifyPair',
        //   //   faceImageUri,
        //   //   frontImageUri,
        //   //   params,
        //   //   headers,
        //   //   closure
        //   // )
        // } catch (error) {
        //   console.log('error')
        // }
      }
    })
  }

  const hvQRScan = () => {
    const qrClosure = (error: any, result: any) => {
      if (error != null && Object.keys(error).length > 0) {
        console.log(error)
      } else {
        console.log('QR Result:', result)

        webviewRef.current?.injectJavaScript(`
              if (window.handleQRCodeCameraImage) {
                console.log('Sending image URI to React app');
                window.handleQRCodeCameraImage(${JSON.stringify(result)});
              }
            `)
      }
    }

    RNHVQRScanCapture.start(qrClosure)
  }

  const onMessage = async (event: WebViewMessageEvent) => {
    const message = event.nativeEvent.data

    if (message === 'openCCCDFrontCamera') {
      hvDocs('front')
    }

    if (message === 'openCCCDBackCamera') {
      hvDocs('back')
    }

    if (message === 'openSelfieCamera') {
      hvFaceCapture()
    }

    if (message === 'openQRCodeCamera') {
      hvQRScan()
    }

    if (message === 'getDeviceInfo') {
      const deviceId = await getUniqueId()
      const deviceToken = await AsyncStorage.getItem('fcmToken')

      const version = Application.nativeApplicationVersion
      const buildNumber = Application.nativeBuildVersion

      const deviceInfo = {
        platform: Platform.OS,
        osVersion: Platform.Version,
        deviceId,
        version,
        buildNumber,
        deviceToken
      }

      webviewRef.current?.injectJavaScript(`
              if (window.handleGetDeviceInfo) {
                window.handleGetDeviceInfo(${JSON.stringify(deviceInfo)});
              }
            `)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        ref={webviewRef}
        originWhitelist={[`${process.env.EXPO_PUBLIC_APP_URL}`]}
        source={{
          uri: `${process.env.EXPO_PUBLIC_APP_URL}`
        }}
        onMessage={onMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback={false}
        allowingReadAccessToURL={`${process.env.EXPO_PUBLIC_APP_URL}`}
        thirdPartyCookiesEnabled={false}
        javaScriptCanOpenWindowsAutomatically={false}
        dataDetectorTypes='none'
        hideKeyboardAccessoryView={true}
        allowsLinkPreview={false}
        style={{ flex: 1 }}
        startInLoadingState
        renderError={() => (
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ color: 'red', fontSize: 16, textAlign: 'center' }}>
              Could not load the Facing App.\n\nMake sure the dev server is
              running.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

async function requestPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera permissions are required by HyperSnapSDK',
        message:
          'HyperSnapSDK needs access to your camera so you can take awesome pictures.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
        buttonNeutral: 'Ask Me Later'
      }
    )

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Camera Permissions have been successfully set.')
    } else {
      console.log('Camera permission denied')
    }

    requestNotificationPermission()
  } catch (err) {
    console.warn(err)
  }
}
