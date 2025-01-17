import {
  ActivityColumn,
  Column,
  ColumnSubscription,
  DevHubDataItemType,
  EnhancedItem,
  filterRecordHasAnyForcedValue,
  getEventMetadata,
  getItemNodeIdOrId,
  getOwnerAndRepo,
  GitHubEvent,
  GraphQLGitHubUser,
  guid,
  isItemRead,
  isItemSaved,
  IssueOrPullRequestColumnSubscription,
  NotificationColumn,
  removeUselessURLsFromResponseItem,
} from '@devhub/core'
import immer from 'immer'
import _ from 'lodash'

import * as selectors from './selectors'
import { RootState } from './types'

export default {
  0: (state: any) => state,
  1: (state: any) => state,
  2: (state: any) =>
    immer(state, (draft: any) => {
      const columns: Column[] = draft.columns && draft.columns.columns
      if (!columns) return

      draft.columns.byId = {}
      draft.columns.allIds = columns.map((column) => {
        draft.columns.byId![column.id] = column
        return column.id
      })
    }),
  3: (state: RootState) =>
    immer(state, (draft) => {
      let columns = selectors.columnsArrSelector(state).filter(Boolean)
      if (!columns) return

      draft.subscriptions = draft.subscriptions || {}
      draft.subscriptions.allIds = []
      draft.subscriptions.byId = {}
      columns = columns.map((oldColumn: any) => {
        const subscription: ColumnSubscription = {
          id: guid(),
          type: oldColumn.type,
          subtype: oldColumn.subtype,
          params: oldColumn.params,
          data: {},
          createdAt: oldColumn.createdAt || new Date().toISOString(),
          updatedAt: oldColumn.updatedAt || new Date().toISOString(),
        }

        draft.subscriptions.allIds.push(subscription.id)
        draft.subscriptions.byId[subscription.id] = subscription

        const column: Column = {
          id: oldColumn.id,
          type: oldColumn.type,
          subscriptionIds: [subscription.id],
          subscriptionIdsHistory: [subscription.id],
          createdAt: oldColumn.createdAt || new Date().toISOString(),
          updatedAt: oldColumn.updatedAt || new Date().toISOString(),
        }

        return column
      })

      draft.columns.byId = {}
      draft.columns.allIds = columns.map((column) => {
        draft.columns.byId![column.id] = column
        return column.id
      })
    }),
  4: (state: RootState) =>
    immer(state, (draft) => {
      const oldAuth = (draft.auth as any) as {
        appToken: string | null
        githubScope: string[] | null
        githubToken: string | null
        githubTokenType: string | null
        githubTokenCreatedAt: string | null
        isLoggingIn: boolean
        lastLoginAt: string | null
        user: GraphQLGitHubUser
      }

      draft.auth = {
        appToken: oldAuth.appToken,
        error: null,
        isDeletingAccount: false,
        isLoggingIn: false,
        user:
          oldAuth.user &&
          ({
            _id: '',
            github: {
              scope: oldAuth.githubScope || [],
              token: oldAuth.githubToken || '',
              tokenType: oldAuth.githubTokenType || '',
              tokenCreatedAt: oldAuth.githubTokenCreatedAt || '',
              user: oldAuth.user,
            } as any,
            createdAt: '',
            updatedAt: '',
            lastLoginAt: oldAuth.lastLoginAt || '',
          } as any),
      } as any
    }),
  5: (state: RootState) =>
    immer(state, (draft) => {
      draft.subscriptions = draft.subscriptions || {}
      draft.subscriptions.allIds = draft.subscriptions.allIds || []
      draft.subscriptions.byId = draft.subscriptions.byId || {}

      const byId: Record<string, ColumnSubscription | undefined> = {}

      selectors.allSubscriptionsArrSelector(draft).forEach((subscription) => {
        const {
          data: items,
          loadState,
          errorMessage,
          canFetchMore,
          lastFetchedAt,
          ...restSubscription
        } = subscription as any

        const newSubscription = {
          ...restSubscription,
          data: {
            canFetchMore,
            errorMessage,
            items,
            lastFetchedAt,
            loadState,
          },
        }

        byId[newSubscription.id] = newSubscription
      })

      draft.subscriptions.byId = byId
    }),
  6: (state: RootState) =>
    immer(state, (draft) => {
      draft.subscriptions = draft.subscriptions || {}
      draft.subscriptions.allIds = draft.subscriptions.allIds || []
      draft.subscriptions.byId = draft.subscriptions.byId || {}

      selectors.allSubscriptionsArrSelector(draft).forEach((subscription) => {
        if (
          !(
            subscription &&
            subscription.data &&
            (subscription.data as any).items &&
            (subscription.data as any).items.length
          )
        )
          return
        ;(subscription.data as any).items = (subscription.data as any).map(
          removeUselessURLsFromResponseItem,
        )
      })
    }),
  7: (state: RootState) =>
    immer(state, (draft) => {
      draft.columns = draft.columns || {}
      draft.columns.allIds = draft.columns.allIds || []
      draft.columns.byId = draft.columns.byId || {}

      const keys = Object.keys(draft.columns.byId)

      keys.forEach((columnId) => {
        const column = draft.columns.byId![columnId]
        const oldFilters = (column && column.filters) as any
        if (!(oldFilters && oldFilters.inbox)) return

        oldFilters.saved = oldFilters.inbox.saved
        delete oldFilters.inbox
      })
    }),
  8: (state: RootState) =>
    immer(state, (draft) => {
      delete (draft as any).app

      const githubAPIHeaders = (state as any).api && (state as any).api.github
      draft.github = draft.github || {}
      draft.github.api = draft.github.api || {}
      draft.github.api.headers = githubAPIHeaders
      delete (draft as any).api

      const auth = (state.auth || {}) as {
        appToken: string | null
        error: any
        isLoggingIn: boolean
        user: {
          _id: any
          columns?: any
          subscriptions?: any
          github?: {
            scope?: string[] | undefined
            token?: string | undefined
            tokenType?: string | undefined
            tokenCreatedAt?: string | undefined
            user: GraphQLGitHubUser
          }
          createdAt: string
          updatedAt: string
          lastLoginAt: string
        } | null
      }

      if (!auth.user) return
      ;(draft.auth as any).user = {
        _id: auth.user._id,
        createdAt: auth.user.createdAt,
        lastLoginAt: auth.user.lastLoginAt,
        updatedAt: auth.user.updatedAt,
      } as typeof auth['user']

      if (!(auth.user.github && auth.user.github.token)) return
      draft.github = draft.github || {}
      draft.github.auth = draft.github.auth || {}

      draft.github.auth.oauth = {
        login: '',
        scope: auth.user.github.scope,
        token: auth.user.github.token,
        tokenCreatedAt: auth.user.github.tokenCreatedAt!,
        tokenType: auth.user.github.tokenType,
      }
      draft.github.auth.user = auth.user.github.user
    }),
  9: (state: RootState) =>
    immer(state, (draft) => {
      draft.config = draft.config || {}
      ;(draft.config as any).appViewMode =
        (draft.config as any).appViewMode === 'single-column'
          ? 'single-column'
          : 'multi-column'
    }),
  10: (state: RootState) =>
    immer(state, (draft) => {
      draft.columns = draft.columns || {}
      draft.columns.byId = draft.columns.byId || {}

      const columnIds = Object.keys(draft.columns.byId)
      columnIds.forEach((columnId) => {
        const column = draft.columns.byId![columnId] as ActivityColumn

        if (
          !(
            column &&
            column.filters &&
            'activity' in column.filters &&
            column.filters.activity &&
            filterRecordHasAnyForcedValue(
              (column.filters.activity as any).types,
            )
          )
        )
          return

        const oldTypesFilter: Partial<Record<
          GitHubEvent['type'],
          boolean
        >> = (column.filters.activity as any).types

        column.filters.subjectTypes = column.filters.subjectTypes || {}
        column.filters.activity.actions = column.filters.activity.actions || {}

        Object.keys(oldTypesFilter).forEach((type: any) => {
          if (typeof (oldTypesFilter as any)[type] !== 'boolean') return

          try {
            const { action } = getEventMetadata({ type, payload: {} } as any)
            if (!action) return

            column.filters!.activity!.actions![
              action
            ] = (oldTypesFilter as any)[type]
          } catch (error) {
            //
          }
        })

        // Keeping for now, to minimize sync issues
        // TODO: Delete this field later in the future
        // delete (column.filters.activity as any).types
      })
    }),
  11: (state: RootState) =>
    immer(state, (draft) => {
      draft.columns = draft.columns || {}
      draft.columns.byId = draft.columns.byId || {}
      draft.subscriptions = draft.subscriptions || {}
      draft.subscriptions.byId = draft.subscriptions.byId || {}

      const columnIds = Object.keys(draft.columns.byId)
      columnIds.forEach((columnId) => {
        const column = draft.columns.byId![columnId] as ActivityColumn

        // we only wanna change User Dashboard columns
        if (!(column && column.type === 'activity')) return
        const subscription = draft.subscriptions.byId[column.subscriptionIds[0]]
        if (
          !(
            subscription &&
            subscription.type === 'activity' &&
            subscription.subtype === 'USER_RECEIVED_EVENTS'
          )
        )
          return

        // if column has some custom filters, let's not touch it
        if (
          column &&
          column.filters &&
          (filterRecordHasAnyForcedValue(column.filters.subjectTypes) ||
            (column.filters.activity &&
              (filterRecordHasAnyForcedValue(column.filters.activity.actions) ||
                filterRecordHasAnyForcedValue(
                  (column.filters.activity as any).types,
                ))))
        )
          return

        // change default column filters to match github's dashboard
        column.filters = column.filters || {}
        column.filters.subjectTypes = {
          Release: true,
          Repository: true,
          Tag: true,
          User: true,
        }
      })
    }),
  12: (state: RootState) =>
    immer(state, (draft) => {
      draft.subscriptions = draft.subscriptions || {}
      draft.subscriptions.byId = draft.subscriptions.byId || {}

      const subscriptionIds = Object.keys(draft.subscriptions.byId)
      subscriptionIds.forEach((subscriptionId) => {
        const subscription = draft.subscriptions.byId[subscriptionId]

        // we only wanna change Issues & PRs columns
        if (!(subscription && subscription.type === 'issue_or_pr')) return

        const s = subscription as IssueOrPullRequestColumnSubscription
        s.params = s.params || {}

        const subscriptionParams = s.params as {
          repoFullName?: string
          owners?: Partial<
            Record<
              string,
              {
                value: boolean | undefined
                repos: Partial<Record<string, boolean>> | undefined
              }
            >
          >
        }

        if (!subscriptionParams.repoFullName) return

        const { owner, repo } = getOwnerAndRepo(subscriptionParams.repoFullName)
        if (!(owner && repo)) return

        subscriptionParams.owners = subscriptionParams.owners || {}
        subscriptionParams.owners[owner] = subscriptionParams.owners[owner] || {
          value: true,
          repos: undefined,
        }

        subscriptionParams.owners[owner]!.repos =
          subscriptionParams.owners[owner]!.repos || {}

        subscriptionParams.owners[owner]!.repos![repo] = true

        delete subscriptionParams.repoFullName
      })
    }),
  13: (state: RootState) =>
    immer(state, (draft) => {
      draft.auth = draft.auth || {}
      draft.counters = draft.counters || {}

      const loginCount = (draft.auth as any).loginCount || 0
      draft.counters.loginSuccess = loginCount || 0
    }),
  14: (state: RootState) =>
    immer(state, (draft) => {
      draft.subscriptions = draft.subscriptions || {}
      draft.subscriptions.byId = draft.subscriptions.byId || {}

      const subscriptionIds = Object.keys(draft.subscriptions.byId)
      subscriptionIds.forEach((subscriptionId) => {
        const subscription = draft.subscriptions.byId[subscriptionId]
        if (!(subscription && subscription.data)) return

        const items: EnhancedItem[] | undefined = (subscription.data as any)
          .items
        delete (subscription.data as any).items

        if (!(items && items.length)) return
        subscription.data.itemNodeIdOrIds = items
          .map(getItemNodeIdOrId)
          .filter(Boolean) as string[]

        draft.data = draft.data || {}
        draft.data.allIds = draft.data.allIds || []
        draft.data.byId = draft.data.byId || {}
        draft.data.idsBySubscriptionId = draft.data.idsBySubscriptionId || {}
        draft.data.idsByType = draft.data.idsByType || {}
        draft.data.savedIds = draft.data.savedIds || []
        draft.data.readIds = draft.data.readIds || []

        items.forEach((item) => {
          if (!item) return

          const now = new Date().toISOString()

          const id = getItemNodeIdOrId(item)
          if (!id) return

          const type: DevHubDataItemType =
            subscription.type === 'activity'
              ? 'event'
              : subscription.type === 'notifications'
              ? 'notification'
              : subscription.type

          if (!draft.data.allIds.includes(id)) draft.data.allIds.push(id)

          draft.data.byId[id] = draft.data.byId[id] || {
            item: undefined,
            createdAt: now,
            subscriptionIds: [],
            type,
            updatedAt: now,
          }

          draft.data.byId[id]!.item = item
          draft.data.byId[id]!.subscriptionIds = _.uniq(
            (draft.data.byId[id]!.subscriptionIds || []).concat(
              subscription.id,
            ),
          )

          draft.data.byId[id]!.type = type
          draft.data.byId[id]!.updatedAt = now

          draft.data.idsBySubscriptionId[subscription.id] =
            draft.data.idsBySubscriptionId[subscription.id] || []
          if (!draft.data.idsBySubscriptionId[subscription.id].includes(id))
            draft.data.idsBySubscriptionId[subscription.id].push(id)

          draft.data.idsByType[type] = draft.data.idsByType[type] || []

          if (!draft.data.idsByType[type]!.includes(id))
            draft.data.idsByType[type]!.push(id)

          if (isItemSaved(item) || (item as any).saved) {
            delete (item as any).saved

            if (!draft.data.savedIds.includes(id)) {
              draft.data.savedIds.push(id)
              draft.data.updatedAt = now
            }

            if (!item.last_saved_at) item.last_saved_at = now
          }
          // } else if (draft.data.savedIds.includes(id)) {
          //   draft.data.savedIds = draft.data.savedIds.filter(
          //     savedId => savedId !== id,
          //   )
          //   draft.data.updatedAt = now
          // }

          if (type !== 'notification' && isItemRead(item)) {
            if (!draft.data.readIds.includes(id)) {
              draft.data.readIds.push(id)
              draft.data.updatedAt = now
            }
          }
        })
      })
    }),
  15: (state: RootState) =>
    immer(state, (draft) => {
      draft.columns = draft.columns || {}
      draft.columns.byId = draft.columns.byId || {}

      const columnIds = Object.keys(draft.columns.byId)
      columnIds.forEach((columnId) => {
        const column = draft.columns.byId![columnId]
        if (!column) return

        column.subscriptionIds = column.subscriptionIds || []
        column.subscriptionIdsHistory = column.subscriptionIdsHistory || []

        column.subscriptionIds.forEach((subscriptionId) => {
          if (!subscriptionId) return
          if (!column.subscriptionIdsHistory.includes(subscriptionId)) {
            column.subscriptionIdsHistory.push(subscriptionId)
          }
        })
      })
    }),
  16: (state: RootState) =>
    immer(state, (draft) => {
      draft.subscriptions = draft.subscriptions || {}
      draft.subscriptions.byId = draft.subscriptions.byId || {}

      const subscriptionIds = Object.keys(draft.subscriptions.byId)
      subscriptionIds.forEach((subscriptionId) => {
        const subscription = draft.subscriptions.byId[subscriptionId]
        if (!subscription) return

        subscription.data = subscription.data || {}
        subscription.data.lastFetchRequestAt = (subscription.data as any).lastFetchedAt
        subscription.data.lastFetchSuccessAt = (subscription.data as any).lastFetchedSuccessfullyAt
      })

      draft.github = draft.github || {}
      draft.github.installations = draft.github.installations || {}
      draft.github.installations.lastFetchRequestAt = (draft.github
        .installations as any).lastFetchedAt
      draft.github.installations.lastFetchSuccessAt = (draft.github
        .installations as any).lastFetchedSuccessfullyAt
    }),
  17: (state: RootState) =>
    immer(state, (draft) => {
      draft.columns = draft.columns || {}
      draft.columns.byId = draft.columns.byId || {}

      const columnIds = Object.keys(draft.columns.byId)
      columnIds.forEach((columnId) => {
        const column = draft.columns.byId![columnId] as NotificationColumn

        if (!(column && column.type === 'notifications')) return

        if (
          column &&
          column.filters &&
          column.filters.notifications &&
          column.filters.notifications.reasons &&
          typeof column.filters.notifications.reasons.review_requested ===
            'boolean'
        ) {
          column.filters.notifications.reasons.team_review_requested =
            column.filters.notifications.reasons.review_requested
        }
      })
    }),
}
