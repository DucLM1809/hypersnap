pipeline {
  agent any

  environment {
    VERCEL_TOKEN = credentials('vercel_token')
  }

  stages {
    stage('Build and Deploy Frontend Service') {
      steps {
        dir('frontend') {
          sh 'yarn install'
          sh 'yarn build'
          sh 'npx vercel --prod --token $VERCEL_TOKEN --yes'
        }
      }
    }
  }

  post {
    success {
      echo 'Frontend deployed successfully to Vercel.'
    }
    failure {
      echo 'Frontend deployment failed.'
    }
  }
}