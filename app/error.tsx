"use client";

import Link from "next/link";

export default function ErrorPage({
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="page page-narrow">
      <section className="route-head">
        <h1>Something failed</h1>
        <p>The app could not finish this request. Retry the action or return home.</p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={reset} type="button">
            Try again
          </button>
          <Link className="btn btn-secondary" href="/">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
