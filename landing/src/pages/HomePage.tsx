import { constants } from '@devhub/core'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import CheckLabel from '../components/common/CheckLabel'
import { CheckLabels } from '../components/common/CheckLabels'
import { LogoHead } from '../components/common/LogoHead'
import { ResponsiveImage } from '../components/common/ResponsiveImage'
import LandingLayout from '../components/layouts/LandingLayout'
import CTAButtons from '../components/sections/CTAButtons'
import FeaturesBlock from '../components/sections/features/FeaturesBlock'
import GetStartedBlock from '../components/sections/GetStartedBlock'
import UsedByCompaniesBlock from '../components/sections/UsedByCompaniesBlock'
import { usePlans } from '../context/PlansContext'

export interface HomePageProps {}

export default function HomePage(_props: HomePageProps) {
  const Router = useRouter()
  const { paidPlans, freePlan, freeTrialDays } = usePlans()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const interval = setInterval(() => {
      Router.replace(Router.route, Router.pathname)
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [Router.query.features])

  return (
    <LandingLayout>
      <section id="homepage">
        <LogoHead />

        <div className="container flex flex-col lg:flex-row">
          <div className="mb-12 lg:mb-0">
            <div className="flex flex-col lg:w-9/12 items-center m-auto mb-8 text-center">
              <h1 className="text-4xl sm:text-5xl">
                GitHub Notifications & Activities on your Desktop
              </h1>

              <h2
                className="lg:w-8/12 text-primary font-thin uppercase italic"
                style={{
                  textShadow: 'rgba(0, 0, 0, 0.2) 1px 1px 5px',
                }}
              >
                <span title="Also Known As">AKA</span>
                {' "'}
                <a
                  href="https://www.google.com/search?q=tweetdeck+by+twitter&tbm=isch"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  TweetDeck
                </a>{' '}
                for{' '}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
                {'"'}
              </h2>

              <h2 className="w-full xl:w-9/12">
                Create columns for the repositories and people that matters to
                you; Receive Desktop Push Notifications; Manage Notifications,
                Issues, Pull Requests &amp; Activities; Bookmark things for
                later.
              </h2>
            </div>
            <CTAButtons center className="mb-2" />
            <CheckLabels center className="mb-16">
              {!!(freePlan && !freePlan.trialPeriodDays) &&
                (paidPlans.length ? (
                  <CheckLabel label="Free version" />
                ) : (
                  <CheckLabel label="Free &amp; Open Source" />
                ))}
              {!!freeTrialDays &&
                !paidPlans.every((plan) => !!plan && !plan.interval) && (
                  <CheckLabel label={`${freeTrialDays}-day free trial`} />
                )}
              {!!(
                paidPlans &&
                paidPlans.some((plan) => !!plan?.amount) &&
                paidPlans.every((plan) => !plan?.interval)
              ) && <CheckLabel label="One-time payment (no subscription)" />}

              {!constants.GITHUB_APP_HAS_CODE_ACCESS && (
                <CheckLabel label="No code access (granular permissons)" />
              )}

              <CheckLabel label="Cross-platform (desktop & mobile)" />
            </CheckLabels>
            <ResponsiveImage
              alt="DevHub Screenshot with 4 columns: Notifications, Facebook activity, TailwindCSS activity and Filters"
              src="/static/screenshots/dark/devhub-desktop.jpg"
              aspectRatio={1440 / 878}
              enableBorder
              minHeight={500}
            />
            <p className="block sm:hidden mb-4" />
            <small className="block sm:hidden italic text-sm text-muted-65 text-center">
              TIP: You can scroll the images horizontally
            </small>
          </div>

          {/* <div className="lg:w-7/12">
            <div className="block sm:hidden">
              <div className="pb-8" />

              <DeviceFrame>
                <div className="relative w-full h-full m-auto">
                  <img
                    alt="DevHub mobile screenshot"
                    src="/static/screenshots/iphone-notifications-light.jpg"
                    className="visible-light-theme absolute inset-0 object-cover bg-white"
                  />
                  <img
                    alt="DevHub mobile screenshot"
                    src="/static/screenshots/iphone-notifications-dark.jpg"
                    className="visible-dark-theme absolute inset-0 object-cover"
                  />
                </div>
              </DeviceFrame>
            </div>
          </div> */}
        </div>

        <div className="pb-16" />

        <UsedByCompaniesBlock />

        <div className="pb-8" />
        <section id="features">
          <div className="pb-8" />

          <FeaturesBlock />
        </section>

        {/* <div className="pb-8" />
        <section id="pricing">
          <div className="pb-8" />

          <div className="container">
            <h1 className="mb-12">Choose your plan</h1>
          </div>

          <PricingPlans />
        </section> */}

        <div className="pb-16" />

        <GetStartedBlock />
      </section>
    </LandingLayout>
  )
}
