export type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
  ENVIRONMENT?: string;
};

export type Variables = {
  userId?: string;
};
