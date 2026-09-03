import React from 'react';

/**
 * 全局错误边界组件 (ErrorBoundary)
 *
 * 核心作用：
 * 1. 拦截路由组件懒加载失败 (如网络波动、CDN 抖动、新版本发布导致的 ChunkLoadError)
 * 2. 避免局部或子组件崩溃引发全站白屏
 * 3. 遵循 Apple 极简卡片视觉风格，提供清晰引导与一键恢复能力
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetail: false,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] 捕获到未处理的组件树异常:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/';
  };

  toggleDetail = () => {
    this.setState((prev) => ({ showDetail: !prev.showDetail }));
  };

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.name === 'ChunkLoadError' ||
        /Loading (CSS )?chunk .* failed/i.test(this.state.error?.message || '');

      return (
        <div
          style={{
            minHeight: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1.5rem',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg, 18px)',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-card-hover, 0 12px 30px rgba(0,0,0,0.08))',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                margin: '0 auto 1.25rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff3b30',
                fontSize: '28px',
              }}
            >
              ⚠️
            </div>

            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
              }}
            >
              {isChunkError ? '页面组件加载失败' : '页面渲染发生异常'}
            </h2>

            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '1.75rem',
              }}
            >
              {isChunkError
                ? '可能是网络连接不稳定或站点刚刚更新了资源版本，请尝试刷新重试。'
                : '抱歉，当前页面遇到了未预期的错误，你可以尝试刷新或返回首页。'}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: '0.6rem 1.4rem',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: '#fff',
                  backgroundColor: 'var(--accent-color, #0071e3)',
                  border: 'none',
                  borderRadius: 'var(--radius-pill, 9999px)',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
              >
                刷新重试
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  padding: '0.6rem 1.4rem',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-pill, 9999px)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                返回首页
              </button>
            </div>

            {this.state.error && (
              <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                <button
                  type="button"
                  onClick={this.toggleDetail}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.8rem',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  {this.state.showDetail ? '折叠错误详情' : '查看技术详情'}
                </button>
                {this.state.showDetail && (
                  <pre
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-hover)',
                      borderRadius: 'var(--radius-xs, 6px)',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      maxHeight: '120px',
                      overflowY: 'auto',
                    }}
                  >
                    {this.state.error.toString()}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
