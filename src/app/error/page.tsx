import Link from "next/link";

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const error =
    (typeof params.error === "string" ? params.error : null) ||
    "Something went wrong";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-3xl font-bold text-foreground">Oops!</h1>
          <p className="text-muted-foreground">
            {error === "Invalid login credentials"
              ? "Invalid email or password. Please try again."
              : error === "User already registered"
              ? "An account with this email already exists. Please try logging in instead."
              : "Something went wrong. Please try again."}
          </p>
        </div>
        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Back to Login
          </Link>
          <Link
            href="/"
            className="block w-full bg-secondary text-secondary-foreground py-2 px-4 rounded-md hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
