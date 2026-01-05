// plugins/withReleaseSigning.js
const { withAppBuildGradle } = require('@expo/config-plugins')

const withReleaseSigning = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      // Đoạn code Gradle chúng ta muốn chèn vào
      // Lưu ý: Gradle cho phép mở lại block 'android {}' để bổ sung config
      const signingConfig = `
// --- BẮT ĐẦU AUTO-CONFIG BỞI withReleaseSigning ---
android {
    signingConfigs {
        release {
            // Kiểm tra xem các biến này có được khai báo trong gradle.properties không
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
            // Ép buộc bật các chuẩn bảo mật cao nhất
            enableV1Signing true
            enableV2Signing true
            enableV3Signing true
            enableV4Signing true
        }
    }
    buildTypes {
        release {
            // Áp dụng cấu hình release vừa tạo ở trên
            signingConfig signingConfigs.release
        }
    }
}
// --- KẾT THÚC AUTO-CONFIG ---
`
      // Nối đoạn config này vào cuối file build.gradle
      config.modResults.contents += signingConfig
    }
    return config
  })
}

module.exports = withReleaseSigning
