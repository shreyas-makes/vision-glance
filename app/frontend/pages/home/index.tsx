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

      <YearlyPlanner />
    </>
  )
}
