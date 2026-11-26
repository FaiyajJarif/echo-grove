import { Component } from 'react';

/** Shows a readable message instead of a blank page if anything crashes while rendering. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Echo Grove crashed:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="page narrow">
        <section className="glass holo hero-card" role="alert">
          <h1>Something went wrong</h1>
          <p>The page hit an error. Reloading usually fixes it. If it keeps happening, copy the message below.</p>
          <pre className="code">{String(this.state.error?.message || this.state.error)}</pre>
          <div className="row"><button className="btn-primary" onClick={() => window.location.reload()}>Reload</button></div>
        </section>
      </main>
    );
  }
}
