import Link from "next/link";

export default function CTA() {
  return (
    <section className="bg-brand-red text-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl mb-6">
          Ready to assess writing with clearer evidence?
        </h2>
        <p className="text-xl text-red-100 max-w-2xl mx-auto mb-10">
          SF gives schools a practical way to review authentic writing process, support fairness, and make stronger instructional decisions.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/editor"
            className="bg-white text-brand-red font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/teacher"
            className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-lg hover:bg-white/10 transition-colors"
          >
            Open Teacher Viewer
          </Link>
        </div>
      </div>
    </section>
  );
}
