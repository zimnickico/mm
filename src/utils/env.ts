const variables = [
  "RESEND_API_KEY",
  "RESEND_AUDIENCE_ID",
  "RESEND_FROM",
] as const;

export function verifyVariables() {
  const list = variables.filter((i) => !process.env[i]);
  if (list.length) {
    console.error(
      `There are missing environment variables: ${list.join(", ")}. Please add them to your .env file.`,
    );
    process.exit(1);
  }
}
