/** JSON for an inline <script type="application/ld+json">; "<" is escaped so content cannot close the element. */
export const jsonLdText = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
