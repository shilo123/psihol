import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.overlay}>
          <div style={styles.card}>
            <span className="material-symbols-rounded" style={styles.icon}>
              sentiment_dissatisfied
            </span>
            <h1 style={styles.title}>אופס, משהו השתבש</h1>
            <p style={styles.subtitle}>
              אנחנו מתנצלים, נתקלנו בשגיאה לא צפויה. אנא נסו שוב.
            </p>
            <div style={styles.buttons}>
              <button style={styles.primaryButton} onClick={this.handleReset}>
                <span className="material-symbols-rounded" style={styles.buttonIcon}>
                  refresh
                </span>
                נסה שוב
              </button>
              <button style={styles.secondaryButton} onClick={this.handleGoHome}>
                <span className="material-symbols-rounded" style={styles.buttonIcon}>
                  home
                </span>
                חזרה לדף הבית
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    backdropFilter: 'blur(6px)',
    zIndex: 9999,
    direction: 'rtl',
    fontFamily: "'Assistant', 'Heebo', sans-serif",
    padding: '1rem',
  },
  card: {
    background: '#fff',
    borderRadius: '1.25rem',
    padding: '2.5rem 2rem',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(122, 90, 252, 0.2), 0 4px 16px rgba(0,0,0,0.1)',
    animation: 'fadeIn 0.3s ease',
  },
  icon: {
    fontSize: '3.5rem',
    color: '#7a5afc',
    marginBottom: '0.5rem',
    display: 'block',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#2d2d3a',
    margin: '0.75rem 0 0.5rem',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#6b6b80',
    lineHeight: 1.6,
    margin: '0 0 1.75rem',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#7a5afc',
    border: 'none',
    borderRadius: '0.75rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.2s',
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#7a5afc',
    backgroundColor: 'transparent',
    border: '2px solid #7a5afc',
    borderRadius: '0.75rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.2s, color 0.2s',
  },
  buttonIcon: {
    fontSize: '1.25rem',
  },
}
