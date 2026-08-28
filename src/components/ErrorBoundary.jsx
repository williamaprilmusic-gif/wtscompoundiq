// src/components/ErrorBoundary.jsx
// Top-level safety net: without this, one uncaught throw anywhere in the tree
// white-screens the entire app for the user. Class component is required here --
// componentDidCatch/getDerivedStateFromError have no hook equivalent.
import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // No error-reporting service is wired up (this app sends nothing anywhere, by
    // design -- see the Privacy notice) -- this is purely a local dev breadcrumb.
    console.error('WTS CompoundIQ crashed:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-card">
            <div className="error-boundary-icon">⚠️</div>
            <h1>Something went wrong</h1>
            <p>
              This page hit an unexpected error and couldn't continue. Your data is safe --
              everything this app stores lives only in your browser's local storage, and
              nothing was lost or sent anywhere.
            </p>
            <button className="error-boundary-btn" onClick={this.handleReload}>Reload the App</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
