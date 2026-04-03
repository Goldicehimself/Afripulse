import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-slate-600">
        The page you are looking for does not exist.
      </p>
      <Link to="/" className="text-sm font-medium text-black underline">
        Go back home
      </Link>
    </section>
  );
}

export default NotFound;
