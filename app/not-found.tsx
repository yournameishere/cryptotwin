import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page page-narrow">
      <section className="route-head">
        <h1>Page not found</h1>
        <p>The route does not exist in CryptoTwin AI.</p>
        <Link className="btn btn-primary" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
