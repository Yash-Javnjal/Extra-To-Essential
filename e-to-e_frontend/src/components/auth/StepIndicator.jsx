/**
 * StepIndicator — Multi-step progress bar for registration flow
 */
export default function StepIndicator({ currentStep, totalSteps, labels }) {
    return (
        <div className="auth-step-indicator">
            {Array.from({ length: totalSteps }, (_, i) => {
                const step = i + 1
                const isActive = step === currentStep
                const isDone = step < currentStep

                return (
                    <div
                        key={step}
                        className={`auth-step ${isActive ? 'auth-step--active' : ''} ${isDone ? 'auth-step--done' : ''}`}
                    >
                        <div className="auth-step__circle">
                            {isDone ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <span>{step}</span>
                            )}
                        </div>
                        {labels?.[i] && (
                            <span className="auth-step__label">{labels[i]}</span>
                        )}
                        {step < totalSteps && <div className="auth-step__line" />}
                    </div>
                )
            })}
        </div>
    )
}
