import { Modal } from '@/components/modal/Modal'
import { UPGRADE_EMAIL } from '@hotmetal/shared'

interface UpgradePromptProps {
  isOpen: boolean
  onClose: () => void
  message?: string
}

export function UpgradePrompt({ isOpen, onClose, message }: UpgradePromptProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 p-5">
        <h3 className="text-lg font-semibold">Plan Limit Reached</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          {message || "You've reached the limit of your current plan."}
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          To unlock higher limits, <a href={`mailto:${UPGRADE_EMAIL}?subject=Upgrade%20to%20Pro`} className="text-[var(--color-accent)] hover:underline">reach out to us</a> and we'll get you upgraded.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--color-border-default)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-bg-card)]"
          >
            Close
          </button>
          <a
            href={`mailto:${UPGRADE_EMAIL}?subject=Upgrade%20to%20Pro`}
            className="inline-flex items-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Contact Us
          </a>
        </div>
      </div>
    </Modal>
  )
}
