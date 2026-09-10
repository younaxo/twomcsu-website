# Pending payment method assets

The footer's payment row (`SiteFooter`, `paymentMethods` array) is intentionally empty until the
original brand SVGs are supplied — no source data was available in the session that built this
redesign, and recreating bank-network logos from memory risks getting the marks wrong.

Drop the four files here, matching the original `viewBox="0 0 48 32"`:

- `visa.svg`
- `mastercard.svg`
- `mir.svg`
- `sbp.svg`

Then restore the `paymentMethods` array in `apps/web/src/components/site-footer.tsx` (see the
comment above it) and delete this file.
