import { Component } from 'react'
import { Button } from './ui/button'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-lg font-semibold text-destructive">エラーが発生しました</p>
          <p className="text-sm text-muted-foreground">{this.state.error?.message}</p>
          <Button
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            再試行
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
