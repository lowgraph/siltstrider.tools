# Premium via Ko-fi

Benefits: 25 shared cloud-save slots and a gold profile-icon border. One-time
support with no renewal or expiry. Suggested USD 3; any positive tip in any currency qualifies.
The Ko-fi page controls the actual payment amount and minimum, not this site.

## Setup before enabling payments

1. Apply migration `0004_premium_support.sql` with Wrangler D1 migrations.
2. In Ko-fi payment settings, use one-time tips in your preferred currency (the site suggests US$3).
   Check the minimum permits the amounts you want supporters to choose.
3. At https://ko-fi.com/manage/webhooks set the URL to
   `https://siltstrider.tools/api/webhooks/kofi`.
4. Put Ko-fi's verification token in the Worker secret `KOFI_VERIFICATION_TOKEN`.
   Never commit it. The support-code endpoint returns 503 until configured.
5. Deploy and test with a dedicated test account/support code using Ko-fi's test
   notification facility; test messages with a valid code also grant premium.

The signed-in supporter requests a stable random code, copies it into their
Ko-fi payment message, and follows the Ko-fi link. They then select Check payment
status. No upgrade is granted just for returning from Ko-fi or claiming payment.

Verified Tip notifications (or legacy Donation notifications) must contain exactly one recognized account code,
a positive amount and its original currency, and a transaction ID. Subscription and shop payments are
ignored. The webhook uses a timing-safe token comparison, a 32 KB body limit,
and an atomic D1 batch. Transaction IDs are unique; repeated notifications cannot
transfer the recorded payment to another account. Only the transaction ID, owner,
amount, currency and timestamp are retained, not donor emails or payment details.

Refunds and disputes require manual review: Ko-fi's payment webhook does not
provide a complete refund lifecycle. Unmatched tips do not auto-upgrade accounts;
verify the receipt in Ko-fi before granting a supporter tier manually. Do not
grant access from a screenshot or client-submitted payment ID alone.

Reference: https://help.ko-fi.com/hc/en-us/articles/360004162298-Does-Ko-fi-have-an-API-or-webhook
