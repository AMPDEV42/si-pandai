/**
 * Google Drive Integration Test Utility
 * Test function to validate the improved Google Drive upload functionality
 */

import { googleDriveService } from '../services/googleDriveService';
import { apiLogger } from '../lib/logger';

/**
 * Test Google Drive integration with improved error handling
 */
export const testGoogleDriveIntegration = async () => {
  const testResults = {
    configuration: false,
    initialization: false,
    authentication: false,
    folderCreation: false,
    fileUpload: false,
    errors: []
  };

  try {
    // Test 1: Configuration Check
    console.log('🔧 Testing Google Drive configuration...');
    testResults.configuration = googleDriveService.isConfigured();
    if (!testResults.configuration) {
      testResults.errors.push('Google Drive not configured - missing API keys');
      return testResults;
    }
    console.log('✅ Configuration check passed');

    // Test 2: Service Initialization
    console.log('🚀 Testing Google Drive initialization...');
    testResults.initialization = await googleDriveService.initialize();
    if (!testResults.initialization) {
      testResults.errors.push('Google Drive initialization failed');
      return testResults;
    }
    console.log('✅ Initialization check passed');

    // Test 3: Authentication Check
    console.log('🔐 Testing Google Drive authentication...');
    testResults.authentication = await googleDriveService.isAuthenticated();
    if (!testResults.authentication) {
      console.log('⚠️ Google Drive not authenticated - user needs to sign in');
      testResults.errors.push('User authentication required');
    } else {
      console.log('✅ Authentication check passed');
    }

    // Test 4: Folder Creation (only if authenticated)
    if (testResults.authentication) {
      console.log('📁 Testing folder creation...');
      try {
        const testSubmissionType = {
          category: 'Test Category',
          title: 'Test Submission'
        };
        const testEmployeeName = 'Test Employee';
        
        const { employeeFolderId } = await googleDriveService.createSubmissionFolderStructure(
          testSubmissionType,
          testEmployeeName
        );
        
        testResults.folderCreation = !!employeeFolderId;
        console.log('✅ Folder creation test passed');
      } catch (error) {
        testResults.errors.push(`Folder creation failed: ${error.message}`);
        console.log('❌ Folder creation test failed:', error.message);
      }

      // Test 5: File Upload (only if folder creation succeeded)
      if (testResults.folderCreation) {
        console.log('📤 Testing file upload...');
        try {
          // Create a test file
          const testContent = 'This is a test file for Google Drive integration validation';
          const testFile = new File([testContent], 'test-upload.txt', { type: 'text/plain' });
          
          const uploadResult = await googleDriveService.uploadFile(
            testFile,
            null, // Will use default folder
            'integration-test.txt'
          );
          
          testResults.fileUpload = !!uploadResult.id;
          console.log('✅ File upload test passed');
          
          // Clean up test file
          if (uploadResult.id) {
            await googleDriveService.deleteFile(uploadResult.id);
            console.log('🧹 Test file cleaned up');
          }
        } catch (error) {
          testResults.errors.push(`File upload failed: ${error.message}`);
          console.log('❌ File upload test failed:', error.message);
        }
      }
    }

    return testResults;

  } catch (error) {
    testResults.errors.push(`Integration test failed: ${error.message}`);
    apiLogger.error('Google Drive integration test failed', error);
    return testResults;
  }
};

/**
 * Generate a test report
 */
export const generateTestReport = (testResults) => {
  const totalTests = Object.keys(testResults).filter(key => key !== 'errors').length;
  const passedTests = Object.values(testResults).filter((value, index) => 
    index < totalTests && value === true
  ).length;

  const report = {
    summary: `${passedTests}/${totalTests} tests passed`,
    details: {
      configuration: testResults.configuration ? '✅ Passed' : '❌ Failed',
      initialization: testResults.initialization ? '✅ Passed' : '❌ Failed',
      authentication: testResults.authentication ? '✅ Passed' : '⚠️ Requires user action',
      folderCreation: testResults.folderCreation ? '✅ Passed' : '❌ Failed',
      fileUpload: testResults.fileUpload ? '✅ Passed' : '❌ Failed'
    },
    errors: testResults.errors,
    recommendations: []
  };

  // Add recommendations based on test results
  if (!testResults.configuration) {
    report.recommendations.push('Check .env file for VITE_GOOGLE_DRIVE_API_KEY and VITE_GOOGLE_DRIVE_CLIENT_ID');
  }
  
  if (!testResults.authentication) {
    report.recommendations.push('User needs to authenticate with Google Drive using the "Hubungkan Google Drive" button');
  }
  
  if (testResults.errors.length > 0) {
    report.recommendations.push('Check browser console for detailed error messages');
  }

  return report;
};
