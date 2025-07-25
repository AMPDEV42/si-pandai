/**
 * Professional Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { logger } from '../../lib/logger';
import config from '../../config/environment';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    logger.error('Error Boundary caught an error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      errorId: this.state.errorId,
      props: this.props,
      timestamp: new Date().toISOString()
    });

    this.setState({
      error,
      errorInfo
    });

    // Report to error monitoring service in production
    if (config.isProduction) {
      this.reportErrorToService(error, errorInfo);
    }
  }

  reportErrorToService = (error, errorInfo) => {
    // In a production app, you would send this to an error monitoring service
    // like Sentry, Rollbar, or Bugsnag
    try {
      // Mock implementation
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      // In real implementation:
      // Sentry.captureException(error, { extra: errorData });
      console.log('Error reported to monitoring service:', errorData);
    } catch (reportingError) {
      logger.error('Failed to report error to monitoring service', reportingError);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent, showDetails = false } = this.props;
      const { error, errorInfo, errorId } = this.state;

      // If a custom fallback component is provided, use it
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorInfo={errorInfo}
            errorId={errorId}
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
            onReload={this.handleReload}
          />
        );
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
          <Card className="w-full max-w-2xl mx-auto glass-effect border-red-500/20">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Oops! Terjadi Kesalahan
              </CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah diberitahu dan sedang menangani masalah ini.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error ID for support */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-2">ID Error untuk referensi:</p>
                <code className="text-sm font-mono text-blue-400 bg-gray-900/50 px-2 py-1 rounded">
                  {errorId}
                </code>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ke Beranda
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Muat Ulang
                </Button>
              </div>

              {/* Development error details */}
              {config.isDevelopment && showDetails && error && (
                <details className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold text-red-400 flex items-center">
                    <Bug className="w-4 h-4 mr-2" />
                    Detail Error (Development)
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div>
                      <h4 className="font-semibold text-white mb-2">Error Message:</h4>
                      <pre className="text-sm text-red-300 bg-red-900/30 p-3 rounded overflow-x-auto">
                        {error.message}
                      </pre>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-white mb-2">Stack Trace:</h4>
                      <pre className="text-xs text-gray-300 bg-gray-900/50 p-3 rounded overflow-x-auto max-h-40">
                        {error.stack}
                      </pre>
                    </div>
                    
                    {errorInfo && (
                      <div>
                        <h4 className="font-semibold text-white mb-2">Component Stack:</h4>
                        <pre className="text-xs text-gray-300 bg-gray-900/50 p-3 rounded overflow-x-auto max-h-40">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Support information */}
              <div className="text-center text-sm text-gray-400">
                <p>
                  Jika masalah terus berlanjut, silakan hubungi tim support dengan menyertakan ID Error di atas.
                </p>
                <p className="mt-2">
                  Email: <a href="mailto:support@sipandai.app" className="text-blue-400 hover:underline">
                    support@sipandai.app
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for easier usage
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;
