import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#080B12',
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '500px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '24px',
            padding: '32px',
            textAlign: 'center',
            backdropFilter: 'blur(20px)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 12px 0', color: '#f43f5e' }}>Application Error</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              An unexpected error occurred while rendering the UI:
            </p>
            <pre style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '12px',
              borderRadius: '12px',
              color: '#fda4af',
              fontSize: '11px',
              textAlign: 'left',
              overflowX: 'auto',
              marginBottom: '20px',
              maxHeight: '150px'
            }}>
              {this.state.error?.message || 'Unknown Error'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#2dd4bf',
                color: '#080b12',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '14px',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
