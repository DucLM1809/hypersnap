const { withProjectBuildGradle } = require('@expo/config-plugins')

const withRootGradleConfig = (config) => {
  return withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults

    // 1. Định nghĩa các đoạn code cần chèn
    const customMavenRepo = `
        maven {
            url "https://s3.ap-south-1.amazonaws.com/hvsdk/android/releases"
        }`

    const googleServicesClasspath = `classpath 'com.google.gms:google-services:4.4.1'`

    // 2. Chèn Maven Repo vào cả buildscript và allprojects
    // Mẹo: Vì cả 2 block đều chứa 'mavenCentral()', ta chèn ngay sau nó để áp dụng cho cả hai.
    if (!buildGradle.contents.includes('hvsdk/android/releases')) {
      buildGradle.contents = buildGradle.contents.replace(
        /mavenCentral\(\)/g,
        `mavenCentral()
        ${customMavenRepo}`
      )
    }

    // 3. Chèn dependencies vào buildscript
    // Ta tìm dòng classpath của android tools để chèn google-services vào trước hoặc sau nó.
    if (!buildGradle.contents.includes('com.google.gms:google-services')) {
      buildGradle.contents = buildGradle.contents.replace(
        /dependencies\s?{/,
        `dependencies {
        ${googleServicesClasspath}`
      )
    }

    return config
  })
}

module.exports = withRootGradleConfig
