import { constants, isPlanStatusValid } from '@devhub/core'
import React from 'react'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { useReduxState } from '../../hooks/use-redux-state'
import { Platform } from '../../libs/platform'
import * as actions from '../../redux/actions'
import * as selectors from '../../redux/selectors'
import { sharedStyles } from '../../styles/shared'
import {
  contentPadding,
  normalTextSize,
  scaleFactor,
} from '../../styles/variables'
import { openAppStore } from '../../utils/helpers/shared'
import { ModalColumn } from '../columns/ModalColumn'
import { AppVersion } from '../common/AppVersion'
import { Avatar } from '../common/Avatar'
import { Button } from '../common/Button'
import { ButtonLink } from '../common/ButtonLink'
import { Link } from '../common/Link'
import { Spacer } from '../common/Spacer'
import { SubHeader } from '../common/SubHeader'
import { UnreadDot } from '../common/UnreadDot'
import { useAppLayout } from '../context/LayoutContext'
import { usePlans } from '../context/PlansContext'
import { ThemedIcon } from '../themed/ThemedIcon'
import { ThemedText } from '../themed/ThemedText'
import { DesktopPreferences } from '../widgets/DesktopPreferences'
import { ThemePreference } from '../widgets/ThemePreference'

export interface SettingsModalProps {
  showBackButton: boolean
}

export const SettingsModal = React.memo((props: SettingsModalProps) => {
  const { showBackButton } = props

  const { sizename } = useAppLayout()
  const { freePlan } = usePlans()

  const dispatch = useDispatch()
  const appToken = useReduxState(selectors.appTokenSelector)
  const username = useReduxState(selectors.currentGitHubUsernameSelector)
  const userPlan = useReduxState(selectors.currentUserPlanSelector)
  const isPlanExpired = useReduxState(selectors.isPlanExpiredSelector)

  return (
    <ModalColumn
      hideCloseButton={sizename <= '2-medium'}
      name="SETTINGS"
      right={
        sizename <= '2-medium' && username ? (
          <Avatar
            backgroundColorLoading=""
            shape="circle"
            size={28 * scaleFactor}
            username={username}
          />
        ) : undefined
      }
      showBackButton={showBackButton}
      title="Preferences"
    >
      <>
        {Platform.OS === 'web' &&
          !(userPlan && userPlan.status === 'active' && !userPlan.interval) && (
            <View>
              <SubHeader title="Current plan">
                <Spacer flex={1} />

                <ButtonLink
                  href={`${constants.DEVHUB_LINKS.ACCOUNT_PAGE}?appToken=${appToken}`}
                  openOnNewTab
                  size={32 * scaleFactor}
                >
                  <View style={[sharedStyles.center, sharedStyles.horizontal]}>
                    {/* <ThemedIcon
                      color="foregroundColor"
                      family="octicon"
                      name="pencil"
                    />
                    <Spacer width={contentPadding / 2} /> */}
                    <ThemedText color="foregroundColor">{`${
                      userPlan
                        ? userPlan.label || (userPlan.amount ? 'Paid' : 'Free')
                        : 'None'
                    }${
                      isPlanExpired
                        ? ' (expired)'
                        : userPlan && userPlan.status === 'trialing'
                        ? (userPlan.label || '').toLowerCase().includes('trial')
                          ? ''
                          : userPlan.amount
                          ? ' (trial)'
                          : ' trial'
                        : !isPlanStatusValid(userPlan) &&
                          userPlan &&
                          userPlan.status
                        ? ` (${userPlan.status})`
                        : ''
                    } ↗`}</ThemedText>
                    {!!(
                      (isPlanExpired &&
                        !(freePlan && !freePlan.trialPeriodDays)) ||
                      (userPlan &&
                        userPlan.status === 'active' &&
                        userPlan.cancelAtPeriodEnd &&
                        userPlan.cancelAt) ||
                      (userPlan &&
                        userPlan.status &&
                        !isPlanStatusValid(userPlan))
                    ) && (
                      <>
                        <Spacer width={contentPadding / 2} />
                        <UnreadDot backgroundColor="red" borderColor={null} />
                      </>
                    )}
                  </View>
                </ButtonLink>
              </SubHeader>
            </View>
          )}

        <DesktopPreferences />

        <ThemePreference />

        {/* <Spacer height={contentPadding * 2} />

        <View>
          <SubHeader title="Enterprise" />

          <Button
            key="setup-github-enterprise-button"
            analyticsCategory="enterprise"
            analyticsAction="setup"
            analyticsLabel={username}
            onPress={() => pushModal({ name: 'SETUP_GITHUB_ENTERPRISE' })}
          >
            Setup GitHub Enterprise
          </Button>
        </View> */}

        <Spacer height={contentPadding} />

        {Platform.OS === 'ios' || Platform.OS === 'android' ? (
          <SubHeader title="Rate this app">
            <Spacer flex={1} />

            <Button
              analyticsLabel="rate_app"
              onPress={() => openAppStore({ showReviewModal: true })}
              size={32 * scaleFactor}
            >
              <ThemedIcon
                color="foregroundColor"
                family="octicon"
                name="star"
                size={16 * scaleFactor}
              />
            </Button>
          </SubHeader>
        ) : Platform.realOS === 'ios' || Platform.realOS === 'android' ? (
          <SubHeader title="Download native app">
            <Spacer flex={1} />

            <Button
              analyticsLabel="download_native_app"
              onPress={() => openAppStore({ showReviewModal: false })}
              size={32 * scaleFactor}
            >
              <ThemedIcon
                color="foregroundColor"
                family="octicon"
                name="device-mobile"
                size={16 * scaleFactor}
              />
            </Button>
          </SubHeader>
        ) : null}

        <View style={{ minHeight: 32 * scaleFactor }}>
          <SubHeader title="Community">
            <Spacer flex={1} />

            <View style={sharedStyles.horizontal}>
              <Link
                analyticsCategory="preferences_link"
                analyticsLabel="twitter"
                enableForegroundHover
                href={constants.DEVHUB_LINKS.TWITTER_PROFILE}
                openOnNewTab
                textProps={{
                  color: 'foregroundColor',
                  style: {
                    fontSize: normalTextSize,
                    lineHeight: normalTextSize * 1.5,
                    textAlign: 'center',
                  },
                }}
              >
                Twitter
              </Link>

              {/*
              <ThemedText
                color="foregroundColorMuted25"
                style={{
                  fontStyle: 'italic',
                  paddingHorizontal: contentPadding / 2,
                }}
              >
                |
              </ThemedText>

              <Link
                analyticsCategory="preferences_link"
                analyticsLabel="slack"
                enableForegroundHover
                href={constants.DEVHUB_LINKS.SLACK_INVITATION}
                openOnNewTab
                textProps={{
                  color: 'foregroundColor',
                  style: {
                    fontSize: normalTextSize,
                    lineHeight: normalTextSize * 1.5,
                    textAlign: 'center',
                  },
                }}
              >
                Slack
              </Link>
              */}

              <ThemedText
                color="foregroundColorMuted25"
                style={{
                  fontStyle: 'italic',
                  paddingHorizontal: contentPadding / 2,
                }}
              >
                |
              </ThemedText>

              <Link
                analyticsCategory="preferences_link"
                analyticsLabel="github"
                enableForegroundHover
                href={constants.DEVHUB_LINKS.GITHUB_REPOSITORY}
                openOnNewTab
                textProps={{
                  color: 'foregroundColor',
                  style: {
                    fontSize: normalTextSize,
                    lineHeight: normalTextSize * 1.5,
                    textAlign: 'center',
                  },
                }}
              >
                GitHub
              </Link>
            </View>
          </SubHeader>
        </View>

        <View style={{ minHeight: 32 * scaleFactor }}>
          <SubHeader title="Follow me on Twitter">
            <Spacer flex={1} />

            <View style={sharedStyles.horizontal}>
              <Link
                analyticsCategory="preferences_link"
                analyticsLabel="twitter"
                enableForegroundHover
                href="https://twitter.com/brunolemos"
                openOnNewTab
                textProps={{
                  color: 'foregroundColor',
                  style: {
                    fontSize: normalTextSize,
                    lineHeight: normalTextSize * 1.5,
                    textAlign: 'center',
                  },
                }}
              >
                @brunolemos
              </Link>
            </View>
          </SubHeader>
        </View>

        <Spacer flex={1} minHeight={contentPadding} />

        <View style={sharedStyles.paddingHorizontal}>
          <AppVersion />

          <Spacer height={contentPadding / 2} />

          <Button
            key="advanced-button"
            onPress={() =>
              dispatch(actions.pushModal({ name: 'ADVANCED_SETTINGS' }))
            }
          >
            Show advanced settings
          </Button>
        </View>

        <Spacer height={contentPadding / 2} />
      </>
    </ModalColumn>
  )
})

SettingsModal.displayName = 'SettingsModal'
