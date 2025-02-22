import React from 'react'
import { ACTION_UNHANDLED_ERROR, type OverlayState } from '../shared'
import { ShadowPortal } from '../internal/components/ShadowPortal'
import { BuildError } from '../internal/container/BuildError'
import { Errors, type SupportedErrorEvent } from '../internal/container/Errors'
import { parseStack } from '../internal/helpers/parse-stack'
import { StaticIndicator } from '../internal/container/StaticIndicator'
import { Base } from '../internal/styles/Base'
import { ComponentStyles } from '../internal/styles/ComponentStyles'
import { CssReset } from '../internal/styles/CssReset'
import { RootLayoutMissingTagsError } from '../internal/container/root-layout-missing-tags-error'
import type { Dispatcher } from './hot-reloader-client'
import { RuntimeErrorHandler } from '../internal/helpers/runtime-error-handler'

interface ReactDevOverlayState {
  reactError: SupportedErrorEvent | null
}
export default class ReactDevOverlay extends React.PureComponent<
  {
    state: OverlayState
    dispatcher?: Dispatcher
    children: React.ReactNode
  },
  ReactDevOverlayState
> {
  state = { reactError: null }

  static getDerivedStateFromError(error: Error): ReactDevOverlayState {
    if (!error.stack) return { reactError: null }

    RuntimeErrorHandler.hadRuntimeError = true
    return {
      reactError: {
        id: 0,
        event: {
          type: ACTION_UNHANDLED_ERROR,
          reason: error,
          frames: parseStack(error.stack),
        },
      },
    }
  }

  render() {
    const { state, children, dispatcher } = this.props
    const { reactError } = this.state

    const hasBuildError = state.buildError != null
    const hasRuntimeErrors = Boolean(state.errors.length)
    const hasStaticIndicator = state.staticIndicator
    const debugInfo = state.debugInfo

    return (
      <>
        {reactError ? (
          <html>
            <head></head>
            <body></body>
          </html>
        ) : (
          children
        )}
        <ShadowPortal>
          <CssReset />
          <Base />
          <ComponentStyles />
          {state.rootLayoutMissingTags?.length ? (
            <RootLayoutMissingTagsError
              missingTags={state.rootLayoutMissingTags}
            />
          ) : hasBuildError ? (
            <BuildError
              message={state.buildError!}
              versionInfo={state.versionInfo}
            />
          ) : (
            <>
              {hasRuntimeErrors ? (
                <Errors
                  isAppDir={true}
                  initialDisplayState={reactError ? 'fullscreen' : 'minimized'}
                  errors={reactError ? [reactError] : state.errors}
                  versionInfo={state.versionInfo}
                  hasStaticIndicator={hasStaticIndicator}
                  debugInfo={debugInfo}
                />
              ) : null}

              {hasStaticIndicator && (
                <StaticIndicator dispatcher={dispatcher} />
              )}
            </>
          )}
        </ShadowPortal>
      </>
    )
  }
}
