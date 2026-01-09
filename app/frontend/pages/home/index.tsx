import { Head, Link, usePage } from "@inertiajs/react"

import GoogleSignInButton from "@/components/google-signin-button"
import { Button } from "@/components/ui/button"
import YearlyPlanner from "@/components/yearly-planner"
import { dashboardPath } from "@/routes"
import type { SharedData } from "@/types"

export default function Welcome() {
  const { auth } = usePage<SharedData>().props
  const isSignedIn = Boolean(auth?.user)

  const heroCTA = isSignedIn ? (
    <div className="flex flex-col items-center gap-3">
      <Button
        asChild
        className="h-11 rounded-full bg-slate-900 px-6 text-[11px] font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_40px_-26px_rgba(15,23,42,0.6)] hover:bg-slate-800"
      >
        <Link href={dashboardPath()}>Open your calendar</Link>
      </Button>
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
        You&apos;re signed in.
      </p>
    </div>
  ) : (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="w-full max-w-sm">
        <GoogleSignInButton />
      </div>
    </div>
  )

  return (
    <>
      <Head title="Life Planner">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link
          href="https://fonts.bunny.net/css?family=fraunces:400,600|jetbrains-mono:400,600|space-grotesk:400,600"
          rel="stylesheet"
        />
      </Head>

      <YearlyPlanner heroCTA={heroCTA} />
    </>
  )
}
