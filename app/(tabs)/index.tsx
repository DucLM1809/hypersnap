import {
  Button,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text
} from 'react-native'

import {
  RNHVDocsCapture,
  RNHVNetworkHelper,
  RNHVQRScanCapture,
  RNHyperSnapParams,
  RNHyperSnapSDK
} from 'hypersnapsdk_reactnative'
import { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

let initSuccess = false

export default function HomeScreen() {
  const [liveness, setLiveness] = useState(RNHyperSnapParams.LivenessModeNone)
  const [docType, setDocType] = useState(RNHyperSnapParams.DocumentTypeCard)

  const [documentOutput, setDocumentOutput] = useState('')
  const [faceOutput, setFaceOutput] = useState('')
  const [qrOutput, setQrOutput] = useState('')

  const printDictionary = (dict: any, out: any, isSuccess: any) => {
    let result = isSuccess ? 'Results:' : 'Error Received:'
    for (let key in dict) {
      result += `\n${key} : ${dict[key]}`
    }

    if (out === 'doc') {
      setDocumentOutput(result)
    } else if (out === 'qr') {
      setQrOutput(result)
    } else {
      setFaceOutput(result)
    }
  }

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestCameraPermission()
    }

    RNHyperSnapSDK.initialize('', '', RNHyperSnapParams.RegionAsiaPacific)
    initSuccess = true
  }, [])

  const hvDocs = () => {
    // RNHyperSnapSDK.startUserSession(
    //   `txn_${Date.now()}_50c06576-9789-4bf9-927d-cc7e625e2fb0}`
    // )

    const closure = (error: any, result: any) => {
      if (error != null && Object.keys(error).length > 0) {
        console.log('error', error)
        printDictionary(error, 'doc', false)
      } else {
        console.log('result', result)
        printDictionary(result, 'doc', true)

        try {
          let params = {}
          let headers = {
            transactionId: `txn_${Date.now()}_50c06576-9789-4bf9-927d-cc7e625e2fb0}`
          }
          var closure = (error: any, result: any, headers: any) => {
            if (error != null && Object.keys(error).length > 0) {
              console.log('error', error)
              printDictionary(error, 'doc', true)
            } else {
              console.log('result', result)
              printDictionary(result, 'doc', true)
            }
          }

          const docImageUri = result['imageUri']

          RNHVNetworkHelper.makeOCRCall(
            'https://vnm-docs.hyperverge.co/v2/nationalID',
            docImageUri,
            params,
            headers,
            closure
          )

          // RNHVFaceCapture.setLivenessMode(
          //   RNHyperSnapParams.LivenessModeTextureLiveness
          // )
          // RNHVFaceCapture.start((error: any, result: any, headers: any) => {
          //   if (error != null) {
          //     printDictionary(error, 'face', false) //passing error to printDictonary to print the error
          //   } else {
          //     printDictionary(result, 'face', true) //passing error to printDictonary to print the result
          //     const faceImageUri = result['imageUri']

          //     try {
          //       let params = {}
          //       let headers = {}
          //       var closure = (error: any, result: any, headers: any) => {
          //         if (error != null) {
          //           console.log('error', error)
          //           printDictionary(error, 'face', false)
          //         } else {
          //           console.log('result', result)
          //           printDictionary(result, 'face', true)
          //         }
          //       }
          //       RNHVNetworkHelper.makeFaceMatchCall(
          //         'https://apac.faceid.hyperverge.co/v1/photo/verifyPair',
          //         faceImageUri,
          //         docImageUri,
          //         params,
          //         headers,
          //         closure
          //       )
          //     } catch (error) {
          //       console.log('error')
          //     }
          //   }
          // })
        } catch (error) {
          console.log('error')
        }
      }
    }

    RNHVDocsCapture.setShouldShowReviewScreen(true)
    RNHVDocsCapture.setDocumentType(docType)
    RNHVDocsCapture.setDocCaptureSubText('National ID')
    RNHVDocsCapture.setDocCaptureDescription(
      'Place your National ID inside the box'
    )
    RNHVDocsCapture.start(closure)
  }

  const qrScan = () => {
    const qrClosure = (error: any, result: any) => {
      if (error != null) {
        printDictionary(error, 'qr', false)
      } else {
        console.log('QR Result:', result)
        printDictionary(result, 'qr', true)
      }
    }
    RNHVQRScanCapture.start(qrClosure)
  }

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      {/* Document Modal */}
      <Button onPress={hvDocs} title='Start Document Verification' />
      <Text style={styles.results}>{documentOutput}</Text>

      {/* QR Modal */}
      {/* <Button onPress={qrScan} title='Start QR Scanner' />
      <Text style={styles.results}>{qrOutput}</Text> */}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute'
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  },
  intro: {
    margin: 10
  },
  results: {
    fontSize: 18,
    textAlign: 'center',
    margin: 10
  },
  subcontainer: {
    margin: 10
  },
  inputstyle: {
    width: '50%',
    margin: 10
  },
  button: {
    backgroundColor: 'lightblue',
    borderRadius: 4,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 12,
    margin: 16,
    justifyContent: 'center',
    alignItems: 'center'
  }
})

async function requestCameraPermission() {
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
  } catch (err) {
    console.warn(err)
  }
}
