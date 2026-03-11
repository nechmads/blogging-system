# Pricing Tiers

Hot Metal offers three subscription tiers. Limits are enforced per publication unless noted otherwise.

## Creator (Free)

The default tier for all new users. Designed to let people experience the full product.

| Feature | Limit |
|---|---|
| Publications | 2 |
| Topics per publication | 3 |
| Auto-published posts per week (per publication) | 3 |
| Scout schedule | Daily or every N days only |
| Writing styles | Built-in (prebuilt) only |
| AI writing sessions | Unlimited |
| Social publishing (LinkedIn, X) | Unlimited |
| AI image generation | Unlimited |
| Templates | All |
| RSS/Atom feeds | Unlimited |
| Comments | Unlimited |

## Growth (Paid)

For creators who want more automation and customization.

| Feature | Limit |
|---|---|
| Publications | 5 |
| Topics per publication | Unlimited |
| Auto-published posts per week (per publication) | 10 |
| Scout schedule | All options (including multiple times per day) |
| Custom writing styles | Up to 5 |
| AI writing sessions | Unlimited |
| Social publishing (LinkedIn, X) | Unlimited |
| AI image generation | Unlimited |
| Templates | All |
| RSS/Atom feeds | Unlimited |
| Comments | Unlimited |
| Priority support | Yes |

## Enterprise (Contact Us)

For teams and high-volume publishers. Pricing is custom.

| Feature | Limit |
|---|---|
| Publications | Unlimited |
| Topics per publication | Unlimited |
| Auto-published posts per week (per publication) | Unlimited |
| Scout schedule | All options |
| Custom writing styles | Unlimited |
| Custom domain for blog | Yes (planned) |
| Team / multi-user collaboration | Yes (planned) |
| Custom templates | Yes (planned) |
| API access | Yes (planned) |
| SSO | Yes (planned) |
| Dedicated support / SLA | Yes |

## Implementation Details

- Tier is stored as a `tier` column on the `users` table (`creator`, `growth`, or `enterprise`).
- All tier limits are defined in `packages/shared/src/tiers.ts` as the single source of truth.
- Server-side enforcement is in `apps/web/src/lib/quota.ts` (quota check functions) and individual API route handlers.
- Frontend gating reads the user's tier from the user store and uses `getTierLimits()` to determine what to show/disable.
- Payment integration (Paddle) is planned but not yet implemented. Tier changes currently require a direct database update.
- A value of `-1` in the tier config means unlimited.

## Contact

For Enterprise inquiries or plan upgrades: hello@hotmetalapp.com
