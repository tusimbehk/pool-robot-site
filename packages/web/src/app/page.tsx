export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Premium Pool Cleaning Robots
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Advanced technology for crystal clear pools. Designed for European and North American
              markets.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/products"
                className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Browse Products
              </a>
              <a
                href="/about"
                className="text-base font-semibold leading-6 text-gray-900 hover:text-blue-600"
              >
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Choose PoolClean Pro?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our robots combine cutting-edge technology with proven reliability.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:max-w-none lg:grid-cols-3">
            {[
              {
                title: "Smart Navigation",
                description:
                  "Advanced AI mapping ensures every corner of your pool is cleaned efficiently.",
              },
              {
                title: "Energy Efficient",
                description:
                  "Low-power operation saves you money while keeping your pool spotless.",
              },
              {
                title: "Premium Support",
                description:
                  "Dedicated customer service and comprehensive warranty for peace of mind.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl bg-gray-50 p-8 shadow-sm ring-1 ring-gray-900/5"
              >
                <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-4 text-base leading-7 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Ready for a Cleaner Pool?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Explore our range of premium pool cleaning robots.
          </p>
          <a
            href="/products"
            className="mt-8 inline-block rounded-md bg-white px-8 py-3 text-base font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
          >
            View Products
          </a>
        </div>
      </section>
    </main>
  );
}
