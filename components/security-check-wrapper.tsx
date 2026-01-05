import JailMonkey from 'jail-monkey'
import React, { ReactNode, useEffect, useState } from 'react'
import {
  Alert,
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native'
import RNExitApp from 'react-native-exit-app'

// Nếu không muốn cài thêm 'react-native-exit-app', bạn có thể dùng BackHandler cho Android
// và chỉ hiển thị màn hình chặn cho iOS.

export const SecurityCheckWrapper = ({ children }: { children: ReactNode }) => {
  const [isSecure, setIsSecure] = useState(true)

  useEffect(() => {
    checkDeviceSecurity()
  }, [])

  const checkDeviceSecurity = () => {
    // 1. Kiểm tra Jailbreak/Root
    const isJailBroken = JailMonkey.isJailBroken()

    // 2. Kiểm tra xem app có đang chạy trên máy ảo không (Optional - tăng bảo mật)
    // const canMockLocation = JailMonkey.canMockLocation();
    // const trustFall = JailMonkey.trustFall();

    if (isJailBroken) {
      setIsSecure(false)
      showSecurityAlert()
    }
  }

  const showSecurityAlert = () => {
    Alert.alert(
      'Cảnh báo bảo mật',
      'Thiết bị của bạn đã bị Root hoặc Jailbreak. Để đảm bảo an toàn dữ liệu, ứng dụng không thể hoạt động trên thiết bị này.',
      [
        {
          text: 'Thoát ứng dụng',
          onPress: () => {
            if (Platform.OS === 'android') {
              BackHandler.exitApp()
            } else {
              // iOS không khuyến khích exit app bằng code,
              // nhưng ta có thể giữ người dùng ở màn hình chặn.
              RNExitApp.exitApp()
            }
          }
        }
      ],
      { cancelable: false } // Không cho phép bấm ra ngoài để tắt popup
    )
  }

  if (!isSecure) {
    // Hiển thị màn hình chặn, không render WebView hay nội dung App
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Thiết bị không an toàn. Vui lòng sử dụng thiết bị gốc để truy cập.
        </Text>
      </View>
    )
  }

  // Nếu an toàn, render nội dung app (WebView,...)
  return children
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  text: { textAlign: 'center', fontSize: 16, color: 'red' }
})
