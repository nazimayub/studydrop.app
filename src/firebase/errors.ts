
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public readonly context: SecurityRuleContext;
  constructor(context: SecurityRuleContext) {
    const { path, operation, requestResourceData } = context;
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(
      {
        context: {
          request: {
            // In the Firestore Security Rules 'request' object, 'method' is the equivalent to our operation.
            method: operation,
            // In the Firestore Security Rules 'request' object, 'path' represents the path to a document.
            path: `/databases/(default)/documents/${path}`,
            ...(requestResourceData && { resource: { data: requestResourceData } }),
          },
        },
      },
      null,
      2
    )}`;

    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to make the error message clickable in the Next.js dev overlay
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
