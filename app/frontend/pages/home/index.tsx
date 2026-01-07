import { Head } from "@inertiajs/react"

import YearlyPlanner from "@/components/yearly-planner"

export default function Welcome() {

  return (
    <>
      <Head title="Life Planner">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link
          href="https://fonts.bunny.net/css?family=fraunces:400,600|jetbrains-mono:400,600|space-grotesk:400,600"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen bg-[#f6f3ee] px-4 py-10 text-slate-900 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                Inertia • React • UI prototype
              </p>
              <p
                className="mt-2 text-2xl text-slate-900"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Year-at-a-glance calendar
              </p>
            </div>
            <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <span className="inline-flex h-2 w-2 rounded-full bg-slate-900" />
              Precision layout · daily granularity · hover previews
            </div>
          </div>

          <YearlyPlanner />
        </div>
      </div>
    </>
  )
}
